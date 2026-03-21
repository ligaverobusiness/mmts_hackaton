const { Router } = require("express");
const { resolverToken } = require("../utils/links");

const router = Router();

// GET /api/privado/:token
// Resuelve un token y devuelve el tipo y address del recurso
router.get("/:token", (req, res) => {
  const { token } = req.params;

  if (!token || token.length < 10) {
    return res.status(400).json({ error: "Token inválido" });
  }

  const resultado = resolverToken(token);

  if (!resultado) {
    return res
      .status(404)
      .json({ error: "Link privado no encontrado o expirado" });
  }

  res.json(resultado);
});

module.exports = router;
