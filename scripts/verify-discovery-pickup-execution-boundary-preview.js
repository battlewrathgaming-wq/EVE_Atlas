const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

const NOW = '2026-06-12T12:00:00.000Z';
const COMMAND = 'discovery.pickup_execution_boundary.preview';

async function main() {
  verifyRegistrationAndCoverage();

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedProductBucketRows(db);
    const beforeOn = sideEffectCounts(db);
    const onProof = await invokeServiceCommand(COMMAND, {
      externalIoState: 'on',
      providerRoutePacketPreview: forgedRoutePreview()
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
    verifyBoundaryPackets(onProof);
    verifyExclusions(onProof);
    verifyExclusions(offProof);
    assertSame(afterOn, beforeOn, 'pickup execution boundary preview with External I/O on should not mutate tables');
    assertSame(afterOff, beforeOff, 'pickup execution boundary preview with External I/O off should not mutate tables');
    assert(onProof.boundary_table_check.unchanged === true, 'on proof should report unchanged tables');
    assert(offProof.boundary_table_check.unchanged === true, 'off proof should report unchanged tables');
    assert(onProof.input_authority.renderer_supplied_route_preview_authoritative === false, 'renderer supplied route preview should not be authoritative');
    assert(onProof.pickup_execution_boundary_packets.every((row) => row.watch_id !== 999), 'renderer forged route preview should not create boundary packets');

    console.log(JSON.stringify({
      status: 'Discovery pickup execution boundary preview verified',
      command: COMMAND,
      external_io_on_summary: onProof.summary,
      external_io_off_summary: offProof.summary,
      sample_boundary_packet: onProof.pickup_execution_boundary_packets[0],
      sample_held_exclusion: rowByFamily(offProof, 'held_by_external_io'),
      sample_rejected_exclusion: rowByReason(onProof, 'accepted_scope_json_malformed_or_unparseable'),
      execution_boundary_requirements: onProof.execution_boundary_requirements,
      source_route_preview_summary: onProof.source_route_preview_summary,
      boundary_table_check: onProof.boundary_table_check,
      input_authority: onProof.input_authority
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('Discovery pickup execution boundary preview verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === COMMAND);
  assert(command, 'Discovery pickup execution boundary preview command should be registered');
  assert(command.classification === 'read-only', 'Discovery pickup execution boundary preview should be read-only');
  assert(command.effects.includes('read-only'), 'Discovery pickup execution boundary preview should declare read-only effect');
  assert(command.renderer_allowed === true, 'Discovery pickup execution boundary preview should be renderer eligible');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === COMMAND);
  assert(row?.storage_action_class === 'local_db_inspection', 'execution boundary preview should be local DB inspection');
  assert(row?.runtime_context === 'discovery_pickup_execution_boundary_preview_readout', 'execution boundary preview should have readout context');
  assert(row?.external_io_dependency === 'none', 'execution boundary preview should not depend on External I/O provider movement itself');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'execution boundary preview should remain non-enforcing proof');
}

function verifyBoundary(proof, label) {
  assert(proof.action === COMMAND, `${label} should name action`);
  assert(proof.boundary_preview_only === true, `${label} should be boundary preview only`);
  assert(proof.contract_only === true, `${label} should be contract-only`);
  assert(proof.preview_only === true, `${label} should be preview-only`);
  assert(proof.read_only === true, `${label} should be read-only`);
  assert(proof.read_only_to_operator_corpus === true, `${label} should be read-only to operator corpus`);
  assert(proof.mutates_state === false, `${label} should not mutate state`);
  assert(proof.hs489_route_packet_preview_basis === true, `${label} should use HS489 route preview basis`);
  assert(proof.product_schema_used === true, `${label} should use product schema rows`);
  assert(proof.product_schema_updated === false, `${label} should not update product schema`);
  assert(proof.schema_changes === 0, `${label} should not change schema`);
  assert(proof.operator_corpus_mutated === false, `${label} should not mutate operator corpus`);
  assert(proof.pickup_execution_started === false, `${label} should not start pickup execution`);
  assert(proof.discovery_pickup_execution === false, `${label} should not execute pickup`);
  assert(proof.boundary_preview_is_dispatcher === false, `${label} should not be dispatcher`);
  assert(proof.boundary_preview_is_queue === false, `${label} should not be queue`);
  assert(proof.boundary_preview_is_lease === false, `${label} should not be lease`);
  assert(proof.boundary_preview_is_provider_worker === false, `${label} should not be provider worker`);
  assert(proof.executable_provider_packets_created === 0, `${label} should not create executable provider packets`);
  assert(proof.provider_packets === 0, `${label} should not create provider packets`);
  assert(proof.provider_calls === 0, `${label} should not call providers`);
  assert(proof.live_api_calls === 0, `${label} should not call live APIs`);
  assert(proof.zkill_calls === 0, `${label} should not call zKill`);
  assert(proof.esi_calls === 0, `${label} should not call ESI`);
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
  assert(proof.summary.source_route_packet_preview_count === 5, 'on proof should preserve five HS489 route packet previews');
  assert(proof.summary.pickup_execution_boundary_packet_count === 5, 'on proof should classify five boundary packets');
  assert(proof.summary.not_executed_packet_count === 5, 'on proof should mark all packets not executed');
  assert(proof.summary.requires_external_io_open_count === 5, 'all boundary packets should require External I/O open before execution');
  assert(proof.summary.requires_future_dispatcher_ownership_count === 5, 'all boundary packets should require dispatcher ownership');
  assert(proof.summary.requires_future_lease_claim_semantics_count === 5, 'all boundary packets should require lease/claim semantics');
  assert(proof.summary.requires_future_provider_pacing_count === 5, 'all boundary packets should require provider pacing');
  assert(proof.summary.requires_future_zkill_candidate_ref_write_handling_count === 5, 'all boundary packets should require candidate-ref handling');
  assert(proof.summary.excluded_row_count === 4, 'on proof should expose four source exclusions');
  assert(proof.source_route_preview_summary.provider_route_packet_preview_count === 5, 'source HS489 route packet count should be visible');
}

function verifyOffCase(proof) {
  assert(proof.external_io_posture.state === 'off', 'off proof should report External I/O off');
  assert(proof.summary.source_route_packet_preview_count === 0, 'off proof should have no route packets');
  assert(proof.summary.pickup_execution_boundary_packet_count === 0, 'off proof should classify no boundary packets');
  assert(proof.summary.not_executed_packet_count === 0, 'off proof should have no executed packets');
  assert(proof.summary.excluded_row_count === 7, 'off proof should expose all rows as exclusions');
  assert(proof.summary.held_excluded_count === 3, 'off proof should hold three rows by External I/O');
}

function verifyBoundaryPackets(proof) {
  const packets = proof.pickup_execution_boundary_packets;
  assert(packets.length === 5, 'five execution boundary packets should be classified');
  assert(packets.filter((entry) => entry.watch_id === 1).length === 2, 'watch 1 should preserve two boundary packets');
  assert(packets.filter((entry) => entry.watch_id === 2).length === 2, 'watch 2 should preserve two boundary packets');
  assert(packets.filter((entry) => entry.watch_id === 3).length === 1, 'watch 3 should preserve one boundary packet');

  for (const packet of packets) {
    assert(packet.execution_boundary_status === 'execution_boundary_preview_not_executed', 'packet should be boundary preview');
    assert(packet.execution_status === 'not_executed', 'packet should be not executed');
    assert(packet.preview_only === true, 'packet should be preview-only');
    assert(packet.executable_now === false, 'packet should not be executable now');
    assert(packet.executable_provider_packet === false, 'packet should not be executable provider packet');
    assert(packet.dispatchable_now === false, 'packet should not be dispatchable now');
    assert(packet.lease_claimed === false, 'packet should not claim lease');
    assert(packet.provider_call_started === false, 'packet should not start provider call');
    assert(packet.not_evidence_expansion === true, 'packet should not be Evidence expansion');
    assert(packet.not_hydration === true, 'packet should not be Hydration');
    assert(packet.provider === 'zkillboard', 'packet should preserve provider');
    assert(packet.provider_route_family === 'zkill_system_killmails', 'packet should preserve route family');
    assert(packet.packet_identity, 'packet should preserve packet identity');
    assert(packet.bucket_item_id, 'packet should preserve bucket item id');
    assert(packet.watch_run_id, 'packet should preserve watch run id');
    assert(packet.watch_type === 'system_radius', 'packet should preserve system/radius watch type');
    assert(packet.source_kind === 'watch_system_radius', 'packet should preserve source kind');
    assert(packet.system_id, 'packet should preserve system id');
    assert(packet.accepted_scope?.execution_authority === 'stored_included_system_ids', 'packet should preserve accepted scope');
    assert(packet.accepted_included_system_ids.includes(packet.system_id), 'packet system should come from accepted included systems');
    assert(packet.center_radius_provenance.center_radius_is_provenance_only === true, 'center/radius should remain provenance only');
    assert(packet.center_radius_provenance.center_radius_used_as_execution_authority === false, 'center/radius should not become execution authority');
    assert(packet.window?.lookback_seconds === 86400, 'packet should preserve window');
    assert(packet.caps?.max_expansions > 0, 'packet should preserve caps');
    assert(packet.provenance?.execution_boundary_source_action === COMMAND, 'packet should preserve execution boundary provenance');
    assert(packet.source_selection_basis?.selection_contract_status === 'selected_future_discovery_pickup_input', 'packet should preserve source selection basis');
    assert(packet.zkill_route?.path_template === '/api/kills/systemID/{system_id}/pastSeconds/{past_seconds}/', 'packet should preserve zKill route template');
    assert(packet.requires_external_io_open === true, 'packet should require External I/O open');
    assert(packet.requires_future_dispatcher_ownership === true, 'packet should require future dispatcher ownership');
    assert(packet.requires_future_lease_claim_semantics === true, 'packet should require future lease claim semantics');
    assert(packet.requires_future_provider_pacing === true, 'packet should require future provider pacing');
    assert(packet.requires_future_zkill_candidate_ref_write_handling === true, 'packet should require future candidate-ref write handling');
    assert(packet.candidate_ref_write_handling_status === 'future_required_not_opened', 'candidate-ref handling should remain future');
    assert(packet.future_provider_movement_status === 'not_opened_by_boundary_preview', 'provider movement should not be opened');
    assert(packet.side_effects.provider_calls === 0, 'packet should not call providers');
    assert(packet.side_effects.executable_provider_packets_created === 0, 'packet should not create executable provider packets');
    assert(packet.side_effects.candidate_refs_written === 0, 'packet should not write candidate refs');
    assert(packet.side_effects.evidence_eveidence_writes === 0, 'packet should not write Evidence/EVEidence');
  }
}

function verifyExclusions(proof) {
  assert(proof.summary.rejected_excluded_count === 2, 'two rejected rows should be excluded');
  assert(proof.summary.not_input_excluded_count >= 2, 'not-input rows should be excluded');
  for (const row of proof.excluded_rows) {
    assert(row.execution_boundary_status === 'excluded_from_pickup_execution_boundary', 'excluded row should be boundary-excluded');
    assert(row.enters_executable_packet_posture === false, 'excluded row should not enter executable posture');
    assert(row.pickup_execution_boundary_packet_count === 0, 'excluded row should create no boundary packets');
    assert(row.executable_provider_packet === false, 'excluded row should not become executable provider packet');
    assert(row.dispatchable_now === false, 'excluded row should not be dispatchable now');
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

function forgedRoutePreview() {
  return {
    action: 'renderer-forged-route-preview',
    provider_route_packet_previews: [{
      provider_route_packet_status: 'preview_only_non_executing',
      preview_only: true,
      packet_identity: 'renderer-forged-route:999',
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
        source_action: 'renderer-forged'
      },
      source_selection_basis: {
        selection_contract_status: 'selected_future_discovery_pickup_input'
      },
      zkill_route: {
        path_template: '/api/kills/systemID/{system_id}/pastSeconds/{past_seconds}/'
      }
    }],
    excluded_rows: [],
    summary: {
      provider_route_packet_preview_count: 1
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
