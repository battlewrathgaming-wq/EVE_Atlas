const { actionGate } = require('./liveApiGateService');
const { buildWatchRuntimePacketPlanPreview } = require('./watchRuntimePacketPlanService');
const { buildWatchScheduleStatus } = require('../watchlist/watchScheduler');
const { dryRunExecutorTickDecision } = require('../watchlist/watchExecutor');

const ACTION = 'watch.executor_tick_dry_run.preview';

function buildWatchExecutorTickDryRunPreview(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const sessionArmed = booleanInput(input.sessionArmed, input.session_armed, false);
  const liveApiEnabled = booleanInput(input.liveApiEnabled, input.live_api_enabled, process.env.AURA_ATLAS_LIVE_API === '1');
  const activeTaskId = input.activeTaskId || input.active_task_id || context.watchExecutor?.activeTaskId || null;
  const activeTaskPresent = booleanInput(
    input.activeTaskPresent,
    input.active_task_present,
    Boolean(activeTaskId)
  );
  const schedule = buildWatchScheduleStatus(db, {
    now,
    sessionArmed,
    liveApiEnabled
  });
  const packetPlanPreview = buildWatchRuntimePacketPlanPreview(db, {
    now,
    sessionArmed,
    liveApiEnabled
  });
  const planByWatchKey = new Map((packetPlanPreview.packet_plans || [])
    .map((plan) => [watchKey(plan), plan]));

  const decision = dryRunExecutorTickDecision(schedule, {
    now,
    checkedAt: now,
    sessionArmed,
    activeTaskId,
    activeTaskPresent,
    liveApiEnabled,
    dispatchBuilder: (watch) => dispatchPreviewFor(watch, planByWatchKey),
    gateBuilder: (command, payload) => actionGate(command, payload, { now })
  });
  const after = stateSnapshot(db);
  const selectedPlan = decision.selected_watch
    ? planByWatchKey.get(watchKey(decision.selected_watch)) || null
    : null;

  return {
    action: ACTION,
    classification: 'read-only Watch executor tick dry-run preview',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    renderer_eligible: true,
    provider_calls: 0,
    live_api_calls: 0,
    watch_dispatches: 0,
    watch_execution_armed: false,
    watch_arm_disarm_changes: 0,
    tasks_created: 0,
    would_create_task: false,
    task_creation_authorized: false,
    dry_run_is_authorization: false,
    would_dispatch_is_execution_authority: false,
    discovery_refs_mutated: 0,
    evidence_rows_written: 0,
    evidence_writes: 0,
    hydration_writes: 0,
    metadata_writes: 0,
    api_request_log_writes: 0,
    data_quality_warning_writes: 0,
    watch_mutations: 0,
    watch_rows_mutated: 0,
    schema_changes: 0,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    tick_called: false,
    executor_state_mutated: false,
    decision: {
      status: decision.status,
      reason: decision.reason || null,
      reason_codes: decision.reason_codes || [],
      waiting_is_failure: false,
      selected_at_most_one_watch: Boolean(decision.selected_watch) || decision.status !== 'would_dispatch',
      would_select_watch: Boolean(decision.selected_watch),
      would_dispatch_watch: decision.status === 'would_dispatch',
      would_create_task: false,
      provider_calls: 0,
      writes: 0
    },
    executor_inputs: {
      session_armed: sessionArmed,
      live_api_enabled: liveApiEnabled,
      active_task_id: activeTaskId,
      active_task_present: activeTaskPresent
    },
    selected_watch: decision.selected_watch || null,
    selected_scope_authority: selectedPlan?.scope_authority || null,
    selected_gate_posture: selectedPlan?.gate_posture || null,
    selected_packet_plan_status: selectedPlan?.packet_plan_status || null,
    selected_invalid_scope_diagnostic: selectedPlan?.invalid_scope_diagnostic || null,
    would_be_command: decision.status === 'would_dispatch' ? decision.would_be_command : decision.would_be_command || null,
    would_be_payload_shape: payloadShape(decision.would_be_payload),
    would_be_payload: decision.would_be_payload || null,
    live_gate: compactGate(decision.gate),
    schedule_summary: {
      watch_count: schedule.watches.length,
      due_count: schedule.due.length,
      blocked_count: schedule.blocked.length,
      selected_count: decision.selected_watch ? 1 : 0
    },
    schedule,
    packet_plan_summary: packetPlanPreview.summary,
    packet_plan_source_action: packetPlanPreview.action,
    accepted_model: {
      actor_watch_payload_source: 'watchlist_entities actor Watch source fields',
      system_radius_payload_source: 'stored_included_system_ids_from_packet_plan_preview',
      system_radius_valid_scope_source: 'stored_watch_scope',
      system_radius_invalid_scope_blocks_before_task_creation: true,
      center_radius_role: 'provenance_and_management',
      center_radius_used_as_authority: false,
      would_recompute_from_center_radius: false,
      multiple_due_selects_at_most_one_stable_candidate: true,
      waiting_is_failure: false,
      preview_is_dispatch: false,
      preview_is_authorization: false
    },
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
        && packetPlanPreview.table_mutation_proof?.unchanged === true
    },
    source_actions: [
      'watch.schedule',
      'watch.runtime_packet_plan.preview',
      'watchExecutor.dryRunExecutorTickDecision',
      'liveApiGate.actionGate'
    ],
    boundary: [
      'Read-only/local-only Watch executor tick dry-run preview only.',
      'Does not call WatchSessionExecutor.tick, arm/disarm Watch execution, create tasks, dispatch collectors, or call providers.',
      'System/radius would-be payloads use stored accepted included_system_ids only.',
      'Invalid stored system/radius scope blocks before task creation; diagnostic parseable IDs are not execution authority.',
      'Waiting for no due Watches, backoff, inactive rows, disarmed session, active task, or closed live gate is not failure.',
      'The preview is not runtime authorization and does not activate enforcement.'
    ],
    does_not_do: [
      'does_not_execute_watch',
      'does_not_arm_or_disarm_watch_runtime',
      'does_not_change_intervals',
      'does_not_create_watch_executor_tasks',
      'does_not_dispatch_collectors',
      'does_not_call_providers_or_live_api',
      'does_not_mutate_watch_rows',
      'does_not_mutate_discovery_refs',
      'does_not_write_evidence_or_eveidence',
      'does_not_write_hydration_or_metadata_labels',
      'does_not_write_api_request_logs_or_data_quality_warnings',
      'does_not_change_schema',
      'does_not_create_support_artifacts',
      'does_not_activate_runtime_enforcement_or_command_blocking',
      'does_not_do_ui_work'
    ]
  };
}

function dispatchPreviewFor(watch, planByWatchKey) {
  const plan = planByWatchKey.get(watchKey(watch));
  const runtimePlan = plan?.runtime_packet_plan || null;
  if (!runtimePlan?.command || !runtimePlan?.payload_preview) {
    const reasons = plan?.gate_posture?.blocked_reasons || ['watch_packet_plan_unavailable'];
    const error = new Error(`Watch executor dry-run cannot produce a dispatch preview: ${reasons.join(', ')}`);
    error.code = reasons.includes('watch_scope_authority_invalid')
      ? 'watch_scope_authority_invalid'
      : reasons[0] || 'watch_packet_plan_unavailable';
    throw error;
  }
  return {
    command: runtimePlan.command,
    payload: runtimePlan.payload_preview
  };
}

function payloadShape(payload = null) {
  if (!payload) {
    return null;
  }
  return {
    keys: Object.keys(payload).sort(),
    includes_accepted_system_ids: Array.isArray(payload.acceptedSystemIds),
    accepted_system_count: Array.isArray(payload.acceptedSystemIds) ? payload.acceptedSystemIds.length : 0,
    accepted_scope_source: payload.acceptedScopeSource || null,
    max_expansions: payload.maxExpansions ?? null,
    max_refs: payload.maxRefs ?? null,
    max_refs_per_system: payload.maxRefsPerSystem ?? null,
    lookback_seconds: payload.lookbackSeconds ?? null
  };
}

function compactGate(gate = null) {
  if (!gate) {
    return null;
  }
  return {
    action: gate.action || null,
    mode: gate.mode || null,
    allowed: gate.allowed === true,
    state: gate.state || null,
    providers: [...(gate.providers || [])],
    live_api_enabled: gate.live_api_enabled === true,
    user_agent_configured: gate.user_agent_configured === true,
    blockers: (gate.blockers || []).map((entry = {}) => ({
      code: entry.code || null,
      message: entry.message || null
    })),
    warnings: (gate.warnings || []).map((entry = {}) => ({
      code: entry.code || null,
      message: entry.message || null
    })),
    estimated_api_calls: gate.estimated_api_calls || null,
    request_control: gate.request_control ? {
      provider: gate.request_control.provider || null,
      action: gate.request_control.action || null,
      target_type: gate.request_control.target_type || null,
      target_id: gate.request_control.target_id || null,
      scope_fingerprint: gate.request_control.scope_fingerprint || null,
      cooldown_active: gate.request_control.cooldown_active === true,
      lockout_active: gate.request_control.lockout_active === true,
      persistence: gate.request_control.persistence || null
    } : null,
    non_authorizing_preview: true
  };
}

function watchKey(watch = {}) {
  return `${watch.watch_type}:${Number(watch.watch_id)}`;
}

function booleanInput(primary, secondary, fallback) {
  if (primary !== undefined) {
    return primary === true;
  }
  if (secondary !== undefined) {
    return secondary === true;
  }
  return fallback === true;
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
  buildWatchExecutorTickDryRunPreview
};
