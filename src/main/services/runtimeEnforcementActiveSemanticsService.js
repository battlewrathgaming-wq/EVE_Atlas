const ACTIVE_DECISION_SEMANTICS = Object.freeze({
  pass: decisionMeaning('pass', true, false, false, 'All mandatory facts for the command family are present, trusted, fresh enough, and active-safe.'),
  block: decisionMeaning('block', false, true, true, 'A mandatory authority gate says the command must not proceed.'),
  hold: decisionMeaning('hold', false, false, false, 'Work may be valid in principle but must wait; waiting is not a failure and must not mutate state.'),
  conditional: decisionMeaning('conditional', false, false, false, 'Facts do not justify dispatch in first active semantics; a later family-specific resolver would be required.'),
  unknown: decisionMeaning('unknown', false, true, true, 'Policy, command, or fact posture is not understood; active semantics fail closed.'),
  stop_before_boundary: decisionMeaning('stop_before_boundary', false, true, false, 'Existing front-door service checks stop the call before runtime enforcement.'),
  missing_mandatory_fact: decisionMeaning('missing_mandatory_fact', false, true, true, 'Required authority facts are absent and cannot silently pass.'),
  malformed_authority_fact: decisionMeaning('malformed_authority_fact', false, true, true, 'Authority facts exist but cannot be trusted.'),
  stale_authority_fact: decisionMeaning('stale_authority_fact', false, true, true, 'Durable authority facts are stale and cannot support active pass.'),
  spoofed_renderer_fact: decisionMeaning('spoofed_renderer_fact', false, true, true, 'Renderer-origin authority claims are ignored or rejected and cannot supply active authority.')
});

const COMMAND_FAMILIES = Object.freeze({
  local_readout_preflight: family({
    examples: ['app.readiness', 'report.actor', 'watch.list', 'storage.setup_gate_readout', 'runtime.enforcement_hook_telemetry.readout'],
    first_active_stage: 'candidate',
    mandatory_facts: ['service_command_definition', 'classification_coverage', 'renderer_eligibility', 'composed_policy'],
    optional_contextual_facts: ['storage_authority_for_db_backed_readout', 'storage_budget_for_budget_posture_readout'],
    notes: 'Best first active candidate because it is local/read-only and has no provider movement, writes, support artifact creation, or Watch dispatch.'
  }),
  local_setup_config_write: family({
    examples: ['app.prepare', 'external_io.state_config_write', 'storage.authority_config.write', 'runtime.db_snapshot.settings.update'],
    first_active_stage: 'excluded',
    mandatory_facts: ['service_command_definition', 'classification_coverage', 'renderer_eligibility', 'confirmation_or_trusted_context', 'storage_or_path_authority', 'composed_policy'],
    exclusion_reason: 'config_write_authority_surface'
  }),
  local_metadata_write: family({
    examples: ['watch.create', 'watch.update', 'assessment.create', 'watch.recordRun'],
    first_active_stage: 'excluded',
    mandatory_facts: ['service_command_definition', 'classification_coverage', 'renderer_eligibility', 'confirmation_or_trusted_context', 'storage_authority', 'storage_budget', 'composed_policy'],
    exclusion_reason: 'local_write_semantics_need_operator_posture'
  }),
  provider_backed_manual: family({
    examples: ['manual.discovery', 'manual.expansion', 'metadata.hydration'],
    first_active_stage: 'excluded',
    mandatory_facts: ['service_command_definition', 'classification_coverage', 'renderer_eligibility', 'confirmation', 'storage_authority', 'storage_budget', 'external_io', 'provider_live_gate', 'composed_policy'],
    exclusion_reason: 'provider_movement_and_evidence_or_hydration_writes'
  }),
  watch_background_provider: family({
    examples: ['actor.watch', 'system.radius.watch', 'watch.executor.arm', 'watch.executor.tick'],
    first_active_stage: 'excluded',
    mandatory_facts: ['service_command_definition', 'classification_coverage', 'renderer_eligibility_or_trusted_context', 'confirmation_or_trusted_context', 'storage_authority', 'storage_budget', 'external_io', 'provider_live_gate', 'watch_runtime', 'composed_policy'],
    exclusion_reason: 'watch_background_provider_dispatch'
  }),
  support_artifact_write: family({
    examples: ['runtime.db_snapshot.create', 'support.debug_trace_pack'],
    first_active_stage: 'excluded',
    mandatory_facts: ['service_command_definition', 'classification_coverage', 'renderer_eligibility', 'confirmation', 'storage_authority', 'storage_budget', 'destination_path_authority', 'support_artifact_creation_policy', 'composed_policy'],
    exclusion_reason: 'support_artifact_path_and_privacy_sensitive_write'
  }),
  sde_import_lookup: family({
    examples: ['sde.import.topology', 'sde.import.inventory', 'sde.build-lookups'],
    first_active_stage: 'excluded',
    mandatory_facts: ['service_command_definition', 'classification_coverage', 'trusted_context', 'storage_authority', 'storage_budget', 'local_source_or_external_io_provider_gate', 'composed_policy'],
    exclusion_reason: 'split_local_source_and_provider_download_semantics'
  }),
  runtime_task_control: family({
    examples: ['task.cancel', 'task.list', 'task.get'],
    first_active_stage: 'excluded',
    mandatory_facts: ['service_command_definition', 'classification_coverage', 'renderer_eligibility_or_trusted_context', 'task_identity_validation', 'task_scope_or_ownership_posture', 'composed_policy'],
    exclusion_reason: 'task_control_scope_semantics_unaccepted'
  }),
  fixture_proof: family({
    examples: ['external_io.state_persistence_proof', 'metadata.hydration_write_fixture_proof', 'storage.authority_config.write_proof', 'storage.authority_config.acknowledgement_persistence_proof'],
    first_active_stage: 'excluded',
    mandatory_facts: ['service_command_definition', 'fixture_only_classification', 'trusted_test_context', 'explicit_fixture_root'],
    exclusion_reason: 'fixture_only_non_production'
  }),
  destructive_execution: family({
    examples: ['retention.actions'],
    first_active_stage: 'excluded',
    mandatory_facts: ['service_command_definition', 'classification_coverage', 'future_deletion_runway_authority'],
    exclusion_reason: 'destructive_execution_future_runway_only'
  })
});

const NON_AUTHORIZING_INPUTS = Object.freeze({
  external_io_on: 'External I/O on releases work only to normal gates; it is not dispatch permission.',
  dry_run_would_allow: 'Dry-run would_allow is projected posture only and is not authorization.',
  provider_allowed: 'Provider/live gate allowed is one input only and is not runtime authorization.',
  watch_armed: 'Watch session arming is Watch intent, not provider movement permission.',
  destination_path_authority: 'Destination/path authority is not support artifact creation permission.'
});

const FIXTURE_CASES = Object.freeze([
  fixture('local_readout_complete_pass', 'local_readout_preflight', {
    facts_present: ['service_command_definition', 'classification_coverage', 'renderer_eligibility', 'composed_policy'],
    expected_decision: 'pass'
  }),
  fixture('front_door_stop_before_boundary', 'provider_backed_manual', {
    front_door_stopped: true,
    expected_decision: 'stop_before_boundary'
  }),
  fixture('unknown_command_fails_closed', 'local_readout_preflight', {
    unknown_policy: true,
    expected_decision: 'unknown'
  }),
  fixture('conditional_does_not_dispatch', 'local_readout_preflight', {
    facts_present: ['service_command_definition', 'classification_coverage', 'renderer_eligibility', 'composed_policy'],
    force_decision: 'conditional',
    expected_decision: 'conditional'
  }),
  fixture('external_io_off_is_hold', 'provider_backed_manual', {
    facts_present: ['service_command_definition', 'classification_coverage', 'renderer_eligibility', 'confirmation', 'storage_authority', 'storage_budget', 'external_io', 'provider_live_gate', 'composed_policy'],
    hold_reason: 'held_by_external_io',
    expected_decision: 'hold'
  }),
  fixture('provider_cooldown_is_hold', 'provider_backed_manual', {
    facts_present: ['service_command_definition', 'classification_coverage', 'renderer_eligibility', 'confirmation', 'storage_authority', 'storage_budget', 'external_io', 'provider_live_gate', 'composed_policy'],
    hold_reason: 'provider_cooldown',
    expected_decision: 'hold'
  }),
  fixture('missing_external_io_blocks_authority_claim', 'provider_backed_manual', {
    facts_present: ['service_command_definition', 'classification_coverage', 'renderer_eligibility', 'confirmation', 'storage_authority', 'storage_budget', 'provider_live_gate', 'composed_policy'],
    expected_decision: 'missing_mandatory_fact'
  }),
  fixture('malformed_storage_authority_blocks', 'provider_backed_manual', {
    facts_present: ['service_command_definition', 'classification_coverage', 'renderer_eligibility', 'confirmation', 'storage_authority', 'storage_budget', 'external_io', 'provider_live_gate', 'composed_policy'],
    malformed_facts: ['storage_authority'],
    expected_decision: 'malformed_authority_fact'
  }),
  fixture('stale_path_authority_blocks', 'support_artifact_write', {
    facts_present: ['service_command_definition', 'classification_coverage', 'renderer_eligibility', 'confirmation', 'storage_authority', 'storage_budget', 'destination_path_authority', 'support_artifact_creation_policy', 'composed_policy'],
    stale_facts: ['destination_path_authority'],
    expected_decision: 'stale_authority_fact'
  }),
  fixture('stale_watch_runtime_holds', 'watch_background_provider', {
    facts_present: ['service_command_definition', 'classification_coverage', 'renderer_eligibility_or_trusted_context', 'confirmation_or_trusted_context', 'storage_authority', 'storage_budget', 'external_io', 'provider_live_gate', 'watch_runtime', 'composed_policy'],
    stale_facts: ['watch_runtime'],
    expected_decision: 'hold'
  }),
  fixture('renderer_origin_authority_fact_rejected', 'provider_backed_manual', {
    renderer_supplied_authority_facts: ['storage_authority', 'external_io', 'provider_live_gate'],
    facts_present: ['service_command_definition', 'classification_coverage', 'renderer_eligibility', 'confirmation', 'composed_policy'],
    expected_decision: 'spoofed_renderer_fact'
  }),
  fixture('trusted_test_supplied_facts_allowed', 'local_readout_preflight', {
    facts_present: ['service_command_definition', 'classification_coverage', 'renderer_eligibility', 'composed_policy'],
    supplied_fact_source: 'trusted_test',
    expected_decision: 'pass'
  }),
  fixture('trusted_supplied_facts_without_test_posture_blocked', 'local_readout_preflight', {
    facts_present: ['service_command_definition', 'classification_coverage', 'renderer_eligibility', 'composed_policy'],
    supplied_fact_source: 'trusted_without_test_posture',
    expected_decision: 'block'
  }),
  fixture('external_io_on_alone_not_authorizing', 'provider_backed_manual', {
    facts_present: ['service_command_definition', 'classification_coverage', 'renderer_eligibility', 'confirmation', 'external_io'],
    single_non_authorizing_input: 'external_io_on',
    expected_decision: 'missing_mandatory_fact'
  }),
  fixture('dry_run_would_allow_alone_not_authorizing', 'provider_backed_manual', {
    facts_present: ['service_command_definition', 'classification_coverage', 'renderer_eligibility', 'confirmation', 'dry_run'],
    single_non_authorizing_input: 'dry_run_would_allow',
    expected_decision: 'missing_mandatory_fact'
  }),
  fixture('provider_allowed_alone_not_authorizing', 'provider_backed_manual', {
    facts_present: ['service_command_definition', 'classification_coverage', 'renderer_eligibility', 'confirmation', 'provider_live_gate'],
    single_non_authorizing_input: 'provider_allowed',
    expected_decision: 'missing_mandatory_fact'
  }),
  fixture('watch_arming_alone_not_authorizing', 'watch_background_provider', {
    facts_present: ['service_command_definition', 'classification_coverage', 'renderer_eligibility_or_trusted_context', 'confirmation_or_trusted_context', 'watch_runtime'],
    single_non_authorizing_input: 'watch_armed',
    expected_decision: 'missing_mandatory_fact'
  }),
  fixture('destination_path_authority_alone_not_authorizing', 'support_artifact_write', {
    facts_present: ['service_command_definition', 'classification_coverage', 'renderer_eligibility', 'confirmation', 'destination_path_authority'],
    single_non_authorizing_input: 'destination_path_authority',
    expected_decision: 'missing_mandatory_fact'
  }),
  fixture('fixture_proof_cannot_active_pass_production', 'fixture_proof', {
    facts_present: ['service_command_definition', 'fixture_only_classification', 'trusted_test_context', 'explicit_fixture_root'],
    production_context: true,
    expected_decision: 'block'
  }),
  fixture('destructive_execution_cannot_active_pass', 'destructive_execution', {
    facts_present: ['service_command_definition', 'classification_coverage', 'future_deletion_runway_authority'],
    expected_decision: 'block'
  })
]);

function buildRuntimeEnforcementActiveSemanticsPreview(input = {}, context = {}) {
  const cases = FIXTURE_CASES.map(evaluateFixtureCase);
  const commandMetadata = Array.isArray(context.commandMetadata) ? context.commandMetadata : [];
  return {
    action: 'runtime.enforcement_active_semantics.preview',
    classification: 'pure active runtime enforcement semantics fixture matrix',
    read_only: true,
    pure_function: true,
    generated_at: input.generatedAt || new Date().toISOString(),
    active_runtime_enforcement: false,
    command_blocking_active: false,
    preview_only: true,
    invoke_service_command_inserted: false,
    decision_semantics: ACTIVE_DECISION_SEMANTICS,
    command_families: COMMAND_FAMILIES,
    first_active_excluded_families: Object.entries(COMMAND_FAMILIES)
      .filter(([, value]) => value.first_active_stage === 'excluded')
      .map(([key]) => key),
    first_active_candidate_families: Object.entries(COMMAND_FAMILIES)
      .filter(([, value]) => value.first_active_stage === 'candidate')
      .map(([key]) => key),
    non_authorizing_inputs: NON_AUTHORIZING_INPUTS,
    trusted_fact_supply: trustedFactSupplyDoctrine(),
    fixture_matrix: {
      status: cases.every((entry) => entry.passed) ? 'passed' : 'failed',
      case_count: cases.length,
      cases
    },
    service_registry_context: {
      command_count_seen: commandMetadata.length,
      used_for_dispatch: false
    },
    proof: {
      active_runtime_enforcement: false,
      command_blocking: false,
      invoke_service_command_modified: false,
      target_handlers_called: false,
      task_runners_called: false,
      providers_called: false,
      provider_attempts_recorded: false,
      repositories_called: false,
      db_writes: false,
      config_writes: false,
      file_writers_called: false,
      support_artifacts_created: false,
      watch_mutated: false,
      storage_moved: false,
      renderer_ui_changed: false,
      terminology_renamed: false
    },
    boundary: [
      'Pure active semantics fixture matrix only; it does not activate runtime enforcement or block commands.',
      'It is not inserted into invokeServiceCommand and does not call target handlers, task runners, providers, repositories, file writers, config writers, or DB write APIs.',
      'The matrix defines future active semantics by command family so preview facts, dry-run posture, External I/O on, provider allowed, Watch arming, and path authority cannot become authorization alone.'
    ]
  };
}

function evaluateFixtureCase(testCase) {
  const family = COMMAND_FAMILIES[testCase.command_family];
  if (!family) {
    return resultFor(testCase, 'unknown', ['unknown_command_family']);
  }
  if (testCase.front_door_stopped === true) {
    return resultFor(testCase, 'stop_before_boundary', ['front_door_stop']);
  }
  if (testCase.unknown_policy === true) {
    return resultFor(testCase, 'unknown', ['unknown_policy']);
  }
  if (testCase.renderer_supplied_authority_facts?.length) {
    return resultFor(testCase, 'spoofed_renderer_fact', ['renderer_authority_facts_rejected']);
  }
  if (testCase.supplied_fact_source === 'trusted_without_test_posture') {
    return resultFor(testCase, 'block', ['trusted_supplied_fact_missing_explicit_test_posture']);
  }
  if (testCase.malformed_facts?.length) {
    return resultFor(testCase, 'malformed_authority_fact', testCase.malformed_facts.map((fact) => `malformed:${fact}`));
  }
  if (testCase.stale_facts?.length) {
    if (testCase.stale_facts.includes('watch_runtime')) {
      return resultFor(testCase, 'hold', ['stale_volatile_watch_runtime_retry_later']);
    }
    return resultFor(testCase, 'stale_authority_fact', testCase.stale_facts.map((fact) => `stale:${fact}`));
  }
  if (testCase.hold_reason) {
    return resultFor(testCase, 'hold', [`hold:${testCase.hold_reason}`]);
  }
  if (testCase.force_decision) {
    return resultFor(testCase, testCase.force_decision, [`forced_fixture:${testCase.force_decision}`]);
  }
  const missing = missingMandatoryFacts(family, testCase.facts_present || []);
  if (missing.length) {
    return resultFor(testCase, 'missing_mandatory_fact', missing.map((fact) => `missing:${fact}`));
  }
  if (family.first_active_stage === 'excluded' || testCase.production_context === true) {
    return resultFor(testCase, 'block', [`first_active_excluded:${family.exclusion_reason || testCase.command_family}`]);
  }
  return resultFor(testCase, 'pass', ['mandatory_facts_present_for_first_active_candidate']);
}

function missingMandatoryFacts(family, factsPresent = []) {
  const present = new Set(factsPresent);
  return family.mandatory_facts.filter((fact) => !present.has(fact));
}

function resultFor(testCase, decision, reasonCodes) {
  const semantics = ACTIVE_DECISION_SEMANTICS[decision] || ACTIVE_DECISION_SEMANTICS.unknown;
  return {
    id: testCase.id,
    command_family: testCase.command_family,
    expected_decision: testCase.expected_decision,
    decision,
    passed: decision === testCase.expected_decision,
    would_dispatch_if_active: semantics.dispatch_behavior === 'may_dispatch',
    mutates_state: false,
    failure: semantics.failure === true,
    hold_is_failure: decision === 'hold' ? false : null,
    non_authorizing_input: testCase.single_non_authorizing_input || null,
    reason_codes: reasonCodes,
    authority_notes: {
      preview_facts_are_authorization: false,
      dry_run_would_allow_is_authorization: false,
      external_io_on_is_authorization: false,
      provider_allowed_is_authorization: false,
      watch_arming_is_provider_permission: false,
      destination_path_authority_is_creation_permission: false
    }
  };
}

function trustedFactSupplyDoctrine() {
  return {
    renderer_payload_authority_facts: 'ignored_or_rejected',
    renderer_payload_authority_facts_may_override_sourced: false,
    trusted_supplied_facts_allowed: 'only_with_explicit_trusted_test_posture',
    arbitrary_runtime_enforcement_facts_authority: false,
    required_future_fields: ['source', 'family', 'freshness_posture', 'trusted_test_posture'],
    diagnostics_may_preserve_supplied_facts: true,
    production_active_mode_must_source_backend_facts: true
  };
}

function decisionMeaning(decision, mayDispatch, blocking, failure, meaning) {
  return {
    decision,
    active_meaning: meaning,
    dispatch_behavior: mayDispatch ? 'may_dispatch' : 'no_dispatch',
    blocks_dispatch: mayDispatch ? false : true,
    blocking_posture: blocking,
    failure,
    mutates_state: false
  };
}

function family(input) {
  return Object.freeze({
    examples: Object.freeze([...(input.examples || [])]),
    first_active_stage: input.first_active_stage,
    mandatory_facts: Object.freeze([...(input.mandatory_facts || [])]),
    optional_contextual_facts: Object.freeze([...(input.optional_contextual_facts || [])]),
    exclusion_reason: input.exclusion_reason || null,
    notes: input.notes || null
  });
}

function fixture(id, commandFamily, input) {
  return Object.freeze({
    id,
    command_family: commandFamily,
    ...input
  });
}

module.exports = {
  ACTIVE_DECISION_SEMANTICS,
  COMMAND_FAMILIES,
  NON_AUTHORIZING_INPUTS,
  FIXTURE_CASES,
  buildRuntimeEnforcementActiveSemanticsPreview,
  evaluateFixtureCase
};
