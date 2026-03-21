const { Router } = require("express");
const {
  login,
  getByAddress,
  update,
} = require("../controllers/usuariosController");

const router = Router();

router.post("/login", login);
router.get("/:address", getByAddress);
router.put("/:address", update);

module.exports = router;
