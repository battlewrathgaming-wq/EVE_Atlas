const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildWatchOfflineReadout } = require('../src/main/watchlist/watchOfflineReadout');
const {
  invokeServiceCommand,
  listServiceCommands
} = require('../src/main/services/serviceRegistry');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedReadoutState(db);
    const before = persistedCounts(db);
    const now = '2026-05-25T12:00:00.000Z';

    const readout = buildWatchOfflineReadout(db, {
      now,
      liveApiEnabled: true,
      executorStatus: {
        session_armed: false,
        active_task_id: null
      }
    });
    assert(readout.model === 'Watch_offline', 'readout should identify the Watch_offline model');
    assert(readout.session_armed === false, 'post-restart readout should be unarmed');
    assert(readout.collection_active === false, 'post-restart readout should not report active collection');
    assert(readout.summary.configured_watches === 4, 'readout should include configured actor and system watches');
    assert(readout.summary.eligible_if_armed === 2, 'due-time watches should be explicit eligible_if_armed when session is unarmed');
    assert(readout.summary.local_context_available >= 2, 'readout should expose local context availability');
    assert(readout.state_basis.some((entry) => entry.includes('does not start collection')), 'readout should state passive/no-collection basis');

    const actorDue = findWatch(readout, 'actor', 1);
    assert(actorDue.blocked_reasons.includes('session_not_armed'), 'due actor should be blocked by unarmed session');
    assert(actorDue.time_eligible === true, 'due actor should be time eligible');
    assert(actorDue.eligible_if_armed === true, 'due actor should be eligible if armed');
    assert(actorDue.local_context.queue.pending === 1, 'actor readout should include local pending possible lead count');
    assert(actorDue.local_context.evidence.activity_events === 1, 'actor readout should include local evidence event count');

    const actorFuture = findWatch(readout, 'actor', 2);
    assert(actorFuture.time_eligible === false, 'not-due actor should not be time eligible');
    assert(actorFuture.eligible_if_armed === false, 'not-due actor should not be eligible if armed');
    assert(actorFuture.next_eligible_at === '2026-05-25T13:00:00.000Z', 'not-due actor should expose next eligible time');

    const actorBackoff = findWatch(readout, 'actor', 3);
    assert(actorBackoff.blocked_reasons.includes('backoff'), 'backoff actor should expose backoff reason');
    assert(actorBackoff.next_eligible_at === '2026-05-25T12:30:00.000Z', 'backoff actor should expose backoff as next eligible time');

    const systemDue = findWatch(readout, 'system_radius', 1);
    assert(systemDue.eligible_if_armed === true, 'due system/radius watch should be eligible if armed');
    assert(systemDue.local_context.queue.pending === 1, 'system readout should include local pending possible lead count');
    assert(systemDue.local_context.evidence.killmails === 1, 'system readout should include local center-system evidence count');

    const activeCollection = buildWatchOfflineReadout(db, {
      now,
      liveApiEnabled: true,
      executorStatus: {
        session_armed: false,
        active_task_id: 'task_fixture_active'
      }
    });
    assert(activeCollection.collection_active === true, 'active task id should derive collection_active');
    assert(findWatch(activeCollection, 'actor', 1).eligible_if_armed === false, 'active collection should suppress eligible_if_armed');

    const commands = listServiceCommands();
    const command = commands.find((entry) => entry.command === 'watch.offline_readout');
    assert(command?.classification === 'read-only', 'watch.offline_readout should be read-only');
    assert(command?.renderer_allowed === true, 'watch.offline_readout should be renderer eligible for future presentation');
    assert(command.effects.includes('read-only'), 'watch.offline_readout should expose read-only effect only');

    const serviceReadout = await invokeServiceCommand('watch.offline_readout', {
      now,
      liveApiEnabled: true
    }, { db });
    assert(serviceReadout.model === 'Watch_offline', 'service should return Watch_offline readout model');
    assert(serviceReadout.session_armed === false, 'service should use volatile executor unarmed state');
    assert(serviceReadout.collection_active === false, 'service should not report collection active on fresh executor');
    assert(findWatch(serviceReadout, 'actor', 1).eligible_if_armed === true, 'service readout should expose eligible_if_armed');

    assertSame(before, persistedCounts(db), 'Watch_offline readout should not mutate persisted state');
  } finally {
    closeDatabase(db);
  }

  console.log('watch offline readout verified');
}

function seedReadoutState(db) {
  seedActorWatch(db, 1, {
    entityType: 'character',
    entityId: 90000001,
    entityName: 'Due Pilot'
  });
  seedActorWatch(db, 2, {
    entityType: 'corporation',
    entityId: 90000002,
    entityName: 'Future Corp',
    nextPollAt: '2026-05-25T13:00:00.000Z'
  });
  seedActorWatch(db, 3, {
    entityType: 'alliance',
    entityId: 90000003,
    entityName: 'Backoff Alliance',
    lastErrorAt: '2026-05-25T11:55:00.000Z',
    backoffUntil: '2026-05-25T12:30:00.000Z'
  });

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

  seedQueueRef(db, {
    killmailId: 700001,
    hash: 'hash_actor_pending',
    discoveredByType: 'actor',
    discoveredById: '90000001',
    sourceActorType: 'character',
    sourceActorId: 90000001,
    status: 'pending'
  });
  seedQueueRef(db, {
    killmailId: 700002,
    hash: 'hash_actor_failed',
    discoveredByType: 'actor',
    discoveredById: '90000001',
    sourceActorType: 'character',
    sourceActorId: 90000001,
    status: 'failed'
  });
  seedQueueRef(db, {
    killmailId: 800001,
    hash: 'hash_system_pending',
    discoveredByType: 'system_radius',
    discoveredById: '30004660',
    sourceSystemId: 30004660,
    status: 'pending'
  });

  seedKillmail(db, 900001, 30004660);
  seedActivityEvent(db, {
    killmailId: 900001,
    eventKey: '900001:attacker:character:90000001',
    role: 'attacker',
    entityType: 'character',
    entityId: 90000001,
    solarSystemId: 30004660
  });
}

function seedActorWatch(db, watchId, input) {
  db.prepare(`
    INSERT INTO watchlist_entities (
      watch_id, entity_type, entity_id, entity_name,
      lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    watchId,
    input.entityType,
    input.entityId,
    input.entityName,
    30,
    50,
    1,
    60,
    null,
    input.nextPollAt || null,
    null,
    input.lastErrorAt || null,
    input.backoffUntil || null,
    'Watch_offline fixture'
  );
}

function seedQueueRef(db, input) {
  db.prepare(`
    INSERT INTO discovered_killmail_refs (
      killmail_id, killmail_hash, discovered_by_type, discovered_by_id,
      source_scope, source_system_id, source_actor_type, source_actor_id,
      discovered_at, first_seen_run_id, last_seen_run_id, last_seen_at,
      status, priority, preview_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.killmailId,
    input.hash,
    input.discoveredByType,
    input.discoveredById,
    input.discoveredById,
    input.sourceSystemId || null,
    input.sourceActorType || null,
    input.sourceActorId || null,
    '2026-05-25T10:00:00.000Z',
    'run_watch_offline_fixture',
    'run_watch_offline_fixture',
    '2026-05-25T10:00:00.000Z',
    input.status,
    1,
    '{}'
  );
}

function seedKillmail(db, killmailId, solarSystemId) {
  db.prepare(`
    INSERT INTO killmails (
      killmail_id, killmail_hash, killmail_time, solar_system_id,
      raw_esi_payload, raw_payload_checksum, source,
      first_seen_at, last_seen_at, ingested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    killmailId,
    `hash_${killmailId}`,
    '2026-05-25T09:00:00.000Z',
    solarSystemId,
    '{}',
    `checksum_${killmailId}`,
    'fixture',
    '2026-05-25T09:01:00.000Z',
    '2026-05-25T09:01:00.000Z',
    '2026-05-25T09:01:00.000Z'
  );
}

function seedActivityEvent(db, input) {
  db.prepare(`
    INSERT INTO activity_events (
      event_key, killmail_id, role, entity_type, entity_id, entity_name,
      character_id, character_name, corporation_id, corporation_name,
      alliance_id, alliance_name, ship_type_id, ship_type_name,
      weapon_type_id, final_blow, damage_done,
      solar_system_id, solar_system_name, region_id, region_name,
      killmail_time, ingested_at, discovered_by_type, discovered_by_id,
      normalizer_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.eventKey,
    input.killmailId,
    input.role,
    input.entityType,
    input.entityId,
    'Fixture Entity',
    input.entityType === 'character' ? input.entityId : null,
    input.entityType === 'character' ? 'Fixture Entity' : null,
    null,
    null,
    null,
    null,
    123,
    'Fixture Ship',
    null,
    1,
    100,
    input.solarSystemId,
    'ZTS-4D',
    10000001,
    'Fixture Region',
    '2026-05-25T09:00:00.000Z',
    '2026-05-25T09:01:00.000Z',
    'actor',
    input.entityId,
    'fixture'
  );
}

function findWatch(readout, watchType, watchId) {
  const watch = readout.watches.find((entry) => entry.watch_type === watchType && entry.watch_id === watchId);
  if (!watch) {
    throw new Error(`Missing ${watchType} watch ${watchId}`);
  }
  return watch;
}

function persistedCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    metadata_runs: count(db, 'metadata_runs'),
    assessment_artifacts: count(db, 'assessment_artifacts')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
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
