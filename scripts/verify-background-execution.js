const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const {
  invokeServiceCommand,
  registerIpcServiceHandlers
} = require('../src/main/services/serviceRegistry');
const { TASK_STATES } = require('../src/main/services/taskRunner');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    await withEnv({ AURA_ATLAS_LIVE_API: '1' }, async () => {
      const ipcMain = fakeIpcMain();
      registerIpcServiceHandlers(ipcMain, () => ({
        db,
        databasePath: ':memory:',
        zkillClient: delayedZkillClient(100)
      }));

      const started = await ipcMain.handlers.get('atlas:service:invoke')(null, {
        command: 'manual.discovery',
        payload: {
          scopeKey: 'background:manual-discovery',
          scope: 'actor',
          entityType: 'character',
          entityId: 90000002,
          entityName: 'Background Scout',
          lookbackSeconds: 86400,
          maxRefs: 1,
          confirmation: 'confirm:manual.discovery'
        },
        asTask: true,
        detachedTask: true
      });
      assert(started.status === TASK_STATES.RUNNING, 'detached service task should return immediately as running');

      const readiness = await ipcMain.handlers.get('atlas:service:invoke')(null, {
        command: 'app.readiness',
        payload: {}
      });
      assert(readiness.checks.db_initialized === true, 'readiness should respond while detached task is running');

      const taskList = await ipcMain.handlers.get('atlas:service:invoke')(null, {
        command: 'task.list',
        payload: { limit: 5 }
      });
      assert(taskList.some((task) => task.task_id === started.task_id && task.status === TASK_STATES.RUNNING), 'task.list should show running detached task');

      const locked = await invokeServiceCommand('manual.expansion', {
        scopeKey: 'background:manual-discovery',
        discoveredByType: 'manual_actor',
        discoveredById: 'character:90000002',
        maxExpansions: 1
      }, {
        db,
        asTask: true,
        detachedTask: true,
        esiClient: {
          async expandKillmail() {
            throw new Error('should not expand while locked');
          }
        }
      });
      assert(locked.status === TASK_STATES.FAILED, 'second evidence task with same scope should be lock-blocked');
      assert(locked.error.code === 'TASK_LOCKED', 'lock-blocked task should report TASK_LOCKED');

      const finished = await waitForTask(db, started.task_id);
      assert(finished.status === TASK_STATES.SUCCEEDED, 'detached task should eventually succeed');
      assert(finished.result.queued_refs_written === 1, 'detached task should keep command result');
      assert(count(db, 'discovered_killmail_refs') === 1, 'detached task should persist queued refs');
    });
  } finally {
    closeDatabase(db);
  }

  console.log('background execution verified');
}

function delayedZkillClient(delayMs) {
  return {
    async discoverRefs() {
      await delay(delayMs);
      return [{
        killmail_id: 92001,
        hash: 'hash_92001',
        preview: {
          killmail_time: '2026-05-22T12:00:00Z',
          victim: { ship_type_id: 587 },
          attacker_count: 1
        }
      }];
    }
  };
}

async function waitForTask(db, taskId) {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    const task = await invokeServiceCommand('task.get', { task_id: taskId }, { db });
    if (task && task.status !== TASK_STATES.RUNNING && task.status !== TASK_STATES.QUEUED) {
      return task;
    }
    await delay(25);
  }
  throw new Error(`Timed out waiting for task ${taskId}`);
}

function fakeIpcMain() {
  return {
    handlers: new Map(),
    handle(channel, handler) {
      this.handlers.set(channel, handler);
    }
  };
}

async function withEnv(values, callback) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === null) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    return await callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
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
