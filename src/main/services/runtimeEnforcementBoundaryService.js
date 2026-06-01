const { buildCommandCoverageReport } = require('./enforcementDryRunService');
const { buildComposedGatePolicyPreview } = require('./composedGatePolicyService');
const { buildEnforcementDryRunCommandEffectMap } = require('./enforcementDryRunService');
const { buildExternalIoStateReadout } = require('./externalIoStateService');
const { buildGateStackReadout } = require('./gateStackReadoutService');
const { buildStorageAuthorityConfigReadback } = require('./storageAuthorityConfigWriteService');
const { buildStorageSetupGateReadout } = require('./storageSetupGateReadoutService');
const { buildSupportArtifactCreationPolicyPreview } = require('./supportArtifactCreationPolicyService');

const REPRESENTATIVE_ENVELOPES = Object.freeze([
  envelopeSpec('safe_local_read_report_preflight', 'report.actor', 'renderer', false),
  envelopeSpec('trusted_config_readback', 'storage.authority_config.readback', 'renderer', false),
  envelopeSpec('trusted_config_write', 'storage.authority_config.write', 'trusted', false),
  envelopeSpec('provider_backed_discovery', 'manual.discovery', 'renderer', true),
  envelopeSpec('esi_evidence_expansion', 'manual.expansion', 'renderer', true),
  envelopeSpec('hydration_write', 'metadata.hydration', 'renderer', true),
  envelopeSpec('watch_execution_scheduled_provider', 'watch.executor.tick', 'trusted', true),
  envelopeSpec('runtime_snapshot_creation', 'runtime.db_snapshot.create', 'renderer', true),
  envelopeSpec('trace_pack_creation', 'support.debug_trace_pack', 'renderer', true),
  envelopeSpec('task_cancellation_runtime_control', 'task.cancel', 'renderer', true),
  envelopeSpec('fixture_only_proof_command', 'storage.authority_config.write_proof', 'trusted', false),
  envelopeSpec('unknown_unclassified_future_command', 'future.unclassified.command', 'trusted', false, true)
]);

function buildRuntimeEnforcementBoundaryPreview(db, input = {}, context = {}) {
  const commandMetadata = Array.isArray(context.commandMetadata) ? context.commandMetadata : [];
  const storageSetup = buildStorageSetupGateReadout(input, {
    ...context,
    allowStorageSetupGateFixtureInput: context.allowStorageSetupGateFixtureInput === true && context.source !== 'renderer'
  });
  const storageConfig = buildStorageAuthorityConfigReadback(input, context);
  const externalIo = buildExternalIoStateReadout(input, context);
  const enforcementDryRun = buildEnforcementDryRunCommandEffectMap(input, {
    ...context,
    commandMetadata
  });
  const gateStack = buildGateStackReadout(db, {
    externalIoState: input.externalIoState || input.external_io_state || externalIo.state,
    actions: representativeActions()
  }, {
    ...context,
    commandMetadata
  });
  const supportArtifactCreationPolicy = buildSupportArtifactCreationPolicyPreview(input, {
    ...context,
    commandMetadata,
    storageSetupGate: storageSetup
  });
  const composedGatePolicy = buildComposedGatePolicyPreview(db, {
    externalIoState: input.externalIoState || input.external_io_state || externalIo.state
  }, {
    ...context,
    commandMetadata
  });
  const coverage = buildCommandCoverageReport([
    ...commandMetadata,
    unknownCommandMetadata()
  ]);
  const indexes = buildIndexes({
    commandMetadata,
    coverage,
    enforcementDryRun,
    gateStack,
    composedGatePolicy,
    supportArtifactCreationPolicy
  });
  const envelopes = REPRESENTATIVE_ENVELOPES.map((spec) => envelopeDecision(spec, {
    indexes,
    storageSetup,
    storageConfig,
    externalIo
  }));

  return {
    action: 'runtime.enforcement_boundary.preview',
    classification: 'read-only runtime enforcement boundary preview',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    runtime_interception_active: false,
    handler_dispatches: 0,
    task_executions: 0,
    provider_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    sde_download_calls: 0,
    file_writes: 0,
    directory_creations: 0,
    db_mutations: 0,
    schema_changes: 0,
    evidence_writes: 0,
    discovery_mutations: 0,
    hydration_writes: 0,
    storage_config_writes: 0,
    support_artifact_creations: 0,
    insertion_point: insertionPoint(),
    sources: {
      service_registry_commands: commandMetadata.length,
      enforcement_dry_run: enforcementDryRun.action,
      composed_gate_policy: composedGatePolicy.action,
      gate_stack_readout: gateStack.action,
      storage_setup_gate: storageSetup.action,
      storage_authority_config_readback: storageConfig.action,
      external_io_state_readout: externalIo.action,
      support_artifact_creation_policy: supportArtifactCreationPolicy.action
    },
    summary: summarizeEnvelopes(envelopes),
    envelopes,
    semantics: {
      would_allow_is_authorization: false,
      external_io_on_is_authorization: false,
      unknown_unclassified_fail_closed_active: false,
      unknown_unclassified_future_posture: 'fail_closed_intent_only',
      preview_only: true
    },
    proof: {
      target_handlers_called: false,
      target_handler_basis: 'The preview uses service command metadata and accepted readout builders only; it does not call target command handlers.',
      command_blocking_created: false,
      runtime_interception_created: false,
      task_wrapping_invoked: false,
      provider_movement_created: false
    },
    boundary: [
      'Read-only runtime enforcement boundary preview only; it does not install runtime enforcement or block commands.',
      'Proposed enforcement boundary is after envelope validation, command resolution, DB context, renderer eligibility, and confirmation checks, and before task wrapping and handler dispatch.',
      'The preview does not call target command handlers, wrap tasks, call providers, write files, mutate DB state, change schema, or create support artifacts.',
      'would_allow remains preview posture only and is not runtime authorization.',
      'Unknown/unclassified command fail-closed remains inactive policy intent only.'
    ]
  };
}

function envelopeDecision(spec, context) {
  const command = spec.unknown ? unknownCommandMetadata() : context.indexes.command.get(spec.command);
  const coverage = context.indexes.coverage.get(spec.command) || null;
  const dryRun = context.indexes.dryRun.get(spec.command) || null;
  const composed = context.indexes.composed.get(spec.command) || (spec.unknown ? context.indexes.composedById.get(spec.id) : null);
  const gate = context.indexes.gateStack.get(spec.command) || null;
  const supportArtifactClass = supportArtifactClassFor(spec, context.indexes.supportArtifactCreationPolicy);
  const known = Boolean(command) && spec.unknown !== true;
  const rendererEligible = command?.renderer_allowed === true;
  const commandEligibility = commandEligibilityFor({ spec, known, rendererEligible });
  const confirmation = confirmationFor(spec, command);
  const reachesBoundary = known && commandEligibility.state !== 'blocked_by_renderer_eligibility' && confirmation.state !== 'required_missing';
  const composedState = composed?.composed_state || decisionFromDryRun(dryRun);

  return {
    id: spec.id,
    command: spec.command,
    source: spec.source,
    envelope_order: [
      'validate_envelope',
      'resolve_command',
      'require_database_context',
      'renderer_eligibility',
      'confirmation_authority',
      'runtime_enforcement_boundary_preview_only',
      'task_wrapping',
      'handler_dispatch'
    ],
    proposed_boundary_reached_in_this_envelope: reachesBoundary,
    command_eligibility: commandEligibility,
    confirmation_state: confirmation,
    storage_authority: {
      mode: context.storageSetup.storage_authority.mode,
      selected: context.storageSetup.storage_authority.selected === true,
      fallback_acknowledged: context.storageSetup.storage_authority.fallback_acknowledged === true,
      acknowledgement_status: context.storageSetup.storage_authority.acknowledgement_status,
      config_read_status: context.storageConfig.persisted_config.status,
      gate_state: context.storageSetup.action_class_matrix.storage_state,
      dry_run_decision_input_only: dryRun?.decision || null
    },
    budget_posture: {
      state: context.storageSetup.budget.state,
      budget_bytes: context.storageSetup.budget.budget_bytes,
      warning_level: context.storageSetup.budget.warning_level || null,
      blocks_writes: context.storageSetup.budget.blocks_writes === true
    },
    external_io_posture: {
      state: context.externalIo.state,
      provider_backed_posture: context.externalIo.provider_backed_posture,
      dependency: coverage?.external_io_dependency || 'none',
      gate_state: gate?.gates?.external_io?.state || (coverage?.external_io_dependency === 'none' ? 'local_only_available' : null),
      on_is_authorization: false,
      catch_up_flood_on_reenable: false
    },
    provider_live_gate: {
      provider_capable: providerCapable(command, coverage),
      state: gate?.gates?.external_api?.state || (providerCapable(command, coverage) ? 'not_evaluated_for_preview_row' : 'local_only_no_live_provider_gate'),
      allowed: gate?.gates?.external_api?.allowed === true,
      blockers: (gate?.gates?.external_api?.blockers || []).map((entry) => entry.code || entry.message)
    },
    destination_path_authority: destinationFor(spec, composed, supportArtifactClass),
    trusted_context_requirement: trustedContextFor(spec, command, coverage, supportArtifactClass),
    composed_decision: {
      state: composedState,
      reason_codes: composed?.reason_codes || dryRun?.reason_codes || [],
      active: false,
      preview_only: true,
      would_allow_is_authorization: false
    },
    handler_dispatch: {
      called: false,
      task_wrapped: false,
      reason: 'preview stops before task wrapping and handler dispatch'
    }
  };
}

function commandEligibilityFor({ spec, known, rendererEligible }) {
  if (!known) {
    return {
      state: 'unknown_command',
      known_command: false,
      renderer_allowed: false,
      would_stop_before_boundary: true,
      reason: 'unknown_service_command'
    };
  }
  if (spec.source === 'renderer' && rendererEligible !== true) {
    return {
      state: 'blocked_by_renderer_eligibility',
      known_command: true,
      renderer_allowed: false,
      would_stop_before_boundary: true,
      reason: 'service_command_not_renderer_eligible'
    };
  }
  return {
    state: 'eligible_for_boundary_preview',
    known_command: true,
    renderer_allowed: rendererEligible === true,
    would_stop_before_boundary: false,
    reason: spec.source === 'renderer' ? 'renderer_eligible_command' : 'trusted_or_internal_context'
  };
}

function confirmationFor(spec, command = {}) {
  const required = command?.authority?.confirmation_required === true;
  if (!required) {
    return {
      required: false,
      provided_for_preview: false,
      state: 'not_required',
      token_public_metadata: null,
      would_stop_before_boundary: false
    };
  }
  return {
    required: true,
    provided_for_preview: spec.confirmationProvided === true,
    state: spec.confirmationProvided === true ? 'satisfied_for_preview' : 'required_missing',
    token_public_metadata: command.authority?.token || null,
    would_stop_before_boundary: spec.confirmationProvided !== true
  };
}

function destinationFor(spec, composed, supportArtifactClass) {
  if (!['runtime.db_snapshot.create', 'support.debug_trace_pack'].includes(spec.command)) {
    return {
      applies: false,
      state: 'not_applicable',
      renderer_authoritative: false
    };
  }
  const gate = composed?.gates?.destination_path_authority || null;
  return {
    applies: true,
    state: gate?.state || supportArtifactClass?.creation_posture || 'conditional',
    reason: gate?.reason || 'support_artifact_destination_authority_required',
    renderer_authoritative: false,
    creation_policy_posture: supportArtifactClass?.creation_posture || null,
    counts_against_storage_budget: supportArtifactClass?.path_authority?.counts_against_storage_budget === true
  };
}

function trustedContextFor(spec, command = {}, coverage = {}, supportArtifactClass = null) {
  const fixtureOnly = coverage?.enforcement_status === 'fixture_only_non_production';
  const nonRenderer = command?.renderer_allowed === false;
  const supportArtifact = command?.effects?.includes('support-artifact');
  const required = spec.source === 'trusted' || nonRenderer || fixtureOnly || supportArtifact || supportArtifactClass?.requirements?.trusted_context_required === true;
  return {
    required,
    state: required ? 'trusted_context_required_or_used' : 'normal_renderer_eligible_context',
    fixture_only_non_production: fixtureOnly,
    renderer_allowed: command?.renderer_allowed === true
  };
}

function supportArtifactClassFor(spec, creationPolicy = {}) {
  if (spec.command === 'runtime.db_snapshot.create') {
    return (creationPolicy.classes || []).find((entry) => entry.id === 'runtime_snapshot_retained') || null;
  }
  if (spec.command === 'support.debug_trace_pack') {
    return (creationPolicy.classes || []).find((entry) => entry.id === 'operator_debug_trace_pack') || null;
  }
  return null;
}

function buildIndexes({
  commandMetadata,
  coverage,
  enforcementDryRun,
  gateStack,
  composedGatePolicy,
  supportArtifactCreationPolicy
}) {
  return {
    command: new Map(commandMetadata.map((entry) => [entry.command, entry])),
    coverage: new Map((coverage.commands || []).map((entry) => [entry.command, entry])),
    dryRun: new Map((enforcementDryRun.commands || []).map((entry) => [entry.command, entry])),
    gateStack: new Map((gateStack.gate_stacks || []).map((entry) => [entry.command, entry])),
    composed: new Map((composedGatePolicy.rows || []).map((entry) => [entry.command, entry])),
    composedById: new Map((composedGatePolicy.rows || []).map((entry) => [entry.id, entry])),
    supportArtifactCreationPolicy
  };
}

function summarizeEnvelopes(envelopes) {
  return {
    total_envelopes: envelopes.length,
    by_composed_decision: envelopes.reduce((counts, entry) => {
      const state = entry.composed_decision.state;
      counts[state] = (counts[state] || 0) + 1;
      return counts;
    }, {}),
    boundary_reachable: envelopes.filter((entry) => entry.proposed_boundary_reached_in_this_envelope).map((entry) => entry.id),
    stops_before_boundary: envelopes
      .filter((entry) => !entry.proposed_boundary_reached_in_this_envelope)
      .map((entry) => ({
        id: entry.id,
        command: entry.command,
        eligibility: entry.command_eligibility.state,
        confirmation: entry.confirmation_state.state
      })),
    provider_capable: envelopes.filter((entry) => entry.provider_live_gate.provider_capable).map((entry) => entry.id),
    support_artifact: envelopes.filter((entry) => entry.destination_path_authority.applies).map((entry) => entry.id),
    unknown_unclassified: envelopes.filter((entry) => entry.command_eligibility.known_command === false).map((entry) => entry.id)
  };
}

function insertionPoint() {
  return {
    proposed_function: 'invokeServiceCommand(command, payload, context)',
    current_order: [
      'validateServiceInvokeEnvelope',
      'resolve command definition',
      'require context.db',
      'assertCommandEligible',
      'assertCommandAuthority',
      'task wrapping when context.asTask',
      'definition.handler dispatch'
    ],
    proposed_order: [
      'validateServiceInvokeEnvelope',
      'resolve command definition',
      'require context.db',
      'assertCommandEligible',
      'assertCommandAuthority',
      'runtime enforcement decision boundary',
      'task wrapping when context.asTask',
      'definition.handler dispatch'
    ],
    runs_after_renderer_eligibility: true,
    runs_after_confirmation_authority: true,
    runs_before_task_wrapping: true,
    runs_before_handler_dispatch: true,
    active_now: false,
    rationale: 'Keep renderer eligibility and confirmation checks as existing front-door guards, then make future enforcement decide before any task or handler can move work.'
  };
}

function representativeActions() {
  return [
    'report.view',
    'manual.discovery',
    'manual.expansion',
    'metadata.hydration',
    'watch.executor.tick',
    'actor.watch',
    'runtime.db_snapshot.create',
    'support.debug_trace_pack',
    'task.cancel'
  ];
}

function providerCapable(command = {}, coverage = null) {
  return (command.effects || []).includes('external-live-api') ||
    Boolean(coverage && coverage.external_io_dependency !== 'none');
}

function decisionFromDryRun(dryRun = null) {
  if (!dryRun) {
    return 'unknown';
  }
  if (dryRun.decision === 'would_allow') {
    return 'pass';
  }
  if (dryRun.decision === 'would_block') {
    return 'block';
  }
  return dryRun.decision || 'unknown';
}

function envelopeSpec(id, command, source, confirmationProvided, unknown = false) {
  return {
    id,
    command,
    source,
    confirmationProvided,
    unknown
  };
}

function unknownCommandMetadata() {
  return {
    command: 'future.unclassified.command',
    classification: 'unknown',
    effects: ['unknown'],
    renderer_allowed: false,
    authority: {
      confirmation_required: false,
      token: null,
      reason: null
    },
    description: 'Fixture row used to express future fail-closed policy intent for unknown commands.'
  };
}

module.exports = {
  buildRuntimeEnforcementBoundaryPreview
};
