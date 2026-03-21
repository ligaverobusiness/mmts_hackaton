const { Router } = require("express");
const {
  login,
  getByAddress,
  update,
  getHistorial,
  getReputacion,
} = require("../controllers/usuariosController");

const router = Router();

router.post("/login", login);
router.get("/:address", getByAddress);
router.put("/:address", update);
router.get("/:address/historial", getHistorial);
router.get("/:address/reputacion", getReputacion);

module.exports = router;
