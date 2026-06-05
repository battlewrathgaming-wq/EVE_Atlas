const { buildSystemRadiusSetupReadout } = require('./systemRadiusSetupReadoutService');
const { buildWatchAuthoredExecutionReadinessPreview } = require('./watchAuthoredExecutionReadinessService');

const ACTION = 'watch.system_radius_readout_readiness_bridge.preview';

function buildSystemRadiusReadoutReadinessBridge(db, input = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const setupReadout = buildSystemRadiusSetupReadout(db, input);
  const readinessPreview = buildWatchAuthoredExecutionReadinessPreview(db, input);
  const rows = bridgeRows(setupReadout, readinessPreview);
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only system/radius Watch setup/readiness bridge',
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
    source_actions: [
      setupReadout.action,
      readinessPreview.action
    ],
    accepted_model: {
      stored_included_system_ids_role: 'shared_authority',
      setup_readout_role: 'what_atlas_accepted_and_stored',
      execution_readiness_role: 'whether_stored_scope_is_usable_as_future_execution_input',
      bridge_role: 'conformance_proof_only',
      center_radius_role: 'provenance_and_management',
      center_radius_used_as_authority: false,
      would_recompute_from_center_radius: false
    },
    summary: summarize(rows),
    bridge_rows: rows,
    source_summaries: {
      setup_readout: setupReadout.summary,
      authored_execution_readiness: readinessPreview.summary
    },
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
        && setupReadout.table_mutation_proof?.unchanged === true
        && readinessPreview.table_mutation_proof?.unchanged === true
    },
    does_not_do: [
      'does_not_execute_watch',
      'does_not_arm_or_disarm_watch_runtime',
      'does_not_create_watch_executor_tasks',
      'does_not_call_providers',
      'does_not_perform_live_api_calls',
      'does_not_mutate_discovery_refs',
      'does_not_write_evidence_or_eveidence',
      'does_not_write_hydration_or_metadata_labels',
      'does_not_change_watch_create',
      'does_not_change_topology_traversal',
      'does_not_infer_execution_authority_from_center_radius',
      'does_not_change_schema',
      'does_not_create_support_artifacts',
      'does_not_activate_runtime_enforcement_or_command_blocking',
      'does_not_create_watch_results_or_relationship_tags'
    ],
    boundary: [
      'Read-only/local-only bridge preview only; it composes setup readout and authored execution readiness.',
      'Stored included_system_ids are the shared authority across both views.',
      'Setup readout says what Atlas accepted and stored; readiness says whether that stored scope is usable as future execution input.',
      'Mismatches are reported, not fixed.',
      'The bridge does not execute Watch work, arm/disarm runtime, create tasks, call providers, write Evidence/EVEidence, write Hydration output, or infer authority from center/radius.'
    ]
  };
}

function bridgeRows(setupReadout, readinessPreview) {
  const setupByWatch = new Map((setupReadout.system_radius_watch_setups || []).map((row) => [Number(row.watch_id), row]));
  const readinessByWatch = new Map((readinessPreview.system_radius_watches || []).map((row) => [Number(row.watch_id), row]));
  const watchIds = [...new Set([...setupByWatch.keys(), ...readinessByWatch.keys()])].sort((a, b) => a - b);
  return watchIds.map((watchId) => bridgeRow(watchId, setupByWatch.get(watchId), readinessByWatch.get(watchId)));
}

function bridgeRow(watchId, setup, readiness) {
  const matched = [];
  const mismatches = [];
  const mapped = [];
  compareField(matched, mismatches, 'watch_id', setup?.watch_id, readiness?.watch_id);
  compareField(matched, mismatches, 'active_state', setup?.is_active, readiness?.authored_settings?.is_active);
  compareField(matched, mismatches, 'stored_scope_status', setup?.stored_scope_status, readiness?.stored_scope_status);
  compareArrayField(
    matched,
    mismatches,
    'stored_included_system_ids',
    setup?.accepted_scope_authority?.included_system_ids,
    readiness?.stored_scope?.included_system_ids
  );
  compareField(
    matched,
    mismatches,
    'included_system_count',
    setup?.included_system_count,
    readiness?.execution_system_count
  );
  compareField(matched, mismatches, 'center_system_id', setup?.center_system?.solar_system_id, readiness?.center_system_id);
  compareField(matched, mismatches, 'radius_jumps', setup?.radius?.radius_jumps, readiness?.radius_jumps);
  compareField(matched, mismatches, 'center_radius_role', setup?.center_system?.role, readiness?.center_radius_role);
  compareField(
    matched,
    mismatches,
    'center_radius_used_as_authority',
    setup?.accepted_scope_authority?.center_radius_used_as_authority,
    readiness?.center_radius_used_as_execution_authority
  );
  compareField(
    matched,
    mismatches,
    'would_recompute_from_center_radius',
    setup?.would_recompute_from_center_radius,
    readiness?.would_recompute_from_center_radius
  );
  compareField(
    matched,
    mismatches,
    'future_execution_input_ready',
    setup?.ready_for_future_execution_input_from_stored_scope,
    readiness?.execution_ready_from_stored_scope
  );
  compareArrayField(matched, mismatches, 'blocked_reasons', setup?.blocked_reasons, readiness?.blocked_reasons);
  mapEquivalentField(
    matched,
    mismatches,
    mapped,
    'next_safe_action',
    setup?.next_safe_action,
    readinessNextSafeAction(readiness)
  );

  return {
    watch_id: watchId,
    conformance_status: setup && readiness && mismatches.length === 0 ? 'matched' : 'mismatch',
    setup_readout_present: Boolean(setup),
    readiness_preview_present: Boolean(readiness),
    state: {
      setup: setup?.state || null,
      readiness_active: readiness?.authored_settings?.is_active ?? null
    },
    stored_scope_status: {
      setup: setup?.stored_scope_status || null,
      readiness: readiness?.stored_scope_status || null
    },
    stored_included_system_ids: {
      setup: setup?.accepted_scope_authority?.included_system_ids || [],
      readiness: readiness?.stored_scope?.included_system_ids || []
    },
    included_system_count: {
      setup: setup?.included_system_count ?? null,
      readiness: readiness?.execution_system_count ?? null
    },
    center_radius_role: {
      setup: setup?.center_system?.role || null,
      readiness: readiness?.center_radius_role || null
    },
    center_radius_used_as_authority: {
      setup: setup?.accepted_scope_authority?.center_radius_used_as_authority ?? null,
      readiness: readiness?.center_radius_used_as_execution_authority ?? null
    },
    readiness_for_future_execution_input: {
      setup: setup?.ready_for_future_execution_input_from_stored_scope ?? null,
      readiness: readiness?.execution_ready_from_stored_scope ?? null
    },
    blocked_reasons: {
      setup: setup?.blocked_reasons || [],
      readiness: readiness?.blocked_reasons || []
    },
    next_safe_action: {
      setup: setup?.next_safe_action || null,
      readiness: readinessNextSafeAction(readiness),
      mapping_disclosed: mapped.some((entry) => entry.field === 'next_safe_action')
    },
    matched_fields: matched,
    mismatch_fields: mismatches,
    equivalent_mappings: mapped,
    mismatch_handling: mismatches.length
      ? 'reported_only_no_fix_or_mutation'
      : 'no_mismatch',
    would_dispatch_watch: false,
    provider_calls: 0,
    tasks_created: 0
  };
}

function readinessNextSafeAction(readiness) {
  if (!readiness) {
    return null;
  }
  if (readiness.execution_ready_from_stored_scope === true) {
    return 'operator_review_readiness_then_open_separate_execution_or_renderer_confirmation_runway';
  }
  return 'operator_review_readiness_then_open_separate_execution_or_renderer_confirmation_runway';
}

function compareField(matched, mismatches, field, setupValue, readinessValue) {
  if (sameValue(setupValue, readinessValue)) {
    matched.push(field);
    return;
  }
  mismatches.push({
    field,
    setup_value: setupValue ?? null,
    readiness_value: readinessValue ?? null,
    handling: 'reported_only_no_fix_or_mutation'
  });
}

function compareArrayField(matched, mismatches, field, setupValue, readinessValue) {
  compareField(matched, mismatches, field, normalizeArray(setupValue), normalizeArray(readinessValue));
}

function mapEquivalentField(matched, mismatches, mapped, field, setupValue, readinessValue) {
  if (sameValue(setupValue, readinessValue)) {
    matched.push(field);
    return;
  }
  if (setupValue && readinessValue) {
    matched.push(field);
    mapped.push({
      field,
      setup_value: setupValue,
      readiness_value: readinessValue,
      mapping: 'equivalent_safe_review_action_different_wording'
    });
    return;
  }
  mismatches.push({
    field,
    setup_value: setupValue ?? null,
    readiness_value: readinessValue ?? null,
    handling: 'reported_only_no_fix_or_mutation'
  });
}

function summarize(rows) {
  const mismatched = rows.filter((row) => row.conformance_status !== 'matched');
  return {
    status: mismatched.length ? 'mismatches_present' : 'all_setup_readout_and_readiness_rows_match',
    bridge_row_count: rows.length,
    matched_row_count: rows.length - mismatched.length,
    mismatched_row_count: mismatched.length,
    valid_ready_match_count: rows.filter((row) => (
      row.conformance_status === 'matched'
      && row.stored_scope_status.setup === 'valid'
      && row.readiness_for_future_execution_input.setup === true
    )).length,
    valid_inactive_match_count: rows.filter((row) => (
      row.conformance_status === 'matched'
      && row.stored_scope_status.setup === 'valid'
      && row.readiness_for_future_execution_input.setup === false
      && row.blocked_reasons.setup.includes('inactive_watch')
    )).length,
    blocked_match_count: rows.filter((row) => (
      row.conformance_status === 'matched'
      && row.readiness_for_future_execution_input.setup === false
    )).length,
    rows_with_equivalent_mappings: rows.filter((row) => row.equivalent_mappings.length > 0).length,
    mismatch_watch_ids: mismatched.map((row) => row.watch_id),
    setup_scope_source: 'stored_included_system_ids',
    execution_scope_source: 'stored_included_system_ids',
    center_radius_role: 'provenance_and_management',
    center_radius_used_as_authority: false,
    would_recompute_from_center_radius: false,
    would_dispatch_watch: false,
    provider_calls: 0,
    next_safe_action: mismatched.length
      ? 'operator_review_mismatch_before_any_future_execution_runway'
      : 'operator_review_bridge_then_continue_with_separate_authorized_next_step'
  };
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.map(Number) : [];
}

function sameValue(left, right) {
  return stableJson(left) === stableJson(right);
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
  buildSystemRadiusReadoutReadinessBridge,
  bridgeRows
};
