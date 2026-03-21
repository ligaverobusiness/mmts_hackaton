const { mockApuestas } = require("../utils/mockData");
const ApuestaMetadata = require("../models/ApuestaMetadata");
const { isDeployed } = require("../config/blockchain");

// GET /api/apuestas
const getAll = (req, res) => {
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
    // TODO Bloque 5: leer desde BetFactoryCOFI on-chain
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/apuestas/:address
const getById = (req, res) => {
  try {
    const { address } = req.params;
    const entry = mockApuestas.find(
      (a) => a.address.toLowerCase() === address.toLowerCase(),
    );
    if (!entry) return res.status(404).json({ error: "Apuesta no encontrada" });

    const meta = ApuestaMetadata.getByAddress(address) || {};
    res.json({ ...entry, ...meta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/apuestas/:address/odds
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

module.exports = { getAll, getById, getOdds };
