const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const {
  buildWatchScheduleStatus,
  recordWatchRunResult
} = require('../src/main/watchlist/watchScheduler');
const {
  invokeServiceCommand,
  listServiceCommands
} = require('../src/main/services/serviceRegistry');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedWatches(db);

    const now = '2026-05-22T12:00:00.000Z';
    const passive = buildWatchScheduleStatus(db, {
      now,
      sessionArmed: false,
      liveApiEnabled: true
    });
    assert(passive.due.length === 0, 'session-disarmed schedule should not mark watches due');
    assert(hasBlockedReason(passive, 'actor', 1, 'session_not_armed'), 'actor watch should be blocked when session is not armed');

    const liveBlocked = buildWatchScheduleStatus(db, {
      now,
      sessionArmed: true,
      liveApiEnabled: false
    });
    assert(liveBlocked.due.length === 0, 'live-disabled schedule should not mark watches due');
    assert(hasBlockedReason(liveBlocked, 'system_radius', 1, 'live_api_disabled'), 'system watch should be blocked when live API is disabled');

    const armed = buildWatchScheduleStatus(db, {
      now,
      sessionArmed: true,
      liveApiEnabled: true
    });
    assert(hasDueWatch(armed, 'actor', 1), 'due actor watch should be returned when gates are open');
    assert(hasDueWatch(armed, 'system_radius', 1), 'due system watch should be returned when gates are open');
    assert(hasBlockedReason(armed, 'actor', 2, 'not_due'), 'future actor watch should be blocked as not_due');
    assert(hasBlockedReason(armed, 'actor', 3, 'backoff'), 'backoff actor watch should be blocked');
    assert(hasBlockedReason(armed, 'actor', 4, 'inactive'), 'inactive actor watch should be blocked');

    const success = recordWatchRunResult(db, {
      watchType: 'actor',
      watchId: 1,
      status: 'success',
      finishedAt: now
    });
    assert(success.watch.last_success_at === now, 'successful watch run should record last_success_at');
    assert(success.watch.next_poll_at === '2026-05-22T13:00:00.000Z', 'successful watch run should schedule next poll from interval');
    assert(success.watch.backoff_until === null, 'successful watch run should clear backoff');

    const failed = recordWatchRunResult(db, {
      watchType: 'system_radius',
      watchId: 1,
      status: 'failed',
      finishedAt: now,
      backoffMinutes: 30
    });
    assert(failed.watch.last_error_at === now, 'failed watch run should record last_error_at');
    assert(failed.watch.backoff_until === '2026-05-22T12:30:00.000Z', 'failed watch run should schedule backoff');
    assert(failed.watch.next_poll_at === '2026-05-22T12:30:00.000Z', 'failed watch run should align next poll to backoff');

    const commands = listServiceCommands();
    assert(commandClass(commands, 'watch.schedule') === 'read-only', 'watch.schedule should be read-only');
    assert(commandClass(commands, 'watch.recordRun') === 'metadata-only', 'watch.recordRun should be metadata-only');

    const serviceSchedule = await invokeServiceCommand('watch.schedule', {
      now,
      sessionArmed: true,
      liveApiEnabled: true
    }, { db });
    assert(serviceSchedule.watches.length === 5, 'watch.schedule service should return all actor and system watches');

    const serviceRecord = await invokeServiceCommand('watch.recordRun', {
      watchType: 'actor',
      watchId: 2,
      status: 'success',
      finishedAt: now
    }, { db });
    assert(serviceRecord.watch.last_success_at === now, 'watch.recordRun service should update watch state');
  } finally {
    closeDatabase(db);
  }

  console.log('watch scheduler verified');
}

function seedWatches(db) {
  db.prepare(`
    INSERT INTO watchlist_entities (
      watch_id, entity_type, entity_id, entity_name,
      lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(1, 'character', 90000001, 'Due Pilot', 30, 50, 1, 60, null, null, null, null, null, 'due actor');

  db.prepare(`
    INSERT INTO watchlist_entities (
      watch_id, entity_type, entity_id, entity_name,
      lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(2, 'corporation', 90000002, 'Future Corp', 7, 25, 1, 90, null, '2026-05-22T13:00:00.000Z', null, null, null, 'not due actor');

  db.prepare(`
    INSERT INTO watchlist_entities (
      watch_id, entity_type, entity_id, entity_name,
      lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(3, 'alliance', 90000003, 'Backoff Alliance', 30, 50, 1, 60, null, null, null, '2026-05-22T11:59:00.000Z', '2026-05-22T12:30:00.000Z', 'backoff actor');

  db.prepare(`
    INSERT INTO watchlist_entities (
      watch_id, entity_type, entity_id, entity_name,
      lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(4, 'character', 90000004, 'Inactive Pilot', 30, 50, 0, 60, null, null, null, null, null, 'inactive actor');

  db.prepare(`
    INSERT INTO system_watches (
      watch_id, center_system_id, center_system_name, radius_jumps,
      included_system_ids, excluded_system_ids,
      lookback_hours, max_systems_per_run, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(1, 30004660, 'ZTS-4D', 1, '[30004660]', '[]', 24, 4, 20, 1, 45, null, null, null, null, null, 'due system');
}

function hasDueWatch(status, watchType, watchId) {
  return status.due.some((watch) => watch.watch_type === watchType && watch.watch_id === watchId);
}

function hasBlockedReason(status, watchType, watchId, reason) {
  return status.blocked.some((watch) => (
    watch.watch_type === watchType &&
    watch.watch_id === watchId &&
    watch.blocked_reasons.includes(reason)
  ));
}

function commandClass(commands, command) {
  return commands.find((entry) => entry.command === command)?.classification;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
