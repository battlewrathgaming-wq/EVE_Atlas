const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { auraTempRoot } = require('../src/main/util/tempPaths');
const { expandManualRefs } = require('../src/main/workers/manualExpansionWorker');

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
    const summary = await expandManualRefs(inputFromArgs(), { db });
    console.log(JSON.stringify({ db_path: dbPath, ...summary }, null, 2));
  } finally {
    closeDatabase(db);
  }
}

function inputFromArgs() {
  const discoveredByType = valueFor('--type');
  const discoveredById = valueFor('--id');
  const killmailIds = csvIntegers(valueFor('--killmail-ids'));
  if ((!discoveredByType || !discoveredById) && !killmailIds.length) {
    throw new Error('Manual expansion requires --type/--id or --killmail-ids');
  }
  return {
    discoveredByType,
    discoveredById,
    killmailIds,
    maxExpansions: integerArg('--max-expansions', 2),
    trigger: 'manual'
  };
}

function assertLiveEnabled() {
  if (process.env.AURA_ATLAS_LIVE_API !== '1') {
    throw new Error('Refusing manual expansion: set AURA_ATLAS_LIVE_API=1 to allow ESI calls');
  }
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

function csvIntegers(value) {
  if (!value) {
    return [];
  }
  return value.split(',').map((entry) => {
    const number = Number(entry.trim());
    if (!Number.isInteger(number) || number <= 0) {
      throw new Error('--killmail-ids must contain comma-separated positive integers');
    }
    return number;
  });
}
