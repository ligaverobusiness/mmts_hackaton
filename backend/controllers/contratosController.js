const { mockContratos } = require("../utils/mockData");
const ContratoMetadata = require("../models/ContratoMetadata");
const { isDeployed } = require("../config/blockchain");

// GET /api/contratos
// Devuelve mock hasta que los contratos estén deployados (Bloque 3)
const getAll = (req, res) => {
  try {
    if (!isDeployed("WorkFactory")) {
      // Bloque 2: devolver mock enriched con metadata de DB si existe
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
    // TODO Bloque 3: leer desde WorkFactoryCOFI on-chain
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/contratos/:address
const getById = (req, res) => {
  try {
    const { address } = req.params;
    const entry = mockContratos.find(
      (c) => c.address.toLowerCase() === address.toLowerCase(),
    );
    if (!entry)
      return res.status(404).json({ error: "Contrato no encontrado" });

    const meta = ContratoMetadata.getByAddress(address) || {};
    res.json({ ...entry, ...meta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/contratos/:address/condiciones
// Solo el creador puede ver las condiciones privadas para la IA
const getCondiciones = (req, res) => {
  try {
    const { address } = req.params;
    const { requester } = req.query;

    const entry = mockContratos.find(
      (c) => c.address.toLowerCase() === address.toLowerCase(),
    );
    if (!entry)
      return res.status(404).json({ error: "Contrato no encontrado" });

    // En Bloque 2 con mock, permitimos ver si el requester coincide con creator
    if (!requester || requester.toLowerCase() !== entry.creator.toLowerCase()) {
      return res
        .status(403)
        .json({ error: "Solo el creador puede ver las condiciones" });
    }

    const meta = ContratoMetadata.getByAddress(address) || {};
    res.json({ condiciones_ia: meta.condiciones_ia || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, getById, getCondiciones };
