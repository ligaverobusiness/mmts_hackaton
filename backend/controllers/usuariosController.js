const Usuario = require("../models/Usuario");
const {
  calcularScore,
  getInsignias,
  getNivel,
} = require("../utils/reputacion");
const {
  isDeployed,
  getProvider,
  CONTRACT_ADDRESSES,
} = require("../config/blockchain");

// POST /api/usuarios/login
const login = (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "address requerido" });
  const user = Usuario.getOrCreate(address);
  const score = calcularScore(user);
  Usuario.update(address, { reputacion_score: score });
  const updated = Usuario.getByAddress(address);
  res.json({
    ...updated,
    insignias: getInsignias(updated),
    nivel: getNivel(updated.reputacion_score),
  });
};

// GET /api/usuarios/:address
const getByAddress = (req, res) => {
  const { address } = req.params;
  const user = Usuario.getByAddress(address);
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  res.json({
    ...user,
    insignias: getInsignias(user),
    nivel: getNivel(user.reputacion_score),
  });
};

// PUT /api/usuarios/:address
const update = (req, res) => {
  const { address } = req.params;
  const existing = Usuario.getByAddress(address);
  if (!existing)
    return res.status(404).json({ error: "Usuario no encontrado" });
  const updated = Usuario.update(address, req.body);
  res.json({
    ...updated,
    insignias: getInsignias(updated),
    nivel: getNivel(updated.reputacion_score),
  });
};

// GET /api/usuarios/:address/historial
const getHistorial = async (req, res) => {
  try {
    const { address } = req.params;
    const { ContratoMetadata } = require("../models/ContratoMetadata");
    const { ApuestaMetadata } = require("../models/ApuestaMetadata");
    const { CivicoMetadata } = require("../models/CivicoMetadata");

    // Por ahora devuelve metadata guardada en DB
    // En producción combinamos con lecturas on-chain
    const contratos = ContratoMetadata
      ? ContratoMetadata.getAll().filter(
          (c) => c.contrato_address && c.es_privado !== undefined,
        )
      : [];
    const apuestas = ApuestaMetadata ? ApuestaMetadata.getAll() : [];
    const civicos = CivicoMetadata ? CivicoMetadata.getAll() : [];

    res.json({ contratos, apuestas, civicos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/usuarios/:address/reputacion
const getReputacion = (req, res) => {
  const { address } = req.params;
  const user = Usuario.getByAddress(address);
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  const score = calcularScore(user);
  res.json({
    score,
    nivel: getNivel(score),
    insignias: getInsignias(user),
    desglose: {
      por_contratos_completados: user.contratos_completados * 10,
      por_contratos_creados: user.contratos_creados * 3,
      por_apuestas_ganadas: user.apuestas_ganadas * 2,
    },
  });
};

module.exports = { login, getByAddress, update, getHistorial, getReputacion };
