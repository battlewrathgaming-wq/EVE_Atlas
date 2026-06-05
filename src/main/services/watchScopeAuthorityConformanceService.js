const { TopologyService } = require('../sde/topologyService');
const { buildWatchScheduleStatus } = require('../watchlist/watchScheduler');
const { buildWatchOfflineReadout } = require('../watchlist/watchOfflineReadout');

function buildWatchScopeAuthorityConformancePreview(db, input = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const topology = topologyPosture(db);
  const schedule = buildWatchScheduleStatus(db, {
    now,
    sessionArmed: false,
    liveApiEnabled: false
  });
  const offlineReadout = buildWatchOfflineReadout(db, {
    now,
    executorStatus: {
      session_armed: false,
      active_task_id: null
    },
    liveApiEnabled: false,
    schedule
  });
  const watches = systemWatchConformance(db, schedule, offlineReadout);
  const seams = correctionSeams();
  const after = stateSnapshot(db);

  return {
    action: 'watch.scope_authority_conformance.preview',
    classification: 'read-only Watch scope authority conformance preview',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    renderer_eligible: true,
    provider_calls: 0,
    live_api_calls: 0,
    watch_dispatches: 0,
    watch_execution_armed: false,
    tasks_created: 0,
    queue_dispatches: 0,
    evidence_writes: 0,
    discovery_ref_mutations: 0,
    watch_mutations: 0,
    hydration_writes: 0,
    metadata_writes: 0,
    api_request_log_writes: 0,
    schema_changes: 0,
    watch_result_created: false,
    watch_result_items_created: false,
    relationship_tags_written: 0,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    accepted_model: {
      authority_chain: [
        'local topology lookup tables',
        'authoring/preflight center + radius resolution',
        'operator-accepted included system ID set',
        'stored Watch scope',
        'Watch execution uses stored included system IDs'
      ],
      sde_source_material_role: 'import/source_provenance_only',
      runtime_geometry_substrate: 'local_topology_lookup_tables',
      stored_included_system_ids_role: 'accepted_watch_scope_authority',
      center_radius_role_after_acceptance: 'provenance_and_explanation',
      recomputed_topology_role_after_acceptance: 'diagnostic_comparison_only',
      discovery_refs_role: 'possible_leads_not_evidence',
      evidence_eveidence_role: 'ESI-expanded killmail records only'
    },
    topology_lookup_posture: topology,
    source_path_conformance: sourcePathConformance(),
    summary: summarize(watches, seams),
    system_radius_watches: watches,
    correction_seams: seams,
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
    },
    boundary: [
      'Read-only Watch scope authority conformance preview only; it does not dispatch Watch execution, arm the executor, create tasks, call providers, or write rows.',
      'SDE source material is import/source provenance only; runtime geometry support is local topology lookup tables.',
      'Stored included system IDs are the accepted Watch scope authority under the accepted model.',
      'Center system and radius remain provenance/explanation after acceptance.',
      'Recomputed topology is diagnostic comparison only under the accepted model.',
      'Discovery refs remain possible leads, not Evidence/EVEidence.',
      'Evidence/EVEidence remains ESI-expanded killmail records only.'
    ]
  };
}

function sourcePathConformance() {
  return [
    {
      path: 'watchlistRepository.addSystemRadiusWatch',
      role: 'authoring_preflight_geometry',
      source_file: 'src/main/watchlist/watchlistRepository.js',
      current_behavior: 'uses TopologyService over local topology lookup tables to form included_system_ids during Watch authoring/update',
      accepted_model_status: 'conforms',
      correction_needed: false
    },
    {
      path: 'watchScheduler.buildWatchScheduleStatus',
      role: 'schedule_readout_posture',
      source_file: 'src/main/watchlist/watchScheduler.js',
      current_behavior: 'reads and parses system_watches.included_system_ids and excluded_system_ids into schedule source posture',
      accepted_model_status: 'conforms',
      correction_needed: false
    },
    {
      path: 'watchOfflineReadout.buildWatchOfflineReadout',
      role: 'offline_readout_local_context',
      source_file: 'src/main/watchlist/watchOfflineReadout.js',
      current_behavior: 'uses valid stored included_system_ids for local queue/evidence readout context; falls back to center when scope is missing or malformed',
      accepted_model_status: 'partial',
      correction_needed: false,
      note: 'fallback is acceptable as diagnostic/readout posture, not execution authority'
    },
    {
      path: 'watchExecutor.dispatchFor',
      role: 'watch_execution_dispatch_payload',
      source_file: 'src/main/watchlist/watchExecutor.js',
      current_behavior: 'passes accepted stored included_system_ids as acceptedSystemIds for system/radius Watch execution and blocks missing/malformed stored scope before task creation',
      accepted_model_status: 'conforms',
      correction_needed: false
    },
    {
      path: 'systemRadiusCollector.collectSystemRadiusWatch',
      role: 'system_radius_collection_planning',
      source_file: 'src/main/workers/systemRadiusCollector.js',
      current_behavior: 'uses planner scopeAuthority; supplied acceptedSystemIds are carried as stored Watch scope authority and direct/manual calls without accepted IDs retain center/radius planner behavior',
      accepted_model_status: 'conforms',
      correction_needed: false
    },
    {
      path: 'systemRadiusPlanner.planSystemRadiusWatch',
      role: 'diagnostic_or_authoring_geometry',
      source_file: 'src/main/workers/systemRadiusPlanner.js',
      current_behavior: 'uses acceptedSystemIds as stored Watch execution authority when supplied; otherwise preserves center/radius planning for direct/manual system.radius.watch behavior',
      accepted_model_status: 'conforms',
      correction_needed: false
    },
    {
      path: 'discovered_killmail_refs system_radius identity',
      role: 'discovery_ref_identity',
      source_file: 'src/main/workers/systemRadiusCollector.js',
      current_behavior: 'uses discovered_by_type=system_radius and discovered_by_id=centerSystemId',
      accepted_model_status: 'not_applicable',
      correction_needed: false,
      note: 'Discovery ref identity is separate from Watch scope authority; it remains center-only and possible-lead provenance.'
    }
  ];
}

function summarize(watches, seams) {
  const statusCounts = {};
  for (const entry of [...watches, ...seams]) {
    const status = entry.accepted_model_status || entry.conformance_status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  }
  const executionGap = seams.some((entry) => entry.role.includes('execution') && entry.accepted_model_status === 'gap') ||
    seams.some((entry) => entry.role.includes('collection') && entry.accepted_model_status === 'gap');
  return {
    status: executionGap ? 'gap' : 'conforms',
    system_radius_watch_count: watches.length,
    valid_stored_scope_count: watches.filter((watch) => watch.stored_scope.included_status === 'valid').length,
    missing_stored_scope_count: watches.filter((watch) => watch.stored_scope.included_status === 'not_stored').length,
    malformed_stored_scope_count: watches.filter((watch) => watch.stored_scope.included_status === 'malformed').length,
    stored_vs_recomputed_mismatch_count: watches.filter((watch) => watch.diagnostic_recomputed_scope.scope_match === false).length,
    execution_uses_stored_included_ids_now: true,
    execution_recomputes_from_center_radius_now: false,
    invalid_stored_scope_blocks_before_provider: true,
    direct_manual_system_radius_preserves_center_radius_planner: true,
    accepted_model_conformance: executionGap ? 'gap' : 'conforms',
    exact_correction_seam: executionGap ? 'watchExecutor.dispatchFor / systemRadiusCollector.collectSystemRadiusWatch / systemRadiusPlanner.planSystemRadiusWatch' : null,
    status_counts: statusCounts
  };
}

function topologyPosture(db) {
  const systems = count(db, 'solar_systems');
  const adjacency = count(db, 'system_adjacency');
  return {
    runtime_lookup_authority: 'local_topology_lookup_tables',
    sde_source_material_role: 'import/source_provenance_only',
    solar_systems: systems,
    system_adjacency: adjacency,
    local_topology_tables_present: systems > 0,
    local_topology_edges_present: adjacency > 0,
    authoring_can_form_radius_scope_when_center_exists: systems > 0,
    notes: [
      'TopologyService reads local solar_systems and system_adjacency tables.',
      'No SDE source zip/source material is read by this preview.',
      'No provider or SDE download call is made.'
    ]
  };
}

function systemWatchConformance(db, schedule, offlineReadout) {
  const rows = db.prepare(`
    SELECT watch_id, center_system_id, center_system_name, radius_jumps,
           included_system_ids, excluded_system_ids,
           lookback_hours, max_systems_per_run, max_killmails_per_run,
           is_active, poll_interval_minutes, last_polled_at, next_poll_at,
           last_success_at, last_error_at, backoff_until, notes
    FROM system_watches
    ORDER BY watch_id
  `).all();
  return rows.map((row) => systemWatchRowConformance(db, row, schedule, offlineReadout));
}

function systemWatchRowConformance(db, row, schedule, offlineReadout) {
  const included = parseStoredArray(row.included_system_ids);
  const excluded = parseStoredArray(row.excluded_system_ids);
  const recomputed = recomputedScope(db, row);
  const scheduleWatch = (schedule.watches || []).find((watch) => watch.watch_type === 'system_radius' && watch.watch_id === row.watch_id);
  const offlineWatch = (offlineReadout.watches || []).find((watch) => watch.watch_type === 'system_radius' && watch.watch_id === row.watch_id);
  const includedStatus = included.status === 'valid' && included.values.length === 0 ? 'not_stored' : included.status;
  const storedAuthorityValid = includedStatus === 'valid';
  const scopeMatch = storedAuthorityValid && recomputed.status === 'computed'
    ? sameNumberSet(included.values, recomputed.system_ids)
    : null;

  return {
    watch_id: row.watch_id,
    center_system_id: row.center_system_id,
    radius_jumps: row.radius_jumps,
    accepted_model_status: storedAuthorityValid ? 'partial' : includedStatus,
    stored_scope: {
      included_system_ids: included.values,
      included_status: includedStatus,
      excluded_system_ids: excluded.values,
      excluded_status: excluded.status,
      accepted_authority: storedAuthorityValid,
      source_table: 'system_watches',
      center_radius_role_after_acceptance: 'provenance_and_explanation'
    },
    schedule_readout_scope: {
      reads_stored_included_excluded: Boolean(scheduleWatch),
      included_system_ids: scheduleWatch?.source?.included_system_ids || [],
      excluded_system_ids: scheduleWatch?.source?.excluded_system_ids || [],
      included_status: scheduleWatch?.source?.included_system_scope_status || null,
      excluded_status: scheduleWatch?.source?.excluded_system_scope_status || null,
      conformance_status: scheduleWatch ? 'conforms' : 'not_applicable'
    },
    offline_readout_scope: {
      local_context_basis: offlineWatch?.local_context?.basis || null,
      reconstructed_scope: offlineWatch?.recovery?.reconstructed_scope || null,
      conformance_status: offlineWatch?.recovery?.reconstructed_scope?.scope_status === 'valid' ? 'conforms' : 'partial'
    },
    diagnostic_recomputed_scope: {
      ...recomputed,
      diagnostic_only_under_accepted_model: true,
      scope_match: scopeMatch
    },
    execution_scope_authority_now: executionScopeAuthorityForStoredScope(includedStatus, included.values),
    discovery_ref_identity: {
      discovered_by_type: 'system_radius',
      discovered_by_id: String(row.center_system_id),
      identity_level: 'center_only',
      separate_from_watch_scope_authority: true,
      possible_leads_not_evidence: true
    }
  };
}

function recomputedScope(db, row) {
  try {
    const topology = new TopologyService(db);
    const systemIds = topology.getSystemsWithinRadius(row.center_system_id, row.radius_jumps, {
      maxSystems: Number(row.max_systems_per_run || 100)
    });
    return {
      status: 'computed',
      source: 'TopologyService.getSystemsWithinRadius(center,radius)',
      system_ids: systemIds
    };
  } catch (error) {
    return {
      status: 'not_computable',
      source: 'TopologyService.getSystemsWithinRadius(center,radius)',
      system_ids: [],
      error: error.message
    };
  }
}

function executionScopeAuthorityForStoredScope(includedStatus, includedValues = []) {
  const validStoredScope = includedStatus === 'valid' && includedValues.length > 0;
  return {
    uses_stored_included_system_ids: validStoredScope,
    accepted_system_ids: validStoredScope ? includedValues : [],
    uses_stored_excluded_system_ids_from_watch_row: false,
    recomputes_from_center_radius: false,
    center_radius_used_as_execution_payload: false,
    center_radius_preserved_as_provenance: true,
    invalid_scope_blocks_before_provider: !validStoredScope,
    accepted_model_status: 'conforms',
    behavior: validStoredScope
      ? 'system/radius Watch execution uses stored included_system_ids as authority'
      : 'system/radius Watch execution blocks missing/malformed stored included_system_ids before provider work'
  };
}

function correctionSeams() {
  return sourcePathConformance().filter((entry) => entry.correction_needed === true);
}

function parseStoredArray(value) {
  if (!value) {
    return { status: 'not_stored', values: [] };
  }
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return { status: 'malformed', values: [] };
    }
    return { status: 'valid', values: parsed.map(Number).filter(Number.isFinite) };
  } catch {
    return { status: 'malformed', values: [] };
  }
}

function sameNumberSet(left = [], right = []) {
  const a = [...new Set(left.map(Number).filter(Number.isFinite))].sort((x, y) => x - y);
  const b = [...new Set(right.map(Number).filter(Number.isFinite))].sort((x, y) => x - y);
  return stableJson(a) === stableJson(b);
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
  buildWatchScopeAuthorityConformancePreview
};
