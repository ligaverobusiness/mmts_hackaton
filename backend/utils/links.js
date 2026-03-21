const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../config/database");

// Genera un token único para acceso privado
function generarToken() {
  return uuidv4().replace(/-/g, "");
}

// Busca el recurso detrás de un token
function resolverToken(token) {
  const db = getDb();

  // Buscar en contratos
  const contrato = db
    .prepare(
      "SELECT contrato_address as address FROM contratos_metadata WHERE link_token = ?",
    )
    .get(token);
  if (contrato) return { tipo: "contract", address: contrato.address };

  // Buscar en apuestas
  const apuesta = db
    .prepare(
      "SELECT bet_address as address FROM apuestas_metadata WHERE link_token = ?",
    )
    .get(token);
  if (apuesta) return { tipo: "bet", address: apuesta.address };

  // Buscar en cívicos
  const civico = db
    .prepare(
      "SELECT propuesta_address as address FROM civico_metadata WHERE link_token = ?",
    )
    .get(token);
  if (civico) return { tipo: "civic", address: civico.address };

  return null;
}

module.exports = { generarToken, resolverToken };
