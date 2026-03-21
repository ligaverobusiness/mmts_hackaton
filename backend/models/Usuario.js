const { getDb } = require("../config/database");

class Usuario {
  // Obtiene un usuario o lo crea si no existe
  static getOrCreate(address) {
    const db = getDb();
    const addr = address.toLowerCase();
    const now = Date.now();

    let user = db.prepare("SELECT * FROM usuarios WHERE address = ?").get(addr);

    if (!user) {
      db.prepare(
        `
        INSERT INTO usuarios (address, creado_en, ultimo_acceso)
        VALUES (?, ?, ?)
      `,
      ).run(addr, now, now);
      user = db.prepare("SELECT * FROM usuarios WHERE address = ?").get(addr);
    } else {
      db.prepare("UPDATE usuarios SET ultimo_acceso = ? WHERE address = ?").run(
        now,
        addr,
      );
      user.ultimo_acceso = now;
    }

    return user;
  }

  static getByAddress(address) {
    const db = getDb();
    return db
      .prepare("SELECT * FROM usuarios WHERE address = ?")
      .get(address.toLowerCase());
  }

  static update(address, datos) {
    const db = getDb();
    const addr = address.toLowerCase();

    const allowed = ["alias", "bio", "avatar_url"];
    const fields = Object.keys(datos).filter((k) => allowed.includes(k));

    if (fields.length === 0) return Usuario.getByAddress(addr);

    const set = fields.map((f) => `${f} = ?`).join(", ");
    const values = fields.map((f) => datos[f]);

    db.prepare(`UPDATE usuarios SET ${set} WHERE address = ?`).run(
      ...values,
      addr,
    );

    return Usuario.getByAddress(addr);
  }

  static incrementar(address, campo) {
    const db = getDb();
    const allowed = [
      "contratos_completados",
      "contratos_creados",
      "apuestas_ganadas",
    ];
    if (!allowed.includes(campo)) return;
    db.prepare(
      `UPDATE usuarios SET ${campo} = ${campo} + 1 WHERE address = ?`,
    ).run(address.toLowerCase());
  }

  static calcularReputacion(address) {
    const user = Usuario.getByAddress(address);
    if (!user) return 0;
    const score =
      user.contratos_completados * 10 +
      user.contratos_creados * 3 +
      user.apuestas_ganadas * 2;
    const db = getDb();
    db.prepare(
      "UPDATE usuarios SET reputacion_score = ? WHERE address = ?",
    ).run(score, address.toLowerCase());
    return score;
  }
}

module.exports = Usuario;
