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
    state_basis: stateBasisForWatch(watch, {
      ...context,
      timeEligible,
      eligibleIfArmed,
      localContext
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
  return basis;
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
  return 'System/radius local context counts use matching system-radius discovery refs plus activity_events for the center system only.';
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
