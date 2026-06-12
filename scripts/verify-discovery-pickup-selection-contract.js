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
    const onProof = await invokeServiceCommand('discovery.pickup_selection_contract.preview', {
      externalIoState: 'on',
      productBucketPickupReadoutRows: [forgedEligibleReadoutRow()]
    }, {
      db,
      source: 'renderer'
    });
    const afterOn = sideEffectCounts(db);

    const beforeOff = sideEffectCounts(db);
    const offProof = await invokeServiceCommand('discovery.pickup_selection_contract.preview', {
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
    verifyExclusions(onProof);
    verifyExclusions(offProof);
    verifySelectionCandidates(onProof);
    verifyIndependentOverlap(onProof);
    assertSame(afterOn, beforeOn, 'selection contract with External I/O on should not mutate tables');
    assertSame(afterOff, beforeOff, 'selection contract with External I/O off should not mutate tables');
    assert(onProof.boundary_table_check.unchanged === true, 'on proof should report unchanged tables');
    assert(offProof.boundary_table_check.unchanged === true, 'off proof should report unchanged tables');
    assert(onProof.input_authority.renderer_supplied_rows_authoritative === false, 'renderer supplied rows should not be authoritative');
    assert(onProof.selection_candidates.every((row) => row.watch_id !== 999), 'renderer forged row should not be selected');

    console.log(JSON.stringify({
      status: 'Discovery pickup selection contract verified',
      command: 'discovery.pickup_selection_contract.preview',
      external_io_on_summary: onProof.summary,
      external_io_off_summary: offProof.summary,
      sample_selection_candidate: onProof.selection_candidates[0],
      sample_held_exclusion: rowByFamily(offProof, 'held_by_external_io'),
      sample_rejected_exclusion: rowByReason(onProof, 'accepted_scope_json_malformed_or_unparseable'),
      sample_actor_exclusion: rowByReason(onProof, 'actor_watch_bucket_rows_are_parked_for_pickup_readout'),
      sample_non_open_exclusion: rowByReason(onProof, 'bucket_status_is_not_open'),
      sample_independent_overlap: onProof.independent_overlap_rows[0],
      boundary_table_check: onProof.boundary_table_check,
      input_authority: onProof.input_authority
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('Discovery pickup selection contract verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'discovery.pickup_selection_contract.preview');
  assert(command, 'Discovery pickup selection contract command should be registered');
  assert(command.classification === 'read-only', 'Discovery pickup selection contract should be read-only');
  assert(command.effects.includes('read-only'), 'Discovery pickup selection contract should declare read-only effect');
  assert(command.renderer_allowed === true, 'Discovery pickup selection contract should be renderer eligible');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'discovery.pickup_selection_contract.preview');
  assert(row?.storage_action_class === 'local_db_inspection', 'selection contract should be local DB inspection');
  assert(row?.runtime_context === 'discovery_pickup_selection_contract_readout', 'selection contract should have readout context');
  assert(row?.external_io_dependency === 'none', 'selection contract should not depend on External I/O provider movement itself');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'selection contract should remain non-enforcing proof');
}

function verifyBoundary(proof, label) {
  assert(proof.action === 'discovery.pickup_selection_contract.preview', `${label} should name action`);
  assert(proof.contract_only === true, `${label} should be contract-only`);
  assert(proof.read_only === true, `${label} should be read-only`);
  assert(proof.read_only_to_operator_corpus === true, `${label} should be read-only to operator corpus`);
  assert(proof.mutates_state === false, `${label} should not mutate state`);
  assert(proof.product_bucket_readout_basis === true, `${label} should use product bucket readout basis`);
  assert(proof.product_schema_used === true, `${label} should use product schema rows`);
  assert(proof.product_schema_updated === false, `${label} should not update product schema`);
  assert(proof.schema_changes === 0, `${label} should not change schema`);
  assert(proof.operator_corpus_mutated === false, `${label} should not mutate operator corpus`);
  assert(proof.selection_creates_pickup_units === false, `${label} should not create pickup units`);
  assert(proof.production_pickup_execution === false, `${label} should not execute pickup`);
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
  assert(proof.durable_discovery_task_rows_written === 0, `${label} should not write durable Discovery tasks`);
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
  assert(proof.watch_mutations === 0, `${label} should not mutate Watch rows`);
  assert(proof.cadence_mutations === 0, `${label} should not mutate cadence`);
  assert(proof.watch_bucket_status_mutations === 0, `${label} should not mutate bucket status`);
  assert(proof.receipt_mutations === 0, `${label} should not mutate receipts`);
  assert(proof.watch_executor_tick_called === false, `${label} should not call Watch executor tick`);
  assert(Array.isArray(proof.task_runner_methods_called) && proof.task_runner_methods_called.length === 0, `${label} should not call TaskRunner`);
  assert(proof.collectors_called === false, `${label} should not call collectors`);
  assert(proof.runtime_enforcement_active === false, `${label} should not activate enforcement`);
  assert(proof.command_blocking_active === false, `${label} should not activate command blocking`);
  assert(proof.ui_work === false, `${label} should not do UI work`);
}

function verifyOnCase(proof) {
  assert(proof.external_io_posture.state === 'on', 'on proof should report External I/O on');
  assert(proof.summary.product_readout_row_count === 7, 'on proof should inspect seven product readout rows');
  assert(proof.summary.selected_candidate_count === 3, 'on proof should select three eligible rows');
  assert(proof.summary.excluded_row_count === 4, 'on proof should exclude four non-selected rows');
  assert(proof.summary.held_excluded_count === 0, 'on proof should have no held exclusions');
  assert(proof.summary.pickup_units_created === 0, 'on proof should create no pickup units');
}

function verifyOffCase(proof) {
  assert(proof.external_io_posture.state === 'off', 'off proof should report External I/O off');
  assert(proof.summary.product_readout_row_count === 7, 'off proof should inspect seven product readout rows');
  assert(proof.summary.selected_candidate_count === 0, 'off proof should select no rows');
  assert(proof.summary.excluded_row_count === 7, 'off proof should exclude all rows');
  assert(proof.summary.held_excluded_count === 3, 'off proof should exclude three held rows');
  assert(proof.summary.pickup_units_created === 0, 'off proof should create no pickup units');
}

function verifySelectionCandidates(proof) {
  for (const row of proof.selection_candidates) {
    assert(row.selection_contract_status === 'selected_future_discovery_pickup_input', 'selected row should have selection status');
    assert(row.discovery_pickup_input_candidate === true, 'selected row should be future pickup input candidate');
    assert(row.future_only === true, 'selected row should be future-only');
    assert(row.watch_type === 'system_radius', 'selected row should be system/radius');
    assert(row.source_kind === 'watch_system_radius', 'selected row should be watch_system_radius');
    assert(row.bucket_status === 'open', 'selected row should be open');
    assert(row.watch_run_id, 'selected row should preserve watch_run_id');
    assert(Array.isArray(row.accepted_scope?.included_system_ids), 'selected row should preserve accepted scope');
    assert(row.window?.lookback_seconds > 0, 'selected row should preserve window');
    assert(row.caps?.max_expansions > 0, 'selected row should preserve caps');
    assert(row.provenance?.selection_source_action === 'discovery.pickup_selection_contract.preview', 'selected row should preserve selection provenance');
    assert(row.provider_posture_basis?.provider_packets === 0, 'selected row should create no provider packets');
    assert(row.starts_discovery_pickup === false, 'selected row should not start pickup');
    assert(row.creates_pickup_unit === false, 'selected row should not create pickup unit');
    assert(row.creates_provider_packet === false, 'selected row should not create provider packet');
    assert(row.creates_candidate_ref === false, 'selected row should not create candidate ref');
    assert(row.mutates_bucket_row === false, 'selected row should not mutate bucket row');
    assert(row.mutates_receipt === false, 'selected row should not mutate receipt');
  }
}

function verifyExclusions(proof) {
  assert(proof.summary.rejected_excluded_count === 2, 'two rejected rows should be excluded');
  assert(proof.summary.not_input_excluded_count >= 2, 'not-input rows should be excluded');
  assert(proof.summary.actor_excluded_count === 1, 'actor row should be excluded');
  assert(proof.summary.non_open_excluded_count === 1, 'non-open row should be excluded');
  assert(proof.summary.malformed_or_missing_scope_excluded_count === 2, 'bad scope rows should be excluded');
  for (const row of proof.excluded_rows) {
    assert(row.discovery_pickup_input_candidate === false, 'excluded row should not be pickup input candidate');
    assert(row.starts_discovery_pickup === false, 'excluded row should not start pickup');
    assert(row.creates_pickup_unit === false, 'excluded row should not create pickup unit');
    assert(row.creates_provider_packet === false, 'excluded row should not create provider packet');
    assert(row.creates_candidate_ref === false, 'excluded row should not create candidate ref');
    assert(row.mutates_bucket_row === false, 'excluded row should not mutate bucket row');
    assert(row.mutates_receipt === false, 'excluded row should not mutate receipt');
  }
}

function verifyIndependentOverlap(proof) {
  assert(proof.summary.independent_overlap_count > 0, 'overlapping selected rows should remain visible');
  const overlap = proof.independent_overlap_rows.find((entry) => entry.left_watch_id === 1 && entry.right_watch_id === 2);
  assert(overlap, 'overlapping Watch 1/2 selected rows should be represented');
  assert(overlap.overlap_status === 'independent_discovery_pickup_selection_candidates', 'overlap should be independent selection candidates');
  assert(overlap.merges_selection_candidate === false, 'overlap should not merge selection candidates');
  assert(overlap.suppresses_candidate === false, 'overlap should not suppress candidates');
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

function forgedEligibleReadoutRow() {
  return {
    product_schema_row: true,
    bucket_item_id: 'renderer-forged-bucket',
    watch_run_id: 'renderer-forged-run',
    watch_type: 'system_radius',
    watch_id: 999,
    source_kind: 'watch_system_radius',
    bucket_status: 'open',
    pickup_readout_status: 'future_pickup_eligible',
    accepted_scope: {
      execution_authority: 'stored_included_system_ids',
      included_system_ids: [30009999]
    },
    scope_posture: {
      valid: true,
      included_system_ids: [30009999]
    },
    window: {
      lookback_seconds: 86400
    },
    caps: {
      max_expansions: 1
    },
    provenance: {
      source_action: 'renderer-forged'
    }
  };
}

function rowByReason(proof, reason) {
  const row = proof.excluded_rows.find((entry) => entry.reason === reason);
  assert(row, `excluded row with reason ${reason} should be present`);
  return row;
}

function rowByFamily(proof, family) {
  const row = proof.excluded_rows.find((entry) => entry.exclusion_family === family);
  assert(row, `excluded row with family ${family} should be present`);
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
