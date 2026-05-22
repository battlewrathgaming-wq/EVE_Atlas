const path = require('node:path');
const { openDatabase, closeDatabase } = require('../src/main/db/database');
const { auraTempRoot } = require('../src/main/util/tempPaths');
const { addWatchlistEntity } = require('../src/main/watchlist/watchlistRepository');
const { formatEntityLabel } = require('../src/main/reports/reportUtils');
const { resolveActorIdentity } = require('../src/main/resolution/actorResolver');

const args = process.argv.slice(2);
const entityType = valueFor(args, '--type');
const entityId = valueFor(args, '--id');
const entityName = valueFor(args, '--name');

if (!entityType || (!entityId && !entityName)) {
  console.error('Usage: npm run watch:add-entity -- --type <character|corporation|alliance> (--id <id> | --name <name>)');
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
  const actor = await resolveActorIdentity(db, {
    entityType,
    entityId,
    entityName
  });
  const row = addWatchlistEntity(db, {
    entityType: actor.entity_type,
    entityId: actor.entity_id,
    entityName: actor.entity_name,
    lookbackDays: valueFor(args, '--lookback-days'),
    maxKillmailsPerRun: valueFor(args, '--max-killmails'),
    pollIntervalMinutes: valueFor(args, '--poll-minutes'),
    notes: valueFor(args, '--notes')
  });
  console.log(`Watchlist entity added: ${formatEntityLabel(row.entity_name, row.entity_type, row.entity_id)}`);
  console.log(`DB: ${dbPath}`);
}

function valueFor(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}
