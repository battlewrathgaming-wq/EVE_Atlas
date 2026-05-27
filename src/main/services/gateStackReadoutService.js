const { USER_AGENT } = require('../../shared/constants');
const { buildAppReadiness } = require('./appReadinessService');
const { actionGate } = require('./liveApiGateService');
const { buildStorageAuthorityPreflight } = require('./storageAuthorityPreflightService');
const { defaultTaskRunner } = require('./taskRunner');
const { defaultWatchSessionExecutor, dispatchFor } = require('../watchlist/watchExecutor');

const DEFAULT_ACTIONS = [
  'report.view',
  'metadata.status',
  'manual.discovery',
  'manual.expansion',
  'actor.watch',
  'system.radius.watch',
  'metadata.hydration',
  'sde.build-lookups'
];

function buildGateStackReadout(db, input = {}, context = {}) {
  const commandMetadata = Array.isArray(context.commandMetadata) ? context.commandMetadata : [];
  const taskRunner = context.taskRunner || defaultTaskRunner;
  const executor = context.watchExecutor || defaultWatchSessionExecutor;
  const executorStatus = executor.status(db);
  const storage = buildStorageAuthorityPreflight({}, {
    ...context,
    allowStorageAuthorityPathOverrides: false
  });
  const readiness = buildAppReadiness(db, {
    databasePath: context.databasePath
  });
  const actions = actionList(input);
  const activeTasks = taskRunner.listTasks ? taskRunner.listTasks({ limit: input.taskLimit || 50 }) : [];
  const providerBackedCommands = commandMetadata
    .filter((entry) => (entry.effects || []).includes('external-live-api'))
    .map((entry) => entry.command)
    .sort();
  const localOnlyCommands = commandMetadata
    .filter((entry) => !(entry.effects || []).includes('external-live-api'))
    .map((entry) => entry.command)
    .sort();

  return {
    action: 'support.gate_stack_readout',
    classification: 'read-only provider-backed work posture readout',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    external_io: externalIoPolicyReadout(input),
    external_api: {
      label: 'External API',
      live_api_enabled: process.env.AURA_ATLAS_LIVE_API === '1',
      readiness_state: readiness.live_api.state,
      user_agent_configured: typeof USER_AGENT === 'string' && USER_AGENT.trim().length > 0,
      readiness_rule: readiness.live_api.rule
    },
    watch: watchSummary(executorStatus),
    schedule: scheduleSummary(executorStatus.schedule),
    storage_safety: storageSummary(storage),
    active_tasks: activeTaskSummary(activeTasks),
    command_inventory: {
      provider_backed: providerBackedCommands,
      local_only: localOnlyCommands,
      basis: 'service command effects; external-live-api means provider-backed for this readout'
    },
    gate_stacks: actions.map((action) => gateStackForAction(action, {
      commandMetadata,
      executorStatus,
      storage,
      taskRunner,
      activeTasks,
      input
    })),
    boundary: [
      'Read-only support readout only; it does not enforce external_io, storage lockout, live.gate, or Watch behavior.',
      'external_io is reported as policy-only/not implemented in this packet.',
      'Due means consider work, not run now.',
      'waiting and held_by_external_io are not failures.',
      'Releasing any future external I/O must not imply catch-up flooding.',
      'This readout does not call providers, write storage config, move/copy/delete DB files, mutate Watch rows, create Evidence/EVEidence, hydrate metadata, or change schema.'
    ]
  };
}

function actionList(input = {}) {
  const requested = input.actions || input.commands;
  if (!Array.isArray(requested) || !requested.length) {
    return DEFAULT_ACTIONS;
  }
  return requested.map(String);
}

function externalIoPolicyReadout(input = {}) {
  const requested = input.externalIoState || input.external_io_state || null;
  return {
    family: 'external_io',
    implementation_state: 'policy_only_not_implemented',
    enforced: false,
    requested_readout_state: requested,
    provider_backed_if_off: 'held_by_external_io',
    release_policy: 'future release must re-enter normal cadence/provider controls, storage safety, Watch arming, and confirmation rules; no catch-up flood'
  };
}

function watchSummary(executorStatus = {}) {
  return {
    session_armed: executorStatus.session_armed === true,
    active_task_id: executorStatus.active_task_id || null,
    last_tick: executorStatus.last_tick || null,
    last_dispatch: executorStatus.last_dispatch || null,
    last_blocked_reason: executorStatus.last_blocked_reason || null,
    meaning: 'Watch/session arming is separate from provider movement permission'
  };
}

function scheduleSummary(schedule = {}) {
  const due = schedule.due || [];
  const blocked = schedule.blocked || [];
  return {
    now: schedule.now || null,
    due_count: due.length,
    blocked_count: blocked.length,
    due: due.map(compactWatch),
    blocked: blocked.map(compactWatch),
    meaning: 'due watches should be considered by gates; due is not dispatch permission'
  };
}

function storageSummary(storage = {}) {
  return {
    source: 'storage.authority_preflight',
    read_only: storage.read_only === true,
    enforcement_state: 'not_implemented_in_hs111',
    database_mode: storage.database?.mode || null,
    database_exists: storage.database?.exists === true,
    database_outside_policy: storage.database?.mode_flags?.outside_policy === true,
    snapshot_destination_status: storage.snapshot?.destination?.status || null,
    known_controlled_locations_bytes: storage.byte_usage?.known_controlled_locations_bytes || 0,
    meaning: 'storage safety is reported separately from provider permission'
  };
}

function activeTaskSummary(tasks = []) {
  const active = tasks.filter((task) => ['queued', 'running'].includes(task.status));
  return {
    active_count: active.length,
    active: active.map((task) => ({
      task_id: task.task_id,
      type: task.type,
      classification: task.classification,
      scope_key: task.scope_key,
      status: task.status
    })),
    meaning: 'active task posture is duplicate/concurrency context, not external_io or storage authority'
  };
}

function gateStackForAction(action, context) {
  const command = commandForAction(action, context.commandMetadata);
  const payload = payloadForAction(action, context.input);
  const liveGate = safeActionGate(action, payload, context.taskRunner);
  const watchGate = watchGateForAction(action, context.executorStatus);
  const activeTask = matchingActiveTask(action, liveGate?.request_control?.scope_fingerprint, context.activeTasks);
  const confirmation = command?.authority || {
    confirmation_required: false,
    token: null,
    reason: null
  };
  const providerBacked = command
    ? (command.effects || []).includes('external-live-api')
    : liveGate?.mode === 'live-required';

  return {
    action,
    command: command?.command || action,
    provider_backed: providerBacked,
    gates: {
      schedule: scheduleGateForAction(action, context.executorStatus.schedule),
      watch_arming: watchGate,
      external_io: {
        implementation_state: 'policy_only_not_implemented',
        enforced: false,
        readout_if_future_off: providerBacked ? 'held_by_external_io' : 'local_only_available'
      },
      external_api: liveGate ? {
        mode: liveGate.mode,
        allowed: liveGate.allowed,
        state: liveGate.state,
        providers: liveGate.providers,
        estimated_api_calls: liveGate.estimated_api_calls,
        blockers: liveGate.blockers,
        warnings: liveGate.warnings,
        request_control: liveGate.request_control
      } : {
        mode: 'unknown',
        allowed: false,
        state: 'unknown_action',
        blockers: [{ code: 'UNKNOWN_LIVE_GATE_ACTION', message: `No live.gate action for ${action}` }]
      },
      storage_safety: storageSummary(context.storage),
      active_task: activeTask,
      confirmation
    },
    readout_posture: postureFor({
      providerBacked,
      liveGate,
      watchGate,
      activeTask,
      confirmation
    }),
    no_provider_call: true,
    mutates_state: false
  };
}

function commandForAction(action, commands = []) {
  if (action === 'report.view') {
    return commands.find((entry) => entry.command === 'report.actor') || null;
  }
  if (action === 'metadata.status') {
    return commands.find((entry) => entry.command === 'app.readiness') || null;
  }
  return commands.find((entry) => entry.command === action) || null;
}

function payloadForAction(action, input = {}) {
  const payloads = input.actionInputs || input.action_inputs || {};
  if (payloads[action]) {
    return payloads[action];
  }
  if (action === 'manual.discovery') {
    return {
      scope: 'actor',
      entityType: 'character',
      entityId: 90000001,
      maxRefs: 1
    };
  }
  if (action === 'manual.expansion') {
    return {
      killmailIds: [1],
      maxExpansions: 1
    };
  }
  if (action === 'actor.watch') {
    return {
      entityType: 'character',
      entityId: 90000001,
      maxRefs: 1,
      maxExpansions: 1
    };
  }
  if (action === 'system.radius.watch') {
    return {
      centerSystemId: 30000001,
      radiusJumps: 0,
      maxSystems: 1,
      maxRefsPerSystem: 1,
      maxExpansions: 1
    };
  }
  if (action === 'metadata.hydration') {
    return {
      target: 'report_ids',
      idsToRequest: 1
    };
  }
  return {};
}

function safeActionGate(action, payload, taskRunner) {
  try {
    return actionGate(action, payload, { taskRunner });
  } catch (error) {
    return {
      action,
      mode: 'unknown',
      allowed: false,
      state: 'unknown_action',
      providers: [],
      estimated_api_calls: { zkill: 0, esi: 0, total: 0 },
      request_control: null,
      blockers: [{
        code: error.code || 'LIVE_GATE_ERROR',
        message: error.message
      }],
      warnings: []
    };
  }
}

function watchGateForAction(action, executorStatus = {}) {
  const watchDriven = action === 'actor.watch' || action === 'system.radius.watch';
  if (!watchDriven) {
    return {
      applies: false,
      state: 'not_watch_driven'
    };
  }
  return {
    applies: true,
    session_armed: executorStatus.session_armed === true,
    active_task_id: executorStatus.active_task_id || null,
    state: executorStatus.session_armed === true ? 'armed' : 'disarmed',
    blocked_reason: executorStatus.session_armed === true ? null : 'session_not_armed'
  };
}

function scheduleGateForAction(action, schedule = {}) {
  if (action !== 'actor.watch' && action !== 'system.radius.watch') {
    return {
      applies: false,
      state: 'not_scheduled'
    };
  }
  const watchType = action === 'actor.watch' ? 'actor' : 'system_radius';
  const due = (schedule.due || []).filter((watch) => watch.watch_type === watchType);
  const blocked = (schedule.blocked || []).filter((watch) => watch.watch_type === watchType);
  return {
    applies: true,
    state: due.length ? 'due_consider_gates' : 'waiting_or_blocked',
    due_count: due.length,
    blocked_count: blocked.length,
    due: due.map(compactWatch),
    blocked: blocked.map(compactWatch)
  };
}

function matchingActiveTask(action, fingerprint, tasks = []) {
  const active = tasks.find((task) => (
    ['queued', 'running'].includes(task.status) &&
    (task.scope_key === fingerprint || task.scope_key === `${action}:${fingerprint}`)
  ));
  if (!active) {
    return {
      present: false,
      state: 'none'
    };
  }
  return {
    present: true,
    state: 'duplicate_or_active_task',
    task_id: active.task_id,
    task_type: active.type,
    scope_key: active.scope_key,
    status: active.status
  };
}

function postureFor({ providerBacked, liveGate, watchGate, activeTask, confirmation }) {
  const states = [];
  if (!providerBacked) {
    states.push('local_only_available');
  } else {
    states.push('future_external_io_if_off=held_by_external_io');
  }
  if (watchGate.applies && !watchGate.session_armed) {
    states.push('watch_arm_required');
  }
  if (activeTask.present) {
    states.push('active_task_wait');
  }
  if (liveGate && !liveGate.allowed) {
    states.push('blocked_by_live_gate');
  }
  if (confirmation.confirmation_required) {
    states.push('confirmation_required');
  }
  if (!states.length) {
    states.push('ready_by_current_readout');
  }
  return states;
}

function compactWatch(watch) {
  return {
    watch_type: watch.watch_type,
    watch_id: watch.watch_id,
    scope_key: watch.scope_key,
    scheduler_state: watch.scheduler_state,
    blocked_reasons: watch.blocked_reasons || [],
    next_poll_at: watch.next_poll_at || null,
    backoff_until: watch.backoff_until || null
  };
}

module.exports = {
  buildGateStackReadout
};
