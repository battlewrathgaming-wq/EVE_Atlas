const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const previous = captureEnv();
  const root = path.join(projectRoot(), '.tmp', 'storage-authority-preflight-fixture');
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(root, { recursive: true });

  try {
    const configured = await verifyConfiguredPath(root);
    const fallback = await verifyFallbackPath(root);
    const missing = await verifyMissingPath(root);
    const support = await verifySupportInventory(root);
    await verifyRendererPayloadCannotProbePaths(root);
    verifyCommand();

    console.log(JSON.stringify({
      status: 'storage authority preflight verified',
      path_modes: {
        configured: configured.database.mode,
        fallback: fallback.database.mode,
        missing: missing.database.mode
      },
      sample_byte_usage: {
        configured_database_bytes: configured.database.total_bytes,
        support_known_controlled_locations_bytes: support.byte_usage.known_controlled_locations_bytes,
        trace_pack_usage_bytes: support.trace_pack.output.usage_bytes,
        snapshot_destination_usage_bytes: support.snapshot.destination.usage_bytes
      },
      sample_paths: {
        database_path: configured.database.path,
        snapshot_settings_path: support.snapshot.settings.path,
        trace_pack_output_path: support.trace_pack.output.path,
        sde_cache_dir: support.paths.sde_cache_dir.path
      },
      boundary: configured.boundary
    }, null, 2));
  } finally {
    restoreEnv(previous);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function verifyConfiguredPath(root) {
  resetStorageEnv();
  const dbPath = path.join(root, 'configured', 'atlas-configured.sqlite');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, 'configured-db');
  fs.writeFileSync(`${dbPath}-wal`, 'wal-bytes');
  fs.writeFileSync(`${dbPath}-shm`, 'shm');
  process.env.AURA_ATLAS_DB_PATH = dbPath;
  process.env.AURA_ATLAS_TEST_TMP = path.join(root, 'configured', 'tmp');
  process.env.AURA_ATLAS_CACHE_DIR = path.join(root, 'configured', 'tmp', 'cache');
  process.env.AURA_ATLAS_SDE_CACHE_DIR = path.join(root, 'configured', 'tmp', 'sde');

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const preflight = await invokeServiceCommand('storage.authority_preflight', {}, { db, databasePath: dbPath });
    assert(preflight.read_only === true, 'configured preflight should be read-only');
    assert(preflight.mutates_state === false, 'configured preflight should not mutate state');
    assert(preflight.database.source === 'configured', 'configured DB should report configured source');
    assert(preflight.database.mode === 'configured', `configured DB mode should be configured, got ${preflight.database.mode}`);
    assert(preflight.database.exists === true, 'configured DB should exist');
    assert(preflight.database.wal.exists === true, 'configured WAL should exist');
    assert(preflight.database.shm.exists === true, 'configured SHM should exist');
    assert(preflight.database.total_bytes > preflight.database.size_bytes, 'configured total bytes should include journals');
    assert(!fs.existsSync(preflight.snapshot.destination.path), 'preflight must not create fallback snapshot destination');
    return preflight;
  } finally {
    closeDatabase(db);
  }
}

async function verifyFallbackPath(root) {
  resetStorageEnv();
  const dbPath = path.join(root, 'fallback', 'aura-atlas.sqlite');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, 'fallback-db');
  process.env.AURA_ATLAS_TEST_TMP = path.join(root, 'fallback', 'tmp');
  process.env.AURA_ATLAS_CACHE_DIR = path.join(root, 'fallback', 'tmp', 'cache');
  process.env.AURA_ATLAS_SDE_CACHE_DIR = path.join(root, 'fallback', 'tmp', 'sde');

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const preflight = await invokeServiceCommand('storage.authority_preflight', {}, { db, databasePath: dbPath });
    assert(preflight.database.source === 'fallback', 'fallback DB should report fallback source');
    assert(preflight.database.mode === 'fallback', `fallback DB mode should be fallback, got ${preflight.database.mode}`);
    assert(preflight.database.exists === true, 'fallback DB should exist');
    assert(preflight.paths.window_settings.exposed === false, 'window path should stay unexposed without Electron app helper inputs');
    return preflight;
  } finally {
    closeDatabase(db);
  }
}

async function verifyMissingPath(root) {
  resetStorageEnv();
  const dbPath = path.join(root, 'missing', 'atlas-missing.sqlite');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  process.env.AURA_ATLAS_DB_PATH = dbPath;
  process.env.AURA_ATLAS_TEST_TMP = path.join(root, 'missing', 'tmp');

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const preflight = await invokeServiceCommand('storage.authority_preflight', {}, { db, databasePath: dbPath });
    assert(preflight.database.mode === 'missing', `missing DB mode should be missing, got ${preflight.database.mode}`);
    assert(preflight.database.exists === false, 'missing DB should not exist');
    assert(preflight.database.parent.exists === true, 'missing DB parent should be reported');
    assert(!fs.existsSync(dbPath), 'preflight must not create the missing DB');
    return preflight;
  } finally {
    closeDatabase(db);
  }
}

async function verifySupportInventory(root) {
  resetStorageEnv();
  const supportRoot = path.join(root, 'support-fixture');
  const dbPath = path.join(supportRoot, 'atlas-support.sqlite');
  const tempRoot = path.join(supportRoot, 'tmp');
  const snapshotDir = path.join(supportRoot, 'snapshots');
  const settingsPath = path.join(supportRoot, 'snapshot-settings.json');
  const traceDir = path.join(supportRoot, 'trace-packs');
  const cacheDir = path.join(tempRoot, 'cache');
  const sdeDir = path.join(tempRoot, 'sde');
  const windowSettingsPath = path.join(supportRoot, 'window-state.json');

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.mkdirSync(snapshotDir, { recursive: true });
  fs.mkdirSync(traceDir, { recursive: true });
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.mkdirSync(sdeDir, { recursive: true });
  fs.writeFileSync(dbPath, 'support-db');
  fs.writeFileSync(path.join(snapshotDir, 'existing.snapshot.sqlite'), 'snapshot-bytes');
  fs.writeFileSync(path.join(traceDir, 'trace-pack.json'), 'trace-bytes');
  fs.writeFileSync(path.join(cacheDir, 'cache.bin'), 'cache-bytes');
  fs.writeFileSync(path.join(sdeDir, 'fixture-sde.zip'), 'sde-bytes');
  fs.writeFileSync(windowSettingsPath, JSON.stringify({ alwaysOnTop: true }));
  fs.writeFileSync(settingsPath, JSON.stringify({
    version: 1,
    snapshot_destination_dir: snapshotDir,
    snapshot_budget_bytes: 4096
  }, null, 2));

  process.env.AURA_ATLAS_DB_PATH = dbPath;
  process.env.AURA_ATLAS_TEST_TMP = tempRoot;
  process.env.AURA_ATLAS_CACHE_DIR = cacheDir;
  process.env.AURA_ATLAS_SDE_CACHE_DIR = sdeDir;
  process.env.AURA_ATLAS_RUNTIME_SNAPSHOT_SETTINGS_PATH = settingsPath;
  process.env.AURA_ATLAS_SETTINGS_PATH = windowSettingsPath;

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const preflight = await invokeServiceCommand('storage.authority_preflight', {
      tracePackOutputDir: traceDir
    }, { db, databasePath: dbPath, allowStorageAuthorityPathOverrides: true });
    assert(preflight.snapshot.settings.exists === true, 'snapshot settings path should be reported');
    assert(preflight.snapshot.destination.source === 'configured', 'configured snapshot destination should be effective');
    assert(preflight.snapshot.destination.usage_bytes > 0, 'snapshot destination usage should be reported');
    assert(preflight.trace_pack.output.source === 'configured_request', 'trace-pack configured output should be reported');
    assert(preflight.trace_pack.output.usage_bytes > 0, 'trace-pack usage should be reported');
    assert(preflight.paths.cache_dir.usage_bytes > 0, 'cache usage should be reported');
    assert(preflight.paths.sde_cache_dir.usage_bytes > 0, 'SDE usage should be reported');
    assert(preflight.paths.window_settings.exists === true, 'window settings should be reported when helper can expose it');
    assert(preflight.byte_usage.known_controlled_locations_bytes > 0, 'controlled byte usage should be reported');
    return preflight;
  } finally {
    closeDatabase(db);
  }
}

async function verifyRendererPayloadCannotProbePaths(root) {
  resetStorageEnv();
  const safetyRoot = path.join(root, 'renderer-safety');
  const dbPath = path.join(safetyRoot, 'atlas-renderer-safe.sqlite');
  const hiddenTraceDir = path.join(safetyRoot, 'hidden-trace-packs');
  const payloadSettingsPath = path.join(safetyRoot, 'payload-settings.json');
  fs.mkdirSync(hiddenTraceDir, { recursive: true });
  fs.writeFileSync(dbPath, 'renderer-safe-db');
  fs.writeFileSync(path.join(hiddenTraceDir, 'hidden.json'), 'hidden-bytes');
  fs.writeFileSync(payloadSettingsPath, JSON.stringify({ version: 1 }));
  process.env.AURA_ATLAS_DB_PATH = dbPath;
  process.env.AURA_ATLAS_TEST_TMP = path.join(safetyRoot, 'tmp');

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const preflight = await invokeServiceCommand('storage.authority_preflight', {
      databasePath: path.join(safetyRoot, 'payload-db.sqlite'),
      tracePackOutputDir: hiddenTraceDir,
      snapshotSettingsPath: payloadSettingsPath
    }, { db, databasePath: dbPath });
    assert(preflight.database.path === dbPath, 'renderer payload must not override trusted DB path');
    assert(preflight.trace_pack.output.path !== hiddenTraceDir, 'renderer payload must not override trace-pack path');
    assert(preflight.snapshot.settings.path !== payloadSettingsPath, 'renderer payload must not override snapshot settings path');
    assert(preflight.trace_pack.output.usage_bytes === 0, 'renderer payload must not expose arbitrary trace-pack usage');
    return preflight;
  } finally {
    closeDatabase(db);
  }
}

function verifyCommand() {
  const command = listServiceCommands().find((entry) => entry.command === 'storage.authority_preflight');
  assert(command, 'storage.authority_preflight command should be listed');
  assert(command.classification === 'read-only', 'storage.authority_preflight should be read-only');
  assert(command.effects.includes('read-only'), 'storage.authority_preflight should declare read-only effect');
}

function resetStorageEnv() {
  delete process.env.AURA_ATLAS_DB_PATH;
  delete process.env.AURA_ATLAS_TEST_TMP;
  delete process.env.AURA_ATLAS_CACHE_DIR;
  delete process.env.AURA_ATLAS_SDE_CACHE_DIR;
  delete process.env.AURA_ATLAS_RUNTIME_SNAPSHOT_SETTINGS_PATH;
  delete process.env.AURA_ATLAS_SETTINGS_PATH;
  delete process.env.AURA_ATLAS_ALLOW_EXTERNAL_PATHS;
  delete process.env.AURA_ATLAS_STORAGE_PREFLIGHT_FALLBACK_SETTINGS_WITH_DB;
}

function captureEnv() {
  return {
    AURA_ATLAS_DB_PATH: process.env.AURA_ATLAS_DB_PATH,
    AURA_ATLAS_TEST_TMP: process.env.AURA_ATLAS_TEST_TMP,
    AURA_ATLAS_CACHE_DIR: process.env.AURA_ATLAS_CACHE_DIR,
    AURA_ATLAS_SDE_CACHE_DIR: process.env.AURA_ATLAS_SDE_CACHE_DIR,
    AURA_ATLAS_RUNTIME_SNAPSHOT_SETTINGS_PATH: process.env.AURA_ATLAS_RUNTIME_SNAPSHOT_SETTINGS_PATH,
    AURA_ATLAS_SETTINGS_PATH: process.env.AURA_ATLAS_SETTINGS_PATH,
    AURA_ATLAS_ALLOW_EXTERNAL_PATHS: process.env.AURA_ATLAS_ALLOW_EXTERNAL_PATHS,
    AURA_ATLAS_STORAGE_PREFLIGHT_FALLBACK_SETTINGS_WITH_DB: process.env.AURA_ATLAS_STORAGE_PREFLIGHT_FALLBACK_SETTINGS_WITH_DB
  };
}

function restoreEnv(previous) {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
