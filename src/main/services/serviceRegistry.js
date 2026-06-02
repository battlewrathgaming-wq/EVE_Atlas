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
const { buildRuntimeEnforcementBoundaryPreview } = require('./runtimeEnforcementBoundaryService');
const { buildSdeLookupTables } = require('../sde/sdeLookupBuilder');
const {
  buildRuntimeDbSnapshotPreflight,
  createRuntimeDbSnapshot,
  loadRuntimeSnapshotSettings,
  saveRuntimeSnapshotSettings
} = require('./runtimeSnapshotService');
const { buildGateStackReadout } = require('./gateStackReadoutService');
const {
  COMMAND_ENFORCEMENT_COVERAGE,
  buildEnforcementDryRunCommandEffectMap
} = require('./enforcementDryRunService');
const { buildComposedGatePolicyPreview } = require('./composedGatePolicyService');
const { buildHydrationBacklogPreview } = require('./hydrationBacklogPreviewService');
const { buildHydrationCandidatePreview } = require('./hydrationCandidatePreviewService');
const { buildHydrationAttentionLensPreview } = require('./hydrationAttentionLensService');
const { buildHydrationExecutionPolicyPreview } = require('./hydrationExecutionPolicyPreviewService');
const { buildHydrationWriteFixtureProof } = require('./hydrationWriteFixtureProofService');
const { buildLocalSdeReadinessPreview } = require('./localSdeReadinessPreviewService');
const { buildRuntimeHookTelemetryReadout } = require('./runtimeHookTelemetryReadoutService');
const {
  buildExternalIoStateConfigReadback,
  buildExternalIoStateConfigWrite,
  buildExternalIoStateReadout,
  buildExternalIoStatePersistenceProof
} = require('./externalIoStateService');
const { buildSupportArtifactPathAuthorityPreview } = require('./supportArtifactPathAuthorityService');
const { buildSupportArtifactCreationPolicyPreview } = require('./supportArtifactCreationPolicyService');
const { buildSupportArtifactContentsContractPreview } = require('./supportArtifactContentsContractService');
const { buildSupportArtifactWriterConformanceGapMapPreview } = require('./supportArtifactWriterConformanceGapMapService');
const { buildTraceLogRedactionPolicyPreview } = require('./traceLogRedactionPolicyService');
const { buildApiRequestLogRedactionReadinessPreview } = require('./apiRequestLogRedactionReadinessService');
const { buildStorageAuthorityPreflight } = require('./storageAuthorityPreflightService');
const {
  buildStorageAuthorityConfigReadback,
  buildStorageAuthorityConfigWrite,
  buildStorageAuthorityConfigWriteProof,
  buildStorageAuthorityAcknowledgementPersistenceProof
} = require('./storageAuthorityConfigWriteService');
const { buildStorageSetupGateReadout } = require('./storageSetupGateReadoutService');
const { writeOperatorDebugTracePack } = require('../support/operatorDebugTracePack');
const { getScopeDefaults, validateScope } = require('./scopeService');
const { defaultTaskRunner } = require('./taskRunner');
const { buildDryRuntimeEnforcementAdapterDecision } = require('./runtimeEnforcementDryAdapter');

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
  'external_io.state_readout': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Read External I/O persisted posture without provider calls, movement, enforcement, or path probing',
    handler: ({ payload, ...context }) => buildExternalIoStateReadout(payload, context)
  },
  'external_io.state_persistence_proof': {
    classification: 'metadata-only',
    effects: [EFFECTS.LOCAL_DATA_MUTATION],
    renderer: false,
    description: 'Write and read back fixture-only External I/O state without provider calls, dispatch, or enforcement',
    handler: ({ payload, ...context }) => buildExternalIoStatePersistenceProof(payload, context)
  },
  'external_io.state_config_readback': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Read back app-local External I/O operator config without provider calls, movement, enforcement, or path probing',
    handler: ({ payload, ...context }) => buildExternalIoStateConfigReadback(payload, context)
  },
  'external_io.state_config_write': {
    classification: 'metadata-only',
    effects: [EFFECTS.LOCAL_DATA_MUTATION],
    renderer: false,
    description: 'Write and read back trusted app-local External I/O operator config without provider calls, dispatch, or enforcement',
    handler: ({ payload, ...context }) => buildExternalIoStateConfigWrite(payload, context)
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
  'metadata.hydration_backlog.preview': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Preview local hydration readability backlog without provider calls, writes, queues, or schema changes',
    handler: ({ db, payload, ...context }) => buildHydrationBacklogPreview(db, payload, {
      ...context,
      commandMetadata: listServiceCommands()
    })
  },
  'metadata.hydration_execution_policy.preview': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Preview future Hydration execution policy without provider calls, writes, queues, or authorization',
    handler: ({ db, payload, ...context }) => buildHydrationExecutionPolicyPreview(db, payload, {
      ...context,
      commandMetadata: listServiceCommands()
    })
  },
  'metadata.hydration_candidates.preview': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Preview deduped local Hydration candidate demand without provider calls, queues, writes, or schema changes',
    handler: ({ db, payload }) => buildHydrationCandidatePreview(db, payload)
  },
  'metadata.hydration_attention_lens.preview': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Preview selected Hydration readability landmarks from local candidates without provider calls, queues, writes, or schema changes',
    handler: ({ db, payload }) => buildHydrationAttentionLensPreview(db, payload)
  },
  'metadata.local_sde_readiness.preview': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Preview local SDE lookup readiness gaps without download, import, provider calls, writes, or schema changes',
    handler: ({ db, payload }) => buildLocalSdeReadinessPreview(db, payload)
  },
  'metadata.hydration_write_fixture_proof': {
    classification: 'metadata-only',
    effects: [EFFECTS.LOCAL_DATA_MUTATION, EFFECTS.METADATA_READABILITY],
    renderer: false,
    description: 'Write fixture-only Hydration readability labels from local entities without providers, Evidence writes, queues, or enforcement',
    handler: ({ db, payload, ...context }) => buildHydrationWriteFixtureProof(db, payload, context)
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
  'storage.authority_config.readback': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Read app-local storage authority config posture without enforcement, migration, provider movement, or path probing',
    handler: ({ payload, ...context }) => buildStorageAuthorityConfigReadback(payload, context)
  },
  'storage.authority_config.write': {
    classification: 'metadata-only',
    effects: [EFFECTS.LOCAL_DATA_MUTATION],
    renderer: false,
    description: 'Write and read back trusted app-local storage authority config without enforcement, migration, or provider movement',
    handler: ({ payload, ...context }) => buildStorageAuthorityConfigWrite(payload, context)
  },
  'storage.authority_config.acknowledgement_persistence_proof': {
    classification: 'metadata-only',
    effects: [EFFECTS.LOCAL_DATA_MUTATION],
    renderer: false,
    description: 'Write and read back fixture-only fallback acknowledgement storage-authority memory without enforcement',
    handler: ({ payload, ...context }) => buildStorageAuthorityAcknowledgementPersistenceProof(payload, context)
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
  'support.artifact_path_authority.preview': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Preview support artifact path, budget, cleanup, sensitivity, and trust posture without writing files',
    handler: ({ payload, ...context }) => buildSupportArtifactPathAuthorityPreview(payload, {
      ...context,
      commandMetadata: listServiceCommands()
    })
  },
  'support.artifact_creation_policy.preview': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Preview snapshot and trace-pack creation policy posture without creating support artifacts',
    handler: ({ payload, ...context }) => buildSupportArtifactCreationPolicyPreview(payload, {
      ...context,
      commandMetadata: listServiceCommands()
    })
  },
  'support.artifact_contents_contract.preview': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Preview support artifact content rules without creating artifacts, reading artifact files, or changing runtime behavior',
    handler: () => buildSupportArtifactContentsContractPreview()
  },
  'support.artifact_writer_conformance_gap_map.preview': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Preview support artifact writer conformance gaps without creating artifacts or changing writer behavior',
    handler: () => buildSupportArtifactWriterConformanceGapMapPreview()
  },
  'support.trace_log_redaction_policy.preview': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Preview trace/log redaction and free-text truncation policy without changing writers or creating artifacts',
    handler: () => buildTraceLogRedactionPolicyPreview()
  },
  'support.api_request_log_redaction_readiness.preview': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Preview persisted API request log endpoint/error redaction readiness without changing log writes',
    handler: () => buildApiRequestLogRedactionReadinessPreview()
  },
  'runtime.enforcement_boundary.preview': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Preview the service invocation enforcement boundary before task wrapping or handler dispatch',
    handler: ({ db, payload, ...context }) => buildRuntimeEnforcementBoundaryPreview(db, payload, {
      ...context,
      commandMetadata: listServiceCommands()
    })
  },
  'runtime.enforcement_hook_telemetry.readout': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Summarize supplied inactive runtime hook preview telemetry without capture, persistence, enforcement, or handler dispatch',
    handler: ({ payload }) => buildRuntimeHookTelemetryReadout(payload)
  },
  'storage.enforcement_dry_run.command_effect_map': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Read dry-run allow/block/conditional command-effect posture without enforcing runtime command blocking',
    handler: ({ payload, ...context }) => buildEnforcementDryRunCommandEffectMap(payload, {
      ...context,
      commandMetadata: listServiceCommands()
    })
  },
  'storage.composed_gate_policy.preview': {
    classification: 'read-only',
    effects: [EFFECTS.READ_ONLY],
    renderer: true,
    description: 'Preview future composed gate policy inputs without runtime authorization, interception, or blocking',
    handler: ({ db, payload, ...context }) => buildComposedGatePolicyPreview(db, payload, {
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
  emitInactiveRuntimeEnforcementPreview(command, definition, payload, context);
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

function emitInactiveRuntimeEnforcementPreview(command, definition, payload = {}, context = {}) {
  const preview = buildDryRuntimeEnforcementAdapterDecision({
    command,
    payload,
    context,
    definition: {
      command,
      classification: definition.classification,
      effects: definition.effects,
      renderer: definition.renderer,
      authority: authorityMetadata(definition.authority),
      description: definition.description
    },
    facts: runtimeEnforcementFactsFor(command, context, payload)
  });
  const observer = context.runtimeEnforcementPreviewObserver || context.runtime_enforcement_preview_observer;
  if (typeof observer !== 'function') {
    return preview;
  }
  try {
    observer(preview);
  } catch {
    // Preview observers are diagnostics only; observer failures must not affect command behavior.
  }
  return preview;
}

function runtimeEnforcementFactsFor(command, context = {}, payload = {}) {
  const facts = context.runtimeEnforcementFacts || context.runtime_enforcement_facts || {};
  if (!facts || typeof facts !== 'object' || Array.isArray(facts)) {
    return mergeSourcedRuntimeGateFacts(command, mergeCoverageFact(command, {}), context, payload);
  }
  if (facts[command] && typeof facts[command] === 'object' && !Array.isArray(facts[command])) {
    return mergeSourcedRuntimeGateFacts(command, mergeCoverageFact(command, facts[command]), context, payload);
  }
  return mergeSourcedRuntimeGateFacts(command, mergeCoverageFact(command, facts), context, payload);
}

function mergeCoverageFact(command, facts = {}) {
  if (Object.prototype.hasOwnProperty.call(facts, 'coverage')) {
    return facts;
  }
  const coverage = coverageFactForCommand(command);
  if (!coverage) {
    return facts;
  }
  return {
    ...facts,
    coverage
  };
}

function coverageFactForCommand(command) {
  const coverage = COMMAND_ENFORCEMENT_COVERAGE[command];
  return coverage ? {
    ...coverage,
    command,
    classified: true,
    missing_classification: false
  } : null;
}

function mergeSourcedRuntimeGateFacts(command, facts = {}, context = {}, payload = {}) {
  const safeFacts = facts && typeof facts === 'object' && !Array.isArray(facts) ? facts : {};
  const coverage = safeFacts.coverage || coverageFactForCommand(command);
  const sourced = sourceReadOnlyRuntimeGateFacts({ command, coverage, context, payload });
  const merged = { ...safeFacts };
  for (const [key, value] of Object.entries(sourced)) {
    if (!Object.prototype.hasOwnProperty.call(merged, key)) {
      merged[key] = value;
    }
  }
  return merged;
}

function sourceReadOnlyRuntimeGateFacts({ command, coverage = null, context = {}, payload = {} }) {
  const sourced = {};
  const setupReadout = safeReadOnlyStorageSetupGateReadout(context);
  const storageReadback = safeReadOnlyStorageAuthorityConfigReadback(context);
  const externalIoReadback = safeReadOnlyExternalIoConfigReadback(context);
  const providerLiveGate = safeReadOnlyProviderLiveGateFact({ command, coverage, context, payload });
  const composedPolicy = safeReadOnlyComposedPolicyFact({ command, context, payload });
  const destinationPathAuthority = safeReadOnlyDestinationPathAuthorityFact({ command, context, payload });

  if (setupReadout) {
    sourced.storage_authority = storageAuthorityFactFor(setupReadout, storageReadback);
    sourced.budget = storageBudgetFactFor(setupReadout);
  }
  if (externalIoReadback) {
    sourced.external_io = externalIoFactFor({ command, coverage, externalIoReadback });
  }
  if (providerLiveGate) {
    sourced.provider_live_gate = providerLiveGate;
  }
  if (composedPolicy) {
    sourced.composed_policy = composedPolicy;
  }
  if (destinationPathAuthority) {
    sourced.destination_path_authority = destinationPathAuthority;
  }
  return sourced;
}

function safeReadOnlyStorageSetupGateReadout(context = {}) {
  try {
    return buildStorageSetupGateReadout({}, context);
  } catch (error) {
    return {
      storage_authority: {
        mode: 'not_sourced',
        validation_status: 'readout_unavailable',
        read_allowed: false,
        write_allowed_if_enforced_later: false,
        provider_movement_allowed_if_enforced_later: false
      },
      storage: {
        state: 'storage_fact_readout_unavailable',
        setup_gate: 'readout_unavailable'
      },
      budget: {
        state: 'budget_fact_readout_unavailable',
        budget_bytes: null,
        usage_bytes: null,
        blocks_writes: false
      },
      action_class_matrix: {
        storage_state: 'storage_fact_readout_unavailable'
      },
      runtime_fact_read_error: error.message
    };
  }
}

function safeReadOnlyStorageAuthorityConfigReadback(context = {}) {
  try {
    return buildStorageAuthorityConfigReadback({}, context);
  } catch (error) {
    return {
      persisted_config: {
        status: 'readout_unavailable',
        source: 'runtime_hook_read_error',
        read_error: error.message
      },
      readback_posture: null
    };
  }
}

function safeReadOnlyExternalIoConfigReadback(context = {}) {
  try {
    return buildExternalIoStateConfigReadback({}, context);
  } catch (error) {
    return {
      state: 'off',
      state_source: 'runtime_hook_read_error_default_safe_off',
      persisted_state: {
        status: 'readout_unavailable',
        read_error: error.message
      },
      provider_backed_posture: 'held_by_external_io',
      held_is_failure: false,
      on_is_authorization: false,
      reenable_catch_up_policy: {
        catch_up_flood: false,
        immediate_dispatch: false
      }
    };
  }
}

function safeReadOnlyProviderLiveGateFact({ command, coverage = null, context = {}, payload = {} }) {
  const mappedAction = liveGateActionForCommand(command, payload);
  const providerCapable = Boolean(coverage?.external_io_dependency && coverage.external_io_dependency !== 'none');
  if (!mappedAction && providerOptionalLocalSourceForCommand(command, payload)) {
    return {
      fact_class: 'provider_live_gate',
      fact_source: 'runtime_hook_read_only_live_api_gate_mapping',
      source_status: 'sourced_provider_optional_local_source_not_applicable',
      command,
      mapped_live_gate_action: null,
      provider_capable: false,
      mode: 'local-only',
      providers: [],
      allowed: false,
      allowed_is_authorization: false,
      state: 'local_source_no_live_provider_gate',
      blockers: [],
      warnings: [],
      estimated_api_calls: { zkill: 0, esi: 0, total: 0 },
      request_control: null,
      non_authorizing_preview: true
    };
  }
  if (!mappedAction && providerCapable) {
    return {
      fact_class: 'provider_live_gate',
      fact_source: 'runtime_hook_read_only_live_api_gate_mapping',
      source_status: 'sourced_unmapped_provider_capable',
      command,
      mapped_live_gate_action: null,
      provider_capable: true,
      mode: 'unknown_unmapped_provider_capable',
      providers: [],
      allowed: false,
      allowed_is_authorization: false,
      state: 'provider_live_gate_unmapped',
      blockers: [{
        code: 'PROVIDER_LIVE_GATE_UNMAPPED',
        message: 'Provider-capable service command has no accepted live/provider gate mapping for this preview.'
      }],
      warnings: [],
      estimated_api_calls: null,
      request_control: null,
      non_authorizing_preview: true
    };
  }
  if (!mappedAction) {
    return {
      fact_class: 'provider_live_gate',
      fact_source: 'runtime_hook_read_only_live_api_gate_mapping',
      source_status: 'sourced_local_only_not_applicable',
      command,
      mapped_live_gate_action: null,
      provider_capable: false,
      mode: 'local-only',
      providers: [],
      allowed: false,
      allowed_is_authorization: false,
      state: 'local_only_no_live_provider_gate',
      blockers: [],
      warnings: [],
      estimated_api_calls: { zkill: 0, esi: 0, total: 0 },
      request_control: null,
      non_authorizing_preview: true
    };
  }
  try {
    const gate = actionGate(mappedAction, payload, {
      taskRunner: context.runtimeHookLiveGateTaskRunner || context.taskRunner
    });
    return providerLiveGateFactFromGate({ command, mappedAction, gate });
  } catch (error) {
    return {
      fact_class: 'provider_live_gate',
      fact_source: 'runtime_hook_read_only_live_api_gate_action_gate',
      source_status: 'sourced_unknown_live_gate_action',
      command,
      mapped_live_gate_action: mappedAction,
      provider_capable: providerCapable,
      mode: 'unknown_live_gate_action',
      providers: [],
      allowed: false,
      allowed_is_authorization: false,
      state: 'provider_live_gate_readout_unavailable',
      blockers: [{
        code: error.code || 'PROVIDER_LIVE_GATE_READOUT_UNAVAILABLE',
        message: error.message
      }],
      warnings: [],
      estimated_api_calls: null,
      request_control: null,
      non_authorizing_preview: true
    };
  }
}

function safeReadOnlyComposedPolicyFact({ command, context = {}, payload = {} }) {
  if (!context.db) {
    return unmappedComposedPolicyFact(command, 'db_context_missing_for_composed_policy_preview');
  }
  try {
    const preview = buildComposedGatePolicyPreview(context.db, {
      externalIoState: payload.externalIoState || payload.external_io_state || context.runtimeHookExternalIoState || 'off'
    }, {
      ...context,
      commandMetadata: listServiceCommands()
    });
    const row = (preview.rows || []).find((candidate) => candidate.command === command);
    if (!row) {
      return unmappedComposedPolicyFact(command, 'representative_composed_policy_row_not_mapped');
    }
    return composedPolicyFactFromRow(command, row, preview);
  } catch (error) {
    return {
      ...unmappedComposedPolicyFact(command, 'composed_policy_readout_unavailable'),
      source_status: 'sourced_readout_unavailable',
      read_error: error.message
    };
  }
}

function safeReadOnlyDestinationPathAuthorityFact({ command, context = {}, payload = {} }) {
  const mappedClassIds = destinationArtifactClassIdsForCommand(command);
  const rendererPathClaimsIgnored = context.source === 'renderer' && runtimeHookPayloadHasPathClaims(payload);
  if (!mappedClassIds.length && supportArtifactDestinationRequiredForCommand(command)) {
    return {
      fact_class: 'destination_path_authority',
      fact_source: 'runtime_hook_read_only_support_artifact_path_authority_preview',
      source_status: 'sourced_unmapped_support_artifact_command',
      command,
      applies: true,
      mapped_artifact_class_ids: [],
      state: 'support_artifact_destination_unmapped',
      renderer_authoritative: false,
      renderer_path_claims_ignored: rendererPathClaimsIgnored,
      requires_storage_authority: true,
      counts_against_storage_budget: true,
      cleanup_stages: [],
      privacy_sensitivity: [],
      provider_posture: [],
      external_io_relevance: [],
      non_authorizing_preview: true
    };
  }
  if (!mappedClassIds.length) {
    return {
      fact_class: 'destination_path_authority',
      fact_source: 'runtime_hook_read_only_support_artifact_path_authority_preview',
      source_status: 'sourced_not_applicable',
      command,
      applies: false,
      mapped_artifact_class_ids: [],
      state: 'not_applicable',
      renderer_authoritative: false,
      renderer_path_claims_ignored: rendererPathClaimsIgnored,
      requires_storage_authority: false,
      counts_against_storage_budget: false,
      cleanup_stages: [],
      privacy_sensitivity: [],
      provider_posture: [],
      external_io_relevance: [],
      non_authorizing_preview: true
    };
  }
  try {
    const preview = buildSupportArtifactPathAuthorityPreview({}, {
      ...context,
      source: context.source,
      commandMetadata: listServiceCommands()
    });
    const classes = mappedClassIds
      .map((id) => (preview.classes || []).find((entry) => entry.id === id))
      .filter(Boolean);
    if (classes.length !== mappedClassIds.length) {
      return {
        ...destinationPathFactBase({ command, rendererPathClaimsIgnored, mappedClassIds }),
        source_status: 'sourced_mapped_class_missing',
        state: 'mapped_artifact_class_missing',
        class_summaries: compactDestinationClassSummaries(classes)
      };
    }
    return {
      ...destinationPathFactBase({ command, rendererPathClaimsIgnored, mappedClassIds }),
      source_status: 'sourced_mapped_artifact_classes',
      state: destinationStateForClasses(classes),
      requires_storage_authority: classes.some((entry) => entry.requires_storage_authority === true),
      counts_against_storage_budget: classes.some((entry) => entry.counts_against_storage_budget === true),
      cleanup_stages: [...new Set(classes.map((entry) => entry.cleanup_stage).filter(Boolean))],
      privacy_sensitivity: [...new Set(classes.map((entry) => entry.privacy_sensitivity).filter(Boolean))],
      provider_posture: [...new Set(classes.map((entry) => entry.provider_posture).filter(Boolean))],
      external_io_relevance: [...new Set(classes.map((entry) => entry.external_io_relevance).filter(Boolean))],
      class_summaries: compactDestinationClassSummaries(classes)
    };
  } catch (error) {
    return {
      ...destinationPathFactBase({ command, rendererPathClaimsIgnored, mappedClassIds }),
      source_status: 'sourced_readout_unavailable',
      state: 'destination_path_authority_readout_unavailable',
      read_error: error.message
    };
  }
}

function destinationPathFactBase({ command, rendererPathClaimsIgnored, mappedClassIds }) {
  return {
    fact_class: 'destination_path_authority',
    fact_source: 'runtime_hook_read_only_support_artifact_path_authority_preview',
    command,
    applies: true,
    mapped_artifact_class_ids: mappedClassIds,
    renderer_authoritative: false,
    renderer_path_claims_ignored: rendererPathClaimsIgnored,
    basis_action: 'support.artifact_path_authority.preview',
    non_authorizing_preview: true
  };
}

function destinationArtifactClassIdsForCommand(command) {
  if (command === 'runtime.db_snapshot.create') {
    return ['runtime_snapshot_rolling', 'runtime_snapshot_retained'];
  }
  if (command === 'support.debug_trace_pack') {
    return ['operator_debug_trace_pack'];
  }
  return [];
}

function supportArtifactDestinationRequiredForCommand(command) {
  return ['runtime.db_snapshot.create', 'support.debug_trace_pack'].includes(command);
}

function destinationStateForClasses(classes = []) {
  if (!classes.length) {
    return 'not_mapped';
  }
  if (classes.some((entry) => entry.requires_storage_authority === true)) {
    return 'destination_authority_required';
  }
  return 'destination_authority_not_required';
}

function compactDestinationClassSummaries(classes = []) {
  return classes.map((entry = {}) => ({
    id: entry.id || null,
    family: entry.family || null,
    status_source: entry.status?.source || null,
    status_exists: entry.status?.exists === true,
    usage_bytes: Number.isFinite(Number(entry.status?.usage_bytes)) ? Number(entry.status.usage_bytes) : null,
    requires_storage_authority: entry.requires_storage_authority === true,
    counts_against_storage_budget: entry.counts_against_storage_budget === true,
    cleanup_stage: entry.cleanup_stage || null,
    privacy_sensitivity: entry.privacy_sensitivity || null,
    provider_posture: entry.provider_posture || null,
    external_io_relevance: entry.external_io_relevance || null,
    creates_files: false,
    creates_directories: false
  }));
}

function runtimeHookPayloadHasPathClaims(payload = {}) {
  return [
    'path',
    'paths',
    'outputDir',
    'output_dir',
    'destinationPath',
    'destination_path',
    'snapshotDestination',
    'snapshot_destination',
    'snapshotDestinationDir',
    'snapshot_destination_dir',
    'tracePackOutputDir',
    'trace_pack_output_dir',
    'cacheDir',
    'cache_dir',
    'sdeCacheDir',
    'sde_cache_dir',
    'storageRoot',
    'storage_root',
    'databasePath',
    'database_path',
    'settingsPath',
    'runtimeSnapshotSettingsPath',
    'windowSettingsPath'
  ].some((key) => Object.prototype.hasOwnProperty.call(payload, key));
}

function unmappedComposedPolicyFact(command, reason) {
  return {
    fact_class: 'composed_gate_policy',
    fact_source: 'runtime_hook_read_only_composed_gate_policy_preview',
    source_status: 'sourced_unmapped',
    command,
    matched_row_id: null,
    state: 'unknown',
    reason_codes: [`composed_policy:${reason}`],
    active: false,
    enforcement_active: false,
    runtime_authorization_active: false,
    would_allow_is_authorization: false,
    answers_may_run_now: false,
    gate_summary: {},
    basis_action: 'storage.composed_gate_policy.preview',
    non_authorizing_preview: true
  };
}

function composedPolicyFactFromRow(command, row = {}, preview = {}) {
  return {
    fact_class: 'composed_gate_policy',
    fact_source: 'runtime_hook_read_only_composed_gate_policy_preview',
    source_status: 'sourced_mapped_row',
    command,
    matched_row_id: row.id || null,
    state: row.composed_state || 'unknown',
    reason_codes: [...(row.reason_codes || [])],
    active: false,
    enforcement_active: false,
    runtime_authorization_active: false,
    would_allow_is_authorization: false,
    answers_may_run_now: false,
    gate_summary: compactComposedGateSummary(row.gates || {}),
    basis_action: preview.action || 'storage.composed_gate_policy.preview',
    non_authorizing_preview: true
  };
}

function compactComposedGateSummary(gates = {}) {
  return Object.fromEntries(Object.entries(gates).map(([name, gateValue = {}]) => [
    name,
    {
      state: gateValue.state || null,
      reason: gateValue.reason || null
    }
  ]));
}

function liveGateActionForCommand(command, payload = {}) {
  if (command === 'manual.discovery') {
    return 'manual.discovery';
  }
  if (command === 'manual.expansion') {
    return 'manual.expansion';
  }
  if (command === 'metadata.hydration') {
    return 'metadata.hydration';
  }
  if (command === 'sde.build-lookups') {
    return payload.sourcePath || payload.source_path || payload.path ? null : 'sde.build-lookups';
  }
  return null;
}

function providerOptionalLocalSourceForCommand(command, payload = {}) {
  if (command !== 'sde.build-lookups') {
    return false;
  }
  return Boolean(payload.sourcePath || payload.source_path || payload.path);
}

function providerLiveGateFactFromGate({ command, mappedAction, gate = {} }) {
  const providerCapable = gate.mode === 'live-required';
  return {
    fact_class: 'provider_live_gate',
    fact_source: 'runtime_hook_read_only_live_api_gate_action_gate',
    source_status: providerCapable ? 'sourced_provider_live_gate' : 'sourced_local_only_not_applicable',
    command,
    mapped_live_gate_action: mappedAction,
    provider_capable: providerCapable,
    mode: gate.mode || null,
    providers: [...(gate.providers || [])],
    allowed: gate.allowed === true,
    allowed_is_authorization: false,
    state: gate.state || null,
    live_api_enabled: gate.live_api_enabled === true,
    user_agent_configured: gate.user_agent_configured === true,
    blockers: compactLiveGateMessages(gate.blockers),
    warnings: compactLiveGateMessages(gate.warnings),
    estimated_api_calls: gate.estimated_api_calls || null,
    request_control: gate.request_control ? {
      provider: gate.request_control.provider || null,
      action: gate.request_control.action || null,
      target_type: gate.request_control.target_type || null,
      target_id: gate.request_control.target_id || null,
      lookback_seconds: gate.request_control.lookback_seconds ?? null,
      cap_summary: gate.request_control.cap_summary || null,
      scope_fingerprint: gate.request_control.scope_fingerprint || null,
      cooldown_active: gate.request_control.cooldown_active === true,
      lockout_active: gate.request_control.lockout_active === true,
      next_eligible_at: gate.request_control.next_eligible_at || null,
      lockout_until: gate.request_control.lockout_until || null,
      blocked_attempt_count: gate.request_control.blocked_attempt_count || 0,
      last_blocked_reason: gate.request_control.last_blocked_reason || null,
      persistence: gate.request_control.persistence || null
    } : null,
    non_authorizing_preview: true
  };
}

function compactLiveGateMessages(messages = []) {
  return (messages || []).map((entry = {}) => ({
    code: entry.code || null,
    message: entry.message || null,
    next_eligible_at: entry.next_eligible_at || null,
    remaining_seconds: entry.remaining_seconds ?? null,
    scope_fingerprint: entry.scope_fingerprint || null,
    active_task_id: entry.active_task_id || null
  }));
}

function storageAuthorityFactFor(setupReadout = {}, storageReadback = {}) {
  const authority = setupReadout.storage_authority || {};
  const storage = setupReadout.storage || {};
  const persistedStatus = storageReadback.persisted_config?.status || authority.config_read_status || 'not_sourced';
  const sourceStatus = persistedStatus === 'read'
    ? 'sourced_configured'
    : persistedStatus === 'missing'
      ? 'sourced_absent_unconfigured'
      : `sourced_${persistedStatus}`;
  return {
    fact_class: 'storage_authority',
    fact_source: 'runtime_hook_read_only_storage_authority_readback',
    source_status: sourceStatus,
    config_read_status: persistedStatus,
    config_source: authority.config_source || storageReadback.persisted_config?.source || null,
    mode: authority.mode || null,
    selected: authority.selected === true,
    fallback_available: authority.fallback_available === true,
    fallback_acknowledged: authority.fallback_acknowledged === true,
    acknowledgement_status: authority.acknowledgement_status || null,
    acknowledgement_basis: authority.acknowledgement_basis || null,
    acknowledgement_invalid_reason: authority.acknowledgement_invalid_reason || null,
    validation_status: authority.validation_status || null,
    gate_state: setupReadout.action_class_matrix?.storage_state || storage.state || null,
    storage_state: storage.state || null,
    setup_gate: storage.setup_gate || null,
    read_allowed: authority.read_allowed === true,
    write_allowed_if_enforced_later: authority.write_allowed_if_enforced_later === true,
    provider_movement_allowed_if_enforced_later: authority.provider_movement_allowed_if_enforced_later === true,
    non_authorizing_preview: true
  };
}

function storageBudgetFactFor(setupReadout = {}) {
  const budget = setupReadout.budget || {};
  const configured = Number.isFinite(Number(budget.budget_bytes)) && Number(budget.budget_bytes) > 0;
  return {
    fact_class: 'storage_budget',
    fact_source: 'runtime_hook_read_only_storage_setup_gate_readout',
    source_status: configured ? 'sourced_configured' : 'sourced_absent_unconfigured',
    state: budget.state || null,
    budget_bytes: configured ? Number(budget.budget_bytes) : null,
    usage_bytes: Number.isFinite(Number(budget.usage_bytes)) ? Number(budget.usage_bytes) : null,
    usage_ratio: Number.isFinite(Number(budget.usage_ratio)) ? Number(budget.usage_ratio) : null,
    warning_level: budget.warning_level || null,
    blocks_writes: budget.blocks_writes === true,
    suggested_default_budget_bytes: budget.suggested_default_budget_bytes || null,
    suggested_default_is_acceptance: budget.suggested_default_is_acceptance === true,
    non_authorizing_preview: true
  };
}

function externalIoFactFor({ command, coverage = null, externalIoReadback = {} }) {
  const dependency = coverage?.external_io_dependency || 'none';
  const providerCapable = dependency && dependency !== 'none';
  const persistedStatus = externalIoReadback.persisted_state?.status || 'not_sourced';
  const state = externalIoReadback.state || 'off';
  return {
    fact_class: 'external_io',
    fact_source: 'runtime_hook_read_only_external_io_config_readback',
    source_status: persistedStatus === 'read' ? 'sourced_configured' : `sourced_${persistedStatus}`,
    command,
    dependency,
    external_io_dependency: dependency,
    state,
    requested_state: externalIoReadback.requested_readout_state || state,
    state_source: externalIoReadback.state_source || null,
    persisted_status: persistedStatus,
    gate_state: providerCapable ? externalIoReadback.provider_backed_posture : 'local_only_available',
    provider_backed_posture: providerCapable
      ? externalIoReadback.provider_backed_posture
      : 'local_only_available',
    held_is_failure: externalIoReadback.held_is_failure === true,
    on_is_authorization: externalIoReadback.on_is_authorization === true,
    reenable_catch_up_policy: {
      catch_up_flood: externalIoReadback.reenable_catch_up_policy?.catch_up_flood === true,
      immediate_dispatch: externalIoReadback.reenable_catch_up_policy?.immediate_dispatch === true,
      missed_slots_create_request_debt: externalIoReadback.reenable_catch_up_policy?.missed_slots_create_request_debt === true,
      next_step: externalIoReadback.reenable_catch_up_policy?.next_step || 're_enter_normal_gates'
    },
    non_authorizing_preview: true
  };
}

module.exports = {
  CONFIRMATION,
  EFFECTS,
  emitInactiveRuntimeEnforcementPreview,
  runtimeEnforcementFactsFor,
  listServiceCommands,
  invokeServiceCommand,
  registerIpcServiceHandlers,
  validateServiceInvokeEnvelope
};
