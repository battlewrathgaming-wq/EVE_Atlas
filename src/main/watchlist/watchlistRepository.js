const { nowIso } = require('../db/evidenceRepository');

const VALID_ENTITY_TYPES = new Set(['character', 'corporation', 'alliance']);

function addWatchlistEntity(db, input) {
  const entityType = normalizeEntityType(input.entityType);
  const entityId = normalizeEntityId(input.entityId);
  const existingEntity = db.prepare(`
    SELECT entity_name
    FROM entities
    WHERE entity_type = ? AND entity_id = ?
  `).get(entityType, entityId);
  const entityName = input.entityName || existingEntity?.entity_name || `${entityType} ${entityId}`;
  const now = nowIso();

  db.prepare(`
    INSERT INTO watchlist_entities (
      entity_type, entity_id, entity_name, lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(entity_type, entity_id) DO UPDATE SET
      entity_name = excluded.entity_name,
      lookback_days = excluded.lookback_days,
      max_killmails_per_run = excluded.max_killmails_per_run,
      is_active = excluded.is_active,
      poll_interval_minutes = excluded.poll_interval_minutes,
      notes = excluded.notes
  `).run(
    entityType,
    entityId,
    entityName,
    integerOrDefault(input.lookbackDays, 30),
    integerOrDefault(input.maxKillmailsPerRun, 100),
    input.isActive === false ? 0 : 1,
    integerOrDefault(input.pollIntervalMinutes, 60),
    input.notes || null
  );

  return {
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    promoted_at: now
  };
}

function listWatchlistEntities(db) {
  return db.prepare(`
    SELECT watch_id, entity_type, entity_id, entity_name, lookback_days,
           max_killmails_per_run, is_active, poll_interval_minutes,
           last_polled_at, next_poll_at, last_success_at, last_error_at,
           backoff_until, notes
    FROM watchlist_entities
    ORDER BY entity_type, entity_name, entity_id
  `).all();
}

function normalizeEntityType(entityType) {
  const value = String(entityType || '').toLowerCase();
  if (!VALID_ENTITY_TYPES.has(value)) {
    throw new Error('Entity type must be character, corporation, or alliance');
  }
  return value;
}

function normalizeEntityId(entityId) {
  const value = Number(entityId);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error('Entity ID must be a positive integer');
  }
  return value;
}

function integerOrDefault(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`Expected positive integer, got ${value}`);
  }
  return number;
}

module.exports = {
  addWatchlistEntity,
  listWatchlistEntities
};
