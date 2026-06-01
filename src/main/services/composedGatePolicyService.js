const { buildCommandCoverageReport } = require('./enforcementDryRunService');
const { buildEnforcementDryRunCommandEffectMap } = require('./enforcementDryRunService');
const { buildGateStackReadout } = require('./gateStackReadoutService');
const { buildStorageSetupGateReadout } = require('./storageSetupGateReadoutService');
const { buildSupportArtifactCreationPolicyPreview } = require('./supportArtifactCreationPolicyService');
const { buildSupportArtifactPathAuthorityPreview } = require('./supportArtifactPathAuthorityService');

const REPRESENTATIVE_ROWS = Object.freeze([
  rowSpec('local_read_report_preflight', 'report.actor', 'Local read/report/preflight', 'report.view'),
  rowSpec('assessment_local_metadata_write', 'assessment.create', 'Assessment local metadata write'),
  rowSpec('watch_local_metadata_write', 'watch.create', 'Watch local metadata write'),
  rowSpec('zkill_discovery', 'manual.discovery', 'zKill Discovery', 'manual.discovery'),
  rowSpec('esi_evidence_expansion', 'manual.expansion', 'ESI Evidence/EVEidence expansion', 'manual.expansion'),
  rowSpec('hydration_write', 'metadata.hydration', 'Hydration write', 'metadata.hydration'),
  rowSpec('sde_local_import_rewrite', 'sde.import.topology', 'SDE local import/rewrite', null),
  rowSpec('sde_download_build', 'sde.build-lookups', 'SDE download/build', 'sde.build-lookups'),
  rowSpec('runtime_snapshot_creation', 'runtime.db_snapshot.create', 'Runtime snapshot creation'),
  rowSpec('trace_pack_creation', 'support.debug_trace_pack', 'Trace-pack creation'),
  rowSpec('support_artifact_creation_policy_readout', 'support.artifact_creation_policy.preview', 'Support artifact creation policy readout'),
  rowSpec('pruning_deletion_preflight', 'retention.preflight', 'Pruning/deletion preflight'),
  rowSpec('pruning_deletion_execution', 'retention.actions', 'Pruning/deletion execution'),
  rowSpec('runtime_control_task_cancel', 'task.cancel', 'Runtime control / task cancellation'),
  rowSpec('external_io_operator_config_write', 'external_io.state_config_write', 'External I/O operator config write'),
  rowSpec('storage_authority_operator_config_write', 'storage.authority_config.write', 'Storage authority operator config write'),
  rowSpec('fixture_only_write_proof', 'storage.authority_config.write_proof', 'Fixture-only proof command'),
  rowSpec('unknown_unclassified_future_command', 'future.unclassified.command', 'Unknown/unclassified future command', null)
]);

function buildComposedGatePolicyPreview(db, input = {}, context = {}) {
  const commandMetadata = Array.isArray(context.commandMetadata) ? context.commandMetadata : [];
  const coverage = buildCommandCoverageReport([
    ...commandMetadata,
    unknownCommandMetadata()
  ]);
  const storageSetup = buildStorageSetupGateReadout({}, {
    ...context,
    allowStorageSetupGateFixtureInput: false
  });
  const enforcementDryRun = buildEnforcementDryRunCommandEffectMap({}, {
    ...context,
    commandMetadata
  });
  const gateStack = buildGateStackReadout(db, {
    externalIoState: input.externalIoState || input.external_io_state || 'off',
    actions: actionsForGateStack()
  }, {
    ...context,
    commandMetadata
  });
  const supportArtifactAuthority = buildSupportArtifactPathAuthorityPreview({}, {
    ...context,
    source: context.source,
    commandMetadata
  });
  const supportArtifactCreationPolicy = buildSupportArtifactCreationPolicyPreview({}, {
    ...context,
    source: context.source,
    commandMetadata,
    supportArtifactPathAuthority: supportArtifactAuthority,
    storageSetupGate: storageSetup
  });
  const commandIndex = new Map(commandMetadata.map((entry) => [entry.command, entry]));
  const dryRunIndex = new Map((enforcementDryRun.commands || []).map((entry) => [entry.command, entry]));
  const gateStackIndex = new Map((gateStack.gate_stacks || []).map((entry) => [entry.command, entry]));
  const coverageIndex = new Map((coverage.commands || []).map((entry) => [entry.command, entry]));
  const rows = REPRESENTATIVE_ROWS.map((spec) => composeRow(spec, {
    commandIndex,
    dryRunIndex,
    gateStackIndex,
    coverageIndex,
    storageSetup,
    gateStack,
    supportArtifactAuthority,
    supportArtifactCreationPolicy
  }));

  return {
    action: 'storage.composed_gate_policy.preview',
    classification: 'read-only composed gate policy preview',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    provider_calls: 0,
    filesystem_writes: 0,
    db_mutations: 0,
    schema_changes: 0,
    runtime_interception_active: false,
    command_blocking_active: false,
    enforcement_active: false,
    future_fail_closed_active: false,
    authorization_semantics: {
      answers_may_run_now: false,
      would_allow_is_authorization: false,
      would_allow_role: 'storage/enforcement dry-run input only; final future runtime authorization must compose all gates'
    },
    sources: {
      service_registry_commands: commandMetadata.length,
      enforcement_dry_run_action: enforcementDryRun.action,
      storage_setup_gate_action: storageSetup.action,
      gate_stack_action: gateStack.action,
      support_artifact_path_authority_action: supportArtifactAuthority.action,
      support_artifact_creation_policy_action: supportArtifactCreationPolicy.action,
      external_io_state: gateStack.external_io.requested_readout_state,
      external_io_enforced: gateStack.external_io.enforced === true
    },
    summary: summarizeRows(rows),
    rows,
    unknown_unclassified_policy_intent: {
      future_posture: 'fail_closed',
      active_now: false,
      reason: 'Future runtime enforcement should block unknown/unclassified commands unless deliberately exempted; this preview does not implement that behavior.'
    },
    split_notes: splitNotes(),
    reason_code_catalog: reasonCodeCatalog(),
    boundary: [
      'Read-only composed gate policy preview only; it does not intercept, authorize, or block runtime commands.',
      'It does not call providers, write files, create support artifacts, move storage, mutate the DB, change schema, or write storage config.',
      'Dry-run would_allow is included only as one input and is not treated as runtime authorization.',
      'Confirmation tokens are UX/operator-friction metadata, not security secrets or authorization authority.',
      'Unknown/unclassified fail-closed is policy intent for future enforcement and is not active runtime behavior.'
    ]
  };
}

function composeRow(spec, context) {
  const command = context.commandIndex.get(spec.command) || (spec.unknown ? unknownCommandMetadata() : null);
  const coverage = context.coverageIndex.get(spec.command) || null;
  const dryRun = context.dryRunIndex.get(spec.command) || null;
  const gateStack = context.gateStackIndex.get(spec.command) || null;
  const classified = coverage?.classified !== false && coverage?.missing_classification !== true && Boolean(coverage);
  const effects = command?.effects || [];
  const confirmation = command?.authority || { confirmation_required: false, token: null, reason: null };
  const providerCapable = effects.includes('external-live-api') || Boolean(coverage && coverage.external_io_dependency !== 'none');
  const supportArtifactWrite = effects.includes('support-artifact');
  const fixtureOnly = coverage?.enforcement_status === 'fixture_only_non_production';
  const runtimeControl = effects.includes('runtime-control');
  const localMutation = effects.includes('local-data-mutation') || effects.includes('metadata-readability') || effects.includes('evidence-creation') || supportArtifactWrite;
  const liveGate = gateStack?.gates?.external_api || null;
  const externalIo = gateStack?.gates?.external_io || null;
  const watchArming = gateStack?.gates?.watch_arming || null;
  const activeTask = gateStack?.gates?.active_task || null;
  const destination = destinationGateFor(spec, context, supportArtifactWrite, fixtureOnly);

  const gates = {
    service_command_classified: gate(classified ? 'pass' : 'block', classified ? 'classified' : 'unknown_unclassified_command', {
      classified,
      command: spec.command
    }),
    renderer_eligibility: rendererGate(command),
    storage_authority: storageGate(spec, context, dryRun, localMutation, fixtureOnly),
    storage_budget: budgetGate(spec, context, localMutation, fixtureOnly),
    external_io: externalIoGate(spec, providerCapable, externalIo),
    live_provider_gate: liveProviderGate(spec, providerCapable, liveGate),
    cadence_rate_safety: cadenceGate(spec, providerCapable, liveGate),
    watch_arming: watchArmingGate(spec, watchArming),
    active_task_duplicate_prevention: activeTaskGate(spec, activeTask, providerCapable || runtimeControl),
    confirmation_ux: confirmationGate(confirmation),
    destination_path_authority: destination,
    trusted_context_fixture_exclusion: trustedContextGate(spec, fixtureOnly, command)
  };
  const composed = composedStateFor(gates, spec);

  return {
    id: spec.id,
    command: spec.command,
    representative_class: spec.label,
    effects_classification_basis: {
      service_classification: command?.classification || 'unknown',
      effects,
      storage_action_class: coverage?.storage_action_class || null,
      external_io_dependency: coverage?.external_io_dependency || null,
      runtime_context: coverage?.runtime_context || null,
      enforcement_status: coverage?.enforcement_status || null,
      dry_run_decision_input_only: dryRun?.decision || null,
      dry_run_source_posture_input_only: dryRun?.source_posture || null
    },
    gates,
    composed_state: composed.state,
    reason_codes: composed.reason_codes,
    would_allow_is_authorization: false,
    enforcement_active: false,
    runtime_authorization_active: false,
    future_policy_notes: notesFor(spec, coverage, dryRun, command)
  };
}

function rendererGate(command) {
  if (!command) {
    return gate('unknown', 'renderer_eligibility_unknown');
  }
  return gate(command.renderer_allowed === true ? 'pass' : 'not_applicable', command.renderer_allowed === true
    ? 'renderer_eligible_command'
    : 'trusted_or_internal_context_required', {
    renderer_allowed: command.renderer_allowed === true
  });
}

function storageGate(spec, context, dryRun, localMutation, fixtureOnly) {
  if (spec.unknown) {
    return gate('block', 'unknown_command_storage_policy_fail_closed');
  }
  if (fixtureOnly) {
    return gate('conditional', 'fixture_only_trusted_context_required');
  }
  if (!localMutation) {
    return gate('not_applicable', 'read_only_or_local_status_only');
  }
  const decision = dryRun?.decision || 'unknown';
  if (decision === 'would_allow') {
    return gate('pass', 'storage_dry_run_input_pass_not_authorization', {
      dry_run_decision_input_only: decision
    });
  }
  if (decision === 'conditional') {
    return gate('conditional', 'storage_dry_run_input_conditional_not_authorization', {
      dry_run_decision_input_only: decision
    });
  }
  return gate('block', 'storage_dry_run_input_blocks_if_enforced_later', {
    dry_run_decision_input_only: decision,
    storage_state: context.storageSetup.action_class_matrix.storage_state
  });
}

function budgetGate(spec, context, localMutation, fixtureOnly) {
  if (spec.unknown) {
    return gate('block', 'unknown_command_budget_policy_fail_closed');
  }
  if (fixtureOnly || !localMutation) {
    return gate('not_applicable', fixtureOnly ? 'fixture_budget_not_operator_corpus' : 'read_only_no_budget_write');
  }
  const state = context.storageSetup.budget.state;
  if (state === 'budget_hard_lock') {
    return gate('block', 'budget_hard_lock_blocks_writes_provider_movement', { budget_state: state });
  }
  if (state === 'budget_warning' || state === 'budget_strong_warning') {
    return gate('conditional', state, { budget_state: state });
  }
  if (state === 'budget_unconfigured') {
    return gate('conditional', 'budget_required_before_provider_or_corpus_writes', { budget_state: state });
  }
  return gate('pass', 'budget_input_pass', { budget_state: state });
}

function externalIoGate(spec, providerCapable, externalIo) {
  if (spec.unknown) {
    return gate('block', 'unknown_command_external_io_policy_fail_closed');
  }
  if (!providerCapable) {
    return gate('not_applicable', 'local_only_no_external_io_required');
  }
  const state = externalIo?.state || 'unknown';
  if (state === 'held_by_external_io') {
    return gate('hold', 'held_by_external_io', { held_is_failure: false });
  }
  if (state === 'external_io_released_to_normal_gates') {
    return gate('pass', 'external_io_released_to_normal_gates');
  }
  return gate('unknown', 'external_io_state_unknown', { state });
}

function liveProviderGate(spec, providerCapable, liveGate) {
  if (spec.unknown) {
    return gate('block', 'unknown_command_live_gate_policy_fail_closed');
  }
  if (!providerCapable) {
    return gate('not_applicable', 'local_only_no_live_provider_gate');
  }
  if (!liveGate || liveGate.state === 'unknown_action') {
    return gate('unknown', 'live_gate_action_unknown');
  }
  return gate(liveGate.allowed === true ? 'pass' : 'block', liveGate.allowed === true ? 'live_gate_allows' : 'live_gate_blocks', {
    mode: liveGate.mode,
    state: liveGate.state,
    blockers: (liveGate.blockers || []).map((entry) => entry.code || entry.message)
  });
}

function cadenceGate(spec, providerCapable, liveGate) {
  if (spec.unknown) {
    return gate('block', 'unknown_command_cadence_policy_fail_closed');
  }
  if (!providerCapable) {
    return gate('not_applicable', 'local_only_no_cadence_gate');
  }
  const requestControl = liveGate?.request_control;
  if (!requestControl) {
    return gate('unknown', 'cadence_request_control_unknown');
  }
  if (requestControl.lockout_active) {
    return gate('block', 'provider_lockout_active');
  }
  if (requestControl.cooldown_active) {
    return gate('hold', 'provider_cooldown_active');
  }
  return gate('pass', 'cadence_rate_input_pass', {
    persistence: requestControl.persistence || null
  });
}

function watchArmingGate(spec, watchArming) {
  const watchDriven = ['actor.watch', 'system.radius.watch', 'watch.executor.arm', 'watch.executor.tick'].includes(spec.command);
  if (!watchDriven) {
    return gate('not_applicable', 'not_watch_driven');
  }
  if (!watchArming || watchArming.applies !== true) {
    return gate('unknown', 'watch_gate_not_available');
  }
  return gate(watchArming.session_armed ? 'pass' : 'hold', watchArming.session_armed ? 'watch_session_armed' : 'watch_arm_required', {
    state: watchArming.state
  });
}

function activeTaskGate(spec, activeTask, applies) {
  if (spec.unknown) {
    return gate('block', 'unknown_command_active_task_policy_fail_closed');
  }
  if (!applies) {
    return gate('not_applicable', 'active_task_gate_not_required_for_local_readout');
  }
  if (!activeTask) {
    return gate('unknown', 'active_task_context_unknown');
  }
  return gate(activeTask.present === true ? 'hold' : 'pass', activeTask.present === true ? 'duplicate_or_active_task' : 'no_active_duplicate', {
    state: activeTask.state
  });
}

function confirmationGate(confirmation = {}) {
  if (confirmation.confirmation_required !== true) {
    return gate('not_applicable', 'confirmation_not_required');
  }
  return gate('conditional', 'confirmation_ux_required_not_security_secret', {
    token_public_metadata: true,
    token: confirmation.token || null
  });
}

function destinationGateFor(spec, context, supportArtifactWrite, fixtureOnly) {
  if (fixtureOnly) {
    return gate('conditional', 'fixture_destination_trusted_context_only');
  }
  if (spec.command === 'runtime.db_snapshot.create') {
    const snapshot = context.supportArtifactAuthority.classes.find((entry) => entry.id === 'runtime_snapshot_retained');
    return gate('conditional', 'snapshot_destination_authority_required', {
      cleanup_stage: snapshot?.cleanup_stage || null,
      counts_against_storage_budget: snapshot?.counts_against_storage_budget === true
    });
  }
  if (spec.command === 'support.debug_trace_pack') {
    const tracePack = context.supportArtifactAuthority.classes.find((entry) => entry.id === 'operator_debug_trace_pack');
    return gate('conditional', 'trace_pack_destination_authority_required', {
      cleanup_stage: tracePack?.cleanup_stage || null,
      counts_against_storage_budget: tracePack?.counts_against_storage_budget === true
    });
  }
  if (supportArtifactWrite) {
    return gate('conditional', 'support_artifact_destination_authority_required');
  }
  return gate('not_applicable', 'no_destination_path_authority_required');
}

function trustedContextGate(spec, fixtureOnly, command) {
  if (spec.unknown) {
    return gate('block', 'unknown_command_trusted_context_fail_closed');
  }
  if (fixtureOnly) {
    return gate(command?.renderer_allowed === true ? 'block' : 'conditional', 'fixture_only_non_production_trusted_context_required', {
      renderer_allowed: command?.renderer_allowed === true
    });
  }
  if (command?.renderer_allowed === false) {
    return gate('conditional', 'trusted_or_internal_context_required');
  }
  return gate('pass', 'normal_command_context');
}

function composedStateFor(gates, spec) {
  const entries = Object.entries(gates);
  const codes = entries.map(([gateName, gateValue]) => `${gateName}:${gateValue.reason}`);
  if (spec.unknown) {
    return {
      state: 'block',
      reason_codes: ['unknown_unclassified_future_command_fail_closed_intent', ...codes]
    };
  }
  if (entries.some(([, gateValue]) => gateValue.state === 'block')) {
    return {
      state: 'block',
      reason_codes: codes
    };
  }
  if (entries.some(([, gateValue]) => gateValue.state === 'hold')) {
    return {
      state: 'hold',
      reason_codes: codes
    };
  }
  if (entries.some(([, gateValue]) => gateValue.state === 'unknown')) {
    return {
      state: 'unknown',
      reason_codes: codes
    };
  }
  if (entries.some(([, gateValue]) => gateValue.state === 'conditional')) {
    return {
      state: 'conditional',
      reason_codes: codes
    };
  }
  return {
    state: 'pass',
    reason_codes: codes
  };
}

function summarizeRows(rows) {
  return {
    total_rows: rows.length,
    by_composed_state: rows.reduce((counts, row) => {
      counts[row.composed_state] = (counts[row.composed_state] || 0) + 1;
      return counts;
    }, {}),
    provider_or_external_io_rows: rows
      .filter((row) => row.effects_classification_basis.external_io_dependency && row.effects_classification_basis.external_io_dependency !== 'none')
      .map((row) => row.id),
    fixture_only_rows: rows
      .filter((row) => row.effects_classification_basis.enforcement_status === 'fixture_only_non_production')
      .map((row) => row.id),
    unknown_fail_closed_rows: rows
      .filter((row) => row.id === 'unknown_unclassified_future_command')
      .map((row) => row.id),
    dry_run_input_only_rows: rows
      .filter((row) => row.effects_classification_basis.dry_run_decision_input_only)
      .map((row) => ({
        id: row.id,
        command: row.command,
        dry_run_decision_input_only: row.effects_classification_basis.dry_run_decision_input_only
      }))
  };
}

function notesFor(spec, coverage, dryRun, command) {
  const notes = [];
  if (spec.unknown) {
    notes.push('Future runtime enforcement should fail closed for unknown/unclassified commands; inactive in this preview.');
  }
  if (dryRun?.decision) {
    notes.push('Dry-run decision is one input only and must not be treated as final authorization.');
  }
  if (coverage?.storage_action_class === 'setup_config_changes') {
    notes.push('setup_config_changes is broad; preview splits representative setup, Watch metadata, runtime control, and fixture-only rows.');
  }
  if (coverage?.runtime_context === 'local_sde_import') {
    notes.push('Local SDE import/rewrite is represented separately from provider-backed SDE download/build.');
  }
  if (command?.authority?.confirmation_required) {
    notes.push('Confirmation token is UX/operator-friction metadata, not a security secret.');
  }
  return notes;
}

function splitNotes() {
  return [
    {
      broad_class: 'setup_config_changes',
      preview_split: [
        'runtime_path_preparation',
        'watch_authoring_metadata',
        'snapshot_settings_update',
        'runtime_task_control',
        'fixture_only_non_production'
      ],
      enforcement_note: 'Future enforcement should not block all setup_config_changes as one risk class.'
    },
    {
      broad_class: 'background_hydration',
      preview_split: [
        'local_sde_import_rewrite',
        'sde_download_build',
        'provider_backed_background_hydration'
      ],
      enforcement_note: 'Local SDE import/rewrite is a local DB rewrite risk, while SDE download is External I/O plus local rewrite.'
    },
    {
      broad_class: 'snapshot_support_artifact_write',
      preview_split: [
        'runtime_snapshot_creation',
        'trace_pack_creation'
      ],
      enforcement_note: 'Snapshot and trace-pack destinations need path authority and budget treatment before creation enforcement.'
    }
  ];
}

function reasonCodeCatalog() {
  return [
    'classified',
    'unknown_unclassified_command',
    'unknown_unclassified_future_command_fail_closed_intent',
    'storage_dry_run_input_pass_not_authorization',
    'storage_dry_run_input_conditional_not_authorization',
    'storage_dry_run_input_blocks_if_enforced_later',
    'budget_required_before_provider_or_corpus_writes',
    'held_by_external_io',
    'external_io_released_to_normal_gates',
    'live_gate_blocks',
    'cadence_rate_input_pass',
    'watch_arm_required',
    'duplicate_or_active_task',
    'confirmation_ux_required_not_security_secret',
    'snapshot_destination_authority_required',
    'trace_pack_destination_authority_required',
    'fixture_only_non_production_trusted_context_required'
  ];
}

function actionsForGateStack() {
  return REPRESENTATIVE_ROWS
    .map((row) => row.liveGateAction)
    .filter(Boolean);
}

function gate(state, reason, details = {}) {
  return {
    state,
    reason,
    details
  };
}

function rowSpec(id, command, label, liveGateAction = command) {
  return {
    id,
    command,
    label,
    liveGateAction,
    unknown: command === 'future.unclassified.command'
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
  buildComposedGatePolicyPreview
};
