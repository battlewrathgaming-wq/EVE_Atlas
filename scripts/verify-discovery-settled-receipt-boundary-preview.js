const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

const NOW = '2026-06-12T12:00:00.000Z';
const COMMAND = 'discovery.settled_receipt_boundary.preview';

async function main() {
  verifyRegistrationAndCoverage();

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedProductBucketRows(db);
    const before = sideEffectCounts(db);
    const proof = await invokeServiceCommand(COMMAND, {
      externalIoState: 'on',
      candidateRefLandingBoundaryPreview: forgedLandingPreview(),
      fixtureExistingDiscoveryMemory: [
        { killmail_id: 93000002, hash: 'hash-known-bravo' }
      ]
    }, {
      db,
      source: 'renderer'
    });
    const after = sideEffectCounts(db);

    verifyBoundary(proof);
    verifySummary(proof);
    verifyReceiptRows(proof);
    verifyProjectionShape(proof);
    verifyTrustedPostureVariants(db);
    assertSame(after, before, 'settled receipt boundary preview should not mutate tables');
    assert(proof.boundary_table_check.unchanged === true, 'proof should report unchanged tables');
    assert(proof.input_authority.renderer_supplied_landing_preview_authoritative === false, 'renderer supplied landing preview should not be authoritative');
    assert(proof.settled_receipt_boundary_rows.every((row) => row.watch_id !== 999), 'renderer forged landing preview should not create receipt rows');

    console.log(JSON.stringify({
      status: 'Discovery settled receipt boundary preview verified',
      command: COMMAND,
      summary: proof.summary,
      receipt_model: proof.receipt_model,
      sample_refs_found: rowWithAcceptedNewRefs(proof),
      sample_capped: rowByPosture(proof, 'capped'),
      sample_deferred: rowByPosture(proof, 'provider_deferred'),
      sample_failed_retryable: rowByPosture(proof, 'failed_retryable'),
      caller_projection_sample: proof.caller_receipt_projections[0],
      source_candidate_ref_landing_summary: proof.source_candidate_ref_landing_summary,
      boundary_table_check: proof.boundary_table_check,
      input_authority: proof.input_authority
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('Discovery settled receipt boundary preview verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === COMMAND);
  assert(command, 'Discovery settled receipt boundary preview command should be registered');
  assert(command.classification === 'read-only', 'Discovery settled receipt boundary preview should be read-only');
  assert(command.effects.includes('read-only'), 'Discovery settled receipt boundary preview should declare read-only effect');
  assert(command.renderer_allowed === true, 'Discovery settled receipt boundary preview should be renderer eligible');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === COMMAND);
  assert(row?.storage_action_class === 'local_db_inspection', 'settled receipt boundary preview should be local DB inspection');
  assert(row?.runtime_context === 'discovery_settled_receipt_boundary_preview_readout', 'settled receipt boundary preview should have readout context');
  assert(row?.external_io_dependency === 'none', 'settled receipt boundary preview should not depend on External I/O provider movement itself');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'settled receipt boundary preview should remain non-enforcing proof');
}

function verifyBoundary(proof) {
  assert(proof.action === COMMAND, 'proof should name action');
  assert(proof.settled_receipt_boundary_preview_only === true, 'proof should be settled receipt boundary preview only');
  assert(proof.contract_only === true, 'proof should be contract-only');
  assert(proof.preview_only === true, 'proof should be preview-only');
  assert(proof.read_only === true, 'proof should be read-only');
  assert(proof.read_only_to_operator_corpus === true, 'proof should be read-only to operator corpus');
  assert(proof.mutates_state === false, 'proof should not mutate state');
  assert(proof.hs495_candidate_ref_landing_basis === true, 'proof should use HS495 landing basis');
  assert(proof.candidate_ref_landing_path_used_by_default === true, 'proof should use HS495 path by default');
  assert(proof.canonical_internal_discovery_basis_capture_rich === true, 'internal basis should remain capture-rich');
  assert(proof.caller_receipt_projection_bounded === true, 'caller projection should be bounded');
  assert(proof.caller_receipt_projection_factual_only === true, 'caller projection should be factual-only');
  assert(proof.watch_cadence_completion_decision === 'not_decided_here', 'proof should not decide Watch cadence/completion');
  assert(proof.watch_scheduling_decided_by_discovery === false, 'Discovery should not decide Watch scheduling');
  assert(proof.watch_completion_semantics_opened === false, 'proof should not open Watch completion semantics');
  assert(proof.provider_calls === 0, 'proof should not call providers');
  assert(proof.live_api_calls === 0, 'proof should not call live APIs');
  assert(proof.zkill_calls === 0, 'proof should not call zKill');
  assert(proof.esi_calls === 0, 'proof should not call ESI');
  assert(proof.discovery_pickup_execution === false, 'proof should not execute pickup');
  assert(proof.provider_execution_started === false, 'proof should not start provider execution');
  assert(proof.dispatcher_runtime_started === false, 'proof should not start dispatcher runtime');
  assert(proof.durable_queue_rows_written === 0, 'proof should not write queue rows');
  assert(proof.durable_lease_rows_written === 0, 'proof should not write lease rows');
  assert(proof.lease_claims_created === 0, 'proof should not create lease claims');
  assert(proof.candidate_refs_written === 0, 'proof should not write candidate refs');
  assert(proof.discovered_killmail_refs_written === 0, 'proof should not write discovered_killmail_refs');
  assert(proof.discovery_refs_mutated === 0, 'proof should not mutate Discovery refs');
  assert(proof.evidence_writes === 0, 'proof should not write Evidence/EVEidence');
  assert(proof.hydration_writes === 0, 'proof should not write Hydration');
  assert(proof.observation_created === false, 'proof should not create Observation');
  assert(proof.watch_mutations === 0, 'proof should not mutate Watch rows');
  assert(proof.cadence_mutations === 0, 'proof should not mutate cadence');
  assert(proof.watch_bucket_status_mutations === 0, 'proof should not mutate bucket status');
  assert(proof.receipt_mutations === 0, 'proof should not mutate receipts');
  assert(proof.schema_changes === 0, 'proof should not change schema');
  assert(proof.runtime_enforcement_active === false, 'proof should not activate enforcement');
  assert(proof.command_blocking_active === false, 'proof should not activate command blocking');
  assert(proof.ui_work === false, 'proof should not do UI work');
}

function verifySummary(proof) {
  assert(proof.summary.source_candidate_ref_landing_row_count === 8, 'proof should consume eight HS495 landing rows');
  assert(proof.summary.settled_receipt_boundary_row_count === 5, 'proof should project five settled receipt rows');
  assert(proof.summary.caller_receipt_projection_count === 5, 'proof should project five caller-safe receipt rows');
  assert(proof.summary.refs_found_count === 2, 'proof should include two refs_found receipts');
  assert(proof.summary.capped_count === 1, 'proof should include one capped receipt');
  assert(proof.summary.provider_deferred_count === 1, 'proof should include one provider deferred receipt');
  assert(proof.summary.failed_retryable_count === 1, 'proof should include one retryable failed receipt');
  assert(proof.summary.candidate_refs_found_previewed_count === 2, 'proof should include two accepted new candidate refs across receipts');
  assert(proof.summary.accepted_new_candidate_ref_count === 2, 'proof should count two accepted new candidate refs');
  assert(proof.summary.already_known_candidate_ref_count === 1, 'proof should count one already-known candidate ref separately');
  assert(proof.summary.duplicate_refs_suppressed_count === 2, 'proof should include duplicate suppression');
  assert(proof.summary.already_known_refs_count === 1, 'proof should include already-known refs');
  assert(proof.summary.malformed_refs_rejected_count === 1, 'proof should include malformed rejection');
  assert(proof.summary.receipts_settled_enough_for_caller_count === 5, 'all projected receipts should be settled enough for caller consumption');
  assert(proof.summary.discovered_killmail_refs_written === 0, 'proof should write no discovered_killmail_refs');
  assert(proof.summary.evidence_eveidence_writes === 0, 'proof should write no Evidence/EVEidence');
  assert(proof.summary.hydration_writes === 0, 'proof should write no Hydration');
  assert(proof.source_candidate_ref_landing_summary.candidate_ref_landing_preview_count === 8, 'source HS495 landing row count should be visible');
}

function verifyReceiptRows(proof) {
  const rows = proof.settled_receipt_boundary_rows;
  assert(rows.length === 5, 'five receipt rows should be present');
  for (const row of rows) {
    assert(proof.allowed_settled_postures.includes(row.settled_receipt_status), `unexpected receipt posture ${row.settled_receipt_status}`);
    assert(row.preview_only === true, 'receipt row should be preview-only');
    assert(row.read_only === true, 'receipt row should be read-only');
    assert(row.persisted === false, 'receipt row should not be persisted');
    assert(row.settled_enough_for_caller_receipt === true, 'receipt should be settled enough for caller receipt');
    assert(row.caller_can_stop_waiting_on_emitted_work_item === true, 'caller should be able to stop waiting on emitted work item');
    assert(row.watch_cadence_completion_decision === 'not_decided_here', 'receipt should not decide Watch cadence/completion');
    assert(row.watch_scheduling_decided_by_discovery === false, 'receipt should not decide Watch scheduling');
    assert(row.watch_next_action_decided_by_discovery === false, 'receipt should not decide Watch next action');
    assert(row.writes_receipt === false, 'receipt row should not write receipt');
    assert(row.writes_watch_bucket_status === false, 'receipt row should not write bucket status');
    assert(row.writes_discovered_killmail_refs === false, 'receipt row should not write discovered_killmail_refs');
    assert(row.writes_evidence_eveidence === false, 'receipt row should not write Evidence/EVEidence');
    assert(row.side_effects.provider_calls === 0, 'receipt row should not call providers');
    assert(row.side_effects.candidate_refs_written === 0, 'receipt row should not write candidate refs');
    assert(row.side_effects.evidence_eveidence_writes === 0, 'receipt row should not write Evidence/EVEidence');
  }

  const refsFound = rowWithAcceptedNewRefs(proof);
  assert(refsFound.candidate_refs_found_previewed.length >= 1, 'refs_found receipt should include previewed refs');
  assert(refsFound.candidate_refs_found_previewed.every((ref) => ref.possible_lead_only === true), 'refs should remain possible leads only');
  assertNoDuplicateFactsCountedAsFound(proof);

  const capped = rowByPosture(proof, 'capped');
  assert(capped.capped_posture.capped === true, 'capped receipt should expose cap');
  assert(capped.capped_posture.capped_is_not_failure === true, 'capped receipt should not be failure');
  assert(capped.malformed_refs_rejected.length === 1, 'capped receipt should carry malformed rejection fact');
  assert(capped.candidate_refs_found_previewed.length === 1, 'capped receipt should count only the accepted new ref as found');
  assert(capped.already_known_refs.length === 1, 'capped receipt should keep already-known refs separate');
  assert(capped.duplicate_refs_suppressed.length === 1, 'capped receipt should keep duplicate refs separate');

  const deferred = rowByPosture(proof, 'provider_deferred');
  assert(deferred.provider_deferred_posture.provider_deferred === true, 'deferred receipt should expose provider deferral');
  assert(deferred.candidate_refs_found_previewed.length === 0, 'deferred receipt should not include refs');

  const failed = rowByPosture(proof, 'failed_retryable');
  assert(failed.provider_failed_posture.provider_failed === true, 'failed receipt should expose provider failure');
  assert(failed.provider_failed_posture.failure_class === 'retryable', 'default failed fixture should be retryable');
}

function verifyProjectionShape(proof) {
  assert(proof.receipt_model.canonical_internal_discovery_basis_may_be_capture_rich === true, 'receipt model should preserve capture-rich internal basis');
  assert(proof.receipt_model.caller_receipt_projection_is_bounded === true, 'receipt model should bound caller projection');
  assert(proof.receipt_model.watch_owns_cadence_interpretation === true, 'Watch should own cadence interpretation');
  assert(proof.internal_discovery_basis_preview.capture_rich_basis_not_emitted_as_caller_contract === true, 'internal basis should not become caller contract');
  assert(proof.caller_receipt_projections.length === proof.settled_receipt_boundary_rows.length, 'caller projections should mirror receipt rows');
  for (const projection of proof.caller_receipt_projections) {
    assert(projection.watch_cadence_completion_decision === 'not_decided_here', 'caller projection should not decide Watch cadence/completion');
    assert(projection.settled_enough_for_caller_receipt === true, 'caller projection should be settled enough');
  }
}

async function verifyTrustedPostureVariants(db) {
  const proof = await invokeServiceCommand(COMMAND, {
    candidateRefLandingBoundaryPreview: {
      action: 'trusted-fixture-landing-preview',
      candidate_ref_landing_previews: [
        baseLandingRow('trusted-no-refs', {
          candidate_ref_kind: 'provider_returned_no_refs',
          valid_candidate_ref_identity: false,
          provider_result_posture: { status: 'returned_refs', cap_hit: false, provider_deferred: false, provider_failed: false }
        }),
        baseLandingRow('trusted-terminal-failure', {
          candidate_ref_kind: 'provider_failed_no_refs',
          valid_candidate_ref_identity: false,
          reason: 'terminal_fixture_failure',
          provider_result_posture: { status: 'failed', cap_hit: false, provider_deferred: false, provider_failed: true }
        })
      ],
      excluded_rows: [],
      summary: { candidate_ref_landing_preview_count: 2 }
    }
  }, {
    db,
    source: 'trusted-test',
    trusted: true
  });
  assert(proof.trusted_supplied_landing_preview_used === true, 'trusted non-renderer landing preview should be allowed for fixture proof');
  assert(rowByPosture(proof, 'no_refs_found'), 'trusted proof should support no_refs_found posture');
  assert(rowByPosture(proof, 'failed_terminal'), 'trusted proof should support failed_terminal posture');
  assert(proof.provider_calls === 0, 'trusted posture proof should not call providers');
  assert(proof.receipt_mutations === 0, 'trusted posture proof should not mutate receipts');
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

function forgedLandingPreview() {
  return {
    action: 'renderer-forged-landing-preview',
    candidate_ref_landing_previews: [
      baseLandingRow('renderer-forged-route', {
        watch_id: 999,
        bucket_item_id: 'renderer-forged-bucket',
        watch_run_id: 'renderer-forged-run',
        candidate_ref_identity: '999:renderer-forged-hash',
        killmail_id: 999,
        killmail_hash: 'renderer-forged-hash',
        candidate_ref_kind: 'new_candidate_ref',
        valid_candidate_ref_identity: true
      })
    ],
    excluded_rows: [],
    summary: { candidate_ref_landing_preview_count: 1 }
  };
}

function baseLandingRow(routePacketIdentity, overrides = {}) {
  return {
    preview_only: true,
    read_only: true,
    persisted: false,
    writes_discovered_killmail_refs: false,
    candidate_ref_is_discovery_possible_lead: true,
    not_evidence: true,
    not_eveidence: true,
    not_hydration: true,
    not_observation: true,
    watch_completion_semantics: 'not_decided_here',
    route_packet_identity: routePacketIdentity,
    future_lease_identity: null,
    bucket_item_id: 'trusted-bucket',
    watch_run_id: 'trusted-watch-run',
    watch_type: 'system_radius',
    watch_id: 42,
    source_kind: 'watch_system_radius',
    system_id: 30003597,
    accepted_scope: {
      execution_authority: 'stored_included_system_ids',
      included_system_ids: [30003597]
    },
    accepted_scope_execution_authority: 'stored_included_system_ids',
    accepted_included_system_ids: [30003597],
    window: { lookback_seconds: 86400 },
    caps: { max_refs_per_system: 4 },
    zkill_route: { path_template: '/api/kills/systemID/{system_id}/pastSeconds/{past_seconds}/' },
    provider_result_posture: {
      status: 'returned_refs',
      cap_hit: false,
      provider_deferred: false,
      provider_failed: false
    },
    side_effects: {
      provider_calls: 0,
      candidate_refs_written: 0,
      evidence_eveidence_writes: 0
    },
    ...overrides
  };
}

function rowByPosture(proof, posture) {
  const row = proof.settled_receipt_boundary_rows.find((entry) => entry.settled_receipt_status === posture);
  assert(row, `receipt row with posture ${posture} should be present`);
  return row;
}

function rowWithAcceptedNewRefs(proof) {
  const row = proof.settled_receipt_boundary_rows.find((entry) => entry.candidate_refs_found_previewed.length > 0);
  assert(row, 'receipt row with accepted new candidate refs should be present');
  return row;
}

function assertNoDuplicateFactsCountedAsFound(proof) {
  for (const row of proof.settled_receipt_boundary_rows) {
    for (const found of row.candidate_refs_found_previewed) {
      assert(found.candidate_ref_kind === 'new_candidate_ref', `found ref ${found.candidate_ref_identity} should be an accepted new candidate ref`);
    }
    for (const duplicate of row.duplicate_refs_suppressed) {
      assert(duplicate.counted_as_found_ref === false, `duplicate identity ${duplicate.candidate_ref_identity} should not be counted as found`);
    }
    for (const known of row.already_known_refs) {
      assert(known.counted_as_new_found_ref === false, `already-known identity ${known.candidate_ref_identity} should not be counted as new found ref`);
    }
  }
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
