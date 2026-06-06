const { TASK_CLASSIFICATIONS } = require('./taskRunner');
const { buildWatchPacketDryRunDispatchParityPreview } = require('./watchPacketDryRunDispatchParityService');

const ACTION = 'watch.task_creation_boundary.preview';

function buildWatchTaskCreationBoundaryPreview(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const parity = buildWatchPacketDryRunDispatchParityPreview(db, {
    ...input,
    now
  }, context);
  const selectedRow = (parity.parity_rows || []).find((row) => row.selected_by_dry_run === true) || null;
  const wouldTaskEnvelope = taskEnvelopeFor(selectedRow);
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only Watch task-creation boundary preview',
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
    task_runner_untouched: true,
    task_runner_methods_called: [],
    task_runner_methods_forbidden: [
      'TaskRunner.runTask',
      'TaskRunner.runDetachedTask',
      'TaskRunner.prepareTask',
      'TaskRunner.createTask'
    ],
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
    selected_watch: parity.selected_watch || null,
    dry_run_decision: parity.dry_run_decision || null,
    selected_parity: selectedRow,
    would_task_envelope: wouldTaskEnvelope,
    task_envelope_status: taskEnvelopeStatusFor(selectedRow, parity),
    task_envelope_reason: taskEnvelopeReasonFor(selectedRow, parity),
    task_envelope_matches_selected_payload: taskEnvelopeMatchesSelectedPayload(wouldTaskEnvelope, selectedRow),
    task_definition_semantics: {
      type_pattern: 'watch.executor.<dispatch command>',
      classification: TASK_CLASSIFICATIONS.EVIDENCE_CREATING,
      scopeKey_source: 'selected_watch.scope_key',
      payload_source: 'selected Watch parity payload',
      plain_data_only: true,
      task_runner_call_required: false
    },
    parity_summary: parity.summary,
    parity_rows: parity.parity_rows,
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
        && parity.table_mutation_proof?.unchanged === true
    },
    source_actions: [
      parity.action,
      'TaskRunner task definition semantics'
    ],
    accepted_model: {
      actor_task_type: 'watch.executor.actor.watch',
      system_radius_task_type: 'watch.executor.system.radius.watch',
      task_classification: TASK_CLASSIFICATIONS.EVIDENCE_CREATING,
      system_radius_scope_source: 'stored_included_system_ids',
      center_radius_role: 'provenance_and_management',
      center_radius_used_as_authority: false,
      invalid_stored_scope_blocks_before_task_shape: true,
      preview_is_task_creation: false,
      preview_is_task_authorization: false,
      preview_is_provider_authorization: false
    },
    boundary: [
      'Read-only/local-only Watch task-creation boundary preview only.',
      'Would-task envelope is plain data and is not passed to TaskRunner.',
      'No TaskRunner task-creation method is called.',
      'Invalid stored scope and non-dispatch states emit no would-task envelope.',
      'This preview is not execution readiness, task authorization, or provider authorization.'
    ],
    does_not_do: [
      'does_not_create_tasks',
      'does_not_call_task_runner_runTask',
      'does_not_call_task_runner_runDetachedTask',
      'does_not_call_task_runner_prepareTask',
      'does_not_call_task_runner_createTask',
      'does_not_call_watch_session_executor_tick',
      'does_not_execute_watch',
      'does_not_arm_or_disarm_watch_runtime',
      'does_not_start_or_stop_intervals',
      'does_not_invoke_dispatch_runners',
      'does_not_call_collectors',
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

function taskEnvelopeFor(selectedRow) {
  if (!selectedRow || selectedRow.comparison_status !== 'matches' || !selectedRow.dispatch_for_command) {
    return null;
  }
  return {
    type: `watch.executor.${selectedRow.dispatch_for_command}`,
    classification: TASK_CLASSIFICATIONS.EVIDENCE_CREATING,
    scopeKey: selectedRow.scope_key,
    source_watch: {
      watch_type: selectedRow.watch_type,
      watch_id: selectedRow.watch_id,
      scope_key: selectedRow.scope_key
    },
    selected_command: selectedRow.dispatch_for_command,
    selected_payload_shape: selectedRow.dispatch_for_payload_shape,
    selected_payload_authority: {
      uses_stored_included_system_ids: Array.isArray(selectedRow.dispatch_for_payload_shape?.accepted_system_ids)
        && selectedRow.dispatch_for_payload_shape.accepted_system_ids.length > 0,
      accepted_scope_source: selectedRow.dispatch_for_payload_shape?.accepted_scope_source || null,
      center_radius_role: selectedRow.selected_scope_authority?.center_radius_role || null,
      center_radius_used_as_authority: selectedRow.selected_scope_authority?.center_radius_used_as_authority === true
    },
    plain_data_only: true,
    would_create_task: false,
    task_creation_authorized: false
  };
}

function taskEnvelopeStatusFor(selectedRow, parity) {
  if (selectedRow?.comparison_status === 'matches' && selectedRow.dispatch_for_command) {
    return 'would_task_envelope_available';
  }
  if (selectedRow?.invalid_scope_parity === 'matches_blocked_before_task_creation') {
    return 'blocked_no_task_envelope';
  }
  if (parity.dry_run_decision?.status === 'idle') {
    return 'idle_no_task_envelope';
  }
  if (parity.dry_run_decision?.status === 'blocked') {
    return 'blocked_no_task_envelope';
  }
  return 'skipped_no_task_envelope';
}

function taskEnvelopeReasonFor(selectedRow, parity) {
  if (selectedRow?.comparison_status === 'matches' && selectedRow.dispatch_for_command) {
    return 'selected_watch_payload_parity_matches';
  }
  if (selectedRow?.invalid_scope_parity === 'matches_blocked_before_task_creation') {
    return 'watch_scope_authority_invalid';
  }
  return parity.dry_run_decision?.reason || 'no_selected_watch';
}

function taskEnvelopeMatchesSelectedPayload(envelope, selectedRow) {
  if (!envelope || !selectedRow) {
    return false;
  }
  return envelope.selected_command === selectedRow.dispatch_for_command
    && envelope.scopeKey === selectedRow.scope_key
    && stableJson(envelope.selected_payload_shape) === stableJson(selectedRow.dispatch_for_payload_shape);
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
  buildWatchTaskCreationBoundaryPreview
};
