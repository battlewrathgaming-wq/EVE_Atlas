const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

const NOW = '2026-06-12T12:00:00.000Z';
const COMMAND = 'discovery.provider_route_packet.preview';

async function main() {
  verifyRegistrationAndCoverage();

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedProductBucketRows(db);
    const beforeOn = sideEffectCounts(db);
    const onProof = await invokeServiceCommand(COMMAND, {
      externalIoState: 'on',
      discoveryPickupSelectionCandidates: [forgedSelectionCandidate()]
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
    verifyRoutePackets(onProof);
    verifyExclusions(onProof);
    verifyExclusions(offProof);
    verifyPacketCounts(onProof);
    assertSame(afterOn, beforeOn, 'provider route packet preview with External I/O on should not mutate tables');
    assertSame(afterOff, beforeOff, 'provider route packet preview with External I/O off should not mutate tables');
    assert(onProof.boundary_table_check.unchanged === true, 'on proof should report unchanged tables');
    assert(offProof.boundary_table_check.unchanged === true, 'off proof should report unchanged tables');
    assert(onProof.input_authority.renderer_supplied_candidates_authoritative === false, 'renderer supplied candidates should not be authoritative');
    assert(onProof.provider_route_packet_previews.every((row) => row.watch_id !== 999), 'renderer forged candidate should not create route packets');

    console.log(JSON.stringify({
      status: 'Discovery provider route packet preview verified',
      command: COMMAND,
      external_io_on_summary: onProof.summary,
      external_io_off_summary: offProof.summary,
      sample_provider_route_packet_preview: onProof.provider_route_packet_previews[0],
      sample_packet_count: onProof.selected_candidate_packet_counts[0],
      sample_held_exclusion: rowByFamily(offProof, 'held_by_external_io'),
      sample_rejected_exclusion: rowByReason(onProof, 'accepted_scope_json_malformed_or_unparseable'),
      sample_actor_exclusion: rowByReason(onProof, 'actor_watch_bucket_rows_are_parked_for_pickup_readout'),
      route_policy: onProof.zkill_route_policy_preview,
      boundary_table_check: onProof.boundary_table_check,
      input_authority: onProof.input_authority
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('Discovery provider route packet preview verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === COMMAND);
  assert(command, 'Discovery provider route packet preview command should be registered');
  assert(command.classification === 'read-only', 'Discovery provider route packet preview should be read-only');
  assert(command.effects.includes('read-only'), 'Discovery provider route packet preview should declare read-only effect');
  assert(command.renderer_allowed === true, 'Discovery provider route packet preview should be renderer eligible');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === COMMAND);
  assert(row?.storage_action_class === 'local_db_inspection', 'route packet preview should be local DB inspection');
  assert(row?.runtime_context === 'discovery_provider_route_packet_preview_readout', 'route packet preview should have readout context');
  assert(row?.external_io_dependency === 'none', 'route packet preview should not depend on External I/O provider movement itself');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'route packet preview should remain non-enforcing proof');
}

function verifyBoundary(proof, label) {
  assert(proof.action === COMMAND, `${label} should name action`);
  assert(proof.contract_only === true, `${label} should be contract-only`);
  assert(proof.preview_only === true, `${label} should be preview-only`);
  assert(proof.read_only === true, `${label} should be read-only`);
  assert(proof.read_only_to_operator_corpus === true, `${label} should be read-only to operator corpus`);
  assert(proof.mutates_state === false, `${label} should not mutate state`);
  assert(proof.product_bucket_selection_basis === true, `${label} should use product selection basis`);
  assert(proof.product_schema_used === true, `${label} should use product schema rows`);
  assert(proof.product_schema_updated === false, `${label} should not update product schema`);
  assert(proof.schema_changes === 0, `${label} should not change schema`);
  assert(proof.operator_corpus_mutated === false, `${label} should not mutate operator corpus`);
  assert(proof.provider_route_packet_shape_only === true, `${label} should be shape only`);
  assert(proof.provider_route_packets_are_preview_only === true, `${label} packets should be preview-only`);
  assert(proof.provider_route_packets_execute === false, `${label} packets should not execute`);
  assert(proof.provider_route_packets_persisted === false, `${label} packets should not persist`);
  assert(proof.route_packets_for_later_zkill_candidate_acquisition_only === true, `${label} should target later zKill candidate acquisition only`);
  assert(proof.route_packets_are_not_evidence_expansion === true, `${label} should not be Evidence expansion`);
  assert(proof.route_packets_are_not_hydration === true, `${label} should not be Hydration`);
  assert(proof.center_radius_execution_authority === false, `${label} center/radius should not be authority`);
  assert(proof.center_radius_provenance_only === true, `${label} center/radius should be provenance only`);
  assert(proof.production_pickup_execution === false, `${label} should not execute pickup`);
  assert(proof.provider_calls === 0, `${label} should not call providers`);
  assert(proof.live_api_calls === 0, `${label} should not call live APIs`);
  assert(proof.zkill_calls === 0, `${label} should not call zKill`);
  assert(proof.esi_calls === 0, `${label} should not call ESI`);
  assert(proof.discovery_pickup_started === false, `${label} should not start Discovery pickup`);
  assert(proof.discovery_pickup_packets_created === 0, `${label} should not create pickup packets`);
  assert(proof.pickup_units_created === 0, `${label} should not create pickup units`);
  assert(proof.pickup_units_leased === 0, `${label} should not lease pickup units`);
  assert(proof.leases_created === 0, `${label} should not create leases`);
  assert(proof.queue_items_created === 0, `${label} should not create queue items`);
  assert(proof.durable_discovery_task_rows_written === 0, `${label} should not write durable Discovery tasks`);
  assert(proof.dispatcher_started === false, `${label} should not start dispatcher`);
  assert(proof.dispatcher_queue_lease_behavior === false, `${label} should not implement dispatcher/queue/lease`);
  assert(proof.provider_packets_created === 0, `${label} should not create executable provider packets`);
  assert(proof.provider_packets_dispatched === 0, `${label} should not dispatch provider packets`);
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
  assert(proof.summary.selected_candidate_count === 3, 'on proof should select three eligible candidates');
  assert(proof.summary.provider_route_packet_preview_count === 5, 'on proof should create five inert route packet previews');
  assert(proof.summary.excluded_row_count === 4, 'on proof should expose four source exclusions');
  assert(proof.summary.held_excluded_count === 0, 'on proof should have no held exclusions');
  assert(proof.summary.overlapping_watch_scopes_remain_independent === 1, 'overlap should remain independent packet previews');
}

function verifyOffCase(proof) {
  assert(proof.external_io_posture.state === 'off', 'off proof should report External I/O off');
  assert(proof.summary.selected_candidate_count === 0, 'off proof should select no candidates');
  assert(proof.summary.provider_route_packet_preview_count === 0, 'off proof should create no route packet previews');
  assert(proof.summary.excluded_row_count === 7, 'off proof should expose all seven rows as exclusions');
  assert(proof.summary.held_excluded_count === 3, 'off proof should exclude three held rows');
}

function verifyRoutePackets(proof) {
  const packets = proof.provider_route_packet_previews;
  assert(packets.length === 5, 'five route packet previews should be emitted from accepted included systems');
  const watchOnePackets = packets.filter((entry) => entry.watch_id === 1);
  const watchTwoPackets = packets.filter((entry) => entry.watch_id === 2);
  const watchThreePackets = packets.filter((entry) => entry.watch_id === 3);
  assert(watchOnePackets.length === 2, 'watch 1 should fan to two system route packets');
  assert(watchTwoPackets.length === 2, 'watch 2 should fan to two system route packets');
  assert(watchThreePackets.length === 1, 'watch 3 should fan to one system route packet');
  assert(watchOnePackets.some((entry) => entry.system_id === 30003597), 'watch 1 should include shared system packet');
  assert(watchTwoPackets.some((entry) => entry.system_id === 30003597), 'watch 2 should include independent shared system packet');

  for (const packet of packets) {
    assert(packet.provider_route_packet_status === 'preview_only_non_executing', 'packet should be preview-only');
    assert(packet.preview_only === true, 'packet should declare preview-only');
    assert(packet.executes_provider_call === false, 'packet should not execute provider call');
    assert(packet.dispatchable_now === false, 'packet should not be dispatchable now');
    assert(packet.persisted === false, 'packet should not persist');
    assert(packet.provider === 'zkillboard', 'packet should target zKillboard provider family');
    assert(packet.provider_route_family === 'zkill_system_killmails', 'packet should be system killmail route family');
    assert(packet.route_intent === 'candidate_lead_acquisition', 'packet should be candidate acquisition intent');
    assert(packet.packet_shape_for_later === 'zkill_candidate_acquisition_only', 'packet should be for later zKill acquisition only');
    assert(packet.not_evidence_expansion === true, 'packet should not be Evidence expansion');
    assert(packet.not_hydration === true, 'packet should not be Hydration');
    assert(packet.bucket_item_id, 'packet should preserve bucket_item_id');
    assert(packet.watch_run_id, 'packet should preserve watch_run_id');
    assert(packet.watch_type === 'system_radius', 'packet should preserve system/radius watch type');
    assert(packet.source_kind === 'watch_system_radius', 'packet should preserve source kind');
    assert(packet.accepted_scope?.execution_authority === 'stored_included_system_ids', 'packet should preserve stored scope authority');
    assert(Array.isArray(packet.accepted_included_system_ids), 'packet should expose accepted included systems');
    assert(packet.accepted_included_system_ids.includes(packet.system_id), 'packet system should come from accepted included systems');
    assert(packet.center_radius_provenance.center_radius_is_provenance_only === true, 'center/radius should be provenance only');
    assert(packet.center_radius_provenance.center_radius_used_as_execution_authority === false, 'center/radius should not be execution authority');
    assert(packet.window?.lookback_seconds === 86400, 'packet should preserve window');
    assert(packet.route_window.past_seconds === 86400, 'packet should derive zKill pastSeconds from window');
    assert(packet.caps?.max_expansions > 0, 'packet should preserve caps');
    assert(packet.provenance?.provider_route_preview_source_action === COMMAND, 'packet should preserve route preview provenance');
    assert(packet.source_selection_basis.selection_contract_status === 'selected_future_discovery_pickup_input', 'packet should preserve selection basis');
    assert(packet.zkill_route.method === 'GET', 'zKill route should be GET shape');
    assert(packet.zkill_route.path_template === '/api/kills/systemID/{system_id}/pastSeconds/{past_seconds}/', 'zKill route should use structured path template');
    assert(packet.zkill_route.path_parameters.system_id === packet.system_id, 'zKill route should use packet system ID');
    assert(packet.zkill_route.path_parameters.past_seconds === packet.route_window.past_seconds, 'zKill route should use derived pastSeconds value');
    assert(packet.zkill_route.trailing_slash_required === true, 'zKill route should require trailing slash');
    assert(packet.zkill_route.structured_route_only === true, 'zKill route should be structured only');
    assert(packet.zkill_route.arbitrary_modifier_grammar_allowed === false, 'zKill route should not open arbitrary modifier grammar');
    assert(packet.provider_policy_preview.provider_calls === 0, 'packet should not call providers');
    assert(packet.side_effects.candidate_refs_written === 0, 'packet should not write candidate refs');
    assert(packet.side_effects.evidence_eveidence_writes === 0, 'packet should not write Evidence/EVEidence');
  }
}

function verifyPacketCounts(proof) {
  const counts = proof.selected_candidate_packet_counts;
  assert(counts.length === 3, 'three selected candidate packet counts should be present');
  assert(counts.find((entry) => entry.watch_id === 1)?.route_packet_preview_count === 2, 'watch 1 count should be two');
  assert(counts.find((entry) => entry.watch_id === 2)?.route_packet_preview_count === 2, 'watch 2 count should be two');
  assert(counts.find((entry) => entry.watch_id === 3)?.route_packet_preview_count === 1, 'watch 3 count should be one');
  for (const entry of counts) {
    assert(entry.creates_provider_packets === false, 'candidate count should not create provider packets');
    assert(entry.provider_calls === 0, 'candidate count should not call providers');
    assert(entry.candidate_refs_written === 0, 'candidate count should not write refs');
  }
}

function verifyExclusions(proof) {
  assert(proof.summary.rejected_excluded_count === 2, 'two rejected rows should be excluded');
  assert(proof.summary.not_input_excluded_count >= 2, 'not-input rows should be excluded');
  assert(proof.summary.actor_excluded_count === 1, 'actor row should be excluded');
  assert(proof.summary.non_open_excluded_count === 1, 'non-open row should be excluded');
  assert(proof.summary.malformed_or_missing_scope_excluded_count === 2, 'bad scope rows should be excluded');
  for (const row of proof.excluded_rows) {
    assert(row.provider_route_packet_status === 'excluded_from_provider_route_packet_preview', 'excluded row should be route-packet excluded');
    assert(row.provider_route_packet_preview_count === 0, 'excluded row should create no packets');
    assert(row.creates_provider_packet === false, 'excluded row should create no provider packet');
    assert(row.starts_discovery_pickup === false, 'excluded row should not start pickup');
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

function forgedSelectionCandidate() {
  return {
    selection_contract_status: 'selected_future_discovery_pickup_input',
    discovery_pickup_input_candidate: true,
    future_only: true,
    product_schema_row: true,
    bucket_item_id: 'renderer-forged-bucket',
    watch_run_id: 'renderer-forged-run',
    watch_type: 'system_radius',
    watch_id: 999,
    source_kind: 'watch_system_radius',
    bucket_status: 'open',
    accepted_scope: {
      execution_authority: 'stored_included_system_ids',
      included_system_ids: [30009999],
      center_radius_is_provenance_only: true,
      center_radius_used_as_execution_authority: false
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
