const { buildAppReadiness } = require('./appReadinessService');
const { getScopeDefaults, validateScope } = require('./scopeService');

const COMMANDS = {
  'app.readiness': {
    classification: 'read-only',
    description: 'Return app readiness, settings, lookup status, path status, and live API gate state',
    handler: ({ db, databasePath }) => buildAppReadiness(db, { databasePath })
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
    return invokeServiceCommand(command, payload, contextProvider());
  });
}

module.exports = {
  listServiceCommands,
  invokeServiceCommand,
  registerIpcServiceHandlers
};
