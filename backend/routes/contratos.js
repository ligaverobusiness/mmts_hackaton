const { Router } = require("express");
const {
  getAll,
  getById,
  getCondiciones,
} = require("../controllers/contratosController");

const router = Router();

router.get("/", getAll);
router.get("/:address", getById);
router.get("/:address/condiciones", getCondiciones);

module.exports = router;
