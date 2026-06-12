const { buildWatchScheduleStatus } = require('../watchlist/watchScheduler');

const ACTION = 'watch.system_radius_run_stub.preview';

function buildWatchSystemRadiusRunStubPreview(db, input = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const sessionArmed = input.sessionArmed ?? input.session_armed ?? false;
  const liveApiEnabled = input.liveApiEnabled ?? input.live_api_enabled ?? false;
  const schedule = buildWatchScheduleStatus(db, {
    now,
    sessionArmed,
    liveApiEnabled
  });
  const systemRows = schedule.watches
    .filter((watch) => watch.watch_type === 'system_radius')
    .map((watch) => systemRadiusCandidate(watch, now));
  const selected = selectRunStubCandidate(systemRows);
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only system/radius Watch-run stub projection',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    renderer_eligible: true,
    provider_calls: 0,
    live_api_calls: 0,
    watch_dispatches: 0,
    watch_execution: false,
    watch_execution_armed: false,
    watch_executor_tick_called: false,
    dispatch_runner_invocations: 0,
    collectors_called: false,
    tasks_created: 0,
    bucket_rows_created: 0,
    bucket_rows_persisted: 0,
    discovery_pickup_packets_created: 0,
    discovery_pickup_started: false,
    discovered_killmail_refs_written: 0,
    discovery_refs_mutated: 0,
    evidence_rows_written: 0,
    evidence_writes: 0,
    hydration_writes: 0,
    metadata_writes: 0,
    api_request_log_writes: 0,
    data_quality_warning_writes: 0,
    watch_mutations: 0,
    watch_rows_mutated: 0,
    cadence_mutations: 0,
    schema_changes: 0,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    watch_run_stub_emitted: Boolean(selected),
    watch_run_stub: selected ? selected.watch_run_stub : null,
    selected_watch: selected ? selected.compact_watch : null,
    system_radius_watches: systemRows,
    summary: summarize(systemRows, selected),
    accepted_model: {
      watch_role: 'scheduler_and_scope_authority_source',
      stub_role: 'candidate_input_for_future_bucket_or_discovery_pickup',
      stub_is_bucket: false,
      stub_is_discovery_pickup: false,
      stub_is_discovery_ref: false,
      stub_is_evidence_or_eveidence: false,
      stub_is_observation: false,
      system_radius_execution_authority: 'stored_included_system_ids',
      center_radius_role: 'provenance_and_explanation',
      center_radius_used_as_execution_authority: false,
      invalid_stored_scope_emits_stub: false,
      disarmed_inactive_not_due_or_blocked_emits_stub: false,
      parked_tension_resolved: false
    },
    parked_tension: {
      question: 'Should Watch emit durable bucket work while External I/O is closed, or only mark due work as eligible until the gate opens?',
      resolved_by_this_preview: false,
      implemented_policy: 'none'
    },
    source_actions: [
      'watch.schedule',
      'watch.system_radius_run_stub.preview'
    ],
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
    },
    boundary: [
      'This is a read-only/no-provider Watch-run stub projection for system/radius Watch only.',
      'The stub uses accepted stored included_system_ids as execution scope.',
      'Center system and radius are provenance/explanation only after acceptance.',
      'The stub is candidate input for later bucket or Discovery pickup behavior, not a bucket row and not Discovery pickup.',
      'The stub is not Evidence/EVEidence, not durable Discovery refs, not provider execution, and not Observation.',
      'Invalid stored scope, disarmed runtime, inactive rows, not-due rows, and blocked rows do not emit a valid stub.'
    ],
    does_not_do: [
      'does_not_create_bucket_rows',
      'does_not_create_product_watch_run_rows',
      'does_not_call_watch_executor_tick',
      'does_not_dispatch_watch_work',
      'does_not_call_task_runner',
      'does_not_invoke_collectors',
      'does_not_call_zkillboard_or_esi_or_any_provider',
      'does_not_write_discovered_killmail_refs',
      'does_not_write_evidence_or_eveidence',
      'does_not_write_hydration_or_metadata',
      'does_not_write_api_logs_or_warnings',
      'does_not_mutate_watch_rows_or_cadence',
      'does_not_decide_discovery_outcome',
      'does_not_implement_receipt_handling',
      'does_not_implement_dispatcher_queue_lease_retry_or_external_io_policy',
      'does_not_change_schema',
      'does_not_change_system_radius_runtime_behavior',
      'does_not_retire_collectors',
      'does_not_change_actor_watch_behavior',
      'does_not_change_ui_storage_enforcement_source_terms_or_protected_words'
    ]
  };
}

function systemRadiusCandidate(watch, now) {
  const source = watch.source || {};
  const scope = acceptedScopeFor(source);
  const scheduleReasons = [...(watch.blocked_reasons || [])];
  const blockedReasons = [...scheduleReasons];
  if (!scope.accepted) {
    blockedReasons.push(scope.reason);
  }
  const uniqueReasons = [...new Set(blockedReasons.filter(Boolean))];
  const eligible = watch.scheduler_state === 'due' && uniqueReasons.length === 0;
  const lookbackSeconds = positiveNumber(source.lookback_hours, 24) * 3600;
  const maxExpansions = positiveNumber(source.max_killmails_per_run, 1);
  const maxSystems = scope.included_system_ids.length;
  const maxRefsPerSystem = maxSystems ? Math.max(1, Math.ceil(maxExpansions / maxSystems)) : null;
  const emittedAt = now;
  const dueAt = watch.next_poll_at || now;

  return {
    watch_type: 'system_radius',
    watch_id: watch.watch_id,
    scope_key: watch.scope_key,
    scheduler_state: watch.scheduler_state,
    blocked_reasons: uniqueReasons,
    eligible_for_stub: eligible,
    emits_valid_stub: eligible,
    no_stub_reason: eligible ? null : noStubReason(uniqueReasons),
    due_at: dueAt,
    emitted_at: emittedAt,
    accepted_scope: {
      execution_authority: 'stored_included_system_ids',
      accepted: scope.accepted,
      stored_scope_status: scope.status,
      included_system_ids: scope.accepted ? scope.included_system_ids : [],
      included_system_count: scope.accepted ? scope.included_system_ids.length : 0,
      center_system_id: source.center_system_id ?? null,
      center_system_name: source.center_system_name || null,
      radius_jumps: source.radius_jumps ?? null,
      center_radius_is_provenance_only: true,
      center_radius_used_as_execution_authority: false
    },
    invalid_scope_diagnostic: {
      diagnostic_parseable_system_ids: scope.diagnostic_parseable_system_ids,
      operator_actionable: false,
      accepted_authority: false,
      execution_authority: false,
      selected_runtime_systems: false,
      repairs_stored_row: false
    },
    window: {
      lookback_seconds: lookbackSeconds,
      due_at: dueAt,
      emitted_at: emittedAt
    },
    caps: {
      configured_max_systems_per_run: positiveNumber(source.max_systems_per_run, maxSystems || 1),
      accepted_system_count: scope.accepted ? scope.included_system_ids.length : 0,
      max_systems: scope.accepted ? scope.included_system_ids.length : 0,
      max_refs_per_system: maxRefsPerSystem,
      max_expansions: maxExpansions
    },
    compact_watch: compactWatch(watch),
    watch_run_stub: eligible ? {
      watch_id: watch.watch_id,
      watch_run_id: fixtureWatchRunId(watch.watch_id, emittedAt),
      source_kind: 'watch_system_radius',
      accepted_scope: {
        execution_authority: 'stored_included_system_ids',
        included_system_ids: scope.included_system_ids,
        center_system_id: source.center_system_id ?? null,
        center_system_name: source.center_system_name || null,
        radius_jumps: source.radius_jumps ?? null,
        center_radius_is_provenance_only: true,
        center_radius_used_as_execution_authority: false
      },
      window: {
        lookback_seconds: lookbackSeconds,
        due_at: dueAt,
        emitted_at: emittedAt
      },
      caps: {
        max_systems: scope.included_system_ids.length,
        max_refs_per_system: maxRefsPerSystem,
        max_expansions: maxExpansions
      },
      provenance: {
        source_action: ACTION,
        source_intent: 'Watch/system-radius',
        scope_provenance: 'system_watches.included_system_ids',
        watch_scope_key: watch.scope_key,
        scheduler_state: watch.scheduler_state,
        center_radius_role: 'provenance_and_explanation'
      },
      boundary_flags: {
        candidate_input_for_future_bucket_or_discovery_pickup: true,
        bucket_row_created: false,
        discovery_pickup_started: false,
        discovery_ref_written: false,
        evidence_or_eveidence: false,
        observation: false,
        provider_execution: false,
        watch_cadence_mutated: false,
        durable: false
      }
    } : null,
    provider_calls: 0,
    writes: 0
  };
}

function acceptedScopeFor(source = {}) {
  const status = source.included_system_scope_status || 'not_stored';
  const raw = Array.isArray(source.included_system_ids) ? source.included_system_ids : [];
  const parseable = raw.map(Number).filter(Number.isFinite);
  const everyValid = raw.every((value) => Number.isFinite(Number(value)));
  const unique = [...new Set(parseable)];
  if (status !== 'valid') {
    return {
      accepted: false,
      status,
      reason: status === 'not_stored' ? 'missing_stored_scope' : 'malformed_stored_scope',
      included_system_ids: [],
      diagnostic_parseable_system_ids: unique
    };
  }
  if (!raw.length) {
    return {
      accepted: false,
      status: 'empty_stored_scope',
      reason: 'empty_stored_scope',
      included_system_ids: [],
      diagnostic_parseable_system_ids: []
    };
  }
  if (!everyValid || unique.length !== raw.length) {
    return {
      accepted: false,
      status: 'invalid_stored_scope',
      reason: 'watch_scope_authority_invalid',
      included_system_ids: [],
      diagnostic_parseable_system_ids: unique
    };
  }
  return {
    accepted: true,
    status: 'valid',
    reason: null,
    included_system_ids: unique,
    diagnostic_parseable_system_ids: []
  };
}

function selectRunStubCandidate(rows) {
  return rows
    .filter((row) => row.eligible_for_stub)
    .sort((left, right) => (
      String(left.due_at).localeCompare(String(right.due_at)) ||
      Number(left.watch_id) - Number(right.watch_id)
    ))[0] || null;
}

function summarize(rows, selected) {
  return {
    system_radius_watch_count: rows.length,
    due_system_radius_watch_count: rows.filter((row) => row.scheduler_state === 'due').length,
    valid_stub_count: rows.filter((row) => row.emits_valid_stub).length,
    emitted_stub_count: selected ? 1 : 0,
    blocked_or_waiting_count: rows.filter((row) => !row.emits_valid_stub).length,
    invalid_stored_scope_count: rows.filter((row) => row.blocked_reasons.includes('watch_scope_authority_invalid')).length,
    missing_stored_scope_count: rows.filter((row) => row.blocked_reasons.includes('missing_stored_scope')).length,
    malformed_stored_scope_count: rows.filter((row) => row.blocked_reasons.includes('malformed_stored_scope')).length,
    selected_watch_id: selected?.watch_id ?? null,
    provider_calls: 0,
    live_api_calls: 0,
    writes: 0,
    bucket_rows_created: 0,
    discovery_pickup_packets_created: 0,
    watch_mutations: 0,
    parked_tension_resolved: false
  };
}

function noStubReason(reasons) {
  if (!reasons.length) {
    return null;
  }
  if (reasons.includes('session_not_armed')) {
    return 'session_not_armed';
  }
  if (reasons.includes('inactive')) {
    return 'inactive';
  }
  if (reasons.includes('not_due')) {
    return 'not_due';
  }
  if (reasons.includes('backoff')) {
    return 'backoff';
  }
  if (reasons.includes('watch_scope_authority_invalid')) {
    return 'watch_scope_authority_invalid';
  }
  return reasons[0];
}

function compactWatch(watch = {}) {
  return {
    watch_type: watch.watch_type || null,
    watch_id: watch.watch_id ?? null,
    scope_key: watch.scope_key || null,
    scheduler_state: watch.scheduler_state || null,
    blocked_reasons: [...(watch.blocked_reasons || [])],
    next_poll_at: watch.next_poll_at || null,
    backoff_until: watch.backoff_until || null,
    poll_interval_minutes: watch.poll_interval_minutes ?? null
  };
}

function fixtureWatchRunId(watchId, emittedAt) {
  return `fixture-watch-run:system-radius:${watchId}:${String(emittedAt).replace(/[^0-9A-Za-z]/g, '')}`;
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
  buildWatchSystemRadiusRunStubPreview
};
