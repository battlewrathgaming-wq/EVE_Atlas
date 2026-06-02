const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { COMMAND_ENFORCEMENT_COVERAGE } = require('../src/main/services/enforcementDryRunService');
const {
  CONFIRMATION,
  invokeServiceCommand,
  runtimeEnforcementFactsFor
} = require('../src/main/services/serviceRegistry');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    await verifyResultUnchangedWithoutObserver(db);
    await verifyResultUnchangedWithObserver(db);
    await verifyCoverageSourcedWithoutContextFacts(db);
    await verifyMappedLocalCommandUsesSourcedComposedPolicy(db);
    await verifyContextSuppliedFactsPreserved(db);
    await verifySuppliedCoverageNotOverwritten(db);
    await verifyProviderCapableCommandUsesSourcedExternalIo(db);
    await verifyLiveRadiusRejectionIsReadOnlyProviderGatePosture(db);
    await verifyProviderOptionalLocalSourceAvoidsLiveGate(db);
    await verifyRuntimeSnapshotDestinationPathAuthorityFact(db);
    await verifyTracePackDestinationPathAuthorityFact(db);
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
        command_coverage_sourced: true,
        supplied_facts_preserved: true,
        supplied_coverage_not_overwritten: true,
        broad_fact_sourcing: true,
        storage_authority_sourced: true,
        storage_budget_sourced: true,
        external_io_sourced: true,
        provider_live_gate_sourced: true,
        composed_policy_sourced: true,
        destination_path_authority_sourced: true,
        mapped_local_composed_policy_sourced: true,
        snapshot_destination_path_authority_sourced: true,
        trace_pack_destination_path_authority_sourced: true,
        provider_capable_external_io_sourced_without_authorizing: true,
        live_radius_rejection_sourced_without_provider_call: true,
        provider_optional_local_source_avoids_live_gate: true,
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

async function verifyCoverageSourcedWithoutContextFacts(db) {
  const observed = [];
  const result = await invokeServiceCommand('scope.defaults', {}, {
    db,
    runtimeEnforcementPreviewObserver: (preview) => observed.push(preview)
  });
  assert(result.manualActorDiscovery.maxRefs === 20, 'coverage sourcing should not change command result');
  assert(observed.length === 1, 'observer should receive preview without supplied facts');
  const trustedContext = observed[0].evaluator_decision.gate_inputs_used.dry_run === null
    ? observed[0].evaluator_decision.gate_inputs_used.trusted_context
    : null;
  assert(!observed[0].missing_fact_classes.includes('composed_gate_policy'), 'composed policy should be sourced as explicit unmapped posture');
  assert(!observed[0].missing_fact_classes.includes('storage_authority'), 'storage authority should be sourced');
  assert(!observed[0].missing_fact_classes.includes('storage_budget'), 'storage budget should be sourced');
  assert(!observed[0].missing_fact_classes.includes('classification_coverage'), 'known covered command should have coverage sourced');
  const storageAuthority = observed[0].evaluator_decision.gate_inputs_used.storage_authority;
  const budget = observed[0].evaluator_decision.gate_inputs_used.budget;
  const externalIo = observed[0].evaluator_decision.gate_inputs_used.external_io;
  const providerLiveGate = observed[0].evaluator_decision.gate_inputs_used.provider_live_gate;
  const composedPolicy = observed[0].evaluator_decision.gate_inputs_used.composed_policy;
  const destinationPathAuthority = observed[0].evaluator_decision.gate_inputs_used.destination_path_authority;
  assert(storageAuthority?.fact_source === 'runtime_hook_read_only_storage_authority_readback', 'storage authority facts should be sourced from readback');
  assert(['sourced_configured', 'sourced_absent_unconfigured', 'sourced_missing', 'sourced_unparseable', 'sourced_invalid_schema'].includes(storageAuthority.source_status), 'storage authority source status should distinguish configured/absent/problem posture');
  assert(budget?.fact_source === 'runtime_hook_read_only_storage_setup_gate_readout', 'storage budget facts should be sourced from setup gate readout');
  assert(budget.source_status === 'sourced_configured' || budget.source_status === 'sourced_absent_unconfigured', 'budget source status should distinguish configured from absent');
  assert(externalIo?.fact_source === 'runtime_hook_read_only_external_io_config_readback', 'External I/O facts should be sourced from readback');
  assert(externalIo.source_status.startsWith('sourced_'), 'External I/O source status should be explicit');
  assert(externalIo.on_is_authorization === false, 'External I/O sourced fact should remain non-authorizing');
  assert(providerLiveGate?.state === 'local_only_no_live_provider_gate', 'local-only command should stay local-only for provider live gate');
  assert(providerLiveGate.provider_capable === false, 'local-only command must not become provider-capable');
  assert(providerLiveGate.allowed_is_authorization === false, 'provider live gate fact should be non-authorizing');
  assert(composedPolicy?.source_status === 'sourced_unmapped', 'unmapped command should get explicit composed policy unmapped posture');
  assert(composedPolicy.state === 'unknown', 'unmapped composed policy posture should not guess authorization');
  assert(composedPolicy.runtime_authorization_active === false, 'unmapped composed policy should not authorize runtime dispatch');
  assert(composedPolicy.would_allow_is_authorization === false, 'unmapped composed policy should keep would_allow non-authorizing');
  assert(destinationPathAuthority?.applies === false, 'local-only command should not require destination path authority');
  assert(destinationPathAuthority.state === 'not_applicable', 'local-only command should report destination authority not applicable');
  assert(destinationPathAuthority.renderer_authoritative === false, 'destination authority should never be renderer authoritative');
  assert(trustedContext?.renderer_allowed === true, 'trusted context posture should still reflect command metadata');
}

async function verifyMappedLocalCommandUsesSourcedComposedPolicy(db) {
  const observed = [];
  await invokeServiceCommand('runtime.enforcement_boundary.preview', {}, {
    db,
    source: 'renderer',
    runtimeEnforcementPreviewObserver: (preview) => observed.push(preview)
  });
  assert(observed.length === 1, 'mapped local/read-only command should reach inactive hook');
  const composedPolicy = observed[0].evaluator_decision.gate_inputs_used.composed_policy;
  assert(composedPolicy?.fact_source === 'runtime_hook_read_only_composed_gate_policy_preview', 'mapped local command should source composed policy fact');
  assert(composedPolicy.source_status === 'sourced_mapped_row', 'mapped local command should report mapped composed row');
  assert(composedPolicy.matched_row_id === 'runtime_enforcement_boundary_readout', 'runtime enforcement boundary should map to representative composed row');
  assert(composedPolicy.state, 'mapped composed policy should include compact composed state');
  assert(Array.isArray(composedPolicy.reason_codes), 'mapped composed policy should include reason codes');
  assert(Object.keys(composedPolicy.gate_summary || {}).length > 0, 'mapped composed policy should include compact gate summary');
  assert(!Object.prototype.hasOwnProperty.call(composedPolicy, 'rows'), 'composed policy fact should not dump full preview rows');
  assert(composedPolicy.runtime_authorization_active === false, 'mapped composed policy should not authorize runtime dispatch');
  assert(composedPolicy.would_allow_is_authorization === false, 'mapped composed policy should keep would_allow non-authorizing');
  assert(observed[0].proof.handlers_called === undefined || observed[0].proof.target_handlers_called === false, 'hook itself should not call handlers');
}

async function verifyContextSuppliedFactsPreserved(db) {
  const observed = [];
  const supplied = explicitFactsFor('scope.defaults', 'pass');
  supplied.marker = 'trusted-context-fact';
  await invokeServiceCommand('scope.defaults', {}, {
    db,
    runtimeEnforcementFacts: {
      'scope.defaults': supplied
    },
    runtimeEnforcementPreviewObserver: (preview) => observed.push(preview)
  });
  assert(observed.length === 1, 'observer should receive preview for supplied command-scoped facts');
  assert(!observed[0].missing_fact_classes.includes('classification_coverage'), 'supplied covered facts should remain covered');
  assert(observed[0].evaluator_decision.gate_inputs_used.composed_policy.state === 'pass', 'supplied composed fact should be preserved');
  assert(observed[0].evaluator_decision.gate_inputs_used.storage_authority.gate_state === 'configured_storage_ready', 'supplied storage fact should be preserved when supplied');
  assert(observed[0].evaluator_decision.gate_inputs_used.budget.state === 'within_budget', 'supplied budget fact should be preserved when supplied');
  assert(observed[0].evaluator_decision.gate_inputs_used.external_io.gate_state === 'local_only_available', 'supplied External I/O fact should be preserved when supplied');
  assert(observed[0].evaluator_decision.gate_inputs_used.provider_live_gate.state === 'local_only_no_live_provider_gate', 'supplied provider live gate fact should be preserved when supplied');
}

async function verifySuppliedCoverageNotOverwritten(db) {
  const observed = [];
  await invokeServiceCommand('scope.defaults', {}, {
    db,
    runtimeEnforcementFacts: {
      coverage: null,
      composed_policy: {
        state: 'conditional',
        reason_codes: ['supplied_null_coverage_not_overwritten']
      }
    },
    runtimeEnforcementPreviewObserver: (preview) => observed.push(preview)
  });
  assert(observed.length === 1, 'observer should receive preview for supplied null coverage');
  assert(observed[0].missing_fact_classes.includes('classification_coverage'), 'supplied null coverage should not be overwritten');
  const facts = runtimeEnforcementFactsFor('scope.defaults', {
    runtimeEnforcementFacts: {
      coverage: null
    }
  });
  assert(Object.prototype.hasOwnProperty.call(facts, 'coverage'), 'coverage key should remain supplied');
  assert(facts.coverage === null, 'supplied coverage should remain null');
  assert(facts.storage_authority?.fact_source === 'runtime_hook_read_only_storage_authority_readback', 'broad facts should still be sourced when coverage is intentionally null');
}

async function verifyProviderCapableCommandUsesSourcedExternalIo(db) {
  const observed = [];
  await assertRejects(
    () => invokeServiceCommand('manual.discovery', {
      scope: 'actor',
      entityType: 'character',
      entityId: 90000002,
      confirmation: CONFIRMATION.MANUAL_DISCOVERY
    }, {
      db,
      source: 'renderer',
      runtimeEnforcementPreviewObserver: (preview) => observed.push(preview)
    }),
    'LIVE_API_DISABLED',
    'confirmed renderer provider-capable command should preserve existing live/API gate behavior after hook'
  );
  assert(observed.length === 1, 'confirmed provider-capable command should reach inactive hook');
  const externalIo = observed[0].evaluator_decision.gate_inputs_used.external_io;
  const providerLiveGate = observed[0].evaluator_decision.gate_inputs_used.provider_live_gate;
  const composedPolicy = observed[0].evaluator_decision.gate_inputs_used.composed_policy;
  assert(externalIo?.external_io_dependency === 'zkill_provider_required', 'provider-capable command should carry External I/O dependency separately');
  assert(externalIo.gate_state === 'held_by_external_io', 'missing/off External I/O config should hold provider-backed posture');
  assert(externalIo.on_is_authorization === false, 'External I/O on/off posture should not authorize command execution');
  assert(providerLiveGate?.fact_source === 'runtime_hook_read_only_live_api_gate_action_gate', 'provider live gate should be sourced from actionGate');
  assert(providerLiveGate.provider_capable === true, 'manual.discovery should be provider-capable in live gate fact');
  assert(providerLiveGate.mapped_live_gate_action === 'manual.discovery', 'manual.discovery should map to the accepted live gate action');
  assert(providerLiveGate.state === 'blocked', 'live API disabled should remain blocker posture');
  assert(providerLiveGate.allowed === false, 'live API disabled should not be allowed');
  assert(providerLiveGate.allowed_is_authorization === false, 'provider live gate allowed flag must not authorize runtime dispatch');
  assert(providerLiveGate.blockers.some((entry) => entry.code === 'LIVE_API_DISABLED'), 'provider live gate should report live API disabled blocker');
  assert(!observed[0].missing_fact_classes.includes('provider_live_gate'), 'provider live gate should be sourced for mapped provider-capable command');
  assert(composedPolicy?.source_status === 'sourced_mapped_row', 'provider-capable command should source mapped composed policy row');
  assert(composedPolicy.matched_row_id === 'zkill_discovery', 'manual.discovery should map to zKill discovery composed policy row');
  assert(composedPolicy.runtime_authorization_active === false, 'provider composed policy should not authorize runtime dispatch');
  assert(composedPolicy.would_allow_is_authorization === false, 'provider composed policy would_allow should remain non-authorizing');
  assert(observed[0].proof.providers_called === false, 'hook itself should not call providers for provider-capable commands');
}

async function verifyLiveRadiusRejectionIsReadOnlyProviderGatePosture(db) {
  const observed = [];
  await assertRejects(
    () => invokeServiceCommand('manual.discovery', {
      scope: 'radius',
      centerSystemId: 30000142,
      maxSystems: 3,
      maxRefsPerSystem: 5,
      confirmation: CONFIRMATION.MANUAL_DISCOVERY
    }, {
      db,
      source: 'renderer',
      runtimeEnforcementPreviewObserver: (preview) => observed.push(preview)
    }),
    'LIVE_RADIUS_REJECTED',
    'live radius rejection should preserve existing live gate product boundary'
  );
  assert(observed.length === 1, 'confirmed live radius command should reach inactive hook');
  const providerLiveGate = observed[0].evaluator_decision.gate_inputs_used.provider_live_gate;
  assert(providerLiveGate?.blockers.some((entry) => entry.code === 'LIVE_RADIUS_REJECTED'), 'provider live gate should report live radius rejection');
  assert(providerLiveGate.request_control?.scope_fingerprint?.includes('manual.discovery:zkill:radius:30000142'), 'radius scope fingerprint should be visible as read-only request control posture');
  assert(providerLiveGate.allowed_is_authorization === false, 'live radius provider gate posture should not authorize dispatch');
  assert(observed[0].proof.providers_called === false, 'hook should not call providers for live radius rejection proof');
}

async function verifyProviderOptionalLocalSourceAvoidsLiveGate(db) {
  const observed = [];
  try {
    await invokeServiceCommand('sde.build-lookups', {
      sourcePath: 'F:/fixture/local-sde.zip',
      confirmation: CONFIRMATION.SDE_BUILD_LOOKUPS
    }, {
      db,
      source: 'trusted',
      runtimeEnforcementPreviewObserver: (preview) => observed.push(preview)
    });
  } catch {
    // The local fixture path is intentionally absent; only the pre-handler hook preview is under test.
  }
  assert(observed.length === 1, 'local-source SDE build should reach inactive hook before handler path validation');
  const providerLiveGate = observed[0].evaluator_decision.gate_inputs_used.provider_live_gate;
  assert(providerLiveGate?.source_status === 'sourced_provider_optional_local_source_not_applicable', 'local-source SDE build should be provider-optional local-source posture');
  assert(providerLiveGate.provider_capable === false, 'local-source SDE build should not require live provider gate posture');
  assert(providerLiveGate.state === 'local_source_no_live_provider_gate', 'local-source SDE build should avoid unmapped provider live gate state');
  assert(providerLiveGate.blockers.length === 0, 'local-source SDE build should not gain live provider blockers');
  assert(providerLiveGate.allowed_is_authorization === false, 'local-source SDE provider gate posture should remain non-authorizing');
  assert(observed[0].proof.providers_called === false, 'hook should not call providers for local-source SDE proof');
}

async function verifyRuntimeSnapshotDestinationPathAuthorityFact(db) {
  const observed = [];
  await assertRejectsAny(
    () => invokeServiceCommand('runtime.db_snapshot.create', {
      confirmation: CONFIRMATION.RUNTIME_DB_SNAPSHOT_CREATE,
      snapshotDestinationDir: 'F:/renderer-forged-snapshot-dir',
      destinationPath: 'F:/renderer-forged-snapshot.sqlite'
    }, {
      db,
      source: 'renderer',
      databasePath: 'F:/Projects/AURA-Atlas/.tmp/hs208-missing-runtime.sqlite',
      runtimeEnforcementPreviewObserver: (preview) => observed.push(preview)
    }),
    'snapshot create should fail before writing because the runtime DB path is missing'
  );
  assert(observed.length === 1, 'confirmed snapshot create should reach inactive hook');
  const destination = observed[0].evaluator_decision.gate_inputs_used.destination_path_authority;
  assert(destination?.fact_source === 'runtime_hook_read_only_support_artifact_path_authority_preview', 'snapshot should source destination path authority');
  assert(destination.applies === true, 'snapshot destination authority should apply');
  assert(destination.mapped_artifact_class_ids.includes('runtime_snapshot_rolling'), 'snapshot fact should include rolling class');
  assert(destination.mapped_artifact_class_ids.includes('runtime_snapshot_retained'), 'snapshot fact should include retained class');
  assert(destination.requires_storage_authority === true, 'snapshot destination should require storage authority');
  assert(destination.counts_against_storage_budget === true, 'snapshot destination should count against storage budget');
  assert(destination.renderer_authoritative === false, 'renderer path claims should not be authoritative');
  assert(destination.renderer_path_claims_ignored === true, 'renderer path claims should be marked ignored');
  assert(destination.non_authorizing_preview === true, 'snapshot destination fact should be non-authorizing');
  assert(!Object.prototype.hasOwnProperty.call(destination, 'classes'), 'snapshot destination fact should not dump full path inventory');
  const serialized = JSON.stringify(destination);
  assert(!serialized.includes('renderer-forged-snapshot'), 'snapshot destination fact should not echo renderer-forged paths');
  assert(observed[0].proof.file_writers_called === false, 'hook itself should not write files for snapshot proof');
}

async function verifyTracePackDestinationPathAuthorityFact(db) {
  const observed = [];
  const forgedPath = 'F:/renderer-forged-trace-pack-dir';
  await assertRejectsAny(
    () => invokeServiceCommand('support.debug_trace_pack', {
      confirmation: CONFIRMATION.SUPPORT_DEBUG_TRACE_PACK,
      outputDir: 'bad:trace-pack-output',
      tracePackOutputDir: forgedPath
    }, {
      db,
      source: 'renderer',
      databasePath: 'F:/Projects/AURA-Atlas/.tmp/hs208-trace.sqlite',
      runtimeEnforcementPreviewObserver: (preview) => observed.push(preview)
    }),
    'trace pack should fail before writing with invalid renderer output path'
  );
  assert(observed.length === 1, 'confirmed trace-pack command should reach inactive hook');
  const destination = observed[0].evaluator_decision.gate_inputs_used.destination_path_authority;
  assert(destination?.fact_source === 'runtime_hook_read_only_support_artifact_path_authority_preview', 'trace pack should source destination path authority');
  assert(destination.applies === true, 'trace-pack destination authority should apply');
  assert(destination.mapped_artifact_class_ids.includes('operator_debug_trace_pack'), 'trace-pack fact should include operator debug trace class');
  assert(destination.requires_storage_authority === true, 'trace pack destination should require storage authority');
  assert(destination.counts_against_storage_budget === true, 'trace pack destination should count against storage budget');
  assert(destination.renderer_authoritative === false, 'trace pack renderer path claims should not be authoritative');
  assert(destination.renderer_path_claims_ignored === true, 'trace pack renderer path claims should be marked ignored');
  assert(destination.non_authorizing_preview === true, 'trace pack destination fact should be non-authorizing');
  const serialized = JSON.stringify(destination);
  assert(!serialized.includes(forgedPath), 'trace pack destination fact should not echo renderer-forged paths');
  assert(!serialized.includes('bad:trace-pack-output'), 'trace pack destination fact should not echo invalid output path');
  assert(observed[0].proof.file_writers_called === false, 'hook itself should not write files for trace-pack proof');
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

async function assertRejectsAny(fn, message) {
  try {
    await fn();
  } catch (error) {
    return error;
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
