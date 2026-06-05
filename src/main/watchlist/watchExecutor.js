const { actionGate } = require('../services/liveApiGateService');
const { TASK_CLASSIFICATIONS, defaultTaskRunner } = require('../services/taskRunner');
const { collectActorWatch } = require('../workers/actorWatchCollector');
const { collectSystemRadiusWatch } = require('../workers/systemRadiusCollector');
const { buildWatchScheduleStatus, recordWatchRunResult } = require('./watchScheduler');

const DEFAULT_POLL_INTERVAL_MS = 60000;

class WatchSessionExecutor {
  constructor({ taskRunner = defaultTaskRunner, pollIntervalMs = DEFAULT_POLL_INTERVAL_MS } = {}) {
    this.taskRunner = taskRunner;
    this.pollIntervalMs = pollIntervalMs;
    this.sessionArmed = false;
    this.interval = null;
    this.activeTaskId = null;
    this.lastTick = null;
    this.lastDispatch = null;
    this.lastBlockedReason = 'session_not_armed';
  }

  status(db) {
    if (this.activeTaskId) {
      this.isTaskActive();
    }
    const schedule = buildWatchScheduleStatus(db, {
      sessionArmed: this.sessionArmed,
      liveApiEnabled: process.env.AURA_ATLAS_LIVE_API === '1'
    });
    return {
      session_armed: this.sessionArmed,
      active_task_id: this.activeTaskId,
      poll_interval_ms: this.pollIntervalMs,
      last_tick: this.lastTick,
      last_dispatch: this.lastDispatch,
      last_blocked_reason: this.lastBlockedReason,
      schedule
    };
  }

  async arm(db, options = {}, dependencies = {}) {
    this.sessionArmed = true;
    this.startInterval(db, options, dependencies);
    const tick = await this.tick(db, {
      ...options,
      reason: options.reason || 'arm'
    }, dependencies);
    return {
      ...this.status(db),
      tick
    };
  }

  disarm(db, options = {}) {
    this.sessionArmed = false;
    this.stopInterval();
    this.lastBlockedReason = options.reason || 'session_disarmed';
    return this.status(db);
  }

  async tick(db, options = {}, dependencies = {}) {
    this.lastTick = new Date().toISOString();
    if (!this.sessionArmed) {
      this.lastBlockedReason = 'session_not_armed';
      return tickResult('blocked', { reason: this.lastBlockedReason });
    }
    if (this.activeTaskId && this.isTaskActive()) {
      this.lastBlockedReason = 'active_task';
      return tickResult('blocked', { reason: this.lastBlockedReason, active_task_id: this.activeTaskId });
    }

    const liveApiEnabled = options.liveApiEnabled ?? process.env.AURA_ATLAS_LIVE_API === '1';
    const schedule = buildWatchScheduleStatus(db, {
      sessionArmed: true,
      liveApiEnabled
    });
    if (!liveApiEnabled) {
      this.lastBlockedReason = 'live_api_disabled';
      return tickResult('blocked', { reason: this.lastBlockedReason, schedule });
    }
    if (!schedule.due.length) {
      this.lastBlockedReason = 'no_due_watches';
      return tickResult('idle', { reason: this.lastBlockedReason, schedule });
    }

    const watch = selectDueWatch(schedule.due);
    let dispatch;
    try {
      dispatch = dispatchFor(watch);
    } catch (error) {
      this.lastBlockedReason = error.code || 'watch_scope_authority_invalid';
      return tickResult('blocked', {
        reason: this.lastBlockedReason,
        watch,
        error: error.message
      });
    }
    const gate = actionGate(dispatch.command, dispatch.payload);
    if (!gate.allowed) {
      this.lastBlockedReason = gate.blockers[0]?.code || 'live_gate_blocked';
      return tickResult('blocked', { reason: this.lastBlockedReason, gate, watch });
    }

    const task = this.taskRunner.runDetachedTask({
      type: `watch.executor.${dispatch.command}`,
      classification: TASK_CLASSIFICATIONS.EVIDENCE_CREATING,
      scopeKey: watch.scope_key
    }, async (taskContext) => {
      try {
        taskContext.progress({ stage: 'watch-dispatch', message: `Running ${watch.scope_key}` });
        const data = await dispatch.runner(dispatch.payload, {
          ...dependencies,
          db,
          signal: taskContext.signal
        });
        recordWatchRunResult(db, {
          watchType: watch.watch_type,
          watchId: watch.watch_id,
          status: 'success',
          finishedAt: new Date().toISOString()
        });
        taskContext.progress({ stage: 'watch-recorded', message: `Recorded success for ${watch.scope_key}` });
        return {
          status: 'succeeded',
          data: {
            watch,
            collection: data
          }
        };
      } catch (error) {
        recordWatchRunResult(db, {
          watchType: watch.watch_type,
          watchId: watch.watch_id,
          status: 'failed',
          finishedAt: new Date().toISOString()
        });
        throw error;
      }
    });

    this.activeTaskId = task.task_id;
    this.lastDispatch = {
      at: this.lastTick,
      watch_type: watch.watch_type,
      watch_id: watch.watch_id,
      scope_key: watch.scope_key,
      task_id: task.task_id
    };
    this.lastBlockedReason = null;
    return tickResult('dispatched', {
      watch,
      task
    });
  }

  startInterval(db, options = {}, dependencies = {}) {
    if (options.startInterval === false || this.interval || this.pollIntervalMs <= 0) {
      return;
    }
    this.interval = setInterval(() => {
      this.tick(db, { reason: 'interval' }, dependencies).catch(() => {
        // Tick failures are reflected in task/run records when dispatch happens.
      });
    }, this.pollIntervalMs);
    if (this.interval.unref) {
      this.interval.unref();
    }
  }

  stopInterval() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  isTaskActive() {
    const task = this.taskRunner.getTask(this.activeTaskId);
    if (!task || !['queued', 'running'].includes(task.status)) {
      this.activeTaskId = null;
      return false;
    }
    return true;
  }
}

function selectDueWatch(due = []) {
  return [...due].sort((left, right) => (
    compareTime(left.next_poll_at, right.next_poll_at) ||
    compareTime(left.last_success_at, right.last_success_at) ||
    String(left.watch_type).localeCompare(String(right.watch_type)) ||
    Number(left.watch_id) - Number(right.watch_id)
  ))[0];
}

function compareTime(left, right) {
  if (!left && !right) {
    return 0;
  }
  if (!left) {
    return -1;
  }
  if (!right) {
    return 1;
  }
  return String(left).localeCompare(String(right));
}

function dispatchFor(watch) {
  if (watch.watch_type === 'actor') {
    const source = watch.source || {};
    const payload = {
      entityType: source.entity_type,
      entityId: source.entity_id,
      entityName: source.entity_name,
      lookbackSeconds: Number(source.lookback_days || 30) * 86400,
      maxRefs: Number(source.max_killmails_per_run || 1),
      maxExpansions: Number(source.max_killmails_per_run || 1)
    };
    return {
      command: 'actor.watch',
      payload,
      runner: collectActorWatch
    };
  }

  if (watch.watch_type !== 'system_radius') {
    throw new Error(`Unsupported watch type for session executor: ${watch.watch_type}`);
  }

  const source = watch.source || {};
  const acceptedSystemIds = acceptedSystemIdsForWatchSource(source);
  const maxKillmails = Number(source.max_killmails_per_run || 1);
  const acceptedSystemCount = Math.max(acceptedSystemIds.length, 1);
  return {
    command: 'system.radius.watch',
    payload: {
      centerSystemId: source.center_system_id,
      radiusJumps: source.radius_jumps,
      acceptedSystemIds,
      acceptedScopeSource: 'stored_watch_scope',
      acceptedScopeProvenance: {
        watchId: watch.watch_id,
        centerSystemId: source.center_system_id,
        radiusJumps: source.radius_jumps,
        includedSystemScopeStatus: source.included_system_scope_status,
        excludedSystemScopeStatus: source.excluded_system_scope_status,
        excludedSystemIds: Array.isArray(source.excluded_system_ids) ? source.excluded_system_ids : []
      },
      lookbackSeconds: Number(source.lookback_hours || 24) * 3600,
      maxSystems: acceptedSystemIds.length,
      maxRefsPerSystem: Math.max(1, Math.ceil(maxKillmails / acceptedSystemCount)),
      maxExpansions: maxKillmails
    },
    runner: collectSystemRadiusWatch
  };
}

function acceptedSystemIdsForWatchSource(source = {}) {
  const includedStatus = source.included_system_scope_status || 'not_stored';
  const included = Array.isArray(source.included_system_ids)
    ? source.included_system_ids.map(Number).filter(Number.isFinite)
    : [];
  if (includedStatus !== 'valid' || included.length === 0) {
    const error = new Error(`System/radius Watch execution requires valid stored included_system_ids; got ${includedStatus}`);
    error.code = 'watch_scope_authority_invalid';
    throw error;
  }
  return [...new Set(included)];
}

function tickResult(status, extra = {}) {
  return {
    status,
    checked_at: new Date().toISOString(),
    ...extra
  };
}

const defaultWatchSessionExecutor = new WatchSessionExecutor();

module.exports = {
  WatchSessionExecutor,
  defaultWatchSessionExecutor,
  selectDueWatch,
  dispatchFor,
  acceptedSystemIdsForWatchSource
};
