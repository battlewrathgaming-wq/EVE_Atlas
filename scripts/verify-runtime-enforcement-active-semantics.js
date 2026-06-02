const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const {
  ACTIVE_DECISION_SEMANTICS,
  COMMAND_FAMILIES,
  NON_AUTHORIZING_INPUTS,
  buildRuntimeEnforcementActiveSemanticsPreview
} = require('../src/main/services/runtimeEnforcementActiveSemanticsService');
const {
  invokeServiceCommand,
  listServiceCommands
} = require('../src/main/services/serviceRegistry');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const direct = buildRuntimeEnforcementActiveSemanticsPreview({}, {
      commandMetadata: listServiceCommands()
    });
    verifyShape(direct);
    verifyDecisionSemantics(direct);
    verifyMandatoryFactFamilies(direct);
    verifyFixtureMatrix(direct);
    verifyTrustedFactSupply(direct);
    verifyNonAuthorizingInputs(direct);
    verifyNoRuntimeInsertion();

    const viaService = await invokeServiceCommand('runtime.enforcement_active_semantics.preview', {}, { db });
    verifyShape(viaService);
    assert(viaService.fixture_matrix.status === 'passed', 'service preview should return passing fixture matrix');

    console.log(JSON.stringify({
      status: 'runtime enforcement active semantics fixture matrix verified',
      decision_states: Object.keys(direct.decision_semantics),
      command_families: Object.keys(direct.command_families),
      first_active_candidate_families: direct.first_active_candidate_families,
      first_active_excluded_families: direct.first_active_excluded_families,
      fixture_case_count: direct.fixture_matrix.case_count,
      sample_cases: direct.fixture_matrix.cases.slice(0, 6).map(compactCase),
      proof: {
        pure_function: direct.pure_function,
        active_runtime_enforcement: direct.proof.active_runtime_enforcement,
        command_blocking: direct.proof.command_blocking,
        invoke_service_command_inserted: direct.invoke_service_command_inserted,
        target_handlers_called: direct.proof.target_handlers_called,
        task_runners_called: direct.proof.task_runners_called,
        providers_called: direct.proof.providers_called,
        db_writes: direct.proof.db_writes,
        config_writes: direct.proof.config_writes,
        support_artifacts_created: direct.proof.support_artifacts_created
      }
    }, null, 2));
  } finally {
    closeDatabase(db);
  }
}

function verifyShape(preview) {
  assert(preview.action === 'runtime.enforcement_active_semantics.preview', 'preview should expose action name');
  assert(preview.read_only === true, 'preview should be read-only');
  assert(preview.pure_function === true, 'preview should be pure');
  assert(preview.active_runtime_enforcement === false, 'preview must not activate runtime enforcement');
  assert(preview.command_blocking_active === false, 'preview must not activate command blocking');
  assert(preview.invoke_service_command_inserted === false, 'preview must not be inserted into invokeServiceCommand');
  assert(preview.proof.target_handlers_called === false, 'preview must not call handlers');
  assert(preview.proof.task_runners_called === false, 'preview must not call task runners');
  assert(preview.proof.providers_called === false, 'preview must not call providers');
  assert(preview.proof.db_writes === false, 'preview must not write DB rows');
  assert(preview.proof.config_writes === false, 'preview must not write config');
  assert(preview.proof.support_artifacts_created === false, 'preview must not create support artifacts');
}

function verifyDecisionSemantics(preview) {
  for (const state of ['pass', 'block', 'hold', 'conditional', 'unknown', 'stop_before_boundary', 'missing_mandatory_fact', 'malformed_authority_fact', 'stale_authority_fact', 'spoofed_renderer_fact']) {
    assert(preview.decision_semantics[state], `missing decision semantics for ${state}`);
  }
  assert(preview.decision_semantics.pass.dispatch_behavior === 'may_dispatch', 'only pass may dispatch in active semantics');
  for (const state of ['block', 'hold', 'conditional', 'unknown', 'stop_before_boundary']) {
    assert(preview.decision_semantics[state].dispatch_behavior === 'no_dispatch', `${state} should not dispatch`);
  }
  assert(preview.decision_semantics.hold.failure === false, 'hold should not be failure');
  assert(preview.decision_semantics.hold.mutates_state === false, 'hold should not mutate state');
}

function verifyMandatoryFactFamilies(preview) {
  assert(preview.command_families.local_readout_preflight.first_active_stage === 'candidate', 'local readout/preflight should be first active candidate');
  assert(preview.command_families.provider_backed_manual.mandatory_facts.includes('external_io'), 'provider-backed manual family should require External I/O');
  assert(preview.command_families.provider_backed_manual.mandatory_facts.includes('provider_live_gate'), 'provider-backed manual family should require provider live gate');
  assert(preview.command_families.watch_background_provider.mandatory_facts.includes('watch_runtime'), 'Watch/background family should require Watch runtime');
  assert(preview.command_families.support_artifact_write.mandatory_facts.includes('destination_path_authority'), 'support artifact family should require destination path authority');
  assert(preview.command_families.support_artifact_write.mandatory_facts.includes('support_artifact_creation_policy'), 'support artifact family should require creation policy');
  for (const family of ['provider_backed_manual', 'watch_background_provider', 'support_artifact_write', 'local_setup_config_write', 'fixture_proof', 'destructive_execution', 'runtime_task_control']) {
    assert(preview.first_active_excluded_families.includes(family), `${family} should be excluded from first active enforcement`);
  }
}

function verifyFixtureMatrix(preview) {
  assert(preview.fixture_matrix.status === 'passed', 'fixture matrix should pass');
  assert(preview.fixture_matrix.case_count >= 18, 'fixture matrix should cover required cases');
  const cases = new Map(preview.fixture_matrix.cases.map((entry) => [entry.id, entry]));
  assertCase(cases, 'local_readout_complete_pass', 'pass', true);
  assertCase(cases, 'conditional_does_not_dispatch', 'conditional', false);
  assertCase(cases, 'external_io_off_is_hold', 'hold', false);
  assert(cases.get('external_io_off_is_hold').hold_is_failure === false, 'hold should be non-failure');
  assert(cases.get('external_io_off_is_hold').mutates_state === false, 'hold should be non-mutating');
  assertCase(cases, 'missing_external_io_blocks_authority_claim', 'missing_mandatory_fact', false);
  assertCase(cases, 'malformed_storage_authority_blocks', 'malformed_authority_fact', false);
  assertCase(cases, 'renderer_origin_authority_fact_rejected', 'spoofed_renderer_fact', false);
  assertCase(cases, 'external_io_on_alone_not_authorizing', 'missing_mandatory_fact', false);
  assertCase(cases, 'dry_run_would_allow_alone_not_authorizing', 'missing_mandatory_fact', false);
  assertCase(cases, 'provider_allowed_alone_not_authorizing', 'missing_mandatory_fact', false);
  assertCase(cases, 'watch_arming_alone_not_authorizing', 'missing_mandatory_fact', false);
  assertCase(cases, 'destination_path_authority_alone_not_authorizing', 'missing_mandatory_fact', false);
  assertCase(cases, 'fixture_proof_cannot_active_pass_production', 'block', false);
  assertCase(cases, 'destructive_execution_cannot_active_pass', 'block', false);
}

function verifyTrustedFactSupply(preview) {
  assert(preview.trusted_fact_supply.renderer_payload_authority_facts === 'ignored_or_rejected', 'renderer authority facts should be ignored/rejected');
  assert(preview.trusted_fact_supply.renderer_payload_authority_facts_may_override_sourced === false, 'renderer facts must not override sourced facts');
  assert(preview.trusted_fact_supply.trusted_supplied_facts_allowed === 'only_with_explicit_trusted_test_posture', 'trusted facts should require explicit test posture');
  const cases = new Map(preview.fixture_matrix.cases.map((entry) => [entry.id, entry]));
  assertCase(cases, 'trusted_test_supplied_facts_allowed', 'pass', true);
  assertCase(cases, 'trusted_supplied_facts_without_test_posture_blocked', 'block', false);
}

function verifyNonAuthorizingInputs(preview) {
  for (const key of ['external_io_on', 'dry_run_would_allow', 'provider_allowed', 'watch_armed', 'destination_path_authority']) {
    assert(preview.non_authorizing_inputs[key] === NON_AUTHORIZING_INPUTS[key], `${key} should be documented as non-authorizing`);
  }
  for (const entry of preview.fixture_matrix.cases.filter((testCase) => testCase.non_authorizing_input)) {
    assert(entry.would_dispatch_if_active === false, `${entry.id} should not dispatch from one non-authorizing input`);
    assert(entry.authority_notes.external_io_on_is_authorization === false, `${entry.id} should keep External I/O non-authorizing`);
    assert(entry.authority_notes.dry_run_would_allow_is_authorization === false, `${entry.id} should keep dry-run non-authorizing`);
    assert(entry.authority_notes.provider_allowed_is_authorization === false, `${entry.id} should keep provider allowed non-authorizing`);
    assert(entry.authority_notes.watch_arming_is_provider_permission === false, `${entry.id} should keep Watch arming non-authorizing`);
    assert(entry.authority_notes.destination_path_authority_is_creation_permission === false, `${entry.id} should keep path authority non-authorizing`);
  }
}

function verifyNoRuntimeInsertion() {
  const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');
  const source = invokeServiceCommand.toString();
  assert(!source.includes('buildRuntimeEnforcementActiveSemanticsPreview'), 'invokeServiceCommand should not call active semantics preview');
  assert(source.includes('emitInactiveRuntimeEnforcementPreview(command, definition, payload, context);'), 'inactive hook should remain the only service-boundary preview call');
}

function assertCase(cases, id, decision, wouldDispatch) {
  const entry = cases.get(id);
  assert(entry, `missing fixture case ${id}`);
  assert(entry.passed === true, `${id} should pass expected-decision check`);
  assert(entry.decision === decision, `${id} expected ${decision}, got ${entry.decision}`);
  assert(entry.would_dispatch_if_active === wouldDispatch, `${id} dispatch posture mismatch`);
}

function compactCase(entry) {
  return {
    id: entry.id,
    command_family: entry.command_family,
    decision: entry.decision,
    would_dispatch_if_active: entry.would_dispatch_if_active,
    reason_codes: entry.reason_codes
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(ACTIVE_DECISION_SEMANTICS.pass.dispatch_behavior === 'may_dispatch', 'static import sanity check');
assert(COMMAND_FAMILIES.local_readout_preflight.first_active_stage === 'candidate', 'static family sanity check');

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
