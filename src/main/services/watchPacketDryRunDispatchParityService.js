const { dispatchFor } = require('../watchlist/watchExecutor');
const { buildWatchRuntimePacketPlanPreview } = require('./watchRuntimePacketPlanService');
const { buildWatchExecutorTickDryRunPreview } = require('./watchExecutorTickDryRunService');

const ACTION = 'watch.packet_dry_run_dispatch_parity.preview';

function buildWatchPacketDryRunDispatchParityPreview(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const packetPlan = buildWatchRuntimePacketPlanPreview(db, {
    ...input,
    now
  });
  const dryRun = buildWatchExecutorTickDryRunPreview(db, {
    ...input,
    now
  }, context);
  const packetPlanByWatch = new Map((packetPlan.packet_plans || [])
    .map((row) => [watchKey(row), row]));
  const selectedKey = dryRun.selected_watch ? watchKey(dryRun.selected_watch) : null;
  const parity_rows = (dryRun.schedule?.watches || []).map((watch) => (
    parityForWatch({
      watch,
      packetPlanRow: packetPlanByWatch.get(watchKey(watch)) || null,
      dryRun,
      selected: watchKey(watch) === selectedKey
    })
  ));
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only Watch packet/dry-run/dispatch parity preview',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    renderer_eligible: true,
    provider_calls: 0,
    live_api_calls: 0,
    watch_dispatches: 0,
    watch_execution_armed: false,
    tasks_created: 0,
    would_create_task: false,
    task_creation_authorized: false,
    dry_run_is_authorization: false,
    parity_is_authorization: false,
    dispatch_for_invokes_runner: false,
    dispatch_runner_invocations: 0,
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
    summary: summarize(parity_rows),
    selected_watch: dryRun.selected_watch || null,
    dry_run_decision: dryRun.decision,
    parity_rows,
    source_actions: [
      packetPlan.action,
      dryRun.action,
      'watchExecutor.dispatchFor'
    ],
    source_summaries: {
      packet_plan: packetPlan.summary,
      dry_run: dryRun.schedule_summary
    },
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
        && packetPlan.table_mutation_proof?.unchanged === true
        && dryRun.table_mutation_proof?.unchanged === true
    },
    accepted_model: {
      actor_payload_parity_fields: ['entityType', 'entityId', 'entityName', 'lookbackSeconds', 'maxRefs', 'maxExpansions'],
      system_radius_payload_parity_fields: ['centerSystemId', 'radiusJumps', 'acceptedSystemIds', 'acceptedScopeSource', 'acceptedScopeProvenance', 'lookbackSeconds', 'maxSystems', 'maxRefsPerSystem', 'maxExpansions'],
      system_radius_scope_source: 'stored_included_system_ids',
      center_radius_role: 'provenance_and_management',
      center_radius_used_as_authority: false,
      invalid_stored_scope_blocks_before_task_creation: true,
      non_selected_dispatch_comparison: 'skipped_or_diagnostic_only',
      preview_is_dispatch: false,
      preview_is_authorization: false
    },
    boundary: [
      'Read-only/local-only Watch packet/dry-run/dispatch parity preview only.',
      'Compares future movement shape without calling WatchSessionExecutor.tick, arming runtime, creating tasks, invoking runners, calling providers, or writing rows.',
      'dispatchFor is used only as a pure payload builder and its runner is never invoked.',
      'Non-selected blocked rows skip dispatchFor comparison unless invalid stored scope needs diagnostic throw proof.',
      'Parity is not authorization and does not imply execution readiness.'
    ],
    does_not_do: [
      'does_not_execute_watch',
      'does_not_call_watch_session_executor_tick',
      'does_not_arm_or_disarm_watch_runtime',
      'does_not_start_or_stop_intervals',
      'does_not_create_watch_executor_tasks',
      'does_not_call_collectors_or_dispatch_runners',
      'does_not_call_providers_or_live_api',
      'does_not_mutate_watch_rows',
      'does_not_mutate_discovery_refs',
      'does_not_write_evidence_or_eveidence',
      'does_not_write_hydration_or_metadata_labels',
      'does_not_write_api_request_logs_or_warnings',
      'does_not_change_watch_create',
      'does_not_change_topology_traversal',
      'does_not_create_runtime_packet_rows',
      'does_not_create_provider_queue',
      'does_not_change_schema',
      'does_not_create_support_artifacts',
      'does_not_activate_runtime_enforcement_or_command_blocking',
      'does_not_do_ui_work'
    ]
  };
}

function parityForWatch({ watch, packetPlanRow, dryRun, selected }) {
  const packetRuntime = packetPlanRow?.runtime_packet_plan || null;
  const packetCommand = packetRuntime?.command || null;
  const packetPayload = packetRuntime?.payload_preview || null;
  const dryRunCommand = selected ? dryRun.would_be_command || null : null;
  const dryRunPayload = selected ? dryRun.would_be_payload || null : null;
  const dispatchComparison = dispatchComparisonFor(watch, packetPlanRow, selected);
  const commandParity = commandParityFor({
    packetCommand,
    dryRunCommand,
    dispatchCommand: dispatchComparison.command,
    selected,
    packetPlanRow,
    dispatchComparison
  });
  const payloadParity = payloadParityFor({
    packetPayload,
    dryRunPayload,
    dispatchPayload: dispatchComparison.payload,
    selected,
    packetPlanRow,
    dispatchComparison
  });
  const invalidScopeParity = invalidScopeParityFor(packetPlanRow, dryRun, dispatchComparison, selected);

  return {
    watch_type: watch.watch_type,
    watch_id: watch.watch_id,
    scope_key: watch.scope_key,
    selected_by_dry_run: selected,
    scheduler_state: watch.scheduler_state,
    blocked_reasons: [...(watch.blocked_reasons || [])],
    packet_plan_status: packetPlanRow?.packet_plan_status || 'missing',
    packet_plan_command: packetCommand,
    dry_run_command: dryRunCommand,
    dispatch_for_command: dispatchComparison.command,
    command_parity: commandParity,
    payload_parity: payloadParity,
    invalid_scope_parity: invalidScopeParity,
    comparison_status: comparisonStatus(commandParity, payloadParity, invalidScopeParity, selected, packetPlanRow),
    packet_payload_shape: payloadShape(packetPayload),
    dry_run_payload_shape: payloadShape(dryRunPayload),
    dispatch_for_payload_shape: payloadShape(dispatchComparison.payload),
    dispatch_for: {
      status: dispatchComparison.status,
      reason: dispatchComparison.reason,
      diagnostic_only: dispatchComparison.diagnostic_only,
      runner_invoked: false,
      runner_present_but_not_invoked: dispatchComparison.runner_present_but_not_invoked,
      error_code: dispatchComparison.error_code,
      error_message: dispatchComparison.error_message
    },
    selected_scope_authority: selected ? dryRun.selected_scope_authority || null : packetPlanRow?.scope_authority || null,
    selected_invalid_scope_diagnostic: selected ? dryRun.selected_invalid_scope_diagnostic || null : packetPlanRow?.invalid_scope_diagnostic || null,
    differences: differencesFor(commandParity, payloadParity, invalidScopeParity),
    non_authorizing_preview: true,
    would_create_task: false,
    provider_calls: 0,
    writes: 0
  };
}

function dispatchComparisonFor(watch, packetPlanRow, selected) {
  const reasons = new Set([
    ...(watch.blocked_reasons || []),
    ...(packetPlanRow?.gate_posture?.blocked_reasons || [])
  ]);
  const invalidScope = reasons.has('watch_scope_authority_invalid');
  const canCompare = selected || invalidScope;

  if (!canCompare) {
    return {
      status: 'skipped',
      reason: 'not_selected_or_waiting',
      diagnostic_only: true,
      command: null,
      payload: null,
      runner_present_but_not_invoked: false,
      error_code: null,
      error_message: null
    };
  }

  try {
    const dispatch = dispatchFor(watch);
    return {
      status: 'available',
      reason: selected ? 'selected_pure_payload_builder' : 'diagnostic_only',
      diagnostic_only: !selected,
      command: dispatch.command,
      payload: dispatch.payload,
      runner_present_but_not_invoked: Boolean(dispatch.runner),
      error_code: null,
      error_message: null
    };
  } catch (error) {
    return {
      status: 'blocked',
      reason: error.code || 'dispatch_for_error',
      diagnostic_only: !selected,
      command: null,
      payload: null,
      runner_present_but_not_invoked: false,
      error_code: error.code || null,
      error_message: error.message
    };
  }
}

function commandParityFor({ packetCommand, dryRunCommand, dispatchCommand, selected, packetPlanRow, dispatchComparison }) {
  if (invalidPacket(packetPlanRow)) {
    return dispatchComparison.error_code === 'watch_scope_authority_invalid'
      ? 'blocked_in_all_surfaces'
      : 'mismatch';
  }
  if (!selected) {
    return 'skipped_not_selected';
  }
  return packetCommand === dryRunCommand && dryRunCommand === dispatchCommand
    ? 'matches'
    : 'mismatch';
}

function payloadParityFor({ packetPayload, dryRunPayload, dispatchPayload, selected, packetPlanRow, dispatchComparison }) {
  if (invalidPacket(packetPlanRow)) {
    return !packetPayload && !dryRunPayload && !dispatchPayload && dispatchComparison.error_code === 'watch_scope_authority_invalid'
      ? 'blocked_no_payload'
      : 'mismatch';
  }
  if (!selected) {
    return 'skipped_not_selected';
  }
  const packetMatchesDryRun = stableJson(normalizePayload(packetPayload)) === stableJson(normalizePayload(dryRunPayload));
  const dryRunMatchesDispatch = stableJson(normalizePayload(dryRunPayload)) === stableJson(normalizePayload(dispatchPayload));
  return packetMatchesDryRun && dryRunMatchesDispatch ? 'matches' : 'mismatch';
}

function invalidScopeParityFor(packetPlanRow, dryRun, dispatchComparison, selected) {
  if (!invalidPacket(packetPlanRow)) {
    return 'not_applicable';
  }
  const dryRunBlocked = selected
    ? dryRun.decision?.reason === 'watch_scope_authority_invalid'
    : true;
  return packetPlanRow.runtime_packet_plan === null
    && dryRunBlocked
    && dispatchComparison.error_code === 'watch_scope_authority_invalid'
    ? 'matches_blocked_before_task_creation'
    : 'mismatch';
}

function invalidPacket(packetPlanRow) {
  return (packetPlanRow?.gate_posture?.blocked_reasons || []).includes('watch_scope_authority_invalid');
}

function comparisonStatus(commandParity, payloadParity, invalidScopeParity, selected, packetPlanRow) {
  if (invalidScopeParity === 'matches_blocked_before_task_creation') {
    return 'matches';
  }
  if (!selected && packetPlanRow?.packet_plan_status !== 'planned') {
    return 'skipped_waiting_or_blocked';
  }
  return commandParity === 'matches' && payloadParity === 'matches' ? 'matches' : 'mismatch';
}

function differencesFor(commandParity, payloadParity, invalidScopeParity) {
  const differences = [];
  if (commandParity === 'mismatch') {
    differences.push('command_mismatch');
  }
  if (payloadParity === 'mismatch') {
    differences.push('payload_mismatch');
  }
  if (invalidScopeParity === 'mismatch') {
    differences.push('invalid_scope_blocking_mismatch');
  }
  return differences;
}

function payloadShape(payload = null) {
  if (!payload) {
    return null;
  }
  return {
    keys: Object.keys(payload).sort(),
    entity_type: payload.entityType || null,
    entity_id: payload.entityId ?? null,
    entity_name: payload.entityName || null,
    center_system_id: payload.centerSystemId ?? null,
    radius_jumps: payload.radiusJumps ?? null,
    accepted_system_ids: Array.isArray(payload.acceptedSystemIds) ? [...payload.acceptedSystemIds] : [],
    accepted_scope_source: payload.acceptedScopeSource || null,
    accepted_scope_provenance: payload.acceptedScopeProvenance || null,
    lookback_seconds: payload.lookbackSeconds ?? null,
    max_refs: payload.maxRefs ?? null,
    max_systems: payload.maxSystems ?? null,
    max_refs_per_system: payload.maxRefsPerSystem ?? null,
    max_expansions: payload.maxExpansions ?? null
  };
}

function normalizePayload(payload = null) {
  if (!payload) {
    return null;
  }
  return {
    entityType: payload.entityType ?? null,
    entityId: payload.entityId ?? null,
    entityName: payload.entityName ?? null,
    centerSystemId: payload.centerSystemId ?? null,
    radiusJumps: payload.radiusJumps ?? null,
    acceptedSystemIds: Array.isArray(payload.acceptedSystemIds) ? [...payload.acceptedSystemIds] : null,
    acceptedScopeSource: payload.acceptedScopeSource ?? null,
    acceptedScopeProvenance: payload.acceptedScopeProvenance ?? null,
    lookbackSeconds: payload.lookbackSeconds ?? null,
    maxRefs: payload.maxRefs ?? null,
    maxSystems: payload.maxSystems ?? null,
    maxRefsPerSystem: payload.maxRefsPerSystem ?? null,
    maxExpansions: payload.maxExpansions ?? null
  };
}

function summarize(rows) {
  const matches = rows.filter((row) => row.comparison_status === 'matches').length;
  const skipped = rows.filter((row) => row.comparison_status === 'skipped_waiting_or_blocked').length;
  const mismatches = rows.filter((row) => row.comparison_status === 'mismatch').length;
  return {
    status: mismatches ? 'mismatch_detected' : 'parity_proven_for_comparable_rows',
    watch_count: rows.length,
    comparable_match_count: matches,
    skipped_waiting_or_blocked_count: skipped,
    mismatch_count: mismatches,
    selected_count: rows.filter((row) => row.selected_by_dry_run).length,
    invalid_scope_blocked_count: rows.filter((row) => row.invalid_scope_parity === 'matches_blocked_before_task_creation').length,
    dispatch_runner_invocations: 0,
    tasks_created: 0,
    provider_calls: 0,
    writes: 0
  };
}

function watchKey(watch = {}) {
  return `${watch.watch_type}:${Number(watch.watch_id)}`;
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
  buildWatchPacketDryRunDispatchParityPreview
};
