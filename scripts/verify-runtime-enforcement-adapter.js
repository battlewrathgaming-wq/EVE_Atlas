const { COMMAND_ENFORCEMENT_COVERAGE } = require('../src/main/services/enforcementDryRunService');
const { buildDryRuntimeEnforcementAdapterDecision } = require('../src/main/services/runtimeEnforcementDryAdapter');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');

function main() {
  const commands = new Map(listServiceCommands().map((entry) => [entry.command, entry]));
  const cases = [
    scenario('safe_local_read_report', 'report.actor', 'renderer', {}, {
      composed: 'pass',
      expectDecision: 'pass',
      expectDispatchIfActive: true
    }),
    scenario('renderer_ineligible_trusted_command', 'actor.watch', 'trusted', { confirmation: token(commands, 'actor.watch') }, {
      composed: 'conditional',
      expectDecision: 'conditional',
      expectTrusted: true,
      watchRuntime: true,
      expectCodes: ['confirmation_not_enforced_at_front_door']
    }),
    scenario('missing_confirmation', 'manual.discovery', 'renderer', {}, {
      composed: 'block',
      expectDecision: 'stop_before_boundary',
      expectBlockIfActive: true,
      expectCodes: ['confirmation_missing']
    }),
    scenario('satisfied_confirmation', 'manual.expansion', 'renderer', { confirmation: token(commands, 'manual.expansion') }, {
      composed: 'block',
      expectDecision: 'block',
      expectCodes: ['confirmation_satisfied']
    }),
    scenario('trusted_internal_config_write', 'storage.authority_config.write', 'trusted', {}, {
      composed: 'conditional',
      expectDecision: 'conditional',
      expectTrusted: true
    }),
    scenario('provider_backed_discovery', 'manual.discovery', 'renderer', { confirmation: token(commands, 'manual.discovery') }, {
      composed: 'block',
      expectDecision: 'block',
      expectCodes: ['external_io_held']
    }),
    scenario('esi_evidence_expansion', 'manual.expansion', 'renderer', { confirmation: token(commands, 'manual.expansion') }, {
      composed: 'block',
      expectDecision: 'block',
      expectCodes: ['external_io_held']
    }),
    scenario('hydration_write', 'metadata.hydration', 'renderer', { confirmation: token(commands, 'metadata.hydration') }, {
      composed: 'block',
      expectDecision: 'block',
      expectCodes: ['external_io_held']
    }),
    scenario('watch_execution', 'watch.executor.tick', 'trusted', { confirmation: token(commands, 'watch.executor.tick') }, {
      composed: 'block',
      expectDecision: 'block',
      expectTrusted: true,
      watchRuntime: true
    }),
    scenario('support_artifact_creation', 'runtime.db_snapshot.create', 'renderer', { confirmation: token(commands, 'runtime.db_snapshot.create') }, {
      composed: 'conditional',
      expectDecision: 'conditional',
      expectCodes: ['path_authority_conditional']
    }),
    scenario('unknown_command_before_boundary', 'future.unclassified.command', 'trusted', {}, {
      composed: 'block',
      expectDecision: 'stop_before_boundary',
      expectBlockIfActive: true,
      expectMissing: ['service_command_definition', 'classification_coverage']
    })
  ].map((entry) => verifyScenario(entry, commands));

  const missingFactProof = verifyMissingFactProof(commands);
  verifyInvokeServiceCommandUnchanged();
  verifyNoAdapterSideEffects(cases);

  console.log(JSON.stringify({
    status: 'runtime enforcement dry adapter verified',
    total_cases: cases.length,
    by_decision: summarize(cases),
    sample_cases: cases.slice(0, 5).map(compact),
    missing_fact_proof: compact(missingFactProof),
    invoke_service_command_behavior: {
      adapter_inserted: false,
      active_runtime_enforcement: false,
      command_blocking: false
    },
    proof: {
      active: false,
      preview_only: true,
      target_handlers_called: false,
      task_runners_called: false,
      providers_called: false,
      repositories_called: false,
      file_writers_called: false,
      config_writers_called: false
    }
  }, null, 2));
}

function verifyScenario(entry, commands) {
  const definition = commands.get(entry.command) || null;
  const decision = buildDryRuntimeEnforcementAdapterDecision({
    command: entry.command,
    payload: entry.payload,
    context: { source: entry.source },
    definition,
    facts: explicitFactsFor(entry.command, entry.options)
  });

  assert(decision.active === false, `${entry.id}: adapter should be inactive`);
  assert(decision.preview_only === true, `${entry.id}: adapter should be preview-only`);
  assert(decision.evaluator_decision.active === false, `${entry.id}: evaluator should be inactive`);
  assert(decision.evaluator_decision.preview_only === true, `${entry.id}: evaluator should be preview-only`);
  assert(decision.evaluator_decision.decision === entry.options.expectDecision, `${entry.id}: expected ${entry.options.expectDecision}, got ${decision.evaluator_decision.decision}`);
  assert(decision.authority_notes.dry_run_would_allow_is_authorization === false, `${entry.id}: dry-run would_allow must not authorize`);
  assert(decision.authority_notes.external_io_on_is_authorization === false, `${entry.id}: External I/O on must not authorize`);
  if (entry.options.expectDispatchIfActive !== undefined) {
    assert(decision.would_dispatch_if_active === entry.options.expectDispatchIfActive, `${entry.id}: dispatch-if-active mismatch`);
  }
  if (entry.options.expectBlockIfActive !== undefined) {
    assert(decision.would_block_if_active === entry.options.expectBlockIfActive, `${entry.id}: block-if-active mismatch`);
  }
  if (entry.options.expectTrusted === true) {
    assert(decision.trusted_internal_context_posture.required === true, `${entry.id}: trusted/internal context should be required or used`);
  }
  for (const code of entry.options.expectCodes || []) {
    assert(decision.evaluator_decision.reason_codes.includes(code), `${entry.id}: missing reason code ${code}`);
  }
  for (const factClass of entry.options.expectMissing || []) {
    assert(decision.missing_fact_classes.includes(factClass), `${entry.id}: missing fact class ${factClass}`);
  }
  return { id: entry.id, decision };
}

function verifyMissingFactProof(commands) {
  const decision = buildDryRuntimeEnforcementAdapterDecision({
    command: 'report.actor',
    payload: {},
    context: { source: 'renderer' },
    definition: commands.get('report.actor'),
    facts: {
      coverage: coverageFor('report.actor'),
      dry_run: {
        decision: 'would_allow',
        reason_codes: ['safe_local_or_read_only_path']
      }
    }
  });
  assert(decision.missing_fact_classes.includes('composed_gate_policy'), 'missing proof should report composed gate policy fact gap');
  assert(decision.missing_fact_classes.includes('storage_authority'), 'missing proof should report storage authority fact gap');
  assert(decision.missing_fact_classes.includes('storage_budget'), 'missing proof should report storage budget fact gap');
  assert(decision.evaluator_decision.decision === 'conditional', 'dry-run would_allow without composed facts should not become pass');
  assert(decision.dry_run_input.used_as_authority === false, 'dry-run would_allow should be non-authorizing');
  assert(decision.would_dispatch_if_active === false, 'missing facts should prevent dispatch-if-active posture');
  return { id: 'missing_fact_dry_run_would_allow_not_authority', decision };
}

function verifyInvokeServiceCommandUnchanged() {
  const source = invokeServiceCommand.toString();
  assert(!source.includes('buildDryRuntimeEnforcementAdapterDecision'), 'invokeServiceCommand should not call the dry adapter');
  assert(source.includes('assertCommandEligible(command, definition, context);'), 'invokeServiceCommand should retain renderer eligibility check');
  assert(source.includes('assertCommandAuthority(command, definition, payload, context);'), 'invokeServiceCommand should retain confirmation authority check');
  assert(source.includes('return definition.handler({ ...context, payload });'), 'invokeServiceCommand should retain direct handler dispatch');
}

function verifyNoAdapterSideEffects(results) {
  for (const { id, decision } of results) {
    assert(decision.proof.target_handlers_called === false, `${id}: adapter must not call handlers`);
    assert(decision.proof.task_runners_called === false, `${id}: adapter must not call task runners`);
    assert(decision.proof.providers_called === false, `${id}: adapter must not call providers`);
    assert(decision.proof.repositories_called === false, `${id}: adapter must not call repositories`);
    assert(decision.proof.file_writers_called === false, `${id}: adapter must not call file writers`);
    assert(decision.proof.config_writers_called === false, `${id}: adapter must not call config writers`);
  }
}

function explicitFactsFor(command, options = {}) {
  const coverage = coverageFor(command);
  const provider = coverage?.external_io_dependency && coverage.external_io_dependency !== 'none';
  const support = ['runtime.db_snapshot.create', 'support.debug_trace_pack'].includes(command);
  return {
    coverage,
    storage_authority: {
      gate_state: 'configured_storage_ready',
      validation_status: 'valid'
    },
    budget: {
      state: 'within_budget',
      blocks_writes: false
    },
    external_io: provider ? {
      state: 'off',
      requested_state: 'off',
      dependency: coverage.external_io_dependency,
      gate_state: 'held_by_external_io',
      provider_backed_posture: 'held_by_external_io'
    } : {
      state: 'on',
      requested_state: 'on',
      dependency: 'none',
      gate_state: 'local_only_available'
    },
    provider_live_gate: provider ? {
      provider_capable: true,
      state: 'blocked',
      allowed: false
    } : {
      provider_capable: false,
      state: 'local_only_no_live_provider_gate',
      allowed: false
    },
    destination_path_authority: support ? {
      applies: true,
      state: 'conditional'
    } : {
      applies: false,
      state: 'not_applicable'
    },
    watch_runtime: options.watchRuntime === true ? {
      session_armed: true,
      active_task_present: false
    } : undefined,
    composed_policy: {
      state: options.composed || 'conditional',
      reason_codes: [`fixture_composed:${options.composed || 'conditional'}`]
    },
    dry_run: {
      decision: 'would_allow',
      reason_codes: ['dry_run_fixture_would_allow_non_authorizing']
    }
  };
}

function coverageFor(command) {
  const coverage = COMMAND_ENFORCEMENT_COVERAGE[command];
  return coverage ? { ...coverage, command, classified: true, missing_classification: false } : null;
}

function scenario(id, command, source, payload, options) {
  return {
    id,
    command,
    source,
    payload,
    options
  };
}

function token(commands, command) {
  return commands.get(command)?.authority?.token || null;
}

function summarize(results) {
  return results.reduce((counts, entry) => {
    const decision = entry.decision.evaluator_decision.decision;
    counts[decision] = (counts[decision] || 0) + 1;
    return counts;
  }, {});
}

function compact(entry) {
  return {
    id: entry.id,
    command: entry.decision.command,
    source: entry.decision.source,
    decision: entry.decision.evaluator_decision.decision,
    would_block_if_active: entry.decision.would_block_if_active,
    would_dispatch_if_active: entry.decision.would_dispatch_if_active,
    missing_fact_classes: entry.decision.missing_fact_classes,
    dry_run_used_as_authority: entry.decision.dry_run_input.used_as_authority
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main();
