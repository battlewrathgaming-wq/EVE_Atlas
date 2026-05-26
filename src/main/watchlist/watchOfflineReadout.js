const { buildWatchScheduleStatus } = require('./watchScheduler');

function buildWatchOfflineReadout(db, options = {}) {
  const executorStatus = options.executorStatus || {};
  const sessionArmed = executorStatus.session_armed === true;
  const collectionActive = Boolean(executorStatus.active_task_id);
  const liveApiEnabled = options.liveApiEnabled ?? process.env.AURA_ATLAS_LIVE_API === '1';
  const schedule = options.schedule || buildWatchScheduleStatus(db, {
    now: options.now,
    sessionArmed,
    liveApiEnabled
  });
  const watches = (schedule.watches || []).map((watch) => readoutWatch(db, watch, {
    sessionArmed,
    collectionActive,
    liveApiEnabled,
    now: schedule.now
  }));
  const summary = summarizeReadout(watches, {
    sessionArmed,
    collectionActive
  });

  return {
    model: 'Watch_offline',
    classification: 'read-only watch offline readout',
    generated_at: schedule.now,
    session_armed: sessionArmed,
    collection_active: collectionActive,
    active_task_id: executorStatus.active_task_id || null,
    live_api_enabled: liveApiEnabled,
    local_context_available: watches.some((watch) => watch.local_context_available),
    summary,
    watches,
    state_basis: [
      'watch definitions, next poll, backoff, last success, and last error come from local Watch rows',
      'session_armed and active_task_id come from volatile WatchSessionExecutor memory',
      'collection_active is true only when the executor reports an active task id',
      'local queue counts read discovered_killmail_refs only',
      'local evidence counts read activity_events only',
      'readout generation does not start collection, arm the session, call live providers, or write persistence'
    ]
  };
}

function readoutWatch(db, watch, context) {
  const blockedReasons = watch.blocked_reasons || [];
  const timeEligible = isTimeEligible(blockedReasons);
  const eligibleIfArmed = timeEligible &&
    !context.sessionArmed &&
    !context.collectionActive &&
    !blockedReasons.some((reason) => reason !== 'session_not_armed');
  const nextEligibleAt = nextEligibleTime(watch, blockedReasons);
  const localContext = localContextForWatch(db, watch);
  const recovery = recoveryDiagnosticForWatch(db, watch, {
    ...context,
    blockedReasons,
    timeEligible,
    eligibleIfArmed,
    localContext
  });

  return {
    watch_type: watch.watch_type,
    watch_id: watch.watch_id,
    scope_key: watch.scope_key,
    scheduler_state: watch.scheduler_state,
    session_armed: context.sessionArmed,
    collection_active: context.collectionActive,
    time_eligible: timeEligible,
    eligible_if_armed: eligibleIfArmed,
    next_eligible_at: nextEligibleAt,
    blocked_reasons: blockedReasons,
    local_context_available: localContext.available,
    local_context: localContext,
    last_polled_at: watch.last_polled_at || null,
    last_success_at: watch.last_success_at || null,
    last_error_at: watch.last_error_at || null,
    backoff_until: watch.backoff_until || null,
    next_poll_at: watch.next_poll_at || null,
    source: watch.source || {},
    recovery,
    next_safe_action: recovery.next_safe_action,
    state_basis: stateBasisForWatch(watch, {
      ...context,
      timeEligible,
      eligibleIfArmed,
      localContext,
      recovery
    })
  };
}

function isTimeEligible(blockedReasons = []) {
  return !blockedReasons.includes('not_due') &&
    !blockedReasons.includes('backoff') &&
    !blockedReasons.includes('inactive');
}

function nextEligibleTime(watch, blockedReasons = []) {
  if (blockedReasons.includes('backoff')) {
    return watch.backoff_until || watch.next_poll_at || null;
  }
  if (blockedReasons.includes('not_due')) {
    return watch.next_poll_at || null;
  }
  return watch.next_poll_at || null;
}

function stateBasisForWatch(watch, context) {
  const basis = [];
  basis.push(`scheduler_state=${watch.scheduler_state || 'unknown'} from watch.schedule blocked_reasons`);
  basis.push(`session_armed=${context.sessionArmed} from volatile executor status`);
  basis.push(`collection_active=${context.collectionActive} from active_task_id presence`);
  basis.push(`time_eligible=${context.timeEligible} because not_due/backoff/inactive are ${context.timeEligible ? 'absent' : 'present'}`);
  basis.push(`eligible_if_armed=${context.eligibleIfArmed} requires time eligibility, unarmed session, no active collection, and no non-session block`);
  basis.push(`local_context_available=${context.localContext.available} from local queue/evidence counts`);
  basis.push(`next_safe_action=${context.recovery.next_safe_action} derived from local Watch rows, fetch/API logs, queue refs, and evidence counts`);
  return basis;
}

function recoveryDiagnosticForWatch(db, watch, context) {
  const latestRun = latestFetchRunForWatch(db, watch);
  const latestApi = latestRun ? latestApiLogForRun(db, latestRun.run_id) : null;
  const providerDeferral = latestRun ? latestProviderDeferralForRun(db, latestRun.run_id) : null;
  const scope = reconstructedScope(watch);
  const observedMovementAt = latestIso([
    watch.last_polled_at,
    watch.last_success_at,
    watch.last_error_at,
    latestRun?.finished_at,
    latestRun?.started_at,
    latestApi?.requested_at
  ]);
  const orphanedRun = latestRun?.status === 'running' && !context.collectionActive;
  const missedSlot = missedSlotSignal(watch, context.now, observedMovementAt);
  const pendingRefs = context.localContext.queue.pending || 0;
  const nextSafeAction = nextSafeActionForWatch({
    watch,
    context,
    pendingRefs,
    orphanedRun,
    providerDeferral,
    missedSlot
  });

  return {
    classification: 'read-only watch recovery diagnostic',
    durable_intent_source: durableIntentSource(watch),
    session_armed: context.sessionArmed,
    collection_active: context.collectionActive,
    expected_next_run_at: watch.next_poll_at || null,
    observed_movement_at: observedMovementAt,
    next_eligible_at: nextEligibleTime(watch, context.blockedReasons),
    reconstructed_scope: scope,
    pending_refs_count: pendingRefs,
    latest_fetch_run: latestRun ? compactFetchRun(latestRun) : null,
    latest_api_activity: latestApi ? compactApiLog(latestApi) : null,
    provider_deferral: providerDeferral,
    orphaned_run: {
      present: Boolean(orphanedRun),
      run_id: orphanedRun ? latestRun.run_id : null,
      status: orphanedRun ? latestRun.status : null
    },
    missed_slot: missedSlot,
    next_safe_action: nextSafeAction,
    no_provider_work: true,
    mutates_state: false,
    basis: [
      'derived from existing Watch rows, fetch_runs, api_request_logs, discovered_killmail_refs, killmails, and activity_events',
      'pending Discovery refs are preferred before fresh zKill discovery',
      'orphaned running fetch runs are review signals and are not resumed',
      'provider capacity deferral is waiting/deferred, not failed Evidence',
      'diagnostic generation does not hydrate metadata, arm Watch execution, call providers, create Evidence, mutate Discovery refs, or persist sequencer packets'
    ]
  };
}

function durableIntentSource(watch) {
  return watch.watch_type === 'actor'
    ? 'watchlist_entities'
    : 'system_watches';
}

function latestFetchRunForWatch(db, watch) {
  const identities = watchRunIdentities(watch);
  const placeholders = identities.map(() => '?').join(', ');
  return db.prepare(`
    SELECT *
    FROM fetch_runs
    WHERE watch_type = ?
      AND watch_id IN (${placeholders})
    ORDER BY COALESCE(finished_at, started_at) DESC, started_at DESC
    LIMIT 1
  `).get(watch.watch_type === 'actor' ? 'actor' : 'system_radius', ...identities) || null;
}

function watchRunIdentities(watch) {
  const source = watch.source || {};
  if (watch.watch_type === 'actor') {
    return uniqueStrings([
      String(source.entity_id),
      `${source.entity_type}:${source.entity_id}`,
      watch.scope_key
    ]);
  }
  return uniqueStrings([
    String(source.center_system_id),
    `system:${source.center_system_id}:radius:${source.radius_jumps}`,
    watch.scope_key
  ]);
}

function latestApiLogForRun(db, runId) {
  return db.prepare(`
    SELECT *
    FROM api_request_logs
    WHERE run_id = ?
    ORDER BY requested_at DESC
    LIMIT 1
  `).get(runId) || null;
}

function latestProviderDeferralForRun(db, runId) {
  const warning = db.prepare(`
    SELECT *
    FROM data_quality_warnings
    WHERE run_id = ?
      AND warning_type = 'provider_capacity_deferred'
    ORDER BY created_at DESC
    LIMIT 1
  `).get(runId);
  if (!warning) {
    return {
      present: false,
      waiting: false,
      warning: null
    };
  }
  return {
    present: true,
    waiting: true,
    warning: {
      warning_id: warning.warning_id,
      run_id: warning.run_id,
      killmail_id: warning.killmail_id,
      warning_type: warning.warning_type,
      message: warning.message,
      created_at: warning.created_at
    }
  };
}

function missedSlotSignal(watch, now, observedMovementAt) {
  const expected = watch.next_poll_at || null;
  const expectedMs = Date.parse(expected || '');
  const nowMs = Date.parse(now || '');
  if (!Number.isFinite(expectedMs) || !Number.isFinite(nowMs) || expectedMs > nowMs) {
    return {
      present: false,
      recoverable: false,
      expected_next_run_at: expected,
      observed_movement_at: observedMovementAt
    };
  }
  const observedMs = Date.parse(observedMovementAt || '');
  const missed = !Number.isFinite(observedMs) || observedMs < expectedMs;
  return {
    present: missed,
    recoverable: missed,
    expected_next_run_at: expected,
    observed_movement_at: observedMovementAt
  };
}

function nextSafeActionForWatch({ context, pendingRefs, orphanedRun, providerDeferral, missedSlot }) {
  if (orphanedRun) {
    return 'review_orphan';
  }
  if (providerDeferral?.present) {
    return 'wait';
  }
  if (pendingRefs > 0) {
    return 'drain_pending_refs';
  }
  if (context.blockedReasons.some((reason) => ['not_due', 'backoff', 'inactive', 'live_api_disabled'].includes(reason))) {
    return 'wait';
  }
  if (missedSlot.present) {
    return 'recover_missed_slot_when_capacity_allows';
  }
  if (!context.sessionArmed && context.timeEligible && !context.collectionActive) {
    return 'arm_required';
  }
  if (context.sessionArmed && context.timeEligible && !context.collectionActive) {
    return 'ready_for_discovery';
  }
  return 'complete_enough_alpha';
}

function reconstructedScope(watch) {
  const source = watch.source || {};
  if (watch.watch_type === 'actor') {
    return {
      type: 'actor',
      entity_type: source.entity_type,
      entity_id: source.entity_id,
      lookback_days: source.lookback_days,
      max_killmails_per_run: source.max_killmails_per_run,
      scope_status: 'valid'
    };
  }

  const includedStatus = source.included_system_scope_status || 'not_stored';
  const excludedStatus = source.excluded_system_scope_status || 'not_stored';
  const included = Array.isArray(source.included_system_ids) ? source.included_system_ids : [];
  const excluded = Array.isArray(source.excluded_system_ids) ? source.excluded_system_ids : [];
  const effectiveIncludedStatus = includedStatus === 'valid' && !included.length ? 'not_stored' : includedStatus;
  return {
    type: 'system_radius',
    center_system_id: source.center_system_id,
    center_system_name: source.center_system_name,
    radius_jumps: source.radius_jumps,
    included_system_ids: included,
    excluded_system_ids: excluded,
    included_system_scope_status: effectiveIncludedStatus,
    excluded_system_scope_status: excludedStatus,
    scope_status: systemScopeStatus(effectiveIncludedStatus, excludedStatus),
    limitation: systemScopeLimitation(effectiveIncludedStatus, excludedStatus)
  };
}

function systemScopeStatus(includedStatus, excludedStatus) {
  if (includedStatus === 'malformed' || excludedStatus === 'malformed') {
    return 'malformed';
  }
  if (includedStatus === 'not_stored') {
    return 'not_stored';
  }
  return 'valid';
}

function systemScopeLimitation(includedStatus, excludedStatus) {
  if (includedStatus === 'malformed' || excludedStatus === 'malformed') {
    return 'stored radius scope is malformed; recovery should not guess exact radius membership';
  }
  if (includedStatus === 'not_stored') {
    return 'no stored included-system scope; recovery falls back to center-system local context only';
  }
  return null;
}

function compactFetchRun(row) {
  return {
    run_id: row.run_id,
    watch_type: row.watch_type,
    watch_id: row.watch_id,
    started_at: row.started_at,
    finished_at: row.finished_at || null,
    status: row.status,
    discovered_refs: row.discovered_refs,
    already_cached: row.already_cached,
    expanded_new: row.expanded_new,
    failed_expansions: row.failed_expansions,
    activity_events_written: row.activity_events_written,
    api_calls_zkill: row.api_calls_zkill,
    api_calls_esi: row.api_calls_esi,
    error_summary: row.error_summary || null
  };
}

function compactApiLog(row) {
  return {
    request_id: row.request_id,
    run_id: row.run_id,
    provider: row.provider,
    endpoint: row.endpoint,
    status_code: row.status_code,
    retry_count: row.retry_count,
    rate_limited: Boolean(row.rate_limited),
    error_message: row.error_message || null,
    requested_at: row.requested_at
  };
}

function latestIso(values) {
  return values
    .filter(Boolean)
    .sort()
    .slice(-1)[0] || null;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => value !== undefined && value !== null && String(value).length > 0).map(String))];
}

function localContextForWatch(db, watch) {
  const queue = queueCountsForWatch(db, watch);
  const evidence = evidenceCountsForWatch(db, watch);
  return {
    available: queue.total > 0 || evidence.activity_events > 0 || evidence.killmails > 0,
    queue,
    evidence,
    basis: localContextBasis(watch)
  };
}

function localContextBasis(watch) {
  if (watch.watch_type === 'actor') {
    return 'Actor local context counts use matching actor discovery refs plus activity_events for the watched entity.';
  }
  const scope = reconstructedScope(watch);
  if (scope.scope_status === 'valid' && scope.included_system_ids.length) {
    return 'System/radius local context counts use stored included-system scope from system_watches.';
  }
  return `System/radius local context counts fall back to center-system scope. ${scope.limitation || ''}`.trim();
}

function queueCountsForWatch(db, watch) {
  const rows = db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM discovered_killmail_refs
    WHERE ${queueWhereClause(watch)}
    GROUP BY status
  `).all(...queueParams(watch));
  const counts = {
    total: 0,
    pending: 0,
    failed: 0,
    expanded: 0,
    cached: 0,
    superseded: 0
  };
  for (const row of rows) {
    const count = row.count || 0;
    counts.total += count;
    if (Object.prototype.hasOwnProperty.call(counts, row.status)) {
      counts[row.status] = count;
    }
  }
  return counts;
}

function queueWhereClause(watch) {
  if (watch.watch_type === 'actor') {
    return `(
      (discovered_by_type = 'actor' AND discovered_by_id = ?)
      OR (source_actor_type = ? AND source_actor_id = ?)
    )`;
  }
  const scope = reconstructedScope(watch);
  if (scope.scope_status === 'valid' && scope.included_system_ids.length) {
    return `(
      (discovered_by_type = 'system_radius' AND discovered_by_id = ?)
      OR source_system_id IN (${scope.included_system_ids.map(() => '?').join(', ')})
    )`;
  }
  return `(
    (discovered_by_type = 'system_radius' AND discovered_by_id = ?)
    OR source_system_id = ?
  )`;
}

function queueParams(watch) {
  const source = watch.source || {};
  if (watch.watch_type === 'actor') {
    return [
      String(source.entity_id),
      source.entity_type,
      source.entity_id
    ];
  }
  const scope = reconstructedScope(watch);
  if (scope.scope_status === 'valid' && scope.included_system_ids.length) {
    return [
      String(source.center_system_id),
      ...scope.included_system_ids
    ];
  }
  return [
    String(source.center_system_id),
    source.center_system_id
  ];
}

function evidenceCountsForWatch(db, watch) {
  if (watch.watch_type === 'actor') {
    const source = watch.source || {};
    const row = db.prepare(`
      SELECT COUNT(*) AS activity_events,
             COUNT(DISTINCT killmail_id) AS killmails
      FROM activity_events
      WHERE entity_type = ? AND entity_id = ?
    `).get(source.entity_type, source.entity_id);
    return {
      activity_events: row?.activity_events || 0,
      killmails: row?.killmails || 0
    };
  }

  const source = watch.source || {};
  const scope = reconstructedScope(watch);
  if (scope.scope_status === 'valid' && scope.included_system_ids.length) {
    const rows = db.prepare(`
      SELECT COUNT(*) AS activity_events,
             COUNT(DISTINCT killmail_id) AS killmails
      FROM activity_events
      WHERE solar_system_id IN (${scope.included_system_ids.map(() => '?').join(', ')})
    `).get(...scope.included_system_ids);
    return {
      activity_events: rows?.activity_events || 0,
      killmails: rows?.killmails || 0
    };
  }
  const row = db.prepare(`
    SELECT COUNT(*) AS activity_events,
           COUNT(DISTINCT killmail_id) AS killmails
    FROM activity_events
    WHERE solar_system_id = ?
  `).get(source.center_system_id);
  return {
    activity_events: row?.activity_events || 0,
    killmails: row?.killmails || 0
  };
}

function summarizeReadout(watches, context) {
  return {
    configured_watches: watches.length,
    session_armed: context.sessionArmed,
    collection_active: context.collectionActive,
    time_eligible: watches.filter((watch) => watch.time_eligible).length,
    eligible_if_armed: watches.filter((watch) => watch.eligible_if_armed).length,
    blocked: watches.filter((watch) => watch.blocked_reasons.length > 0).length,
    not_due: watches.filter((watch) => watch.blocked_reasons.includes('not_due')).length,
    backoff: watches.filter((watch) => watch.blocked_reasons.includes('backoff')).length,
    inactive: watches.filter((watch) => watch.blocked_reasons.includes('inactive')).length,
    local_context_available: watches.filter((watch) => watch.local_context_available).length
  };
}

module.exports = {
  buildWatchOfflineReadout
};
