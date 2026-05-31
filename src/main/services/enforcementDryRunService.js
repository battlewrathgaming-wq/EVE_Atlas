const { buildStorageSetupGateReadout } = require('./storageSetupGateReadoutService');

function buildEnforcementDryRunCommandEffectMap(input = {}, context = {}) {
  const setupGate = buildStorageSetupGateReadout(input, context);
  const commandMetadata = context.commandMetadata || [];
  const commandIndex = new Map(commandMetadata.map((entry) => [entry.command, entry]));
  const effectClasses = Object.entries(setupGate.action_class_matrix.actions).map(([actionClass, actionDecision]) => (
    mapActionClassDecision(actionClass, actionDecision, setupGate)
  ));
  const commands = representativeCommandMappings().map((mapping) => (
    mapCommandDecision(mapping, commandIndex.get(mapping.command), setupGate)
  ));

  return {
    action: 'storage.enforcement_dry_run.command_effect_map',
    classification: 'read-only enforcement dry-run command/effect map',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    enforcement_active: false,
    enforcement_state: 'not_implemented_readout_only',
    storage_state: setupGate.action_class_matrix.storage_state,
    storage_basis: {
      storage_state: setupGate.storage.state,
      setup_gate: setupGate.storage.setup_gate,
      storage_authority_mode: setupGate.storage_authority.mode,
      selected: setupGate.storage_authority.selected,
      fallback_acknowledged: setupGate.storage_authority.fallback_acknowledged,
      acknowledgement_status: setupGate.storage_authority.acknowledgement_status,
      acknowledgement_invalid_reason: setupGate.storage_authority.acknowledgement_invalid_reason,
      budget_state: setupGate.budget.state,
      budget_bytes: setupGate.budget.budget_bytes,
      budget_warning_level: setupGate.budget.warning_level
    },
    external_io_assumption: 'not_enforced_in_this_readout',
    commands,
    effect_classes: effectClasses,
    reason_codes: reasonCodeCatalog(),
    boundary: [
      'Read-only enforcement dry-run only; it does not intercept or block runtime commands.',
      'It does not enforce storage lockout or mutate storage authority.',
      'It does not call providers, create Evidence/EVEidence, hydrate metadata, prune/delete records, move storage, change schema, or redesign renderer UI.',
      'Decisions are projected from storage.setup_gate_readout.action_class_matrix and service command metadata.'
    ]
  };
}

function mapCommandDecision(mapping, metadata, setupGate) {
  const actionDecision = setupGate.action_class_matrix.actions[mapping.action_class];
  const decision = dryRunDecision(actionDecision);
  return {
    command: mapping.command,
    representative_effect_class: mapping.action_class,
    effects: metadata?.effects || [],
    classification: metadata?.classification || null,
    renderer_allowed: metadata?.renderer_allowed === true,
    storage_state: setupGate.action_class_matrix.storage_state,
    budget_state: setupGate.budget.state,
    external_io_assumption: externalIoAssumption(actionDecision),
    decision,
    source_posture: actionDecision?.posture || 'unknown',
    reason_codes: reasonCodesFor(actionDecision, setupGate, mapping),
    enforcement_active: false,
    enforcement_state: 'not_implemented_readout_only'
  };
}

function mapActionClassDecision(actionClass, actionDecision, setupGate) {
  return {
    effect_class: actionClass,
    storage_state: setupGate.action_class_matrix.storage_state,
    budget_state: setupGate.budget.state,
    external_io_assumption: externalIoAssumption(actionDecision),
    decision: dryRunDecision(actionDecision),
    source_posture: actionDecision?.posture || 'unknown',
    reason_codes: reasonCodesFor(actionDecision, setupGate, { action_class: actionClass }),
    enforcement_active: false,
    enforcement_state: 'not_implemented_readout_only'
  };
}

function dryRunDecision(actionDecision = {}) {
  const posture = actionDecision.posture;
  if (['allow', 'allow_if_safe', 'provider_gated', 'allow_readout'].includes(posture)) {
    return 'would_allow';
  }
  if (['conditional', 'active_view_only', 'defer_by_default', 'allow_if_destination_safe', 'allow_if_projected_safe', 'conditional_alternate', 'read_only_only', 'degraded_read_only', 'fixture_only', 'fixture_disposable_only', 'future_runway_only'].includes(posture)) {
    return 'conditional';
  }
  return 'would_block';
}

function externalIoAssumption(actionDecision = {}) {
  if (actionDecision.basis?.provider_movement_required === true) {
    return 'provider_available_assumed_not_enforced';
  }
  return 'not_required';
}

function reasonCodesFor(actionDecision = {}, setupGate = {}, mapping = {}) {
  const codes = new Set();
  const basis = actionDecision.basis || {};
  const decision = dryRunDecision(actionDecision);
  const storageState = setupGate.action_class_matrix?.storage_state;
  const budgetState = setupGate.budget?.state;

  codes.add(`storage_state:${storageState || 'unknown'}`);
  codes.add(`budget_state:${budgetState || 'unknown'}`);
  if (basis.provider_movement_required === true) {
    codes.add('provider_movement_required');
  }
  if (basis.block_hold_reason) {
    codes.add(`hold:${basis.block_hold_reason}`);
  }
  if (basis.write_posture) {
    codes.add(`write_posture:${basis.write_posture}`);
  }
  if (setupGate.storage_authority?.mode === 'app_local_fallback_acknowledged') {
    codes.add('fallback_acknowledged_distinct_from_selected_storage');
  }
  if (setupGate.storage_authority?.mode === 'acknowledgement_invalidated') {
    codes.add('fallback_acknowledgement_invalidated');
  }
  if (storageState === 'configured_storage_missing_unavailable') {
    codes.add('storage_missing_unavailable');
  }
  if (storageState === 'configured_storage_invalid_degraded') {
    codes.add('storage_invalid_degraded');
  }
  if (storageState === 'budget_hard_lock_full') {
    codes.add('budget_hard_lock_blocks_writes_provider_movement');
  }
  if (decision === 'would_allow' && basis.provider_movement_required !== true) {
    codes.add('safe_local_or_read_only_path');
  }
  if (decision === 'would_block') {
    codes.add('would_block_if_enforced_later');
  }
  if (decision === 'conditional') {
    codes.add('conditional_if_enforced_later');
  }
  if (mapping.command) {
    codes.add(`command:${mapping.command}`);
  }
  return [...codes];
}

function representativeCommandMappings() {
  return [
    { command: 'app.readiness', action_class: 'local_reports_observation' },
    { command: 'storage.authority_preflight', action_class: 'local_db_inspection' },
    { command: 'storage.setup_gate_readout', action_class: 'local_db_inspection' },
    { command: 'watch.list', action_class: 'local_db_inspection' },
    { command: 'report.actor', action_class: 'local_reports_observation' },
    { command: 'assessment.create', action_class: 'assessment_writing' },
    { command: 'manual.discovery', action_class: 'zkill_discovery' },
    { command: 'manual.expansion', action_class: 'esi_evidence_expansion' },
    { command: 'metadata.hydration', action_class: 'fast_view_metadata_hydration' },
    { command: 'runtime.db_snapshot.create', action_class: 'snapshot_support_artifact_write' },
    { command: 'support.debug_trace_pack', action_class: 'snapshot_support_artifact_write' },
    { command: 'retention.preflight', action_class: 'pruning_deletion_preflight' },
    { command: 'retention.actions', action_class: 'pruning_deletion_execution' }
  ];
}

function reasonCodeCatalog() {
  return [
    'safe_local_or_read_only_path',
    'provider_movement_required',
    'would_block_if_enforced_later',
    'conditional_if_enforced_later',
    'fallback_acknowledged_distinct_from_selected_storage',
    'fallback_acknowledgement_invalidated',
    'storage_missing_unavailable',
    'storage_invalid_degraded',
    'budget_hard_lock_blocks_writes_provider_movement',
    'hold:<matrix block/hold reason>',
    'write_posture:<matrix write posture>',
    'storage_state:<matrix storage state>',
    'budget_state:<budget state>',
    'command:<representative command>'
  ];
}

module.exports = {
  buildEnforcementDryRunCommandEffectMap
};
