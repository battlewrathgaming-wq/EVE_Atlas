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
    db.prepare(`
      INSERT INTO solar_systems (
        solar_system_id, solar_system_name, constellation_id, constellation_name,
        region_id, region_name, security_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);

    const commands = listServiceCommands();
    const readinessCommand = commands.find((entry) => entry.command === 'app.readiness');
    const prepareCommand = commands.find((entry) => entry.command === 'app.prepare');
    const liveGateCommand = commands.find((entry) => entry.command === 'live.gate');
    const reportActorCommand = commands.find((entry) => entry.command === 'report.actor');
    const queueSelectionCommand = commands.find((entry) => entry.command === 'queue.selection');
    const retentionPreflightCommand = commands.find((entry) => entry.command === 'retention.preflight');
    const assessmentCreateCommand = commands.find((entry) => entry.command === 'assessment.create');
    const assessmentListCommand = commands.find((entry) => entry.command === 'assessment.list');
    const assessmentGetCommand = commands.find((entry) => entry.command === 'assessment.get');
    const scopeDefaultsCommand = commands.find((entry) => entry.command === 'scope.defaults');
    const scopeValidateCommand = commands.find((entry) => entry.command === 'scope.validate');
    const taskListCommand = commands.find((entry) => entry.command === 'task.list');
    const taskCancelCommand = commands.find((entry) => entry.command === 'task.cancel');
    const manualDiscoveryCommand = commands.find((entry) => entry.command === 'manual.discovery');
    const manualExpansionCommand = commands.find((entry) => entry.command === 'manual.expansion');
    const actorWatchCommand = commands.find((entry) => entry.command === 'actor.watch');
    const systemRadiusWatchCommand = commands.find((entry) => entry.command === 'system.radius.watch');
    const metadataHydrationCommand = commands.find((entry) => entry.command === 'metadata.hydration');
    const sdeBuildLookupsCommand = commands.find((entry) => entry.command === 'sde.build-lookups');
    const watchCreateCommand = commands.find((entry) => entry.command === 'watch.create');
    const watchListCommand = commands.find((entry) => entry.command === 'watch.list');
    const watchScheduleCommand = commands.find((entry) => entry.command === 'watch.schedule');
    const watchRecordRunCommand = commands.find((entry) => entry.command === 'watch.recordRun');
    const watchExecutorStatusCommand = commands.find((entry) => entry.command === 'watch.executor.status');
    const watchExecutorArmCommand = commands.find((entry) => entry.command === 'watch.executor.arm');
    const watchExecutorDisarmCommand = commands.find((entry) => entry.command === 'watch.executor.disarm');
    const watchExecutorTickCommand = commands.find((entry) => entry.command === 'watch.executor.tick');
    assert(readinessCommand, 'app.readiness should be listed');
    assert(readinessCommand.classification === 'read-only', 'app.readiness should be read-only');
    assert(prepareCommand, 'app.prepare should be listed');
    assert(prepareCommand.classification === 'metadata-only', 'app.prepare should be metadata-only');
    assert(liveGateCommand, 'live.gate should be listed');
    assert(liveGateCommand.classification === 'read-only', 'live.gate should be read-only');
    assert(reportActorCommand, 'report.actor should be listed');
    assert(reportActorCommand.classification === 'read-only', 'report.actor should be read-only');
    assert(queueSelectionCommand, 'queue.selection should be listed');
    assert(queueSelectionCommand.classification === 'read-only', 'queue.selection should be read-only');
    assert(retentionPreflightCommand, 'retention.preflight should be listed');
    assert(retentionPreflightCommand.classification === 'read-only', 'retention.preflight should be read-only');
    assert(assessmentCreateCommand, 'assessment.create should be listed');
    assert(assessmentCreateCommand.classification === 'metadata-only', 'assessment.create should be metadata-only');
    assert(assessmentListCommand, 'assessment.list should be listed');
    assert(assessmentListCommand.classification === 'read-only', 'assessment.list should be read-only');
    assert(assessmentGetCommand, 'assessment.get should be listed');
    assert(assessmentGetCommand.classification === 'read-only', 'assessment.get should be read-only');
    assert(scopeDefaultsCommand, 'scope.defaults should be listed');
    assert(scopeDefaultsCommand.classification === 'read-only', 'scope.defaults should be read-only');
    assert(scopeValidateCommand, 'scope.validate should be listed');
    assert(scopeValidateCommand.classification === 'read-only', 'scope.validate should be read-only');
    assert(taskListCommand, 'task.list should be listed');
    assert(taskListCommand.classification === 'read-only', 'task.list should be read-only');
    assert(taskCancelCommand, 'task.cancel should be listed');
    assert(taskCancelCommand.classification === 'read-only', 'task.cancel should be read-only');
    assert(manualDiscoveryCommand?.classification === 'evidence-creating', 'manual.discovery should be evidence-creating');
    assert(manualExpansionCommand?.classification === 'evidence-creating', 'manual.expansion should be evidence-creating');
    assert(actorWatchCommand?.classification === 'evidence-creating', 'actor.watch should be evidence-creating');
    assert(systemRadiusWatchCommand?.classification === 'evidence-creating', 'system.radius.watch should be evidence-creating');
    assert(metadataHydrationCommand?.classification === 'metadata-only', 'metadata.hydration should be metadata-only');
    assert(sdeBuildLookupsCommand?.classification === 'exclusive', 'sde.build-lookups should be exclusive');
    assert(watchCreateCommand?.classification === 'metadata-only', 'watch.create should be metadata-only');
    assert(watchListCommand?.classification === 'read-only', 'watch.list should be read-only');
    assert(watchScheduleCommand?.classification === 'read-only', 'watch.schedule should be read-only');
    assert(watchRecordRunCommand?.classification === 'metadata-only', 'watch.recordRun should be metadata-only');
    assert(watchExecutorStatusCommand?.classification === 'read-only', 'watch.executor.status should be read-only');
    assert(watchExecutorArmCommand?.classification === 'evidence-creating', 'watch.executor.arm should be evidence-creating');
    assert(watchExecutorDisarmCommand?.classification === 'metadata-only', 'watch.executor.disarm should be metadata-only');
    assert(watchExecutorTickCommand?.classification === 'evidence-creating', 'watch.executor.tick should be evidence-creating');

    const readiness = await invokeServiceCommand('app.readiness', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(readiness.checks.migrations_applied === true, 'readiness command should return migrated DB state');
    assert(readiness.app.name === 'AURA Atlas', 'readiness command should return app identity');

    const liveGate = await invokeServiceCommand('live.gate', {
      action: 'manual.expansion',
      input: { maxExpansions: 2 }
    }, { db });
    assert(liveGate.mode === 'live-required', 'manual expansion should be live-required');
    assert(liveGate.estimated_api_calls.esi === 2, 'manual expansion should estimate ESI calls from cap');

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

    const namedSystemScope = await invokeServiceCommand('scope.validate', {
      kind: 'manual_discovery',
      input: {
        scope: 'system',
        centerSystemName: 'Atlas Prime'
      }
    }, { db });
    assert(namedSystemScope.normalized.centerSystemId === 30000001, 'scope.validate should resolve system names locally when DB context is available');
    assert(namedSystemScope.normalized.radiusJumps === 0, 'named system discovery should remain radius 0');

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
          centerSystemName: 'Atlas Prime',
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
