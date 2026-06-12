const { buildDiscoveryAcquisitionToEvidenceHandoffFixturePreview } = require('./discoveryAcquisitionToEvidenceHandoffFixtureService');

const ACTION = 'watch.mixed_collector_replacement_route.preview';

function buildWatchMixedCollectorReplacementRoutePreview(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const handoffProof = buildDiscoveryAcquisitionToEvidenceHandoffFixturePreview(db, {
    ...input,
    now
  }, context);
  const sourceWatch = handoffProof.source_bridge_summary?.source_watch
    || handoffProof.acquisition_request?.source_watch
    || null;
  const sourceKind = handoffProof.acquisition_request?.source_kind || sourceKindFor(sourceWatch);
  const currentEntryPoint = currentEntryPointFor(sourceKind);
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only mixed Watch collector replacement route preview',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    fixture_only: true,
    renderer_eligible: true,
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
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
    live_esi_backed_expansion_run: false,
    esi_evidence_expansion_run: false,
    evidence_landing_performed: false,
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
    mixed_collector_redirected: false,
    mixed_collector_retired: false,
    selected_watch_source: sourceWatch,
    current_command_entry_point_shape: currentEntryPoint,
    current_legacy_collector_that_would_have_been_used: currentEntryPoint.legacy_collector,
    future_route: futureRouteFor({ sourceWatch, currentEntryPoint, handoffProof }),
    compatibility_wrapper_posture: compatibilityWrapperPostureFor(currentEntryPoint),
    retire_posture: retirePostureFor(sourceKind),
    missing_proof_flags: missingProofFlagsFor(handoffProof),
    existing_proof_basis: existingProofBasisFor(handoffProof),
    non_invocation_proof: nonInvocationProofFor(handoffProof),
    no_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
        && handoffProof.table_mutation_proof?.unchanged === true,
      writes_attempted: false,
      runtime_behavior_changed: false
    },
    route_summary: {
      source_kind: sourceKind,
      future_route_mode: 'replacement_preview_only',
      compatibility_wrapper_candidate: currentEntryPoint.command,
      retire_candidate: currentEntryPoint.legacy_collector,
      acquisition_lane_candidate_count: handoffProof.normalized_candidate_refs?.length || 0,
      esi_backed_expansion_handoff_candidate_count: handoffProof.evidence_expansion_handoff?.selected_candidate_count || 0,
      evidence_writer_invoked: false,
      watch_receipt_projection: handoffProof.watch_summary_projection?.projection_name || null,
      request_posture: handoffProof.acquisition_request?.request_posture || null
    },
    boundary_flags: {
      providers_called: false,
      live_api_called: false,
      mixed_collectors_invoked: false,
      live_watch_dispatch_invoked: false,
      task_created: false,
      watch_mutated: false,
      discovery_refs_written: false,
      evidence_written: false,
      live_esi_backed_expansion_run: false,
      hydration_written: false,
      api_logs_or_warnings_written: false,
      fetch_runs_written: false,
      schema_changed: false,
      queue_dispatcher_or_lease_created: false,
      support_artifact_created: false,
      ui_changed: false,
      runtime_enforcement_or_command_blocking_active: false,
      mixed_collectors_retired_or_redirected: false,
      protected_words_updated: false
    },
    boundary: [
      'This is a route preview only; it does not redirect or retire legacy mixed collectors.',
      'Watch remains the source of accepted intent, cadence, and stored scope authority.',
      'Discovery owns zKill candidate-lead acquisition and the ESI-backed killmail/detail expansion lane.',
      'Evidence/EVEidence starts at final landed memory; the writer boundary is represented but not invoked.',
      'Watch receives a receipt/cadence posture projection without owning acquisition or Evidence landing meaning.'
    ]
  };
}

function futureRouteFor({ sourceWatch, currentEntryPoint, handoffProof }) {
  return [
    {
      stage: 'watch_accepted_intent_and_cadence',
      owner: 'Watch',
      input: {
        current_entry_point: currentEntryPoint.command,
        selected_watch: sourceWatch
      },
      output: {
        source_intent_family: 'watch',
        accepted_scope_basis: handoffProof.acquisition_request?.accepted_scope_basis || null,
        cadence_posture_source: handoffProof.source_bridge_summary?.watch_summary_projection || 'watch_summary'
      },
      boundary: 'Watch schedules and supplies accepted scope; Watch does not acquire candidates or write Evidence/EVEidence.',
      invoked: false,
      future_runtime_candidate: true
    },
    {
      stage: 'discovery_zkill_candidate_lead_acquisition_lane',
      owner: 'Discovery',
      input: handoffProof.acquisition_request,
      output: {
        provider_facing_packets: handoffProof.provider_facing_packets,
        normalized_candidate_refs: handoffProof.normalized_candidate_refs,
        dedupe_posture: handoffProof.candidate_dedupe_posture
      },
      boundary: 'Discovery performs provider-facing candidate-lead acquisition in the future; this preview uses fixture packets and fixture outcomes only.',
      invoked: false,
      future_runtime_candidate: true
    },
    {
      stage: 'discovery_esi_backed_killmail_detail_expansion_lane',
      owner: 'Discovery',
      input: handoffProof.evidence_expansion_handoff?.handoff_candidates || [],
      output: {
        selected_candidate_count: handoffProof.evidence_expansion_handoff?.selected_candidate_count || 0,
        handoff_only: true,
        fixture_only: true
      },
      boundary: 'ESI-backed killmail/detail expansion is a Discovery-serviced provider lane; no live ESI call or expansion happens here.',
      invoked: false,
      future_runtime_candidate: true
    },
    {
      stage: 'evidence_eveidence_writer_landed_memory',
      owner: 'Evidence/EVEidence writer',
      input: {
        future_landing_candidate_package: 'not_built_in_hs374'
      },
      output: {
        landed_memory_written: false,
        evidence_writes: 0
      },
      boundary: 'Evidence/EVEidence begins at final landed memory, not at candidate ref acquisition or provider expansion handoff.',
      invoked: false,
      future_runtime_candidate: true
    },
    {
      stage: 'watch_receipt_and_cadence_posture',
      owner: 'Watch',
      input: {
        canonical_discovery_receipt_basis: handoffProof.canonical_discovery_receipt_basis,
        watch_summary_projection: handoffProof.watch_summary_projection
      },
      output: {
        cadence_decision_written: false,
        watch_mutation: false
      },
      boundary: 'Watch may later decide rest/retry/defer posture from Discovery receipt facts; this preview does not mutate Watch cadence.',
      invoked: false,
      future_runtime_candidate: true
    }
  ];
}

function compatibilityWrapperPostureFor(entryPoint) {
  return {
    posture: 'candidate_only_not_implemented',
    old_command_entry_point: entryPoint.command,
    future_wrapper_role: 'accept_legacy_command_shape_then_call_boundary_owned_route',
    current_behavior_changed: false,
    redirect_performed: false,
    redirect_authorized_now: false,
    notes: [
      'Compatibility wrapper is a future migration option, not the HS374 behavior.',
      'Old entry points remain unchanged in this packet.'
    ]
  };
}

function retirePostureFor(sourceKind) {
  const retireCandidates = sourceKind === 'watch_system_radius'
    ? [{
        function: 'collectSystemRadiusWatch',
        file: 'src/main/workers/systemRadiusCollector.js',
        posture: 'retire_candidate_future_only'
      }]
    : [{
        function: 'collectActorWatch',
        file: 'src/main/workers/actorWatchCollector.js',
        posture: 'retire_candidate_future_only'
      }];
  return {
    posture: 'intended_end_state_not_performed',
    retire_candidates: retireCandidates,
    retirement_performed: false,
    retirement_authorized_now: false,
    replacement_frame: true,
    redirect_is_temporary_compatibility_only: true
  };
}

function missingProofFlagsFor(handoffProof) {
  const flags = [
    'live_provider_movement_not_proven',
    'discovery_esi_backed_expansion_intake_runtime_not_proven',
    'evidence_writer_landing_boundary_not_proven',
    'watch_cadence_mutation_from_receipt_not_proven',
    'compatibility_wrapper_not_implemented',
    'mixed_collector_retirement_not_performed'
  ];
  if (handoffProof.acquisition_request?.request_posture === 'held_by_external_io') {
    flags.push('held_by_external_io_request_has_no_packet_outcomes_by_design');
  }
  if (!handoffProof.normalized_candidate_refs?.length) {
    flags.push('no_candidate_refs_available_in_this_fixture_case');
  }
  return flags;
}

function existingProofBasisFor(handoffProof) {
  return {
    hs368_watch_to_discovery_acquisition_split: {
      command: 'watch.discovery_acquisition_split_fixture.preview',
      represented: true,
      source: handoffProof.source_bridge_summary || null
    },
    hs370_discovery_acquisition_to_evidence_handoff: {
      command: 'discovery.acquisition_to_evidence_handoff_fixture.preview',
      represented: true,
      acquisition_request_id: handoffProof.acquisition_request?.request_id || null,
      provider_packet_count: handoffProof.provider_facing_packets?.length || 0,
      normalized_candidate_count: handoffProof.normalized_candidate_refs?.length || 0,
      selected_handoff_candidate_count: handoffProof.evidence_expansion_handoff?.selected_candidate_count || 0,
      watch_summary_projection: handoffProof.watch_summary_projection?.projection_name || null
    }
  };
}

function nonInvocationProofFor(handoffProof) {
  return {
    collectActorWatch_entered: false,
    collectSystemRadiusWatch_entered: false,
    WatchSessionExecutor_tick_invoked: false,
    TaskRunner_runDetachedTask_invoked: false,
    live_watch_dispatch_invoked: false,
    mixed_collectors_invoked: false,
    redirect_performed: false,
    retirement_performed: false,
    source_actions_used: [
      'watch.mixed_collector_replacement_route.preview',
      handoffProof.action,
      ...(handoffProof.mixed_collector_non_invocation_proof?.source_actions_used || [])
    ],
    excluded_runtime_paths: [
      'collectActorWatch',
      'collectSystemRadiusWatch',
      'WatchSessionExecutor.tick',
      'TaskRunner.runDetachedTask',
      'runActorWatchService',
      'runSystemRadiusWatchService'
    ]
  };
}

function currentEntryPointFor(sourceKind) {
  if (sourceKind === 'watch_system_radius') {
    return {
      command: 'system.radius.watch',
      payload_family: 'system_radius_watch_dispatch_payload',
      legacy_collector: 'collectSystemRadiusWatch',
      legacy_file: 'src/main/workers/systemRadiusCollector.js',
      direct_service_candidate: 'runSystemRadiusWatchService',
      scheduled_executor_candidate: 'watchExecutor.dispatchFor(system_radius)'
    };
  }
  return {
    command: 'actor.watch',
    payload_family: 'actor_watch_dispatch_payload',
    legacy_collector: 'collectActorWatch',
    legacy_file: 'src/main/workers/actorWatchCollector.js',
    direct_service_candidate: 'runActorWatchService',
    scheduled_executor_candidate: 'watchExecutor.dispatchFor(actor)'
  };
}

function sourceKindFor(sourceWatch) {
  if (sourceWatch?.watch_type === 'system_radius') {
    return 'watch_system_radius';
  }
  if (sourceWatch?.watch_type === 'actor') {
    return 'watch_actor';
  }
  return 'watch_unknown';
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
  buildWatchMixedCollectorReplacementRoutePreview
};
