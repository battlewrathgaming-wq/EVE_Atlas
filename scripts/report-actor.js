const path = require('node:path');
const { openDatabase, closeDatabase } = require('../src/main/db/database');
const { auraTempRoot } = require('../src/main/util/tempPaths');
const { buildActorReport } = require('../src/main/reports/actorReport');

const args = process.argv.slice(2);
const entityType = valueFor(args, '--type');
const entityId = valueFor(args, '--id');
const lookbackSeconds = valueFor(args, '--lookback');
const evidenceStart = valueFor(args, '--start');
const evidenceEnd = valueFor(args, '--end');

if (!entityType || !entityId) {
  console.error('Usage: npm run report:actor -- --type <character|corporation|alliance> --id <id> [--lookback seconds] [--start iso] [--end iso]');
  process.exit(1);
}

const dbPath = process.env.AURA_ATLAS_DB_PATH || path.join(auraTempRoot(), 'aura-atlas-zts-smoke.sqlite');
const db = openDatabase(dbPath);

try {
  console.log(buildActorReport(db, {
    entityType,
    entityId
  }, {
    lookbackSeconds: lookbackSeconds ? Number(lookbackSeconds) : null,
    evidenceStart,
    evidenceEnd
  }));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  closeDatabase(db);
}

function valueFor(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}
