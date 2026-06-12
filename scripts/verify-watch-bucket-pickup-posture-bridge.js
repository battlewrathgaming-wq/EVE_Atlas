const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

async function main() {
  verifyRegistrationAndCoverage();

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const before = sideEffectCounts(db);
    const projection = await invokeServiceCommand('watch.bucket_identity_projection.preview', projectionFixtureInput(), {
      db,
      source: 'renderer'
    });
    const externalIoOn = await invokeServiceCommand('watch.bucket_pickup_posture_bridge.preview', {
      externalIoState: 'on',
      bucketIdentityProjection: projection
    }, {
      db,
      source: 'renderer'
    });
    const externalIoOff = await invokeServiceCommand('watch.bucket_pickup_posture_bridge.preview', {
      externalIoState: 'off',
      bucketIdentityProjection: projection
    }, {
      db,
      source: 'renderer'
    });
    const after = sideEffectCounts(db);

    verifyReadOnlyBoundary(externalIoOn);
    verifyReadOnlyBoundary(externalIoOff);
    verifyPickupCases(externalIoOn, externalIoOff);
    assertSame(after, before, 'Watch bucket pickup posture bridge should not mutate persistent tables');
    assert(externalIoOn.table_mutation_proof.unchanged === true, 'External I/O on posture should prove unchanged table counts');
    assert(externalIoOff.table_mutation_proof.unchanged === true, 'External I/O off posture should prove unchanged table counts');

    console.log(JSON.stringify({
      status: 'Watch bucket pickup posture bridge verified',
      command: 'watch.bucket_pickup_posture_bridge.preview',
      external_io_on_summary: externalIoOn.summary,
      external_io_off_summary: externalIoOff.summary,
      sample_eligible: rowByWatch(externalIoOn, 1),
      sample_held: rowByWatch(externalIoOff, 1),
      sample_rejection: rowByWatch(externalIoOn, 2),
      sample_overlap_posture: externalIoOn.independent_overlap_posture[0],
      boundary: externalIoOff.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('Watch bucket pickup posture bridge verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.bucket_pickup_posture_bridge.preview');
  assert(command, 'Watch bucket pickup posture bridge command should be registered');
  assert(command.classification === 'read-only', 'Watch bucket pickup posture bridge should be read-only');
  assert(command.effects.includes('read-only'), 'Watch bucket pickup posture bridge should declare read-only effect');
  assert(command.renderer_allowed === true, 'Watch bucket pickup posture bridge should be renderer eligible');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'watch.bucket_pickup_posture_bridge.preview');
  assert(row?.storage_action_class === 'local_db_inspection', 'pickup posture bridge should be local DB inspection');
  assert(row?.runtime_context === 'watch_bucket_pickup_posture_bridge_readout', 'pickup posture bridge should have readout context');
  assert(row?.external_io_dependency === 'none', 'pickup posture bridge should not depend on External I/O for execution');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'pickup posture bridge should remain non-enforcing proof');
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'watch.bucket_pickup_posture_bridge.preview', 'action should be named');
  assert(preview.fixture_only === true, 'bridge should be fixture-only');
  assert(preview.projection_only === true, 'bridge should be projection-only');
  assert(preview.read_only === true, 'bridge should be read-only');
  assert(preview.mutates_state === false, 'bridge should not mutate state');
  assert(preview.provider_calls === 0, 'bridge should not call providers');
  assert(preview.live_api_calls === 0, 'bridge should not call live APIs');
  assert(preview.provider_packets === 0, 'bridge should not create provider packets');
  assert(preview.discovery_pickup_started === false, 'bridge should not start Discovery pickup');
  assert(preview.discovery_pickup_packets_created === 0, 'bridge should not create Discovery pickup packets');
  assert(preview.pickup_packets_created === 0, 'bridge should not create pickup packets');
  assert(preview.bucket_rows_created === 0, 'bridge should not create bucket rows');
  assert(preview.bucket_rows_persisted === 0, 'bridge should not persist bucket rows');
  assert(preview.durable_bucket_rows_written === 0, 'bridge should not write durable bucket rows');
  assert(preview.watch_run_rows_created === 0, 'bridge should not create Watch run rows');
  assert(preview.fetch_runs_as_bucket_state === false, 'bridge should not use fetch_runs as bucket state');
  assert(preview.discovered_killmail_refs_as_bucket_state === false, 'bridge should not use discovered refs as bucket state');
  assert(preview.candidate_refs_written === 0, 'bridge should not write candidate refs');
  assert(preview.discovered_killmail_refs_written === 0, 'bridge should not write discovered refs');
  assert(preview.discovery_refs_mutated === 0, 'bridge should not mutate Discovery refs');
  assert(preview.evidence_writes === 0, 'bridge should not write Evidence/EVEidence');
  assert(preview.hydration_writes === 0, 'bridge should not write Hydration output');
  assert(preview.metadata_writes === 0, 'bridge should not write metadata');
  assert(preview.observation_created === false, 'bridge should not create Observation');
  assert(preview.api_request_log_writes === 0, 'bridge should not write API logs');
  assert(preview.watch_mutations === 0, 'bridge should not mutate Watch rows');
  assert(preview.cadence_mutations === 0, 'bridge should not mutate cadence');
  assert(preview.watch_executor_tick_called === false, 'bridge should not call Watch executor tick');
  assert(Array.isArray(preview.task_runner_methods_called) && preview.task_runner_methods_called.length === 0, 'bridge should not call TaskRunner');
  assert(preview.collectors_called === false, 'bridge should not call collectors');
  assert(preview.dispatcher_queue_lease_behavior === false, 'bridge should not implement dispatcher/queue/lease');
  assert(preview.schema_changes === 0, 'bridge should not change schema');
  assert(preview.runtime_enforcement_active === false, 'bridge should not activate enforcement');
  assert(preview.command_blocking_active === false, 'bridge should not activate command blocking');
  assert(preview.ui_work === false, 'bridge should not do UI work');
}

function verifyPickupCases(externalIoOn, externalIoOff) {
  const eligible = rowByWatch(externalIoOn, 1);
  assert(eligible.pickup_posture === 'future_pickup_eligible', 'External I/O on candidate should be future pickup eligible');
  assert(eligible.future_pickup_eligible === true, 'External I/O on candidate should set future eligibility');
  assert(eligible.starts_discovery_pickup === false, 'future pickup eligible should not start pickup');
  assert(eligible.discovery_pickup_started === false, 'future pickup eligible should keep Discovery pickup stopped');
  assert(eligible.provider_packets === 0, 'future pickup eligible should create zero provider packets');

  const held = rowByWatch(externalIoOff, 1);
  assert(held.pickup_posture === 'held_by_external_io', 'External I/O off candidate should be held');
  assert(held.held_by_external_io === true, 'External I/O off candidate should set held flag');
  assert(held.watch_emission_failure === false, 'External I/O hold should not be Watch emission failure');
  assert(held.discovery_pickup_started === false, 'External I/O hold should keep Discovery pickup stopped');
  assert(held.provider_packets === 0, 'External I/O hold should create zero provider packets');
  assert(externalIoOff.external_io_posture.future_discovery_pickup_held_when_off === true, 'External I/O posture should disclose pickup hold');

  const duplicate = rowByWatch(externalIoOn, 2);
  assert(duplicate.pickup_posture === 'rejected_before_pickup_posture', 'duplicate-open suppression should not become pickup eligible');
  assert(duplicate.reason === 'duplicate_open_suppression_not_candidate', 'duplicate-open rejection should be explicit');

  const conflict = rowByWatch(externalIoOn, 6);
  assert(conflict.pickup_posture === 'rejected_before_pickup_posture', 'integrity conflict should not become pickup eligible');
  assert(conflict.reason === 'integrity_conflict_not_candidate', 'integrity conflict rejection should be explicit');

  const error = rowByWatch(externalIoOn, 7);
  assert(error.pickup_posture === 'rejected_before_pickup_posture', 'integrity error should not become pickup eligible');
  assert(error.reason === 'integrity_error_not_candidate', 'integrity error rejection should be explicit');

  const invalid = rowByWatch(externalIoOn, 10);
  assert(invalid.pickup_posture === 'rejected_before_pickup_posture', 'invalid stored scope should not become pickup eligible');
  assert(invalid.reason === 'watch_scope_authority_invalid', 'invalid stored scope reason should be preserved');

  const notDue = rowByWatch(externalIoOn, 11);
  assert(notDue.pickup_posture === 'rejected_before_pickup_posture', 'not due rows should not become pickup eligible');
  const inactive = rowByWatch(externalIoOn, 12);
  assert(inactive.pickup_posture === 'rejected_before_pickup_posture', 'inactive rows should not become pickup eligible');
  const backoff = rowByWatch(externalIoOn, 13);
  assert(backoff.pickup_posture === 'rejected_before_pickup_posture', 'backoff rows should not become pickup eligible');

  const overlap = externalIoOn.independent_overlap_posture.find((entry) => entry.left_watch_id === 4 && entry.right_watch_id === 5);
  assert(overlap, 'overlapping candidates from different Watches should have independent pickup posture');
  assert(overlap.suppresses_candidate === false, 'overlap should not suppress candidates');
  assert(overlap.merges_pickup_posture === false, 'overlap should not merge pickup posture');
  assert(overlap.left_pickup_posture === 'future_pickup_eligible', 'left overlapping candidate should remain independently eligible');
  assert(overlap.right_pickup_posture === 'future_pickup_eligible', 'right overlapping candidate should remain independently eligible');

  assert(externalIoOn.summary.future_pickup_eligible_count === 5, 'External I/O on should show five eligible candidates');
  assert(externalIoOn.summary.held_by_external_io_count === 0, 'External I/O on should show zero held candidates');
  assert(externalIoOff.summary.future_pickup_eligible_count === 0, 'External I/O off should show zero eligible candidates');
  assert(externalIoOff.summary.held_by_external_io_count === 5, 'External I/O off should hold five candidates');
  assert(externalIoOn.summary.rejected_before_pickup_count >= 8, 'non-candidate rows should be rejected before pickup');
  assert(externalIoOn.accepted_model.pickup_eligible_does_not_start_discovery === true, 'eligibility should not imply pickup start');
  assert(externalIoOn.accepted_model.held_by_external_io_is_provider_movement_hold_not_watch_emission_failure === true, 'External I/O hold should be movement hold');
  assert(externalIoOn.accepted_model.provider_packet_count_remains_zero === true, 'provider packets should remain zero');
  assert(externalIoOn.accepted_model.bucket_rows_persisted_remains_zero === true, 'bucket rows should remain zero');
}

function projectionFixtureInput() {
  return {
    externalIoState: 'off',
    watchRunStubs: [
      stub(1, [30003597, 30003599], { watchRunId: 'run-001' }),
      stub(2, [30003597, 30003599], { watchRunId: 'run-002' }),
      stub(3, [30003597, 30003601], { watchRunId: 'run-003', missedIntervals: 4 }),
      stub(4, [30003597, 30003599], { watchRunId: 'run-004' }),
      stub(5, [30003599, 30003601], { watchRunId: 'run-005' }),
      stub(6, [30003597, 30003599], { watchRunId: 'run-006' }),
      stub(7, [30003597, 30003599], { watchRunId: 'shared-run-mismatch' }),
      stub(9, [30003597, 30003599], { watchRunId: 'run-009' }),
      stub(10, [], { watchRunId: 'run-010', emitsValid: false, noCandidateReason: 'watch_scope_authority_invalid' }),
      stub(11, [30003597], { watchRunId: 'run-011', emitsValid: false, noCandidateReason: 'not_due' }),
      stub(12, [30003597], { watchRunId: 'run-012', emitsValid: false, noCandidateReason: 'inactive' }),
      stub(13, [30003597], { watchRunId: 'run-013', emitsValid: false, noCandidateReason: 'backoff' })
    ],
    existingOpenStubs: [
      existingOpen(2, [30003597, 30003599], { watchRunId: 'run-002' }),
      existingOpen(6, [30003601], { watchRunId: 'run-006-open' }),
      existingOpen(8, [30003601], { watchRunId: 'shared-run-mismatch' })
    ]
  };
}

function stub(watchId, includedSystemIds, options = {}) {
  return {
    input_stub_id: `stub-${watchId}`,
    watch_id: watchId,
    watch_run_id: options.watchRunId,
    source_kind: 'watch_system_radius',
    emits_valid_stub: options.emitsValid ?? true,
    no_candidate_reason: options.noCandidateReason || null,
    accepted_scope: {
      execution_authority: 'stored_included_system_ids',
      included_system_ids: includedSystemIds,
      center_system_id: 30003597,
      radius_jumps: 1,
      center_radius_is_provenance_only: true
    },
    window: {
      lookback_seconds: 86400,
      due_at: '2026-06-12T12:00:00.000Z',
      emitted_at: '2026-06-12T12:00:00.000Z'
    },
    provenance: {
      source_intent: 'Watch/system-radius',
      scope_provenance: 'system_watches.included_system_ids',
      watch_scope_key: `system:${watchId}:fixture`,
      center_radius_role: 'provenance_and_explanation'
    },
    missed_intervals: options.missedIntervals || 0
  };
}

function existingOpen(watchId, includedSystemIds, options = {}) {
  return {
    fixture_open_id: `existing-open-${watchId}`,
    ...stub(watchId, includedSystemIds, {
      watchRunId: options.watchRunId
    })
  };
}

function rowByWatch(preview, watchId) {
  const row = preview.pickup_posture_rows.find((entry) => Number(entry.watch_id) === Number(watchId));
  assert(row, `watch ${watchId} should be present`);
  return row;
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
    ingestion_audits: count(db, 'ingestion_audits'),
    assessment_artifacts: count(db, 'assessment_artifacts'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches')
  };
}

function count(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count || 0);
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
