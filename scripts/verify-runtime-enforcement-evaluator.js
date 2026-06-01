const { evaluateRuntimeEnforcementDecision } = require('../src/main/services/runtimeEnforcementEvaluator');

function main() {
  const cases = [
    {
      id: 'safe_local_read_report_preflight',
      facts: baseFacts('report.actor', {
        composed_policy: { state: 'pass', reason_codes: ['service_command_classified:classified'] }
      }),
      expect: { decision: 'pass' }
    },
    {
      id: 'storage_authority_readback',
      facts: baseFacts('storage.authority_config.readback', {
        composed_policy: { state: 'pass', reason_codes: ['local_readout'] }
      }),
      expect: { decision: 'pass' }
    },
    {
      id: 'storage_authority_trusted_write',
      facts: baseFacts('storage.authority_config.write', {
        source: 'trusted',
        trusted_context: { required: true, fixture_only_non_production: false },
        composed_policy: { state: 'conditional', reason_codes: ['trusted_or_internal_context_required'] }
      }),
      expect: { decision: 'conditional', codes: ['trusted_context_required'] }
    },
    {
      id: 'provider_backed_discovery_held',
      facts: baseFacts('manual.discovery', {
        external_io: { dependency: 'zkill_provider_required', gate_state: 'held_by_external_io', provider_backed_posture: 'held_by_external_io' },
        provider_live_gate: { provider_capable: true, state: 'blocked_by_live_gate', allowed: false },
        composed_policy: { state: 'block', reason_codes: ['external_io:held_by_external_io'] }
      }),
      expect: { decision: 'block', codes: ['external_io_held'] }
    },
    {
      id: 'esi_evidence_expansion_confirmation_missing',
      facts: baseFacts('manual.expansion', {
        confirmation: { required: true, provided_for_preview: false, would_stop_before_boundary: true },
        external_io: { dependency: 'esi_provider_required', gate_state: 'held_by_external_io' },
        composed_policy: { state: 'block', reason_codes: ['confirmation_ux_required_not_security_secret'] }
      }),
      expect: { decision: 'stop_before_boundary', codes: ['confirmation_missing'] }
    },
    {
      id: 'hydration_write_confirmation_satisfied',
      facts: baseFacts('metadata.hydration', {
        confirmation: { required: true, provided_for_preview: true, would_stop_before_boundary: false },
        external_io: { dependency: 'esi_provider_required', gate_state: 'held_by_external_io' },
        composed_policy: { state: 'block', reason_codes: ['external_io:held_by_external_io'] }
      }),
      expect: { decision: 'block', codes: ['confirmation_satisfied', 'external_io_held'] }
    },
    {
      id: 'watch_execution_trusted_context',
      facts: baseFacts('watch.executor.tick', {
        source: 'trusted',
        external_io: { dependency: 'provider_required', gate_state: 'held_by_external_io' },
        provider_live_gate: { provider_capable: true, state: 'blocked_by_live_gate', allowed: false },
        trusted_context: { required: true, fixture_only_non_production: false },
        composed_policy: { state: 'block', reason_codes: ['watch_arm_required'] }
      }),
      expect: { decision: 'block', codes: ['trusted_context_required', 'external_io_held'] }
    },
    {
      id: 'support_artifact_path_authority',
      facts: baseFacts('runtime.db_snapshot.create', {
        destination_path_authority: { applies: true, state: 'conditional' },
        composed_policy: { state: 'conditional', reason_codes: ['snapshot_destination_authority_required'] }
      }),
      expect: { decision: 'conditional', codes: ['path_authority_conditional'] }
    },
    {
      id: 'task_cancellation_runtime_control',
      facts: baseFacts('task.cancel', {
        confirmation: { required: true, provided_for_preview: true, would_stop_before_boundary: false },
        composed_policy: { state: 'conditional', reason_codes: ['confirmation_ux_required_not_security_secret'] }
      }),
      expect: { decision: 'conditional', codes: ['confirmation_satisfied'] }
    },
    {
      id: 'fixture_only_proof_command',
      facts: baseFacts('storage.authority_config.write_proof', {
        trusted_context: { required: true, fixture_only_non_production: true },
        composed_policy: { state: 'conditional', reason_codes: ['fixture_only_non_production_trusted_context_required'] }
      }),
      expect: { decision: 'conditional', codes: ['trusted_context_required', 'fixture_only'] }
    },
    {
      id: 'unknown_unclassified_future_command',
      facts: baseFacts('future.unclassified.command', {
        known: false,
        classified: false,
        command_eligibility: { state: 'unknown_command', would_stop_before_boundary: true, reason: 'unknown_service_command' },
        composed_policy: { state: 'block', reason_codes: ['unknown_unclassified_future_command_fail_closed_intent'] }
      }),
      expect: { decision: 'stop_before_boundary', codes: ['unknown_unclassified'] }
    },
    {
      id: 'storage_missing_reason_code',
      facts: baseFacts('manual.expansion', {
        storage_authority: { gate_state: 'configured_storage_missing_unavailable', validation_status: 'missing_unavailable' },
        composed_policy: { state: 'block', reason_codes: ['storage_dry_run_input_blocks_if_enforced_later'] }
      }),
      expect: { decision: 'block', codes: ['storage_missing'] }
    },
    {
      id: 'budget_hard_lock_reason_code',
      facts: baseFacts('metadata.hydration', {
        budget: { state: 'budget_hard_lock', blocks_writes: true },
        composed_policy: { state: 'block', reason_codes: ['budget_hard_lock_blocks_writes_provider_movement'] }
      }),
      expect: { decision: 'block', codes: ['budget_hard_lock'] }
    }
  ];

  const results = cases.map((entry) => verifyCase(entry));
  verifyNonAuthorizingNotes(results);

  console.log(JSON.stringify({
    status: 'runtime enforcement evaluator verified',
    total_cases: results.length,
    by_decision: summarize(results),
    sample_decisions: results.slice(0, 5).map(compact),
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

function verifyCase({ id, facts, expect }) {
  const decision = evaluateRuntimeEnforcementDecision(facts);
  assert(decision.command === facts.command, `${id}: command should be echoed`);
  assert(decision.active === false, `${id}: evaluator must remain inactive`);
  assert(decision.preview_only === true, `${id}: evaluator must remain preview-only`);
  assert(decision.decision === expect.decision, `${id}: expected ${expect.decision}, got ${decision.decision}`);
  for (const code of expect.codes || []) {
    assert(decision.reason_codes.includes(code), `${id}: missing stable reason code ${code}`);
  }
  assert(decision.notes.would_allow_is_authorization === false, `${id}: would_allow must not authorize`);
  assert(decision.notes.external_io_on_is_authorization === false, `${id}: External I/O on must not authorize`);
  assert(decision.notes.evaluator_calls_handlers === false, `${id}: evaluator must not call handlers`);
  assert(decision.notes.evaluator_calls_task_runners === false, `${id}: evaluator must not call task runners`);
  assert(decision.notes.evaluator_calls_providers === false, `${id}: evaluator must not call providers`);
  assert(decision.notes.evaluator_calls_repositories === false, `${id}: evaluator must not call repositories`);
  assert(decision.notes.evaluator_calls_file_writers === false, `${id}: evaluator must not call file writers`);
  assert(decision.notes.evaluator_calls_config_writers === false, `${id}: evaluator must not call config writers`);
  return { id, decision };
}

function verifyNonAuthorizingNotes(results) {
  const allDecisions = results.map((entry) => entry.decision);
  assert(allDecisions.every((entry) => entry.notes.would_allow_is_authorization === false), 'would_allow should be non-authorizing for all rows');
  assert(allDecisions.every((entry) => entry.notes.external_io_on_is_authorization === false), 'External I/O on should be non-authorizing for all rows');
}

function baseFacts(command, overrides = {}) {
  return {
    command,
    source: 'renderer',
    known: true,
    classified: true,
    command_eligibility: { state: 'eligible_for_boundary_preview', would_stop_before_boundary: false, reason: 'renderer_eligible_command' },
    confirmation: { required: false, provided_for_preview: false, would_stop_before_boundary: false },
    storage_authority: { gate_state: 'configured_storage_ready', validation_status: 'valid' },
    budget: { state: 'within_budget', blocks_writes: false },
    external_io: { state: 'on', requested_state: 'on', dependency: 'none', gate_state: 'local_only_available' },
    provider_live_gate: { provider_capable: false, state: 'local_only_no_live_provider_gate', allowed: false },
    destination_path_authority: { applies: false, state: 'not_applicable' },
    trusted_context: { required: false, fixture_only_non_production: false },
    composed_policy: { state: 'pass', reason_codes: [] },
    dry_run: { decision: 'would_allow', reason_codes: [] },
    ...overrides
  };
}

function summarize(results) {
  return results.reduce((counts, entry) => {
    const decision = entry.decision.decision;
    counts[decision] = (counts[decision] || 0) + 1;
    return counts;
  }, {});
}

function compact(entry) {
  return {
    id: entry.id,
    command: entry.decision.command,
    decision: entry.decision.decision,
    boundary: entry.decision.boundary_reachability.state,
    reason_codes: entry.decision.reason_codes.filter((code) => !code.startsWith('composed:') && !code.startsWith('dry_run:'))
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main();
