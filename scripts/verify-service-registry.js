const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const {
  invokeServiceCommand,
  listServiceCommands,
  registerIpcServiceHandlers
} = require('../src/main/services/serviceRegistry');
const { auraTempRoot } = require('../src/main/util/tempPaths');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const commands = listServiceCommands();
    const readinessCommand = commands.find((entry) => entry.command === 'app.readiness');
    const scopeDefaultsCommand = commands.find((entry) => entry.command === 'scope.defaults');
    const scopeValidateCommand = commands.find((entry) => entry.command === 'scope.validate');
    const taskListCommand = commands.find((entry) => entry.command === 'task.list');
    assert(readinessCommand, 'app.readiness should be listed');
    assert(readinessCommand.classification === 'read-only', 'app.readiness should be read-only');
    assert(scopeDefaultsCommand, 'scope.defaults should be listed');
    assert(scopeDefaultsCommand.classification === 'read-only', 'scope.defaults should be read-only');
    assert(scopeValidateCommand, 'scope.validate should be listed');
    assert(scopeValidateCommand.classification === 'read-only', 'scope.validate should be read-only');
    assert(taskListCommand, 'task.list should be listed');
    assert(taskListCommand.classification === 'read-only', 'task.list should be read-only');

    const readiness = await invokeServiceCommand('app.readiness', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(readiness.checks.migrations_applied === true, 'readiness command should return migrated DB state');
    assert(readiness.app.name === 'AURA Atlas', 'readiness command should return app identity');

    const defaults = await invokeServiceCommand('scope.defaults', {}, { db });
    assert(defaults.manualActorDiscovery.maxRefs === 20, 'scope defaults should include manual actor defaults');

    const validated = await invokeServiceCommand('scope.validate', {
      kind: 'manual_discovery',
      input: {
        scope: 'actor',
        entityType: 'character',
        entityId: 90000002
      }
    }, { db });
    assert(validated.valid === true, 'scope.validate should return valid result');
    assert(validated.normalized.lookbackSeconds === defaults.manualActorDiscovery.lookbackSeconds, 'scope.validate should apply defaults');

    await assertRejects(
      () => invokeServiceCommand('scope.validate', {
        kind: 'actor_watch',
        input: {
          entityType: 'system',
          entityId: 30000001
        }
      }, { db }),
      'invalid typed actor scope should be rejected'
    );

    await assertRejects(
      () => invokeServiceCommand('evidence.rawInsert', {}, { db }),
      'unknown evidence command should be rejected'
    );
    await assertRejects(
      () => invokeServiceCommand('app.readiness', {}, {}),
      'missing DB context should be rejected'
    );

    const ipcMain = fakeIpcMain();
    registerIpcServiceHandlers(ipcMain, () => ({
      db,
      databasePath: path.join(auraTempRoot(), 'ipc-readiness.sqlite')
    }));
    assert(ipcMain.handlers.has('atlas:service:list'), 'IPC list handler should be registered');
    assert(ipcMain.handlers.has('atlas:service:invoke'), 'IPC invoke handler should be registered');
    const ipcReadiness = await ipcMain.handlers.get('atlas:service:invoke')(null, {
      command: 'app.readiness',
      payload: {}
    });
    assert(ipcReadiness.checks.db_initialized === true, 'IPC invoke should return readiness object');

    const ipcScope = await ipcMain.handlers.get('atlas:service:invoke')(null, {
      command: 'scope.validate',
      payload: {
        kind: 'system_radius_watch',
        input: {
          centerSystemId: 30000001,
          radiusJumps: 1
        }
      }
    });
    assert(ipcScope.normalized.maxExpansions === 2, 'IPC scope validation should apply system watch defaults');

    const taskWrappedReadiness = await ipcMain.handlers.get('atlas:service:invoke')(null, {
      command: 'app.readiness',
      payload: {},
      asTask: true
    });
    assert(taskWrappedReadiness.status === 'succeeded', 'asTask service call should return succeeded task');
    assert(taskWrappedReadiness.result.checks.db_initialized === true, 'asTask result should include command data');

    const taskHistory = await invokeServiceCommand('task.list', { limit: 5 }, { db });
    assert(taskHistory.some((task) => task.task_id === taskWrappedReadiness.task_id), 'task.list should include task-wrapped command');
  } finally {
    closeDatabase(db);
  }

  console.log('service registry verified');
}

function fakeIpcMain() {
  return {
    handlers: new Map(),
    handle(channel, handler) {
      this.handlers.set(channel, handler);
    }
  };
}

async function assertRejects(fn, message) {
  try {
    await fn();
  } catch {
    return;
  }
  throw new Error(message);
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
