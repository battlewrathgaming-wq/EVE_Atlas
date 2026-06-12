const { buildWatchActorCompatibilityWrapperContractPreview } = require('./watchActorCompatibilityWrapperContractService');

const ACTION = 'watch.actor_compatibility_wrapper_adapter_fixture.preview';

function buildWatchActorCompatibilityWrapperAdapterFixturePreview(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const contract = buildWatchActorCompatibilityWrapperContractPreview(db, { ...input, now }, context);
  const adapterResult = buildAdapterResult(contract, now);
  const compatibilityMap = oldResultCompatibilityMap(adapterResult, contract);
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only actor Watch compatibility-wrapper adapter fixture proof',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    fixture_only: true,
    adapter_fixture_only: true,
    non_authoritative_for_runtime_behavior: true,
    renderer_eligible: true,
    wrapper_status: 'adapter_fixture_only_not_active',
    contract_basis_action: contract.action,
    old_entry_point: 'actor.watch',
    current_retire_candidate: 'collectActorWatch',
    actor_only: true,
    source_agnostic_discovery_posture: true,
    system_radius_touched: false,
    system_radius_selected_or_changed: false,
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    esi_call_performed: false,
    watch_execution: false,
    watch_dispatches: 0,
    dispatch_runner_invoked: false,
    dispatch_runner_invocations: 0,
    collectors_called: false,
    collect_actor_watch_invoked: false,
    collect_system_radius_watch_invoked: false,
    mixed_collectors_invoked: false,
    task_runner_methods_called: [],
    tasks_created: 0,
    queue_created: false,
    dispatcher_created: false,
    leases_created: 0,
    watch_mutations: 0,
    watch_rows_mutated: 0,
    discovery_refs_written: false,
    durable_discovery_refs_written: false,
    discovered_killmail_refs_written: 0,
    discovery_refs_mutated: 0,
    evidence_written: false,
    evidence_created: false,
    evidence_writes: 0,
    evidence_rows_written: 0,
    evidence_landing_performed: false,
    live_esi_backed_expansion_run: false,
    esi_evidence_expansion_run: false,
    hydration_writes: 0,
    hydration_created: false,
    metadata_writes: 0,
    api_request_log_writes: 0,
    data_quality_warning_writes: 0,
    fetch_run_writes: 0,
    schema_changes: 0,
    durable_task_packet_schema_created: false,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    actor_watch_redirected: false,
    runActorWatchService_changed: false,
    watchExecutor_dispatchFor_changed: false,
    mixed_collector_redirected: false,
    mixed_collector_retired: false,
    boundary_owned_fixture_inputs: boundaryOwnedFixtureInputs(contract),
    adapter_fixture_result: adapterResult,
    old_result_compatibility_map: compatibilityMap,
    hs381_contract_expectation_map: {
      contract_wrapper_status: contract.wrapper_status,
      adapter_matches_old_entry_point: adapterResult.adapter_fixture_metadata.old_entry_point === contract.old_entry_point,
      adapter_matches_actor_identity: stableJson(adapterResult.actor) === stableJson(contract.candidate_compatibility_result?.actor_target_identity || {}),
      adapter_preserves_candidate_lead_boundary: adapterResult.adapter_fixture_metadata.candidate_refs_are_possible_leads === true,
      adapter_preserves_evidence_writer_boundary: adapterResult.adapter_fixture_metadata.evidence_writer_invoked === false,
      adapter_preserves_watch_cadence_boundary: adapterResult.adapter_fixture_metadata.watch_cadence_mutated === false,
      adapter_claims_runtime_replacement: false
    },
    accepted_model: {
      adapter_fixture_only: true,
      source_agnostic_discovery: true,
      actor_watch_is_source_intent_only_here: true,
      candidate_refs_are_possible_leads: true,
      candidate_refs_are_evidence: false,
      esi_backed_killmail_detail_expansion_owner: 'Discovery',
      esi_backed_expansion_is_hydration: false,
      evidence_eveidence_begins_at_final_landed_memory: true,
      evidence_eveidence_writer_invoked: false,
      watch_receipt_cadence_decision_mutated: false,
      actor_watch_runtime_replacement_authorized: false,
      collector_retirement_authorized: false
    },
    missing_or_parked_runtime_work: [
      'actor_watch_redirect_not_implemented',
      'runActorWatchService_runtime_replacement_not_implemented',
      'watchExecutor_dispatchFor_runtime_replacement_not_implemented',
      'collectActorWatch_not_invoked_or_retired',
      'live_zkill_provider_call_not_proven',
      'durable_discovery_ref_write_not_proven',
      'live_esi_backed_expansion_not_proven',
      'evidence_eveidence_landing_not_proven',
      'watch_cadence_mutation_from_receipt_not_proven',
      'old_collector_summary_equivalence_partial_only'
    ],
    non_invocation_proof: {
      collectActorWatch_entered: false,
      collectSystemRadiusWatch_entered: false,
      WatchSessionExecutor_tick_invoked: false,
      TaskRunner_runDetachedTask_invoked: false,
      runActorWatchService_runtime_changed: false,
      watchExecutor_dispatchFor_runtime_changed: false,
      actor_watch_redirect_performed: false,
      collector_retirement_performed: false,
      evidence_writer_invoked: false,
      source_actions_used: [
        ACTION,
        contract.action,
        ...(contract.non_invocation_proof?.source_actions_used || [])
      ],
      excluded_runtime_paths: [
        'runActorWatchService',
        'watchExecutor.dispatchFor runtime path',
        'collectActorWatch',
        'collectSystemRadiusWatch',
        'WatchSessionExecutor.tick',
        'TaskRunner.runDetachedTask',
        'EvidenceRepository.persistEvidencePackage'
      ]
    },
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
        && contract.table_mutation_proof?.unchanged === true
    },
    boundary_flags: {
      providers_called: false,
      live_api_called: false,
      zkill_called: false,
      esi_called: false,
      db_mutated: false,
      actor_watch_redirected: false,
      runActorWatchService_changed: false,
      watchExecutor_dispatchFor_changed: false,
      mixed_collectors_invoked: false,
      collectActorWatch_invoked_or_retired: false,
      live_watch_dispatch_invoked: false,
      task_created: false,
      watch_mutated: false,
      discovery_refs_written: false,
      evidence_written: false,
      evidence_writer_invoked: false,
      live_esi_backed_expansion_run: false,
      hydration_written: false,
      api_logs_or_warnings_written: false,
      fetch_runs_written: false,
      schema_changed: false,
      queue_dispatcher_or_lease_created: false,
      support_artifact_created: false,
      ui_changed: false,
      runtime_enforcement_or_command_blocking_active: false,
      system_radius_behavior_changed: false,
      protected_words_updated: false
    },
    boundary: [
      'This preview is an adapter fixture only; actor.watch is not redirected.',
      'The adapter fixture constructs an old caller-facing result shape from boundary-owned fixture outputs.',
      'The old collector return shape is partially mapped, not claimed fully replaced.',
      'Candidate refs remain possible leads, not Evidence/EVEidence.',
      'ESI-backed killmail/detail expansion remains Discovery-owned provider movement, not Hydration.',
      'Evidence/EVEidence writer and Watch cadence decision boundaries are represented but not invoked or mutated.'
    ]
  };
}

function buildAdapterResult(contract, now) {
  const result = contract.candidate_compatibility_result || {};
  const posture = result.candidate_ref_posture || {};
  const actor = result.actor_target_identity || {};
  const selected = result.selected_esi_backed_expansion_intake_candidates || [];
  const localCache = result.local_evidence_eveidence_cache_skip_posture || {};
  const retryable = result.retryable_esi_backed_expansion_failure_posture_fixture_only || {};
  const terminal = result.terminal_esi_backed_expansion_failure_posture_fixture_only || {};
  const warnings = adapterWarnings({ posture, localCache, retryable, terminal });

  return {
    run_id: `adapter_fixture_${safe(actor.entity_type || 'actor')}_${safe(actor.entity_id ?? 'unknown')}_${Date.parse(now) || 0}`,
    actor,
    zkill_refs_discovered: posture.refs_found_count || 0,
    duplicate_refs_removed: posture.duplicate_count || 0,
    malformed_refs_removed: posture.malformed_count || 0,
    unique_refs_after_dedupe: Math.max(0, (posture.refs_found_count || 0) - (posture.duplicate_count || 0)),
    pending_refs_considered: 0,
    already_cached_killmails: localCache.count || 0,
    expansion_attempted: selected.length,
    expansion_cap_skipped: posture.capped_or_not_selected_count || 0,
    new_esi_expansions: 0,
    failed_expansions: (retryable.count || 0) + (terminal.count || 0),
    persisted_killmails: 0,
    activity_events_written: 0,
    api_calls_zkill: 0,
    api_calls_esi: 0,
    warnings,
    planned_zkill_requests: result.zkill_provider_target_shape ? 1 : 0,
    zkill_discovery_skipped: false,
    collection_plan: {
      actor,
      requested_window: {
        lookback_seconds: result.lookback_seconds ?? null
      },
      provider_target: result.zkill_provider_target_shape || null,
      caps: {
        max_refs: result.max_refs ?? null,
        max_expansions: result.max_expansions ?? null
      },
      fixture_only: true,
      provider_calls: 0,
      live_api_calls: 0
    },
    expansion_queue: selected.map((item, index) => ({
      killmail_id: item.killmail_id,
      hash: item.killmail_hash,
      priority: index + 1,
      source_kind: item.source_kind || 'actor',
      scope_key: item.scope_key || null,
      selected_for_expansion: true,
      already_cached: false,
      skip_reason: null,
      fixture_only: true,
      evidence_written: false
    })),
    expansion_queue_summary: {
      selected: selected.length,
      cached: localCache.count || 0,
      cap_skipped: posture.capped_or_not_selected_count || 0,
      failed: (retryable.count || 0) + (terminal.count || 0),
      malformed: posture.malformed_count || 0,
      duplicate: posture.duplicate_count || 0,
      deferred: posture.deferred_count || 0
    },
    adapter_fixture_metadata: {
      adapter_status: 'fixture_only_non_authoritative',
      old_entry_point: contract.old_entry_point,
      source_contract_action: contract.action,
      old_collector_semantics_claimed_replaced: false,
      actor_watch_redirected: false,
      collectActorWatch_invoked: false,
      collectActorWatch_retired: false,
      evidence_writer_invoked: false,
      watch_cadence_mutated: false,
      candidate_refs_are_possible_leads: true,
      candidate_refs_are_evidence: false,
      esi_backed_expansion_is_hydration: false
    }
  };
}

function boundaryOwnedFixtureInputs(contract) {
  return {
    actor_watch_intent_cadence_basis: contract.future_boundary_owned_stages?.[0] || null,
    discovery_zkill_candidate_lead_acquisition_result: contract.future_boundary_owned_stages?.[1] || null,
    discovery_esi_backed_expansion_intake_posture: contract.future_boundary_owned_stages?.[2] || null,
    evidence_eveidence_writer_boundary_posture: contract.future_boundary_owned_stages?.[3] || null,
    watch_receipt_cadence_decision_posture: contract.future_boundary_owned_stages?.[4] || null
  };
}

function oldResultCompatibilityMap(adapterResult, contract) {
  return {
    represented_by_adapter_fixture: [
      mapField('run_id', 'adapter fixture correlation id, not fetch_runs row id', adapterResult.run_id),
      mapField('actor', 'mapped from actor Watch intent identity', adapterResult.actor),
      mapField('zkill_refs_discovered', 'mapped from fixture candidate refs found count', adapterResult.zkill_refs_discovered),
      mapField('duplicate_refs_removed', 'mapped from fixture duplicate posture', adapterResult.duplicate_refs_removed),
      mapField('malformed_refs_removed', 'mapped from fixture malformed posture', adapterResult.malformed_refs_removed),
      mapField('unique_refs_after_dedupe', 'derived from fixture found minus duplicate counts', adapterResult.unique_refs_after_dedupe),
      mapField('already_cached_killmails', 'mapped from local Evidence/EVEidence cache skip posture', adapterResult.already_cached_killmails),
      mapField('expansion_attempted', 'mapped from selected ESI-backed intake candidates', adapterResult.expansion_attempted),
      mapField('expansion_cap_skipped', 'mapped from capped/not-selected posture', adapterResult.expansion_cap_skipped),
      mapField('failed_expansions', 'mapped from retryable plus terminal fixture failure posture', adapterResult.failed_expansions),
      mapField('planned_zkill_requests', 'mapped from fixture zKill provider target shape', adapterResult.planned_zkill_requests),
      mapField('collection_plan', 'mapped from actor identity, request window, target, and caps', adapterResult.collection_plan),
      mapField('expansion_queue', 'mapped from selected fixture ESI-backed intake candidates', adapterResult.expansion_queue),
      mapField('expansion_queue_summary', 'mapped from fixture posture summary', adapterResult.expansion_queue_summary)
    ],
    represented_only_approximately: [
      mapField('warnings', 'fixture warnings disclose posture but are not persisted data_quality_warnings', adapterResult.warnings),
      mapField('pending_refs_considered', 'set to 0 because durable pending Discovery ref drain is not part of this fixture', adapterResult.pending_refs_considered),
      mapField('zkill_discovery_skipped', 'set to false for fixture acquisition; old pending-ref drain behavior remains parked', adapterResult.zkill_discovery_skipped)
    ],
    not_represented_yet: [
      'real fetch_runs run_id and lifecycle',
      'real persisted_killmails count from EvidenceRepository.persistEvidencePackage',
      'real activity_events_written count from EvidenceRepository.persistEvidencePackage',
      'real api_calls_zkill and api_calls_esi from api_request_logs',
      'real new_esi_expansions from ESI expansion execution',
      'real old collector warning text from provider and Evidence writer failures'
    ],
    deliberately_parked: [
      'actor.watch redirect',
      'collectActorWatch retirement',
      'durable Discovery ref selection/expanded/cached/failed marking',
      'Evidence/EVEidence writer landing',
      'Watch cadence mutation from receipt',
      'system/radius compatibility adapter behavior'
    ],
    contract_basis: {
      action: contract.action,
      wrapper_status: contract.wrapper_status,
      old_collector_semantics_claimed_replaced: contract.candidate_compatibility_result?.old_collector_semantics_claimed_replaced === true
    }
  };
}

function adapterWarnings({ posture, localCache, retryable, terminal }) {
  const warnings = [];
  if (posture.none_count > 0) {
    warnings.push('fixture_no_candidate_refs_available');
  }
  if (posture.malformed_count > 0) {
    warnings.push('fixture_malformed_candidate_refs_present');
  }
  if (posture.duplicate_count > 0) {
    warnings.push('fixture_duplicate_candidate_refs_present');
  }
  if (posture.capped_or_not_selected_count > 0) {
    warnings.push('fixture_acquisition_or_handoff_capped_not_full_coverage');
  }
  if (posture.deferred_count > 0) {
    warnings.push('fixture_provider_deferred_before_expansion');
  }
  if (localCache.count > 0) {
    warnings.push('fixture_local_evidence_eveidence_cache_skip');
  }
  if (retryable.count > 0) {
    warnings.push('fixture_retryable_esi_backed_expansion_failure');
  }
  if (terminal.count > 0) {
    warnings.push('fixture_terminal_esi_backed_expansion_failure');
  }
  return warnings;
}

function mapField(field, mapping, value) {
  return {
    field,
    mapping,
    value
  };
}

function stateSnapshot(db) {
  return {
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

function stableJson(value) {
  return JSON.stringify(value);
}

function safe(value) {
  return String(value || 'unknown').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'unknown';
}

module.exports = {
  buildWatchActorCompatibilityWrapperAdapterFixturePreview
};
