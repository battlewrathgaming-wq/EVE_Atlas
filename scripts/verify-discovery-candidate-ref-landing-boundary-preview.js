const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

const NOW = '2026-06-12T12:00:00.000Z';
const COMMAND = 'discovery.candidate_ref_landing_boundary.preview';

async function main() {
  verifyRegistrationAndCoverage();

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedProductBucketRows(db);
    const before = sideEffectCounts(db);
    const proof = await invokeServiceCommand(COMMAND, {
      externalIoState: 'on',
      dispatcherLeaseBoundaryPreview: forgedLeaseBoundaryPreview(),
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
    verifyLandingRows(proof);
    verifyProvenance(proof);
    verifyExclusions(proof);
    assertSame(after, before, 'candidate ref landing boundary preview should not mutate tables');
    assert(proof.boundary_table_check.unchanged === true, 'proof should report unchanged tables');
    assert(proof.input_authority.renderer_supplied_lease_preview_authoritative === false, 'renderer supplied lease preview should not be authoritative');
    assert(proof.candidate_ref_landing_previews.every((row) => row.watch_id !== 999), 'renderer forged lease preview should not create landing previews');

    console.log(JSON.stringify({
      status: 'Discovery candidate ref landing boundary preview verified',
      command: COMMAND,
      summary: proof.summary,
      candidate_ref_identity_policy: proof.candidate_ref_identity_policy,
      sample_new_candidate_ref: rowByKind(proof, 'new_candidate_ref'),
      sample_duplicate_within_result: rowByKind(proof, 'duplicate_within_provider_result'),
      sample_existing_memory_duplicate: rowByKind(proof, 'already_known_in_fixture_discovery_memory'),
      sample_malformed_ref: rowByKind(proof, 'malformed_missing_hash_or_id'),
      sample_deferred: rowByKind(proof, 'provider_deferred_no_refs'),
      sample_failed: rowByKind(proof, 'provider_failed_no_refs'),
      provenance_relationship_sample: proof.provenance_relationship_previews[0],
      source_lease_boundary_summary: proof.source_lease_boundary_summary,
      boundary_table_check: proof.boundary_table_check,
      input_authority: proof.input_authority
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('Discovery candidate ref landing boundary preview verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === COMMAND);
  assert(command, 'Discovery candidate ref landing boundary preview command should be registered');
  assert(command.classification === 'read-only', 'Discovery candidate ref landing boundary preview should be read-only');
  assert(command.effects.includes('read-only'), 'Discovery candidate ref landing boundary preview should declare read-only effect');
  assert(command.renderer_allowed === true, 'Discovery candidate ref landing boundary preview should be renderer eligible');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === COMMAND);
  assert(row?.storage_action_class === 'local_db_inspection', 'candidate ref landing boundary preview should be local DB inspection');
  assert(row?.runtime_context === 'discovery_candidate_ref_landing_boundary_preview_readout', 'candidate ref landing boundary preview should have readout context');
  assert(row?.external_io_dependency === 'none', 'candidate ref landing boundary preview should not depend on External I/O provider movement itself');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'candidate ref landing boundary preview should remain non-enforcing proof');
}

function verifyBoundary(proof) {
  assert(proof.action === COMMAND, 'proof should name action');
  assert(proof.candidate_ref_landing_boundary_preview_only === true, 'proof should be landing boundary preview only');
  assert(proof.contract_only === true, 'proof should be contract-only');
  assert(proof.preview_only === true, 'proof should be preview-only');
  assert(proof.read_only === true, 'proof should be read-only');
  assert(proof.read_only_to_operator_corpus === true, 'proof should be read-only to operator corpus');
  assert(proof.mutates_state === false, 'proof should not mutate state');
  assert(proof.hs493_dispatcher_lease_boundary_basis === true, 'proof should use HS493 lease boundary basis');
  assert(proof.provider_results_fixture_only === true, 'provider results should be fixture-only');
  assert(proof.provider_result_examples_execute_provider_calls === false, 'fixture provider results should not execute calls');
  assert(proof.live_provider_results_used === false, 'proof should not use live provider results');
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
  assert(proof.watch_completion_semantics_opened === false, 'proof should not open Watch completion semantics');
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
  assert(proof.summary.source_lease_candidate_count === 5, 'proof should start from five lease candidates');
  assert(proof.summary.fixture_provider_result_count === 5, 'proof should use five fixture provider results');
  assert(proof.summary.candidate_ref_landing_preview_count === 8, 'proof should classify eight landing rows');
  assert(proof.summary.unique_candidate_ref_identity_count === 3, 'proof should expose three unique valid candidate identities');
  assert(proof.summary.landing_action_preview_count === 2, 'proof should stage two new candidate refs');
  assert(proof.summary.new_candidate_ref_count === 2, 'proof should classify two new candidate refs');
  assert(proof.summary.duplicate_within_provider_result_count === 1, 'proof should classify duplicate within provider result');
  assert(proof.summary.duplicate_against_preview_count === 1, 'proof should classify duplicate across preview candidates');
  assert(proof.summary.existing_memory_duplicate_count === 1, 'proof should disclose existing memory duplicate');
  assert(proof.summary.malformed_ref_count === 1, 'proof should reject one malformed ref');
  assert(proof.summary.capped_result_count === 4, 'proof should disclose capped provider result posture on four rows from capped result');
  assert(proof.summary.provider_deferred_count === 1, 'proof should classify one provider deferred posture');
  assert(proof.summary.provider_failed_count === 1, 'proof should classify one provider failed posture');
  assert(proof.summary.discovered_killmail_refs_written === 0, 'proof should write no discovered_killmail_refs');
  assert(proof.summary.evidence_eveidence_writes === 0, 'proof should write no Evidence/EVEidence');
  assert(proof.summary.hydration_writes === 0, 'proof should write no Hydration');
  assert(proof.source_lease_boundary_summary.lease_candidate_count === 5, 'source HS493 lease candidate count should be visible');
}

function verifyLandingRows(proof) {
  const rows = proof.candidate_ref_landing_previews;
  assert(rows.length === 8, 'eight landing rows should be present');
  for (const row of rows) {
    assert(row.preview_only === true, 'landing row should be preview-only');
    assert(row.read_only === true, 'landing row should be read-only');
    assert(row.persisted === false, 'landing row should not be persisted');
    assert(row.writes_discovered_killmail_refs === false, 'landing row should not write discovered_killmail_refs');
    assert(row.not_evidence === true, 'landing row should not be Evidence');
    assert(row.not_eveidence === true, 'landing row should not be EVEidence');
    assert(row.not_hydration === true, 'landing row should not be Hydration');
    assert(row.not_observation === true, 'landing row should not be Observation');
    assert(row.watch_completion_semantics === 'not_decided_here', 'landing row should not decide Watch completion');
    assert(row.side_effects.provider_calls === 0, 'landing row should not call providers');
    assert(row.side_effects.candidate_refs_written === 0, 'landing row should not write candidate refs');
    assert(row.side_effects.evidence_eveidence_writes === 0, 'landing row should not write Evidence/EVEidence');
  }

  const fresh = rowByKind(proof, 'new_candidate_ref');
  assert(fresh.candidate_ref_landing_status === 'new_candidate_ref_preview', 'fresh row should be new preview');
  assert(fresh.valid_candidate_ref_identity === true, 'fresh row should have valid identity');
  assert(fresh.identity_basis === 'killmail_id+hash', 'fresh row should use killmail_id + hash');
  assert(fresh.landing_action_preview === 'would_stage_new_discovery_candidate_ref', 'fresh row should stage new candidate ref only');

  const duplicate = rowByKind(proof, 'duplicate_within_provider_result');
  assert(duplicate.landing_action_preview === 'suppress_duplicate_within_provider_result', 'duplicate within result should be suppressed');
  assert(duplicate.duplicate_basis.duplicate_scope === 'same_fixture_provider_result', 'duplicate should name same provider result scope');

  const existing = rowByKind(proof, 'already_known_in_fixture_discovery_memory');
  assert(existing.landing_action_preview === 'would_attach_provenance_to_existing_discovery_ref', 'existing memory duplicate should attach provenance only');
  assert(existing.dedupe_basis.duplicate_scope === 'fixture_existing_discovery_memory', 'existing duplicate should name fixture memory scope');

  const overlap = rowByKind(proof, 'duplicate_across_preview_candidates');
  assert(overlap.landing_action_preview === 'would_attach_additional_provenance_without_duplicate_ref_or_evidence', 'overlap duplicate should preserve provenance only');
  assert(overlap.dedupe_basis.duplicate_scope === 'same_preview_batch_different_watch_or_route', 'overlap duplicate should name preview batch scope');

  const malformed = rowByKind(proof, 'malformed_missing_hash_or_id');
  assert(malformed.candidate_ref_landing_status === 'rejected_before_landing', 'malformed ref should reject before landing');
  assert(malformed.reason === 'missing_or_invalid_hash', 'malformed ref should name missing hash');

  const deferred = rowByKind(proof, 'provider_deferred_no_refs');
  assert(deferred.provider_result_posture.provider_deferred === true, 'deferred row should expose provider deferred posture');
  assert(deferred.landing_action_preview === 'no_candidate_ref_landing_action', 'deferred row should not land refs');

  const failed = rowByKind(proof, 'provider_failed_no_refs');
  assert(failed.provider_result_posture.provider_failed === true, 'failed row should expose provider failed posture');
  assert(failed.landing_action_preview === 'no_candidate_ref_landing_action', 'failed row should not land refs');
}

function verifyProvenance(proof) {
  assert(proof.candidate_ref_identity_policy.identity_basis === 'killmail_id+hash', 'identity policy should use killmail_id + hash');
  assert(proof.candidate_ref_identity_policy.discovery_refs_possible_leads_only === true, 'candidate refs should be possible leads only');
  assert(proof.candidate_ref_identity_policy.candidate_refs_are_not_evidence_eveidence === true, 'candidate refs should not be Evidence/EVEidence');
  assert(proof.accepted_model.overlapping_watch_provenance_preserved_without_duplicate_evidence === true, 'accepted model should preserve overlapping provenance without duplicate evidence');
  assert(proof.provenance_relationship_previews.length >= 3, 'proof should include provenance relationship previews');
  assert(proof.provenance_relationship_previews.every((row) => row.writes_discovered_killmail_refs === false), 'provenance previews should not write refs');
  assert(proof.provenance_relationship_previews.every((row) => row.duplicates_evidence === false), 'provenance previews should not duplicate Evidence');
}

function verifyExclusions(proof) {
  assert(proof.excluded_rows.length === 4, 'four source lease exclusions should remain excluded');
  for (const row of proof.excluded_rows) {
    assert(row.candidate_ref_landing_status === 'excluded_from_candidate_ref_landing_boundary', 'excluded row should stay excluded');
    assert(row.writes_discovered_killmail_refs === false, 'excluded row should not write refs');
    assert(row.provider_calls === 0, 'excluded row should not call providers');
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

function forgedLeaseBoundaryPreview() {
  return {
    action: 'renderer-forged-lease-preview',
    dispatcher_lease_boundary_candidates: [{
      lease_boundary_status: 'lease_candidate_preview_not_leased',
      lease_candidate: true,
      lease_status: 'not_leased',
      preview_only: true,
      packet_identity: 'renderer-forged-lease:999',
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
      window: { lookback_seconds: 86400 },
      caps: { max_expansions: 1 },
      provenance: {
        dispatcher_lease_boundary_source_action: 'renderer-forged'
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
      lease_candidate_count: 1
    }
  };
}

function rowByKind(proof, kind) {
  const row = proof.candidate_ref_landing_previews.find((entry) => entry.candidate_ref_kind === kind);
  assert(row, `landing row with kind ${kind} should be present`);
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
