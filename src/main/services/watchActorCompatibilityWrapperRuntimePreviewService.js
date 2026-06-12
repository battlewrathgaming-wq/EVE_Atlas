const { buildWatchActorCompatibilityWrapperAdapterFixturePreview } = require('./watchActorCompatibilityWrapperAdapterFixtureService');

const ACTION = 'watch.actor_compatibility_wrapper.preview';

function buildWatchActorCompatibilityWrapperPreview(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const legacyPayload = normalizeLegacyActorWatchPayload(input);
  const adapter = buildWatchActorCompatibilityWrapperAdapterFixturePreview(db, {
    ...input,
    ...legacyPayload,
    now
  }, context);
  const after = stateSnapshot(db);
  const compatibilityMap = adapter.old_result_compatibility_map || {};

  return {
    action: ACTION,
    classification: 'read-only actor Watch compatibility-wrapper preview command',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    fixture_only: true,
    compatibility_wrapper_preview: true,
    explicit_preview_command_only: true,
    non_authoritative_for_runtime_behavior: true,
    renderer_eligible: true,
    wrapper_status: 'explicit_preview_no_provider_no_write_not_active',
    adapter_basis_action: adapter.action,
    contract_basis_action: adapter.contract_basis_action,
    old_entry_point: 'actor.watch',
    current_retire_candidate: 'collectActorWatch',
    legacy_payload_shape_accepted: legacyPayload,
    old_caller_facing_compatibility_result: adapter.adapter_fixture_result,
    old_result_compatibility_map: compatibilityMap,
    represented_old_result_fields: fieldNames(compatibilityMap.represented_by_adapter_fixture),
    approximate_old_result_fields: fieldNames(compatibilityMap.represented_only_approximately),
    not_represented_old_result_fields: [...(compatibilityMap.not_represented_yet || [])],
    parked_old_result_fields: [...(compatibilityMap.deliberately_parked || [])],
    legacy_term_posture: {
      old_actor_watch_result_shape_retained_for_compatibility: true,
      legacy_mixed_collector_language_is_compatibility_only: true,
      future_doctrine_claimed: false,
      future_runtime_redirect_authorized: false
    },
    existing_runtime_preserved: {
      actor_watch_handler_changed: false,
      actor_watch_redirected: false,
      actor_watch_runtime_entry_point: 'runActorWatchService',
      runActorWatchService_changed: false,
      runActorWatchService_current_call_target: 'runActorWatchDirectBody',
      scheduled_actor_watch_dispatch_changed: false,
      scheduled_actor_watch_dispatch_command: 'actor.watch',
      scheduled_actor_watch_current_runner: 'runScheduledActorWatch',
      scheduled_actor_watch_runner_call_target: 'runActorWatchDirectBody',
      collectActorWatch_status: 'legacy_compatibility_available_retirement_candidate',
      watchExecutor_dispatchFor_changed: false,
      system_radius_behavior_changed: false
    },
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    watch_execution: false,
    watch_dispatches: 0,
    dispatch_runner_invoked: false,
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
        adapter.action,
        ...(adapter.non_invocation_proof?.source_actions_used || [])
      ],
      excluded_runtime_paths: [
        'actor.watch handler mutation',
        'runActorWatchService',
        'watchExecutor.dispatchFor runtime path',
        'collectActorWatch',
        'collectSystemRadiusWatch',
        'WatchSessionExecutor.tick',
        'TaskRunner.runDetachedTask',
        'provider clients',
        'EvidenceRepository.persistEvidencePackage'
      ]
    },
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
        && adapter.table_mutation_proof?.unchanged === true
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
      'This is an explicit preview command only; actor.watch is not redirected.',
      'The preview consumes the old actor Watch payload shape and delegates to the accepted adapter fixture surface.',
      'The returned old caller-facing shape is compatibility evidence, not runtime execution authority.',
      'Current direct actor.watch is runActorWatchService -> runActorWatchDirectBody.',
      'Current scheduled actor Watch dispatch is watchExecutor.dispatchFor(actor) -> actor.watch with runScheduledActorWatch as runner.',
      'collectActorWatch remains parked legacy compatibility code and retirement candidate.',
      'Candidate refs remain possible leads; Evidence/EVEidence starts only at final landed memory.'
    ]
  };
}

function normalizeLegacyActorWatchPayload(input = {}) {
  return {
    entityType: input.entityType || input.entity_type || 'character',
    entityId: input.entityId ?? input.entity_id ?? 90000001,
    entityName: input.entityName || input.entity_name || 'Wrapper Preview Pilot',
    lookbackSeconds: input.lookbackSeconds ?? input.lookback_seconds ?? 1209600,
    maxRefs: input.maxRefs ?? input.max_refs ?? 5,
    maxExpansions: input.maxExpansions ?? input.max_expansions ?? 5
  };
}

function fieldNames(entries = []) {
  return entries.map((entry) => entry.field).filter(Boolean);
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
  buildWatchActorCompatibilityWrapperPreview
};
