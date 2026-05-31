const { buildStorageAuthorityPreflight } = require('./storageAuthorityPreflightService');

const BUDGET_WARNING_RATIO = 0.7;
const BUDGET_STRONG_WARNING_RATIO = 0.95;
const BUDGET_HARD_LOCK_RATIO = 1;

function buildStorageSetupGateReadout(input = {}, context = {}) {
  const preflight = storagePreflightFor(input, context);
  const budgetBytes = budgetBytesFor(input, context);
  const usageBytes = usageBytesFor(preflight);
  const rawStorageAuthority = buildStorageAuthorityReadout(input, context, preflight, budgetBytes);
  const budgetPosture = classifyBudgetPosture({ budgetBytes, usageBytes });
  const storageAuthority = applyBudgetToStorageAuthority(rawStorageAuthority, budgetPosture);
  const storagePosture = classifyStoragePosture(preflight, storageAuthority);
  const locked = storagePosture.blocks_real_collection === true || budgetPosture.blocks_writes === true;
  const actionClassMatrix = buildActionClassMatrix({ storagePosture, budgetPosture });

  return {
    action: 'storage.setup_gate_readout',
    classification: 'read-only storage setup gate posture',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    enforcement_state: 'not_implemented_readout_only',
    storage_authority: storageAuthority,
    storage: storagePosture,
    budget: budgetPosture,
    action_class_matrix: actionClassMatrix,
    work_classes: workClasses({ locked, storagePosture, budgetPosture }),
    source: {
      preflight_action: preflight.action || 'fixture.storage_authority_preflight',
      database_mode: preflight.database?.mode || null,
      database_source: preflight.database?.source || null,
      byte_usage_source: 'storage.authority_preflight byte_usage; main Atlas storage budget is readout-only in HS115',
      storage_authority_config_source: storageAuthority.config_source,
      renderer_payload_storage_facts_ignored: context.source === 'renderer'
    },
    boundary: [
      'Read-only setup gate readout only; it does not enforce storage lockout.',
      'It does not write storage config, choose a final storage config path, or persist a budget.',
      'It does not move, copy, migrate, create, relocate, restore, or delete active DB files.',
      'It does not call providers, create Evidence/EVEidence, hydrate metadata, prune/delete records, change schema, or redesign renderer UI.',
      'Budget means Atlas-controlled disk usage under storage authority, not provider/API request pacing.'
    ]
  };
}

function applyBudgetToStorageAuthority(storageAuthority, budgetPosture) {
  if (budgetPosture.state !== 'budget_hard_lock') {
    return storageAuthority;
  }
  return {
    ...storageAuthority,
    write_allowed_if_enforced_later: false,
    provider_movement_allowed_if_enforced_later: false
  };
}

function buildStorageAuthorityReadout(input = {}, context = {}, preflight = {}, trustedBudgetBytes = null) {
  const fixtureInput = context.allowStorageSetupGateFixtureInput === true && input.storageAuthority;
  const trustedInput = context.storageAuthority || (fixtureInput ? input.storageAuthority : null);
  const database = preflight.database || {};
  const selectedByPreflight = database.source === 'configured' && Boolean(database.path);
  const fallbackAvailableByPreflight = database.source === 'fallback' && Boolean(database.path);
  const config = trustedInput || {};
  const configSource = trustedInput?.config_source || trustedInput?.configSource || (trustedInput ? 'fixture' : 'derived_from_preflight');
  const mode = config.mode || derivedAuthorityMode({ config, selectedByPreflight, fallbackAvailableByPreflight, database });
  const acknowledgement = acknowledgementReadout(config, mode);
  const selected = config.selected === undefined
    ? mode === 'selected_storage'
    : config.selected === true;
  const fallbackAvailable = config.fallback_available === undefined && config.fallbackAvailable === undefined
    ? fallbackAvailableByPreflight || mode.startsWith('app_local_fallback')
    : (config.fallback_available ?? config.fallbackAvailable) === true;
  const fallbackAcknowledged = acknowledgement.status === 'acknowledged';
  const storageRoot = config.storage_root || config.storageRoot || (database.path ? dirnameOrNull(database.path) : null);
  const databasePath = config.database_path || config.databasePath || database.path || null;
  const validationStatus = validationStatusFor({ mode, database, config });
  const configBudgetBytes = config.budget_bytes ?? config.budgetBytes;
  const hasConfigBudget = Number.isFinite(Number(configBudgetBytes));
  const hasTrustedBudget = Number.isFinite(Number(trustedBudgetBytes)) && Number(trustedBudgetBytes) > 0;
  const budgetSource = config.budget_source || config.budgetSource || (hasConfigBudget
    ? 'fixture_configured'
    : hasTrustedBudget
      ? 'trusted_context'
      : 'unconfigured');
  const budgetBytes = hasConfigBudget
    ? Number(config.budget_bytes ?? config.budgetBytes)
    : hasTrustedBudget
      ? Number(trustedBudgetBytes)
      : null;
  const readAllowed = readAllowedFor({ mode, database, validationStatus });
  const writeAllowed = writeAllowedFor({ mode, validationStatus, acknowledgement });
  const providerAllowed = writeAllowed && mode !== 'demo_fixture_mode';

  return {
    mode,
    selected,
    fallback_available: fallbackAvailable,
    fallback_acknowledged: fallbackAcknowledged,
    acknowledgement_status: acknowledgement.status,
    acknowledgement_basis: acknowledgement.basis,
    acknowledgement_invalid_reason: acknowledgement.invalid_reason,
    config_source: configSource,
    config_version: Number(config.config_version ?? config.configVersion ?? 0) || null,
    storage_root: storageRoot,
    database_path: databasePath,
    path_basis: config.path_basis || config.pathBasis || pathBasisFor({ mode, selected, fallbackAvailable }),
    validation_status: validationStatus,
    budget_source: budgetSource,
    budget_bytes: budgetBytes,
    read_allowed: readAllowed,
    write_allowed_if_enforced_later: writeAllowed,
    provider_movement_allowed_if_enforced_later: providerAllowed,
    unresolved_decisions: [
      'final portable config filename/location',
      'whether acknowledged fallback becomes selected storage or remains distinct',
      'whether budget must be explicit before real provider-backed work'
    ],
    read_only: true,
    mutates_state: false
  };
}

function derivedAuthorityMode({ config, selectedByPreflight, fallbackAvailableByPreflight, database }) {
  if (config.acknowledgement_status === 'invalidated' || config.acknowledgementStatus === 'invalidated') {
    return 'acknowledgement_invalidated';
  }
  if (selectedByPreflight) {
    if (database.mode === 'missing') {
      return 'selected_storage_missing_unavailable';
    }
    if (database.mode === 'outside_policy') {
      return 'selected_storage_invalid_degraded';
    }
    return 'selected_storage';
  }
  if (fallbackAvailableByPreflight) {
    return 'app_local_fallback_available';
  }
  return 'no_storage_selected';
}

function acknowledgementReadout(config = {}, mode) {
  const explicitStatus = config.acknowledgement_status || config.acknowledgementStatus || null;
  const invalidReason = config.acknowledgement_invalid_reason || config.acknowledgementInvalidReason || null;
  if (explicitStatus === 'invalidated' || mode === 'acknowledgement_invalidated') {
    return {
      status: 'invalidated',
      basis: config.acknowledgement_basis || config.acknowledgementBasis || 'fixture_invalidated',
      invalid_reason: invalidReason || 'fixture invalidation reason not specified'
    };
  }
  if (explicitStatus === 'acknowledged' || mode === 'app_local_fallback_acknowledged') {
    return {
      status: 'acknowledged',
      basis: config.acknowledgement_basis || config.acknowledgementBasis || 'fixture_operator_acknowledgement',
      invalid_reason: null
    };
  }
  if (mode === 'app_local_fallback_available') {
    return {
      status: 'not_acknowledged',
      basis: config.acknowledgement_basis || config.acknowledgementBasis || 'fallback_available_without_operator_acknowledgement',
      invalid_reason: null
    };
  }
  return {
    status: explicitStatus || 'not_required',
    basis: config.acknowledgement_basis || config.acknowledgementBasis || 'explicit_selected_storage_or_no_fallback',
    invalid_reason: null
  };
}

function validationStatusFor({ mode, database, config }) {
  if (config.validation_status || config.validationStatus) {
    return config.validation_status || config.validationStatus;
  }
  if (mode === 'no_storage_selected') {
    return 'not_selected';
  }
  if (mode === 'acknowledgement_invalidated') {
    return 'invalidated';
  }
  if (mode === 'selected_storage_missing_unavailable' || database.mode === 'missing') {
    return 'missing_unavailable';
  }
  if (mode === 'selected_storage_invalid_degraded' || database.mode === 'outside_policy') {
    return 'invalid_degraded';
  }
  return 'valid';
}

function readAllowedFor({ mode, database, validationStatus }) {
  if (mode === 'no_storage_selected') {
    return false;
  }
  if (validationStatus === 'missing_unavailable') {
    return false;
  }
  if (validationStatus === 'invalid_degraded') {
    return database.exists === true;
  }
  return mode !== 'acknowledgement_invalidated';
}

function writeAllowedFor({ mode, validationStatus, acknowledgement }) {
  if (validationStatus !== 'valid') {
    return false;
  }
  if (mode === 'selected_storage') {
    return true;
  }
  if (mode === 'app_local_fallback_acknowledged') {
    return acknowledgement.status === 'acknowledged';
  }
  return false;
}

function pathBasisFor({ mode, selected, fallbackAvailable }) {
  if (selected) {
    return 'explicit_selected_storage';
  }
  if (fallbackAvailable || mode.startsWith('app_local_fallback')) {
    return 'app_local_current_file_fallback';
  }
  return 'not_selected';
}

function dirnameOrNull(filePath) {
  if (!filePath) {
    return null;
  }
  const path = require('node:path');
  return path.dirname(filePath);
}

function storagePreflightFor(input = {}, context = {}) {
  if (context.allowStorageSetupGateFixtureInput === true && input.storagePreflight) {
    return input.storagePreflight;
  }
  if (context.storagePreflight) {
    return context.storagePreflight;
  }
  return buildStorageAuthorityPreflight({}, {
    ...context,
    allowStorageAuthorityPathOverrides: false
  });
}

function budgetBytesFor(input = {}, context = {}) {
  if (Number.isFinite(Number(context.storageBudgetBytes))) {
    return Number(context.storageBudgetBytes);
  }
  if (context.allowStorageSetupGateFixtureInput === true && Number.isFinite(Number(input.storageBudgetBytes))) {
    return Number(input.storageBudgetBytes);
  }
  return null;
}

function usageBytesFor(preflight = {}) {
  const byteUsage = preflight.byte_usage || {};
  return Number(byteUsage.known_controlled_locations_bytes || 0) + Number(byteUsage.database_bytes || 0);
}

function classifyStoragePosture(preflight = {}, storageAuthority = {}) {
  const database = preflight.database || {};
  const mode = database.mode || 'missing';
  const hasPath = typeof database.path === 'string' && database.path.trim().length > 0;
  const exists = database.exists === true;
  const parentAvailable = database.parent?.exists === true && database.parent?.is_directory !== false;
  const outsidePolicy = database.mode_flags?.outside_policy === true || mode === 'outside_policy';
  const demoFixture = mode === 'demo_fixture';
  const snapshotStatus = preflight.snapshot?.settings?.status || null;
  const degradedSettings = snapshotStatus === 'degraded';

  if (demoFixture) {
    return posture({
      state: 'demo_fixture_only',
      setup_gate: 'demo_fixture_only',
      real_alpha_collection: 'blocked_until_explicit_storage',
      blocks_real_collection: true,
      reason: 'Demo/fixture posture is allowed only for separated demo or fixture work.',
      database
    });
  }
  if (storageAuthority.mode === 'app_local_fallback_acknowledged') {
    return posture({
      state: 'configured_ready',
      setup_gate: 'ready',
      real_alpha_collection: 'ready_subject_to_budget_and_other_gates',
      blocks_real_collection: false,
      reason: 'App-local/current-file fallback is explicitly acknowledged in fixture readout.',
      database
    });
  }
  if (storageAuthority.mode === 'acknowledgement_invalidated') {
    return posture({
      state: 'fallback_ack_required',
      setup_gate: 'operator_ack_required',
      real_alpha_collection: 'blocked_until_explicit_acknowledgement',
      blocks_real_collection: true,
      reason: 'Previous fallback acknowledgement is invalidated.',
      database
    });
  }
  if (!hasPath || mode === 'no_storage_selected') {
    return posture({
      state: 'no_storage_selected',
      setup_gate: 'setup_required',
      real_alpha_collection: 'blocked',
      blocks_real_collection: true,
      reason: 'No explicit Atlas storage location is selected.',
      database
    });
  }
  if (!exists || mode === 'missing' || !parentAvailable) {
    return posture({
      state: 'missing_unavailable_blocked',
      setup_gate: 'setup_required',
      real_alpha_collection: 'blocked',
      blocks_real_collection: true,
      reason: 'Configured or expected storage is missing or unavailable; Atlas should not silently relocate.',
      database
    });
  }
  if (outsidePolicy || degradedSettings) {
    return posture({
      state: 'invalid_degraded_setup_required',
      setup_gate: 'setup_required',
      real_alpha_collection: 'blocked',
      blocks_real_collection: true,
      reason: outsidePolicy
        ? 'Storage is outside current policy without accepted authority.'
        : 'Storage support settings are degraded and need operator attention.',
      database
    });
  }
  if (mode === 'configured') {
    return posture({
      state: 'configured_ready',
      setup_gate: 'ready',
      real_alpha_collection: 'ready_subject_to_budget_and_other_gates',
      blocks_real_collection: false,
      reason: 'Explicit configured storage is present.',
      database
    });
  }
  if (mode === 'fallback') {
    return posture({
      state: 'fallback_ack_required',
      setup_gate: 'operator_ack_required',
      real_alpha_collection: 'blocked_until_explicit_acknowledgement',
      blocks_real_collection: true,
      reason: 'Project/current-file fallback exists but real/alpha collection should wait for explicit operator acknowledgement.',
      database
    });
  }
  return posture({
    state: 'invalid_degraded_setup_required',
    setup_gate: 'setup_required',
    real_alpha_collection: 'blocked',
    blocks_real_collection: true,
    reason: `Unhandled storage mode ${mode}; setup review required.`,
    database
  });
}

function posture({ state, setup_gate, real_alpha_collection, blocks_real_collection, reason, database }) {
  return {
    state,
    setup_gate,
    real_alpha_collection,
    blocks_real_collection,
    reason,
    database: {
      mode: database.mode || null,
      source: database.source || null,
      path: database.path || null,
      exists: database.exists === true,
      parent_exists: database.parent?.exists === true,
      outside_policy: database.mode_flags?.outside_policy === true,
      demo_fixture: database.mode_flags?.demo_fixture === true
    }
  };
}

function classifyBudgetPosture({ budgetBytes, usageBytes }) {
  if (!Number.isFinite(Number(budgetBytes)) || Number(budgetBytes) <= 0) {
    return {
      state: 'budget_unconfigured',
      budget_bytes: null,
      usage_bytes: usageBytes,
      usage_ratio: null,
      warning_level: 'unconfigured',
      blocks_writes: false,
      reason: 'No main Atlas storage budget is configured for this readout.'
    };
  }
  const normalizedBudget = Number(budgetBytes);
  const ratio = normalizedBudget > 0 ? usageBytes / normalizedBudget : 0;
  if (ratio >= BUDGET_HARD_LOCK_RATIO) {
    return budgetState('budget_hard_lock', normalizedBudget, usageBytes, ratio, 'hard_lock', true);
  }
  if (ratio >= BUDGET_STRONG_WARNING_RATIO) {
    return budgetState('budget_strong_warning', normalizedBudget, usageBytes, ratio, 'strong_warning', false);
  }
  if (ratio >= BUDGET_WARNING_RATIO) {
    return budgetState('budget_warning', normalizedBudget, usageBytes, ratio, 'warning', false);
  }
  return budgetState('within_budget', normalizedBudget, usageBytes, ratio, 'none', false);
}

function budgetState(state, budgetBytes, usageBytes, ratio, warningLevel, blocksWrites) {
  return {
    state,
    budget_bytes: budgetBytes,
    usage_bytes: usageBytes,
    usage_ratio: Number(ratio.toFixed(4)),
    warning_level: warningLevel,
    blocks_writes: blocksWrites,
    thresholds: {
      warning_at_ratio: BUDGET_WARNING_RATIO,
      strong_warning_at_ratio: BUDGET_STRONG_WARNING_RATIO,
      hard_lock_at_ratio: BUDGET_HARD_LOCK_RATIO
    }
  };
}

function workClasses({ locked, storagePosture, budgetPosture }) {
  const localRecordsAvailable = storagePosture.database.exists === true;
  return {
    locked,
    allowed_while_locked: [
      'storage setup/re-establish',
      'settings needed to fix storage',
      'read-only help/status',
      'clearly separated demo/fixture mode'
    ],
    blocked_while_locked: [
      'provider-backed acquisition',
      'Evidence/EVEidence writes',
      'hydration writes',
      'snapshots/support artifacts when over budget or path invalid',
      'destructive pruning/deletion execution'
    ],
    local_read_report: {
      state: localRecordsAvailable ? 'available_if_records_accessible' : 'blocked_storage_unavailable',
      blocked: !localRecordsAvailable,
      reason: localRecordsAvailable
        ? 'Local read/report behavior is separate from provider-backed acquisition and writes.'
        : 'Local records cannot be read when required storage is unavailable.'
    },
    blocked_reasons: [
      storagePosture.blocks_real_collection ? storagePosture.state : null,
      budgetPosture.blocks_writes ? budgetPosture.state : null
    ].filter(Boolean)
  };
}

function buildActionClassMatrix({ storagePosture, budgetPosture }) {
  const state = matrixStateFor({ storagePosture, budgetPosture });
  const context = matrixContext({ state, storagePosture, budgetPosture });
  const actions = Object.fromEntries(actionClassNames().map((actionClass) => [
    actionClass,
    decisionFor(actionClass, context)
  ]));

  return {
    storage_state: state,
    enforcement_state: 'not_implemented_readout_only',
    basis: {
      storage_state: storagePosture.state,
      setup_gate: storagePosture.setup_gate,
      budget_state: budgetPosture.state,
      local_inspection_available: context.localInspectionAvailable,
      local_inspection_basis: context.localInspectionBasis,
      provider_movement_allowed_by_storage: context.providerMovementAllowedByStorage,
      write_posture: context.writePosture,
      block_hold_reason: context.blockHoldReason,
      result_basis: context.resultBasis
    },
    actions
  };
}

function matrixStateFor({ storagePosture, budgetPosture }) {
  if (storagePosture.state === 'no_storage_selected') {
    return 'no_storage_selected';
  }
  if (storagePosture.state === 'fallback_ack_required') {
    return 'current_file_fallback_unacknowledged';
  }
  if (storagePosture.state === 'demo_fixture_only') {
    return 'demo_fixture_mode';
  }
  if (storagePosture.state === 'missing_unavailable_blocked') {
    return 'configured_storage_missing_unavailable';
  }
  if (storagePosture.state !== 'configured_ready') {
    return 'configured_storage_invalid_degraded';
  }
  if (budgetPosture.state === 'budget_hard_lock') {
    return 'budget_hard_lock_full';
  }
  if (budgetPosture.state === 'budget_strong_warning') {
    return 'budget_strong_warning';
  }
  if (budgetPosture.state === 'budget_warning') {
    return 'budget_warning';
  }
  return 'configured_storage_ready';
}

function matrixContext({ state, storagePosture, budgetPosture }) {
  const dbExists = storagePosture.database.exists === true;
  const fixture = state === 'demo_fixture_mode';
  const degraded = state === 'configured_storage_invalid_degraded';
  const missing = state === 'configured_storage_missing_unavailable';
  const noStorage = state === 'no_storage_selected';
  const fallback = state === 'current_file_fallback_unacknowledged';
  const hardLock = state === 'budget_hard_lock_full';
  const localInspectionAvailable = dbExists || fixture || fallback || hardLock;
  const localInspectionBasis = fixture
    ? 'fixture'
    : degraded
      ? 'read-only degraded'
      : missing || noStorage
        ? 'conditional safe handle only'
        : 'local';
  const providerMovementAllowedByStorage = [
    'configured_storage_ready',
    'budget_warning',
    'budget_strong_warning'
  ].includes(state);
  const writePosture = writePostureForState(state);
  const blockHoldReason = blockReasonForState(state, storagePosture, budgetPosture);

  return {
    state,
    storagePosture,
    budgetPosture,
    fixture,
    degraded,
    missing,
    noStorage,
    fallback,
    hardLock,
    localInspectionAvailable,
    localInspectionBasis,
    providerMovementAllowedByStorage,
    writePosture,
    blockHoldReason,
    resultBasis: resultBasisForState(state)
  };
}

function writePostureForState(state) {
  if (state === 'configured_storage_ready' || state === 'budget_warning') {
    return 'writes_allowed_subject_to_action_gates';
  }
  if (state === 'budget_strong_warning') {
    return 'conditional_projected_safe_writes_only';
  }
  if (state === 'demo_fixture_mode') {
    return 'fixture_only_writes';
  }
  if (state === 'budget_hard_lock_full') {
    return 'writes_blocked_by_budget';
  }
  return 'writes_blocked_by_storage';
}

function blockReasonForState(state, storagePosture, budgetPosture) {
  if (state === 'configured_storage_ready') {
    return null;
  }
  if (state === 'budget_warning') {
    return 'budget_warning';
  }
  if (state === 'budget_strong_warning') {
    return 'budget_strong_warning';
  }
  if (state === 'budget_hard_lock_full') {
    return 'write_blocked_by_budget';
  }
  if (state === 'current_file_fallback_unacknowledged') {
    return 'fallback_acknowledgement_required';
  }
  if (state === 'demo_fixture_mode') {
    return 'demo_fixture_only';
  }
  if (state === 'no_storage_selected') {
    return 'storage_setup_required';
  }
  if (state === 'configured_storage_missing_unavailable') {
    return 'storage_unavailable';
  }
  if (state === 'configured_storage_invalid_degraded') {
    return 'storage_degraded';
  }
  return storagePosture.state || budgetPosture.state || 'storage_review_required';
}

function resultBasisForState(state) {
  if (state === 'demo_fixture_mode') {
    return ['fixture', 'read-only'];
  }
  if (state === 'configured_storage_invalid_degraded') {
    return ['local', 'degraded', 'read-only'];
  }
  if (state === 'budget_warning' || state === 'budget_strong_warning') {
    return ['local', 'provider-backed-conditional'];
  }
  if (state === 'configured_storage_ready') {
    return ['local', 'provider-backed-eligible'];
  }
  return ['local', 'read-only'];
}

function actionClassNames() {
  return [
    'setup_config_changes',
    'local_db_inspection',
    'local_reports_observation',
    'assessment_writing',
    'zkill_discovery',
    'esi_evidence_expansion',
    'fast_view_metadata_hydration',
    'background_hydration',
    'snapshot_support_artifact_write',
    'pruning_deletion_preflight',
    'pruning_deletion_execution'
  ];
}

function decisionFor(actionClass, context) {
  const state = context.state;
  if (actionClass === 'setup_config_changes') {
    return decision('allow', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'setup_config_surface_allowed',
      resultBasis: ['local', 'read-only']
    });
  }
  if (actionClass === 'local_db_inspection') {
    return localInspectionDecision(actionClass, context);
  }
  if (actionClass === 'local_reports_observation') {
    return localReportDecision(actionClass, context);
  }
  if (actionClass === 'assessment_writing') {
    return assessmentDecision(actionClass, context);
  }
  if (actionClass === 'zkill_discovery' || actionClass === 'esi_evidence_expansion') {
    return providerEvidenceDecision(actionClass, context);
  }
  if (actionClass === 'fast_view_metadata_hydration') {
    return fastHydrationDecision(actionClass, context);
  }
  if (actionClass === 'background_hydration') {
    return backgroundHydrationDecision(actionClass, context);
  }
  if (actionClass === 'snapshot_support_artifact_write') {
    return snapshotDecision(actionClass, context);
  }
  if (actionClass === 'pruning_deletion_preflight') {
    return pruningPreflightDecision(actionClass, context);
  }
  if (actionClass === 'pruning_deletion_execution') {
    return pruningExecutionDecision(actionClass, context);
  }
  return decision('block', actionClass, context);
}

function localInspectionDecision(actionClass, context) {
  if (context.state === 'demo_fixture_mode') {
    return decision('fixture_only', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'read_only',
      resultBasis: ['fixture', 'read-only']
    });
  }
  if (context.state === 'configured_storage_invalid_degraded') {
    return decision('read_only_only', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'read_only',
      resultBasis: ['local', 'degraded', 'read-only']
    });
  }
  if (context.state === 'no_storage_selected' || context.state === 'configured_storage_missing_unavailable') {
    return decision('conditional', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'read_only_if_safe_handle_exists',
      blockHoldReason: context.state === 'no_storage_selected' ? 'storage_setup_required' : 'storage_unavailable'
    });
  }
  if (context.state === 'budget_hard_lock_full') {
    return decision('allow_if_safe', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'read_only'
    });
  }
  return decision('allow', actionClass, context, {
    providerMovementRequired: false,
    writePosture: 'read_only'
  });
}

function localReportDecision(actionClass, context) {
  if (context.state === 'demo_fixture_mode') {
    return decision('fixture_only', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'read_only',
      resultBasis: ['fixture', 'read-only']
    });
  }
  if (context.state === 'configured_storage_invalid_degraded') {
    return decision('degraded_read_only', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'read_only',
      resultBasis: ['local', 'degraded', 'read-only']
    });
  }
  if (context.state === 'no_storage_selected' || context.state === 'configured_storage_missing_unavailable') {
    return decision('conditional', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'read_only_if_safe_handle_exists'
    });
  }
  if (context.state === 'budget_hard_lock_full') {
    return decision('allow_if_safe', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'read_only'
    });
  }
  return decision('allow', actionClass, context, {
    providerMovementRequired: false,
    writePosture: 'read_only'
  });
}

function assessmentDecision(actionClass, context) {
  if (context.state === 'configured_storage_ready' || context.state === 'budget_warning') {
    return decision('allow', actionClass, context, { providerMovementRequired: false });
  }
  if (context.state === 'budget_strong_warning') {
    return decision('conditional', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'conditional_projected_safe_writes_only'
    });
  }
  if (context.state === 'demo_fixture_mode') {
    return decision('fixture_only', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'fixture_only_writes',
      resultBasis: ['fixture']
    });
  }
  return decision('block', actionClass, context, { providerMovementRequired: false });
}

function providerEvidenceDecision(actionClass, context) {
  if (context.state === 'configured_storage_ready' || context.state === 'budget_warning') {
    return decision('provider_gated', actionClass, context, {
      providerMovementRequired: true,
      resultBasis: ['provider-backed', 'local-write']
    });
  }
  if (context.state === 'budget_strong_warning') {
    return decision('conditional', actionClass, context, {
      providerMovementRequired: true,
      writePosture: 'conditional_projected_safe_writes_only',
      blockHoldReason: 'budget_strong_warning'
    });
  }
  return decision('block', actionClass, context, {
    providerMovementRequired: true
  });
}

function fastHydrationDecision(actionClass, context) {
  if (context.state === 'configured_storage_ready' || context.state === 'budget_warning') {
    return decision('provider_gated', actionClass, context, {
      providerMovementRequired: true,
      resultBasis: ['provider-backed', 'metadata-readability']
    });
  }
  if (context.state === 'budget_strong_warning') {
    return decision('active_view_only', actionClass, context, {
      providerMovementRequired: true,
      writePosture: 'conditional_projected_safe_writes_only',
      blockHoldReason: 'budget_strong_warning',
      resultBasis: ['provider-backed-conditional', 'metadata-readability']
    });
  }
  if (context.state === 'demo_fixture_mode') {
    return decision('fixture_only', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'fixture_only_writes',
      resultBasis: ['fixture']
    });
  }
  return decision('block_writes', actionClass, context, {
    providerMovementRequired: true
  });
}

function backgroundHydrationDecision(actionClass, context) {
  if (context.state === 'configured_storage_ready' || context.state === 'budget_warning') {
    return decision('provider_gated', actionClass, context, {
      providerMovementRequired: true,
      resultBasis: ['provider-backed', 'metadata-readability']
    });
  }
  if (context.state === 'budget_strong_warning') {
    return decision('defer_by_default', actionClass, context, {
      providerMovementRequired: true,
      writePosture: 'conditional_projected_safe_writes_only',
      blockHoldReason: 'budget_strong_warning'
    });
  }
  return decision('block', actionClass, context, {
    providerMovementRequired: true
  });
}

function snapshotDecision(actionClass, context) {
  if (context.state === 'configured_storage_ready') {
    return decision('allow_if_destination_safe', actionClass, context, { providerMovementRequired: false });
  }
  if (context.state === 'budget_warning') {
    return decision('allow_if_projected_safe', actionClass, context, { providerMovementRequired: false });
  }
  if (context.state === 'budget_strong_warning') {
    return decision('conditional', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'conditional_projected_safe_writes_only'
    });
  }
  if (context.state === 'demo_fixture_mode') {
    return decision('fixture_disposable_only', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'fixture_only_writes',
      resultBasis: ['fixture']
    });
  }
  if (context.state === 'configured_storage_missing_unavailable' || context.state === 'configured_storage_invalid_degraded') {
    return decision('conditional_alternate', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'conditional_independently_valid_destination'
    });
  }
  return decision('block', actionClass, context, { providerMovementRequired: false });
}

function pruningPreflightDecision(actionClass, context) {
  if (['configured_storage_ready', 'budget_warning', 'budget_strong_warning'].includes(context.state)) {
    return decision('allow', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'read_only'
    });
  }
  if (context.state === 'budget_hard_lock_full') {
    return decision('allow_readout', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'read_only'
    });
  }
  if (context.state === 'configured_storage_invalid_degraded') {
    return decision('read_only_only', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'read_only'
    });
  }
  if (context.state === 'demo_fixture_mode') {
    return decision('fixture_only', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'read_only',
      resultBasis: ['fixture', 'read-only']
    });
  }
  return decision('block', actionClass, context, { providerMovementRequired: false });
}

function pruningExecutionDecision(actionClass, context) {
  if (['configured_storage_ready', 'budget_warning', 'budget_strong_warning', 'budget_hard_lock_full'].includes(context.state)) {
    return decision('future_runway_only', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'destructive_execution_blocked_without_future_runway',
      blockHoldReason: 'future_accepted_runway_required'
    });
  }
  if (context.state === 'demo_fixture_mode') {
    return decision('fixture_only', actionClass, context, {
      providerMovementRequired: false,
      writePosture: 'fixture_only_destructive_execution',
      resultBasis: ['fixture']
    });
  }
  return decision('block', actionClass, context, { providerMovementRequired: false });
}

function decision(posture, actionClass, context, overrides = {}) {
  const providerMovementRequired = overrides.providerMovementRequired === true;
  return {
    action_class: actionClass,
    posture,
    enforcement_state: 'not_implemented_readout_only',
    basis: {
      storage_state: context.state,
      local_inspection_available: context.localInspectionAvailable,
      local_inspection_basis: context.localInspectionBasis,
      provider_movement_required: providerMovementRequired,
      write_posture: overrides.writePosture || context.writePosture,
      block_hold_reason: overrides.blockHoldReason === undefined ? context.blockHoldReason : overrides.blockHoldReason,
      result_basis: overrides.resultBasis || context.resultBasis
    }
  };
}

module.exports = {
  buildStorageSetupGateReadout
};
