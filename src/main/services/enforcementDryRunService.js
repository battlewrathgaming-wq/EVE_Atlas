const { buildStorageSetupGateReadout } = require('./storageSetupGateReadoutService');

const COMMAND_ENFORCEMENT_COVERAGE = Object.freeze({
  'app.readiness': coverage('local_reports_observation', 'none', 'renderer_status', 'covered_read_only', 'Read-only readiness and posture report.'),
  'app.prepare': coverage('setup_config_changes', 'none', 'runtime_path_preparation', 'covered_local_mutation', 'Creates approved runtime/cache directories; future enforcement should treat it as setup support, not provider movement.'),
  'live.gate': coverage('local_db_inspection', 'none', 'provider_gate_readout', 'covered_read_only', 'Read-only live/API gate posture report.'),
  'manual.discovery': coverage('zkill_discovery', 'zkill_provider_required', 'operator_provider_discovery', 'covered_provider_and_storage_gated', 'Calls zKill and writes Discovery refs as possible leads; does not create Evidence/EVEidence.'),
  'manual.expansion': coverage('esi_evidence_expansion', 'esi_provider_required', 'operator_esi_evidence_expansion', 'covered_provider_and_storage_gated', 'Calls ESI and writes selected expanded killmail Evidence/EVEidence.'),
  'actor.watch': coverage('esi_evidence_expansion', 'provider_required', 'scheduled_or_direct_watch_collection', 'covered_provider_and_storage_gated', 'Watch execution can call providers and write Evidence/EVEidence.'),
  'system.radius.watch': coverage('esi_evidence_expansion', 'provider_required', 'scheduled_or_direct_watch_collection', 'covered_provider_and_storage_gated', 'System/radius Watch execution can call providers and write Evidence/EVEidence.'),
  'metadata.hydration': coverage('fast_view_metadata_hydration', 'esi_provider_required', 'operator_metadata_readability_hydration', 'covered_provider_and_storage_gated', 'Calls ESI names and writes readability metadata only.'),
  'sde.import.topology': coverage('background_hydration', 'none', 'local_sde_import', 'covered_local_mutation', 'Imports local SDE topology into lookup metadata.'),
  'sde.import.inventory': coverage('background_hydration', 'none', 'local_sde_import', 'covered_local_mutation', 'Imports local SDE inventory/type metadata into lookup metadata.'),
  'sde.build-lookups': coverage('background_hydration', 'provider_optional_local_source_supported', 'sde_lookup_build', 'covered_provider_and_storage_gated', 'May download SDE source when no local source is supplied, then rewrites local lookup metadata.'),
  'watch.create': coverage('setup_config_changes', 'none', 'watch_authoring', 'covered_local_mutation', 'Writes local Watch intent metadata without running collection.'),
  'watch.update': coverage('setup_config_changes', 'none', 'watch_authoring', 'covered_local_mutation', 'Writes local Watch intent metadata without running collection.'),
  'watch.list': coverage('local_db_inspection', 'none', 'watch_readout', 'covered_read_only', 'Read-only Watch list.'),
  'watch.schedule': coverage('local_db_inspection', 'none', 'watch_scheduler_readout', 'covered_read_only', 'Read-only due/blocked/backoff Watch schedule posture.'),
  'watch.offline_readout': coverage('local_db_inspection', 'none', 'watch_recovery_readout', 'covered_read_only', 'Read-only Watch recovery/support model from durable local state.'),
  'watch.recordRun': coverage('setup_config_changes', 'none', 'watch_scheduler_metadata', 'covered_local_mutation', 'Writes Watch scheduling result metadata after execution.'),
  'watch.executor.status': coverage('local_db_inspection', 'none', 'background_watch_executor_status', 'covered_read_only', 'Read-only volatile Watch executor state.'),
  'watch.executor.arm': coverage('esi_evidence_expansion', 'provider_required', 'background_watch_dispatch', 'covered_provider_and_storage_gated', 'Arming may dispatch due Watch provider work and write Evidence/EVEidence.'),
  'watch.executor.disarm': coverage('setup_config_changes', 'none', 'background_watch_executor_control', 'covered_runtime_control', 'Disarms volatile Watch execution without provider calls or storage movement.'),
  'watch.executor.tick': coverage('esi_evidence_expansion', 'provider_required', 'background_watch_dispatch', 'covered_provider_and_storage_gated', 'Executor tick may dispatch due Watch provider work and write Evidence/EVEidence.'),
  'assessment.create': coverage('assessment_writing', 'none', 'operator_assessment_memory', 'covered_local_mutation', 'Writes deliberate Assessment Memory, not Evidence/EVEidence.'),
  'assessment.list': coverage('local_db_inspection', 'none', 'assessment_readout', 'covered_read_only', 'Read-only Assessment Memory listing.'),
  'assessment.get': coverage('local_db_inspection', 'none', 'assessment_readout', 'covered_read_only', 'Read-only Assessment Memory fetch.'),
  'report.build': coverage('local_reports_observation', 'none', 'local_report', 'covered_read_only', 'Builds local report output from local records.'),
  'report.actor': coverage('local_reports_observation', 'none', 'local_report', 'covered_read_only', 'Builds local actor report output from local records.'),
  'report.corporation': coverage('local_reports_observation', 'none', 'local_report', 'covered_read_only', 'Builds local corporation report output from local records.'),
  'report.corpus_health': coverage('local_reports_observation', 'none', 'local_report', 'covered_read_only', 'Builds local corpus health report output from local records.'),
  'report.queue': coverage('local_reports_observation', 'none', 'local_report', 'covered_read_only', 'Builds local Discovery queue report output from local records.'),
  'report.radius': coverage('local_reports_observation', 'none', 'local_report', 'covered_read_only', 'Builds local radius report output from local records.'),
  'report.run': coverage('local_reports_observation', 'none', 'local_report', 'covered_read_only', 'Builds local run diagnostics report output from local records.'),
  'report.system': coverage('local_reports_observation', 'none', 'local_report', 'covered_read_only', 'Builds local system report output from local records.'),
  'retention.actions': coverage('pruning_deletion_execution', 'none', 'retention_definition_readout', 'covered_future_runway_only', 'Read-only destructive action definitions; execution remains future-runway only.'),
  'retention.preflight': coverage('pruning_deletion_preflight', 'none', 'retention_preflight', 'covered_destructive_preview', 'Read-only destructive/retention impact preview.'),
  'runtime.db_snapshot.preflight': coverage('local_db_inspection', 'none', 'snapshot_preflight', 'covered_read_only', 'Read-only runtime snapshot destination and count preview.'),
  'storage.authority_preflight': coverage('local_db_inspection', 'none', 'storage_authority_readout', 'covered_read_only', 'Read-only storage and support-artifact posture report.'),
  'storage.setup_gate_readout': coverage('local_db_inspection', 'none', 'storage_gate_readout', 'covered_read_only', 'Read-only storage setup and disk-budget gate posture.'),
  'storage.authority_config.write_proof': coverage('setup_config_changes', 'none', 'fixture_storage_config_write_proof', 'fixture_only_non_production', 'Fixture-only write/readback proof; not renderer eligible and not operator-real config writes.'),
  'storage.authority_config.acknowledgement_persistence_proof': coverage('setup_config_changes', 'none', 'fixture_acknowledgement_persistence_proof', 'fixture_only_non_production', 'Fixture-only fallback acknowledgement persistence proof; not renderer eligible and not operator-real config writes.'),
  'support.gate_stack_readout': coverage('local_db_inspection', 'none', 'provider_gate_stack_readout', 'covered_read_only', 'Read-only gate-stack posture; External I/O enforcement remains policy-only.'),
  'storage.enforcement_dry_run.command_effect_map': coverage('local_db_inspection', 'none', 'enforcement_dry_run_readout', 'read_only_non_enforcing_proof', 'Read-only coverage and command/effect map; enforcement remains inactive.'),
  'runtime.db_snapshot.settings.get': coverage('local_db_inspection', 'none', 'snapshot_settings_readout', 'covered_read_only', 'Read-only runtime snapshot settings fetch.'),
  'runtime.db_snapshot.settings.update': coverage('setup_config_changes', 'none', 'snapshot_settings_update', 'covered_local_mutation', 'Validates and persists runtime snapshot destination/budget settings.'),
  'runtime.db_snapshot.create': coverage('snapshot_support_artifact_write', 'none', 'snapshot_support_artifact_write', 'covered_support_artifact_gated', 'Writes a bounded local runtime DB snapshot support artifact.'),
  'support.debug_trace_pack': coverage('snapshot_support_artifact_write', 'none', 'support_trace_artifact_write', 'covered_support_artifact_gated', 'Writes a bounded local operator debug trace pack.'),
  'queue.selection': coverage('local_db_inspection', 'none', 'queue_selection_readout', 'covered_read_only', 'Read-only Discovery ref selection preview.'),
  'scope.defaults': coverage('local_db_inspection', 'none', 'scope_control_readout', 'covered_read_only', 'Read-only scope defaults.'),
  'scope.validate': coverage('local_db_inspection', 'none', 'scope_control_readout', 'covered_read_only', 'Read-only scope validation/normalization.'),
  'task.list': coverage('local_db_inspection', 'none', 'task_readout', 'covered_read_only', 'Read-only backend task history.'),
  'task.get': coverage('local_db_inspection', 'none', 'task_readout', 'covered_read_only', 'Read-only backend task fetch.'),
  'task.cancel': coverage('setup_config_changes', 'none', 'runtime_task_control', 'covered_runtime_control', 'Requests cancellation for a running task; no direct provider/storage authority bypass.')
});

function buildEnforcementDryRunCommandEffectMap(input = {}, context = {}) {
  const setupGate = buildStorageSetupGateReadout(input, context);
  const commandMetadata = context.commandMetadata || [];
  const commandIndex = new Map(commandMetadata.map((entry) => [entry.command, entry]));
  const coverageReport = buildCommandCoverageReport(commandMetadata);
  const effectClasses = Object.entries(setupGate.action_class_matrix.actions).map(([actionClass, actionDecision]) => (
    mapActionClassDecision(actionClass, actionDecision, setupGate)
  ));
  const commands = coverageReport.commands.map((entry) => (
    mapCommandDecision(entry, commandIndex.get(entry.command), setupGate)
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
    coverage: coverageReport,
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

function buildCommandCoverageReport(commandMetadata = [], coverageMap = COMMAND_ENFORCEMENT_COVERAGE) {
  const rows = commandMetadata.map((metadata) => {
    const commandCoverage = coverageMap[metadata.command] || null;
    return {
      command: metadata.command,
      classified: Boolean(commandCoverage),
      missing_classification: !commandCoverage,
      coverage: commandCoverage ? { ...commandCoverage, command: metadata.command } : null
    };
  });
  const gapCommands = rows
    .filter((entry) => entry.missing_classification)
    .map((entry) => entry.command);
  const classified = rows.filter((entry) => entry.classified).map((entry) => entry.coverage);
  const providerCommands = classified
    .filter((entry) => entry.external_io_dependency !== 'none')
    .map((entry) => entry.command);
  const fixtureOnlyCommands = classified
    .filter((entry) => entry.enforcement_status === 'fixture_only_non_production')
    .map((entry) => entry.command);
  const backgroundWatchCommands = classified
    .filter((entry) => entry.runtime_context.includes('watch') || entry.runtime_context.includes('background'))
    .map((entry) => entry.command);

  return {
    status: gapCommands.length === 0 ? 'complete' : 'gaps',
    total_commands: commandMetadata.length,
    covered_commands: classified.length,
    gap_commands: gapCommands,
    provider_or_external_io_commands: providerCommands,
    fixture_only_commands: fixtureOnlyCommands,
    scheduled_background_watch_commands: backgroundWatchCommands,
    commands: classified
  };
}

function mapCommandDecision(mapping, metadata, setupGate) {
  const actionDecision = setupGate.action_class_matrix.actions[mapping.storage_action_class];
  const decision = dryRunDecision(actionDecision);
  return {
    command: mapping.command,
    storage_action_class: mapping.storage_action_class,
    external_io_dependency: mapping.external_io_dependency,
    runtime_context: mapping.runtime_context,
    enforcement_status: mapping.enforcement_status,
    notes: mapping.notes,
    effects: metadata?.effects || [],
    classification: metadata?.classification || null,
    renderer_allowed: metadata?.renderer_allowed === true,
    storage_state: setupGate.action_class_matrix.storage_state,
    budget_state: setupGate.budget.state,
    external_io_assumption: externalIoAssumption(actionDecision, mapping),
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
    reason_codes: reasonCodesFor(actionDecision, setupGate, { storage_action_class: actionClass }),
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

function externalIoAssumption(actionDecision = {}, mapping = {}) {
  if (mapping.external_io_dependency && mapping.external_io_dependency !== 'none') {
    return 'external_io_declared_not_enforced_in_this_readout';
  }
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
  if (mapping.storage_action_class) {
    codes.add(`storage_action_class:${mapping.storage_action_class}`);
  }
  if (mapping.external_io_dependency && mapping.external_io_dependency !== 'none') {
    codes.add(`external_io_dependency:${mapping.external_io_dependency}`);
  }
  if (mapping.enforcement_status) {
    codes.add(`enforcement_status:${mapping.enforcement_status}`);
  }
  return [...codes];
}

function coverage(storageActionClass, externalIoDependency, runtimeContext, enforcementStatus, notes) {
  return {
    storage_action_class: storageActionClass,
    external_io_dependency: externalIoDependency,
    runtime_context: runtimeContext,
    enforcement_status: enforcementStatus,
    notes
  };
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
    'storage_action_class:<classified storage/action class>',
    'external_io_dependency:<declared external I/O dependency>',
    'enforcement_status:<coverage status>',
    'command:<classified service command>'
  ];
}

module.exports = {
  COMMAND_ENFORCEMENT_COVERAGE,
  buildCommandCoverageReport,
  buildEnforcementDryRunCommandEffectMap
};
