const { mockContratos } = require("../utils/mockData");
const CivicoMetadata = require("../models/CivicoMetadata");
const {
  isDeployed,
  getProvider,
  CONTRACT_ADDRESSES,
} = require("../config/blockchain");

// ABI mínimo
const CIVICO_FACTORY_ABI = [
  "function getAllProposals() view returns (address[])",
  "function getVotingProposals() view returns (address[])",
];
const CIVICO_ABI = [
  "function getInfo() view returns (address,string,string,address,uint256,uint256,uint256,bool,uint8,uint256,uint256)",
  "function vote(bool inFavor)",
  "function execute()",
  "function cancel()",
  "function getVoteOf(address voter) view returns (bool voted, bool inFavor)",
];

// GET /api/civico
const getAll = async (req, res) => {
  try {
    if (!isDeployed("CivicoFactory")) {
      // Mock — filtra los cívicos del mockData
      const metaAll = CivicoMetadata.getAll();
      const metaMap = {};
      metaAll.forEach((m) => {
        metaMap[m.propuesta_address] = m;
      });

      const civicos = mockContratos
        .filter((c) => c.type === "civic")
        .map((c) => {
          const meta = metaMap[c.address] || {};
          return {
            ...c,
            categoria: meta.categoria || c.category,
            es_privada: meta.es_privada === 1 ? true : c.isPrivate,
            link_token: meta.link_token || null,
          };
        });
      return res.json(civicos);
    }

    // On-chain
    const { ethers } = require("ethers");
    const provider = getProvider();
    const factory = new ethers.Contract(
      CONTRACT_ADDRESSES.CivicoFactory,
      CIVICO_FACTORY_ABI,
      provider,
    );
    const addresses = await factory.getAllProposals();

    const proposals = await Promise.all(
      addresses.map(async (addr) => {
        try {
          const civico = new ethers.Contract(addr, CIVICO_ABI, provider);
          const info = await civico.getInfo();
          const meta = CivicoMetadata.getByAddress(addr) || {};

          return {
            address: addr,
            no: meta.no || addr.slice(0, 6).toUpperCase(),
            type: "civic",
            title: info[1],
            description: info[2],
            destinationAddress: info[3],
            creationDate: Number(info[4]) * 1000,
            expiresAt: Number(info[5]) * 1000,
            totalFunds: Number(ethers.formatUnits(info[6], 6)),
            amount: Number(ethers.formatUnits(info[6], 6)),
            isPrivate: info[7],
            status: mapStatus(Number(info[8])),
            votesYes: Number(info[9]),
            votesNo: Number(info[10]),
            creator: info[0],
            categoria: meta.categoria || "Sin categoría",
            category: meta.categoria || "Sin categoría",
            participants: Number(info[9]) + Number(info[10]),
          };
        } catch (_) {
          return null;
        }
      }),
    );

    res.json(proposals.filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/civico/:address
const getById = async (req, res) => {
  try {
    const { address } = req.params;

    if (!isDeployed("CivicoFactory")) {
      const entry = mockContratos.find(
        (c) =>
          c.address.toLowerCase() === address.toLowerCase() &&
          c.type === "civic",
      );
      if (!entry)
        return res.status(404).json({ error: "Propuesta no encontrada" });
      const meta = CivicoMetadata.getByAddress(address) || {};
      return res.json({ ...entry, ...meta });
    }

    const { ethers } = require("ethers");
    const provider = getProvider();
    const civico = new ethers.Contract(address, CIVICO_ABI, provider);
    const info = await civico.getInfo();
    const meta = CivicoMetadata.getByAddress(address) || {};

    res.json({
      address,
      type: "civic",
      title: info[1],
      description: info[2],
      destinationAddress: info[3],
      creationDate: Number(info[4]) * 1000,
      expiresAt: Number(info[5]) * 1000,
      totalFunds: Number(ethers.formatUnits(info[6], 6)),
      amount: Number(ethers.formatUnits(info[6], 6)),
      isPrivate: info[7],
      status: mapStatus(Number(info[8])),
      votesYes: Number(info[9]),
      votesNo: Number(info[10]),
      creator: info[0],
      categoria: meta.categoria || "Sin categoría",
      category: meta.categoria || "Sin categoría",
      participants: Number(info[9]) + Number(info[10]),
      entidad_nombre: meta.entidad_nombre || null,
      link_token: meta.link_token || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/civico
const create = (req, res) => {
  try {
    const {
      address,
      entidad_nombre,
      categoria,
      descripcion,
      direccion_destino,
      es_privada,
      link_token,
    } = req.body;

    if (!address) return res.status(400).json({ error: "address requerido" });

    CivicoMetadata.create({
      address,
      entidad_nombre,
      categoria,
      descripcion,
      direccion_destino,
      es_privada,
      link_token,
    });

    res.status(201).json({ ok: true, address });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

function mapStatus(code) {
  const map = { 0: "open", 1: "closed", 2: "cancelled", 3: "cancelled" };
  return map[code] || "open";
}

module.exports = { getAll, getById, create };
