const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { addWatchlistEntity, listWatchlistEntities } = require('../src/main/watchlist/watchlistRepository');

function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  db.prepare(`
    INSERT INTO entities (
      entity_type, entity_id, entity_name, first_seen_at, last_seen_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run('character', 2123964283, 'Jangalanng', '2026-05-21T19:35:21Z', '2026-05-21T19:58:42Z');

  const first = addWatchlistEntity(db, {
    entityType: 'character',
    entityId: 2123964283,
    lookbackDays: 30,
    maxKillmailsPerRun: 50,
    notes: 'Promoted from observed radius report'
  });
  assert(first.entity_name === 'Jangalanng', 'watchlist add should use cached entity label');

  addWatchlistEntity(db, {
    entityType: 'character',
    entityId: 2123964283,
    entityName: 'Jangalanng',
    lookbackDays: 7,
    maxKillmailsPerRun: 25,
    pollIntervalMinutes: 120,
    notes: 'Updated watch settings'
  });

  const rows = listWatchlistEntities(db);
  assert(rows.length === 1, 'watchlist upsert should remain idempotent by entity type/id');
  assert(rows[0].entity_type === 'character', 'watchlist should preserve entity type');
  assert(rows[0].entity_id === 2123964283, 'watchlist should preserve numeric entity ID');
  assert(rows[0].entity_name === 'Jangalanng', 'watchlist should store cached display label');
  assert(rows[0].lookback_days === 7, 'watchlist upsert should update lookback');
  assert(rows[0].max_killmails_per_run === 25, 'watchlist upsert should update cap');
  assert(rows[0].poll_interval_minutes === 120, 'watchlist upsert should update poll interval');
  assert(rows[0].notes === 'Updated watch settings', 'watchlist upsert should update notes');

  closeDatabase(db);
  console.log('watchlist promotion verified');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main();
