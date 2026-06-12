const fs = require('node:fs');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

async function main() {
  verifyRegistrationAndCoverage();
  verifyProductSchemaUntouched();

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const before = sideEffectCounts(db);
    const projection = await invokeServiceCommand('watch.bucket_identity_projection.preview', projectionFixtureInput(), {
      db,
      source: 'renderer'
    });
    const proof = await invokeServiceCommand('watch.bucket_disposable_persistence_fixture.preview', persistenceFixtureInput(projection), {
      db,
      source: 'renderer'
    });
    const after = sideEffectCounts(db);

    verifyBoundary(proof);
    verifyPersistenceCases(proof);
    assertSame(after, before, 'disposable Watch bucket persistence proof should not mutate product tables');
    assert(proof.boundary_table_check.unchanged === true, 'boundary table check should prove unchanged table counts');

    console.log(JSON.stringify({
      status: 'Watch bucket disposable persistence fixture verified',
      command: 'watch.bucket_disposable_persistence_fixture.preview',
      summary: proof.summary,
      external_io_posture: proof.external_io_posture,
      sample_insert: resultByWatchRun(proof, 'run-001'),
      sample_idempotent: resultByCandidate(proof, 'duplicate-same-watch-same-identity'),
      sample_conflict: resultByCandidate(proof, 'same-watch-different-identity'),
      sample_integrity_error: resultByCandidate(proof, 'same-run-mismatched-provenance'),
      sample_overlap: proof.overlapping_fixture_rows[0],
      boundary_table_check: proof.boundary_table_check
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('Watch bucket disposable persistence fixture verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.bucket_disposable_persistence_fixture.preview');
  assert(command, 'Watch bucket disposable persistence fixture command should be registered');
  assert(command.classification === 'read-only', 'Watch bucket disposable persistence fixture should be read-only to operator corpus');
  assert(command.effects.includes('read-only'), 'Watch bucket disposable persistence fixture should declare read-only effect');
  assert(command.renderer_allowed === true, 'Watch bucket disposable persistence fixture should be renderer eligible');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'watch.bucket_disposable_persistence_fixture.preview');
  assert(row?.storage_action_class === 'local_db_inspection', 'disposable persistence fixture should be local DB inspection');
  assert(row?.runtime_context === 'watch_bucket_disposable_persistence_fixture_readout', 'disposable persistence fixture should have readout context');
  assert(row?.external_io_dependency === 'none', 'disposable persistence fixture should not depend on External I/O');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'disposable persistence fixture should remain non-enforcing proof');
}

function verifyProductSchemaUntouched() {
  const schema = fs.readFileSync('src/main/db/schema.sql', 'utf8');
  assert(!/disposable_bucket/i.test(schema), 'product schema should not contain disposable fixture bucket table names');
}

function verifyBoundary(proof) {
  assert(proof.action === 'watch.bucket_disposable_persistence_fixture.preview', 'action should be named');
  assert(proof.fixture_only === true, 'proof should be fixture-only');
  assert(proof.disposable_only === true, 'proof should be disposable-only');
  assert(proof.read_only_to_operator_corpus === true, 'proof should be read-only to operator corpus');
  assert(proof.read_only === true, 'proof should be service read-only');
  assert(proof.mutates_state === false, 'proof should not mutate service state');
  assert(proof.product_schema_used === false, 'proof should not use product schema');
  assert(proof.product_schema_updated === false, 'proof should not update product schema');
  assert(proof.fixture_schema_accepted_as_product_schema === false, 'fixture schema should not be accepted as product schema');
  assert(proof.operator_corpus_mutated === false, 'proof should not mutate operator corpus');
  assert(proof.provider_calls === 0, 'proof should not call providers');
  assert(proof.live_api_calls === 0, 'proof should not call live APIs');
  assert(proof.provider_packets === 0, 'proof should not create provider packets');
  assert(proof.discovery_pickup_started === false, 'proof should not start Discovery pickup');
  assert(proof.discovery_pickup_packets_created === 0, 'proof should not create Discovery pickup packets');
  assert(proof.pickup_packets_created === 0, 'proof should not create pickup packets');
  assert(proof.candidate_refs_written === 0, 'proof should not write candidate refs');
  assert(proof.discovered_killmail_refs_written === 0, 'proof should not write discovered refs');
  assert(proof.discovery_refs_mutated === 0, 'proof should not mutate Discovery refs');
  assert(proof.evidence_writes === 0, 'proof should not write Evidence/EVEidence');
  assert(proof.hydration_writes === 0, 'proof should not write Hydration');
  assert(proof.observation_created === false, 'proof should not create Observation');
  assert(proof.api_request_log_writes === 0, 'proof should not write API logs');
  assert(proof.data_quality_warning_writes === 0, 'proof should not write warnings');
  assert(proof.watch_mutations === 0, 'proof should not mutate Watch rows');
  assert(proof.cadence_mutations === 0, 'proof should not mutate cadence');
  assert(proof.watch_executor_tick_called === false, 'proof should not call Watch executor tick');
  assert(Array.isArray(proof.task_runner_methods_called) && proof.task_runner_methods_called.length === 0, 'proof should not call TaskRunner');
  assert(proof.collectors_called === false, 'proof should not call collectors');
  assert(proof.dispatcher_queue_lease_behavior === false, 'proof should not implement dispatcher/queue/lease');
  assert(proof.schema_changes === 0, 'proof should not change schema');
  assert(proof.durable_bucket_rows_written === 0, 'proof should not write durable bucket rows');
  assert(proof.fetch_runs_as_bucket_state === false, 'proof should not use fetch_runs as bucket state');
  assert(proof.discovered_killmail_refs_as_bucket_state === false, 'proof should not use discovered refs as bucket state');
  assert(proof.runtime_enforcement_active === false, 'proof should not activate enforcement');
  assert(proof.ui_work === false, 'proof should not do UI work');
}

function verifyPersistenceCases(proof) {
  assert(proof.summary.disposable_open_row_count === 5, 'fixture should end with five open disposable rows');
  assert(proof.summary.inserted_count === 5, 'fixture should insert five unique open rows');
  assert(proof.summary.idempotent_noop_count === 1, 'duplicate same Watch/same identity should be idempotent');
  assert(proof.summary.integrity_conflict_count === 1, 'same Watch/different identity should conflict');
  assert(proof.summary.integrity_error_count === 1, 'same watch_run_id mismatched identity should error');
  assert(proof.summary.rejected_before_persistence_count === 4, 'invalid/not-due/inactive/backoff rows should not persist');
  assert(proof.summary.stale_current_open_row_count === 1, 'stale missed intervals should create one current open row');
  assert(proof.summary.catch_up_rows_created === 0, 'stale missed intervals should create zero catch-up rows');
  assert(proof.summary.overlapping_open_row_pairs > 0, 'overlapping different Watch rows should coexist');
  assert(proof.external_io_posture.state === 'off', 'fixture should run with External I/O off');
  assert(proof.external_io_posture.disposable_persistence_blocked === false, 'External I/O off should not block disposable persistence');

  const firstInsert = resultByWatchRun(proof, 'run-001');
  assert(firstInsert.persistence_result === 'inserted_open_disposable_fixture_row', 'first valid candidate should insert one open row');
  assert(firstInsert.rows_written_to_disposable_fixture === 1, 'first valid candidate should write one disposable fixture row');

  const duplicate = resultByCandidate(proof, 'duplicate-same-watch-same-identity');
  assert(duplicate.persistence_result === 'idempotent_existing_open_disposable_fixture_row', 'duplicate same Watch/same identity should be idempotent no-op');
  assert(duplicate.rows_written_to_disposable_fixture === 0, 'idempotent duplicate should not add row');

  const conflict = resultByCandidate(proof, 'same-watch-different-identity');
  assert(conflict.persistence_result === 'integrity_conflict_no_second_open_row', 'same Watch/different open identity should conflict');
  assert(conflict.rows_written_to_disposable_fixture === 0, 'integrity conflict should not add a row');

  const error = resultByCandidate(proof, 'same-run-mismatched-provenance');
  assert(error.persistence_result === 'integrity_error_rolled_back', 'same watch_run_id mismatch should roll back');
  assert(error.rollback_in_disposable_fixture === true, 'integrity error should be rolled back inside disposable fixture');

  const stale = resultByWatchRun(proof, 'run-003');
  assert(stale.persistence_result === 'inserted_open_disposable_fixture_row', 'stale Watch should insert one current row');
  assert(stale.missed_intervals_collapsed_to_current_candidate === true, 'stale Watch should collapse missed intervals');
  assert(stale.catch_up_rows_created === 0, 'stale Watch should create no catch-up rows');

  const overlap = proof.overlapping_fixture_rows.find((entry) => entry.left_watch_id === 4 && entry.right_watch_id === 5);
  assert(overlap, 'overlapping system scopes for different Watch IDs should coexist');
  assert(overlap.merges_identity === false, 'overlapping scopes should not merge identity');
  assert(overlap.suppresses_row === false, 'overlapping scopes should not suppress row');

  assertNoPersistedRow(proof, 10, 'watch_scope_authority_invalid');
  assertNoPersistedRow(proof, 11, 'not_due');
  assertNoPersistedRow(proof, 12, 'inactive');
  assertNoPersistedRow(proof, 13, 'backoff');

  assert(proof.boundary_table_check.fetch_runs_mutated === false, 'fetch_runs should not mutate');
  assert(proof.boundary_table_check.discovered_killmail_refs_mutated === false, 'discovered_killmail_refs should not mutate');
  assert(proof.boundary_table_check.killmails_mutated === false, 'killmails should not mutate');
  assert(proof.boundary_table_check.activity_events_mutated === false, 'activity_events should not mutate');
  assert(proof.boundary_table_check.api_request_logs_mutated === false, 'api_request_logs should not mutate');
  assert(proof.boundary_table_check.data_quality_warnings_mutated === false, 'warnings should not mutate');
  assert(proof.boundary_table_check.watch_cadence_rows_mutated === false, 'Watch cadence rows should not mutate');
  assert(proof.accepted_model.fixture_schema_is_not_product_schema === true, 'fixture schema should not become product schema');
}

function persistenceFixtureInput(projection) {
  const byWatch = new Map(projection.projected_bucket_candidates.map((candidate) => [Number(candidate.watch_id), candidate]));
  return {
    externalIoState: 'off',
    projectedBucketCandidates: [
      byWatch.get(1),
      withCandidateId(byWatch.get(1), 'duplicate-same-watch-same-identity'),
      withWatchRunId(withCandidateId(withScope(byWatch.get(1), [30003601]), 'same-watch-different-identity'), 'run-001-conflict'),
      byWatch.get(3),
      byWatch.get(4),
      byWatch.get(5),
      byWatch.get(9),
      withCandidateId(withProvenance(byWatch.get(4), { watch_scope_key: 'different-provenance-same-run' }), 'same-run-mismatched-provenance')
    ],
    rejectedSourceRows: [
      rejected(10, 'run-010', 'watch_scope_authority_invalid'),
      rejected(11, 'run-011', 'not_due'),
      rejected(12, 'run-012', 'inactive'),
      rejected(13, 'run-013', 'backoff')
    ]
  };
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
      stub(9, [30003597, 30003599], { watchRunId: 'run-009' })
    ],
    existingOpenStubs: [
      existingOpen(2, [30003597, 30003599], { watchRunId: 'run-002' })
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

function withCandidateId(candidate, candidateId) {
  return {
    ...candidate,
    projected_bucket_candidate_id: candidateId
  };
}

function withScope(candidate, includedSystemIds) {
  return {
    ...candidate,
    accepted_scope: {
      ...candidate.accepted_scope,
      included_system_ids: includedSystemIds
    }
  };
}

function withWatchRunId(candidate, watchRunId) {
  return {
    ...candidate,
    watch_run_id: watchRunId
  };
}

function withProvenance(candidate, patch) {
  return {
    ...candidate,
    provenance: {
      ...candidate.provenance,
      ...patch
    }
  };
}

function rejected(watchId, watchRunId, reason) {
  return {
    input_stub_id: `stub-${watchId}`,
    watch_id: watchId,
    watch_run_id: watchRunId,
    source_kind: 'watch_system_radius',
    reason
  };
}

function resultByWatchRun(proof, watchRunId) {
  const row = proof.persistence_results.find((entry) => entry.watch_run_id === watchRunId);
  assert(row, `result for watch_run_id ${watchRunId} should be present`);
  return row;
}

function resultByCandidate(proof, candidateId) {
  const row = proof.persistence_results.find((entry) => entry.projected_bucket_candidate_id === candidateId);
  assert(row, `result for candidate ${candidateId} should be present`);
  return row;
}

function assertNoPersistedRow(proof, watchId, reason) {
  const rejectedRow = proof.persistence_results.find((entry) => Number(entry.watch_id) === Number(watchId));
  assert(rejectedRow, `watch ${watchId} should have rejection result`);
  assert(rejectedRow.persistence_result === 'rejected_before_disposable_persistence', `watch ${watchId} should reject before persistence`);
  assert(rejectedRow.reason === reason, `watch ${watchId} should preserve reason ${reason}`);
  assert(!proof.disposable_fixture_rows.some((row) => Number(row.watch_id) === Number(watchId)), `watch ${watchId} should not persist disposable row`);
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
