const { buildDiscoveryDispatcherLeaseBoundaryPreview } = require('./discoveryDispatcherLeaseBoundaryPreviewService');

const ACTION = 'discovery.candidate_ref_landing_boundary.preview';

function buildDiscoveryCandidateRefLandingBoundaryPreview(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const externalIoState = normalizeExternalIoState(input.externalIoState || input.external_io_state || 'on');
  const suppliedLeasePreview = input.dispatcherLeaseBoundaryPreview || input.dispatcher_lease_boundary_preview;
  const usesTrustedSuppliedLeasePreview = suppliedLeasePreview
    && typeof suppliedLeasePreview === 'object'
    && context.trusted === true
    && context.source !== 'renderer';
  const leasePreview = usesTrustedSuppliedLeasePreview
    ? trustedLeasePreview(suppliedLeasePreview, externalIoState)
    : buildDiscoveryDispatcherLeaseBoundaryPreview(db, { ...input, externalIoState }, context);
  const leaseCandidates = Array.isArray(leasePreview.dispatcher_lease_boundary_candidates)
    ? leasePreview.dispatcher_lease_boundary_candidates
    : [];
  const fixtureProviderResults = normalizeFixtureProviderResults(input.fixtureProviderResults || input.fixture_provider_results, leaseCandidates);
  const existingMemory = normalizeExistingMemory(input.fixtureExistingDiscoveryMemory || input.fixture_existing_discovery_memory);
  const landingState = buildLandingPreviews(leaseCandidates, fixtureProviderResults, existingMemory);
  const excludedRows = [
    ...leaseCandidatesWithoutProviderResults(leaseCandidates, fixtureProviderResults),
    ...normalizeLeaseExclusions(leasePreview.excluded_rows)
  ];
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only Discovery candidate-ref landing boundary preview from lease candidates and fixture provider results',
    candidate_ref_landing_boundary_preview_only: true,
    contract_only: true,
    preview_only: true,
    read_only: true,
    read_only_to_operator_corpus: true,
    mutates_state: false,
    renderer_eligible: true,
    hs493_dispatcher_lease_boundary_basis: true,
    product_schema_used: true,
    product_schema_updated: false,
    schema_changes: 0,
    operator_corpus_mutated: false,
    system_radius_only: true,
    actor_watch_migration: false,
    provider_results_fixture_only: true,
    provider_result_examples_execute_provider_calls: false,
    live_provider_results_used: false,
    discovery_pickup_execution: false,
    provider_execution_started: false,
    executable_provider_packets_created: 0,
    provider_packets: 0,
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    dispatcher_runtime_started: false,
    durable_queue_rows_written: 0,
    queue_items_created: 0,
    durable_lease_rows_written: 0,
    leases_created: 0,
    lease_claims_created: 0,
    lease_claimed: false,
    candidate_refs_emitted: 0,
    candidate_refs_written: 0,
    durable_discovery_refs_written: false,
    discovery_refs_written: false,
    discovered_killmail_refs_written: 0,
    discovery_refs_mutated: 0,
    evidence_created: false,
    evidence_written: false,
    evidence_rows_written: 0,
    evidence_writes: 0,
    hydration_created: false,
    hydration_writes: 0,
    metadata_writes: 0,
    observation_created: false,
    api_request_log_writes: 0,
    data_quality_warning_writes: 0,
    watch_completion_semantics_opened: false,
    watch_mutations: 0,
    watch_rows_mutated: 0,
    cadence_mutations: 0,
    receipt_mutations: 0,
    watch_bucket_status_mutations: 0,
    watch_executor_tick_called: false,
    task_runner_methods_called: [],
    collectors_called: false,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    external_io_posture: {
      state: externalIoState,
      external_io_required_before_real_provider_result: true,
      external_io_open_is_not_landing_authority: true,
      external_io_on_calls_provider: false,
      external_io_on_writes_candidate_refs: false,
      provider_calls: 0,
      zkill_calls: 0,
      esi_calls: 0
    },
    input_authority: {
      dispatcher_lease_boundary_from_hs493_path: !usesTrustedSuppliedLeasePreview,
      trusted_supplied_lease_preview_used: usesTrustedSuppliedLeasePreview,
      renderer_supplied_lease_preview_authoritative: false,
      fixture_provider_results_are_examples_only: true
    },
    candidate_ref_identity_policy: {
      identity_basis: 'killmail_id+hash',
      killmail_id_required: true,
      killmail_hash_required: true,
      discovery_refs_possible_leads_only: true,
      candidate_refs_are_not_evidence_eveidence: true,
      candidate_refs_are_not_hydration: true,
      watch_completion_not_decided_here: true
    },
    summary: {
      source_lease_candidate_count: leaseCandidates.length,
      fixture_provider_result_count: fixtureProviderResults.length,
      candidate_ref_landing_preview_count: landingState.previews.length,
      unique_candidate_ref_identity_count: landingState.uniqueIdentityCount,
      landing_action_preview_count: landingState.previews.filter((row) => row.landing_action_preview === 'would_stage_new_discovery_candidate_ref').length,
      new_candidate_ref_count: landingState.previews.filter((row) => row.candidate_ref_kind === 'new_candidate_ref').length,
      duplicate_within_provider_result_count: landingState.previews.filter((row) => row.candidate_ref_kind === 'duplicate_within_provider_result').length,
      duplicate_against_preview_count: landingState.previews.filter((row) => row.candidate_ref_kind === 'duplicate_across_preview_candidates').length,
      existing_memory_duplicate_count: landingState.previews.filter((row) => row.candidate_ref_kind === 'already_known_in_fixture_discovery_memory').length,
      malformed_ref_count: landingState.previews.filter((row) => row.candidate_ref_kind === 'malformed_missing_hash_or_id').length,
      capped_result_count: landingState.previews.filter((row) => row.provider_result_posture?.cap_hit === true).length,
      provider_deferred_count: landingState.previews.filter((row) => row.candidate_ref_kind === 'provider_deferred_no_refs').length,
      provider_failed_count: landingState.previews.filter((row) => row.candidate_ref_kind === 'provider_failed_no_refs').length,
      excluded_row_count: excludedRows.length,
      provider_calls: 0,
      live_api_calls: 0,
      zkill_calls: 0,
      esi_calls: 0,
      executable_provider_packets_created: 0,
      dispatcher_runtime_started: false,
      queue_items_created: 0,
      leases_created: 0,
      lease_claims_created: 0,
      candidate_refs_written: 0,
      discovered_killmail_refs_written: 0,
      discovery_refs_written: false,
      evidence_eveidence_writes: 0,
      hydration_writes: 0,
      observation_created: false,
      watch_cadence_mutations: 0,
      receipt_mutations: 0,
      watch_bucket_status_mutations: 0,
      schema_changes: 0
    },
    candidate_ref_landing_previews: landingState.previews,
    provenance_relationship_previews: landingState.provenanceRelationships,
    excluded_rows: excludedRows,
    source_lease_boundary_summary: leasePreview.summary || null,
    boundary_table_check: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after),
      watch_bucket_items_mutated: false,
      fetch_runs_mutated: false,
      discovered_killmail_refs_mutated: false,
      killmails_mutated: false,
      activity_events_mutated: false,
      api_request_logs_mutated: false,
      data_quality_warnings_mutated: false,
      metadata_runs_mutated: false,
      watch_cadence_rows_mutated: false,
      receipt_rows_mutated: false,
      lease_rows_mutated: false,
      queue_rows_mutated: false,
      product_tables_mutated: false
    },
    accepted_model: {
      input_language: 'hs493_dispatcher_lease_boundary_candidates',
      fixture_provider_results_only: true,
      killmail_id_hash_is_candidate_ref_identity: true,
      candidate_refs_are_discovery_possible_leads_only: true,
      candidate_refs_are_not_evidence_eveidence: true,
      candidate_refs_are_not_hydration: true,
      overlapping_watch_provenance_preserved_without_duplicate_evidence: true,
      watch_completion_semantics_opened_by_this_preview: false,
      discovered_killmail_refs_written_by_this_preview: 0,
      provider_execution_started_by_this_preview: false,
      schema_accepted_by_this_preview: false,
      runtime_behavior_changed_by_this_preview: false
    },
    boundary: [
      'Read-only Discovery candidate-ref landing boundary preview from HS493 lease candidates and fixture provider-result examples.',
      'Candidate-ref identity is killmail_id + hash; rows classify landing posture but do not write discovered_killmail_refs.',
      'Candidate refs are Discovery possible leads only, not Evidence/EVEidence, Hydration, Observation, or Watch completion.',
      'Duplicate, existing-memory, malformed, capped, deferred, and failed fixture postures are disclosed without provider calls.',
      'No provider calls, candidate-ref writes, Discovery ref writes, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, schema, enforcement, or UI behavior is opened.'
    ],
    does_not_do: [
      'does_not_update_src_main_db_schema_sql',
      'does_not_call_zkill_or_esi',
      'does_not_start_discovery_pickup_dispatcher_or_provider_execution',
      'does_not_create_durable_queues_leases_or_lease_claims',
      'does_not_write_discovered_killmail_refs_or_candidate_refs',
      'does_not_write_evidence_eveidence_hydration_observation_or_api_logs',
      'does_not_mutate_watch_bucket_status_or_receipts',
      'does_not_mutate_watch_rows_or_cadence',
      'does_not_migrate_actor_watch',
      'does_not_implement_runtime_enforcement_or_ui'
    ]
  };
}

function buildLandingPreviews(leaseCandidates, fixtureProviderResults, existingMemory) {
  const existingIdentities = new Set(existingMemory.map((entry) => candidateIdentity(entry.killmail_id, entry.hash)));
  const seenByProviderResult = new Map();
  const seenAcrossPreview = new Map();
  const previews = [];
  const provenanceRelationships = [];

  for (const result of fixtureProviderResults) {
    const candidate = leaseCandidates.find((row) => leaseCandidateKey(row) === result.lease_candidate_key);
    if (!candidate) {
      previews.push(providerResultWithoutCandidate(result));
      continue;
    }

    if (result.status === 'deferred') {
      previews.push(providerDeferredPreview(candidate, result));
      continue;
    }
    if (result.status === 'failed') {
      previews.push(providerFailedPreview(candidate, result));
      continue;
    }

    const refs = Array.isArray(result.refs) ? result.refs : [];
    if (refs.length === 0) {
      previews.push(providerDeferredPreview(candidate, { ...result, reason: result.reason || 'fixture_provider_result_returned_no_refs' }));
      continue;
    }

    const seenInResult = new Set();
    for (const ref of refs) {
      const identity = candidateIdentity(ref.killmail_id, ref.hash);
      const base = landingBase(candidate, result, ref, identity);
      if (!isValidCandidateRef(ref)) {
        previews.push({
          ...base,
          candidate_ref_landing_status: 'rejected_before_landing',
          candidate_ref_kind: 'malformed_missing_hash_or_id',
          landing_action_preview: 'reject_before_discovery_memory_landing',
          valid_candidate_ref_identity: false,
          malformed: true,
          reason: missingReason(ref)
        });
        continue;
      }
      if (seenInResult.has(identity)) {
        previews.push({
          ...base,
          candidate_ref_landing_status: 'duplicate_suppressed_preview',
          candidate_ref_kind: 'duplicate_within_provider_result',
          landing_action_preview: 'suppress_duplicate_within_provider_result',
          valid_candidate_ref_identity: true,
          duplicate: true,
          duplicate_basis: {
            identity_basis: 'killmail_id+hash',
            duplicate_scope: 'same_fixture_provider_result',
            candidate_ref_identity: identity
          }
        });
        continue;
      }

      seenInResult.add(identity);
      if (existingIdentities.has(identity)) {
        previews.push({
          ...base,
          candidate_ref_landing_status: 'already_known_preview',
          candidate_ref_kind: 'already_known_in_fixture_discovery_memory',
          landing_action_preview: 'would_attach_provenance_to_existing_discovery_ref',
          valid_candidate_ref_identity: true,
          already_known: true,
          dedupe_basis: {
            identity_basis: 'killmail_id+hash',
            duplicate_scope: 'fixture_existing_discovery_memory',
            candidate_ref_identity: identity
          }
        });
        provenanceRelationships.push(provenanceRelationshipFor(candidate, identity, 'existing_fixture_memory'));
        continue;
      }

      if (seenAcrossPreview.has(identity)) {
        previews.push({
          ...base,
          candidate_ref_landing_status: 'duplicate_suppressed_preview',
          candidate_ref_kind: 'duplicate_across_preview_candidates',
          landing_action_preview: 'would_attach_additional_provenance_without_duplicate_ref_or_evidence',
          valid_candidate_ref_identity: true,
          duplicate: true,
          dedupe_basis: {
            identity_basis: 'killmail_id+hash',
            duplicate_scope: 'same_preview_batch_different_watch_or_route',
            candidate_ref_identity: identity,
            first_packet_identity: seenAcrossPreview.get(identity).packet_identity
          }
        });
        provenanceRelationships.push(provenanceRelationshipFor(candidate, identity, 'overlapping_watch_preview_batch'));
        continue;
      }

      seenAcrossPreview.set(identity, candidate);
      previews.push({
        ...base,
        candidate_ref_landing_status: 'new_candidate_ref_preview',
        candidate_ref_kind: 'new_candidate_ref',
        landing_action_preview: 'would_stage_new_discovery_candidate_ref',
        valid_candidate_ref_identity: true,
        dedupe_basis: {
          identity_basis: 'killmail_id+hash',
          candidate_ref_identity: identity,
          duplicate_found: false
        }
      });
      provenanceRelationships.push(provenanceRelationshipFor(candidate, identity, 'new_candidate_ref_preview'));
    }
  }

  return {
    previews,
    provenanceRelationships,
    uniqueIdentityCount: new Set(previews.filter((row) => row.valid_candidate_ref_identity).map((row) => row.candidate_ref_identity)).size
  };
}

function landingBase(candidate, result, ref, identity) {
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
    killmail_id: toIntegerOrNull(ref.killmail_id),
    killmail_hash: typeof ref.hash === 'string' ? ref.hash : null,
    candidate_ref_identity: identity,
    identity_basis: 'killmail_id+hash',
    provider_result_posture: {
      status: result.status || 'returned_refs',
      cap_hit: result.cap_hit === true,
      capped_result_posture: result.cap_hit === true ? 'cap_hit_more_refs_may_exist_not_failure' : 'not_capped',
      provider_deferred: false,
      provider_failed: false,
      provider_calls: 0
    },
    route_packet_identity: candidate.packet_identity || null,
    future_lease_identity: candidate.future_lease_identity || null,
    bucket_item_id: candidate.bucket_item_id || null,
    watch_run_id: candidate.watch_run_id || null,
    watch_type: candidate.watch_type || null,
    watch_id: candidate.watch_id ?? null,
    source_kind: candidate.source_kind || null,
    system_id: candidate.system_id ?? null,
    accepted_scope: candidate.accepted_scope || null,
    accepted_scope_execution_authority: candidate.accepted_scope_execution_authority || null,
    accepted_included_system_ids: Array.isArray(candidate.accepted_included_system_ids) ? [...candidate.accepted_included_system_ids] : [],
    window: candidate.window || null,
    caps: candidate.caps || null,
    provenance: {
      ...(candidate.provenance || {}),
      candidate_ref_landing_boundary_source_action: ACTION,
      fixture_provider_result_id: result.fixture_provider_result_id || null
    },
    source_selection_basis: candidate.source_selection_basis || null,
    zkill_route: candidate.zkill_route || null,
    provenance_relationship_preview: {
      relationship_kind: 'future_discovery_ref_provenance_only',
      route_packet_identity: candidate.packet_identity || null,
      watch_run_id: candidate.watch_run_id || null,
      watch_id: candidate.watch_id ?? null,
      system_id: candidate.system_id ?? null,
      duplicate_evidence_created: false,
      watch_completion_decided: false
    },
    side_effects: zeroSideEffects()
  };
}

function providerDeferredPreview(candidate, result) {
  return providerNoRefsPreview(candidate, result, 'provider_deferred_no_refs', 'provider_deferred_no_usable_refs');
}

function providerFailedPreview(candidate, result) {
  return providerNoRefsPreview(candidate, result, 'provider_failed_no_refs', 'provider_failed_no_usable_refs');
}

function providerNoRefsPreview(candidate, result, kind, status) {
  return {
    ...landingBase(candidate, result, {}, null),
    candidate_ref_landing_status: status,
    candidate_ref_kind: kind,
    landing_action_preview: 'no_candidate_ref_landing_action',
    valid_candidate_ref_identity: false,
    reason: result.reason || kind,
    provider_result_posture: {
      status: result.status,
      cap_hit: result.cap_hit === true,
      capped_result_posture: result.cap_hit === true ? 'cap_hit_more_refs_may_exist_not_failure' : 'not_capped',
      provider_deferred: result.status === 'deferred',
      provider_failed: result.status === 'failed',
      provider_calls: 0
    }
  };
}

function providerResultWithoutCandidate(result) {
  return {
    candidate_ref_landing_status: 'rejected_before_landing',
    candidate_ref_kind: 'provider_result_without_accepted_lease_candidate',
    landing_action_preview: 'reject_unmatched_fixture_provider_result',
    preview_only: true,
    read_only: true,
    persisted: false,
    writes_discovered_killmail_refs: false,
    candidate_ref_is_discovery_possible_lead: false,
    not_evidence: true,
    not_eveidence: true,
    not_hydration: true,
    not_observation: true,
    watch_completion_semantics: 'not_decided_here',
    reason: 'fixture_provider_result_did_not_match_accepted_hs493_lease_candidate',
    fixture_provider_result_id: result.fixture_provider_result_id || null,
    lease_candidate_key: result.lease_candidate_key || null,
    side_effects: zeroSideEffects()
  };
}

function provenanceRelationshipFor(candidate, identity, relationshipKind) {
  return {
    preview_only: true,
    relationship_kind: relationshipKind,
    candidate_ref_identity: identity,
    route_packet_identity: candidate.packet_identity || null,
    bucket_item_id: candidate.bucket_item_id || null,
    watch_run_id: candidate.watch_run_id || null,
    watch_id: candidate.watch_id ?? null,
    system_id: candidate.system_id ?? null,
    preserves_overlapping_watch_provenance: true,
    duplicates_evidence: false,
    writes_discovered_killmail_refs: false,
    watch_completion_decided: false
  };
}

function normalizeFixtureProviderResults(input, leaseCandidates) {
  if (Array.isArray(input)) {
    return input.map(normalizeProviderResult);
  }
  return defaultFixtureProviderResults(leaseCandidates);
}

function normalizeProviderResult(result = {}) {
  return {
    fixture_provider_result_id: result.fixture_provider_result_id || result.id || null,
    lease_candidate_key: result.lease_candidate_key || result.packet_identity || null,
    status: result.status || 'returned_refs',
    cap_hit: result.cap_hit === true || result.capped === true,
    reason: result.reason || null,
    refs: Array.isArray(result.refs) ? result.refs : []
  };
}

function defaultFixtureProviderResults(leaseCandidates) {
  return leaseCandidates.map((candidate, index) => {
    const key = leaseCandidateKey(candidate);
    if (index === 0) {
      return normalizeProviderResult({
        id: 'fixture-provider-result-new-duplicate-existing-malformed-capped',
        lease_candidate_key: key,
        status: 'returned_refs',
        cap_hit: true,
        refs: [
          { killmail_id: 93000001, hash: 'hash-new-alpha' },
          { killmail_id: 93000001, hash: 'hash-new-alpha' },
          { killmail_id: 93000002, hash: 'hash-known-bravo' },
          { killmail_id: 93000003 }
        ]
      });
    }
    if (index === 1) {
      return normalizeProviderResult({
        id: 'fixture-provider-result-deferred',
        lease_candidate_key: key,
        status: 'deferred',
        reason: 'fixture_provider_retry_after_not_elapsed',
        refs: []
      });
    }
    if (index === 2) {
      return normalizeProviderResult({
        id: 'fixture-provider-result-overlap',
        lease_candidate_key: key,
        status: 'returned_refs',
        refs: [
          { killmail_id: 93000001, hash: 'hash-new-alpha' }
        ]
      });
    }
    if (index === 3) {
      return normalizeProviderResult({
        id: 'fixture-provider-result-failed',
        lease_candidate_key: key,
        status: 'failed',
        reason: 'fixture_provider_failure_no_usable_refs',
        refs: []
      });
    }
    return normalizeProviderResult({
      id: 'fixture-provider-result-new-final',
      lease_candidate_key: key,
      status: 'returned_refs',
      refs: [
        { killmail_id: 93000004, hash: 'hash-new-delta' }
      ]
    });
  });
}

function normalizeExistingMemory(input) {
  if (!Array.isArray(input)) {
    return [{ killmail_id: 93000002, hash: 'hash-known-bravo' }];
  }
  return input
    .filter((entry) => entry && isValidCandidateRef(entry))
    .map((entry) => ({
      killmail_id: toIntegerOrNull(entry.killmail_id),
      hash: entry.hash
    }));
}

function leaseCandidatesWithoutProviderResults(leaseCandidates, providerResults) {
  const resultKeys = new Set(providerResults.map((result) => result.lease_candidate_key));
  return leaseCandidates
    .filter((candidate) => !resultKeys.has(leaseCandidateKey(candidate)))
    .map((candidate) => ({
      candidate_ref_landing_status: 'excluded_from_candidate_ref_landing_boundary',
      reason: 'no_fixture_provider_result_for_lease_candidate',
      lease_candidate: true,
      candidate_ref_landing_preview_count: 0,
      lease_candidate_key: leaseCandidateKey(candidate),
      route_packet_identity: candidate.packet_identity || null,
      bucket_item_id: candidate.bucket_item_id || null,
      watch_run_id: candidate.watch_run_id || null,
      watch_type: candidate.watch_type || null,
      watch_id: candidate.watch_id ?? null,
      system_id: candidate.system_id ?? null,
      writes_discovered_killmail_refs: false,
      provider_calls: 0,
      evidence_eveidence_written: 0,
      hydration_writes: 0,
      observation_created: false,
      watch_cadence_mutated: false,
      bucket_status_mutated: false,
      receipt_mutated: false
    }));
}

function normalizeLeaseExclusions(rows = []) {
  return rows.map((row) => ({
    candidate_ref_landing_status: 'excluded_from_candidate_ref_landing_boundary',
    reason: row.reason || 'not_accepted_lease_candidate',
    source_lease_boundary_status: row.lease_boundary_status || null,
    exclusion_family: row.exclusion_family || null,
    bucket_item_id: row.bucket_item_id || null,
    watch_run_id: row.watch_run_id || null,
    watch_type: row.watch_type || null,
    watch_id: row.watch_id ?? null,
    system_id: row.system_id ?? null,
    enters_candidate_ref_landing: false,
    candidate_ref_landing_preview_count: 0,
    writes_discovered_killmail_refs: false,
    provider_calls: 0,
    evidence_eveidence_written: 0,
    hydration_writes: 0,
    observation_created: false,
    watch_cadence_mutated: false,
    bucket_status_mutated: false,
    receipt_mutated: false
  }));
}

function isValidCandidateRef(ref = {}) {
  return Number.isInteger(toIntegerOrNull(ref.killmail_id)) && typeof ref.hash === 'string' && ref.hash.trim().length > 0;
}

function missingReason(ref = {}) {
  if (!Number.isInteger(toIntegerOrNull(ref.killmail_id))) {
    return 'missing_or_invalid_killmail_id';
  }
  return 'missing_or_invalid_hash';
}

function candidateIdentity(killmailId, hash) {
  const normalizedId = toIntegerOrNull(killmailId);
  if (!Number.isInteger(normalizedId) || typeof hash !== 'string' || hash.trim().length === 0) {
    return null;
  }
  return `${normalizedId}:${hash}`;
}

function leaseCandidateKey(candidate = {}) {
  return candidate.packet_identity || candidate.future_lease_identity?.lease_key_preview || null;
}

function toIntegerOrNull(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function trustedLeasePreview(leasePreview, externalIoState) {
  return {
    ...leasePreview,
    external_io_posture: {
      ...(leasePreview.external_io_posture || {}),
      state: externalIoState
    }
  };
}

function zeroSideEffects() {
  return {
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    candidate_refs_written: 0,
    discovered_killmail_refs_written: 0,
    discovery_refs_written: false,
    evidence_eveidence_writes: 0,
    hydration_writes: 0,
    observation_created: false,
    watch_cadence_mutations: 0,
    bucket_status_mutations: 0,
    receipt_mutations: 0,
    schema_changes: 0
  };
}

function stateSnapshot(db) {
  return {
    watch_bucket_items: count(db, 'watch_bucket_items'),
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    metadata_runs: count(db, 'metadata_runs'),
    ingestion_audits: count(db, 'ingestion_audits'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    entities: count(db, 'entities'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches'),
    assessment_artifacts: count(db, 'assessment_artifacts')
  };
}

function count(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count || 0);
}

function normalizeExternalIoState(state) {
  return state === 'off' ? 'off' : 'on';
}

function stableJson(value) {
  return JSON.stringify(value);
}

module.exports = {
  buildDiscoveryCandidateRefLandingBoundaryPreview
};
