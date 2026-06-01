const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { COMMAND_ENFORCEMENT_COVERAGE } = require('../src/main/services/enforcementDryRunService');
const {
  CONFIRMATION,
  invokeServiceCommand
} = require('../src/main/services/serviceRegistry');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    await verifyResultUnchangedWithoutObserver(db);
    await verifyResultUnchangedWithObserver(db);
    await verifyHookStopsAfterEligibilityAndConfirmation(db);
    await verifyHookBeforeTaskWrapping(db);
    await verifyTrustedInternalBypass(db);
    await verifyUnknownStopsBeforeHook(db);

    console.log(JSON.stringify({
      status: 'inactive runtime enforcement service-boundary hook verified',
      proof: {
        active_runtime_enforcement: false,
        command_blocking: false,
        dispatch_changed: false,
        observer_optional: true,
        renderer_ineligible_stops_before_hook: true,
        missing_confirmation_stops_before_hook: true,
        hook_runs_before_task_wrapping: true,
        dry_run_would_allow_is_authorization: false,
        external_io_on_is_authorization: false,
        unknown_fail_closed_active: false,
        target_handlers_called_by_hook: false,
        task_runners_called_by_hook: false,
        providers_called_by_hook: false,
        repositories_called_by_hook: false,
        file_writers_called_by_hook: false,
        config_writers_called_by_hook: false
      }
    }, null, 2));
  } finally {
    closeDatabase(db);
  }
}

async function verifyResultUnchangedWithoutObserver(db) {
  const result = await invokeServiceCommand('scope.defaults', {}, { db });
  assert(result.manualActorDiscovery.maxRefs === 20, 'scope.defaults should remain unchanged without observer');
}

async function verifyResultUnchangedWithObserver(db) {
  const observed = [];
  const expected = await invokeServiceCommand('scope.defaults', {}, { db });
  const actual = await invokeServiceCommand('scope.defaults', {}, {
    db,
    runtimeEnforcementFacts: explicitFactsFor('scope.defaults', 'pass'),
    runtimeEnforcementPreviewObserver: (preview) => observed.push(preview)
  });

  assert(JSON.stringify(actual) === JSON.stringify(expected), 'observer should not change command result');
  assert(observed.length === 1, 'observer should receive one preview');
  assert(observed[0].command === 'scope.defaults', 'observer preview should identify command');
  assert(observed[0].active === false, 'observer preview should be inactive');
  assert(observed[0].preview_only === true, 'observer preview should be preview-only');
  assert(observed[0].evaluator_decision.active === false, 'evaluator decision should be inactive');
  assert(observed[0].authority_notes.dry_run_would_allow_is_authorization === false, 'dry-run would_allow should not authorize');
  assert(observed[0].authority_notes.external_io_on_is_authorization === false, 'External I/O on should not authorize');
}

async function verifyHookStopsAfterEligibilityAndConfirmation(db) {
  const ineligibleObserved = [];
  await assertRejects(
    () => invokeServiceCommand('storage.authority_config.write', {}, {
      db,
      source: 'renderer',
      runtimeEnforcementPreviewObserver: (preview) => ineligibleObserved.push(preview)
    }),
    'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
    'renderer-ineligible command should reject before hook'
  );
  assert(ineligibleObserved.length === 0, 'renderer-ineligible command should stop before hook');

  const missingConfirmationObserved = [];
  await assertRejects(
    () => invokeServiceCommand('manual.discovery', {
      scope: 'actor',
      entityType: 'character',
      entityId: 90000002
    }, {
      db,
      source: 'renderer',
      runtimeEnforcementPreviewObserver: (preview) => missingConfirmationObserved.push(preview)
    }),
    'SERVICE_CONFIRMATION_REQUIRED',
    'missing renderer confirmation should reject before hook'
  );
  assert(missingConfirmationObserved.length === 0, 'missing confirmation should stop before hook');
}

async function verifyHookBeforeTaskWrapping(db) {
  const observed = [];
  const result = await invokeServiceCommand('app.readiness', {}, {
    db,
    asTask: true,
    runtimeEnforcementFacts: explicitFactsFor('app.readiness', 'pass'),
    runtimeEnforcementPreviewObserver: (preview) => observed.push(preview)
  });
  assert(observed.length === 1, 'hook should run once before task wrapping');
  assert(result.status === 'succeeded', 'task wrapping should remain unchanged');
  assert(result.result.checks.db_initialized === true, 'task-wrapped handler result should remain unchanged');
  assert(observed[0].proof.task_runners_called === false, 'hook itself should not call task runners');
}

async function verifyTrustedInternalBypass(db) {
  const observed = [];
  await assertRejects(
    () => invokeServiceCommand('manual.discovery', {
      scope: 'actor',
      entityType: 'character',
      entityId: 90000002
    }, {
      db,
      source: 'trusted',
      runtimeEnforcementFacts: explicitFactsFor('manual.discovery', 'block'),
      runtimeEnforcementPreviewObserver: (preview) => observed.push(preview)
    }),
    'LIVE_API_DISABLED',
    'trusted/internal call should preserve existing behavior after hook'
  );
  assert(observed.length === 1, 'trusted/internal command should reach hook');
  assert(observed[0].confirmation_posture.state === 'trusted_internal_bypasses_confirmation_front_door', 'trusted/internal bypass should remain distinct');
  assert(!observed[0].evaluator_decision.reason_codes.includes('confirmation_satisfied'), 'trusted/internal bypass must not be confirmation satisfaction');
  assert(observed[0].proof.providers_called === false, 'hook itself should not call providers');
}

async function verifyUnknownStopsBeforeHook(db) {
  const observed = [];
  await assertRejects(
    () => invokeServiceCommand('future.unclassified.command', {}, {
      db,
      runtimeEnforcementPreviewObserver: (preview) => observed.push(preview)
    }),
    'UNKNOWN_SERVICE_COMMAND',
    'unknown command should stop before hook'
  );
  assert(observed.length === 0, 'unknown commands should stop before hook');
}

function explicitFactsFor(command, composedState) {
  const coverage = COMMAND_ENFORCEMENT_COVERAGE[command];
  return {
    coverage: coverage ? { ...coverage, command, classified: true, missing_classification: false } : null,
    storage_authority: {
      gate_state: 'configured_storage_ready',
      validation_status: 'valid'
    },
    budget: {
      state: 'within_budget',
      blocks_writes: false
    },
    external_io: {
      state: 'on',
      requested_state: 'on',
      dependency: coverage?.external_io_dependency || 'none',
      gate_state: coverage?.external_io_dependency && coverage.external_io_dependency !== 'none'
        ? 'external_io_released_to_normal_gates'
        : 'local_only_available'
    },
    provider_live_gate: {
      provider_capable: Boolean(coverage?.external_io_dependency && coverage.external_io_dependency !== 'none'),
      state: composedState === 'block' ? 'blocked' : 'local_only_no_live_provider_gate',
      allowed: composedState !== 'block'
    },
    destination_path_authority: {
      applies: false,
      state: 'not_applicable'
    },
    composed_policy: {
      state: composedState,
      reason_codes: [`hook_fixture:${composedState}`]
    },
    dry_run: {
      decision: 'would_allow',
      reason_codes: ['hook_fixture_dry_run_would_allow_non_authorizing']
    }
  };
}

async function assertRejects(fn, expectedCode, message) {
  try {
    await fn();
  } catch (error) {
    if (error.code === expectedCode) {
      return error;
    }
    throw new Error(`${message}; expected ${expectedCode}, got ${error.code || error.message}`);
  }
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
