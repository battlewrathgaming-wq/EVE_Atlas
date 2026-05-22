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
  applyCompatibilityMigrations(db);
  db.exec(fs.readFileSync(schemaPath, 'utf8'));
  applyCompatibilityMigrations(db);
  db.prepare(`
    INSERT OR IGNORE INTO schema_migrations (version, name, applied_at)
    VALUES (?, ?, ?)
  `).run(MIGRATION_VERSION, MIGRATION_NAME, new Date().toISOString());
}

function applyCompatibilityMigrations(db) {
  ensureColumn(db, 'api_request_logs', 'run_type', "TEXT NOT NULL DEFAULT 'collection'");
  rebuildApiRequestLogsIfNeeded(db);

  ensureColumn(db, 'sde_imports', 'latest_metadata_checksum', 'TEXT');
  ensureColumn(db, 'sde_imports', 'changes_metadata_checksum', 'TEXT');
  ensureColumn(db, 'sde_imports', 'constellations_count', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(db, 'sde_imports', 'regions_count', 'INTEGER NOT NULL DEFAULT 0');

  ensureColumn(db, 'solar_systems', 'constellation_id', 'INTEGER');
  ensureColumn(db, 'solar_systems', 'constellation_name', 'TEXT');
  ensureColumn(db, 'solar_systems', 'region_id', 'INTEGER');
  ensureColumn(db, 'solar_systems', 'region_name', 'TEXT');
  ensureColumn(db, 'solar_systems', 'security_status', 'REAL');
}

function ensureColumn(db, tableName, columnName, definition) {
  if (!tableExists(db, tableName) || columnExists(db, tableName, columnName)) {
    return;
  }
  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`);
}

function tableExists(db, tableName) {
  const row = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name = ?
  `).get(tableName);
  return Boolean(row);
}

function columnExists(db, tableName, columnName) {
  return db.prepare(`PRAGMA table_info(${tableName})`)
    .all()
    .some((column) => column.name === columnName);
}

function rebuildApiRequestLogsIfNeeded(db) {
  if (!tableExists(db, 'api_request_logs')) {
    return;
  }

  const foreignKeys = db.prepare('PRAGMA foreign_key_list(api_request_logs)').all();
  const referencesFetchRuns = foreignKeys.some((row) => row.table === 'fetch_runs');
  if (!referencesFetchRuns) {
    return;
  }

  const columns = db.prepare('PRAGMA table_info(api_request_logs)').all().map((column) => column.name);
  const hasRunType = columns.includes('run_type');
  const selectRunType = hasRunType
    ? "COALESCE(run_type, CASE WHEN run_id IS NULL THEN 'unscoped' ELSE 'collection' END)"
    : "CASE WHEN run_id IS NULL THEN 'unscoped' ELSE 'collection' END";

  db.exec('PRAGMA foreign_keys = OFF;');
  try {
    db.exec(`
      CREATE TABLE api_request_logs_rebuilt (
        request_id TEXT PRIMARY KEY,
        run_id TEXT,
        run_type TEXT NOT NULL DEFAULT 'collection' CHECK (run_type IN ('collection', 'metadata', 'unscoped')),
        provider TEXT NOT NULL CHECK (provider IN ('zkill', 'esi')),
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        status_code INTEGER,
        duration_ms INTEGER,
        cache_status TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0,
        rate_limited INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        requested_at TEXT NOT NULL
      );

      INSERT INTO api_request_logs_rebuilt (
        request_id, run_id, run_type, provider, endpoint, method, status_code,
        duration_ms, cache_status, retry_count, rate_limited, error_message, requested_at
      )
      SELECT
        request_id,
        run_id,
        ${selectRunType},
        provider,
        endpoint,
        method,
        status_code,
        duration_ms,
        cache_status,
        retry_count,
        rate_limited,
        error_message,
        requested_at
      FROM api_request_logs;

      DROP TABLE api_request_logs;
      ALTER TABLE api_request_logs_rebuilt RENAME TO api_request_logs;
    `);
  } finally {
    db.exec('PRAGMA foreign_keys = ON;');
  }
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
  initializeRuntimeDatabase,
  applyCompatibilityMigrations
};
