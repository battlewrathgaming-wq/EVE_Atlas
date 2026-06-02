const TERMINAL_DECISIONS = new Set(['pass', 'block', 'conditional', 'stop_before_boundary']);

function evaluateRuntimeEnforcementDecision(facts = {}) {
  const known = facts.known === true;
  const classified = facts.classified === true;
  const gateInputs = gateInputsUsed(facts);
  const reasonCodes = reasonCodesFor(facts);
  const boundaryReachable = boundaryReachabilityFor(facts, reasonCodes);
  const decision = decisionFor(facts, boundaryReachable);

  return {
    command: facts.command || null,
    known,
    classified,
    boundary_reachability: boundaryReachable,
    decision: TERMINAL_DECISIONS.has(decision) ? decision : 'conditional',
    active: false,
    preview_only: true,
    reason_codes: [...new Set(reasonCodes)],
    gate_inputs_used: gateInputs,
    notes: {
      would_allow_is_authorization: false,
      external_io_on_is_authorization: false,
      external_io_on_releases_to_normal_gates_only: true,
      unknown_unclassified_fail_closed_active: false,
      evaluator_calls_handlers: false,
      evaluator_calls_task_runners: false,
      evaluator_calls_providers: false,
      evaluator_calls_repositories: false,
      evaluator_calls_file_writers: false,
      evaluator_calls_config_writers: false
    }
  };
}

function gateInputsUsed(facts = {}) {
  return {
    source: facts.source || null,
    command_eligibility: facts.command_eligibility || null,
    confirmation: facts.confirmation || null,
    storage_authority: facts.storage_authority || null,
    budget: facts.budget || null,
    external_io: facts.external_io || null,
    provider_live_gate: facts.provider_live_gate || null,
    destination_path_authority: facts.destination_path_authority || null,
    watch_runtime: facts.watch_runtime || null,
    trusted_context: facts.trusted_context || null,
    composed_policy: facts.composed_policy || null,
    dry_run: facts.dry_run || null
  };
}

function boundaryReachabilityFor(facts = {}, reasonCodes = []) {
  if (facts.known !== true) {
    return {
      reaches_boundary: false,
      state: 'stop_before_boundary',
      stop_reason: 'unknown_unclassified'
    };
  }
  if (facts.command_eligibility?.would_stop_before_boundary === true) {
    return {
      reaches_boundary: false,
      state: 'stop_before_boundary',
      stop_reason: facts.command_eligibility.reason || 'renderer_eligibility'
    };
  }
  if (facts.confirmation?.would_stop_before_boundary === true) {
    return {
      reaches_boundary: false,
      state: 'stop_before_boundary',
      stop_reason: 'confirmation_missing'
    };
  }
  if (reasonCodes.includes('confirmation_missing')) {
    return {
      reaches_boundary: false,
      state: 'stop_before_boundary',
      stop_reason: 'confirmation_missing'
    };
  }
  return {
    reaches_boundary: true,
    state: 'boundary_reachable',
    stop_reason: null
  };
}

function decisionFor(facts = {}, boundaryReachable = {}) {
  if (boundaryReachable.reaches_boundary !== true) {
    return 'stop_before_boundary';
  }
  const composedState = facts.composed_policy?.state || null;
  if (composedState === 'pass') {
    return 'pass';
  }
  if (composedState === 'block') {
    return 'block';
  }
  if (composedState === 'hold' || composedState === 'conditional' || composedState === 'unknown') {
    return 'conditional';
  }
  const dryRunDecision = facts.dry_run?.decision || null;
  if (dryRunDecision === 'would_allow') {
    return 'pass';
  }
  if (dryRunDecision === 'would_block') {
    return 'block';
  }
  return 'conditional';
}

function reasonCodesFor(facts = {}) {
  const codes = [];
  if (facts.known !== true || facts.classified !== true) {
    codes.push('unknown_unclassified');
  }
  if (facts.command_eligibility?.state === 'blocked_by_renderer_eligibility') {
    codes.push('renderer_eligibility_blocked');
  }
  if (facts.confirmation?.required === true && facts.confirmation?.would_stop_before_boundary === true) {
    codes.push('confirmation_missing');
  }
  if (facts.confirmation?.required === true && facts.confirmation?.state === 'trusted_internal_bypasses_confirmation_front_door') {
    codes.push('confirmation_not_enforced_at_front_door');
  } else if (facts.confirmation?.required === true && facts.confirmation?.would_stop_before_boundary !== true) {
    codes.push('confirmation_satisfied');
  }

  addStorageCodes(codes, facts.storage_authority);
  addBudgetCodes(codes, facts.budget);
  addExternalIoCodes(codes, facts.external_io);
  addProviderCodes(codes, facts.provider_live_gate);
  addDestinationCodes(codes, facts.destination_path_authority);
  addWatchRuntimeCodes(codes, facts.watch_runtime);
  addTrustedContextCodes(codes, facts.trusted_context);

  for (const code of facts.composed_policy?.reason_codes || []) {
    codes.push(`composed:${code}`);
  }
  for (const code of facts.dry_run?.reason_codes || []) {
    codes.push(`dry_run:${code}`);
  }
  if (facts.dry_run?.decision === 'would_allow') {
    codes.push('would_allow_input_not_authorization');
  }
  if (facts.external_io?.state === 'on' || facts.external_io?.requested_state === 'on') {
    codes.push('external_io_on_not_authorization');
  }
  return codes;
}

function addStorageCodes(codes, storage = {}) {
  storage = storage || {};
  const state = storage.gate_state || storage.state || null;
  if (!state) {
    return;
  }
  codes.push(`storage_state:${state}`);
  if (state === 'configured_storage_missing_unavailable' || storage.validation_status === 'missing_unavailable') {
    codes.push('storage_missing');
  }
  if (state === 'no_storage_selected' || storage.mode === 'no_storage_selected') {
    codes.push('storage_not_selected');
  }
  if (state === 'configured_storage_invalid_degraded' || storage.validation_status === 'invalid_degraded') {
    codes.push('storage_invalid_degraded');
  }
}

function addBudgetCodes(codes, budget = {}) {
  budget = budget || {};
  const state = budget.state || null;
  if (!state) {
    return;
  }
  codes.push(`budget_state:${state}`);
  if (state === 'budget_hard_lock' || state === 'budget_hard_lock_full' || budget.blocks_writes === true) {
    codes.push('budget_hard_lock');
  }
}

function addExternalIoCodes(codes, externalIo = {}) {
  externalIo = externalIo || {};
  const state = externalIo.gate_state || externalIo.provider_backed_posture || externalIo.state || null;
  const dependency = externalIo.dependency || externalIo.external_io_dependency || 'none';
  if (dependency && dependency !== 'none') {
    codes.push(`external_io_dependency:${dependency}`);
  }
  if (state) {
    codes.push(`external_io_state:${state}`);
  }
  if (state === 'held_by_external_io') {
    codes.push('external_io_held');
  }
}

function addProviderCodes(codes, provider = {}) {
  provider = provider || {};
  if (provider.provider_capable === true) {
    codes.push('provider_capable');
  }
  if (provider.state && provider.allowed !== true && provider.provider_capable === true) {
    codes.push(`provider_gate:${provider.state}`);
  }
}

function addDestinationCodes(codes, destination = {}) {
  destination = destination || {};
  if (destination.applies !== true) {
    return;
  }
  codes.push('path_authority_required');
  if (['conditional', 'storage_setup_required', 'path_untrusted', 'budget_blocked', 'confirmation_required'].includes(destination.state)) {
    codes.push('path_authority_conditional');
  }
}

function addWatchRuntimeCodes(codes, watchRuntime = {}) {
  watchRuntime = watchRuntime || {};
  if (watchRuntime.applies !== true) {
    return;
  }
  codes.push('watch_runtime_required');
  if (watchRuntime.state) {
    codes.push(`watch_runtime_state:${watchRuntime.state}`);
  }
  if (watchRuntime.task_state?.active_task_present === true) {
    codes.push('watch_task_active');
  }
  if (watchRuntime.session_arm_is_provider_permission === false) {
    codes.push('watch_arm_not_provider_permission');
  }
}

function addTrustedContextCodes(codes, trustedContext = {}) {
  trustedContext = trustedContext || {};
  if (trustedContext.required === true) {
    codes.push('trusted_context_required');
  }
  if (trustedContext.fixture_only_non_production === true) {
    codes.push('fixture_only');
  }
}

module.exports = {
  evaluateRuntimeEnforcementDecision
};
