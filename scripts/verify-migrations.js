const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');

function main() {
  const db = openDatabase(':memory:');
  createLegacySchema(db);
  seedLegacyRows(db);

  migrate(db);
  migrate(db);

  assertColumn(db, 'api_request_logs', 'run_type');
  assertColumn(db, 'sde_imports', 'latest_metadata_checksum');
  assertColumn(db, 'sde_imports', 'changes_metadata_checksum');
  assertColumn(db, 'sde_imports', 'constellations_count');
  assertColumn(db, 'sde_imports', 'regions_count');
  assertColumn(db, 'solar_systems', 'constellation_id');
  assertColumn(db, 'solar_systems', 'constellation_name');
  assertColumn(db, 'solar_systems', 'region_id');
  assertColumn(db, 'solar_systems', 'region_name');
  assertColumn(db, 'solar_systems', 'security_status');
  assertColumn(db, 'discovered_killmail_refs', 'preview_json');
  assertColumn(db, 'assessment_artifacts', 'citation_status');
  assertColumn(db, 'assessment_artifacts', 'citation_details_json');
  assertTable(db, 'metadata_runs');
  assertTable(db, 'regions');
  assertTable(db, 'constellations');

  const legacyLog = db.prepare('SELECT run_type FROM api_request_logs WHERE request_id = ?').get('legacy_request_1');
  assert(legacyLog.run_type === 'collection', 'legacy API logs with run IDs should default to collection run_type');
  assert(!apiLogsReferencesFetchRuns(db), 'api_request_logs should not retain legacy fetch_runs foreign key');

  const repository = new EvidenceRepository(db);
  const metadataRun = repository.createMetadataRun({
    runId: 'metadata_legacy_migration_check',
    trigger: 'fixture_test',
    runType: 'report_operator_candidates',
    targetType: 'system',
    targetId: 'Atlas Prime'
  });
  repository.insertApiRequestLog({
    run_id: metadataRun.run_id,
    run_type: 'metadata',
    provider: 'esi',
    endpoint: 'https://esi.evetech.net/latest/universe/names/?datasource=tranquility',
    method: 'POST',
    status_code: 200,
    duration_ms: 1,
    cache_status: 'fixture',
    requested_at: new Date().toISOString()
  });
  repository.finalizeMetadataRun(metadataRun.run_id, {
    candidates_considered: 1,
    ids_discovered: 1,
    requested_from_esi: 1,
    resolved: 1,
    entities_upserted: 1,
    activity_events_patched: 1,
    api_calls_esi: 1
  });

  const metadataLog = db.prepare('SELECT run_type FROM api_request_logs WHERE run_id = ?').get(metadataRun.run_id);
  assert(metadataLog.run_type === 'metadata', 'metadata API logs should persist metadata run_type after migration');

  closeDatabase(db);
  console.log('database migrations verified');
}

function createLegacySchema(db) {
  db.exec(`
    CREATE TABLE schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE fetch_runs (
      run_id TEXT PRIMARY KEY,
      trigger TEXT NOT NULL,
      watch_type TEXT NOT NULL,
      watch_id TEXT,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      status TEXT NOT NULL,
      discovered_refs INTEGER NOT NULL DEFAULT 0,
      already_cached INTEGER NOT NULL DEFAULT 0,
      expanded_new INTEGER NOT NULL DEFAULT 0,
      failed_expansions INTEGER NOT NULL DEFAULT 0,
      activity_events_written INTEGER NOT NULL DEFAULT 0,
      api_calls_zkill INTEGER NOT NULL DEFAULT 0,
      api_calls_esi INTEGER NOT NULL DEFAULT 0,
      duration_ms INTEGER,
      error_summary TEXT
    );

    CREATE TABLE api_request_logs (
      request_id TEXT PRIMARY KEY,
      run_id TEXT,
      provider TEXT NOT NULL CHECK (provider IN ('zkill', 'esi')),
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      status_code INTEGER,
      duration_ms INTEGER,
      cache_status TEXT,
      retry_count INTEGER NOT NULL DEFAULT 0,
      rate_limited INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      requested_at TEXT NOT NULL,
      FOREIGN KEY (run_id) REFERENCES fetch_runs(run_id)
    );

    CREATE TABLE sde_imports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      build_number TEXT,
      variant TEXT NOT NULL,
      source_url TEXT,
      etag TEXT,
      last_modified TEXT,
      imported_at TEXT NOT NULL,
      file_checksum TEXT,
      systems_count INTEGER NOT NULL DEFAULT 0,
      adjacency_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE solar_systems (
      solar_system_id INTEGER PRIMARY KEY,
      solar_system_name TEXT NOT NULL
    );
  `);
}

function seedLegacyRows(db) {
  db.prepare(`
    INSERT INTO fetch_runs (
      run_id, trigger, watch_type, watch_id, started_at, status
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run('legacy_run_1', 'fixture_test', 'system_radius', 'legacy-watch', '2026-05-01T00:00:00Z', 'success');
  db.prepare(`
    INSERT INTO api_request_logs (
      request_id, run_id, provider, endpoint, method, status_code, duration_ms,
      cache_status, retry_count, rate_limited, error_message, requested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'legacy_request_1',
    'legacy_run_1',
    'zkill',
    'https://zkillboard.com/api/systemID/30000001/pastSeconds/86400/',
    'GET',
    200,
    1,
    'miss',
    0,
    0,
    null,
    '2026-05-01T00:00:01Z'
  );
}

function assertTable(db, tableName) {
  const row = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name = ?
  `).get(tableName);
  assert(Boolean(row), `expected table ${tableName} to exist`);
}

function assertColumn(db, tableName, columnName) {
  const found = db.prepare(`PRAGMA table_info(${tableName})`)
    .all()
    .some((column) => column.name === columnName);
  assert(found, `expected ${tableName}.${columnName} to exist`);
}

function apiLogsReferencesFetchRuns(db) {
  return db.prepare('PRAGMA foreign_key_list(api_request_logs)')
    .all()
    .some((row) => row.table === 'fetch_runs');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main();
