function buildWatchAuthoredExecutionReadinessPreview(db, input = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const watches = systemRadiusWatchReadiness(db);
  const after = stateSnapshot(db);

  return {
    action: 'watch.authored_execution_readiness.preview',
    classification: 'read-only authored Watch execution readiness preview',
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
    watch_result_items_created: false,
    relationship_tags_written: 0,
    accepted_model: {
      stored_included_system_ids_role: 'accepted_watch_scope_authority',
      execution_scope_source: 'stored_included_system_ids',
      center_radius_role: 'provenance_and_management',
      would_recompute_from_center_radius: false,
      invalid_scope_blocks_before_provider: true,
      direct_manual_system_radius_path: 'center_radius_planner_remains_separate'
    },
    future_consumer: {
      command_path: [
        'watch.executor.tick',
        'watchExecutor.dispatchFor',
        'system.radius.watch',
        'systemRadiusCollector.collectSystemRadiusWatch',
        'systemRadiusPlanner.planSystemRadiusWatch'
      ],
      consumes_readiness_result_now: false,
      future_execution_input_field: 'acceptedSystemIds',
      future_scope_source_field: 'acceptedScopeSource: stored_watch_scope',
      readiness_is_authorization: false
    },
    summary: summarize(watches),
    system_radius_watches: watches,
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
    },
    boundary: [
      'Read-only authored Watch execution readiness preview only; it does not dispatch Watch execution, arm the executor, create tasks, or call providers.',
      'Execution input for accepted system/radius Watches is derived from stored included_system_ids only.',
      'Center system and radius are provenance/management fields after acceptance, not execution authority.',
      'Missing, empty, malformed, invalid, or inactive Watch rows are blocked before provider movement.',
      'No Discovery refs, Evidence/EVEidence, Hydration, schema, UI, support artifact, enforcement, Watch result, relationship tag, or fourth-lane behavior is opened.'
    ]
  };
}

function systemRadiusWatchReadiness(db) {
  const rows = db.prepare(`
    SELECT watch_id, center_system_id, center_system_name, radius_jumps,
           included_system_ids, excluded_system_ids,
           lookback_hours, max_systems_per_run, max_killmails_per_run,
           is_active, poll_interval_minutes, last_polled_at, next_poll_at,
           last_success_at, last_error_at, backoff_until, notes
    FROM system_watches
    ORDER BY watch_id
  `).all();

  return rows.map(readinessForRow);
}

function readinessForRow(row) {
  const included = parseStoredSystemIdArray(row.included_system_ids);
  const excluded = parseStoredSystemIdArray(row.excluded_system_ids);
  const reasons = blockedReasons(row, included);
  const ready = reasons.length === 0;
  const validStoredScope = included.status === 'valid';
  const invalidScopeDiagnosticIds = included.status === 'invalid' ? included.values : [];

  return {
    watch_id: row.watch_id,
    watch_type: 'system_radius',
    execution_ready_from_stored_scope: ready,
    execution_scope_source: 'stored_included_system_ids',
    execution_system_ids: validStoredScope ? included.values : [],
    execution_system_count: validStoredScope ? included.values.length : 0,
    stored_scope_status: included.status,
    blocked_reasons: reasons,
    ready_status: ready ? 'ready_for_future_execution_input' : 'blocked_before_provider_movement',
    center_radius_role: 'provenance_and_management',
    center_system_id: row.center_system_id,
    center_system_name: row.center_system_name,
    radius_jumps: row.radius_jumps,
    center_radius_used_as_execution_authority: false,
    would_recompute_from_center_radius: false,
    would_use_stored_scope_rather_than_recomputed_topology: validStoredScope,
    would_dispatch_watch: false,
    watch_dispatches: 0,
    tasks_created: 0,
    provider_calls: 0,
    discovery_refs_mutated: 0,
    evidence_rows_written: 0,
    hydration_writes: 0,
    future_execution_payload: ready
      ? {
          command: 'system.radius.watch',
          acceptedSystemIds: included.values,
          acceptedScopeSource: 'stored_watch_scope',
          acceptedScopeProvenance: {
            watchId: row.watch_id,
            centerSystemId: row.center_system_id,
            radiusJumps: row.radius_jumps,
            includedSystemScopeStatus: included.status,
            excludedSystemScopeStatus: excluded.status,
            excludedSystemIds: excluded.status === 'valid' ? excluded.values : []
          },
          maxSystems: included.values.length,
          lookbackSeconds: Number(row.lookback_hours || 24) * 3600,
          maxExpansions: Number(row.max_killmails_per_run || 1)
        }
      : null,
    authored_settings: {
      is_active: Number(row.is_active) === 1,
      lookback_hours: row.lookback_hours,
      max_systems_per_run: row.max_systems_per_run,
      max_killmails_per_run: row.max_killmails_per_run,
      poll_interval_minutes: row.poll_interval_minutes,
      next_poll_at: row.next_poll_at,
      last_polled_at: row.last_polled_at,
      last_success_at: row.last_success_at,
      last_error_at: row.last_error_at,
      backoff_until: row.backoff_until
    },
    stored_scope: {
      included_system_ids: validStoredScope ? included.values : [],
      included_status: included.status,
      excluded_system_ids: excluded.status === 'valid' ? excluded.values : [],
      excluded_status: excluded.status,
      source_table: 'system_watches',
      accepted_authority: validStoredScope
    },
    invalid_scope_diagnostic: {
      diagnostic_parseable_system_ids: invalidScopeDiagnosticIds,
      operator_actionable: false,
      accepted_authority: false,
      execution_authority: false,
      repairs_stored_row: false
    }
  };
}

function blockedReasons(row, included) {
  const reasons = [];
  if (included.status === 'missing') {
    reasons.push('missing_stored_scope');
  } else if (included.status === 'malformed') {
    reasons.push('malformed_stored_scope');
  } else if (included.status === 'empty') {
    reasons.push('empty_stored_scope');
  } else if (included.status === 'invalid') {
    reasons.push('invalid_stored_scope');
  }
  if (Number(row.is_active) !== 1) {
    reasons.push('inactive_watch');
  }
  return reasons;
}

function parseStoredSystemIdArray(value) {
  if (value === null || value === undefined || value === '') {
    return { status: 'missing', values: [] };
  }
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    return { status: 'malformed', values: [] };
  }
  if (!Array.isArray(parsed)) {
    return { status: 'malformed', values: [] };
  }
  if (parsed.length === 0) {
    return { status: 'empty', values: [] };
  }

  const values = parsed.map(Number);
  const validValues = values.filter((entry) => Number.isInteger(entry) && entry > 0);
  if (validValues.length !== parsed.length) {
    return { status: 'invalid', values: validValues };
  }
  if (new Set(validValues).size !== validValues.length) {
    return { status: 'invalid', values: validValues };
  }
  return { status: 'valid', values: validValues };
}

function summarize(watches) {
  const blocked = watches.filter((watch) => watch.execution_ready_from_stored_scope !== true);
  return {
    status: blocked.length ? 'blocked_rows_present' : 'all_authored_system_radius_watches_ready',
    system_radius_watch_count: watches.length,
    ready_watch_count: watches.filter((watch) => watch.execution_ready_from_stored_scope === true).length,
    blocked_watch_count: blocked.length,
    valid_stored_scope_count: watches.filter((watch) => watch.stored_scope_status === 'valid').length,
    missing_stored_scope_count: watches.filter((watch) => watch.blocked_reasons.includes('missing_stored_scope')).length,
    malformed_stored_scope_count: watches.filter((watch) => watch.blocked_reasons.includes('malformed_stored_scope')).length,
    empty_stored_scope_count: watches.filter((watch) => watch.blocked_reasons.includes('empty_stored_scope')).length,
    invalid_stored_scope_count: watches.filter((watch) => watch.blocked_reasons.includes('invalid_stored_scope')).length,
    inactive_watch_count: watches.filter((watch) => watch.blocked_reasons.includes('inactive_watch')).length,
    execution_scope_source: 'stored_included_system_ids',
    would_recompute_from_center_radius: false,
    would_dispatch_watch: false,
    watch_dispatches: 0,
    tasks_created: 0,
    provider_calls: 0,
    invalid_scope_blocks_before_provider: true,
    next_safe_action: 'operator_review_readiness_then_open_separate_execution_or_renderer_confirmation_runway'
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
  buildWatchAuthoredExecutionReadinessPreview
};
