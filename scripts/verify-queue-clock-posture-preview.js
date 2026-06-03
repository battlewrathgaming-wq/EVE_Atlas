const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildQueueClockPosturePreview } = require('../src/main/services/queueClockPostureService');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');
const { projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedFixture(db);
    const before = sideEffectCounts(db);
    const preview = await invokeServiceCommand('runtime.queue_clock_posture.preview', {
      now: '2026-06-03T10:00:00.000Z',
      limit: 8,
      external_io: {
        state: 'on',
        path: 'C:\\renderer-forged-external-io.json'
      },
      storage: {
        storagePreflight: fixturePreflight({
          path: path.join(projectRoot(), '.tmp', 'queue-clock-posture', 'atlas.sqlite'),
          exists: true
        }),
        storageAuthority: {
          mode: 'selected_storage',
          selected: true,
          config_source: 'fixture_selected_storage',
          config_version: 1,
          budget_source: 'fixture_configured',
          budget_bytes: 4096
        }
      }
    }, {
      db,
      source: 'renderer',
      allowStorageSetupGateFixtureInput: true,
      storageBudgetBytes: 4096
    });
    const after = sideEffectCounts(db);

    verifyReadOnlyBoundary(preview);
    verifyQueueAndClockShape(preview);
    verifyWatchScopeSignals(preview);
    verifyRegistrationAndCoverage();
    assertSame(after, before, 'queue/clock posture preview should not mutate persistent tables');

    const direct = buildQueueClockPosturePreview(db, {
      now: '2026-06-03T10:00:00.000Z',
      external_io: { state: 'on' },
      storage: {
        storagePreflight: fixturePreflight({
          path: path.join(projectRoot(), '.tmp', 'queue-clock-posture-direct', 'atlas.sqlite'),
          exists: true
        }),
        storageAuthority: {
          mode: 'selected_storage',
          selected: true,
          config_source: 'fixture_selected_storage',
          budget_source: 'fixture_configured',
          budget_bytes: 4096
        }
      }
    }, {
      db,
      allowStorageSetupGateFixtureInput: true,
      storageBudgetBytes: 4096,
      externalIoState: 'on'
    });
    assert(direct.read_only === true, 'direct builder should be read-only');
    assert(direct.restart_policy.no_catch_up_flood_after_external_io_reenable === true, 'direct builder should preserve no catch-up flood');

    console.log(JSON.stringify({
      status: 'queue/clock posture preview verified',
      action: preview.action,
      summary: preview.summary,
      discovery_refs: {
        pending_or_failed_refs: preview.discovery_refs.pending_or_failed_refs,
        esi_expansion_candidates: preview.discovery_refs.esi_expansion_candidates,
        pending_refs_preferred_before_fresh_zkill: preview.discovery_refs.pending_refs_preferred_before_fresh_zkill
      },
      next_safe_actions: preview.next_safe_actions,
      gates: preview.gates,
      restart_policy: preview.restart_policy,
      mutation_check: {
        before,
        after,
        unchanged: JSON.stringify(before) === JSON.stringify(after)
      },
      boundary: preview.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('queue/clock posture preview verified');
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'runtime.queue_clock_posture.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should be read-only');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.queue_dispatches === 0, 'preview should not dispatch queue work');
  assert(preview.discovery_ref_mutations === 0, 'preview should not mutate Discovery refs');
  assert(preview.evidence_writes === 0, 'preview should not write Evidence/EVEidence');
  assert(preview.hydration_writes === 0, 'preview should not write Hydration output');
  assert(preview.watch_mutations === 0, 'preview should not arm or mutate Watch');
  assert(preview.persisted_sequencer_packets === false, 'preview should not persist sequencer packets');
  assert(preview.provider_work_queue_created === false, 'preview should not create provider work queue');
  assert(preview.dispatcher_added === false, 'preview should not add dispatcher');
  assert(preview.schema_changes === false, 'preview should not change schema');
  assert(preview.runtime_enforcement_active === false, 'preview should not activate enforcement');
  assert(preview.command_blocking_active === false, 'preview should not activate command blocking');
  assert(preview.ui_work === false, 'preview should not add UI');
}

function verifyQueueAndClockShape(preview) {
  assert(preview.discovery_refs.possible_leads_not_evidence === true, 'Discovery refs should remain possible leads');
  assert(preview.discovery_refs.pending_or_failed_refs >= 2, 'preview should count pending/failed Discovery refs');
  assert(preview.discovery_refs.esi_expansion_candidates >= 2, 'preview should compute ESI expansion candidates from local refs');
  assert(preview.discovery_refs.pending_refs_preferred_before_fresh_zkill === true, 'pending refs should be preferred before fresh zKill');
  assert(preview.clocks.acquisition_clock.discovery_refs_are_possible_leads === true, 'acquisition clock should preserve Discovery boundary');
  assert(preview.clocks.acquisition_clock.preview_creates_evidence === false, 'acquisition clock preview should not create evidence');
  assert(preview.clocks.hydration_recovery_clock.hydration_is_readability_only === true, 'Hydration clock should be readability only');
  assert(preview.clocks.hydration_recovery_clock.preview_hydration_writes === 0, 'Hydration clock should not write');
  assert(preview.summary.local_only_available_work > 0, 'preview should expose local available work');
  assert(preview.summary.provider_backed_work > 0, 'preview should expose provider-backed work');
  assert(preview.summary.held_by_external_io >= 1, 'renderer-forged External I/O state should remain held/off');
  assert(preview.summary.watch_session_arming_required >= 1, 'Watch/background lane should expose session arming requirement');
  assert(preview.restart_policy.no_catch_up_flood_after_restart === true, 'restart should not flood catch-up work');
  assert(preview.restart_policy.no_catch_up_flood_after_storage_unlock === true, 'storage unlock should not flood catch-up work');
  assert(preview.restart_policy.no_catch_up_flood_after_external_io_reenable === true, 'External I/O re-enable should not flood catch-up work');

  const acquisition = new Map(preview.clocks.acquisition_clock.lanes.map((lane) => [lane.lane_id, lane]));
  const hydration = new Map(preview.clocks.hydration_recovery_clock.lanes.map((lane) => [lane.lane_id, lane]));
  assert(acquisition.get('zkill_discovery').posture === 'local_only_available', 'zKill lane should prefer local pending refs before fresh provider discovery');
  assert(acquisition.get('esi_evidence_expansion').posture === 'held_by_external_io', 'ESI expansion should be held by External I/O off');
  assert(acquisition.get('esi_evidence_expansion').preview_creates_evidence === false, 'ESI lane preview should not create evidence');
  assert(hydration.get('view_local_record_hydration').posture === 'held_by_external_io', 'view/local provider-needed hydration should be held by External I/O');
  assert(hydration.get('view_local_record_hydration').hydration_context.runtime_summary.provider_needed_labels >= 1, 'view/local lane should expose provider-needed labels');
  assert(hydration.get('watch_background_hydration').posture === 'watch_session_arm_required', 'Watch/background hydration should show arming as a distinct requirement');
  assert(hydration.get('watch_background_hydration').reason_codes.includes('held_by_external_io'), 'Watch/background lane should still show External I/O hold separately');
}

function verifyWatchScopeSignals(preview) {
  const watches = preview.watch_offline_restart.watches;
  assert(watches.some((watch) => watch.reconstructed_scope?.scope_status === 'valid'), 'valid stored radius scope should be distinguished');
  assert(watches.some((watch) => watch.reconstructed_scope?.scope_status === 'not_stored'), 'missing stored radius scope should be distinguished');
  assert(watches.some((watch) => watch.reconstructed_scope?.scope_status === 'malformed'), 'malformed stored radius scope should be distinguished');
  assert(watches.some((watch) => watch.missed_slot?.present === true && watch.missed_slot.recoverable === true), 'missed-slot recoverability should be visible');
  assert(watches.some((watch) => watch.orphaned_run?.present === true), 'orphaned run signal should be visible');
  assert(watches.some((watch) => watch.provider_deferral?.present === true), 'provider deferral/wait signal should be visible');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'runtime.queue_clock_posture.preview');
  assert(command, 'queue/clock posture command should be registered');
  assert(command.classification === 'read-only', 'queue/clock posture command should be read-only');
  assert(command.effects.includes('read-only'), 'queue/clock posture command should declare read-only effect');
  assert(command.renderer_allowed === true, 'queue/clock posture command should be renderer eligible as a readout');
  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'runtime.queue_clock_posture.preview');
  assert(row?.runtime_context === 'queue_clock_posture_readout', 'queue/clock posture command should have coverage metadata');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'queue/clock posture command should remain non-enforcing proof');
}

function seedFixture(db) {
  seedQueueRef(db, {
    killmailId: 910001,
    hash: 'hash_pending',
    status: 'pending',
    discoveredByType: 'manual_actor',
    discoveredById: 'character:90000001',
    sourceActorType: 'character',
    sourceActorId: 90000001
  });
  seedQueueRef(db, {
    killmailId: 910002,
    hash: 'hash_failed',
    status: 'failed',
    discoveredByType: 'manual_actor',
    discoveredById: 'character:90000001',
    sourceActorType: 'character',
    sourceActorId: 90000001
  });
  seedQueueRef(db, {
    killmailId: 910003,
    hash: 'hash_expanded',
    status: 'expanded',
    discoveredByType: 'manual_actor',
    discoveredById: 'character:90000001',
    sourceActorType: 'character',
    sourceActorId: 90000001
  });

  seedActorWatch(db, 1, 90000001, 'Due Pending Pilot');
  seedActorWatch(db, 2, 90000002, 'Missed Pilot', {
    nextPollAt: '2026-06-03T09:00:00.000Z',
    lastPolledAt: '2026-06-03T08:00:00.000Z'
  });
  seedActorWatch(db, 3, 90000003, 'Orphan Pilot');
  seedActorWatch(db, 4, 90000004, 'Deferred Pilot');
  seedSystemWatch(db, 1, 30000101, 'VALID-SCOPE', '[30000101,30000102]');
  seedSystemWatch(db, 2, 30000103, 'NO-SCOPE', '[]');
  seedSystemWatch(db, 3, 30000104, 'BAD-SCOPE', 'not-json');
  seedQueueRef(db, {
    killmailId: 910004,
    hash: 'hash_system_pending',
    status: 'pending',
    discoveredByType: 'system_radius',
    discoveredById: '30000101',
    sourceSystemId: 30000101
  });

  seedFetchRun(db, {
    runId: 'run_orphan',
    watchType: 'actor',
    watchId: 'character:90000003',
    startedAt: '2026-06-03T08:10:00.000Z',
    status: 'running'
  });
  seedFetchRun(db, {
    runId: 'run_deferred',
    watchType: 'actor',
    watchId: 'character:90000004',
    startedAt: '2026-06-03T08:20:00.000Z',
    finishedAt: '2026-06-03T08:21:00.000Z',
    status: 'success'
  });
  seedApiLog(db, {
    requestId: 'request_deferred',
    runId: 'run_deferred',
    provider: 'esi',
    endpoint: 'fixture://esi/deferred',
    statusCode: 429,
    requestedAt: '2026-06-03T08:20:30.000Z'
  });
  seedWarning(db, {
    warningId: 'warning_deferred',
    runId: 'run_deferred',
    warningType: 'provider_capacity_deferred',
    message: 'fixture provider wait',
    createdAt: '2026-06-03T08:20:31.000Z'
  });

  db.prepare(`
    INSERT INTO type_metadata (
      type_id, type_name, group_id, group_name, category_id, category_name, last_fetched
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(603, 'Merlin', 25, 'Frigate', 6, 'Ship', '2026-06-01T00:00:00Z');
  seedKillmail(db, 920001, 30000101);
  seedActivityEvent(db, {
    killmailId: 920001,
    eventKey: '920001:attacker:90000005',
    entityId: 90000005,
    characterId: 90000005,
    corporationId: 98000005,
    shipTypeId: 999999,
    weaponTypeId: 603,
    solarSystemId: 30000101,
    discoveredByType: 'actor',
    discoveredById: '90000001'
  });
}

function seedActorWatch(db, watchId, entityId, name, input = {}) {
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
    'character',
    entityId,
    name,
    30,
    5,
    1,
    60,
    input.lastPolledAt || null,
    input.nextPollAt || null,
    null,
    null,
    null,
    'queue clock fixture'
  );
}

function seedSystemWatch(db, watchId, systemId, systemName, includedScope) {
  db.prepare(`
    INSERT INTO system_watches (
      watch_id, center_system_id, center_system_name, radius_jumps,
      included_system_ids, excluded_system_ids,
      lookback_hours, max_systems_per_run, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(watchId, systemId, systemName, 1, includedScope, '[]', 24, 2, 5, 1, 60, null, null, null, null, null, 'queue clock fixture');
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
    '2026-06-03T08:00:00.000Z',
    'run_queue_clock_fixture',
    'run_queue_clock_fixture',
    '2026-06-03T08:00:00.000Z',
    input.status,
    1,
    '{}'
  );
}

function seedFetchRun(db, input) {
  db.prepare(`
    INSERT INTO fetch_runs (
      run_id, trigger, watch_type, watch_id, started_at, finished_at, status,
      discovered_refs, already_cached, expanded_new, failed_expansions,
      activity_events_written, api_calls_zkill, api_calls_esi, duration_ms,
      error_summary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.runId,
    'fixture',
    input.watchType,
    input.watchId,
    input.startedAt,
    input.finishedAt || null,
    input.status,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    null,
    null
  );
}

function seedApiLog(db, input) {
  db.prepare(`
    INSERT INTO api_request_logs (
      request_id, run_id, run_type, provider, endpoint, method, status_code,
      duration_ms, cache_status, retry_count, rate_limited, error_message,
      requested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.requestId,
    input.runId,
    'collection',
    input.provider,
    input.endpoint,
    'GET',
    input.statusCode,
    1,
    'miss',
    0,
    input.statusCode === 429 ? 1 : 0,
    input.statusCode === 429 ? 'fixture provider wait' : null,
    input.requestedAt
  );
}

function seedWarning(db, input) {
  db.prepare(`
    INSERT INTO data_quality_warnings (
      warning_id, run_id, killmail_id, warning_type, message, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(input.warningId, input.runId, null, input.warningType, input.message, input.createdAt);
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
    '2026-06-03T08:30:00.000Z',
    solarSystemId,
    '{}',
    `checksum_${killmailId}`,
    'fixture',
    '2026-06-03T08:31:00.000Z',
    '2026-06-03T08:31:00.000Z',
    '2026-06-03T08:31:00.000Z'
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
    'attacker',
    'character',
    input.entityId,
    null,
    input.characterId,
    null,
    input.corporationId,
    null,
    null,
    null,
    input.shipTypeId,
    null,
    input.weaponTypeId,
    1,
    500,
    input.solarSystemId,
    null,
    10000001,
    null,
    '2026-06-03T08:30:00.000Z',
    '2026-06-03T08:31:00.000Z',
    input.discoveredByType,
    input.discoveredById,
    'fixture'
  );
}

function fixturePreflight({ path: dbPath, exists }) {
  return {
    action: 'storage.authority_preflight',
    read_only: true,
    mutates_state: false,
    database: {
      path: dbPath,
      source: 'configured',
      mode: 'configured',
      mode_flags: {
        configured: true,
        fallback: false,
        missing: !exists,
        outside_policy: false,
        demo_fixture: false
      },
      parent: {
        path: path.dirname(dbPath),
        exists: true,
        is_directory: true
      },
      exists: exists === true,
      total_bytes: 128
    },
    snapshot: {
      settings: {
        status: 'ready'
      }
    },
    byte_usage: {
      database_bytes: 128,
      known_controlled_locations_bytes: 256
    }
  };
}

function sideEffectCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    metadata_runs: count(db, 'metadata_runs'),
    assessment_artifacts: count(db, 'assessment_artifacts'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
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
