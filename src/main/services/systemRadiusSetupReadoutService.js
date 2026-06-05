const ACTION = 'watch.system_radius_setup_readout.preview';

function buildSystemRadiusSetupReadout(db, input = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const rows = loadSystemWatchRows(db, input);
  const localNames = loadLocalSystemNames(db, rows);
  const watches = rows.map((row) => setupReadoutForRow(row, localNames));
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only system/radius Watch setup readout',
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
    accepted_model: {
      stored_included_system_ids_role: 'accepted_watch_scope_authority',
      setup_scope_source: 'stored_included_system_ids',
      center_radius_role: 'provenance_and_management',
      readout_role: 'inspection_only',
      would_recompute_from_center_radius: false
    },
    summary: summarize(watches),
    system_radius_watch_setups: watches,
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
    },
    does_not_do: [
      'does_not_execute_watch',
      'does_not_create_watch_executor_tasks',
      'does_not_call_providers',
      'does_not_perform_live_api_calls',
      'does_not_mutate_discovery_refs',
      'does_not_write_evidence_or_eveidence',
      'does_not_write_hydration_or_metadata_labels',
      'does_not_change_watch_create',
      'does_not_change_topology_traversal',
      'does_not_recompute_accepted_scope_from_center_radius',
      'does_not_change_schema',
      'does_not_create_support_artifacts',
      'does_not_activate_runtime_enforcement_or_command_blocking',
      'does_not_create_watch_results_or_relationship_tags'
    ],
    boundary: [
      'Read-only/local-only post-create setup readout; it inspects stored system_watches rows only.',
      'Stored included_system_ids are accepted Watch scope authority.',
      'Center system and radius are provenance/management fields after acceptance.',
      'Included system display names are local readability only and do not replace stored raw IDs.',
      'The readout does not execute Watch work, create tasks, call providers, write Evidence/EVEidence, write Hydration output, or recompute accepted scope from center/radius.'
    ]
  };
}

function loadSystemWatchRows(db, input) {
  const watchId = Number(input.watchId ?? input.watch_id);
  if (Number.isInteger(watchId) && watchId > 0) {
    return db.prepare(`
      SELECT watch_id, center_system_id, center_system_name, radius_jumps,
             included_system_ids, excluded_system_ids,
             lookback_hours, max_systems_per_run, max_killmails_per_run,
             is_active, poll_interval_minutes, last_polled_at, next_poll_at,
             last_success_at, last_error_at, backoff_until, notes
      FROM system_watches
      WHERE watch_id = ?
      ORDER BY watch_id
    `).all(watchId);
  }

  return db.prepare(`
    SELECT watch_id, center_system_id, center_system_name, radius_jumps,
           included_system_ids, excluded_system_ids,
           lookback_hours, max_systems_per_run, max_killmails_per_run,
           is_active, poll_interval_minutes, last_polled_at, next_poll_at,
           last_success_at, last_error_at, backoff_until, notes
    FROM system_watches
    ORDER BY watch_id
  `).all();
}

function loadLocalSystemNames(db, rows) {
  const ids = new Set();
  for (const row of rows) {
    const included = parseStoredSystemIdArray(row.included_system_ids);
    if (Number.isInteger(Number(row.center_system_id))) {
      ids.add(Number(row.center_system_id));
    }
    for (const id of included.values) {
      ids.add(id);
    }
  }
  if (!ids.size) {
    return new Map();
  }
  const orderedIds = [...ids].sort((a, b) => a - b);
  const placeholders = orderedIds.map(() => '?').join(', ');
  const systems = db.prepare(`
    SELECT solar_system_id, solar_system_name
    FROM solar_systems
    WHERE solar_system_id IN (${placeholders})
  `).all(...orderedIds);
  return new Map(systems.map((system) => [Number(system.solar_system_id), system.solar_system_name]));
}

function setupReadoutForRow(row, localNames) {
  const included = parseStoredSystemIdArray(row.included_system_ids);
  const excluded = parseStoredSystemIdArray(row.excluded_system_ids);
  const validStoredScope = included.status === 'valid';
  const invalidScopeDiagnosticIds = included.status === 'invalid' ? included.values : [];
  const active = Number(row.is_active) === 1;
  const readyForFutureExecutionInput = active && validStoredScope;
  const includedSystems = validStoredScope
    ? included.values.map((systemId, index) => ({
        solar_system_id: systemId,
        display_name: localNames.get(systemId) || null,
        local_name_status: localNames.has(systemId) ? 'known_local' : 'missing_local_name',
        accepted_scope_position: index,
        accepted_scope_authority: true
      }))
    : [];

  return {
    watch_id: row.watch_id,
    watch_type: 'system_radius',
    state: active ? 'active' : 'inactive',
    is_active: active,
    center_system: {
      solar_system_id: row.center_system_id,
      stored_name: row.center_system_name,
      local_display_name: localNames.get(Number(row.center_system_id)) || row.center_system_name || null,
      role: 'provenance_and_management'
    },
    radius: {
      radius_jumps: row.radius_jumps,
      role: 'provenance_and_management'
    },
    stored_scope_status: included.status,
    stored_scope_status_detail: storedScopeStatusDetail(included),
    accepted_scope_authority: {
      source: 'system_watches.included_system_ids',
      included_system_ids: validStoredScope ? included.values : [],
      included_system_count: validStoredScope ? included.values.length : 0,
      status: included.status,
      display_names_source: 'local_solar_systems_table_when_available',
      center_radius_used_as_authority: false,
      topology_recomputed_for_readout: false
    },
    invalid_scope_diagnostic: {
      diagnostic_parseable_system_ids: invalidScopeDiagnosticIds,
      operator_actionable: false,
      accepted_authority: false,
      execution_authority: false,
      repairs_stored_row: false
    },
    included_systems: includedSystems,
    included_system_count: validStoredScope ? included.values.length : 0,
    included_system_display_names_available: includedSystems.filter((system) => system.local_name_status === 'known_local').length,
    included_system_display_names_missing: includedSystems.filter((system) => system.local_name_status === 'missing_local_name').length,
    excluded_scope: {
      status: excluded.status,
      excluded_system_ids: excluded.status === 'valid' ? excluded.values : []
    },
    ready_for_future_execution_input_from_stored_scope: readyForFutureExecutionInput,
    ready_status: readyForFutureExecutionInput ? 'ready_from_stored_scope' : 'not_ready_for_future_execution_input',
    blocked_reasons: blockedReasons(active, included),
    next_safe_action: nextSafeAction(active, included),
    would_recompute_from_center_radius: false,
    would_dispatch_watch: false,
    watch_dispatches: 0,
    tasks_created: 0,
    provider_calls: 0,
    evidence_writes: 0,
    hydration_writes: 0,
    authored_settings: {
      lookback_hours: row.lookback_hours,
      max_systems_per_run: row.max_systems_per_run,
      max_killmails_per_run: row.max_killmails_per_run,
      poll_interval_minutes: row.poll_interval_minutes,
      next_poll_at: row.next_poll_at,
      last_polled_at: row.last_polled_at,
      last_success_at: row.last_success_at,
      last_error_at: row.last_error_at,
      backoff_until: row.backoff_until,
      notes: row.notes
    },
    does_not_do: [
      'execute_watch',
      'create_tasks',
      'call_providers',
      'write_evidence',
      'write_hydration',
      'recompute_scope_from_center_radius'
    ]
  };
}

function storedScopeStatusDetail(included) {
  if (included.status === 'valid') {
    return 'stored included_system_ids is a valid accepted scope list';
  }
  if (included.status === 'missing') {
    return 'stored included_system_ids is missing';
  }
  if (included.status === 'malformed') {
    return 'stored included_system_ids cannot be parsed as an array';
  }
  if (included.status === 'empty') {
    return 'stored included_system_ids is an empty accepted scope list';
  }
  return 'stored included_system_ids contains invalid or duplicate system IDs';
}

function blockedReasons(active, included) {
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
  if (!active) {
    reasons.push('inactive_watch');
  }
  return reasons;
}

function nextSafeAction(active, included) {
  if (included.status !== 'valid') {
    return 'operator_review_stored_scope_before_any_future_execution_runway';
  }
  if (!active) {
    return 'operator_may_review_inactive_setup_or_reactivate_in_a_separate_authorized_mutation_path';
  }
  return 'operator_may_review_setup_then_open_separate_execution_readiness_or_watch_runtime_runway';
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
  const ready = watches.filter((watch) => watch.ready_for_future_execution_input_from_stored_scope);
  return {
    status: watches.length === 0
      ? 'no_system_radius_watch_setups'
      : ready.length === watches.length
        ? 'all_system_radius_watch_setups_valid'
        : 'system_radius_watch_setup_review_needed',
    system_radius_watch_count: watches.length,
    active_watch_count: watches.filter((watch) => watch.is_active).length,
    inactive_watch_count: watches.filter((watch) => !watch.is_active).length,
    ready_from_stored_scope_count: ready.length,
    not_ready_count: watches.length - ready.length,
    valid_stored_scope_count: watches.filter((watch) => watch.stored_scope_status === 'valid').length,
    missing_stored_scope_count: watches.filter((watch) => watch.stored_scope_status === 'missing').length,
    malformed_stored_scope_count: watches.filter((watch) => watch.stored_scope_status === 'malformed').length,
    empty_stored_scope_count: watches.filter((watch) => watch.stored_scope_status === 'empty').length,
    invalid_stored_scope_count: watches.filter((watch) => watch.stored_scope_status === 'invalid').length,
    included_system_count_total: watches.reduce((total, watch) => total + watch.included_system_count, 0),
    setup_scope_source: 'stored_included_system_ids',
    center_radius_role: 'provenance_and_management',
    would_recompute_from_center_radius: false,
    would_dispatch_watch: false,
    provider_calls: 0,
    next_safe_action: watches.some((watch) => watch.stored_scope_status !== 'valid')
      ? 'operator_review_stored_scope_before_any_future_execution_runway'
      : 'operator_review_setup_readout_then_continue_with_separate_authorized_next_step'
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
  buildSystemRadiusSetupReadout
};
