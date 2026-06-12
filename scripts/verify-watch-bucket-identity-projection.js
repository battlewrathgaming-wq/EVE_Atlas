const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

async function main() {
  verifyRegistrationAndCoverage();

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const before = sideEffectCounts(db);
    const preview = await invokeServiceCommand('watch.bucket_identity_projection.preview', fixtureInput(), {
      db,
      source: 'renderer'
    });
    const after = sideEffectCounts(db);

    verifyReadOnlyBoundary(preview);
    verifyProjectionCases(preview);
    assertSame(after, before, 'Watch bucket identity projection should not mutate persistent tables');
    assert(preview.table_mutation_proof.unchanged === true, 'projection should prove unchanged table counts');

    console.log(JSON.stringify({
      status: 'Watch bucket identity projection verified',
      command: 'watch.bucket_identity_projection.preview',
      summary: preview.summary,
      sample_candidate: byWatch(preview, 1).projected_bucket_candidate,
      sample_suppression: byWatch(preview, 2),
      sample_overlap: preview.allowed_overlaps[0],
      sample_integrity_conflict: byWatch(preview, 6),
      sample_integrity_error: byWatch(preview, 7),
      external_io_posture: preview.external_io_posture,
      candidate_ref_killmail_overlap_principle: preview.candidate_ref_killmail_overlap_principle
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('Watch bucket identity projection verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.bucket_identity_projection.preview');
  assert(command, 'Watch bucket identity projection command should be registered');
  assert(command.classification === 'read-only', 'Watch bucket identity projection should be read-only');
  assert(command.effects.includes('read-only'), 'Watch bucket identity projection should declare read-only effect');
  assert(command.renderer_allowed === true, 'Watch bucket identity projection should be renderer eligible');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'watch.bucket_identity_projection.preview');
  assert(row?.storage_action_class === 'local_db_inspection', 'bucket identity projection should be local DB inspection');
  assert(row?.runtime_context === 'watch_bucket_identity_projection_readout', 'bucket identity projection should have readout context');
  assert(row?.external_io_dependency === 'none', 'bucket identity projection should not depend on External I/O');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'bucket identity projection should remain non-enforcing proof');
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'watch.bucket_identity_projection.preview', 'action should be named');
  assert(preview.fixture_only === true, 'projection should be fixture-only');
  assert(preview.projection_only === true, 'projection should be projection-only');
  assert(preview.read_only === true, 'projection should be read-only');
  assert(preview.mutates_state === false, 'projection should not mutate state');
  assert(preview.provider_calls === 0, 'projection should not call providers');
  assert(preview.live_api_calls === 0, 'projection should not call live APIs');
  assert(preview.provider_packets === 0, 'projection should not create provider packets');
  assert(preview.discovery_pickup_started === false, 'projection should not start Discovery pickup');
  assert(preview.discovery_pickup_packets_created === 0, 'projection should not create Discovery pickup packets');
  assert(preview.bucket_rows_created === 0, 'projection should not create bucket rows');
  assert(preview.bucket_rows_persisted === 0, 'projection should not persist bucket rows');
  assert(preview.durable_bucket_rows_written === 0, 'projection should not write durable bucket rows');
  assert(preview.watch_run_rows_created === 0, 'projection should not create Watch run rows');
  assert(preview.fetch_runs_as_bucket_state === false, 'projection should not use fetch_runs as bucket state');
  assert(preview.discovered_killmail_refs_as_bucket_state === false, 'projection should not use discovered refs as bucket state');
  assert(preview.discovered_killmail_refs_written === 0, 'projection should not write discovered refs');
  assert(preview.discovery_refs_mutated === 0, 'projection should not mutate Discovery refs');
  assert(preview.evidence_writes === 0, 'projection should not write Evidence/EVEidence');
  assert(preview.hydration_writes === 0, 'projection should not write Hydration output');
  assert(preview.metadata_writes === 0, 'projection should not write metadata');
  assert(preview.observation_created === false, 'projection should not create Observation');
  assert(preview.api_request_log_writes === 0, 'projection should not write API logs');
  assert(preview.watch_mutations === 0, 'projection should not mutate Watch rows');
  assert(preview.cadence_mutations === 0, 'projection should not mutate cadence');
  assert(preview.watch_executor_tick_called === false, 'projection should not call Watch executor tick');
  assert(Array.isArray(preview.task_runner_methods_called) && preview.task_runner_methods_called.length === 0, 'projection should not call TaskRunner');
  assert(preview.collectors_called === false, 'projection should not call collectors');
  assert(preview.dispatcher_queue_lease_behavior === false, 'projection should not implement dispatcher/queue/lease');
  assert(preview.schema_changes === 0, 'projection should not change schema');
  assert(preview.runtime_enforcement_active === false, 'projection should not activate enforcement');
  assert(preview.command_blocking_active === false, 'projection should not activate command blocking');
  assert(preview.ui_work === false, 'projection should not do UI work');
}

function verifyProjectionCases(preview) {
  const candidate = byWatch(preview, 1);
  assert(candidate.projection_status === 'projected_bucket_candidate', 'due valid Watch with no open stub should project candidate');
  assert(candidate.projected_bucket_candidate.candidate_language === 'projected_candidate_fixture_only', 'candidate should use projection language');
  assert(candidate.projected_bucket_candidate.candidate_is_schema === false, 'candidate should not imply schema');
  assert(candidate.projected_bucket_candidate.candidate_is_durable_row === false, 'candidate should not imply durable row');
  assert(candidate.projected_bucket_candidate.bucket_identity.identity_basis === 'watch_run_based', 'bucket identity should be Watch-run based');
  assert(candidate.projected_bucket_candidate.bucket_identity.system_id_identity_rejected === true, 'system ID identity should be rejected');

  const suppressed = byWatch(preview, 2);
  assert(suppressed.projection_status === 'duplicate_open_stub_suppressed', 'same Watch existing open stub should suppress projection');
  assert(suppressed.duplicate_open_suppressed === true, 'suppression should be explicit');
  assert(suppressed.reason === 'existing_open_stub_for_same_watch', 'suppression reason should name existing open stub');
  assert(suppressed.candidate_count === 0, 'suppression should emit no candidate');

  const stale = byWatch(preview, 3);
  assert(stale.projection_status === 'projected_bucket_candidate', 'stale due Watch should still project one current candidate');
  assert(stale.missed_intervals === 4, 'stale fixture should carry missed interval count');
  assert(stale.missed_intervals_collapsed_to_current_candidate === true, 'missed intervals should collapse');
  assert(stale.catch_up_candidates_created === 0, 'stale Watch should not create catch-up candidates');

  const overlapA = byWatch(preview, 4);
  const overlapB = byWatch(preview, 5);
  assert(overlapA.projection_status === 'projected_bucket_candidate', 'first overlapping Watch should project');
  assert(overlapB.projection_status === 'projected_bucket_candidate', 'second overlapping Watch should project');
  const namedOverlap = preview.allowed_overlaps.find((entry) => entry.left_watch_id === 4 && entry.right_watch_id === 5);
  assert(namedOverlap, 'overlapping included systems should be reported for watches 4 and 5');
  assertSame(namedOverlap.shared_system_ids, [30003599], 'overlap should name shared system');
  assert(namedOverlap.suppresses_candidate === false, 'overlap should not suppress candidates');

  const conflict = byWatch(preview, 6);
  assert(conflict.projection_status === 'integrity_conflict', 'same Watch mismatched open scope should conflict');
  assert(conflict.reason === 'same_watch_existing_open_scope_or_provenance_mismatch', 'conflict reason should name mismatched open scope/provenance');
  assert(conflict.conflict_fields.includes('scope_fingerprint'), 'conflict should include scope mismatch');
  assert(conflict.candidate_count === 0, 'conflict should emit no candidate');

  const integrity = byWatch(preview, 7);
  assert(integrity.projection_status === 'integrity_error', 'same watch_run_id mismatch should be integrity error');
  assert(integrity.reason === 'same_watch_run_id_mismatched_identity', 'integrity error should name watch_run_id mismatch');
  assert(preview.integrity_errors.some((entry) => entry.reason === 'same_watch_run_id_mismatched_watch_scope_window_or_provenance'), 'top-level same-run mismatch should be reported');

  const externalIo = byWatch(preview, 9);
  assert(externalIo.projection_status === 'projected_bucket_candidate', 'External I/O closed should still allow Watch bucket candidate projection');
  assert(preview.external_io_posture.state === 'off', 'fixture should represent External I/O closed');
  assert(preview.external_io_posture.watch_bucket_candidate_projection_blocked === false, 'External I/O should not block Watch projection');
  assert(preview.external_io_posture.provider_packets === 0, 'External I/O closed should still report zero provider packets');
  assert(preview.external_io_posture.discovery_pickup_started === false, 'External I/O closed should not start Discovery pickup');

  assertNoCandidate(preview, 10, 'watch_scope_authority_invalid');
  assertNoCandidate(preview, 11, 'not_due');
  assertNoCandidate(preview, 12, 'inactive');
  assertNoCandidate(preview, 13, 'backoff');

  assert(preview.candidate_ref_killmail_overlap_principle.principle_only === true, 'candidate ref / killmail overlap should be principle-only');
  assert(preview.candidate_ref_killmail_overlap_principle.candidate_refs_written === 0, 'principle should not write candidate refs');
  assert(preview.candidate_ref_killmail_overlap_principle.evidence_rows_written === 0, 'principle should not write Evidence');
  assert(preview.candidate_ref_killmail_overlap_principle.provenance_table_claimed === false, 'principle should not claim provenance table');
  assert(preview.candidate_ref_killmail_overlap_principle.discovered_killmail_refs_as_pre_acquisition_bucket === false, 'discovered refs should not be bucket state');

  assert(preview.summary.projected_bucket_candidate_count === 5, 'summary should count five projected candidates');
  assert(preview.summary.duplicate_open_suppression_count === 1, 'summary should count one suppression');
  assert(preview.summary.integrity_conflict_count === 1, 'summary should count one conflict');
  assert(preview.summary.rejected_stub_count === 4, 'summary should count four no-candidate stubs');
  assert(preview.accepted_model.existing_open_state_source === 'fixture_input_only', 'existing open state should be fixture-only');
  assert(preview.accepted_model.external_io_blocks_provider_pickup_not_watch_projection === true, 'External I/O should be post-Watch projection posture');
  assert(preview.accepted_model.schema_accepted_by_this_projection === false, 'projection should not accept schema');
}

function assertNoCandidate(preview, watchId, reason) {
  const row = byWatch(preview, watchId);
  assert(row.projection_status === 'no_candidate', `watch ${watchId} should emit no candidate`);
  assert(row.no_candidate_reason === reason || row.reason === reason, `watch ${watchId} should report ${reason}`);
  assert(row.candidate_count === 0, `watch ${watchId} candidate count should be zero`);
}

function fixtureInput() {
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
    ],
    candidateRefKillmailOverlapFixture: {
      principleOnly: true,
      overlappingKillmailId: 990001
    }
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

function byWatch(preview, watchId) {
  const row = preview.projection_rows.find((entry) => Number(entry.watch_id) === Number(watchId));
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
