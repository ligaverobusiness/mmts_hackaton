const { getDb } = require("../config/database");

class CivicoMetadata {
  static create(data) {
    const db = getDb();
    const now = Date.now();
    db.prepare(
      `
      INSERT OR REPLACE INTO civico_metadata
        (propuesta_address, entidad_nombre, categoria, descripcion,
         direccion_destino, es_privada, link_token, creado_en)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      data.address?.toLowerCase(),
      data.entidad_nombre || null,
      data.categoria || null,
      data.descripcion || null,
      data.direccion_destino?.toLowerCase() || null,
      data.es_privada ? 1 : 0,
      data.link_token || null,
      now,
    );
  }

  static getByAddress(address) {
    const db = getDb();
    return db
      .prepare("SELECT * FROM civico_metadata WHERE propuesta_address = ?")
      .get(address?.toLowerCase());
  }

  static getAll() {
    const db = getDb();
    return db.prepare("SELECT * FROM civico_metadata").all();
  }

  static getByToken(token) {
    const db = getDb();
    return db
      .prepare("SELECT * FROM civico_metadata WHERE link_token = ?")
      .get(token);
  }
}

module.exports = CivicoMetadata;
