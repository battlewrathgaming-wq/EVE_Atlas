const { nowIso } = require('../db/evidenceRepository');

function buildWatchScheduleStatus(db, options = {}) {
  const now = options.now || nowIso();
  const sessionArmed = options.sessionArmed === true;
  const liveApiEnabled = options.liveApiEnabled ?? process.env.AURA_ATLAS_LIVE_API === '1';
  const watches = [
    ...actorWatchRows(db).map((row) => scheduleRow('actor', row, now, { sessionArmed, liveApiEnabled })),
    ...systemWatchRows(db).map((row) => scheduleRow('system_radius', row, now, { sessionArmed, liveApiEnabled }))
  ];

  return {
    now,
    session_armed: sessionArmed,
    live_api_enabled: liveApiEnabled,
    due: watches.filter((watch) => watch.scheduler_state === 'due'),
    blocked: watches.filter((watch) => watch.scheduler_state !== 'due'),
    watches
  };
}

function recordWatchRunResult(db, input = {}) {
  const watchType = normalizeWatchType(input.watchType || input.watch_type);
  const watchId = positiveInteger(input.watchId ?? input.watch_id, 'watchId');
  const status = String(input.status || '').toLowerCase();
  const finishedAt = input.finishedAt || input.finished_at || nowIso();
  const pollIntervalMinutes = watchPollInterval(db, watchType, watchId);
  const nextPollAt = input.nextPollAt || input.next_poll_at || addMinutes(finishedAt, pollIntervalMinutes);

  if (status === 'success') {
    updateWatch(db, watchType, watchId, {
      last_polled_at: finishedAt,
      last_success_at: finishedAt,
      last_error_at: null,
      backoff_until: null,
      next_poll_at: nextPollAt
    });
    return watchAfterUpdate(db, watchType, watchId);
  }

  if (status === 'failed') {
    const backoffMinutes = positiveInteger(input.backoffMinutes ?? input.backoff_minutes ?? 15, 'backoffMinutes');
    const backoffUntil = input.backoffUntil || input.backoff_until || addMinutes(finishedAt, backoffMinutes);
    updateWatch(db, watchType, watchId, {
      last_polled_at: finishedAt,
      last_error_at: finishedAt,
      backoff_until: backoffUntil,
      next_poll_at: backoffUntil
    });
    return watchAfterUpdate(db, watchType, watchId);
  }

  throw new Error('watch run status must be success or failed');
}

function actorWatchRows(db) {
  return db.prepare(`
    SELECT watch_id, entity_type, entity_id, entity_name,
           lookback_days, max_killmails_per_run,
           is_active, poll_interval_minutes,
           last_polled_at, next_poll_at, last_success_at, last_error_at,
           backoff_until, notes
    FROM watchlist_entities
    ORDER BY watch_id
  `).all();
}

function systemWatchRows(db) {
  return db.prepare(`
    SELECT watch_id, center_system_id, center_system_name, radius_jumps,
           included_system_ids, excluded_system_ids,
           lookback_hours, max_systems_per_run, max_killmails_per_run,
           is_active, poll_interval_minutes,
           last_polled_at, next_poll_at, last_success_at, last_error_at,
           backoff_until, notes
    FROM system_watches
    ORDER BY watch_id
  `).all();
}

function scheduleRow(watchType, row, now, gates) {
  const reasons = [];
  if (!row.is_active) {
    reasons.push('inactive');
  }
  if (!gates.sessionArmed) {
    reasons.push('session_not_armed');
  }
  if (!gates.liveApiEnabled) {
    reasons.push('live_api_disabled');
  }
  if (row.backoff_until && row.backoff_until > now) {
    reasons.push('backoff');
  }
  if (row.next_poll_at && row.next_poll_at > now) {
    reasons.push('not_due');
  }

  const scopeKey = watchType === 'actor'
    ? `actor:${row.entity_type}:${row.entity_id}`
    : `system:${row.center_system_id}:radius:${row.radius_jumps}`;

  return {
    watch_type: watchType,
    watch_id: row.watch_id,
    scope_key: scopeKey,
    scheduler_state: reasons.length ? 'blocked' : 'due',
    blocked_reasons: reasons,
    next_poll_at: row.next_poll_at || null,
    backoff_until: row.backoff_until || null,
    poll_interval_minutes: row.poll_interval_minutes,
    last_polled_at: row.last_polled_at || null,
    last_success_at: row.last_success_at || null,
    last_error_at: row.last_error_at || null,
    sequencer_diagnostic: sequencerDiagnostic(watchType, row, reasons),
    source: watchType === 'actor' ? {
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      entity_name: row.entity_name,
      lookback_days: row.lookback_days,
      max_killmails_per_run: row.max_killmails_per_run
    } : {
      center_system_id: row.center_system_id,
      center_system_name: row.center_system_name,
      radius_jumps: row.radius_jumps,
      included_system_ids: parseJsonArray(row.included_system_ids).values,
      excluded_system_ids: parseJsonArray(row.excluded_system_ids).values,
      included_system_scope_status: parseJsonArray(row.included_system_ids).status,
      excluded_system_scope_status: parseJsonArray(row.excluded_system_ids).status,
      lookback_hours: row.lookback_hours,
      max_systems_per_run: row.max_systems_per_run,
      max_killmails_per_run: row.max_killmails_per_run
    }
  };
}

function parseJsonArray(value) {
  if (!value) {
    return {
      status: 'not_stored',
      values: []
    };
  }
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return {
        status: 'malformed',
        values: []
      };
    }
    return {
      status: 'valid',
      values: parsed
    };
  } catch {
    return {
      status: 'malformed',
      values: []
    };
  }
}

function sequencerDiagnostic(watchType, row, blockedReasons = []) {
  if (watchType === 'actor') {
    const maxRefs = Number(row.max_killmails_per_run || 1);
    return {
      mode: 'watch',
      status: blockedReasons.length ? 'waiting_for_gate_or_schedule' : 'pending_dispatch',
      wait_state: blockedReasons.length ? blockedReasons.join(',') : null,
      radius_allowed: false,
      planned_packets: 1,
      packet_shape: 'actor zKill discovery then capped ESI expansion',
      caps: {
        zkill_packets: 1,
        esi_expansions: maxRefs
      },
      waiting_is_failure: false
    };
  }

  const maxSystems = Number(row.max_systems_per_run || 1);
  const maxKillmails = Number(row.max_killmails_per_run || 1);
  return {
    mode: 'watch_sequencer',
    status: blockedReasons.length ? 'waiting_for_gate_or_schedule' : 'pending_dispatch',
    wait_state: blockedReasons.length ? blockedReasons.join(',') : null,
    radius_allowed: true,
    radius_jumps: Number(row.radius_jumps || 0),
    planned_packets: maxSystems,
    packet_shape: 'system/radius zKill packets then capped ESI expansion',
    caps: {
      zkill_packets: maxSystems,
      esi_expansions: maxKillmails,
      max_refs_per_packet: Math.max(1, Math.ceil(maxKillmails / Math.max(maxSystems, 1)))
    },
    waiting_is_failure: false
  };
}

function updateWatch(db, watchType, watchId, patch) {
  const table = watchType === 'actor' ? 'watchlist_entities' : 'system_watches';
  db.prepare(`
    UPDATE ${table}
    SET last_polled_at = ?,
        next_poll_at = ?,
        last_success_at = ?,
        last_error_at = ?,
        backoff_until = ?
    WHERE watch_id = ?
  `).run(
    patch.last_polled_at || null,
    patch.next_poll_at || null,
    patch.last_success_at || null,
    patch.last_error_at || null,
    patch.backoff_until || null,
    watchId
  );
}

function watchAfterUpdate(db, watchType, watchId) {
  const rows = watchType === 'actor' ? actorWatchRows(db) : systemWatchRows(db);
  const row = rows.find((entry) => entry.watch_id === watchId);
  if (!row) {
    throw new Error(`No ${watchType} watch found for watch_id ${watchId}`);
  }
  return {
    watch_type: watchType,
    watch: row
  };
}

function watchPollInterval(db, watchType, watchId) {
  const table = watchType === 'actor' ? 'watchlist_entities' : 'system_watches';
  const row = db.prepare(`SELECT poll_interval_minutes FROM ${table} WHERE watch_id = ?`).get(watchId);
  if (!row) {
    throw new Error(`No ${watchType} watch found for watch_id ${watchId}`);
  }
  return row.poll_interval_minutes;
}

function addMinutes(isoTime, minutes) {
  return new Date(Date.parse(isoTime) + minutes * 60 * 1000).toISOString();
}

function normalizeWatchType(watchType) {
  const value = String(watchType || '').toLowerCase();
  if (value === 'actor' || value === 'watchlist_entity') {
    return 'actor';
  }
  if (value === 'system_radius' || value === 'system') {
    return 'system_radius';
  }
  throw new Error('watchType must be actor or system_radius');
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return number;
}

module.exports = {
  buildWatchScheduleStatus,
  recordWatchRunResult,
  sequencerDiagnostic
};
