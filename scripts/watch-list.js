const path = require('node:path');
const { openDatabase, closeDatabase } = require('../src/main/db/database');
const { auraTempRoot } = require('../src/main/util/tempPaths');
const { listWatchlistEntities } = require('../src/main/watchlist/watchlistRepository');
const { table, formatEntityLabel } = require('../src/main/reports/reportUtils');

const dbPath = process.env.AURA_ATLAS_DB_PATH || path.join(auraTempRoot(), 'aura-atlas-zts-smoke.sqlite');
const db = openDatabase(dbPath);

try {
  const rows = listWatchlistEntities(db);
  console.log('AURA Atlas Watchlist Entities');
  console.log(`DB: ${dbPath}`);
  console.log(table(rows, [
    { label: 'Watch ID', value: (row) => row.watch_id },
    { label: 'Entity', value: (row) => formatEntityLabel(row.entity_name, row.entity_type, row.entity_id) },
    { label: 'Active', value: (row) => row.is_active ? 'yes' : 'no' },
    { label: 'Lookback', value: (row) => `${row.lookback_days}d` },
    { label: 'Max Killmails', value: (row) => row.max_killmails_per_run },
    { label: 'Poll', value: (row) => `${row.poll_interval_minutes}m` },
    { label: 'Notes', value: (row) => row.notes || '' }
  ]));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  closeDatabase(db);
}
