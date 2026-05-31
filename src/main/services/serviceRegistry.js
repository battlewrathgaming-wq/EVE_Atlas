const { buildAppReadiness, prepareAppRuntimePaths } = require('./appReadinessService');
const { actionGate, getLiveApiGateState } = require('./liveApiGateService');
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
  runWatchOfflineReadoutService,
  runWatchRecordRunService,
  runWatchScheduleService,
  runWatchUpdateService
} = require('./mutatingActionService');
const { buildQueueExpansionSelection } = require('./queueSelectionService');
const { buildReportResponse } = require('./reportResponseService');
const { buildRetentionPreflight, listRetentionActions } = require('./retentionActionService');
const { buildSdeLookupTables } = require('../sde/sdeLookupBuilder');
const {
  buildRuntimeDbSnapshotPreflight,
  createRuntimeDbSnapshot,
  loadRuntimeSnapshotSettings,
  saveRuntimeSnapshotSettings
} = require('./runtimeSnapshotService');
const { buildGateStackReadout } = require('./gateStackReadoutService');
const { buildStorageAuthorityPreflight } = require('./storageAuthorityPreflightService');
const { buildStorageAuthorityConfigWriteProof } = require('./storageAuthorityConfigWriteService');
const { buildStorageSetupGateReadout } = require('./storageSetupGateReadoutService');
const { writeOperatorDebugTracePack } = require('../support/operatorDebugTracePack');
const { getScopeDefaults, validateScope } = require('./scopeService');
const { defaultTaskRunner } = require('./taskRunner');

const EFFECTS = Object.freeze({
  READ_ONLY: 'read-only',
  RUNTIME_CONTROL: 'runtime-control',
  LOCAL_DATA_MUTATION: 'local-data-mutation',
  EXTERNAL_LIVE_API: 'external-live-api',
  EVIDENCE_CREATION: 'evidence-creation',
  METADATA_READABILITY: 'metadata-readability',
  SUPPORT_ARTIFACT: 'support-artifact',
  DESTRUCTIVE_PREVIEW: 'destructive-preview'
});

const CONFIRMATION = Object.freeze({
  MANUAL_DISCOVERY: 'confirm:manual.discovery',
  MANUAL_EXPANSION: 'confirm:manual.expansion',
  ACTOR_WATCH: 'confirm:actor.watch',
  SYSTEM_RADIUS_WATCH: 'confirm:system.radius.watch',
  METADATA_HYDRATION: 'confirm:metadata.hydration',
  SDE_BUILD_LOOKUPS: 'confirm:sde.build-lookups',
  WATCH_CREATE: 'confirm:watch.create',
  WATCH_EXECUTOR_ARM: 'confirm:watch.executor.arm',
  WATCH_EXECUTOR_TICK: 'confirm:watch.executor.tick',
  ASSESSMENT_CREATE: 'confirm:assessment.create',
  RUNTIME_DB_SNAPSHOT_CREATE: 'confirm:runtime.db_snapshot.create',
  SUPPORT_DEBUG_TRACE_PACK: 'confirm:support.debug_trace_pack',
  TASK_CANCEL: 'confirm:task.cancel'
});

const COMMANDS = {
  'app.readiness': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Return app readiness, settings, lookup status, path status, and live API gate state',
    handler: ({ db, databasePath }) => buildAppReadiness(db, { databasePath })
  },
  'app.prepare': {
    classification: 'metadata-only',
    effects: [EFFECTS.RUNTIME_CONTROL, EFFECTS.LOCAL_DATA_MUTATION],
    renderer: true,
    description: 'Create approved runtime/cache directories for app operation',
    handler: ({ databasePath }) => prepareAppRuntimePaths({ databasePath })
  },
  'live.gate': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Return live API gate state for all actions or one scoped action',
    handler: ({ payload }) => getLiveApiGateState(payload)
  },
  'manual.discovery': {
    classification: 'evidence-creating',
    effects: [EFFECTS.EXTERNAL_LIVE_API, EFFECTS.LOCAL_DATA_MUTATION],
    renderer: true,
    authority: confirmationAuthority(CONFIRMATION.MANUAL_DISCOVERY, 'Manual discovery makes live zKill calls and writes discovery refs as possible leads.'),
    description: 'Run user-led zKill discovery only and queue refs without ESI expansion',
    handler: ({ db, payload, ...context }) => runManualDiscoveryService(db, payload, context)
  },
  'manual.expansion': {
    classification: 'evidence-creating',
    effects: [EFFECTS.EXTERNAL_LIVE_API, EFFECTS.EVIDENCE_CREATION],
    renderer: true,
    authority: confirmationAuthority(CONFIRMATION.MANUAL_EXPANSION, 'Manual expansion calls ESI and writes expanded killmail evidence.'),
    description: 'Expand selected queued refs through ESI and persist evidence',
    handler: ({ db, payload, ...context }) => runManualExpansionService(db, payload, context)
  },
  'actor.watch': {
    classification: 'evidence-creating',
    effects: [EFFECTS.EXTERNAL_LIVE_API, EFFECTS.EVIDENCE_CREATION, EFFECTS.LOCAL_DATA_MUTATION],
    renderer: false,
    authority: confirmationAuthority(CONFIRMATION.ACTOR_WATCH, 'Actor watch execution can call live providers and write evidence.'),
    description: 'Run an actor watch collection with scoped discovery and capped ESI expansion',
    handler: ({ db, payload, ...context }) => runActorWatchService(db, payload, context)
  },
  'system.radius.watch': {
    classification: 'evidence-creating',
    effects: [EFFECTS.EXTERNAL_LIVE_API, EFFECTS.EVIDENCE_CREATION, EFFECTS.LOCAL_DATA_MUTATION],
    renderer: false,
    authority: confirmationAuthority(CONFIRMATION.SYSTEM_RADIUS_WATCH, 'System/radius watch execution can call live providers and write evidence.'),
    description: 'Run a system/radius watch collection with scoped discovery and capped ESI expansion',
    handler: ({ db, payload, ...context }) => runSystemRadiusWatchService(db, payload, context)
  },
  'metadata.hydration': {
    classification: 'metadata-only',
    effects: [EFFECTS.EXTERNAL_LIVE_API, EFFECTS.METADATA_READABILITY],
    renderer: true,
    authority: confirmationAuthority(CONFIRMATION.METADATA_HYDRATION, 'Metadata hydration calls ESI names and updates readability labels only.'),
    description: 'Hydrate report-scoped entity labels through ESI names',
    handler: ({ db, payload, ...context }) => runMetadataHydrationService(db, payload, context)
  },
  'sde.import.topology': {
    classification: 'exclusive',
    effects: [EFFECTS.METADATA_READABILITY, EFFECTS.LOCAL_DATA_MUTATION],
    renderer: false,
    description: 'Import local SDE topology/geography into SQLite lookup tables',
    handler: ({ db, payload }) => runSdeTopologyImportService(db, payload)
  },
  'sde.import.inventory': {
    classification: 'exclusive',
    effects: [EFFECTS.METADATA_READABILITY, EFFECTS.LOCAL_DATA_MUTATION],
    renderer: false,
    description: 'Import local SDE inventory/type metadata into SQLite lookup tables',
    handler: ({ db, payload }) => runSdeInventoryImportService(db, payload)
  },
  'sde.build-lookups': {
    classification: 'exclusive',
    effects: [EFFECTS.EXTERNAL_LIVE_API, EFFECTS.METADATA_READABILITY, EFFECTS.LOCAL_DATA_MUTATION],
    renderer: false,
    authority: confirmationAuthority(CONFIRMATION.SDE_BUILD_LOOKUPS, 'SDE lookup build may download source data and rewrites local lookup metadata.'),
    description: 'Download or read SDE JSONL source, build local lookup tables, then remove source files by default',
    handler: ({ db, payload, signal }) => runSdeLookupBuildCommand(db, payload, { signal })
  },
  'watch.create': {
    classification: 'metadata-only',
    effects: [EFFECTS.LOCAL_DATA_MUTATION],
    renderer: true,
    authority: confirmationAuthority(CONFIRMATION.WATCH_CREATE, 'Watch authoring writes local watch intent metadata without running collection.'),
    description: 'Create or update a watchlist entity from a typed actor identity',
    handler: ({ db, payload, ...context }) => runWatchCreateService(db, payload, context)
  },
  'watch.update': {
    classification: 'metadata-only',
    effects: [EFFECTS.LOCAL_DATA_MUTATION],
    renderer: false,
    authority: confirmationAuthority(CONFIRMATION.WATCH_CREATE, 'Watch updates write local watch intent metadata without running collection.'),
    description: 'Update a watchlist entity from a typed actor identity',
    handler: ({ db, payload, ...context }) => runWatchUpdateService(db, payload, context)
  },
  'watch.list': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'List watchlist entities',
    handler: ({ db }) => runWatchListService(db)
  },
  'watch.schedule': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Return due, blocked, and backoff state for actor and system/radius watches',
    handler: ({ db, payload }) => runWatchScheduleService(db, payload)
  },
  'watch.offline_readout': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Return the read-only Watch_offline support model from local watch, executor, queue, and evidence state',
    handler: ({ db, payload }) => runWatchOfflineReadoutService(db, payload)
  },
  'watch.recordRun': {
    classification: 'metadata-only',
    effects: [EFFECTS.LOCAL_DATA_MUTATION],
    renderer: false,
    description: 'Record success/failure scheduling state after a watch run',
    handler: ({ db, payload }) => runWatchRecordRunService(db, payload)
  },
  'watch.executor.status': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Return volatile session-armed watch executor state',
    handler: ({ db }) => runWatchExecutorStatusService(db)
  },
  'watch.executor.arm': {
    classification: 'evidence-creating',
    effects: [EFFECTS.RUNTIME_CONTROL, EFFECTS.EXTERNAL_LIVE_API, EFFECTS.EVIDENCE_CREATION],
    renderer: true,
    authority: confirmationAuthority(CONFIRMATION.WATCH_EXECUTOR_ARM, 'Arming can dispatch a due watch that calls live providers and writes evidence.'),
    description: 'Arm the current app session and dispatch at most one due watch',
    handler: ({ db, payload, ...context }) => runWatchExecutorArmService(db, payload, context)
  },
  'watch.executor.disarm': {
    classification: 'metadata-only',
    effects: [EFFECTS.RUNTIME_CONTROL],
    renderer: true,
    description: 'Disarm the current app session watch executor',
    handler: ({ db, payload }) => runWatchExecutorDisarmService(db, payload)
  },
  'watch.executor.tick': {
    classification: 'evidence-creating',
    effects: [EFFECTS.RUNTIME_CONTROL, EFFECTS.EXTERNAL_LIVE_API, EFFECTS.EVIDENCE_CREATION],
    renderer: false,
    authority: confirmationAuthority(CONFIRMATION.WATCH_EXECUTOR_TICK, 'A watch executor tick can dispatch live provider work and write evidence.'),
    description: 'Run one session-armed watch executor tick',
    handler: ({ db, payload, ...context }) => runWatchExecutorTickService(db, payload, context)
  },
  'assessment.create': {
    classification: 'metadata-only',
    effects: [EFFECTS.LOCAL_DATA_MUTATION],
    renderer: true,
    authority: confirmationAuthority(CONFIRMATION.ASSESSMENT_CREATE, 'Assessment creation writes deliberate operator memory, not evidence.'),
    description: 'Create a deliberate assessment artifact separate from evidence',
    handler: ({ db, payload }) => runAssessmentCreateService(db, payload)
  },
  'assessment.list': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'List deliberate assessment artifacts',
    handler: ({ db, payload }) => runAssessmentListService(db, payload)
  },
  'assessment.get': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Return one assessment artifact by ID',
    handler: ({ db, payload }) => runAssessmentGetService(db, payload)
  },
  'report.build': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: false,
    description: 'Build a structured report response by report type',
    handler: ({ db, payload }) => buildReportResponse(db, payload)
  },
  'report.actor': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Build a structured actor evidence report response',
    handler: ({ db, payload }) => buildReportResponse(db, { ...payload, reportType: 'actor' })
  },
  'report.corporation': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Build a structured corporation observation report response',
    handler: ({ db, payload }) => buildReportResponse(db, { ...payload, reportType: 'corporation' })
  },
  'report.corpus_health': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Build a structured local evidence corpus health report response',
    handler: ({ db }) => buildReportResponse(db, { reportType: 'corpus_health' })
  },
  'report.queue': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Build a structured discovery queue report response',
    handler: ({ db, payload }) => buildReportResponse(db, { ...payload, reportType: 'queue' })
  },
  'report.radius': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Build a structured radius evidence report response',
    handler: ({ db, payload }) => buildReportResponse(db, { ...payload, reportType: 'radius' })
  },
  'report.run': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Build a structured run diagnostics report response',
    handler: ({ db, payload }) => buildReportResponse(db, { ...payload, reportType: 'run' })
  },
  'report.system': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Build a structured system evidence report response',
    handler: ({ db, payload }) => buildReportResponse(db, { ...payload, reportType: 'system' })
  },
  'retention.actions': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: false,
    description: 'List destructive/retention action definitions',
    handler: () => listRetentionActions()
  },
  'retention.preflight': {
    classification: 'read-only',
    effects: [EFFECTS.DESTRUCTIVE_PREVIEW],
    renderer: false,
    description: 'Preview destructive/retention action impact and confirmation requirements',
    handler: ({ db, payload }) => buildRetentionPreflight(db, payload)
  },
  'runtime.db_snapshot.preflight': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Preview runtime DB snapshot destination, counts, and freshness without writing',
    handler: ({ db, payload, ...context }) => buildRuntimeDbSnapshotPreflight(db, payload, context)
  },
  'storage.authority_preflight': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Report runtime DB, support-artifact, temp/cache/SDE, and byte-usage posture without writing',
    handler: ({ payload, ...context }) => buildStorageAuthorityPreflight(payload, context)
  },
  'storage.setup_gate_readout': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Report storage setup and disk-budget gate posture without enforcing lockout or changing storage',
    handler: ({ payload, ...context }) => buildStorageSetupGateReadout(payload, context)
  },
  'storage.authority_config.write_proof': {
    classification: 'metadata-only',
    effects: [EFFECTS.LOCAL_DATA_MUTATION],
    renderer: false,
    description: 'Write and read back a fixture-only storage authority config proof without enforcement or provider movement',
    handler: ({ payload, ...context }) => buildStorageAuthorityConfigWriteProof(payload, context)
  },
  'support.gate_stack_readout': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Read provider-backed work gate stack posture without enforcing external_io, storage, or provider movement',
    handler: ({ payload, ...context }) => buildGateStackReadout(context.db, payload, {
      ...context,
      commandMetadata: listServiceCommands()
    })
  },
  'runtime.db_snapshot.settings.get': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Return validated runtime DB snapshot destination and budget settings',
    handler: ({ payload, ...context }) => loadRuntimeSnapshotSettings(snapshotSettingsOptionsForContext(payload, context))
  },
  'runtime.db_snapshot.settings.update': {
    classification: 'metadata-only',
    effects: [EFFECTS.LOCAL_DATA_MUTATION],
    renderer: true,
    description: 'Validate and persist runtime DB snapshot destination and budget settings',
    handler: ({ payload, ...context }) => saveRuntimeSnapshotSettings(payload, {
      ...snapshotSettingsOptionsForContext(payload, context),
      allowInputSettingsPath: context.source !== 'renderer'
    })
  },
  'runtime.db_snapshot.create': {
    classification: 'exclusive',
    effects: [EFFECTS.SUPPORT_ARTIFACT],
    renderer: true,
    authority: confirmationAuthority(CONFIRMATION.RUNTIME_DB_SNAPSHOT_CREATE, 'Runtime snapshot creation writes a local support artifact.'),
    description: 'Create an explicit SQLite runtime DB snapshot under the approved project temp area',
    handler: ({ db, payload, ...context }) => createRuntimeDbSnapshot(db, payload, context)
  },
  'support.debug_trace_pack': {
    classification: 'metadata-only',
    effects: [EFFECTS.SUPPORT_ARTIFACT],
    renderer: true,
    authority: confirmationAuthority(CONFIRMATION.SUPPORT_DEBUG_TRACE_PACK, 'Debug trace pack creation writes a bounded local support artifact.'),
    description: 'Write a bounded local operator debug trace pack without raw evidence payloads',
    handler: ({ db, payload, databasePath }) => writeOperatorDebugTracePack(db, { ...payload, databasePath })
  },
  'queue.selection': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Preview queued discovery refs selected for explicit ESI expansion',
    handler: ({ db, payload }) => buildQueueExpansionSelection(db, payload)
  },
  'scope.defaults': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Return user-facing scope defaults for CLI, IPC, and UI controls',
    handler: () => getScopeDefaults()
  },
  'scope.validate': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Validate and normalize a user-defined scope without running collection',
    handler: ({ db, payload }) => validateScope(payload, { db })
  },
  'task.list': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Return recent backend task history',
    handler: ({ payload }) => defaultTaskRunner.listTasks({ limit: payload.limit || 20 })
  },
  'task.get': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Return one backend task by task_id',
    handler: ({ payload }) => defaultTaskRunner.getTask(payload.task_id)
  },
  'task.cancel': {
    classification: 'runtime-control',
    effects: [EFFECTS.RUNTIME_CONTROL],
    renderer: true,
    authority: confirmationAuthority(CONFIRMATION.TASK_CANCEL, 'Task cancellation mutates task state and can abort running work.'),
    description: 'Request cancellation for one running backend task',
    handler: ({ payload }) => defaultTaskRunner.cancelTask(payload.task_id, payload.reason || 'User requested cancellation')
  }
};

function listServiceCommands(options = {}) {
  return Object.entries(COMMANDS)
    .filter(([, definition]) => options.forRenderer !== true || definition.renderer === true)
    .map(([command, definition]) => ({
    command,
    classification: definition.classification,
    effects: [...(definition.effects || [definition.classification])],
    renderer_allowed: definition.renderer === true,
    authority: authorityMetadata(definition.authority),
    description: definition.description
  }));
}

function snapshotSettingsOptionsForContext(payload = {}, context = {}) {
  if (context.runtimeSnapshotSettingsPath) {
    return { settingsPath: context.runtimeSnapshotSettingsPath };
  }
  if (context.source === 'renderer') {
    return {};
  }
  return {
    settingsPath: payload.settingsPath || payload.runtimeSnapshotSettingsPath
  };
}

async function invokeServiceCommand(command, payload = {}, context = {}) {
  validateServiceInvokeEnvelope({ command, payload });
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
  assertCommandEligible(command, definition, context);
  assertCommandAuthority(command, definition, payload, context);
  if (context.asTask) {
    const taskDefinition = {
      type: command,
      classification: definition.taskClassification || definition.classification,
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

  ipcMain.handle('atlas:service:list', () => listServiceCommands({ forRenderer: true }));
  ipcMain.handle('atlas:service:invoke', async (_event, request) => {
    const envelope = validateServiceInvokeEnvelope(request);
    const command = envelope.command;
    const payload = envelope.payload;
    return invokeServiceCommand(command, payload, {
      ...contextProvider(),
      source: 'renderer',
      asTask: envelope.asTask,
      detachedTask: envelope.detachedTask || envelope.background
    });
  });
}

function validateServiceInvokeEnvelope(request = {}) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    const error = new Error('Service invoke request must be an object envelope');
    error.code = 'SERVICE_ENVELOPE_INVALID';
    throw error;
  }
  if (!request.command || typeof request.command !== 'string') {
    const error = new Error('Service invoke request requires a string command');
    error.code = 'SERVICE_COMMAND_INVALID';
    throw error;
  }
  const payload = request.payload === undefined ? {} : request.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    const error = new Error('Service invoke payload must be an object');
    error.code = 'SERVICE_PAYLOAD_INVALID';
    throw error;
  }
  for (const flag of ['asTask', 'detachedTask', 'background']) {
    if (request[flag] !== undefined && typeof request[flag] !== 'boolean') {
      const error = new Error(`Service invoke ${flag} flag must be boolean`);
      error.code = 'SERVICE_ENVELOPE_INVALID';
      throw error;
    }
  }
  return {
    command: request.command,
    payload,
    asTask: request.asTask === true,
    detachedTask: request.detachedTask === true,
    background: request.background === true
  };
}

function runSdeLookupBuildCommand(db, payload = {}, context = {}) {
  const hasLocalSource = Boolean(payload.sourcePath || payload.source_path || payload.path);
  const normalizedPayload = {
    ...payload,
    sourcePath: payload.sourcePath || payload.source_path || payload.path || null,
    signal: context.signal || payload.signal
  };
  if (!hasLocalSource) {
    const gate = actionGate('sde.build-lookups', payload);
    if (!gate.allowed) {
      const blocker = gate.blockers[0];
      const error = new Error(blocker?.message || 'SDE lookup download requires explicit live API enablement');
      error.code = blocker?.code || 'LIVE_API_DISABLED';
      error.details = gate;
      throw error;
    }
  }
  return buildSdeLookupTables(db, normalizedPayload);
}

function confirmationAuthority(token, reason) {
  return {
    confirmation_required: true,
    token,
    reason
  };
}

function authorityMetadata(authority = null) {
  if (!authority) {
    return {
      confirmation_required: false,
      token: null,
      reason: null
    };
  }
  return {
    confirmation_required: authority.confirmation_required === true,
    token: authority.token || null,
    reason: authority.reason || null
  };
}

function assertCommandEligible(command, definition, context = {}) {
  if (context.source !== 'renderer') {
    return;
  }
  if (definition.renderer === true) {
    return;
  }
  const error = new Error(`Service command ${command} is not eligible for renderer IPC`);
  error.code = 'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE';
  throw error;
}

function assertCommandAuthority(command, definition, payload = {}, context = {}) {
  const authority = definition.authority;
  if (!authority?.confirmation_required) {
    return;
  }
  if (context.source !== 'renderer' && context.enforceAuthority !== true) {
    return;
  }
  const provided = payload.confirmation || payload.confirmationToken || payload.confirmation_token || payload.authority?.confirmation;
  if (provided === authority.token) {
    return;
  }
  const error = new Error(`Service command ${command} requires confirmation token ${authority.token}`);
  error.code = 'SERVICE_CONFIRMATION_REQUIRED';
  error.details = authorityMetadata(authority);
  throw error;
}

module.exports = {
  CONFIRMATION,
  EFFECTS,
  listServiceCommands,
  invokeServiceCommand,
  registerIpcServiceHandlers,
  validateServiceInvokeEnvelope
};
