const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const MIGRATION_VERSION = 1;
const MIGRATION_NAME = 'initial_evidence_and_topology_schema';

function openDatabase(databasePath = ':memory:') {
  if (databasePath !== ':memory:') {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const db = new DatabaseSync(databasePath);
  db.exec('PRAGMA foreign_keys = ON;');
  return db;
}

function migrate(db) {
  const schemaPath = path.join(__dirname, 'schema.sql');
  db.exec(fs.readFileSync(schemaPath, 'utf8'));
  db.prepare(`
    INSERT OR IGNORE INTO schema_migrations (version, name, applied_at)
    VALUES (?, ?, ?)
  `).run(MIGRATION_VERSION, MIGRATION_NAME, new Date().toISOString());
}

function closeDatabase(db) {
  db.close();
}

function runtimeDatabasePath(electronApp = null) {
  if (process.env.AURA_ATLAS_DB_PATH) {
    return process.env.AURA_ATLAS_DB_PATH;
  }

  if (!electronApp?.getPath) {
    throw new Error('runtimeDatabasePath requires Electron app.getPath unless AURA_ATLAS_DB_PATH is set');
  }

  return path.join(electronApp.getPath('userData'), 'aura-atlas.sqlite');
}

function initializeRuntimeDatabase(electronApp = null) {
  const databasePath = runtimeDatabasePath(electronApp);
  const db = openDatabase(databasePath);
  migrate(db);
  return { db, databasePath };
}

module.exports = {
  openDatabase,
  migrate,
  closeDatabase,
  runtimeDatabasePath,
  initializeRuntimeDatabase
};
