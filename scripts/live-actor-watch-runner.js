const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { collectActorWatch } = require('../src/main/workers/actorWatchCollector');
const { auraTempRoot } = require('../src/main/util/tempPaths');
const { buildActorQueuePreflight } = require('../src/main/queue/queuePreflight');
const { resolveActorIdentity } = require('../src/main/resolution/actorResolver');
const { normalizeActorWatchScope } = require('../src/main/scopes/scopeControls');
const {
  assertProjectLocalPath,
  assertNoRuntimeSdeZipImport
} = require('./live-system-watch-runner');

async function runLiveActorWatch() {
  assertLiveEnabled();
  assertNoRuntimeSdeZipImport();
  const tempRoot = auraTempRoot();
  process.env.AURA_ATLAS_TEST_TMP = process.env.AURA_ATLAS_TEST_TMP || tempRoot;
  process.env.AURA_ATLAS_CACHE_DIR = process.env.AURA_ATLAS_CACHE_DIR || path.join(tempRoot, 'cache');
  process.env.AURA_ATLAS_SDE_CACHE_DIR = process.env.AURA_ATLAS_SDE_CACHE_DIR || path.join(tempRoot, 'sde');

  assertProjectLocalPath(process.env.AURA_ATLAS_TEST_TMP, 'AURA_ATLAS_TEST_TMP');
  assertProjectLocalPath(process.env.AURA_ATLAS_CACHE_DIR, 'AURA_ATLAS_CACHE_DIR');
  assertProjectLocalPath(process.env.AURA_ATLAS_SDE_CACHE_DIR, 'AURA_ATLAS_SDE_CACHE_DIR');

  const dbPath = process.env.AURA_ATLAS_DB_PATH || path.join(tempRoot, 'actor-watch-live.sqlite');
  assertProjectLocalPath(dbPath, 'AURA_ATLAS_DB_PATH');
  process.env.AURA_ATLAS_DB_PATH = dbPath;

  const db = openDatabase(dbPath);
  migrate(db);

  try {
    const input = await liveActorInput(db);
    const preflight = buildActorQueuePreflight(db, input);
    const first = await collectActorWatch(input, { db });
    return { db_path: dbPath, preflight, first };
  } finally {
    closeDatabase(db);
  }
}

function assertLiveEnabled() {
  if (process.env.AURA_ATLAS_LIVE_API !== '1') {
    throw new Error('Refusing live actor watch: set AURA_ATLAS_LIVE_API=1 to allow zKill/ESI calls');
  }
}

async function liveActorInput(db) {
  const actor = await resolveActorInput(db);
  const scope = normalizeActorWatchScope({
    entityType: actor.entity_type,
    entityId: actor.entity_id,
    entityName: actor.entity_name,
    lookbackSeconds: integerEnv('AURA_ATLAS_LIVE_ACTOR_LOOKBACK_SECONDS', 86400),
    maxRefs: integerEnv('AURA_ATLAS_LIVE_ACTOR_MAX_REFS', 10),
    maxExpansions: integerEnv('AURA_ATLAS_LIVE_ACTOR_MAX_EXPANSIONS', 2)
  });
  return {
    ...scope,
    trigger: 'manual',
    watchId: process.env.AURA_ATLAS_LIVE_ACTOR_WATCH_ID || `actor:${actor.entity_type}:${actor.entity_id}`
  };
}

async function resolveActorInput(db) {
  const watchId = process.env.AURA_ATLAS_LIVE_ACTOR_WATCH_ID;
  if (watchId && !process.env.AURA_ATLAS_LIVE_ACTOR_TYPE && !process.env.AURA_ATLAS_LIVE_ACTOR_ID) {
    const row = db.prepare(`
      SELECT entity_type, entity_id, entity_name
      FROM watchlist_entities
      WHERE watch_id = ?
    `).get(Number(watchId));
    if (!row) {
      throw new Error(`No watchlist entity found for watch_id ${watchId}`);
    }
    return row;
  }

  const entityType = String(process.env.AURA_ATLAS_LIVE_ACTOR_TYPE || '').toLowerCase();
  if (!['character', 'corporation', 'alliance'].includes(entityType)) {
    throw new Error('AURA_ATLAS_LIVE_ACTOR_TYPE must be character, corporation, or alliance');
  }

  return resolveActorIdentity(db, {
    entityType,
    entityId: process.env.AURA_ATLAS_LIVE_ACTOR_ID || null,
    entityName: process.env.AURA_ATLAS_LIVE_ACTOR_NAME || null
  });
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
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

module.exports = {
  runLiveActorWatch,
  assertLiveEnabled,
  liveActorInput
};
