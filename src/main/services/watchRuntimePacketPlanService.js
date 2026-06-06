const { buildWatchScheduleStatus } = require('../watchlist/watchScheduler');
const { buildWatchAuthoredExecutionReadinessPreview } = require('./watchAuthoredExecutionReadinessService');

const ACTION = 'watch.runtime_packet_plan.preview';

function buildWatchRuntimePacketPlanPreview(db, input = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const sessionArmed = input.sessionArmed ?? input.session_armed ?? false;
  const liveApiEnabled = input.liveApiEnabled ?? input.live_api_enabled ?? false;
  const schedule = buildWatchScheduleStatus(db, {
    now,
    sessionArmed,
    liveApiEnabled
  });
  const readiness = buildWatchAuthoredExecutionReadinessPreview(db, { now });
  const systemReadinessByWatchId = new Map((readiness.system_radius_watches || [])
    .map((row) => [Number(row.watch_id), row]));
  const plans = schedule.watches.map((watch) => (
    packetPlanForWatch(watch, systemReadinessByWatchId.get(Number(watch.watch_id)))
  ));
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only Watch runtime packet plan preview',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    renderer_eligible: true,
    provider_calls: 0,
    live_api_calls: 0,
    watch_dispatches: 0,
    would_dispatch_watch: false,
    watch_execution_armed: false,
    tasks_created: 0,
    would_create_task: false,
    runtime_packet_rows_created: 0,
    runtime_packet_rows_persisted: 0,
    broad_provider_queue_created: false,
    queue_dispatches: 0,
    discovery_refs_mutated: 0,
    discovery_ref_mutations: 0,
    evidence_rows_written: 0,
    evidence_writes: 0,
    hydration_writes: 0,
    metadata_writes: 0,
    api_request_log_writes: 0,
    watch_mutations: 0,
    schema_changes: 0,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    watch_result_created: false,
    relationship_tags_written: 0,
    readiness_is_authorization: false,
    accepted_model: {
      actor_watch_scope_source: 'watchlist_entities actor Watch source fields',
      system_radius_scope_source: 'stored_included_system_ids',
      system_radius_valid_scope_source: 'stored_watch_scope',
      center_radius_role: 'provenance_and_management',
      center_radius_used_as_authority: false,
      would_recompute_from_center_radius: false,
      invalid_stored_scope_creates_packet_plan: false,
      preview_is_dispatch: false,
      readiness_is_authorization: false
    },
    gate_inputs: {
      session_armed: sessionArmed === true,
      live_api_enabled: liveApiEnabled === true,
      due_count: schedule.due.length,
      blocked_count: schedule.blocked.length
    },
    summary: summarize(plans),
    packet_plans: plans,
    source_actions: [
      'watch.schedule',
      'watch.authored_execution_readiness.preview'
    ],
    source_summaries: {
      authored_execution_readiness: readiness.summary
    },
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
        && readiness.table_mutation_proof?.unchanged === true
    },
    does_not_do: [
      'does_not_execute_watch',
      'does_not_arm_or_disarm_watch_runtime',
      'does_not_create_watch_executor_tasks',
      'does_not_call_providers',
      'does_not_perform_live_api_calls',
      'does_not_mutate_watch_rows',
      'does_not_mutate_discovery_refs',
      'does_not_write_evidence_or_eveidence',
      'does_not_write_hydration_or_metadata_labels',
      'does_not_change_watch_create',
      'does_not_change_topology_traversal',
      'does_not_infer_execution_authority_from_center_radius',
      'does_not_create_or_persist_runtime_packet_rows',
      'does_not_create_broad_provider_queue',
      'does_not_change_schema',
      'does_not_create_support_artifacts',
      'does_not_activate_runtime_enforcement_or_command_blocking',
      'does_not_create_watch_results_or_relationship_tags'
    ],
    boundary: [
      'Read-only/local-only Watch runtime packet plan preview only.',
      'Accepted Watch scope can be shaped into a future runtime packet plan, but the preview does not dispatch it.',
      'Actor Watch plans use actor Watch source fields from watchlist_entities.',
      'System/radius Watch plans use stored included_system_ids only; center/radius remain provenance and management.',
      'Invalid stored system/radius scope creates no accepted packet plan and any parseable IDs remain diagnostic-only.',
      'Waiting for schedule, backoff, session arm, or live/API gates is not failure.'
    ]
  };
}

function packetPlanForWatch(watch, readinessRow = null) {
  if (watch.watch_type === 'actor') {
    return actorPacketPlan(watch);
  }
  return systemRadiusPacketPlan(watch, readinessRow);
}

function actorPacketPlan(watch) {
  const source = watch.source || {};
  const scheduleReasons = scheduleBlockedReasons(watch);
  const canPlan = scheduleReasons.length === 0;
  const maxRefs = positiveNumber(source.max_killmails_per_run, 1);
  const lookbackSeconds = positiveNumber(source.lookback_days, 30) * 86400;

  return {
    watch_type: 'actor',
    watch_id: watch.watch_id,
    scope_key: watch.scope_key,
    gate_posture: gatePosture(watch, scheduleReasons),
    scope_authority: {
      scope_source: 'watchlist_entities',
      accepted_scope_source: 'actor_watch_source_fields',
      entity_type: source.entity_type || null,
      entity_id: source.entity_id ?? null,
      entity_name: source.entity_name || null,
      center_radius_used_as_authority: false,
      accepted_authority: true,
      selected_for_packet_plan: canPlan
    },
    packet_plan_status: canPlan ? 'planned' : 'blocked_no_plan',
    planned_lane: canPlan ? 'Discovery_then_Evidence_Expansion' : 'blocked_no_plan',
    runtime_packet_plan: canPlan ? {
      command: 'actor.watch',
      packet_shape: 'actor_zkill_discovery_then_capped_esi_evidence_expansion',
      acceptedScopeSource: 'actor_watch_source_fields',
      zkill_discovery_packet_count: 1,
      esi_evidence_expansion_cap: maxRefs,
      max_refs: maxRefs,
      lookback_seconds: lookbackSeconds,
      cadence: cadenceFor(watch),
      payload_preview: {
        entityType: source.entity_type,
        entityId: source.entity_id,
        entityName: source.entity_name,
        lookbackSeconds,
        maxRefs,
        maxExpansions: maxRefs
      }
    } : null,
    selected_runtime_systems: [],
    selected_accepted_system_ids: [],
    max_refs: canPlan ? maxRefs : null,
    max_refs_per_system: null,
    waiting_is_failure: false,
    readiness_is_authorization: false,
    would_dispatch_watch: false,
    would_create_task: false,
    provider_calls: 0,
    writes: 0
  };
}

function systemRadiusPacketPlan(watch, readinessRow = null) {
  const source = watch.source || {};
  const scheduleReasons = scheduleBlockedReasons(watch);
  const scopeReasons = systemScopeBlockedReasons(readinessRow);
  const blockedReasons = [...new Set([...scheduleReasons, ...scopeReasons])];
  const validStoredScope = readinessRow?.stored_scope?.accepted_authority === true;
  const acceptedSystemIds = validStoredScope
    ? [...(readinessRow.execution_system_ids || [])]
    : [];
  const canPlan = blockedReasons.length === 0 && acceptedSystemIds.length > 0;
  const maxRefs = positiveNumber(source.max_killmails_per_run, 1);
  const maxRefsPerSystem = acceptedSystemIds.length
    ? Math.max(1, Math.ceil(maxRefs / acceptedSystemIds.length))
    : null;
  const lookbackSeconds = positiveNumber(source.lookback_hours, 24) * 3600;

  return {
    watch_type: 'system_radius',
    watch_id: watch.watch_id,
    scope_key: watch.scope_key,
    gate_posture: gatePosture(watch, blockedReasons),
    scope_authority: {
      scope_source: 'system_watches.included_system_ids',
      acceptedScopeSource: validStoredScope ? 'stored_watch_scope' : null,
      stored_scope_status: readinessRow?.stored_scope_status || source.included_system_scope_status || 'not_sourced',
      accepted_system_ids: acceptedSystemIds,
      accepted_system_count: acceptedSystemIds.length,
      center_system_id: source.center_system_id ?? null,
      center_system_name: source.center_system_name || null,
      radius_jumps: source.radius_jumps ?? null,
      center_radius_role: 'provenance_and_management',
      center_radius_used_as_authority: false,
      would_recompute_from_center_radius: false,
      accepted_authority: validStoredScope,
      selected_for_packet_plan: canPlan
    },
    invalid_scope_diagnostic: diagnosticFor(readinessRow),
    packet_plan_status: canPlan ? 'planned' : 'blocked_no_plan',
    planned_lane: canPlan ? 'Discovery_then_Evidence_Expansion' : 'blocked_no_plan',
    runtime_packet_plan: canPlan ? {
      command: 'system.radius.watch',
      packet_shape: 'stored_scope_system_zkill_discovery_then_capped_esi_evidence_expansion',
      acceptedScopeSource: 'stored_watch_scope',
      acceptedScopeProvenance: {
        watchId: watch.watch_id,
        centerSystemId: source.center_system_id,
        radiusJumps: source.radius_jumps,
        includedSystemScopeStatus: readinessRow.stored_scope_status,
        excludedSystemScopeStatus: source.excluded_system_scope_status || readinessRow.stored_scope?.excluded_status || null,
        excludedSystemIds: readinessRow.stored_scope?.excluded_system_ids || []
      },
      selected_accepted_system_ids: acceptedSystemIds,
      zkill_discovery_packet_count: acceptedSystemIds.length,
      esi_evidence_expansion_cap: maxRefs,
      max_refs_per_system: maxRefsPerSystem,
      lookback_seconds: lookbackSeconds,
      cadence: cadenceFor(watch),
      payload_preview: {
        centerSystemId: source.center_system_id,
        radiusJumps: source.radius_jumps,
        acceptedSystemIds,
        acceptedScopeSource: 'stored_watch_scope',
        acceptedScopeProvenance: {
          watchId: watch.watch_id,
          centerSystemId: source.center_system_id,
          radiusJumps: source.radius_jumps,
          includedSystemScopeStatus: readinessRow.stored_scope_status,
          excludedSystemScopeStatus: source.excluded_system_scope_status || readinessRow.stored_scope?.excluded_status || null,
          excludedSystemIds: readinessRow.stored_scope?.excluded_system_ids || []
        },
        lookbackSeconds,
        maxSystems: acceptedSystemIds.length,
        maxRefsPerSystem,
        maxExpansions: maxRefs
      }
    } : null,
    selected_runtime_systems: canPlan ? acceptedSystemIds : [],
    selected_accepted_system_ids: canPlan ? acceptedSystemIds : [],
    max_refs: canPlan ? maxRefs : null,
    max_refs_per_system: canPlan ? maxRefsPerSystem : null,
    waiting_is_failure: false,
    readiness_is_authorization: false,
    would_dispatch_watch: false,
    would_create_task: false,
    provider_calls: 0,
    writes: 0
  };
}

function gatePosture(watch, blockedReasons) {
  return {
    is_active: !watch.blocked_reasons.includes('inactive'),
    active_state: watch.blocked_reasons.includes('inactive') ? 'inactive' : 'active',
    armed_input_posture: watch.blocked_reasons.includes('session_not_armed') ? 'disarmed' : 'armed',
    live_provider_gate_input_posture: watch.blocked_reasons.includes('live_api_disabled') ? 'provider_gate_closed' : 'provider_gate_open',
    due_posture: duePosture(watch),
    scheduler_state: watch.scheduler_state,
    next_poll_at: watch.next_poll_at,
    backoff_until: watch.backoff_until,
    poll_interval_minutes: watch.poll_interval_minutes,
    last_polled_at: watch.last_polled_at,
    last_success_at: watch.last_success_at,
    last_error_at: watch.last_error_at,
    blocked_reasons: blockedReasons
  };
}

function duePosture(watch) {
  if (watch.blocked_reasons.includes('backoff')) {
    return 'backoff';
  }
  if (watch.blocked_reasons.includes('not_due')) {
    return 'not_due';
  }
  return watch.scheduler_state === 'due' ? 'due' : 'blocked';
}

function scheduleBlockedReasons(watch) {
  return [...(watch.blocked_reasons || [])];
}

function systemScopeBlockedReasons(readinessRow) {
  if (!readinessRow) {
    return ['watch_scope_authority_not_sourced'];
  }
  return (readinessRow.blocked_reasons || [])
    .filter((reason) => !['inactive_watch'].includes(reason))
    .map((reason) => reason === 'invalid_stored_scope' ? 'watch_scope_authority_invalid' : reason);
}

function diagnosticFor(readinessRow) {
  const diagnostic = readinessRow?.invalid_scope_diagnostic || {};
  return {
    diagnostic_parseable_system_ids: diagnostic.diagnostic_parseable_system_ids || [],
    operator_actionable: false,
    accepted_authority: false,
    execution_authority: false,
    selected_runtime_systems: false,
    repairs_stored_row: false
  };
}

function cadenceFor(watch) {
  return {
    poll_interval_minutes: watch.poll_interval_minutes,
    next_poll_at: watch.next_poll_at,
    backoff_until: watch.backoff_until,
    last_polled_at: watch.last_polled_at,
    last_success_at: watch.last_success_at,
    last_error_at: watch.last_error_at
  };
}

function summarize(plans) {
  const planned = plans.filter((plan) => plan.packet_plan_status === 'planned');
  const blocked = plans.filter((plan) => plan.packet_plan_status !== 'planned');
  return {
    status: blocked.length ? 'blocked_or_waiting_rows_present' : 'all_watch_packet_plans_available',
    watch_count: plans.length,
    planned_count: planned.length,
    blocked_no_plan_count: blocked.length,
    actor_plan_count: planned.filter((plan) => plan.watch_type === 'actor').length,
    system_radius_plan_count: planned.filter((plan) => plan.watch_type === 'system_radius').length,
    invalid_stored_scope_blocked_count: plans.filter((plan) => (
      plan.gate_posture.blocked_reasons.includes('watch_scope_authority_invalid')
    )).length,
    dispatches: 0,
    tasks_created: 0,
    provider_calls: 0,
    writes: 0,
    readiness_is_authorization: false,
    waiting_is_failure: false
  };
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
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
  buildWatchRuntimePacketPlanPreview
};
