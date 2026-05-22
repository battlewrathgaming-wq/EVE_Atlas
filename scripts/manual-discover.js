const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { auraTempRoot } = require('../src/main/util/tempPaths');
const { discoverManualRefs } = require('../src/main/workers/manualDiscoveryWorker');
const { resolveActorIdentity } = require('../src/main/resolution/actorResolver');
const { resolveSystemIdentity } = require('../src/main/resolution/systemResolver');
const { normalizeManualDiscoveryScope } = require('../src/main/scopes/scopeControls');

const args = process.argv.slice(2);

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

async function run() {
  assertLiveEnabled();
  const dbPath = process.env.AURA_ATLAS_DB_PATH || path.join(auraTempRoot(), 'aura-atlas-manual-discovery.sqlite');
  const db = openDatabase(dbPath);
  migrate(db);
  try {
    const input = await inputFromArgs(db);
    const summary = await discoverManualRefs(input, { db });
    console.log(JSON.stringify({ db_path: dbPath, ...summary }, null, 2));
  } finally {
    closeDatabase(db);
  }
}

async function inputFromArgs(db) {
  const scope = required('--scope');
  const lookbackSeconds = integerArg('--lookback-seconds', 86400);
  const base = { scope, lookbackSeconds, trigger: 'manual' };

  if (scope === 'actor') {
    const entityType = required('--actor-type');
    const entityId = valueFor('--id');
    const entityName = valueFor('--name');
    const actor = await resolveActorIdentity(db, {
      entityType,
      entityId,
      entityName
    });
    return normalizeManualDiscoveryScope({
      ...base,
      entityType: actor.entity_type,
      entityId: actor.entity_id,
      entityName: actor.entity_name,
      maxRefs: integerArg('--max-refs', 20)
    });
  }

  if (scope === 'system' || scope === 'radius') {
    const system = resolveSystemIdentity(db, {
      systemId: valueFor('--system-id'),
      systemName: valueFor('--system')
    });
    return normalizeManualDiscoveryScope({
      ...base,
      centerSystemId: system.solar_system_id,
      radiusJumps: scope === 'system' ? 0 : integerArg('--radius', 1),
      maxSystems: integerArg('--max-systems', scope === 'system' ? 1 : 10),
      maxRefsPerSystem: integerArg('--max-refs-per-system', 10),
      maxRadius: integerArg('--max-radius', 5),
      maxTopologySystems: integerArg('--max-topology-systems', 100)
    });
  }

  throw new Error('--scope must be actor, system, or radius');
}

function assertLiveEnabled() {
  if (process.env.AURA_ATLAS_LIVE_API !== '1') {
    throw new Error('Refusing manual discovery: set AURA_ATLAS_LIVE_API=1 to allow zKill calls');
  }
}

function required(flag) {
  const value = valueFor(flag);
  if (!value) {
    throw new Error(`${flag} is required`);
  }
  return value;
}

function valueFor(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function integerArg(flag, fallback) {
  const raw = valueFor(flag);
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return value;
}
