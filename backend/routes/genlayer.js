const { Router } = require("express");
const path = require("path");
const fs = require("fs");
const {
  submitResolutionToChain,
  submitBetResolutionToChain,
} = require("../services/genlayerRelay");

const router = Router();

// GET /api/genlayer/validator-code
router.get("/validator-code", (req, res) => {
  try {
    const filePath = path.join(
      __dirname,
      "../../contracts/genlayer/work_validator.py",
    );
    const code = fs.readFileSync(filePath, "utf8");
    res.json({ code });
  } catch (err) {
    res.status(500).json({ error: "No se pudo leer el contrato GenLayer" });
  }
});

// GET /api/genlayer/oracle-code
router.get("/oracle-code", (req, res) => {
  try {
    const filePath = path.join(
      __dirname,
      "../../contracts/genlayer/bet_oracle.py",
    );
    const code = fs.readFileSync(filePath, "utf8");
    res.json({ code });
  } catch (err) {
    res.status(500).json({ error: "No se pudo leer el oracle GenLayer" });
  }
});

// POST /api/genlayer/resolve — contratos de trabajo
router.post("/resolve", async (req, res) => {
  try {
    const { workAddress, approved, summary } = req.body;
    if (!workAddress)
      return res.status(400).json({ error: "workAddress requerido" });

    const txHash = await submitResolutionToChain(
      workAddress,
      Boolean(approved),
      summary || "",
    );
    res.json({ ok: true, txHash });
  } catch (err) {
    console.error("Error en relay work:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/genlayer/resolve-bet — apuestas
router.post("/resolve-bet", async (req, res) => {
  try {
    const { betAddress, sideAWins, isUndetermined, summary } = req.body;
    if (!betAddress)
      return res.status(400).json({ error: "betAddress requerido" });

    const txHash = await submitBetResolutionToChain(
      betAddress,
      Boolean(sideAWins),
      Boolean(isUndetermined),
      summary || "",
    );
    res.json({ ok: true, txHash });
  } catch (err) {
    console.error("Error en relay bet:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
