const path = require('node:path');
const { openDatabase, closeDatabase } = require('../src/main/db/database');
const { auraTempRoot } = require('../src/main/util/tempPaths');
const { resolveActorIdentity } = require('../src/main/resolution/actorResolver');
const { buildCorporationMetadataReadinessReport } = require('../src/main/reports/corporationMetadataReadinessReport');

const args = process.argv.slice(2);
const entityId = valueFor(args, '--id');
const entityName = valueFor(args, '--name');
const lookbackSeconds = valueFor(args, '--lookback');
const evidenceStart = valueFor(args, '--start');
const evidenceEnd = valueFor(args, '--end');

if (!entityId && !entityName) {
  console.error('Usage: npm run report:corporation-metadata -- (--id <id> | --name <cached name>) [--lookback seconds] [--start iso] [--end iso]');
  process.exit(1);
}

const dbPath = process.env.AURA_ATLAS_DB_PATH || path.join(auraTempRoot(), 'aura-atlas-zts-smoke.sqlite');
const db = openDatabase(dbPath);

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => {
  closeDatabase(db);
});

async function run() {
  const corporation = await resolveActorIdentity(db, {
    entityType: 'corporation',
    entityId,
    entityName
  });
  console.log(buildCorporationMetadataReadinessReport(db, {
    entityId: corporation.entity_id,
    entityName: corporation.entity_name
  }, {
    lookbackSeconds: lookbackSeconds ? Number(lookbackSeconds) : null,
    evidenceStart,
    evidenceEnd
  }));
}

function valueFor(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}
