const { getDb } = require("../config/database");

class ContratoMetadata {
  static create(data) {
    const db = getDb();
    const now = Date.now();
    db.prepare(
      `
    INSERT OR REPLACE INTO contratos_metadata
      (contrato_address, categoria, descripcion_publica, condiciones_ia,
       umbral_validadores, es_privado, link_token, executor_address,
       genlayer_address, creado_en)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    ).run(
      data.address?.toLowerCase(),
      data.categoria || null,
      data.descripcion_publica || null,
      data.condiciones_ia || null,
      data.umbral_validadores || 3,
      data.es_privado ? 1 : 0,
      data.link_token || null,
      data.executor_address?.toLowerCase() || null,
      data.genlayer_address || null,
      now,
    );
  }

  static getByAddress(address) {
    const db = getDb();
    return db
      .prepare("SELECT * FROM contratos_metadata WHERE contrato_address = ?")
      .get(address?.toLowerCase());
  }

  static getAll() {
    const db = getDb();
    return db.prepare("SELECT * FROM contratos_metadata").all();
  }

  static getByToken(token) {
    const db = getDb();
    return db
      .prepare("SELECT * FROM contratos_metadata WHERE link_token = ?")
      .get(token);
  }
}

module.exports = ContratoMetadata;
