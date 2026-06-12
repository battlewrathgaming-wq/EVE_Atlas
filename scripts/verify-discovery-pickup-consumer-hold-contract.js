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
    const disposableProof = await disposablePersistenceProof(db);
    const onProof = await invokeServiceCommand('discovery.pickup_consumer_hold_contract.preview', {
      externalIoState: 'on',
      disposableFixtureRows: disposableProof.disposable_fixture_rows,
      persistenceResults: disposableProof.persistence_results
    }, {
      db,
      source: 'renderer'
    });
    const offProof = await invokeServiceCommand('discovery.pickup_consumer_hold_contract.preview', {
      externalIoState: 'off',
      disposableFixtureRows: disposableProof.disposable_fixture_rows,
      persistenceResults: disposableProof.persistence_results
    }, {
      db,
      source: 'renderer'
    });
    const after = sideEffectCounts(db);

    verifyBoundary(onProof, 'External I/O on');
    verifyBoundary(offProof, 'External I/O off');
    verifyOnCase(onProof);
    verifyOffCase(offProof);
    verifyRejectedRows(onProof);
    verifyRejectedRows(offProof);
    verifyIndependentOverlap(onProof);
    verifyIndependentOverlap(offProof);
    assertSame(after, before, 'Discovery pickup consumer hold contract should not mutate product tables');
    assert(onProof.boundary_table_check.unchanged === true, 'on proof should include unchanged table proof');
    assert(offProof.boundary_table_check.unchanged === true, 'off proof should include unchanged table proof');

    console.log(JSON.stringify({
      status: 'Discovery pickup consumer hold contract verified',
      command: 'discovery.pickup_consumer_hold_contract.preview',
      external_io_on_summary: onProof.summary,
      external_io_off_summary: offProof.summary,
      sample_future_pickup_eligible: onProof.future_pickup_eligible_rows[0],
      sample_held_by_external_io: offProof.held_by_external_io_rows[0],
      sample_duplicate_rejection: rowByStatus(onProof, 'not_pickup_input_duplicate_idempotent_result'),
      sample_integrity_rejection: rowByPersistence(onProof, 'integrity_conflict_no_second_open_row'),
      sample_source_rejection: rowByPersistence(onProof, 'rejected_before_disposable_persistence'),
      sample_independent_overlap: onProof.independent_overlap_rows[0],
      boundary_table_check: onProof.boundary_table_check
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('Discovery pickup consumer hold contract verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'discovery.pickup_consumer_hold_contract.preview');
  assert(command, 'Discovery pickup consumer hold contract command should be registered');
  assert(command.classification === 'read-only', 'Discovery pickup consumer hold contract should be read-only');
  assert(command.effects.includes('read-only'), 'Discovery pickup consumer hold contract should declare read-only effect');
  assert(command.renderer_allowed === true, 'Discovery pickup consumer hold contract should be renderer eligible');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'discovery.pickup_consumer_hold_contract.preview');
  assert(row?.storage_action_class === 'local_db_inspection', 'hold contract should be local DB inspection');
  assert(row?.runtime_context === 'discovery_pickup_consumer_hold_contract_readout', 'hold contract should have readout context');
  assert(row?.external_io_dependency === 'none', 'hold contract should not depend on External I/O provider movement itself');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'hold contract should remain non-enforcing proof');
}

function verifyProductSchemaUntouched() {
  const schema = fs.readFileSync('src/main/db/schema.sql', 'utf8');
  assert(!/disposable_bucket/i.test(schema), 'product schema should not contain disposable fixture bucket table names');
}

async function disposablePersistenceProof(db) {
  const projection = await invokeServiceCommand('watch.bucket_identity_projection.preview', projectionFixtureInput(), {
    db,
    source: 'renderer'
  });
  return invokeServiceCommand('watch.bucket_disposable_persistence_fixture.preview', persistenceFixtureInput(projection), {
    db,
    source: 'renderer'
  });
}

function verifyBoundary(proof, label) {
  assert(proof.action === 'discovery.pickup_consumer_hold_contract.preview', `${label} should name action`);
  assert(proof.fixture_only === true, `${label} should be fixture-only`);
  assert(proof.contract_only === true, `${label} should be contract-only`);
  assert(proof.read_only === true, `${label} should be read-only`);
  assert(proof.read_only_to_operator_corpus === true, `${label} should be read-only to operator corpus`);
  assert(proof.mutates_state === false, `${label} should not mutate service state`);
  assert(proof.production_bucket_consumption === false, `${label} should not consume production bucket rows`);
  assert(proof.product_schema_used === false, `${label} should not use product schema`);
  assert(proof.product_schema_updated === false, `${label} should not update product schema`);
  assert(proof.fixture_schema_accepted_as_product_schema === false, `${label} should not accept fixture schema as product schema`);
  assert(proof.operator_corpus_mutated === false, `${label} should not mutate operator corpus`);
  assert(proof.provider_calls === 0, `${label} should not call providers`);
  assert(proof.live_api_calls === 0, `${label} should not call live APIs`);
  assert(proof.zkill_calls === 0, `${label} should not call zKill`);
  assert(proof.esi_calls === 0, `${label} should not call ESI`);
  assert(proof.provider_packets === 0, `${label} should not create provider packets`);
  assert(proof.discovery_pickup_started === false, `${label} should not start Discovery pickup`);
  assert(proof.discovery_pickup_packets_created === 0, `${label} should not create Discovery pickup packets`);
  assert(proof.pickup_units_created === 0, `${label} should not create pickup units`);
  assert(proof.pickup_units_leased === 0, `${label} should not lease pickup units`);
  assert(proof.leases_created === 0, `${label} should not create leases`);
  assert(proof.queue_items_created === 0, `${label} should not create queue items`);
  assert(proof.dispatcher_started === false, `${label} should not start dispatcher`);
  assert(proof.dispatcher_queue_lease_behavior === false, `${label} should not implement dispatcher/queue/lease`);
  assert(proof.candidate_refs_emitted === 0, `${label} should not emit candidate refs`);
  assert(proof.candidate_refs_written === 0, `${label} should not write candidate refs`);
  assert(proof.durable_discovery_refs_written === false, `${label} should not write durable Discovery refs`);
  assert(proof.discovered_killmail_refs_written === 0, `${label} should not write discovered_killmail_refs`);
  assert(proof.discovery_refs_mutated === 0, `${label} should not mutate Discovery refs`);
  assert(proof.evidence_writes === 0, `${label} should not write Evidence/EVEidence`);
  assert(proof.hydration_writes === 0, `${label} should not write Hydration`);
  assert(proof.observation_created === false, `${label} should not create Observation`);
  assert(proof.api_request_log_writes === 0, `${label} should not write API logs`);
  assert(proof.data_quality_warning_writes === 0, `${label} should not write warnings`);
  assert(proof.watch_mutations === 0, `${label} should not mutate Watch rows`);
  assert(proof.cadence_mutations === 0, `${label} should not mutate cadence`);
  assert(proof.watch_executor_tick_called === false, `${label} should not call Watch executor tick`);
  assert(Array.isArray(proof.task_runner_methods_called) && proof.task_runner_methods_called.length === 0, `${label} should not call TaskRunner`);
  assert(proof.collectors_called === false, `${label} should not call collectors`);
  assert(proof.schema_changes === 0, `${label} should not change schema`);
  assert(proof.durable_bucket_rows_written === 0, `${label} should not write durable bucket rows`);
  assert(proof.fetch_runs_as_bucket_state === false, `${label} should not use fetch_runs as bucket state`);
  assert(proof.discovered_killmail_refs_as_bucket_state === false, `${label} should not use discovered refs as bucket state`);
  assert(proof.runtime_enforcement_active === false, `${label} should not activate enforcement`);
  assert(proof.command_blocking_active === false, `${label} should not activate command blocking`);
  assert(proof.ui_work === false, `${label} should not do UI work`);
  assert(proof.external_io_posture.held_by_external_io_is_provider_movement_hold === true, `${label} should define held as provider movement hold`);
  assert(proof.external_io_posture.held_by_external_io_is_watch_failure === false, `${label} should not define held as Watch failure`);
  assert(proof.external_io_posture.held_by_external_io_is_persisted_bucket_status === false, `${label} should not define held as persisted bucket status`);
}

function verifyOnCase(proof) {
  assert(proof.external_io_posture.state === 'on', 'on proof should report External I/O on');
  assert(proof.summary.disposable_open_row_count === 5, 'on proof should consume five open disposable fixture rows');
  assert(proof.summary.future_pickup_eligible_count === 5, 'on proof should mark five future pickup eligible');
  assert(proof.summary.held_by_external_io_count === 0, 'on proof should not hold rows');
  assert(proof.future_pickup_eligible_rows.length === 5, 'on proof should expose five eligible rows');
  assert(proof.held_by_external_io_rows.length === 0, 'on proof should expose no held rows');
  for (const row of proof.future_pickup_eligible_rows) {
    assert(row.pickup_contract_status === 'future_pickup_eligible', 'open row should be future pickup eligible');
    assert(row.starts_discovery_pickup === false, 'eligible row should not start pickup');
    assert(row.provider_packets === 0, 'eligible row should not create provider packets');
    assert(row.pickup_units_created === 0, 'eligible row should not create pickup units');
  }
}

function verifyOffCase(proof) {
  assert(proof.external_io_posture.state === 'off', 'off proof should report External I/O off');
  assert(proof.summary.disposable_open_row_count === 5, 'off proof should consume five open disposable fixture rows');
  assert(proof.summary.future_pickup_eligible_count === 0, 'off proof should not mark rows eligible');
  assert(proof.summary.held_by_external_io_count === 5, 'off proof should hold five rows');
  assert(proof.future_pickup_eligible_rows.length === 0, 'off proof should expose no eligible rows');
  assert(proof.held_by_external_io_rows.length === 5, 'off proof should expose five held rows');
  for (const row of proof.held_by_external_io_rows) {
    assert(row.pickup_contract_status === 'held_by_external_io', 'open row should be held by External I/O');
    assert(row.held_is_failure === false, 'External I/O hold should not be failure');
    assert(row.watch_failure === false, 'External I/O hold should not be Watch failure');
    assert(row.persisted_bucket_status === false, 'External I/O hold should not be persisted bucket status');
    assert(row.starts_discovery_pickup === false, 'held row should not start pickup');
    assert(row.provider_packets === 0, 'held row should not create provider packets');
    assert(row.pickup_units_created === 0, 'held row should not create pickup units');
  }
}

function verifyRejectedRows(proof) {
  assert(proof.summary.duplicate_idempotent_result_count === 1, 'duplicate/idempotent result should be present once');
  assert(proof.summary.integrity_conflict_or_error_count === 2, 'integrity conflict and error rows should be present');
  assert(proof.summary.rejected_source_row_count === 4, 'source rejected rows should be present');
  assert(proof.summary.rejected_before_pickup_consumption_count === 7, 'seven non-open rows should reject before pickup consumption');

  const duplicate = rowByStatus(proof, 'not_pickup_input_duplicate_idempotent_result');
  assert(duplicate.rejection_family === 'duplicate_idempotent', 'duplicate row should be explicit duplicate family');
  assert(duplicate.pickup_units_created === 0, 'duplicate row should create no pickup units');

  const conflict = rowByPersistence(proof, 'integrity_conflict_no_second_open_row');
  assert(conflict.pickup_contract_status === 'rejected_before_pickup_consumption', 'integrity conflict should reject before pickup');
  assert(conflict.rejection_family === 'integrity_conflict_or_error', 'integrity conflict should use conflict/error family');

  const error = rowByPersistence(proof, 'integrity_error_rolled_back');
  assert(error.pickup_contract_status === 'rejected_before_pickup_consumption', 'integrity error should reject before pickup');
  assert(error.rejection_family === 'integrity_conflict_or_error', 'integrity error should use conflict/error family');

  const rejected = rowByPersistence(proof, 'rejected_before_disposable_persistence');
  assert(rejected.pickup_contract_status === 'rejected_before_pickup_consumption', 'source rejection should reject before pickup');
  assert(rejected.rejection_family === 'rejected_source_row', 'source rejection should use rejected source family');

  for (const row of proof.rejected_before_pickup_consumption_rows) {
    assert(row.future_pickup_eligible === false, 'rejected row should not be eligible');
    assert(row.held_by_external_io === false, 'rejected row should not be External I/O held open row');
    assert(row.starts_discovery_pickup === false, 'rejected row should not start pickup');
    assert(row.pickup_units_created === 0, 'rejected row should create no pickup units');
    assert(row.candidate_refs_written === 0, 'rejected row should write no refs');
  }
}

function verifyIndependentOverlap(proof) {
  assert(proof.summary.independent_overlap_count > 0, 'overlapping open rows from different Watches should remain visible');
  const overlap = proof.independent_overlap_rows.find((entry) => entry.left_watch_id === 4 && entry.right_watch_id === 5);
  assert(overlap, 'overlapping Watch 4/5 rows should be independently represented');
  assert(overlap.overlap_status === 'independent_pickup_candidates_or_holds', 'overlap should be independent candidate/hold');
  assert(overlap.merges_pickup_contract === false, 'overlap should not merge pickup contract');
  assert(overlap.suppresses_candidate === false, 'overlap should not suppress candidate');
  assert(overlap.provider_packets === 0, 'overlap should not create provider packets');
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
    emits_valid_stub: true,
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

function rowByStatus(proof, status) {
  const row = proof.pickup_contract_rows.find((entry) => entry.pickup_contract_status === status);
  assert(row, `row with status ${status} should be present`);
  return row;
}

function rowByPersistence(proof, persistenceResult) {
  const row = proof.pickup_contract_rows.find((entry) => entry.source_persistence_result === persistenceResult);
  assert(row, `row with persistence result ${persistenceResult} should be present`);
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
