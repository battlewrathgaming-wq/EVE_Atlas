const { TopologyService } = require('../sde/topologyService');
const { buildWatchScheduleStatus } = require('../watchlist/watchScheduler');
const { defaultTaskRunner } = require('./taskRunner');
const { defaultWatchSessionExecutor } = require('../watchlist/watchExecutor');

function buildWatchTaskOutcomeMapPreview(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const now = input.now || context.now || new Date().toISOString();
  const executor = context.watchExecutor || context.runtimeWatchExecutor || defaultWatchSessionExecutor;
  const taskRunner = context.taskRunner || executor?.taskRunner || defaultTaskRunner;
  const executorSnapshot = volatileExecutorSnapshot(executor);
  const taskSnapshot = volatileTaskSnapshot(taskRunner);
  const schedule = buildWatchScheduleStatus(db, {
    now,
    sessionArmed: executorSnapshot.session_armed === true,
    liveApiEnabled: input.liveApiEnabled ?? input.live_api_enabled ?? false
  });
  const origins = originSections(db, schedule, { executorSnapshot, taskSnapshot });
  const systemRadius = systemRadiusScopeComparison(db, schedule);
  const after = stateSnapshot(db);

  return {
    action: 'runtime.watch_task_outcome_map.preview',
    classification: 'read-only Watch/task origin and durable outcome map preview',
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
    persisted_work_created: false,
    bucket_persistence: false,
    dispatcher_created: false,
    worker_created: false,
    lease_persistence: false,
    retry_persistence: false,
    schema_changes: 0,
    watch_result_created: false,
    watch_result_items_created: false,
    relationship_tags_written: 0,
    evidence_writes: 0,
    discovery_ref_mutations: 0,
    watch_mutations: 0,
    assessment_memory_mutations: 0,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    volatile_runtime_state: {
      task_state_is_volatile: true,
      executor_state_is_volatile: true,
      task_runner: taskSnapshot,
      watch_executor: executorSnapshot,
      warning: 'TaskRunner and WatchSessionExecutor state is current-session memory; fetch_runs and local rows are durable provenance/outcome evidence.'
    },
    durable_state_summary: durableStateSummary(db),
    origin_outcome_sections: origins,
    watch_schedule_posture: {
      source_command: 'watch.schedule',
      state_is: 'derived_readout',
      mutates_state: false,
      now: schedule.now,
      due_count: schedule.due.length,
      blocked_count: schedule.blocked.length,
      watches: schedule.watches.map(compactScheduleWatch)
    },
    system_radius_scope: systemRadius,
    queue_identity: {
      actor_watch: {
        discovered_by_type: 'actor',
        identity_shape: 'actor_entity_id',
        watch_capable_identity: true
      },
      system_radius: {
        discovered_by_type: 'system_radius',
        current_discovered_by_id: 'center_system_id',
        current_identity_level: 'center_only',
        center_plus_radius_watch_capable_now: false,
        radius_or_watch_id_in_discovery_ref_identity: false,
        risk: 'multiple radius Watches sharing one center can be ambiguous for future outcome-map semantics',
        decision_needed: 'center_only_or_center_plus_radius_watch_identity_before_durable_result_semantics'
      }
    },
    no_durable_result_artifacts: {
      watch_result_exists: tableExists(db, 'watch_result'),
      watch_results_exists: tableExists(db, 'watch_results'),
      watch_result_items_exists: tableExists(db, 'watch_result_items'),
      relationship_tag_column_exists: activityEventColumnExists(db, 'relationship_tag'),
      relationship_truth_exists: false,
      statement: 'No durable watch_result, watch_result_items, relationship tag, or relationship truth artifact exists in current Atlas source/schema.'
    },
    boundary_model: {
      evidence_records_what_happened: true,
      provenance_records_how_atlas_got_it: true,
      watch_task_result_readouts_group_scope_run_outputs: true,
      observation_interprets_local_records: true,
      assessment_remains_human_judgment: true,
      discovery_refs_are_possible_leads_not_evidence: true,
      manual_expansion_outputs_evidence: true
    },
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
    },
    boundary: [
      'Read-only Watch/task outcome map preview only; it does not dispatch Watch execution, arm the executor, create tasks, or call providers.',
      'Task state is volatile runtime memory; fetch_runs and local rows are durable provenance/outcome evidence.',
      'Manual Discovery maps to Discovery refs as possible leads, not Evidence/EVEidence.',
      'Manual Expansion maps to Evidence/EVEidence and run provenance.',
      'Watch authoring maps to durable Watch intent rows only; schedule/offline state is derived posture only.',
      'No durable watch_result/watch_result_items, relationship tag, relationship truth, schema, UI, enforcement, support artifact, or fourth-lane work is created.'
    ]
  };
}

function originSections(db, schedule, runtime) {
  return [
    manualDiscoverySection(db),
    manualExpansionSection(db),
    watchAuthoringSection(db),
    watchScheduleSection(schedule),
    watchExecutorDispatchSection(db, runtime),
    watchCollectionSection(db, 'actor'),
    watchCollectionSection(db, 'system_radius')
  ];
}

function manualDiscoverySection(db) {
  const latest = latestRun(db, ['manual_discovery']);
  return section({
    originKind: 'Manual Discovery',
    operatorActOrTrigger: 'operator asks Atlas to discover possible leads',
    serviceCommand: 'manual.discovery',
    stateClass: 'durable_provenance_after_execution',
    runtimeTaskPossible: true,
    expectedRows: ['fetch_runs', 'discovered_killmail_refs', 'api_request_logs', 'data_quality_warnings'],
    latestRun: compactRun(latest),
    discoveryRefs: discoveryCounts(db, ['manual_actor', 'manual_system', 'manual_radius'], latest?.run_id),
    evidenceCounts: emptyEvidenceCounts(),
    warnings: warningsForRun(db, latest?.run_id),
    notes: [
      'Manual Discovery writes possible leads / Discovery refs only.',
      'It does not imply ESI Evidence Expansion or local Evidence/EVEidence exists.'
    ]
  });
}

function manualExpansionSection(db) {
  const latest = latestRun(db, ['manual_expand']);
  return section({
    originKind: 'Manual Expansion',
    operatorActOrTrigger: 'operator confirms selected refs for ESI expansion',
    serviceCommand: 'manual.expansion',
    stateClass: 'durable_evidence_outcome_after_execution',
    runtimeTaskPossible: true,
    expectedRows: ['fetch_runs', 'killmails', 'activity_events', 'ingestion_audits', 'data_quality_warnings', 'discovered_killmail_refs status updates'],
    latestRun: compactRun(latest),
    discoveryRefs: discoveryCounts(db, ['manual_actor', 'manual_system', 'manual_radius', 'manual_expand'], latest?.run_id),
    evidenceCounts: evidenceCountsForRun(db, latest?.run_id),
    warnings: warningsForRun(db, latest?.run_id),
    notes: [
      'Manual Expansion creates Evidence/EVEidence only after ESI expansion succeeds.',
      'Queue preview/selection is not durable reservation.'
    ]
  });
}

function watchAuthoringSection(db) {
  return section({
    originKind: 'Watch authoring',
    operatorActOrTrigger: 'operator creates or updates active routine check intent',
    serviceCommand: 'watch.create / watch.update',
    stateClass: 'durable_intent_only',
    runtimeTaskPossible: false,
    expectedRows: ['watchlist_entities', 'system_watches'],
    latestRun: null,
    discoveryRefs: emptyDiscoveryCounts(),
    evidenceCounts: emptyEvidenceCounts(),
    watchRows: {
      actor_watch_rows: count(db, 'watchlist_entities'),
      system_radius_watch_rows: count(db, 'system_watches'),
      active_actor_watches: scalar(db, 'SELECT COUNT(*) AS count FROM watchlist_entities WHERE is_active = 1'),
      active_system_radius_watches: scalar(db, 'SELECT COUNT(*) AS count FROM system_watches WHERE is_active = 1')
    },
    notes: [
      'Watch authoring stores durable intent rows only.',
      'It does not start provider collection by itself.'
    ]
  });
}

function watchScheduleSection(schedule) {
  return section({
    originKind: 'Watch schedule readout',
    operatorActOrTrigger: 'operator/system checks due, blocked, backoff, or not-due posture',
    serviceCommand: 'watch.schedule / watch.offline_readout',
    stateClass: 'derived_readout_only',
    runtimeTaskPossible: false,
    expectedRows: [],
    latestRun: null,
    discoveryRefs: emptyDiscoveryCounts(),
    evidenceCounts: emptyEvidenceCounts(),
    schedule: {
      due_count: schedule.due.length,
      blocked_count: schedule.blocked.length,
      due_scope_keys: schedule.due.map((watch) => watch.scope_key),
      blocked_reasons: [...new Set(schedule.blocked.flatMap((watch) => watch.blocked_reasons || []))]
    },
    notes: [
      'Schedule/offline readouts derive posture from Watch rows and gates.',
      'They do not create work or call providers.'
    ]
  });
}

function watchExecutorDispatchSection(db, { executorSnapshot, taskSnapshot }) {
  const latest = latestRun(db, ['actor', 'system_radius']);
  return section({
    originKind: 'Watch executor dispatch',
    operatorActOrTrigger: 'operator arms session or trusted tick evaluates due Watch',
    serviceCommand: 'watch.executor.arm / watch.executor.tick',
    stateClass: 'volatile_task_movement_plus_durable_collector_outputs_if_dispatched',
    runtimeTaskPossible: true,
    expectedRows: ['fetch_runs', 'discovered_killmail_refs', 'killmails', 'activity_events', 'api_request_logs', 'data_quality_warnings', 'Watch schedule timing updates after collection'],
    latestRun: compactRun(latest),
    discoveryRefs: discoveryCounts(db, ['actor', 'system_radius'], latest?.run_id),
    evidenceCounts: evidenceCountsForRun(db, latest?.run_id),
    warnings: warningsForRun(db, latest?.run_id),
    volatileTaskState: {
      task_state_is_volatile: true,
      executor: executorSnapshot,
      tasks: taskSnapshot.watch_tasks
    },
    notes: [
      'Executor dispatch can create a volatile task only when due Watch movement occurs.',
      'This preview does not arm, tick, dispatch, or create tasks.'
    ]
  });
}

function watchCollectionSection(db, watchType) {
  const latest = latestRun(db, [watchType]);
  const isActor = watchType === 'actor';
  return section({
    originKind: isActor ? 'Actor Watch collection' : 'System/radius Watch collection',
    operatorActOrTrigger: isActor ? 'due actor Watch dispatch or direct trusted actor.watch' : 'due system/radius Watch dispatch or direct trusted system.radius.watch',
    serviceCommand: isActor ? 'actor.watch' : 'system.radius.watch',
    stateClass: 'durable_collection_outcome_after_execution',
    runtimeTaskPossible: true,
    expectedRows: ['fetch_runs', 'discovered_killmail_refs', 'killmails', 'activity_events', 'ingestion_audits', 'api_request_logs', 'data_quality_warnings', 'Watch schedule timing updates'],
    latestRun: compactRun(latest),
    discoveryRefs: discoveryCounts(db, [watchType], latest?.run_id),
    evidenceCounts: evidenceCountsForRun(db, latest?.run_id),
    warnings: warningsForRun(db, latest?.run_id),
    deferralBasis: deferralsForRun(db, latest?.run_id),
    notes: [
      'Watch collection durable truth is local collection provenance plus Discovery/Evidence rows.',
      'No durable watch_result or relationship tag is written by current source.'
    ]
  });
}

function section({
  originKind,
  operatorActOrTrigger,
  serviceCommand,
  stateClass,
  runtimeTaskPossible,
  expectedRows,
  latestRun,
  discoveryRefs,
  evidenceCounts,
  warnings = [],
  deferralBasis = [],
  watchRows = null,
  schedule = null,
  volatileTaskState = null,
  notes = []
}) {
  return {
    origin_kind: originKind,
    operator_act_or_trigger: operatorActOrTrigger,
    service_command: serviceCommand,
    state_classification: stateClass,
    runtime_task_possible: runtimeTaskPossible,
    task_state_volatile: runtimeTaskPossible,
    expected_durable_rows: expectedRows,
    latest_matching_fetch_run: latestRun,
    discovery_ref_counts_by_status: discoveryRefs,
    evidence_eveidence_counts: evidenceCounts,
    warning_error_deferral_basis: {
      warnings,
      deferrals: deferralBasis,
      latest_run_error_summary: latestRun?.error_summary || null
    },
    watch_rows: watchRows,
    schedule_posture: schedule,
    volatile_task_state: volatileTaskState,
    no_watch_result_or_relationship_tag: true,
    notes
  };
}

function systemRadiusScopeComparison(db, schedule) {
  const rows = db.prepare(`
    SELECT watch_id, center_system_id, center_system_name, radius_jumps,
           included_system_ids, excluded_system_ids, max_systems_per_run
    FROM system_watches
    ORDER BY watch_id
  `).all();
  return {
    behavior: 'read_only_scope_comparison',
    executor_dispatch_payload_uses_stored_included_excluded_lists: false,
    collector_planning_recomputes_topology_from_center_radius: true,
    comparison_available: rows.length > 0,
    watches: rows.map((row) => {
      const authoredIncluded = parseJsonArray(row.included_system_ids);
      const authoredExcluded = parseJsonArray(row.excluded_system_ids);
      const planned = currentPlannedScope(db, row);
      const scheduleWatch = (schedule.watches || []).find((watch) => watch.watch_type === 'system_radius' && watch.watch_id === row.watch_id);
      return {
        watch_id: row.watch_id,
        center_system_id: row.center_system_id,
        radius_jumps: row.radius_jumps,
        queue_identity: {
          discovered_by_type: 'system_radius',
          discovered_by_id: String(row.center_system_id),
          identity_level: 'center_only',
          includes_radius: false,
          includes_watch_id: false
        },
        authored_scope: {
          included_system_ids: authoredIncluded.values,
          included_scope_status: authoredIncluded.status,
          excluded_system_ids: authoredExcluded.values,
          excluded_scope_status: authoredExcluded.status,
          source_table: 'system_watches'
        },
        current_collector_planned_scope: planned,
        schedule_scope_status: scheduleWatch?.source?.included_system_scope_status || null,
        scope_match: authoredIncluded.status === 'valid' && planned.status === 'computed'
          ? sameNumberSet(authoredIncluded.values, planned.system_ids)
          : null,
        open_decision: 'stored_snapshot_vs_recomputed_topology_policy_unresolved'
      };
    })
  };
}

function currentPlannedScope(db, row) {
  try {
    const topology = new TopologyService(db);
    const systemIds = topology.getSystemsWithinRadius(row.center_system_id, row.radius_jumps, {
      maxSystems: Number(row.max_systems_per_run || 100)
    });
    return {
      status: 'computed',
      system_ids: systemIds,
      source: 'TopologyService.getSystemsWithinRadius(center,radius)',
      excluded_systems_applied_from_watch_row: false
    };
  } catch (error) {
    return {
      status: 'not_computable',
      system_ids: [],
      source: 'TopologyService.getSystemsWithinRadius(center,radius)',
      error: error.message,
      excluded_systems_applied_from_watch_row: false
    };
  }
}

function durableStateSummary(db) {
  return {
    fetch_runs: count(db, 'fetch_runs'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    ingestion_audits: count(db, 'ingestion_audits'),
    api_request_logs: count(db, 'api_request_logs'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches'),
    assessment_artifacts: count(db, 'assessment_artifacts')
  };
}

function latestRun(db, watchTypes = []) {
  if (!watchTypes.length) {
    return null;
  }
  const placeholders = watchTypes.map(() => '?').join(', ');
  return db.prepare(`
    SELECT *
    FROM fetch_runs
    WHERE watch_type IN (${placeholders})
    ORDER BY COALESCE(finished_at, started_at) DESC, started_at DESC
    LIMIT 1
  `).get(...watchTypes) || null;
}

function compactRun(run) {
  if (!run) {
    return null;
  }
  return {
    run_id: run.run_id,
    trigger: run.trigger,
    watch_type: run.watch_type,
    watch_id: run.watch_id,
    started_at: run.started_at,
    finished_at: run.finished_at,
    status: run.status,
    discovered_refs: run.discovered_refs,
    already_cached: run.already_cached,
    expanded_new: run.expanded_new,
    failed_expansions: run.failed_expansions,
    activity_events_written: run.activity_events_written,
    api_calls_zkill: run.api_calls_zkill,
    api_calls_esi: run.api_calls_esi,
    error_summary: run.error_summary
  };
}

function discoveryCounts(db, discoveredByTypes = [], runId = null) {
  const where = [];
  const params = [];
  if (discoveredByTypes.length) {
    where.push(`discovered_by_type IN (${discoveredByTypes.map(() => '?').join(', ')})`);
    params.push(...discoveredByTypes);
  }
  if (runId) {
    where.push('(first_seen_run_id = ? OR last_seen_run_id = ?)');
    params.push(runId, runId);
  }
  const sql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM discovered_killmail_refs
    ${sql}
    GROUP BY status
  `).all(...params);
  const byStatus = Object.fromEntries(['pending', 'expanded', 'cached', 'failed', 'superseded'].map((status) => [status, 0]));
  for (const row of rows) {
    byStatus[row.status] = Number(row.count || 0);
  }
  return {
    ...byStatus,
    total: Object.values(byStatus).reduce((sum, value) => sum + value, 0),
    source_table: 'discovered_killmail_refs',
    possible_leads_not_evidence: true
  };
}

function emptyDiscoveryCounts() {
  return {
    pending: 0,
    expanded: 0,
    cached: 0,
    failed: 0,
    superseded: 0,
    total: 0,
    source_table: 'discovered_killmail_refs',
    possible_leads_not_evidence: true
  };
}

function evidenceCountsForRun(db, runId = null) {
  if (!runId) {
    return emptyEvidenceCounts();
  }
  const killmails = scalar(db, `
    SELECT COUNT(DISTINCT killmail_id) AS count
    FROM ingestion_audits
    WHERE run_id = ?
  `, [runId]);
  const activity = scalar(db, `
    SELECT COUNT(*) AS count
    FROM activity_events
    WHERE killmail_id IN (
      SELECT killmail_id
      FROM ingestion_audits
      WHERE run_id = ?
    )
  `, [runId]);
  return {
    killmails,
    activity_events: activity,
    ingestion_audits: scalar(db, 'SELECT COUNT(*) AS count FROM ingestion_audits WHERE run_id = ?', [runId]),
    source_tables: ['killmails', 'activity_events', 'ingestion_audits'],
    creates_evidence_now: false
  };
}

function emptyEvidenceCounts() {
  return {
    killmails: 0,
    activity_events: 0,
    ingestion_audits: 0,
    source_tables: ['killmails', 'activity_events', 'ingestion_audits'],
    creates_evidence_now: false
  };
}

function warningsForRun(db, runId = null) {
  if (!runId) {
    return [];
  }
  return db.prepare(`
    SELECT warning_id, warning_type, message, killmail_id, created_at
    FROM data_quality_warnings
    WHERE run_id = ?
    ORDER BY created_at DESC
    LIMIT 8
  `).all(runId);
}

function deferralsForRun(db, runId = null) {
  return warningsForRun(db, runId)
    .filter((warning) => String(warning.warning_type || '').includes('deferred') || String(warning.message || '').toLowerCase().includes('defer'))
    .map((warning) => ({
      warning_id: warning.warning_id,
      warning_type: warning.warning_type,
      waiting_not_failure: true,
      message: warning.message,
      created_at: warning.created_at
    }));
}

function volatileExecutorSnapshot(executor = {}) {
  return {
    session_armed: executor.sessionArmed === true,
    active_task_id: executor.activeTaskId || null,
    active_task_id_present: Boolean(executor.activeTaskId),
    interval_active: Boolean(executor.interval),
    poll_interval_ms: Number.isFinite(Number(executor.pollIntervalMs)) ? Number(executor.pollIntervalMs) : null,
    last_tick: executor.lastTick || null,
    last_dispatch: executor.lastDispatch ? { ...executor.lastDispatch } : null,
    last_blocked_reason: executor.lastBlockedReason || null,
    read_method: 'direct_property_snapshot_no_status_call',
    mutates_executor_state: false
  };
}

function volatileTaskSnapshot(taskRunner = {}) {
  const tasks = typeof taskRunner.listTasks === 'function' ? taskRunner.listTasks({ limit: 100 }) : [];
  const watchTasks = tasks.filter((task) => String(task.type || '').startsWith('watch.executor.'));
  const byStatus = {};
  for (const task of tasks) {
    byStatus[task.status] = (byStatus[task.status] || 0) + 1;
  }
  return {
    state_source: 'TaskRunner.listTasks read-only memory snapshot',
    task_state_is_volatile: true,
    total_tasks: tasks.length,
    watch_task_count: watchTasks.length,
    by_status: byStatus,
    watch_tasks: watchTasks.map((task) => ({
      task_id: task.task_id,
      type: task.type,
      classification: task.classification,
      scope_key: task.scope_key,
      status: task.status,
      queued_at: task.queued_at,
      started_at: task.started_at,
      finished_at: task.finished_at,
      has_result: task.result !== null && task.result !== undefined,
      has_error: task.error !== null && task.error !== undefined
    })),
    creates_tasks: false
  };
}

function compactScheduleWatch(watch) {
  return {
    watch_type: watch.watch_type,
    watch_id: watch.watch_id,
    scope_key: watch.scope_key,
    scheduler_state: watch.scheduler_state,
    blocked_reasons: watch.blocked_reasons || [],
    next_poll_at: watch.next_poll_at || null,
    last_success_at: watch.last_success_at || null,
    last_error_at: watch.last_error_at || null,
    source: watch.source || {}
  };
}

function parseJsonArray(value) {
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

function tableExists(db, tableName) {
  return Boolean(db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name = ?
  `).get(tableName));
}

function activityEventColumnExists(db, columnName) {
  return db.prepare('PRAGMA table_info(activity_events)').all()
    .some((row) => row.name === columnName);
}

function scalar(db, sql, params = []) {
  return Number(db.prepare(sql).get(...params)?.count || 0);
}

function count(db, tableName) {
  return scalar(db, `SELECT COUNT(*) AS count FROM ${tableName}`);
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

function stableJson(value) {
  return JSON.stringify(value);
}

module.exports = {
  buildWatchTaskOutcomeMapPreview
};
