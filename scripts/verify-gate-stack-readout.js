const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { resetLiveGateState, requestControlFor } = require('../src/main/services/liveApiGateService');
const { TaskRunner, TASK_CLASSIFICATIONS } = require('../src/main/services/taskRunner');
const { buildWatchScheduleStatus } = require('../src/main/watchlist/watchScheduler');
const { auraTempRoot } = require('../src/main/util/tempPaths');

async function main() {
  const previousLiveApi = process.env.AURA_ATLAS_LIVE_API;
  delete process.env.AURA_ATLAS_LIVE_API;
  resetLiveGateState();

  const db = openDatabase(':memory:');
  migrate(db);
  const taskRunner = new TaskRunner();
  let activeTask = null;
  try {
    seedWatch(db);
    activeTask = startActiveActorWatchTask(taskRunner);
    const before = sideEffectCounts(db);
    const armedReadout = await invokeServiceCommand('support.gate_stack_readout', {
      externalIoState: 'off'
    }, {
      db,
      databasePath: path.join(auraTempRoot(), 'gate-stack-readout.sqlite'),
      taskRunner,
      watchExecutor: fixtureWatchExecutor({ sessionArmed: true, liveApiEnabled: true })
    });
    const afterArmed = sideEffectCounts(db);
    assertSame(afterArmed, before, 'armed gate-stack readout should not mutate DB tables');

    const disarmedReadout = await invokeServiceCommand('support.gate_stack_readout', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'gate-stack-readout.sqlite'),
      taskRunner,
      watchExecutor: fixtureWatchExecutor({ sessionArmed: false, liveApiEnabled: false })
    });
    const afterDisarmed = sideEffectCounts(db);
    assertSame(afterDisarmed, before, 'disarmed gate-stack readout should not mutate DB tables');

    verifyArmedReadout(armedReadout);
    verifyDisarmedReadout(disarmedReadout);
    verifyCommand();

    console.log(JSON.stringify({
      status: 'gate stack readout verified',
      external_io: armedReadout.external_io,
      sample_actor_watch_stack: compactStack(stackFor(armedReadout, 'actor.watch')),
      sample_local_stack: compactStack(stackFor(armedReadout, 'report.view')),
      active_task_count: armedReadout.active_tasks.active_count,
      boundary: armedReadout.boundary
    }, null, 2));
  } finally {
    if (activeTask) {
      taskRunner.cancelTask(activeTask.task_id, 'verify gate-stack readout cleanup');
    }
    closeDatabase(db);
    resetLiveGateState();
    if (previousLiveApi === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = previousLiveApi;
    }
  }
}

function seedWatch(db) {
  db.prepare(`
    INSERT INTO watchlist_entities (
      entity_type, entity_id, entity_name, lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes, next_poll_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('character', 90000001, 'Gate Stack Pilot', 30, 1, 1, 60, '2026-05-26T00:00:00.000Z', 'gate-stack fixture');
}

function startActiveActorWatchTask(taskRunner) {
  const requestControl = requestControlFor('actor.watch', {
    entityType: 'character',
    entityId: 90000001,
    maxRefs: 1,
    maxExpansions: 1
  });
  return taskRunner.runDetachedTask({
    type: 'actor.watch',
    classification: TASK_CLASSIFICATIONS.EVIDENCE_CREATING,
    scopeKey: requestControl.scope_fingerprint
  }, async (task) => new Promise((resolve) => {
    task.signal.addEventListener('abort', () => resolve({
      status: 'cancelled',
      data: { cancelled: true }
    }));
  }));
}

function fixtureWatchExecutor({ sessionArmed, liveApiEnabled }) {
  return {
    status(db) {
      return {
        session_armed: sessionArmed,
        active_task_id: null,
        poll_interval_ms: 60000,
        last_tick: null,
        last_dispatch: null,
        last_blocked_reason: sessionArmed ? null : 'session_not_armed',
        schedule: buildWatchScheduleStatus(db, {
          now: '2026-05-27T00:00:00.000Z',
          sessionArmed,
          liveApiEnabled
        })
      };
    }
  };
}

function verifyArmedReadout(readout) {
  assert(readout.read_only === true, 'gate-stack readout should be read-only');
  assert(readout.mutates_state === false, 'gate-stack readout should not mutate state');
  assert(readout.external_io.implementation_state === 'policy_only_not_implemented', 'external_io should be policy-only/not implemented');
  assert(readout.external_io.enforced === false, 'external_io should not be enforced');
  assert(readout.command_inventory.provider_backed.includes('manual.discovery'), 'provider-backed inventory should include manual.discovery');
  assert(readout.command_inventory.local_only.includes('app.readiness'), 'local-only inventory should include app.readiness');

  const actorWatch = stackFor(readout, 'actor.watch');
  assert(actorWatch.provider_backed === true, 'actor.watch should be provider-backed');
  assert(actorWatch.gates.schedule.due_count === 1, 'actor.watch schedule should report due posture');
  assert(actorWatch.gates.watch_arming.state === 'armed', 'Watch arming should be reported separately as armed');
  assert(actorWatch.gates.external_io.readout_if_future_off === 'held_by_external_io', 'future external_io-off posture should be held_by_external_io');
  assert(actorWatch.gates.external_io.enforced === false, 'held_by_external_io must not be enforced');
  assert(actorWatch.gates.external_api.allowed === false, 'live.gate should remain blocked while live API env is disabled');
  assert(actorWatch.gates.external_api.blockers.some((entry) => entry.code === 'LIVE_API_DISABLED'), 'live.gate blocker should remain visible');
  assert(actorWatch.gates.storage_safety.enforcement_state === 'not_implemented_in_hs111', 'storage safety should stay separate and non-enforcing');
  assert(actorWatch.gates.confirmation.confirmation_required === true, 'confirmation requirement should be reported separately');
  assert(actorWatch.gates.active_task.present === true, 'active duplicate task should be reported separately');
  assert(actorWatch.readout_posture.includes('future_external_io_if_off=held_by_external_io'), 'posture should include future external_io hold');
  assert(actorWatch.readout_posture.includes('blocked_by_live_gate'), 'posture should include live.gate block separately');

  const local = stackFor(readout, 'report.view');
  assert(local.provider_backed === false, 'report.view should be local-only');
  assert(local.gates.external_io.readout_if_future_off === 'local_only_available', 'local-only surfaces should remain available under future external_io off');
  assert(local.readout_posture.includes('local_only_available'), 'local-only posture should be distinct from provider-backed posture');
}

function verifyDisarmedReadout(readout) {
  const actorWatch = stackFor(readout, 'actor.watch');
  assert(actorWatch.gates.watch_arming.state === 'disarmed', 'disarmed Watch state should be reported separately');
  assert(actorWatch.readout_posture.includes('watch_arm_required'), 'disarmed provider-backed work should report arm requirement');
  assert(actorWatch.gates.schedule.state === 'waiting_or_blocked', 'disarmed schedule should remain waiting/blocked, not failed');
}

function verifyCommand() {
  const command = listServiceCommands().find((entry) => entry.command === 'support.gate_stack_readout');
  assert(command, 'support.gate_stack_readout should be listed');
  assert(command.classification === 'read-only', 'support.gate_stack_readout should be read-only');
  assert(command.effects.includes('read-only'), 'support.gate_stack_readout should declare read-only effect');
  assert(command.renderer_allowed === true, 'support.gate_stack_readout should be renderer eligible');
}

function stackFor(readout, action) {
  const stack = readout.gate_stacks.find((entry) => entry.action === action);
  assert(stack, `${action} stack should exist`);
  return stack;
}

function compactStack(stack) {
  return {
    action: stack.action,
    provider_backed: stack.provider_backed,
    schedule_state: stack.gates.schedule.state,
    watch_arming_state: stack.gates.watch_arming.state,
    external_io_if_off: stack.gates.external_io.readout_if_future_off,
    live_gate_allowed: stack.gates.external_api.allowed,
    storage_enforcement: stack.gates.storage_safety.enforcement_state,
    active_task_state: stack.gates.active_task.state,
    confirmation_required: stack.gates.confirmation.confirmation_required,
    readout_posture: stack.readout_posture
  };
}

function sideEffectCounts(db) {
  return {
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    metadata_runs: count(db, 'metadata_runs'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
