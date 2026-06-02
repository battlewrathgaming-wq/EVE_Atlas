const { evaluateRuntimeEnforcementDecision } = require('./runtimeEnforcementEvaluator');

const PROVIDER_EFFECT = 'external-live-api';
const SUPPORT_ARTIFACT_EFFECT = 'support-artifact';

function buildDryRuntimeEnforcementAdapterDecision({ command, payload = {}, context = {}, definition = null, facts = {} } = {}) {
  const source = context.source || 'trusted';
  const normalizedDefinition = normalizeDefinition(command, definition);
  const known = Boolean(normalizedDefinition);
  const coverage = facts.coverage || null;
  const classified = known && coverage?.classified !== false && coverage?.missing_classification !== true && Boolean(coverage);
  const rendererEligibility = rendererEligibilityFor({ source, definition: normalizedDefinition, known });
  const confirmation = confirmationFor({ payload, context, definition: normalizedDefinition });
  const trustedContext = trustedContextFor({ source, definition: normalizedDefinition, coverage });
  const missingFactClasses = missingFactClassesFor({
    known,
    classified,
    definition: normalizedDefinition,
    coverage,
    facts
  });
  const evaluatorFacts = evaluatorFactsFor({
    command,
    source,
    known,
    classified,
    rendererEligibility,
    confirmation,
    trustedContext,
    facts,
    missingFactClasses
  });
  const evaluatorDecision = evaluateRuntimeEnforcementDecision(evaluatorFacts);
  const stopsBeforeBoundary = evaluatorDecision.boundary_reachability.reaches_boundary !== true;
  const completeFacts = missingFactClasses.length === 0;

  return {
    action: 'runtime.enforcement_adapter.dry_preview',
    command: command || null,
    source,
    renderer_eligibility: rendererEligibility,
    confirmation_posture: confirmation,
    trusted_internal_context_posture: trustedContext,
    evaluator_decision: evaluatorDecision,
    would_block_if_active: evaluatorDecision.decision === 'block' || stopsBeforeBoundary,
    would_dispatch_if_active: evaluatorDecision.decision === 'pass' && completeFacts && !stopsBeforeBoundary,
    active: false,
    preview_only: true,
    missing_fact_classes: missingFactClasses,
    dry_run_input: dryRunInputFor(facts.dry_run),
    authority_notes: {
      dry_run_would_allow_is_authorization: false,
      external_io_on_is_authorization: false,
      missing_facts_block_runtime_authority_claim: missingFactClasses.length > 0,
      unknown_unclassified_fail_closed_active: false
    },
    proof: {
      target_handlers_called: false,
      task_runners_called: false,
      providers_called: false,
      repositories_called: false,
      file_writers_called: false,
      config_writers_called: false,
      mutating_services_called: false
    },
    boundary: [
      'Dry runtime enforcement adapter preview only; it does not intercept, authorize, dispatch, or block service commands.',
      'The adapter assembles evaluator facts from command metadata/definition, payload, context, and explicitly supplied gate facts only.',
      'Missing composed/storage/External I/O/provider/path facts are reported as missing fact classes rather than treating dry-run would_allow as execution authority.'
    ]
  };
}

function evaluatorFactsFor({
  command,
  source,
  known,
  classified,
  rendererEligibility,
  confirmation,
  trustedContext,
  facts,
  missingFactClasses
}) {
  const hasComposedFacts = Boolean(facts.composed_policy);
  const composedPolicy = hasComposedFacts
    ? facts.composed_policy
    : {
      state: 'conditional',
      reason_codes: [
        'missing_fact_class:composed_gate_policy',
        'dry_adapter_refuses_dry_run_as_authority'
      ]
    };
  const dryRun = facts.dry_run
    ? {
      decision: hasComposedFacts ? facts.dry_run.decision || null : null,
      reason_codes: [
        ...(facts.dry_run.reason_codes || []),
        ...(hasComposedFacts ? [] : ['dry_run_would_allow_non_authorizing_missing_composed_gate_facts'])
      ]
    }
    : null;

  return {
    command,
    source,
    known,
    classified,
    command_eligibility: rendererEligibility,
    confirmation,
    storage_authority: facts.storage_authority || null,
    budget: facts.budget || null,
    external_io: facts.external_io || null,
    provider_live_gate: facts.provider_live_gate || null,
    destination_path_authority: facts.destination_path_authority || null,
    watch_runtime: facts.watch_runtime || null,
    trusted_context: trustedContext,
    composed_policy: composedPolicy,
    dry_run: dryRun,
    adapter_missing_fact_classes: missingFactClasses
  };
}

function rendererEligibilityFor({ source, definition, known }) {
  if (!known) {
    return {
      state: 'unknown_command',
      known_command: false,
      renderer_allowed: false,
      would_stop_before_boundary: true,
      reason: 'unknown_service_command'
    };
  }
  const rendererAllowed = definition.renderer_allowed === true;
  if (source === 'renderer' && rendererAllowed !== true) {
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
    renderer_allowed: rendererAllowed,
    would_stop_before_boundary: false,
    reason: source === 'renderer' ? 'renderer_eligible_command' : 'trusted_or_internal_context'
  };
}

function confirmationFor({ payload = {}, context = {}, definition = null }) {
  const authority = definition?.authority || {};
  const required = authority.confirmation_required === true;
  const frontDoorEnforces = required && (context.source === 'renderer' || context.enforceAuthority === true);
  const provided = payload.confirmation || payload.confirmationToken || payload.confirmation_token || payload.authority?.confirmation || null;
  if (!required) {
    return {
      required: false,
      enforced_at_front_door: false,
      provided_for_preview: false,
      state: 'not_required',
      token_public_metadata: null,
      would_stop_before_boundary: false
    };
  }
  if (!frontDoorEnforces) {
    return {
      required: true,
      enforced_at_front_door: false,
      provided_for_preview: false,
      state: 'trusted_internal_bypasses_confirmation_front_door',
      token_public_metadata: authority.token || null,
      would_stop_before_boundary: false
    };
  }
  const satisfied = provided === authority.token;
  return {
    required: true,
    enforced_at_front_door: true,
    provided_for_preview: satisfied,
    state: satisfied ? 'satisfied_for_preview' : 'required_missing',
    token_public_metadata: authority.token || null,
    would_stop_before_boundary: !satisfied
  };
}

function trustedContextFor({ source, definition = null, coverage = null }) {
  const fixtureOnly = coverage?.enforcement_status === 'fixture_only_non_production';
  const nonRenderer = definition?.renderer_allowed === false;
  const supportArtifact = (definition?.effects || []).includes(SUPPORT_ARTIFACT_EFFECT);
  const required = source !== 'renderer' || nonRenderer || fixtureOnly || supportArtifact;
  return {
    required,
    source,
    state: required ? 'trusted_or_internal_context_required_or_used' : 'normal_renderer_eligible_context',
    fixture_only_non_production: fixtureOnly,
    renderer_allowed: definition?.renderer_allowed === true
  };
}

function missingFactClassesFor({ known, classified, definition = null, coverage = null, facts = {} }) {
  const missing = new Set();
  if (!known) {
    missing.add('service_command_definition');
    missing.add('classification_coverage');
    return [...missing];
  }
  if (!classified) {
    missing.add('classification_coverage');
  }
  if (!facts.composed_policy) {
    missing.add('composed_gate_policy');
  }
  if (!facts.storage_authority) {
    missing.add('storage_authority');
  }
  if (!facts.budget) {
    missing.add('storage_budget');
  }
  const providerCapable = isProviderCapable(definition, coverage);
  if (providerCapable && !facts.external_io) {
    missing.add('external_io');
  }
  if (providerCapable && !facts.provider_live_gate) {
    missing.add('provider_live_gate');
  }
  if ((definition?.effects || []).includes(SUPPORT_ARTIFACT_EFFECT) && !facts.destination_path_authority) {
    missing.add('destination_path_authority');
  }
  if (isWatchExecution(definition, coverage) && !facts.watch_runtime) {
    missing.add('watch_runtime');
  }
  return [...missing];
}

function dryRunInputFor(dryRun = null) {
  if (!dryRun) {
    return {
      supplied: false,
      decision: null,
      used_as_authority: false
    };
  }
  return {
    supplied: true,
    decision: dryRun.decision || null,
    reason_codes: dryRun.reason_codes || [],
    used_as_authority: false
  };
}

function normalizeDefinition(command, definition = null) {
  if (!definition) {
    return null;
  }
  return {
    command: definition.command || command,
    classification: definition.classification || null,
    effects: [...(definition.effects || [])],
    renderer_allowed: definition.renderer_allowed === true || definition.renderer === true,
    authority: normalizeAuthority(definition.authority),
    description: definition.description || null
  };
}

function normalizeAuthority(authority = null) {
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

function isProviderCapable(definition = null, coverage = null) {
  return (definition?.effects || []).includes(PROVIDER_EFFECT) ||
    Boolean(coverage && coverage.external_io_dependency && coverage.external_io_dependency !== 'none');
}

function isWatchExecution(definition = null, coverage = null) {
  const runtimeContext = coverage?.runtime_context || '';
  return runtimeContext.includes('watch') || runtimeContext.includes('background_watch') ||
    ['actor.watch', 'system.radius.watch', 'watch.executor.arm', 'watch.executor.tick'].includes(definition?.command);
}

module.exports = {
  buildDryRuntimeEnforcementAdapterDecision
};
