const path = require('node:path');
const { openDatabase, closeDatabase } = require('../src/main/db/database');
const { auraTempRoot } = require('../src/main/util/tempPaths');
const { addWatchlistEntity } = require('../src/main/watchlist/watchlistRepository');
const { formatEntityLabel } = require('../src/main/reports/reportUtils');

const args = process.argv.slice(2);
const entityType = valueFor(args, '--type');
const entityId = valueFor(args, '--id');
const entityName = valueFor(args, '--name');

if (!entityType || !entityId) {
  console.error('Usage: npm run watch:add-entity -- --type <character|corporation|alliance> --id <id> [--name label]');
  process.exit(1);
}

const dbPath = process.env.AURA_ATLAS_DB_PATH || path.join(auraTempRoot(), 'aura-atlas-zts-smoke.sqlite');
const db = openDatabase(dbPath);

try {
  const row = addWatchlistEntity(db, {
    entityType,
    entityId,
    entityName,
    lookbackDays: valueFor(args, '--lookback-days'),
    maxKillmailsPerRun: valueFor(args, '--max-killmails'),
    pollIntervalMinutes: valueFor(args, '--poll-minutes'),
    notes: valueFor(args, '--notes')
  });
  console.log(`Watchlist entity added: ${formatEntityLabel(row.entity_name, row.entity_type, row.entity_id)}`);
  console.log(`DB: ${dbPath}`);
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
