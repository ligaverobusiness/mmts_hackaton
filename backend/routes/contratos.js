const { Router } = require("express");
const {
  getAll,
  getById,
  create,
  getCondiciones,
} = require("../controllers/contratosController");

const router = Router();

router.get("/", getAll);
router.get("/:address", getById);
router.post("/", create);
router.get("/:address/condiciones", getCondiciones);

module.exports = router;
