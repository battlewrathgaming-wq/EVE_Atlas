const { actionGate, enterLiveProviderAttempt } = require('./liveApiGateService');
const { taxonomyMessage } = require('./messageTaxonomy');
const { discoverManualRefs } = require('../workers/manualDiscoveryWorker');
const { expandManualRefs } = require('../workers/manualExpansionWorker');
const { collectActorWatch } = require('../workers/actorWatchCollector');
const { collectSystemRadiusWatch } = require('../workers/systemRadiusCollector');
const {
  hydrateActorReportCandidates,
  hydrateCorporationReportCandidates,
  hydrateExplicitEntityIds,
  hydrateOperatorReportCandidates
} = require('../metadata/reportHydrator');
const { resolveActorIdentity } = require('../resolution/actorResolver');
const { resolveSystemIdentity } = require('../resolution/systemResolver');
const {
  normalizeManualDiscoveryScope,
  normalizeManualExpansionScope,
  normalizeActorWatchScope,
  normalizeSystemRadiusWatchScope
} = require('../scopes/scopeControls');
const { SdeTopologyImporter } = require('../sde/sdeImporter');
const { SdeInventoryImporter } = require('../sde/sdeInventoryImporter');
const { buildStorageSetupGateReadout } = require('./storageSetupGateReadoutService');
const {
  createAssessmentArtifact,
  getAssessmentArtifact,
  listAssessmentArtifacts
} = require('../assessment/assessmentArtifactRepository');
const { addSystemRadiusWatch, addWatchlistEntity, listSystemRadiusWatches, listWatchlistEntities } = require('../watchlist/watchlistRepository');
const { buildWatchScheduleStatus, recordWatchRunResult } = require('../watchlist/watchScheduler');
const { defaultWatchSessionExecutor } = require('../watchlist/watchExecutor');
const { buildWatchOfflineReadout } = require('../watchlist/watchOfflineReadout');

let sdeTopologyImportInProgress = false;

async function runManualDiscoveryService(db, payload = {}, dependencies = {}) {
  const input = await normalizeManualDiscoveryInput(db, payload, dependencies);
  assertLiveAllowed('manual.discovery', input, dependencies);
  return discoverManualRefs(input, { ...dependencies, db });
}

async function runManualExpansionService(db, payload = {}, dependencies = {}) {
  const input = normalizeManualExpansionScope({
    ...payload,
    trigger: payload.trigger || 'manual'
  });
  assertLiveAllowed('manual.expansion', input, dependencies);
  return expandManualRefs(input, { ...dependencies, db });
}

async function runActorWatchService(db, payload = {}, dependencies = {}) {
  const actor = await resolveActorInput(db, payload, dependencies);
  const input = normalizeActorWatchScope({
    ...payload,
    entityType: actor.entity_type,
    entityId: actor.entity_id,
    entityName: actor.entity_name
  });
  assertLiveAllowed('actor.watch', input, dependencies);
  return collectActorWatch(input, { ...dependencies, db });
}

async function runSystemRadiusWatchService(db, payload = {}, dependencies = {}) {
  const input = normalizeSystemRadiusWatchScope(payload);
  assertLiveAllowed('system.radius.watch', input, dependencies);
  return collectSystemRadiusWatch(input, { ...dependencies, db });
}

async function runMetadataHydrationService(db, payload = {}, dependencies = {}) {
  assertLiveAllowed('metadata.hydration', payload, { ...dependencies, requestControl: false });
  const target = String(payload.target || payload.kind || '').toLowerCase();
  if (target === 'actor') {
    const actor = await resolveActorInput(db, payload, dependencies);
    return hydrateActorReportCandidates(db, {
      entityType: actor.entity_type,
      entityId: actor.entity_id,
      entityName: actor.entity_name
    }, dependencies);
  }
  if (target === 'corporation') {
    const corporation = await resolveActorInput(db, {
      ...payload,
      entityType: 'corporation'
    }, dependencies);
    return hydrateCorporationReportCandidates(db, {
      entityType: 'corporation',
      entityId: corporation.entity_id,
      entityName: corporation.entity_name
    }, dependencies);
  }
  if (target === 'radius' || target === 'report_ids') {
    return hydrateExplicitEntityIds(db, {
      entityIds: payload.entityIds || payload.entity_ids || [],
      targetType: target,
      targetId: payload.targetId || payload.target_id || payload.centerSystemId || payload.center_system_id || 'scoped'
    }, dependencies);
  }
  if (target === 'operators' || target === 'system') {
    const systemNameOrId = payload.systemNameOrId || payload.systemName || payload.systemId;
    if (!systemNameOrId) {
      throw new Error('metadata.hydration for operators requires systemNameOrId or systemId');
    }
    return hydrateOperatorReportCandidates(db, systemNameOrId, dependencies);
  }
  throw new Error('metadata.hydration target must be actor, corporation, radius, report_ids, operators, or system');
}

async function runSdeTopologyImportService(db, payload = {}, dependencies = {}) {
  if (sdeTopologyImportInProgress) {
    const error = new Error('sde.import.topology already has an active topology import');
    error.code = 'SDE_TOPOLOGY_IMPORT_CONCURRENTLY_EXCLUDED';
    error.details = {
      retry_rerun_posture: 'explicit_operator_or_test_rerun_required',
      automatic_retry: false
    };
    throw error;
  }

  const authority = buildSdeTopologyImportAuthority(payload, dependencies);
  if (!authority.allowed) {
    const error = new Error(`sde.import.topology blocked: ${authority.blocked_reasons.join(', ')}`);
    error.code = 'SDE_TOPOLOGY_IMPORT_AUTHORITY_BLOCKED';
    error.details = authority;
    throw error;
  }

  sdeTopologyImportInProgress = true;
  try {
    const result = await new SdeTopologyImporter(db).importFromPath(authority.source_authority.path, {
      ...(payload.options || {}),
      ...(dependencies.sdeTopologyImportOptions || {}),
      sourceUrl: authority.source_authority.safe_display,
      tempRoot: dependencies.sdeTopologyTempRoot || payload.options?.tempRoot
    });
    return {
      ...result,
      source_authority: authority.source_authority,
      storage_budget_authority: authority.storage_budget_authority,
      projected_growth: authority.projected_growth,
      recovery_model: {
        staged_before_promotion: true,
        staged_completeness_validated: true,
        promotion_transactional: true,
        provenance_written_after_complete_promotion_only: true,
        failed_import_preserves_previous_visible_topology: true,
        retry_rerun_posture: 'explicit_operator_or_test_rerun_required',
        automatic_retry: false,
        concurrent_topology_imports_excluded: true
      },
      provider_calls: 0,
      sde_downloads: 0,
      provider_backed_builds: 0,
      renderer_source_path_used: false
    };
  } finally {
    sdeTopologyImportInProgress = false;
  }
}

async function runSdeInventoryImportService(db, payload = {}) {
  const inputPath = payload.path || payload.inputPath;
  if (!inputPath) {
    throw new Error('sde.import.inventory requires a local SDE JSONL path');
  }
  return new SdeInventoryImporter(db).importFromPath(inputPath, payload.options || {});
}

async function runWatchCreateService(db, payload = {}, dependencies = {}) {
  if (isSystemRadiusWatchPayload(payload)) {
    const normalized = normalizeSystemRadiusWatchScope({
      centerSystemId: payload.centerSystemId || payload.center_system_id,
      radiusJumps: payload.radiusJumps ?? payload.radius_jumps,
      lookbackSeconds: payload.lookbackSeconds ?? payload.lookback_seconds,
      maxSystems: payload.maxSystems ?? payload.max_systems_per_run,
      maxRefsPerSystem: payload.maxRefsPerSystem ?? payload.max_refs_per_system ?? 1,
      maxExpansions: payload.maxExpansions ?? payload.max_killmails_per_run,
      maxRadius: payload.maxRadius,
      maxTopologySystems: payload.maxTopologySystems
    });
    return addSystemRadiusWatch(db, {
      ...payload,
      ...normalized,
      pollIntervalMinutes: payload.pollIntervalMinutes ?? payload.poll_interval_minutes,
      isActive: payload.isActive ?? payload.is_active,
      notes: payload.notes
    });
  }
  const actor = await resolveActorInput(db, payload, dependencies);
  return addWatchlistEntity(db, {
    ...payload,
    entityType: actor.entity_type,
    entityId: actor.entity_id,
    entityName: actor.entity_name
  });
}

async function runWatchUpdateService(db, payload = {}, dependencies = {}) {
  return runWatchCreateService(db, payload, dependencies);
}

function runWatchListService(db) {
  return {
    watches: listWatchlistEntities(db),
    system_watches: listSystemRadiusWatches(db)
  };
}

function isSystemRadiusWatchPayload(payload = {}) {
  const watchType = String(payload.watchType || payload.watch_type || '').toLowerCase();
  return watchType === 'system_radius' || watchType === 'system' || payload.centerSystemId || payload.center_system_id;
}

function runWatchScheduleService(db, payload = {}) {
  return buildWatchScheduleStatus(db, payload);
}

function runWatchOfflineReadoutService(db, payload = {}) {
  const executorStatus = defaultWatchSessionExecutor.status(db);
  return buildWatchOfflineReadout(db, {
    now: payload.now,
    liveApiEnabled: payload.liveApiEnabled,
    executorStatus
  });
}

function runWatchRecordRunService(db, payload = {}) {
  return recordWatchRunResult(db, payload);
}

function runWatchExecutorStatusService(db) {
  return defaultWatchSessionExecutor.status(db);
}

function runWatchExecutorDisarmService(db, payload = {}) {
  return defaultWatchSessionExecutor.disarm(db, payload);
}

function runWatchExecutorArmService(db, payload = {}, dependencies = {}) {
  return defaultWatchSessionExecutor.arm(db, payload, dependencies);
}

function runWatchExecutorTickService(db, payload = {}, dependencies = {}) {
  return defaultWatchSessionExecutor.tick(db, payload, dependencies);
}

function runAssessmentCreateService(db, payload = {}) {
  return createAssessmentArtifact(db, payload);
}

function runAssessmentListService(db, payload = {}) {
  return {
    artifacts: listAssessmentArtifacts(db, payload)
  };
}

function runAssessmentGetService(db, payload = {}) {
  const artifact = getAssessmentArtifact(db, payload.artifactId || payload.artifact_id);
  if (!artifact) {
    const error = new Error('Assessment artifact not found');
    error.code = 'ASSESSMENT_ARTIFACT_NOT_FOUND';
    throw error;
  }
  return artifact;
}

async function normalizeManualDiscoveryInput(db, payload, dependencies) {
  if (String(payload.scope || '').toLowerCase() === 'actor') {
    const actor = await resolveActorInput(db, payload, dependencies);
    return normalizeManualDiscoveryScope({
      ...payload,
      trigger: payload.trigger || 'manual',
      entityType: actor.entity_type,
      entityId: actor.entity_id,
      entityName: actor.entity_name
    });
  }
  return normalizeManualDiscoveryScope({
    ...payload,
    ...resolveSystemInput(db, payload),
    trigger: payload.trigger || 'manual'
  });
}

function resolveSystemInput(db, payload = {}) {
  const scope = String(payload.scope || '').toLowerCase();
  if (scope !== 'system' && scope !== 'radius') {
    return {};
  }
  if (payload.centerSystemId || payload.center_system_id) {
    return {
      centerSystemId: payload.centerSystemId || payload.center_system_id
    };
  }
  const systemName = payload.centerSystemName || payload.center_system_name || payload.systemName || payload.system_name;
  if (!systemName) {
    return {};
  }
  const system = resolveSystemIdentity(db, { systemName });
  return {
    centerSystemId: system.solar_system_id,
    centerSystemName: system.solar_system_name
  };
}

async function resolveActorInput(db, payload = {}, dependencies = {}) {
  return resolveActorIdentity(db, {
    entityType: payload.entityType || payload.entity_type || payload.actorType || payload.actor_type,
    entityId: payload.entityId || payload.entity_id || payload.actorId || payload.actor_id,
    entityName: payload.entityName || payload.entity_name || payload.actorName || payload.actor_name
  }, dependencies);
}

function assertLiveAllowed(action, input = {}, dependencies = {}) {
  const gate = dependencies.requestControl === false
    ? actionGate(action, input)
    : enterLiveProviderAttempt(action, input, dependencies);
  if (!gate.allowed) {
    const blocker = gate.blockers[0] || taxonomyMessage('LIVE_API_DISABLED', `${action} is not allowed`, { source: 'mutating.action' });
    const error = new Error(blocker.message);
    error.code = blocker.code;
    error.details = gate;
    throw error;
  }
  return gate;
}

function buildSdeTopologyImportAuthority(payload = {}, dependencies = {}) {
  const sourceAuthority = sdeTopologySourceAuthorityFor(payload, dependencies);
  const projectedGrowth = projectedSdeTopologyGrowthFor(payload, dependencies);
  const setupReadout = buildStorageSetupGateReadout({
    storagePreflight: dependencies.storagePreflight,
    storageAuthority: dependencies.storageAuthority,
    storageBudgetBytes: dependencies.storageBudgetBytes
  }, {
    allowStorageSetupGateFixtureInput: dependencies.allowStorageSetupGateFixtureInput === true,
    storageAuthorityConfigReadPath: dependencies.storageAuthorityConfigReadPath,
    storageAuthorityConfigAllowedRoot: dependencies.storageAuthorityConfigAllowedRoot
  });
  const storageBudgetAuthority = sdeTopologyStorageBudgetAuthorityFor(setupReadout, projectedGrowth);
  const blockedReasons = [
    sourceAuthority.decision === 'accepted' ? null : sourceAuthority.reason,
    ...storageBudgetAuthority.issues
  ].filter(Boolean);
  return {
    allowed: blockedReasons.length === 0,
    blocked_reasons: blockedReasons,
    source_authority: sourceAuthority,
    storage_budget_authority: storageBudgetAuthority,
    projected_growth: projectedGrowth,
    renderer_payload_ignored: sdeTopologyRendererSourceClaim(payload) !== null,
    selected_storage_required: true,
    explicit_budget_required: true,
    app_local_fallback_acknowledgement_sufficient: false,
    provider_calls: 0,
    sde_downloads: 0,
    provider_backed_builds: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false
  };
}

function sdeTopologySourceAuthorityFor(payload = {}, dependencies = {}) {
  const rendererClaim = sdeTopologyRendererSourceClaim(payload);
  const trusted = dependencies.sdeTopologySourceAuthority || {};
  const trustedPath = trusted.path || trusted.sourcePath || dependencies.trustedSdeTopologySourcePath || null;
  const basis = trusted.basis || dependencies.trustedSdeTopologySourceBasis || null;
  if (rendererClaim && !trustedPath) {
    return sdeTopologyAuthorityDecision('blocked', 'renderer_source_path_non_authoritative', {
      renderer_payload_ignored: true,
      supplied_by: 'renderer_payload'
    });
  }
  if (!trustedPath) {
    return sdeTopologyAuthorityDecision('blocked', 'trusted_local_source_authority_required', {
      renderer_payload_ignored: Boolean(rendererClaim),
      supplied_by: 'none'
    });
  }
  if (isRemoteReference(trustedPath)) {
    return sdeTopologyAuthorityDecision('blocked', 'remote_source_rejected_for_local_topology_import', {
      renderer_payload_ignored: Boolean(rendererClaim),
      supplied_by: 'trusted_context',
      safe_display: redactSourceForDisplay(trustedPath)
    });
  }
  if (!['trusted_local_operator_source', 'trusted_fixture_context', 'trusted_cli_source'].includes(basis)) {
    return sdeTopologyAuthorityDecision('blocked', 'trusted_local_source_authority_required', {
      renderer_payload_ignored: Boolean(rendererClaim),
      supplied_by: 'trusted_context',
      safe_display: redactSourceForDisplay(trustedPath),
      basis
    });
  }
  return sdeTopologyAuthorityDecision('accepted', 'trusted_local_source_authority', {
    path: trustedPath,
    renderer_payload_ignored: Boolean(rendererClaim),
    supplied_by: 'trusted_context',
    safe_display: redactSourceForDisplay(trustedPath),
    basis,
    path_inspected_before_authority: false
  });
}

function sdeTopologyStorageBudgetAuthorityFor(setupReadout = {}, projectedGrowth = {}) {
  const issues = [];
  const storageAuthority = setupReadout.storage_authority || {};
  const storage = setupReadout.storage || {};
  const budget = setupReadout.budget || {};
  const selectedStorageValid = storageAuthority.mode === 'selected_storage' &&
    storageAuthority.selected === true &&
    storageAuthority.validation_status === 'valid' &&
    storage.state === 'configured_ready';
  if (!selectedStorageValid) {
    issues.push(storage.state === 'missing_unavailable_blocked'
      ? 'storage_missing_unavailable_blocks_topology_import'
      : storage.state === 'invalid_degraded_setup_required'
        ? 'storage_invalid_degraded_blocks_topology_import'
        : 'selected_storage_required_for_topology_import');
  }
  if (!Number.isFinite(Number(budget.budget_bytes)) || Number(budget.budget_bytes) <= 0) {
    issues.push('budget_unconfigured_blocks_topology_import');
  }
  if (budget.state === 'budget_hard_lock') {
    issues.push('budget_hard_lock_blocks_topology_import');
  }
  if (
    Number.isFinite(Number(budget.budget_bytes)) &&
    Number.isFinite(Number(budget.usage_bytes)) &&
    Number(budget.usage_bytes) + Number(projectedGrowth.total_projected_bytes || 0) >= Number(budget.budget_bytes)
  ) {
    issues.push('projected_growth_exceeds_available_topology_budget');
  }
  return {
    decision: issues.length ? 'block_real_local_topology_import' : 'allow_real_local_topology_import',
    issues: [...new Set(issues)],
    setup_gate_state: storage.state || null,
    matrix_state: setupReadout.action_class_matrix?.storage_state || null,
    budget_state: budget.state || null,
    budget_bytes: budget.budget_bytes ?? null,
    usage_bytes: budget.usage_bytes ?? null,
    projected_growth_bytes: projectedGrowth.total_projected_bytes,
    selected_storage_required: true,
    explicit_budget_required: true,
    storage_setup_enforced_now: false
  };
}

function projectedSdeTopologyGrowthFor(payload = {}, dependencies = {}) {
  const supplied = dependencies.projectedSdeTopologyGrowthBytes || payload.projectedGrowthBytes || {};
  const values = {
    source_bytes: positiveNumber(supplied.source_bytes ?? supplied.sourceBytes, 128 * 1024),
    temp_extract_bytes: positiveNumber(supplied.temp_extract_bytes ?? supplied.tempExtractBytes, 256 * 1024),
    staged_table_bytes: positiveNumber(supplied.staged_table_bytes ?? supplied.stagedTableBytes, 64 * 1024),
    db_growth_bytes: positiveNumber(supplied.db_growth_bytes ?? supplied.dbGrowthBytes, 64 * 1024),
    wal_shm_headroom_bytes: positiveNumber(supplied.wal_shm_headroom_bytes ?? supplied.walShmHeadroomBytes, 128 * 1024)
  };
  return {
    ...values,
    total_projected_bytes: Object.values(values).reduce((sum, value) => sum + value, 0),
    includes_temp_cache_db_growth: true,
    projection_is_authorization: false
  };
}

function sdeTopologyRendererSourceClaim(payload = {}) {
  return payload.path || payload.inputPath || payload.sourcePath || payload.source_path || null;
}

function sdeTopologyAuthorityDecision(decision, reason, extra = {}) {
  return {
    decision,
    reason,
    path: extra.path || null,
    basis: extra.basis || null,
    supplied_by: extra.supplied_by || null,
    safe_display: extra.safe_display || null,
    renderer_payload_ignored: extra.renderer_payload_ignored === true,
    path_inspected_before_authority: extra.path_inspected_before_authority === true,
    path_used: decision === 'accepted'
  };
}

function isRemoteReference(value) {
  return /^https?:\/\//i.test(String(value || ''));
}

function redactSourceForDisplay(value) {
  if (!value) {
    return null;
  }
  if (isRemoteReference(value)) {
    return String(value).replace(/\/\/.*$/, '//<remote-source>');
  }
  return '<trusted-local-sde-source>';
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

module.exports = {
  runManualDiscoveryService,
  runManualExpansionService,
  runActorWatchService,
  runSystemRadiusWatchService,
  runMetadataHydrationService,
  runSdeTopologyImportService,
  buildSdeTopologyImportAuthority,
  runSdeInventoryImportService,
  runWatchCreateService,
  runWatchUpdateService,
  runWatchListService,
  runWatchScheduleService,
  runWatchOfflineReadoutService,
  runWatchRecordRunService,
  runWatchExecutorStatusService,
  runWatchExecutorDisarmService,
  runWatchExecutorArmService,
  runWatchExecutorTickService,
  runAssessmentCreateService,
  runAssessmentListService,
  runAssessmentGetService
};
