const path = require('node:path');
const { buildExternalIoStateReadout } = require('./externalIoStateService');
const { buildStorageAuthorityConfigReadback } = require('./storageAuthorityConfigWriteService');
const { buildStorageSetupGateReadout } = require('./storageSetupGateReadoutService');
const { buildSupportArtifactPathAuthorityPreview } = require('./supportArtifactPathAuthorityService');
const { projectRoot } = require('../util/tempPaths');

const FORBIDDEN_RENDERER_POLICY_KEYS = Object.freeze([
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
  'storageRoot',
  'storage_root',
  'databasePath',
  'database_path',
  'storageAuthority',
  'storage_authority',
  'storageBudgetBytes',
  'storage_budget_bytes',
  'budgetBytes',
  'budget_bytes',
  'fallbackAcknowledgement',
  'fallback_acknowledgement',
  'trustedContext',
  'trusted_context',
  'allowCreate',
  'allow_create',
  'probePath',
  'probe_path',
  'configPath',
  'config_path'
]);

function buildSupportArtifactCreationPolicyPreview(input = {}, context = {}) {
  const trustedInput = context.source === 'renderer' ? {} : input;
  const rendererPayloadIgnored = context.source === 'renderer' && rendererPayloadHasPolicyClaims(input);
  const commandMetadata = Array.isArray(context.commandMetadata) ? context.commandMetadata : [];
  const storageAuthorityReadback = buildStorageAuthorityConfigReadback(trustedInput, context);
  const setupGate = context.storageSetupGate || buildStorageSetupGateReadout(trustedInput, {
    ...context,
    allowStorageSetupGateFixtureInput: context.allowStorageSetupGateFixtureInput === true && context.source !== 'renderer'
  });
  const pathAuthority = context.supportArtifactPathAuthority || buildSupportArtifactPathAuthorityPreview(trustedInput, {
    ...context,
    commandMetadata
  });
  const externalIo = buildExternalIoStateReadout(trustedInput, context);
  const commandIndex = new Map(commandMetadata.map((entry) => [entry.command, entry]));
  const classes = [
    creationClass('runtime_snapshot_rolling', {
      label: 'Rolling runtime DB snapshot',
      command: 'runtime.db_snapshot.create',
      pathClassId: 'runtime_snapshot_rolling',
      lifecycle: 'rolling_or_overwritten_recovery_copy',
      creationKind: 'snapshot_support_artifact_write'
    }),
    creationClass('runtime_snapshot_retained', {
      label: 'Retained/manual runtime DB snapshot',
      command: 'runtime.db_snapshot.create',
      pathClassId: 'runtime_snapshot_retained',
      lifecycle: 'retained_recovery_copy',
      creationKind: 'snapshot_support_artifact_write'
    }),
    creationClass('operator_debug_trace_pack', {
      label: 'Operator debug trace pack',
      command: 'support.debug_trace_pack',
      pathClassId: 'operator_debug_trace_pack',
      lifecycle: 'retained_support_trace',
      creationKind: 'trace_pack_support_artifact_write'
    }),
    creationClass('readiness_preflight_export', {
      label: 'Readiness/preflight export',
      command: null,
      pathClassId: 'readiness_preflight_reports',
      lifecycle: 'future_explicit_export_only',
      creationKind: 'future_local_support_export'
    })
  ].map((spec) => classifyCreationRequest(spec, {
    commandIndex,
    setupGate,
    pathAuthority,
    externalIo,
    storageAuthorityReadback
  }));

  return {
    action: 'support.artifact_creation_policy.preview',
    classification: 'read-only support artifact creation policy preview',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    creates_support_artifacts: false,
    creates_snapshots: false,
    creates_trace_packs: false,
    creates_files: false,
    creates_directories: false,
    provider_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    sde_download_calls: 0,
    storage_config_written: false,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    would_allow_is_authorization: false,
    renderer_payload_ignored: rendererPayloadIgnored,
    project_root: path.resolve(projectRoot()),
    sources: {
      storage_authority_config_readback: storageAuthorityReadback.action,
      storage_authority_config_status: storageAuthorityReadback.persisted_config.status,
      storage_setup_gate: setupGate.action,
      storage_state: setupGate.action_class_matrix.storage_state,
      budget_state: setupGate.budget.state,
      support_artifact_path_authority: pathAuthority.action,
      external_io_state_readout: externalIo.action,
      external_io_state: externalIo.state,
      external_io_local_only_posture: externalIo.local_only_posture,
      external_io_provider_backed_posture: externalIo.provider_backed_posture
    },
    summary: summarizeClasses(classes),
    classes,
    renderer_anti_forgery: {
      renderer_payload_ignored: rendererPayloadIgnored,
      path_claims_accepted: false,
      storage_authority_claims_accepted: false,
      fallback_acknowledgement_claims_accepted: false,
      budget_claims_accepted: false,
      trusted_context_claims_accepted: false,
      filesystem_probe_performed: false
    },
    external_io_policy: {
      off_blocks_local_support_policy_readout: false,
      off_blocks_support_artifact_creation_policy: false,
      on_authorizes_creation: false,
      support_artifact_creation_calls_providers: false,
      provider_backed_posture: externalIo.provider_backed_posture,
      reenable_catch_up_flood: externalIo.reenable_catch_up_policy?.catch_up_flood === true
    },
    boundary: [
      'Read-only support artifact creation policy preview only; it does not create snapshots, trace packs, exports, files, or directories.',
      'It composes existing storage authority, setup gate, path authority, External I/O, and command metadata posture without runtime interception.',
      'Renderer payloads cannot choose output paths, forge storage authority, forge fallback acknowledgement, forge budget, forge trusted context, or probe files.',
      'External I/O is not required for this local support policy readout and does not authorize support artifact creation.',
      'Support artifacts are support/readout material, not Evidence/EVEidence, Discovery refs, Observation, or Assessment Memory.'
    ]
  };
}

function classifyCreationRequest(spec, context) {
  const command = spec.command ? context.commandIndex.get(spec.command) : null;
  const pathClass = context.pathAuthority.classes.find((entry) => entry.id === spec.pathClassId) || null;
  const matrixDecision = context.setupGate.action_class_matrix.actions.snapshot_support_artifact_write || {};
  const storageState = context.setupGate.action_class_matrix.storage_state;
  const budgetState = context.setupGate.budget.state;
  const posture = postureFor({ spec, command, pathClass, matrixDecision, storageState, budgetState });
  const confirmationRequired = command?.authority?.confirmation_required === true || spec.command === null;
  const trustedContextRequired = spec.command === null || command?.effects?.includes('support-artifact') || command?.authority?.confirmation_required === true;

  return {
    id: spec.id,
    label: spec.label,
    command: spec.command,
    creation_kind: spec.creationKind,
    creation_posture: posture.state,
    reason_codes: posture.reasonCodes,
    storage_state: storageState,
    budget_state: budgetState,
    path_authority: {
      path_class_id: spec.pathClassId,
      destination_source: pathClass?.status?.source || null,
      destination_status: pathClass?.status?.status || null,
      destination_exists: pathClass?.status?.exists === true,
      counts_against_storage_budget: pathClass?.counts_against_storage_budget === true,
      current_or_candidate_path: pathClass?.current_or_candidate_path || null,
      renderer_authoritative: false
    },
    command_metadata: command ? {
      classification: command.classification,
      effects: command.effects,
      renderer_allowed: command.renderer_allowed === true,
      confirmation_required: command.authority?.confirmation_required === true,
      confirmation_token: command.authority?.token || null
    } : {
      classification: 'future_export_not_registered',
      effects: ['read-only'],
      renderer_allowed: false,
      confirmation_required: true,
      confirmation_token: null
    },
    requirements: {
      confirmation_required: confirmationRequired,
      trusted_context_required: trustedContextRequired,
      storage_setup_required: posture.reasonCodes.includes('storage_setup_required'),
      budget_blocks_creation: posture.reasonCodes.includes('budget_blocked'),
      destination_path_authority_required: true,
      local_only_available: true,
      external_io_required: false
    },
    external_io: {
      state: context.externalIo.state,
      provider_backed_posture: context.externalIo.provider_backed_posture,
      local_only_policy_available: true,
      blocks_this_policy_readout: false,
      authorizes_creation: false,
      catch_up_flood: context.externalIo.reenable_catch_up_policy?.catch_up_flood === true
    },
    effects_if_future_creation_is_authorized: {
      creates_support_artifact: spec.command !== null,
      creates_evidence: false,
      mutates_discovery_refs: false,
      writes_hydration: false,
      calls_zkill: false,
      calls_esi: false,
      calls_sde_download: false,
      moves_or_copies_storage: spec.command === 'runtime.db_snapshot.create',
      runtime_enforcement_active_now: false
    },
    lifecycle: spec.lifecycle,
    would_allow_is_authorization: false,
    read_only_preview: true
  };
}

function postureFor({ spec, command, pathClass = {}, matrixDecision = {}, storageState, budgetState }) {
  const reasonCodes = new Set();
  if (spec.command === null) {
    reasonCodes.add('no_existing_write_capable_surface');
    reasonCodes.add('future_accepted_runway_required');
    return {
      state: 'conditional',
      reasonCodes: [...reasonCodes]
    };
  }
  if (!command) {
    reasonCodes.add('service_command_missing');
    return {
      state: 'would_block',
      reasonCodes: [...reasonCodes]
    };
  }
  if (command.effects?.includes('support-artifact')) {
    reasonCodes.add('support_artifact_write_command');
  }
  if (command.authority?.confirmation_required === true) {
    reasonCodes.add('confirmation_required');
  }
  reasonCodes.add('trusted_context_required');
  reasonCodes.add(`storage_state:${storageState}`);
  reasonCodes.add(`budget_state:${budgetState}`);
  reasonCodes.add(`matrix_posture:${matrixDecision.posture || 'unknown'}`);

  if (budgetState === 'budget_hard_lock') {
    reasonCodes.add('budget_blocked');
    return {
      state: 'budget_blocked',
      reasonCodes: [...reasonCodes]
    };
  }
  if (['no_storage_selected', 'current_file_fallback_unacknowledged'].includes(storageState)) {
    reasonCodes.add('storage_setup_required');
    return {
      state: 'storage_setup_required',
      reasonCodes: [...reasonCodes]
    };
  }
  if (['configured_storage_missing_unavailable', 'configured_storage_invalid_degraded'].includes(storageState)) {
    reasonCodes.add('path_or_storage_untrusted');
    return {
      state: 'path_untrusted',
      reasonCodes: [...reasonCodes]
    };
  }
  if (pathClass?.status?.status === 'degraded') {
    reasonCodes.add('destination_path_degraded');
    return {
      state: 'path_untrusted',
      reasonCodes: [...reasonCodes]
    };
  }
  if (storageState === 'budget_strong_warning') {
    reasonCodes.add('projected_budget_confirmation_required');
    return {
      state: 'confirmation_required',
      reasonCodes: [...reasonCodes]
    };
  }
  if (storageState === 'budget_warning') {
    reasonCodes.add('budget_warning_projected_safe_required');
    return {
      state: 'conditional',
      reasonCodes: [...reasonCodes]
    };
  }
  if (storageState === 'configured_storage_ready') {
    reasonCodes.add('local_only_available');
    reasonCodes.add('destination_path_authority_required');
    return {
      state: 'would_allow',
      reasonCodes: [...reasonCodes]
    };
  }
  if (storageState === 'demo_fixture_mode') {
    reasonCodes.add('fixture_only_non_production');
    return {
      state: 'trusted_context_required',
      reasonCodes: [...reasonCodes]
    };
  }
  reasonCodes.add('storage_review_required');
  return {
    state: 'conditional',
    reasonCodes: [...reasonCodes]
  };
}

function summarizeClasses(classes) {
  return {
    total_classes: classes.length,
    by_creation_posture: classes.reduce((counts, entry) => {
      counts[entry.creation_posture] = (counts[entry.creation_posture] || 0) + 1;
      return counts;
    }, {}),
    confirmation_required: classes.filter((entry) => entry.requirements.confirmation_required).map((entry) => entry.id),
    storage_budget_scoped: classes.filter((entry) => entry.path_authority.counts_against_storage_budget).map((entry) => entry.id),
    local_only_available: classes.filter((entry) => entry.requirements.local_only_available).map((entry) => entry.id),
    external_io_not_required: classes.filter((entry) => entry.requirements.external_io_required === false).map((entry) => entry.id)
  };
}

function creationClass(id, spec) {
  return {
    id,
    ...spec
  };
}

function rendererPayloadHasPolicyClaims(input = {}) {
  return FORBIDDEN_RENDERER_POLICY_KEYS.some((key) => Object.prototype.hasOwnProperty.call(input, key));
}

module.exports = {
  buildSupportArtifactCreationPolicyPreview
};
