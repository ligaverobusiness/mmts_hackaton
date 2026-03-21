const { mockContratos } = require("../utils/mockData");
const ContratoMetadata = require("../models/ContratoMetadata");
const {
  isDeployed,
  getProvider,
  CONTRACT_ADDRESSES,
} = require("../config/blockchain");

// ABI mínimo de WorkFactoryCOFI para leer datos
const WORK_FACTORY_ABI = [
  "function getAllWorks() view returns (address[])",
  "function getOpenWorks() view returns (address[])",
];
const WORK_ABI = [
  "function getInfo() view returns (address,string,string,string,uint256,uint256,uint256,uint8,bool,uint8,address,bool,string)",
];

// GET /api/contratos
const getAll = async (req, res) => {
  try {
    if (!isDeployed("WorkFactory")) {
      // Mock enriquecido con metadata de DB
      const metaAll = ContratoMetadata.getAll();
      const metaMap = {};
      metaAll.forEach((m) => {
        metaMap[m.contrato_address] = m;
      });

      const enriched = mockContratos.map((c) => {
        const meta = metaMap[c.address] || {};
        return {
          ...c,
          categoria: meta.categoria || c.category,
          descripcion_publica: meta.descripcion_publica || c.description,
          es_privado: meta.es_privado === 1 ? true : c.isPrivate,
          link_token: meta.link_token || null,
        };
      });
      return res.json(enriched);
    }

    // On-chain (Bloque 3 con contratos deployados)
    const { ethers } = require("ethers");
    const provider = getProvider();
    const factory = new ethers.Contract(
      CONTRACT_ADDRESSES.WorkFactory,
      WORK_FACTORY_ABI,
      provider,
    );
    const addresses = await factory.getAllWorks();

    const works = await Promise.all(
      addresses.map(async (addr) => {
        try {
          const work = new ethers.Contract(addr, WORK_ABI, provider);
          const info = await work.getInfo();
          const meta = ContratoMetadata.getByAddress(addr) || {};

          return {
            address: addr,
            no: meta.no || addr.slice(0, 6).toUpperCase(),
            type: "contract",
            title: info[1],
            description: info[2],
            expiresAt: Number(info[5]) * 1000,
            bounty: Number(ethers.formatUnits(info[6], 6)), // USDC 6 decimals
            status: mapStatus(Number(info[9])),
            isPrivate: info[8],
            participants: info[10] !== ethers.ZeroAddress ? 1 : 0,
            creator: info[0],
            category: meta.categoria || "Sin categoría",
            amount: Number(ethers.formatUnits(info[6], 6)),
          };
        } catch (_) {
          return null;
        }
      }),
    );

    res.json(works.filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/contratos/:address
const getById = async (req, res) => {
  try {
    const { address } = req.params;

    if (!isDeployed("WorkFactory")) {
      const entry = mockContratos.find(
        (c) => c.address.toLowerCase() === address.toLowerCase(),
      );
      if (!entry)
        return res.status(404).json({ error: "Contrato no encontrado" });
      const meta = ContratoMetadata.getByAddress(address) || {};
      return res.json({ ...entry, ...meta });
    }

    const { ethers } = require("ethers");
    const provider = getProvider();
    const work = new ethers.Contract(address, WORK_ABI, provider);
    const info = await work.getInfo();
    const meta = ContratoMetadata.getByAddress(address) || {};

    res.json({
      address,
      type: "contract",
      title: info[1],
      description: meta.descripcion_publica || info[2],
      descripcion_publica: meta.descripcion_publica || info[2],
      descriptionPublic: meta.descripcion_publica || info[2],
      deliveryUrl: info[3],
      creationDate: Number(info[4]) * 1000,
      expiresAt: Number(info[5]) * 1000,
      bounty: Number(ethers.formatUnits(info[6], 6)),
      amount: Number(ethers.formatUnits(info[6], 6)),
      requiredApprovals: Number(info[7]),
      umbral_validadores: meta.umbral_validadores || Number(info[7]),
      isPrivate: info[8],
      es_privado: info[8],
      status: mapStatus(Number(info[9])),
      executor: info[10],
      isApproved: info[11],
      validationSummary: info[12],
      categoria: meta.categoria || "Sin categoría",
      category: meta.categoria || "Sin categoría",
      creator: info[0],
      condiciones_ia: undefined,
      link_token: meta.link_token || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/contratos
// Guarda metadata — la transacción on-chain la hace el frontend directamente
const create = (req, res) => {
  try {
    const {
      address,
      categoria,
      descripcion_publica,
      condiciones_ia,
      umbral_validadores,
      es_privado,
      link_token,
      executor_address,
    } = req.body;

    if (!address) return res.status(400).json({ error: "address requerido" });

    ContratoMetadata.create({
      address,
      categoria,
      descripcion_publica,
      condiciones_ia,
      umbral_validadores,
      es_privado,
      link_token,
      executor_address,
    });

    res.status(201).json({ ok: true, address });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/contratos/:address/condiciones
// Solo el creador puede ver las condiciones IA
const getCondiciones = async (req, res) => {
  try {
    const { address } = req.params;
    const { requester } = req.query;

    if (!requester) {
      return res.status(400).json({ error: "requester requerido" });
    }

    let creator = null;

    if (isDeployed("WorkFactory")) {
      const { ethers } = require("ethers");
      const provider = getProvider();
      const work = new ethers.Contract(address, WORK_ABI, provider);
      const info = await work.getInfo();
      creator = info[0].toLowerCase();
    } else {
      const entry = mockContratos.find(
        (c) => c.address.toLowerCase() === address.toLowerCase(),
      );
      creator = entry?.creator?.toLowerCase();
    }

    if (!creator || requester.toLowerCase() !== creator) {
      return res
        .status(403)
        .json({ error: "Solo el creador puede ver las condiciones" });
    }

    const meta = ContratoMetadata.getByAddress(address);
    res.json({ condiciones_ia: meta?.condiciones_ia || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper
function mapStatus(statusCode) {
  const map = {
    0: "open",
    1: "pending", // SUBMITTED
    2: "resolving", // VALIDATING
    3: "closed", // APPROVED
    4: "cancelled", // REJECTED
    5: "cancelled", // CANCELLED
  };
  return map[statusCode] || "open";
}

module.exports = { getAll, getById, create, getCondiciones };
