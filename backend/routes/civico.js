const { Router } = require("express");
const { getAll, getById, create } = require("../controllers/civicoController");

const router = Router();

router.get("/", getAll);
router.get("/:address", getById);
router.post("/", create);

module.exports = router;
