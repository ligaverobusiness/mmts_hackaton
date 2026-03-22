const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "tablero.db");

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initTables();
    runMigrations();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      address               TEXT PRIMARY KEY,
      alias                 TEXT,
      bio                   TEXT,
      avatar_url            TEXT,
      reputacion_score      INTEGER DEFAULT 0,
      contratos_completados INTEGER DEFAULT 0,
      contratos_creados     INTEGER DEFAULT 0,
      apuestas_ganadas      INTEGER DEFAULT 0,
      creado_en             INTEGER NOT NULL,
      ultimo_acceso         INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contratos_metadata (
      contrato_address    TEXT PRIMARY KEY,
      categoria           TEXT,
      descripcion_publica TEXT,
      condiciones_ia      TEXT,
      umbral_validadores  INTEGER DEFAULT 3,
      es_privado          INTEGER DEFAULT 0,
      link_token          TEXT UNIQUE,
      executor_address    TEXT,
      creado_en           INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS apuestas_metadata (
      bet_address     TEXT PRIMARY KEY,
      categoria       TEXT,
      tipo_estructura TEXT DEFAULT 'binary',
      nombres_lados   TEXT,
      es_privada      INTEGER DEFAULT 0,
      link_token      TEXT UNIQUE,
      creado_en       INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS civico_metadata (
      propuesta_address TEXT PRIMARY KEY,
      entidad_nombre    TEXT,
      categoria         TEXT,
      descripcion       TEXT,
      direccion_destino TEXT,
      es_privada        INTEGER DEFAULT 0,
      link_token        TEXT UNIQUE,
      creado_en         INTEGER NOT NULL
    );
  `);
}

function runMigrations() {
  const migrations = [
    `ALTER TABLE contratos_metadata ADD COLUMN genlayer_address TEXT`,
  ];

  for (const sql of migrations) {
    try {
      db.exec(sql);
    } catch (_) {
      // Columna ya existe — ignorar
    }
  }
}

module.exports = { getDb };
