const { buildDiscoveryAcquisitionToEvidenceHandoffFixturePreview } = require('./discoveryAcquisitionToEvidenceHandoffFixtureService');
const { buildDiscoveryEsiExpansionIntakePosturePreview } = require('./discoveryEsiExpansionIntakePostureService');
const { buildWatchActorReplacementParityPreview } = require('./watchActorReplacementParityService');

const ACTION = 'watch.actor_compatibility_wrapper_contract.preview';

function buildWatchActorCompatibilityWrapperContractPreview(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const proofInput = { ...input, now };
  const parity = buildWatchActorReplacementParityPreview(db, proofInput, context);
  const handoff = buildDiscoveryAcquisitionToEvidenceHandoffFixturePreview(db, proofInput, context);
  const intake = buildDiscoveryEsiExpansionIntakePosturePreview(db, proofInput, context);
  const payload = parity.current_actor_entry_point_shape?.payload || {};
  const actorIdentity = parity.current_actor_entry_point_shape?.actor_target_identity || {};
  const after = stateSnapshot(db);
  const candidateResult = candidateCompatibilityResult({ parity, handoff, intake, payload, actorIdentity });

  return {
    action: ACTION,
    classification: 'read-only actor Watch compatibility-wrapper contract proof',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    fixture_only: true,
    renderer_eligible: true,
    wrapper_status: 'contract_only_not_active',
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
    direct_command_path_basis: directCommandPathBasis(payload, actorIdentity),
    scheduled_dispatch_path_basis: scheduledDispatchPathBasis(parity, payload, actorIdentity),
    future_boundary_owned_stages: futureBoundaryStages({ parity, handoff, intake }),
    candidate_compatibility_result: candidateResult,
    legacy_summary_mapping: legacySummaryMapping({ parity, handoff, intake, candidateResult }),
    composed_proof_surfaces: {
      actor_replacement_parity: summarizeSurface(parity),
      discovery_acquisition_to_evidence_handoff_fixture: summarizeSurface(handoff),
      discovery_esi_expansion_intake_posture: summarizeSurface(intake)
    },
    accepted_model: {
      wrapper_status: 'contract_only_not_active',
      source_agnostic_discovery: true,
      actor_watch_is_source_intent_only_here: true,
      candidate_refs_are_possible_leads: true,
      candidate_refs_are_evidence: false,
      esi_backed_killmail_detail_expansion_owner: 'Discovery',
      esi_backed_expansion_is_hydration: false,
      hydration_repairs_readability_only: true,
      evidence_eveidence_begins_at_final_landed_memory: true,
      evidence_eveidence_writer_invoked: false,
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
      'old_collector_result_object_equivalence_not_claimed'
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
        parity.action,
        handoff.action,
        intake.action
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
        && parity.no_mutation_proof?.unchanged === true
        && handoff.table_mutation_proof?.unchanged === true
        && intake.table_mutation_proof?.unchanged === true
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
      'This preview is a compatibility-wrapper contract only; actor.watch is not redirected.',
      'The direct actor.watch path is runActorWatchService -> runActorWatchDirectBody today.',
      'The scheduled actor Watch path is watchExecutor.dispatchFor(actor) -> actor.watch payload -> runScheduledActorWatch -> runActorWatchDirectBody today.',
      'collectActorWatch remains parked legacy compatibility code and retirement candidate.',
      'A future wrapper would call Watch intent/cadence, Discovery zKill acquisition, Discovery ESI-backed killmail/detail expansion intake, Evidence/EVEidence writer boundary, and Watch receipt/cadence decision stages.',
      'Candidate refs remain possible leads, not Evidence/EVEidence.',
      'ESI-backed killmail/detail expansion remains Discovery-owned provider movement, not Hydration.',
      'Evidence/EVEidence writer boundary is final landed memory and is not invoked here.'
    ]
  };
}

function directCommandPathBasis(payload, actorIdentity) {
  return {
    source_function: 'runActorWatchService',
    file: 'src/main/services/mutatingActionService.js',
    current_path: [
      'resolveActorInput(db, payload, dependencies)',
      'normalizeActorWatchScope(...)',
      'assertLiveAllowed("actor.watch", input, dependencies)',
      'runActorWatchDirectBody(input, { ...dependencies, db })'
    ],
    old_entry_point: 'actor.watch',
    receives_after_resolution_and_normalization: {
      actor_target_identity: actorIdentity,
      payload_family: 'actor_watch_dispatch_payload',
      entityType: payload.entityType || null,
      entityId: payload.entityId ?? null,
      entityName: payload.entityName || null,
      lookbackSeconds: payload.lookbackSeconds ?? null,
      maxRefs: payload.maxRefs ?? null,
      maxExpansions: payload.maxExpansions ?? null
    },
    represented: true,
    runtime_behavior_changed: false,
    collectActorWatch_status: 'legacy_compatibility_available_retirement_candidate',
    collectActorWatch_invoked: false
  };
}

function scheduledDispatchPathBasis(parity, payload, actorIdentity) {
  return {
    source_function: 'watchExecutor.dispatchFor',
    file: 'src/main/watchlist/watchExecutor.js',
    current_path: [
      'WatchSessionExecutor.tick(...) selects due actor Watch',
      'dispatchFor(watch) builds command actor.watch and payload',
      'dispatch.runner is runScheduledActorWatch',
      'runScheduledActorWatch delegates to runActorWatchDirectBody',
      'TaskRunner.runDetachedTask would execute dispatch.runner in runtime'
    ],
    represented_source_watch: parity.selected_actor_watch_source || null,
    sends_for_actor_watch: {
      command: 'actor.watch',
      payload_family: 'actor_watch_dispatch_payload',
      payload,
      actor_target_identity: actorIdentity
    },
    current_runner: 'runScheduledActorWatch',
    runner_call_target: 'runActorWatchDirectBody',
    collectActorWatch_status: 'legacy_compatibility_available_retirement_candidate',
    runner_invoked: false,
    tick_invoked: false,
    task_created: false,
    runtime_behavior_changed: false
  };
}

function futureBoundaryStages({ parity, handoff, intake }) {
  const routeStages = parity.future_boundary_owned_stages || [];
  return [
    {
      stage: 'watch_accepted_actor_intent_cadence_authority',
      owner: 'Watch',
      basis: routeStages[0] || null,
      invoked: false,
      writes: 0
    },
    {
      stage: 'discovery_zkill_candidate_lead_acquisition',
      owner: 'Discovery',
      provider: 'zKill',
      basis: {
        acquisition_request: handoff.acquisition_request || null,
        provider_facing_packets: handoff.provider_facing_packets || []
      },
      provider_calls: 0,
      durable_discovery_refs_written: 0
    },
    {
      stage: 'discovery_esi_backed_killmail_detail_expansion_intake',
      owner: 'Discovery',
      provider: 'ESI',
      basis: {
        posture_summary: intake.posture_summary || null,
        intake_items: intake.intake_items || []
      },
      esi_calls: 0,
      hydration_writes: 0
    },
    {
      stage: 'evidence_eveidence_writer_boundary',
      owner: 'Evidence/EVEidence writer',
      basis: intake.evidence_eveidence_writer_boundary || null,
      invoked: false,
      evidence_writes: 0
    },
    {
      stage: 'watch_receipt_cadence_decision_placeholder',
      owner: 'Watch',
      basis: handoff.watch_summary_projection || parity.semantic_parity_map?.watch_receipt_cadence_posture || null,
      invoked: false,
      watch_mutations: 0
    }
  ];
}

function candidateCompatibilityResult({ parity, handoff, intake, payload, actorIdentity }) {
  const outcomeCounts = handoff.fixture_zkill_outcome_summary?.packet_outcome_counts || {};
  const postureSummary = intake.posture_summary || {};
  const selectedIntake = (intake.intake_items || [])
    .filter((item) => item.posture === 'selected_ready_for_future_esi_expansion')
    .map(compactIntakeItem);
  return {
    wrapper_status: 'contract_only_not_active',
    old_entry_point: 'actor.watch',
    old_collector_semantics_claimed_replaced: false,
    actor_target_identity: actorIdentity,
    lookback_seconds: payload.lookbackSeconds ?? null,
    max_refs: payload.maxRefs ?? null,
    max_expansions: payload.maxExpansions ?? null,
    zkill_provider_target_shape: handoff.provider_facing_packets?.[0]?.request_basis?.provider_target_posture
      || parity.semantic_parity_map?.zkill_request_target?.value
      || null,
    candidate_ref_posture: {
      refs_found_count: (handoff.normalized_candidate_refs || []).filter((candidate) => candidate.killmail_id && candidate.killmail_hash).length,
      none_count: outcomeCounts.complete_no_refs || 0,
      malformed_count: postureSummary.malformed_count || 0,
      duplicate_count: postureSummary.duplicate_count || handoff.candidate_dedupe_posture?.duplicate_candidate_count || 0,
      capped_or_not_selected_count: postureSummary.not_selected_capped_count || outcomeCounts.acquisition_capped || 0,
      deferred_count: (postureSummary.provider_deferred_count || 0) + (outcomeCounts.provider_deferred || 0) + (outcomeCounts.partial_deferred || 0),
      candidate_refs_are_possible_leads: true,
      candidate_refs_are_evidence: false
    },
    selected_esi_backed_expansion_intake_candidates: selectedIntake,
    local_evidence_eveidence_cache_skip_posture: {
      represented: (postureSummary.local_evidence_skip_count || 0) > 0,
      count: postureSummary.local_evidence_skip_count || 0,
      future_esi_needed_for_cached_candidates: false
    },
    retryable_esi_backed_expansion_failure_posture_fixture_only: {
      represented: (postureSummary.retryable_failure_count || 0) > 0,
      count: postureSummary.retryable_failure_count || 0
    },
    terminal_esi_backed_expansion_failure_posture_fixture_only: {
      represented: (postureSummary.terminal_failure_count || 0) > 0,
      count: postureSummary.terminal_failure_count || 0
    },
    evidence_eveidence_writer_boundary_not_invoked: true,
    evidence_writes: 0,
    watch_cadence_mutation_not_performed: true,
    watch_mutations: 0
  };
}

function legacySummaryMapping({ parity, handoff, intake, candidateResult }) {
  return {
    represented_now: [
      'old entry point actor.watch remains registered and unchanged',
      'direct runActorWatchService path basis is disclosed without calling it',
      'scheduled watchExecutor.dispatchFor actor payload basis is disclosed without invoking tick or runner',
      'collectActorWatch is identified as parked legacy compatibility and current retire candidate without invocation or retirement'
    ],
    represented_by_existing_fixture_proof: [
      {
        surface: parity.action,
        represents: [
          'actor identity, lookback, max refs, max expansions',
          'future Watch/Discovery/Evidence boundary stage map',
          'malformed, duplicate, no-ref, capped, deferred, selected, and cache-skip posture where fixture case supplies it'
        ]
      },
      {
        surface: handoff.action,
        represents: [
          'Discovery acquisition request',
          'zKill provider-facing fixture packet shape',
          'normalized candidate refs and dedupe posture',
          'canonical Discovery receipt and watch_summary projection',
          'ESI expansion handoff candidates'
        ]
      },
      {
        surface: intake.action,
        represents: [
          'selected ESI-backed expansion intake candidates',
          'local Evidence/EVEidence cache skip',
          'malformed, duplicate, capped/not-selected, provider-deferred, retryable, and terminal fixture posture',
          'Evidence/EVEidence writer boundary not invoked'
        ]
      }
    ],
    not_represented_yet: [
      'live zKill provider execution',
      'live ESI killmail/detail expansion',
      'durable Discovery ref persistence',
      'Evidence/EVEidence writer landing',
      'real old collector returned-summary object equivalence'
    ],
    intentionally_parked: [
      'actor.watch redirect',
      'runActorWatchService runtime replacement',
      'watchExecutor.dispatchFor runtime replacement',
      'collectActorWatch retirement',
      'Watch cadence mutation from Discovery receipt',
      'tasks, queues, dispatchers, leases, workers, schema, UI, enforcement, support artifacts, and system/radius changes'
    ],
    compatibility_result_summary: {
      wrapper_status: candidateResult.wrapper_status,
      old_collector_semantics_claimed_replaced: candidateResult.old_collector_semantics_claimed_replaced,
      candidate_ref_posture: candidateResult.candidate_ref_posture,
      evidence_writer_invoked: false,
      watch_mutated: false
    }
  };
}

function compactIntakeItem(item = {}) {
  return {
    intake_item_id: item.intake_item_id || null,
    posture: item.posture || null,
    killmail_id: item.killmail_id ?? null,
    killmail_hash: item.killmail_hash || null,
    source_kind: item.source_kind || null,
    scope_key: item.scope_key || null,
    future_provider_target: item.future_provider_target || null,
    esi_call_performed: false,
    evidence_written: false,
    hydration_written: false
  };
}

function summarizeSurface(surface = {}) {
  return {
    action: surface.action || null,
    read_only: surface.read_only === true,
    fixture_only: surface.fixture_only === true,
    provider_calls: surface.provider_calls || 0,
    evidence_writes: surface.evidence_writes || 0,
    watch_mutations: surface.watch_mutations || 0,
    mixed_collectors_invoked: surface.mixed_collectors_invoked === true,
    table_mutation_unchanged: surface.table_mutation_proof?.unchanged === true || surface.no_mutation_proof?.unchanged === true
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

module.exports = {
  buildWatchActorCompatibilityWrapperContractPreview
};
