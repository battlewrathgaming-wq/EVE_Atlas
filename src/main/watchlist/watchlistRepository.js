const { nowIso } = require('../db/evidenceRepository');
const { TopologyService } = require('../sde/topologyService');

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

function addSystemRadiusWatch(db, input) {
  const centerSystemId = normalizeEntityId(input.centerSystemId);
  const system = db.prepare(`
    SELECT solar_system_id, solar_system_name
    FROM solar_systems
    WHERE solar_system_id = ?
  `).get(centerSystemId);
  if (!system) {
    throw new Error(`No system found for ${centerSystemId}`);
  }

  const radiusJumps = nonNegativeIntegerOrDefault(input.radiusJumps, 1, 'radiusJumps');
  const topology = new TopologyService(db);
  const topologyIncludedSystemIds = topology.getSystemsWithinRadius(centerSystemId, radiusJumps, {
    maxRadius: integerOrDefault(input.maxRadius, 5),
    maxSystems: integerOrDefault(input.maxTopologySystems, 100)
  });
  const acceptedScope = normalizeAcceptedSystemRadiusScope(input, {
    centerSystemId,
    topologyIncludedSystemIds
  });
  const includedSystemIds = acceptedScope.usesAcceptedScope
    ? acceptedScope.acceptedIncludedSystemIds
    : topologyIncludedSystemIds;

  const values = {
    centerSystemId,
    centerSystemName: system.solar_system_name,
    radiusJumps,
    includedSystemIds: JSON.stringify(includedSystemIds),
    excludedSystemIds: JSON.stringify(input.excludedSystemIds || []),
    lookbackHours: Math.max(1, Math.ceil(integerOrDefault(input.lookbackSeconds, 86400) / 3600)),
    maxSystemsPerRun: integerOrDefault(input.maxSystems, 10),
    maxKillmailsPerRun: integerOrDefault(input.maxExpansions || input.maxKillmailsPerRun, 2),
    isActive: input.isActive === false ? 0 : 1,
    pollIntervalMinutes: integerOrDefault(input.pollIntervalMinutes, 60),
    notes: input.notes || null
  };

  const watchId = input.watchId || input.watch_id;
  if (watchId) {
    db.prepare(`
      UPDATE system_watches
      SET center_system_id = ?,
          center_system_name = ?,
          radius_jumps = ?,
          included_system_ids = ?,
          excluded_system_ids = ?,
          lookback_hours = ?,
          max_systems_per_run = ?,
          max_killmails_per_run = ?,
          is_active = ?,
          poll_interval_minutes = ?,
          notes = ?
      WHERE watch_id = ?
    `).run(
      values.centerSystemId,
      values.centerSystemName,
      values.radiusJumps,
      values.includedSystemIds,
      values.excludedSystemIds,
      values.lookbackHours,
      values.maxSystemsPerRun,
      values.maxKillmailsPerRun,
      values.isActive,
      values.pollIntervalMinutes,
      values.notes,
      normalizeEntityId(watchId)
    );
  } else {
    db.prepare(`
      INSERT INTO system_watches (
        center_system_id, center_system_name, radius_jumps, included_system_ids,
        excluded_system_ids, lookback_hours, max_systems_per_run,
        max_killmails_per_run, is_active, poll_interval_minutes, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      values.centerSystemId,
      values.centerSystemName,
      values.radiusJumps,
      values.includedSystemIds,
      values.excludedSystemIds,
      values.lookbackHours,
      values.maxSystemsPerRun,
      values.maxKillmailsPerRun,
      values.isActive,
      values.pollIntervalMinutes,
      values.notes
    );
  }

  const row = db.prepare(`
    SELECT *
    FROM system_watches
    WHERE watch_id = COALESCE(?, last_insert_rowid())
  `).get(watchId || null);
  return {
    watch_type: 'system_radius',
    watch: row,
    scope_authority: acceptedScope.usesAcceptedScope
      ? {
          source: 'accepted_preflight_included_system_ids',
          included_system_ids: acceptedScope.acceptedIncludedSystemIds,
          center_radius_role: 'provenance_and_management',
          topology_recomputed_for_storage: false
        }
      : {
          source: 'legacy_center_radius_authoring',
          included_system_ids: includedSystemIds,
          center_radius_role: 'legacy_authoring_geometry',
          topology_recomputed_for_storage: true
        },
    authored_at: nowIso()
  };
}

function normalizeAcceptedSystemRadiusScope(input, context) {
  if (!input.requireAcceptedIncludedSystemIds && !input.acceptedIncludedSystemIds) {
    return {
      usesAcceptedScope: false,
      acceptedIncludedSystemIds: []
    };
  }

  if (input.acceptedScopePayloadStatus && !acceptedPayloadStatus(input.acceptedScopePayloadStatus)) {
    throw new Error(`Accepted system/radius Watch scope rejected: payload status ${input.acceptedScopePayloadStatus} is not acceptable`);
  }
  if (input.acceptedPreflightStatus && String(input.acceptedPreflightStatus) !== 'acceptable') {
    throw new Error(`Accepted system/radius Watch scope rejected: preflight status ${input.acceptedPreflightStatus} is not acceptable`);
  }
  const accepted = normalizeSystemIdArray(input.acceptedIncludedSystemIds, 'acceptedIncludedSystemIds');
  if (!accepted.length) {
    throw new Error('Accepted system/radius Watch scope requires non-empty accepted included_system_ids');
  }
  if (!accepted.includes(context.centerSystemId)) {
    throw new Error('Accepted system/radius Watch scope must include the center system ID');
  }
  if (stableJson(sortedNumbers(accepted)) !== stableJson(sortedNumbers(context.topologyIncludedSystemIds))) {
    throw new Error('Accepted system/radius Watch scope does not match current local topology for center/radius');
  }
  return {
    usesAcceptedScope: true,
    acceptedIncludedSystemIds: accepted
  };
}

function acceptedPayloadStatus(status) {
  return new Set([
    'ready_for_future_mutation_contract_payload',
    'ready_for_future_watch_create_payload',
    'acceptable',
    'accepted'
  ]).has(String(status));
}

function normalizeSystemIdArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new Error(`Accepted system/radius Watch scope requires ${fieldName} array`);
  }
  const normalized = value.map((item) => Number(item));
  if (normalized.some((item) => !Number.isInteger(item) || item <= 0)) {
    throw new Error(`Accepted system/radius Watch scope ${fieldName} must contain positive integer system IDs`);
  }
  if (new Set(normalized).size !== normalized.length) {
    throw new Error(`Accepted system/radius Watch scope ${fieldName} must not contain duplicate system IDs`);
  }
  return normalized;
}

function stableJson(value) {
  return JSON.stringify(value);
}

function sortedNumbers(value) {
  return [...value].map(Number).sort((left, right) => left - right);
}

function listSystemRadiusWatches(db) {
  return db.prepare(`
    SELECT watch_id, center_system_id, center_system_name, radius_jumps,
           included_system_ids, excluded_system_ids, lookback_hours,
           max_systems_per_run, max_killmails_per_run, is_active,
           poll_interval_minutes, last_polled_at, next_poll_at,
           last_success_at, last_error_at, backoff_until, notes
    FROM system_watches
    ORDER BY center_system_name, radius_jumps, watch_id
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

function nonNegativeIntegerOrDefault(value, fallback, label) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return number;
}

module.exports = {
  addWatchlistEntity,
  addSystemRadiusWatch,
  listSystemRadiusWatches,
  listWatchlistEntities
};
