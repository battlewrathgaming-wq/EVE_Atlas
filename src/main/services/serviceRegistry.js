const { buildAppReadiness } = require('./appReadinessService');
const { getLiveApiGateState } = require('./liveApiGateService');
const { buildReportResponse } = require('./reportResponseService');
const { getScopeDefaults, validateScope } = require('./scopeService');
const { defaultTaskRunner } = require('./taskRunner');

const COMMANDS = {
  'app.readiness': {
    classification: 'read-only',
    description: 'Return app readiness, settings, lookup status, path status, and live API gate state',
    handler: ({ db, databasePath }) => buildAppReadiness(db, { databasePath })
  },
  'live.gate': {
    classification: 'read-only',
    description: 'Return live API gate state for all actions or one scoped action',
    handler: ({ payload }) => getLiveApiGateState(payload)
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
  'scope.defaults': {
    classification: 'read-only',
    description: 'Return user-facing scope defaults for CLI, IPC, and UI controls',
    handler: () => getScopeDefaults()
  },
  'scope.validate': {
    classification: 'read-only',
    description: 'Validate and normalize a user-defined scope without running collection',
    handler: ({ payload }) => validateScope(payload)
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
    return defaultTaskRunner.runTask({
      type: command,
      classification: definition.classification,
      scopeKey: payload.scopeKey || command
    }, async (task) => {
      task.progress({ stage: 'start', message: `Running ${command}` });
      const data = await definition.handler({ ...context, payload });
      task.progress({ stage: 'finish', message: `Finished ${command}` });
      return { status: 'succeeded', data };
    });
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
      asTask: request?.asTask === true
    });
  });
}

module.exports = {
  listServiceCommands,
  invokeServiceCommand,
  registerIpcServiceHandlers
};
