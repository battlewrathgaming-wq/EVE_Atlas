const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { collectSystemRadiusWatch } = require('../src/main/workers/systemRadiusCollector');
const { auraTempRoot, projectRoot } = require('../src/main/util/tempPaths');

async function runLiveSystemWatch({ twice = false } = {}) {
  assertLiveEnabled();
  assertNoRuntimeSdeZipImport();
  const tempRoot = auraTempRoot();
  process.env.AURA_ATLAS_TEST_TMP = process.env.AURA_ATLAS_TEST_TMP || tempRoot;
  process.env.AURA_ATLAS_CACHE_DIR = process.env.AURA_ATLAS_CACHE_DIR || path.join(tempRoot, 'cache');
  process.env.AURA_ATLAS_SDE_CACHE_DIR = process.env.AURA_ATLAS_SDE_CACHE_DIR || path.join(tempRoot, 'sde');

  assertProjectLocalPath(process.env.AURA_ATLAS_TEST_TMP, 'AURA_ATLAS_TEST_TMP');
  assertProjectLocalPath(process.env.AURA_ATLAS_CACHE_DIR, 'AURA_ATLAS_CACHE_DIR');
  assertProjectLocalPath(process.env.AURA_ATLAS_SDE_CACHE_DIR, 'AURA_ATLAS_SDE_CACHE_DIR');

  const dbPath = process.env.AURA_ATLAS_DB_PATH || path.join(tempRoot, twice ? 'system-watch-idempotent-live.sqlite' : 'system-watch-live.sqlite');
  assertProjectLocalPath(dbPath, 'AURA_ATLAS_DB_PATH');
  process.env.AURA_ATLAS_DB_PATH = dbPath;

  const db = openDatabase(dbPath);
  migrate(db);

  try {
    const input = liveInput(db);
    const first = await collectSystemRadiusWatch(input, { db });
    if (!twice) {
      return { db_path: dbPath, first };
    }

    const second = await collectSystemRadiusWatch({ ...input, trigger: 'fixture_test' }, { db });
    const counts = {
      killmails: count(db, 'killmails'),
      activity_events: count(db, 'activity_events'),
      fetch_runs: count(db, 'fetch_runs')
    };

    if (second.activity_events_written !== 0) {
      throw new Error(`Idempotent live rerun wrote ${second.activity_events_written} duplicate activity events`);
    }

    return { db_path: dbPath, first, second, counts };
  } finally {
    closeDatabase(db);
  }
}

function assertLiveEnabled() {
  if (process.env.AURA_ATLAS_LIVE_API !== '1') {
    throw new Error('Refusing live system watch: set AURA_ATLAS_LIVE_API=1 to allow zKill/ESI calls');
  }
}

function assertNoRuntimeSdeZipImport() {
  if (process.env.AURA_ATLAS_LIVE_SDE_JSONL_PATH) {
    throw new Error('Refusing live system watch: AURA_ATLAS_LIVE_SDE_JSONL_PATH is import material only. Import SDE into SQLite first, then run live collection from lookup tables.');
  }
}

function liveInput(db) {
  const centerSystemId = resolveCenterSystemId(db);
  return {
    centerSystemId,
    radiusJumps: integerEnv('AURA_ATLAS_LIVE_RADIUS_JUMPS', 0),
    lookbackSeconds: integerEnv('AURA_ATLAS_LIVE_LOOKBACK_SECONDS', 3600),
    maxSystems: integerEnv('AURA_ATLAS_LIVE_MAX_SYSTEMS', 1),
    maxRefsPerSystem: integerEnv('AURA_ATLAS_LIVE_MAX_REFS_PER_SYSTEM', 2),
    maxExpansions: integerEnv('AURA_ATLAS_LIVE_MAX_EXPANSIONS', 2),
    maxRadius: integerEnv('AURA_ATLAS_LIVE_MAX_RADIUS', 2),
    maxTopologySystems: integerEnv('AURA_ATLAS_LIVE_MAX_TOPOLOGY_SYSTEMS', 10),
    trigger: 'manual',
    watchId: process.env.AURA_ATLAS_LIVE_WATCH_ID || 'live-system-watch'
  };
}

function resolveCenterSystemId(db) {
  if (process.env.AURA_ATLAS_LIVE_CENTER_SYSTEM_ID) {
    return integerEnv('AURA_ATLAS_LIVE_CENTER_SYSTEM_ID', null);
  }

  const systemName = process.env.AURA_ATLAS_LIVE_CENTER_SYSTEM_NAME;
  if (!systemName) {
    throw new Error('AURA_ATLAS_LIVE_CENTER_SYSTEM_ID or AURA_ATLAS_LIVE_CENTER_SYSTEM_NAME is required');
  }

  const row = db.prepare(`
    SELECT solar_system_id
    FROM solar_systems
    WHERE lower(solar_system_name) = lower(?)
  `).get(systemName.trim());

  if (!row) {
    throw new Error(`Center system "${systemName}" was not found in local SDE topology`);
  }

  return row.solar_system_id;
}

function integerEnv(name, fallback) {
  const raw = process.env[name];
  if ((raw === undefined || raw === '') && fallback !== null) {
    return fallback;
  }
  if (raw === undefined || raw === '') {
    throw new Error(`${name} is required`);
  }
  const value = Number(raw);
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer`);
  }
  return value;
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assertProjectLocalPath(targetPath, label) {
  const allowExternal = process.env.AURA_ATLAS_ALLOW_EXTERNAL_PATHS === '1';
  const resolvedTarget = path.resolve(targetPath);
  const resolvedProject = projectRoot();
  const relative = path.relative(resolvedProject, resolvedTarget);
  const isInsideProject = relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));

  if (!isInsideProject && !allowExternal) {
    throw new Error(`${label} must stay under ${resolvedProject}; set AURA_ATLAS_ALLOW_EXTERNAL_PATHS=1 to override`);
  }
}

module.exports = {
  runLiveSystemWatch,
  assertProjectLocalPath,
  assertNoRuntimeSdeZipImport
};
