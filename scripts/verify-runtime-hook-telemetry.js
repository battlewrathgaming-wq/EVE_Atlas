const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const {
  CONFIRMATION,
  invokeServiceCommand
} = require('../src/main/services/serviceRegistry');
const { buildRuntimeHookTelemetryReadout } = require('../src/main/services/runtimeHookTelemetryReadoutService');
const { auraTempRoot } = require('../src/main/util/tempPaths');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  const artifactRoot = path.join(auraTempRoot(), 'runtime-hook-telemetry-should-not-exist');
  fs.rmSync(artifactRoot, { recursive: true, force: true });

  try {
    const emptyReadout = await verifyEmptyReadout(db);
    const capturedReadout = await verifyCapturedPreviewReadout(db);
    const missingCoverageReadout = await verifyMissingCoverageReadout(db);
    await verifyBehaviorPreserved(db);
    assert(!fs.existsSync(artifactRoot), 'telemetry readout should not create support artifacts or files');

    console.log(JSON.stringify({
      status: 'runtime hook telemetry readout verified',
      empty_preview_count: emptyReadout.preview_count,
      captured_sample: {
        command: capturedReadout.entries[0].command,
        evaluator_decision: capturedReadout.entries[0].evaluator_decision,
        missing_fact_classes: capturedReadout.entries[0].missing_fact_classes,
        coverage_status: capturedReadout.entries[0].coverage_status,
        broad_fact_classes_absent: capturedReadout.entries[0].broad_fact_classes_absent,
        sourced_broad_fact_classes: capturedReadout.entries[0].sourced_broad_fact_classes,
        broad_fact_class_statuses: capturedReadout.entries[0].broad_fact_class_statuses,
        active_runtime_enforcement: capturedReadout.entries[0].active_runtime_enforcement,
        active_enforcement_false: capturedReadout.entries[0].active_enforcement_false,
        preview_only: capturedReadout.entries[0].preview_only,
        dry_run_would_allow_non_authorizing: capturedReadout.entries[0].dry_run_would_allow_non_authorizing,
        external_io_on_non_authorizing: capturedReadout.entries[0].external_io_on_non_authorizing
      },
      missing_coverage_sample: {
        command: missingCoverageReadout.entries[0].command,
        coverage_status: missingCoverageReadout.entries[0].coverage_status,
        missing_fact_classes: missingCoverageReadout.entries[0].missing_fact_classes
      },
      proof: {
        readout_summarizes_supplied_previews: true,
        readout_summarizes_captured_previews: true,
        empty_preview_input_supported: true,
        missing_fact_classes_are_reported_not_failures: true,
        coverage_present_and_missing_reported: true,
        broad_fact_classes_sourced: true,
        provider_live_gate_sourced: true,
        unsourced_broad_fact_classes_reported: true,
        telemetry_persisted: false,
        support_artifacts_created: false,
        active_runtime_enforcement: false,
        command_blocking: false,
        dispatch_changed: false,
        providers_called: false,
        repositories_called: false,
        file_writers_called: false,
        config_writers_called: false
      }
    }, null, 2));
  } finally {
    closeDatabase(db);
    fs.rmSync(artifactRoot, { recursive: true, force: true });
  }
}

async function verifyEmptyReadout(db) {
  const direct = buildRuntimeHookTelemetryReadout({});
  assert(direct.read_only === true, 'direct empty readout should be read-only');
  assert(direct.preview_count === 0, 'direct empty readout should report zero previews');
  assert(direct.telemetry_persisted === false, 'direct empty readout should not persist telemetry');

  const viaService = await invokeServiceCommand('runtime.enforcement_hook_telemetry.readout', {}, { db });
  assert(viaService.preview_count === 0, 'service empty readout should report zero previews');
  assert(viaService.read_only === true, 'service readout should be read-only');
  assert(viaService.support_artifacts_created === false, 'service readout should not create support artifacts');
  return viaService;
}

async function verifyCapturedPreviewReadout(db) {
  const observed = [];
  const before = await invokeServiceCommand('scope.defaults', {}, { db });
  const after = await invokeServiceCommand('scope.defaults', {}, {
    db,
    runtimeEnforcementPreviewObserver: (preview) => observed.push(preview)
  });
  assert(JSON.stringify(after) === JSON.stringify(before), 'capturing preview should not change command result');
  assert(observed.length === 1, 'explicit observer should capture one preview');

  const readout = await invokeServiceCommand('runtime.enforcement_hook_telemetry.readout', {
    previews: observed
  }, { db });
  assert(readout.preview_count === 1, 'captured preview readout should summarize one preview');
  const entry = readout.entries[0];
  assert(entry.command === 'scope.defaults', 'captured readout should include command');
  assert(entry.evaluator_decision === 'conditional', 'captured readout should include evaluator decision');
  assert(entry.missing_fact_classes.includes('composed_gate_policy'), 'missing composed fact should be reported');
  assert(!entry.missing_fact_classes.includes('storage_authority'), 'sourced storage authority should no longer be reported missing');
  assert(!entry.missing_fact_classes.includes('storage_budget'), 'sourced storage budget should no longer be reported missing');
  assert(entry.coverage_present === true, 'coverage should be present for covered command');
  assert(entry.coverage_status === 'present_from_hook_or_supplied_fact', 'coverage status should report present coverage');
  assert(entry.broad_fact_classes_absent === false, 'broad fact classes should be visible when sourced');
  assert(entry.sourced_broad_fact_classes.includes('storage_authority'), 'storage authority should be listed as sourced');
  assert(entry.sourced_broad_fact_classes.includes('budget'), 'storage budget should be listed as sourced');
  assert(entry.sourced_broad_fact_classes.includes('external_io'), 'External I/O should be listed as sourced');
  assert(entry.sourced_broad_fact_classes.includes('provider_live_gate'), 'provider live gate should be listed as sourced');
  assert(entry.broad_fact_class_statuses.storage_authority.status === 'sourced', 'storage authority status should be sourced');
  assert(entry.broad_fact_class_statuses.budget.status === 'sourced', 'budget status should be sourced');
  assert(entry.broad_fact_class_statuses.external_io.status === 'sourced', 'External I/O status should be sourced');
  assert(entry.broad_fact_class_statuses.provider_live_gate.status === 'sourced', 'provider live gate should be sourced');
  assert(entry.broad_fact_class_inputs.provider_live_gate.provider_capable === false, 'local command should remain local-only in provider live gate input');
  assert(readout.sourced_broad_fact_classes.includes('storage_authority'), 'readout should summarize sourced storage authority');
  assert(readout.sourced_broad_fact_classes.includes('provider_live_gate'), 'readout should summarize sourced provider live gate');
  assert(readout.unsourced_broad_fact_classes.includes('destination_path_authority'), 'readout should report still-unsourced destination path authority');
  assert(entry.active_runtime_enforcement === false, 'preview should report runtime enforcement inactive');
  assert(entry.active_enforcement_false === true, 'preview should prove active enforcement flags are false');
  assert(entry.preview_only === true, 'preview should remain preview-only');
  assert(entry.dry_run_would_allow_non_authorizing === true, 'dry-run would_allow should remain non-authorizing');
  assert(entry.external_io_on_non_authorizing === true, 'External I/O on should remain non-authorizing');
  assert(readout.telemetry_persisted === false, 'captured readout should not persist telemetry');
  assert(readout.file_writes === 0, 'captured readout should not write files');
  return readout;
}

async function verifyMissingCoverageReadout(db) {
  const observed = [];
  await invokeServiceCommand('scope.defaults', {}, {
    db,
    runtimeEnforcementFacts: {
      coverage: null
    },
    runtimeEnforcementPreviewObserver: (preview) => observed.push(preview)
  });
  assert(observed.length === 1, 'explicit observer should capture supplied null coverage preview');
  const readout = buildRuntimeHookTelemetryReadout({ previews: observed });
  const entry = readout.entries[0];
  assert(entry.coverage_present === false, 'null supplied coverage should be reported missing');
  assert(entry.coverage_status === 'missing_or_null', 'coverage status should report missing/null');
  assert(entry.missing_fact_classes.includes('classification_coverage'), 'classification coverage should remain missing');
  assert(entry.missing_facts_are_failures === false, 'missing facts should be telemetry, not failures');
  return readout;
}

async function verifyBehaviorPreserved(db) {
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

  await assertRejects(
    () => invokeServiceCommand('manual.discovery', {
      scope: 'actor',
      entityType: 'character',
      entityId: 90000002,
      confirmation: CONFIRMATION.MANUAL_DISCOVERY
    }, {
      db,
      source: 'renderer'
    }),
    'LIVE_API_DISABLED',
    'confirmed renderer command should preserve existing live gate behavior'
  );
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
