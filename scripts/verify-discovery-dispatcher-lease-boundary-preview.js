const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

const NOW = '2026-06-12T12:00:00.000Z';
const COMMAND = 'discovery.dispatcher_lease_boundary.preview';

async function main() {
  verifyRegistrationAndCoverage();

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedProductBucketRows(db);
    const beforeOn = sideEffectCounts(db);
    const onProof = await invokeServiceCommand(COMMAND, {
      externalIoState: 'on',
      pickupExecutionBoundaryPreview: forgedBoundaryPreview()
    }, {
      db,
      source: 'renderer'
    });
    const afterOn = sideEffectCounts(db);

    const beforeOff = sideEffectCounts(db);
    const offProof = await invokeServiceCommand(COMMAND, {
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
    verifyLeaseCandidates(onProof);
    verifyExclusions(onProof);
    verifyExclusions(offProof);
    assertSame(afterOn, beforeOn, 'dispatcher lease boundary preview with External I/O on should not mutate tables');
    assertSame(afterOff, beforeOff, 'dispatcher lease boundary preview with External I/O off should not mutate tables');
    assert(onProof.boundary_table_check.unchanged === true, 'on proof should report unchanged tables');
    assert(offProof.boundary_table_check.unchanged === true, 'off proof should report unchanged tables');
    assert(onProof.input_authority.renderer_supplied_boundary_preview_authoritative === false, 'renderer supplied boundary preview should not be authoritative');
    assert(onProof.dispatcher_lease_boundary_candidates.every((row) => row.watch_id !== 999), 'renderer forged boundary preview should not create lease candidates');

    console.log(JSON.stringify({
      status: 'Discovery dispatcher lease boundary preview verified',
      command: COMMAND,
      external_io_on_summary: onProof.summary,
      external_io_off_summary: offProof.summary,
      sample_lease_candidate: onProof.dispatcher_lease_boundary_candidates[0],
      sample_held_exclusion: rowByFamily(offProof, 'held_by_external_io'),
      sample_rejected_exclusion: rowByReason(onProof, 'accepted_scope_json_malformed_or_unparseable'),
      lease_boundary_requirements: onProof.lease_boundary_requirements,
      source_boundary_preview_summary: onProof.source_boundary_preview_summary,
      boundary_table_check: onProof.boundary_table_check,
      input_authority: onProof.input_authority
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('Discovery dispatcher lease boundary preview verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === COMMAND);
  assert(command, 'Discovery dispatcher lease boundary preview command should be registered');
  assert(command.classification === 'read-only', 'Discovery dispatcher lease boundary preview should be read-only');
  assert(command.effects.includes('read-only'), 'Discovery dispatcher lease boundary preview should declare read-only effect');
  assert(command.renderer_allowed === true, 'Discovery dispatcher lease boundary preview should be renderer eligible');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === COMMAND);
  assert(row?.storage_action_class === 'local_db_inspection', 'dispatcher lease boundary preview should be local DB inspection');
  assert(row?.runtime_context === 'discovery_dispatcher_lease_boundary_preview_readout', 'dispatcher lease boundary preview should have readout context');
  assert(row?.external_io_dependency === 'none', 'dispatcher lease boundary preview should not depend on External I/O provider movement itself');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'dispatcher lease boundary preview should remain non-enforcing proof');
}

function verifyBoundary(proof, label) {
  assert(proof.action === COMMAND, `${label} should name action`);
  assert(proof.lease_boundary_preview_only === true, `${label} should be lease boundary preview only`);
  assert(proof.contract_only === true, `${label} should be contract-only`);
  assert(proof.preview_only === true, `${label} should be preview-only`);
  assert(proof.read_only === true, `${label} should be read-only`);
  assert(proof.read_only_to_operator_corpus === true, `${label} should be read-only to operator corpus`);
  assert(proof.mutates_state === false, `${label} should not mutate state`);
  assert(proof.hs491_pickup_execution_boundary_basis === true, `${label} should use HS491 boundary basis`);
  assert(proof.product_schema_used === true, `${label} should use product schema rows`);
  assert(proof.product_schema_updated === false, `${label} should not update product schema`);
  assert(proof.schema_changes === 0, `${label} should not change schema`);
  assert(proof.operator_corpus_mutated === false, `${label} should not mutate operator corpus`);
  assert(proof.dispatcher_runtime_started === false, `${label} should not start dispatcher runtime`);
  assert(proof.dispatcher_loop_started === false, `${label} should not start dispatcher loop`);
  assert(proof.dispatcher_started === false, `${label} should not start dispatcher`);
  assert(proof.dispatcher_queue_lease_behavior === false, `${label} should not implement dispatcher queue lease behavior`);
  assert(proof.queue_runtime_created === false, `${label} should not create queue runtime`);
  assert(proof.durable_queue_rows_written === 0, `${label} should not write durable queue rows`);
  assert(proof.queue_items_created === 0, `${label} should not create queue items`);
  assert(proof.durable_lease_rows_written === 0, `${label} should not write durable lease rows`);
  assert(proof.leases_created === 0, `${label} should not create leases`);
  assert(proof.lease_claims_created === 0, `${label} should not create lease claims`);
  assert(proof.lease_claimed === false, `${label} should not claim leases`);
  assert(proof.pickup_execution_started === false, `${label} should not start pickup execution`);
  assert(proof.discovery_pickup_execution === false, `${label} should not execute pickup`);
  assert(proof.executable_provider_packets_created === 0, `${label} should not create executable provider packets`);
  assert(proof.provider_packets === 0, `${label} should not create provider packets`);
  assert(proof.provider_calls === 0, `${label} should not call providers`);
  assert(proof.live_api_calls === 0, `${label} should not call live APIs`);
  assert(proof.zkill_calls === 0, `${label} should not call zKill`);
  assert(proof.esi_calls === 0, `${label} should not call ESI`);
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
  assert(proof.external_io_posture.external_io_closed_holds_before_lease_candidacy === false, 'on proof should not hold for closed External I/O');
  assert(proof.summary.source_pickup_execution_boundary_packet_count === 5, 'on proof should preserve five HS491 boundary packets');
  assert(proof.summary.lease_candidate_count === 5, 'on proof should classify five lease candidates');
  assert(proof.summary.not_leased_candidate_count === 5, 'on proof should mark all candidates not leased');
  assert(proof.summary.one_accepted_system_id_maps_to_one_lease_candidate === true, 'on proof should keep one accepted system id to one lease candidate');
  assert(proof.summary.future_lease_owner_required_count === 5, 'all candidates should require future lease owner');
  assert(proof.summary.future_lease_expires_at_required_count === 5, 'all candidates should require future expiry');
  assert(proof.summary.future_retry_after_basis_count === 5, 'all candidates should expose retry/provider eligibility basis');
  assert(proof.summary.future_provider_pacing_basis_count === 5, 'all candidates should expose provider pacing basis');
  assert(proof.summary.future_expired_lease_recovery_basis_count === 5, 'all candidates should expose expired lease recovery basis');
  assert(proof.summary.excluded_row_count === 4, 'on proof should expose four source exclusions');
  assert(proof.source_boundary_preview_summary.pickup_execution_boundary_packet_count === 5, 'source HS491 boundary packet count should be visible');
}

function verifyOffCase(proof) {
  assert(proof.external_io_posture.state === 'off', 'off proof should report External I/O off');
  assert(proof.external_io_posture.external_io_closed_holds_before_lease_candidacy === true, 'off proof should hold before lease candidacy');
  assert(proof.summary.source_pickup_execution_boundary_packet_count === 0, 'off proof should have no boundary packets');
  assert(proof.summary.lease_candidate_count === 0, 'off proof should classify no lease candidates');
  assert(proof.summary.not_leased_candidate_count === 0, 'off proof should have no leased candidates');
  assert(proof.summary.external_io_hold_before_lease_candidacy === true, 'off proof should report External I/O hold');
  assert(proof.summary.excluded_row_count === 7, 'off proof should expose all rows as exclusions');
  assert(proof.summary.held_excluded_count === 3, 'off proof should hold three rows by External I/O');
}

function verifyLeaseCandidates(proof) {
  const candidates = proof.dispatcher_lease_boundary_candidates;
  assert(candidates.length === 5, 'five lease candidates should be classified');
  assert(candidates.filter((entry) => entry.watch_id === 1).length === 2, 'watch 1 should preserve two lease candidates');
  assert(candidates.filter((entry) => entry.watch_id === 2).length === 2, 'watch 2 should preserve two lease candidates');
  assert(candidates.filter((entry) => entry.watch_id === 3).length === 1, 'watch 3 should preserve one lease candidate');

  for (const candidate of candidates) {
    assert(candidate.lease_boundary_status === 'lease_candidate_preview_not_leased', 'candidate should be lease candidate preview');
    assert(candidate.lease_candidate === true, 'candidate should be a lease candidate');
    assert(candidate.lease_status === 'not_leased', 'candidate should not be leased');
    assert(candidate.preview_only === true, 'candidate should be preview-only');
    assert(candidate.executable_now === false, 'candidate should not be executable now');
    assert(candidate.dispatchable_now === false, 'candidate should not be dispatchable now');
    assert(candidate.lease_row_exists === false, 'candidate should not have a lease row');
    assert(candidate.lease_claimed === false, 'candidate should not claim lease');
    assert(candidate.lease_claim_created === false, 'candidate should not create lease claim');
    assert(candidate.provider_call_started === false, 'candidate should not start provider call');
    assert(candidate.not_evidence_expansion === true, 'candidate should not be Evidence expansion');
    assert(candidate.not_hydration === true, 'candidate should not be Hydration');
    assert(candidate.provider === 'zkillboard', 'candidate should preserve provider');
    assert(candidate.provider_route_family === 'zkill_system_killmails', 'candidate should preserve route family');
    assert(candidate.packet_identity, 'candidate should preserve packet identity');
    assert(candidate.bucket_item_id, 'candidate should preserve bucket item id');
    assert(candidate.watch_run_id, 'candidate should preserve watch run id');
    assert(candidate.watch_type === 'system_radius', 'candidate should preserve system/radius watch type');
    assert(candidate.source_kind === 'watch_system_radius', 'candidate should preserve source kind');
    assert(candidate.system_id, 'candidate should preserve system id');
    assert(candidate.accepted_scope?.execution_authority === 'stored_included_system_ids', 'candidate should preserve accepted scope');
    assert(candidate.accepted_included_system_ids.includes(candidate.system_id), 'candidate system should come from accepted included systems');
    assert(candidate.center_radius_provenance.center_radius_is_provenance_only === true, 'center/radius should remain provenance only');
    assert(candidate.center_radius_provenance.center_radius_used_as_execution_authority === false, 'center/radius should not become execution authority');
    assert(candidate.window?.lookback_seconds === 86400, 'candidate should preserve window');
    assert(candidate.caps?.max_expansions > 0, 'candidate should preserve caps');
    assert(candidate.provenance?.dispatcher_lease_boundary_source_action === COMMAND, 'candidate should preserve lease boundary provenance');
    assert(candidate.provenance?.execution_boundary_source_action === 'discovery.pickup_execution_boundary.preview', 'candidate should preserve HS491 provenance');
    assert(candidate.source_selection_basis?.selection_contract_status === 'selected_future_discovery_pickup_input', 'candidate should preserve source selection basis');
    assert(candidate.zkill_route?.path_template === '/api/kills/systemID/{system_id}/pastSeconds/{past_seconds}/', 'candidate should preserve zKill route template');
    assert(candidate.future_lease_identity?.status === 'future_identity_basis_only_not_persisted', 'candidate should expose future lease identity basis');
    assert(candidate.future_lease_identity?.persisted === false, 'future lease identity should not be persisted');
    assert(candidate.future_lease_owner_required === true, 'candidate should require future lease owner');
    assert(candidate.future_lease_expires_at_required === true, 'candidate should require future lease expiry');
    assert(candidate.future_retry_after_basis?.status === 'future_provider_eligibility_basis_only', 'candidate should expose retry/provider eligibility basis');
    assert(candidate.future_provider_pacing_basis?.status === 'future_provider_pacing_basis_only', 'candidate should expose provider pacing basis');
    assert(candidate.future_provider_pacing_basis?.catch_up_flood_allowed === false, 'candidate should not allow catch-up flood');
    assert(candidate.future_expired_lease_recovery_basis.includes('returns_to_candidate_pool'), 'candidate should expose recovery behavior');
    assert(candidate.future_lease_claim_status === 'future_required_not_opened', 'lease claim should remain future');
    assert(candidate.future_dispatcher_status === 'future_required_not_started', 'dispatcher should remain future');
    assert(candidate.future_queue_status === 'future_required_not_created', 'queue should remain future');
    assert(candidate.future_provider_movement_status === 'not_opened_by_lease_boundary_preview', 'provider movement should not be opened');
    assert(candidate.side_effects.provider_calls === 0, 'candidate should not call providers');
    assert(candidate.side_effects.dispatcher_runtime_started === false, 'candidate should not start dispatcher');
    assert(candidate.side_effects.leases_created === 0, 'candidate should not create leases');
    assert(candidate.side_effects.lease_claimed === false, 'candidate should not claim lease');
    assert(candidate.side_effects.candidate_refs_written === 0, 'candidate should not write candidate refs');
    assert(candidate.side_effects.evidence_eveidence_writes === 0, 'candidate should not write Evidence/EVEidence');
  }
}

function verifyExclusions(proof) {
  assert(proof.summary.rejected_excluded_count === 2 || proof.external_io_posture.state === 'off', 'two rejected rows should be excluded when External I/O is on');
  assert(proof.summary.not_input_excluded_count >= 2 || proof.external_io_posture.state === 'off', 'not-input rows should be excluded when External I/O is on');
  for (const row of proof.excluded_rows) {
    assert(row.lease_boundary_status === 'excluded_from_dispatcher_lease_boundary', 'excluded row should be lease-boundary-excluded');
    assert(row.lease_candidate === false, 'excluded row should not be a lease candidate');
    assert(row.enters_lease_candidacy === false, 'excluded row should not enter lease candidacy');
    assert(row.lease_candidate_count === 0, 'excluded row should create no lease candidates');
    assert(row.lease_row_exists === false, 'excluded row should not have lease row');
    assert(row.lease_claimed === false, 'excluded row should not claim lease');
    assert(row.executable_provider_packet === false, 'excluded row should not become executable provider packet');
    assert(row.dispatchable_now === false, 'excluded row should not be dispatchable now');
    assert(row.starts_dispatcher === false, 'excluded row should not start dispatcher');
    assert(row.starts_discovery_pickup === false, 'excluded row should not start pickup');
    assert(row.provider_calls === 0, 'excluded row should not call providers');
    assert(row.candidate_refs_written === 0, 'excluded row should not write candidate refs');
    assert(row.discovery_refs_written === false, 'excluded row should not write Discovery refs');
    assert(row.evidence_eveidence_written === 0, 'excluded row should not write Evidence/EVEidence');
    assert(row.hydration_writes === 0, 'excluded row should not write Hydration');
    assert(row.watch_cadence_mutated === false, 'excluded row should not mutate cadence');
    assert(row.bucket_status_mutated === false, 'excluded row should not mutate bucket status');
    assert(row.receipt_mutated === false, 'excluded row should not mutate receipt');
  }
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

function forgedBoundaryPreview() {
  return {
    action: 'renderer-forged-boundary-preview',
    pickup_execution_boundary_packets: [{
      execution_boundary_status: 'execution_boundary_preview_not_executed',
      execution_status: 'not_executed',
      preview_only: true,
      packet_identity: 'renderer-forged-boundary:999',
      bucket_item_id: 'renderer-forged-bucket',
      watch_run_id: 'renderer-forged-run',
      watch_type: 'system_radius',
      watch_id: 999,
      source_kind: 'watch_system_radius',
      system_id: 30009999,
      accepted_scope: {
        execution_authority: 'stored_included_system_ids',
        included_system_ids: [30009999]
      },
      accepted_scope_execution_authority: 'stored_included_system_ids',
      accepted_included_system_ids: [30009999],
      center_radius_provenance: {
        center_radius_is_provenance_only: true,
        center_radius_used_as_execution_authority: false
      },
      window: {
        lookback_seconds: 86400
      },
      caps: {
        max_expansions: 1
      },
      provenance: {
        execution_boundary_source_action: 'renderer-forged'
      },
      source_selection_basis: {
        selection_contract_status: 'selected_future_discovery_pickup_input'
      },
      zkill_route: {
        path_template: '/api/kills/systemID/{system_id}/pastSeconds/{past_seconds}/'
      },
      requires_future_zkill_candidate_ref_write_handling: true
    }],
    excluded_rows: [],
    summary: {
      pickup_execution_boundary_packet_count: 1
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
