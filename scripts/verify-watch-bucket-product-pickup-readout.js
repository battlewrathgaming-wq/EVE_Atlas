const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

const NOW = '2026-06-12T12:00:00.000Z';

async function main() {
  verifyRegistrationAndCoverage();

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedProductBucketRows(db);
    const beforeOn = sideEffectCounts(db);
    const onProof = await invokeServiceCommand('watch.bucket_product_pickup_readout.preview', {
      externalIoState: 'on'
    }, {
      db,
      source: 'renderer'
    });
    const afterOn = sideEffectCounts(db);

    const beforeOff = sideEffectCounts(db);
    const offProof = await invokeServiceCommand('watch.bucket_product_pickup_readout.preview', {
      externalIoState: 'off'
    }, {
      db,
      source: 'renderer'
    });
    const afterOff = sideEffectCounts(db);

    verifyBoundary(onProof, 'External I/O on');
    verifyBoundary(offProof, 'External I/O off');
    verifyOnCase(onProof);
    verifyOffCase(offProof);
    verifyRejectedRows(onProof);
    verifyRejectedRows(offProof);
    verifyUnsupportedAndNonOpen(onProof);
    verifyUnsupportedAndNonOpen(offProof);
    verifyIndependentOverlap(onProof);
    verifyIndependentOverlap(offProof);
    assertSame(afterOn, beforeOn, 'product pickup readout with External I/O on should not mutate tables');
    assertSame(afterOff, beforeOff, 'product pickup readout with External I/O off should not mutate tables');
    assert(onProof.boundary_table_check.unchanged === true, 'on proof should report unchanged tables');
    assert(offProof.boundary_table_check.unchanged === true, 'off proof should report unchanged tables');
    assertNoHeldStatusPersisted(db);

    console.log(JSON.stringify({
      status: 'Watch bucket product pickup readout verified',
      command: 'watch.bucket_product_pickup_readout.preview',
      external_io_on_summary: onProof.summary,
      external_io_off_summary: offProof.summary,
      sample_future_pickup_eligible: onProof.future_pickup_eligible_rows[0],
      sample_held_by_external_io: offProof.held_by_external_io_rows[0],
      sample_malformed_scope_rejection: rowByReason(onProof, 'accepted_scope_json_malformed_or_unparseable'),
      sample_missing_scope_rejection: rowByReason(onProof, 'accepted_scope_included_system_ids_missing_or_invalid'),
      sample_actor_not_input: rowByReason(onProof, 'actor_watch_bucket_rows_are_parked_for_pickup_readout'),
      sample_non_open_not_input: rowByReason(onProof, 'bucket_status_is_not_open'),
      sample_independent_overlap: onProof.independent_overlap_rows[0],
      boundary_table_check: onProof.boundary_table_check
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('Watch bucket product pickup readout verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.bucket_product_pickup_readout.preview');
  assert(command, 'Watch bucket product pickup readout command should be registered');
  assert(command.classification === 'read-only', 'Watch bucket product pickup readout should be read-only');
  assert(command.effects.includes('read-only'), 'Watch bucket product pickup readout should declare read-only effect');
  assert(command.renderer_allowed === true, 'Watch bucket product pickup readout should be renderer eligible');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'watch.bucket_product_pickup_readout.preview');
  assert(row?.storage_action_class === 'local_db_inspection', 'product pickup readout should be local DB inspection');
  assert(row?.runtime_context === 'watch_bucket_product_pickup_readout', 'product pickup readout should have readout context');
  assert(row?.external_io_dependency === 'none', 'product pickup readout should not depend on External I/O provider movement itself');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'product pickup readout should remain non-enforcing proof');
}

function verifyBoundary(proof, label) {
  assert(proof.action === 'watch.bucket_product_pickup_readout.preview', `${label} should name action`);
  assert(proof.product_bucket_readout === true, `${label} should be product bucket readout`);
  assert(proof.fixture_only === false, `${label} should not be fixture-only`);
  assert(proof.read_only === true, `${label} should be read-only`);
  assert(proof.read_only_to_operator_corpus === true, `${label} should be read-only to operator corpus`);
  assert(proof.mutates_state === false, `${label} should not mutate state`);
  assert(proof.product_schema_used === true, `${label} should use product rows`);
  assert(proof.product_schema_updated === false, `${label} should not update product schema`);
  assert(proof.schema_changes === 0, `${label} should not change schema`);
  assert(proof.operator_corpus_mutated === false, `${label} should not mutate operator corpus`);
  assert(proof.provider_calls === 0, `${label} should not call providers`);
  assert(proof.live_api_calls === 0, `${label} should not call live APIs`);
  assert(proof.zkill_calls === 0, `${label} should not call zKill`);
  assert(proof.esi_calls === 0, `${label} should not call ESI`);
  assert(proof.provider_packets === 0, `${label} should not create provider packets`);
  assert(proof.discovery_pickup_started === false, `${label} should not start Discovery pickup`);
  assert(proof.discovery_pickup_packets_created === 0, `${label} should not create pickup packets`);
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
  assert(proof.watch_bucket_status_mutations === 0, `${label} should not mutate bucket status`);
  assert(proof.receipt_mutations === 0, `${label} should not mutate receipts`);
  assert(proof.watch_executor_tick_called === false, `${label} should not call Watch executor tick`);
  assert(Array.isArray(proof.task_runner_methods_called) && proof.task_runner_methods_called.length === 0, `${label} should not call TaskRunner`);
  assert(proof.collectors_called === false, `${label} should not call collectors`);
  assert(proof.fetch_runs_as_bucket_state === false, `${label} should not use fetch_runs as bucket state`);
  assert(proof.discovered_killmail_refs_as_bucket_state === false, `${label} should not use discovered refs as bucket state`);
  assert(proof.runtime_enforcement_active === false, `${label} should not activate enforcement`);
  assert(proof.command_blocking_active === false, `${label} should not activate command blocking`);
  assert(proof.ui_work === false, `${label} should not do UI work`);
  assert(proof.external_io_posture.held_by_external_io_is_provider_movement_hold === true, `${label} should define held as provider movement hold`);
  assert(proof.external_io_posture.held_by_external_io_is_watch_failure === false, `${label} should not define held as Watch failure`);
  assert(proof.external_io_posture.held_by_external_io_is_persisted_bucket_status === false, `${label} should not define held as persisted status`);
}

function verifyOnCase(proof) {
  assert(proof.external_io_posture.state === 'on', 'on proof should report External I/O on');
  assert(proof.summary.product_bucket_row_count === 7, 'on proof should inspect seven product rows');
  assert(proof.summary.open_system_radius_row_count === 5, 'on proof should inspect five open system/radius rows');
  assert(proof.summary.future_pickup_eligible_count === 3, 'on proof should mark three valid open rows eligible');
  assert(proof.summary.held_by_external_io_count === 0, 'on proof should not hold rows');
  for (const row of proof.future_pickup_eligible_rows) {
    assert(row.pickup_readout_status === 'future_pickup_eligible', 'valid open row should be future pickup eligible');
    assert(row.starts_discovery_pickup === false, 'eligible row should not start pickup');
    assert(row.provider_packets === 0, 'eligible row should create no provider packets');
    assert(row.pickup_units_created === 0, 'eligible row should create no pickup units');
    assert(row.scope_posture.valid === true, 'eligible row should show valid accepted scope');
  }
}

function verifyOffCase(proof) {
  assert(proof.external_io_posture.state === 'off', 'off proof should report External I/O off');
  assert(proof.summary.product_bucket_row_count === 7, 'off proof should inspect seven product rows');
  assert(proof.summary.future_pickup_eligible_count === 0, 'off proof should not mark rows eligible');
  assert(proof.summary.held_by_external_io_count === 3, 'off proof should hold three valid open rows');
  for (const row of proof.held_by_external_io_rows) {
    assert(row.pickup_readout_status === 'held_by_external_io', 'valid open row should be held by External I/O');
    assert(row.held_is_failure === false, 'External I/O hold should not be failure');
    assert(row.watch_failure === false, 'External I/O hold should not be Watch failure');
    assert(row.persisted_bucket_status === false, 'External I/O hold should not be persisted status');
    assert(row.starts_discovery_pickup === false, 'held row should not start pickup');
    assert(row.provider_packets === 0, 'held row should create no provider packets');
    assert(row.pickup_units_created === 0, 'held row should create no pickup units');
  }
}

function verifyRejectedRows(proof) {
  assert(proof.summary.malformed_or_missing_scope_count === 2, 'two malformed/missing scope rows should reject before pickup consumption');
  const malformed = rowByReason(proof, 'accepted_scope_json_malformed_or_unparseable');
  assert(malformed.pickup_readout_status === 'rejected_before_pickup_consumption', 'malformed scope should reject before pickup');
  assert(malformed.rejection_family === 'invalid_or_missing_accepted_scope', 'malformed scope should identify invalid scope family');

  const missing = rowByReason(proof, 'accepted_scope_included_system_ids_missing_or_invalid');
  assert(missing.pickup_readout_status === 'rejected_before_pickup_consumption', 'missing included scope should reject before pickup');
  assert(missing.rejection_family === 'invalid_or_missing_accepted_scope', 'missing included scope should identify invalid scope family');

  for (const row of proof.rejected_before_pickup_consumption_rows) {
    assert(row.future_pickup_eligible === false, 'rejected row should not be eligible');
    assert(row.held_by_external_io === false, 'rejected row should not be held');
    assert(row.discovery_pickup_started === false, 'rejected row should not start pickup');
    assert(row.candidate_refs_written === 0, 'rejected row should write no refs');
  }
}

function verifyUnsupportedAndNonOpen(proof) {
  assert(proof.summary.unsupported_actor_row_count === 1, 'one actor row should be unsupported');
  assert(proof.summary.non_open_row_count === 1, 'one non-open row should be not pickup input');

  const actor = rowByReason(proof, 'actor_watch_bucket_rows_are_parked_for_pickup_readout');
  assert(actor.pickup_readout_status === 'not_pickup_input', 'actor row should not be pickup input');
  assert(actor.future_pickup_eligible === false, 'actor row should not be eligible');

  const nonOpen = rowByReason(proof, 'bucket_status_is_not_open');
  assert(nonOpen.pickup_readout_status === 'not_pickup_input', 'non-open row should not be pickup input');
  assert(nonOpen.future_pickup_eligible === false, 'non-open row should not be eligible');
}

function verifyIndependentOverlap(proof) {
  assert(proof.summary.independent_overlap_count > 0, 'overlapping open rows should remain visible');
  const overlap = proof.independent_overlap_rows.find((entry) => entry.left_watch_id === 1 && entry.right_watch_id === 2);
  assert(overlap, 'overlapping Watch 1/2 rows should be represented');
  assert(overlap.overlap_status === 'independent_product_bucket_pickup_rows', 'overlap should be independent product bucket readout');
  assert(overlap.merges_pickup_readout === false, 'overlap should not merge pickup readout');
  assert(overlap.suppresses_candidate === false, 'overlap should not suppress candidate');
  assert(overlap.provider_packets === 0, 'overlap should not create provider packets');
}

function seedProductBucketRows(db) {
  insertBucketRow(db, row(1, 'system_radius', 'watch_system_radius', 'open', [30003597, 30003599]));
  insertBucketRow(db, row(2, 'system_radius', 'watch_system_radius', 'open', [30003597, 30003601]));
  insertBucketRow(db, row(3, 'system_radius', 'watch_system_radius', 'open', [30003605]));
  insertBucketRow(db, {
    ...row(4, 'actor', 'watch_actor', 'open', [90000001]),
    acceptedScopeJson: stableJson({ actor_id: 90000001 })
  });
  insertBucketRow(db, row(5, 'system_radius', 'watch_system_radius', 'settled', [30003597]));
  insertBucketRow(db, {
    ...row(6, 'system_radius', 'watch_system_radius', 'open', []),
    acceptedScopeJson: '{not-json'
  });
  insertBucketRow(db, {
    ...row(7, 'system_radius', 'watch_system_radius', 'open', []),
    acceptedScopeJson: stableJson({
      execution_authority: 'stored_included_system_ids',
      center_system_id: 30003597
    })
  });
}

function row(watchId, watchType, sourceKind, status, includedSystemIds) {
  const acceptedScope = {
    execution_authority: 'stored_included_system_ids',
    included_system_ids: includedSystemIds,
    center_system_id: 30003597,
    center_system_name: 'Hare',
    radius_jumps: 1,
    center_radius_is_provenance_only: true,
    center_radius_used_as_execution_authority: false
  };
  return {
    bucketItemId: `bucket-${watchType}-${watchId}`,
    watchRunId: `watch-run-${watchType}-${watchId}`,
    watchType,
    watchId,
    sourceKind,
    status,
    emittedAt: NOW,
    updatedAt: NOW,
    acceptedScopeJson: stableJson(acceptedScope),
    windowJson: stableJson({
      lookback_seconds: 86400,
      due_at: NOW,
      emitted_at: NOW
    }),
    capsJson: stableJson({
      max_systems: Math.max(includedSystemIds.length, 1),
      max_refs_per_system: 4,
      max_expansions: 8
    }),
    provenanceJson: stableJson({
      source_action: 'watch.bucket_product_persistence.emit',
      source_intent: watchType === 'system_radius' ? 'Watch/system-radius' : 'Watch/actor',
      scope_provenance: 'test_product_watch_bucket_items',
      watch_scope_key: `${watchType}:${watchId}`
    }),
    identityFingerprint: `identity-${watchType}-${watchId}`
  };
}

function insertBucketRow(db, input) {
  db.prepare(`
    INSERT INTO watch_bucket_items (
      bucket_item_id, watch_run_id, watch_type, watch_id, source_kind,
      status, emitted_at, updated_at,
      accepted_scope_json, window_json, caps_json, provenance_json,
      identity_fingerprint, pickup_posture, settled_at, receipt_status,
      receipt_summary_json, provider_timing_json, last_error_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.bucketItemId,
    input.watchRunId,
    input.watchType,
    input.watchId,
    input.sourceKind,
    input.status,
    input.emittedAt,
    input.updatedAt,
    input.acceptedScopeJson,
    input.windowJson,
    input.capsJson,
    input.provenanceJson,
    input.identityFingerprint,
    null,
    input.status === 'settled' ? NOW : null,
    input.status === 'settled' ? 'refs_found' : null,
    null,
    null,
    null
  );
}

function assertNoHeldStatusPersisted(db) {
  const heldStatus = db.prepare(`
    SELECT COUNT(*) AS count
    FROM watch_bucket_items
    WHERE status = 'held_by_external_io' OR pickup_posture = 'held_by_external_io'
  `).get();
  assert(Number(heldStatus.count) === 0, 'held_by_external_io should not be persisted as bucket status or pickup_posture');
}

function rowByReason(proof, reason) {
  const row = proof.pickup_readout_rows.find((entry) => entry.reason === reason);
  assert(row, `row with reason ${reason} should be present`);
  return row;
}

function sideEffectCounts(db) {
  return {
    watch_bucket_items: count(db, 'watch_bucket_items'),
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

function stableJson(value) {
  return JSON.stringify(value);
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
