const { buildAppReadiness, prepareAppRuntimePaths } = require('./appReadinessService');
const { getLiveApiGateState } = require('./liveApiGateService');
const {
  runActorWatchService,
  runAssessmentCreateService,
  runAssessmentGetService,
  runAssessmentListService,
  runManualDiscoveryService,
  runManualExpansionService,
  runMetadataHydrationService,
  runSdeInventoryImportService,
  runSdeTopologyImportService,
  runSystemRadiusWatchService,
  runWatchCreateService,
  runWatchListService,
  runWatchExecutorArmService,
  runWatchExecutorDisarmService,
  runWatchExecutorStatusService,
  runWatchExecutorTickService,
  runWatchRecordRunService,
  runWatchScheduleService,
  runWatchUpdateService
} = require('./mutatingActionService');
const { buildQueueExpansionSelection } = require('./queueSelectionService');
const { buildReportResponse } = require('./reportResponseService');
const { buildRetentionPreflight, listRetentionActions } = require('./retentionActionService');
const { getScopeDefaults, validateScope } = require('./scopeService');
const { defaultTaskRunner } = require('./taskRunner');

const COMMANDS = {
  'app.readiness': {
    classification: 'read-only',
    description: 'Return app readiness, settings, lookup status, path status, and live API gate state',
    handler: ({ db, databasePath }) => buildAppReadiness(db, { databasePath })
  },
  'app.prepare': {
    classification: 'metadata-only',
    description: 'Create approved runtime/cache directories for app operation',
    handler: ({ databasePath }) => prepareAppRuntimePaths({ databasePath })
  },
  'live.gate': {
    classification: 'read-only',
    description: 'Return live API gate state for all actions or one scoped action',
    handler: ({ payload }) => getLiveApiGateState(payload)
  },
  'manual.discovery': {
    classification: 'evidence-creating',
    description: 'Run user-led zKill discovery only and queue refs without ESI expansion',
    handler: ({ db, payload, ...context }) => runManualDiscoveryService(db, payload, context)
  },
  'manual.expansion': {
    classification: 'evidence-creating',
    description: 'Expand selected queued refs through ESI and persist evidence',
    handler: ({ db, payload, ...context }) => runManualExpansionService(db, payload, context)
  },
  'actor.watch': {
    classification: 'evidence-creating',
    description: 'Run an actor watch collection with scoped discovery and capped ESI expansion',
    handler: ({ db, payload, ...context }) => runActorWatchService(db, payload, context)
  },
  'system.radius.watch': {
    classification: 'evidence-creating',
    description: 'Run a system/radius watch collection with scoped discovery and capped ESI expansion',
    handler: ({ db, payload, ...context }) => runSystemRadiusWatchService(db, payload, context)
  },
  'metadata.hydration': {
    classification: 'metadata-only',
    description: 'Hydrate report-scoped entity labels through ESI names',
    handler: ({ db, payload, ...context }) => runMetadataHydrationService(db, payload, context)
  },
  'sde.import.topology': {
    classification: 'exclusive',
    description: 'Import local SDE topology/geography into SQLite lookup tables',
    handler: ({ db, payload }) => runSdeTopologyImportService(db, payload)
  },
  'sde.import.inventory': {
    classification: 'exclusive',
    description: 'Import local SDE inventory/type metadata into SQLite lookup tables',
    handler: ({ db, payload }) => runSdeInventoryImportService(db, payload)
  },
  'watch.create': {
    classification: 'metadata-only',
    description: 'Create or update a watchlist entity from a typed actor identity',
    handler: ({ db, payload, ...context }) => runWatchCreateService(db, payload, context)
  },
  'watch.update': {
    classification: 'metadata-only',
    description: 'Update a watchlist entity from a typed actor identity',
    handler: ({ db, payload, ...context }) => runWatchUpdateService(db, payload, context)
  },
  'watch.list': {
    classification: 'read-only',
    description: 'List watchlist entities',
    handler: ({ db }) => runWatchListService(db)
  },
  'watch.schedule': {
    classification: 'read-only',
    description: 'Return due, blocked, and backoff state for actor and system/radius watches',
    handler: ({ db, payload }) => runWatchScheduleService(db, payload)
  },
  'watch.recordRun': {
    classification: 'metadata-only',
    description: 'Record success/failure scheduling state after a watch run',
    handler: ({ db, payload }) => runWatchRecordRunService(db, payload)
  },
  'watch.executor.status': {
    classification: 'read-only',
    description: 'Return volatile session-armed watch executor state',
    handler: ({ db }) => runWatchExecutorStatusService(db)
  },
  'watch.executor.arm': {
    classification: 'evidence-creating',
    description: 'Arm the current app session and dispatch at most one due watch',
    handler: ({ db, payload, ...context }) => runWatchExecutorArmService(db, payload, context)
  },
  'watch.executor.disarm': {
    classification: 'metadata-only',
    description: 'Disarm the current app session watch executor',
    handler: ({ db, payload }) => runWatchExecutorDisarmService(db, payload)
  },
  'watch.executor.tick': {
    classification: 'evidence-creating',
    description: 'Run one session-armed watch executor tick',
    handler: ({ db, payload, ...context }) => runWatchExecutorTickService(db, payload, context)
  },
  'assessment.create': {
    classification: 'metadata-only',
    description: 'Create a deliberate assessment artifact separate from evidence',
    handler: ({ db, payload }) => runAssessmentCreateService(db, payload)
  },
  'assessment.list': {
    classification: 'read-only',
    description: 'List deliberate assessment artifacts',
    handler: ({ db, payload }) => runAssessmentListService(db, payload)
  },
  'assessment.get': {
    classification: 'read-only',
    description: 'Return one assessment artifact by ID',
    handler: ({ db, payload }) => runAssessmentGetService(db, payload)
  },
  'report.build': {
    classification: 'read-only',
    description: 'Build a structured report response by report type',
    handler: ({ db, payload }) => buildReportResponse(db, payload)
  },
  'report.actor': {
    classification: 'read-only',
    description: 'Build a structured actor evidence report response',
    handler: ({ db, payload }) => buildReportResponse(db, { ...payload, reportType: 'actor' })
  },
  'report.corporation': {
    classification: 'read-only',
    description: 'Build a structured corporation observation report response',
    handler: ({ db, payload }) => buildReportResponse(db, { ...payload, reportType: 'corporation' })
  },
  'report.queue': {
    classification: 'read-only',
    description: 'Build a structured discovery queue report response',
    handler: ({ db, payload }) => buildReportResponse(db, { ...payload, reportType: 'queue' })
  },
  'report.radius': {
    classification: 'read-only',
    description: 'Build a structured radius evidence report response',
    handler: ({ db, payload }) => buildReportResponse(db, { ...payload, reportType: 'radius' })
  },
  'report.run': {
    classification: 'read-only',
    description: 'Build a structured run diagnostics report response',
    handler: ({ db, payload }) => buildReportResponse(db, { ...payload, reportType: 'run' })
  },
  'report.system': {
    classification: 'read-only',
    description: 'Build a structured system evidence report response',
    handler: ({ db, payload }) => buildReportResponse(db, { ...payload, reportType: 'system' })
  },
  'retention.actions': {
    classification: 'read-only',
    description: 'List destructive/retention action definitions',
    handler: () => listRetentionActions()
  },
  'retention.preflight': {
    classification: 'read-only',
    description: 'Preview destructive/retention action impact and confirmation requirements',
    handler: ({ db, payload }) => buildRetentionPreflight(db, payload)
  },
  'queue.selection': {
    classification: 'read-only',
    description: 'Preview queued discovery refs selected for explicit ESI expansion',
    handler: ({ db, payload }) => buildQueueExpansionSelection(db, payload)
  },
  'scope.defaults': {
    classification: 'read-only',
    description: 'Return user-facing scope defaults for CLI, IPC, and UI controls',
    handler: () => getScopeDefaults()
  },
  'scope.validate': {
    classification: 'read-only',
    description: 'Validate and normalize a user-defined scope without running collection',
    handler: ({ db, payload }) => validateScope(payload, { db })
  },
  'task.list': {
    classification: 'read-only',
    description: 'Return recent backend task history',
    handler: ({ payload }) => defaultTaskRunner.listTasks({ limit: payload.limit || 20 })
  },
  'task.get': {
    classification: 'read-only',
    description: 'Return one backend task by task_id',
    handler: ({ payload }) => defaultTaskRunner.getTask(payload.task_id)
  },
  'task.cancel': {
    classification: 'read-only',
    description: 'Request cancellation for one running backend task',
    handler: ({ payload }) => defaultTaskRunner.cancelTask(payload.task_id, payload.reason || 'User requested cancellation')
  }
};

function listServiceCommands() {
  return Object.entries(COMMANDS).map(([command, definition]) => ({
    command,
    classification: definition.classification,
    description: definition.description
  }));
}

async function invokeServiceCommand(command, payload = {}, context = {}) {
  const definition = COMMANDS[command];
  if (!definition) {
    const error = new Error(`Unknown service command: ${command}`);
    error.code = 'UNKNOWN_SERVICE_COMMAND';
    throw error;
  }
  if (!context.db) {
    const error = new Error(`Service command ${command} requires a database context`);
    error.code = 'SERVICE_CONTEXT_MISSING_DB';
    throw error;
  }
  if (context.asTask) {
    const taskDefinition = {
      type: command,
      classification: definition.classification,
      scopeKey: payload.scopeKey || command
    };
    const taskHandler = async (task) => {
      task.progress({ stage: 'start', message: `Running ${command}` });
      const data = await definition.handler({ ...context, payload, signal: task.signal });
      task.progress({ stage: 'finish', message: `Finished ${command}` });
      return { status: 'succeeded', data };
    };
    if (context.detachedTask) {
      return defaultTaskRunner.runDetachedTask(taskDefinition, taskHandler);
    }
    return defaultTaskRunner.runTask(taskDefinition, taskHandler);
  }
  return definition.handler({ ...context, payload });
}

function registerIpcServiceHandlers(ipcMain, contextProvider) {
  if (!ipcMain?.handle) {
    throw new Error('registerIpcServiceHandlers requires Electron ipcMain.handle');
  }
  if (typeof contextProvider !== 'function') {
    throw new Error('registerIpcServiceHandlers requires a context provider function');
  }

  ipcMain.handle('atlas:service:list', () => listServiceCommands());
  ipcMain.handle('atlas:service:invoke', async (_event, request) => {
    const command = request?.command;
    const payload = request?.payload || {};
    return invokeServiceCommand(command, payload, {
      ...contextProvider(),
      asTask: request?.asTask === true,
      detachedTask: request?.detachedTask === true || request?.background === true
    });
  });
}

module.exports = {
  listServiceCommands,
  invokeServiceCommand,
  registerIpcServiceHandlers
};
