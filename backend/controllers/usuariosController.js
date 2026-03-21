const Usuario = require("../models/Usuario");

// POST /api/usuarios/login
const login = (req, res) => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: "address es requerido" });
  }
  const user = Usuario.getOrCreate(address);
  // Recalcular reputación al hacer login
  Usuario.calcularReputacion(address);
  const updated = Usuario.getByAddress(address);
  res.json(updated);
};

// GET /api/usuarios/:address
const getByAddress = (req, res) => {
  const { address } = req.params;
  const user = Usuario.getByAddress(address);
  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }
  res.json(user);
};

// PUT /api/usuarios/:address
const update = (req, res) => {
  const { address } = req.params;
  const datos = req.body;

  const existing = Usuario.getByAddress(address);
  if (!existing) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  const updated = Usuario.update(address, datos);
  res.json(updated);
};

module.exports = { login, getByAddress, update };
