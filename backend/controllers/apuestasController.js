const { mockApuestas } = require("../utils/mockData");
const ApuestaMetadata = require("../models/ApuestaMetadata");
const {
  isDeployed,
  getProvider,
  CONTRACT_ADDRESSES,
} = require("../config/blockchain");

const BET_FACTORY_ABI = ["function getAllBets() view returns (address[])"];
const BET_ABI = [
  "function getInfo() view returns (address,string,string,string,string,uint256,uint256,bool,bool,uint256,uint256,uint256,string)",
  "function status() view returns (uint8)",
];

const getAll = async (req, res) => {
  try {
    if (!isDeployed("BetFactory")) {
      const metaAll = ApuestaMetadata.getAll();
      const metaMap = {};
      metaAll.forEach((m) => {
        metaMap[m.bet_address] = m;
      });
      const enriched = mockApuestas.map((a) => {
        const meta = metaMap[a.address] || {};
        return {
          ...a,
          categoria: meta.categoria || a.category,
          es_privada: meta.es_privada === 1 ? true : a.isPrivate,
          link_token: meta.link_token || null,
        };
      });
      return res.json(enriched);
    }

    const { ethers } = require("ethers");
    const provider = getProvider();
    const factory = new ethers.Contract(
      CONTRACT_ADDRESSES.BetFactory,
      BET_FACTORY_ABI,
      provider,
    );
    const addresses = await factory.getAllBets();

    const bets = await Promise.all(
      addresses.map(async (addr) => {
        try {
          const bet = new ethers.Contract(addr, BET_ABI, provider);
          const info = await bet.getInfo();
          const meta = ApuestaMetadata.getByAddress(addr) || {};
          const totalA = Number(ethers.formatUnits(info[9], 6));
          const totalB = Number(ethers.formatUnits(info[10], 6));
          return {
            address: addr,
            type: "bet",
            no: meta.no || addr.slice(0, 6).toUpperCase(),
            title: info[1],
            resolutionCriteria: info[2],
            sideAName: info[3],
            sideBName: info[4],
            creationDate: Number(info[5]) * 1000,
            expiresAt: Number(info[6]) * 1000,
            isResolved: info[7],
            isSideAWinner: info[8],
            totalSideA: totalA,
            totalSideB: totalB,
            totalPool: totalA + totalB,
            amount: totalA + totalB,
            winnerValue: info[12],
            status: mapBetStatus(Number(await bet.status())),
            isPrivate: meta.es_privada === 1,
            categoria: meta.categoria || "Sin categoría",
            category: meta.categoria || "Sin categoría",
            sides: [
              {
                label: info[3],
                pool: totalA,
                participants: 0,
                color: "#1a5c34",
              },
              {
                label: info[4],
                pool: totalB,
                participants: 0,
                color: "#8b1a2a",
              },
            ],
          };
        } catch (_) {
          return null;
        }
      }),
    );
    res.json(bets.filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const { address } = req.params;
    if (!isDeployed("BetFactory")) {
      const entry = mockApuestas.find(
        (a) => a.address.toLowerCase() === address.toLowerCase(),
      );
      if (!entry)
        return res.status(404).json({ error: "Apuesta no encontrada" });
      const meta = ApuestaMetadata.getByAddress(address) || {};
      return res.json({ ...entry, ...meta });
    }
    const { ethers } = require("ethers");
    const provider = getProvider();
    const bet = new ethers.Contract(address, BET_ABI, provider);
    const info = await bet.getInfo();
    const meta = ApuestaMetadata.getByAddress(address) || {};
    const totalA = Number(ethers.formatUnits(info[9], 6));
    const totalB = Number(ethers.formatUnits(info[10], 6));
    res.json({
      address,
      type: "bet",
      title: info[1],
      resolutionCriteria: info[2],
      sideAName: info[3],
      sideBName: info[4],
      creationDate: Number(info[5]) * 1000,
      expiresAt: Number(info[6]) * 1000,
      isResolved: info[7],
      isSideAWinner: info[8],
      totalSideA: totalA,
      totalSideB: totalB,
      totalPool: totalA + totalB,
      amount: totalA + totalB,
      winnerValue: info[12],
      status: mapBetStatus(Number(await bet.status())),
      isPrivate: meta.es_privada === 1,
      categoria: meta.categoria || "Sin categoría",
      category: meta.categoria || "Sin categoría",
      creator: info[0],
      sides: [
        { label: info[3], pool: totalA, participants: 0, color: "#1a5c34" },
        { label: info[4], pool: totalB, participants: 0, color: "#8b1a2a" },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = (req, res) => {
  try {
    const {
      address,
      categoria,
      tipo_estructura,
      nombres_lados,
      es_privada,
      link_token,
    } = req.body;
    if (!address) return res.status(400).json({ error: "address requerido" });
    ApuestaMetadata.create({
      address,
      categoria,
      tipo_estructura,
      nombres_lados,
      es_privada,
      link_token,
    });
    res.status(201).json({ ok: true, address });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getOdds = (req, res) => {
  try {
    const { address } = req.params;
    const entry = mockApuestas.find(
      (a) => a.address.toLowerCase() === address.toLowerCase(),
    );
    if (!entry) return res.status(404).json({ error: "Apuesta no encontrada" });
    const total = entry.totalPool;
    const odds = entry.sides.map((s) => ({
      label: s.label,
      pool: s.pool,
      pct: total > 0 ? Math.round((s.pool / total) * 100) : 0,
      multiplier:
        total > 0 && s.pool > 0 ? parseFloat((total / s.pool).toFixed(2)) : 1,
    }));
    res.json({ total, odds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

function mapBetStatus(code) {
  const map = { 0: "open", 1: "resolving", 2: "closed", 3: "cancelled" };
  return map[code] || "open";
}

module.exports = { getAll, getById, create, getOdds };
