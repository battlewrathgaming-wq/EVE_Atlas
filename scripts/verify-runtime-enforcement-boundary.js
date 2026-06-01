const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const previous = captureEnv();
  const root = path.join(projectRoot(), '.tmp', 'runtime-enforcement-boundary-should-not-exist');
  fs.rmSync(root, { recursive: true, force: true });
  process.env.AURA_ATLAS_TEST_TMP = root;
  process.env.AURA_ATLAS_CACHE_DIR = path.join(root, 'cache');
  process.env.AURA_ATLAS_SDE_CACHE_DIR = path.join(root, 'sde');
  delete process.env.AURA_ATLAS_LIVE_API;

  const db = openDatabase(':memory:');
  migrate(db);

  try {
    const beforeRootExists = fs.existsSync(root);
    const beforeCounts = tableCounts(db);
    const preview = await invokeServiceCommand('runtime.enforcement_boundary.preview', {
      storageAuthority: { mode: 'selected_storage', budget_bytes: 1 },
      storageBudgetBytes: 1,
      externalIoState: 'on',
      outputDir: 'C:\\renderer-forged-output'
    }, {
      db,
      databasePath: path.join(root, 'candidate-atlas.sqlite'),
      source: 'renderer'
    });
    const afterCounts = tableCounts(db);
    const afterRootExists = fs.existsSync(root);

    verifyReadOnlyBoundary(preview);
    verifyNoSideEffects({ beforeRootExists, afterRootExists, beforeCounts, afterCounts });
    verifyInsertionPoint(preview);
    verifyRepresentativeEnvelopes(preview);
    verifySemantics(preview);
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'runtime enforcement boundary preview verified',
      command: preview.action,
      insertion_point: preview.insertion_point,
      summary: preview.summary,
      sample_provider_expansion: compactEnvelope(envelope(preview, 'esi_evidence_expansion')),
      sample_snapshot: compactEnvelope(envelope(preview, 'runtime_snapshot_creation')),
      sample_unknown: compactEnvelope(envelope(preview, 'unknown_unclassified_future_command')),
      semantics: preview.semantics,
      proof: preview.proof,
      boundary: preview.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
    restoreEnv(previous);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'runtime.enforcement_boundary.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should declare read-only');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.runtime_enforcement_active === false, 'preview should not activate runtime enforcement');
  assert(preview.command_blocking_active === false, 'preview should not activate command blocking');
  assert(preview.runtime_interception_active === false, 'preview should not activate interception');
  assert(preview.handler_dispatches === 0, 'preview should not dispatch handlers');
  assert(preview.task_executions === 0, 'preview should not execute tasks');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.zkill_calls === 0, 'preview should not call zKill');
  assert(preview.esi_calls === 0, 'preview should not call ESI');
  assert(preview.sde_download_calls === 0, 'preview should not download SDE');
  assert(preview.file_writes === 0, 'preview should not write files');
  assert(preview.directory_creations === 0, 'preview should not create directories');
  assert(preview.db_mutations === 0, 'preview should not mutate DB');
  assert(preview.schema_changes === 0, 'preview should not change schema');
  assert(preview.evidence_writes === 0, 'preview should not write Evidence/EVEidence');
  assert(preview.discovery_mutations === 0, 'preview should not mutate Discovery refs');
  assert(preview.hydration_writes === 0, 'preview should not write Hydration output');
  assert(preview.storage_config_writes === 0, 'preview should not write storage config');
  assert(preview.support_artifact_creations === 0, 'preview should not create support artifacts');
}

function verifyNoSideEffects({ beforeRootExists, afterRootExists, beforeCounts, afterCounts }) {
  assert(beforeRootExists === false, 'fixture temp root should start missing');
  assert(afterRootExists === false, 'preview must not create the fixture temp root');
  assertSame(afterCounts, beforeCounts, 'preview should not mutate DB table counts');
}

function verifyInsertionPoint(preview) {
  assert(preview.insertion_point.proposed_function === 'invokeServiceCommand(command, payload, context)', 'insertion point should name invokeServiceCommand');
  assert(preview.insertion_point.runs_after_renderer_eligibility === true, 'boundary should run after renderer eligibility');
  assert(preview.insertion_point.runs_after_confirmation_authority === true, 'boundary should run after confirmation authority');
  assert(preview.insertion_point.runs_before_task_wrapping === true, 'boundary should run before task wrapping');
  assert(preview.insertion_point.runs_before_handler_dispatch === true, 'boundary should run before handler dispatch');
  assert(preview.insertion_point.active_now === false, 'insertion point should be inactive');
}

function verifyRepresentativeEnvelopes(preview) {
  const expected = [
    'safe_local_read_report_preflight',
    'trusted_config_readback',
    'trusted_config_write',
    'provider_backed_discovery',
    'esi_evidence_expansion',
    'hydration_write',
    'watch_execution_scheduled_provider',
    'runtime_snapshot_creation',
    'trace_pack_creation',
    'task_cancellation_runtime_control',
    'fixture_only_proof_command',
    'unknown_unclassified_future_command'
  ];
  assert(preview.summary.total_envelopes === expected.length, 'preview should include all representative envelopes');
  for (const id of expected) {
    envelope(preview, id);
  }

  assert(envelope(preview, 'safe_local_read_report_preflight').command_eligibility.state === 'eligible_for_boundary_preview', 'local read should be eligible');
  assert(envelope(preview, 'trusted_config_readback').command_eligibility.state === 'eligible_for_boundary_preview', 'config readback should be eligible');
  assert(envelope(preview, 'trusted_config_write').trusted_context_requirement.required === true, 'config write should require trusted context');
  assert(envelope(preview, 'trusted_config_write').command_eligibility.reason === 'trusted_or_internal_context', 'config write should be trusted/internal');
  assert(envelope(preview, 'provider_backed_discovery').provider_live_gate.provider_capable === true, 'manual discovery should be provider-capable');
  assert(envelope(preview, 'esi_evidence_expansion').external_io_posture.dependency === 'esi_provider_required', 'ESI expansion should declare ESI dependency');
  assert(envelope(preview, 'hydration_write').external_io_posture.dependency === 'esi_provider_required', 'Hydration write should declare ESI dependency');
  assert(envelope(preview, 'watch_execution_scheduled_provider').command_eligibility.reason === 'trusted_or_internal_context', 'watch executor tick should be trusted/internal');
  assert(envelope(preview, 'watch_execution_scheduled_provider').provider_live_gate.provider_capable === true, 'watch execution should be provider-capable');
  assert(envelope(preview, 'runtime_snapshot_creation').destination_path_authority.applies === true, 'snapshot should expose destination path authority');
  assert(envelope(preview, 'trace_pack_creation').destination_path_authority.applies === true, 'trace pack should expose destination path authority');
  assert(envelope(preview, 'task_cancellation_runtime_control').confirmation_state.required === true, 'task cancellation should preserve confirmation state');
  assert(envelope(preview, 'fixture_only_proof_command').trusted_context_requirement.fixture_only_non_production === true, 'fixture proof should remain fixture-only');
  assert(envelope(preview, 'unknown_unclassified_future_command').command_eligibility.state === 'unknown_command', 'unknown command should be unknown');
  assert(envelope(preview, 'unknown_unclassified_future_command').composed_decision.state === 'block', 'unknown command should be fail-closed intent');

  for (const entry of preview.envelopes) {
    assert(entry.composed_decision.active === false, `${entry.id} composed decision should be inactive`);
    assert(entry.composed_decision.preview_only === true, `${entry.id} composed decision should be preview-only`);
    assert(entry.handler_dispatch.called === false, `${entry.id} should not dispatch handler`);
    assert(entry.handler_dispatch.task_wrapped === false, `${entry.id} should not wrap task`);
  }
}

function verifySemantics(preview) {
  assert(preview.semantics.would_allow_is_authorization === false, 'would_allow should not be authorization');
  assert(preview.semantics.external_io_on_is_authorization === false, 'External I/O on should not be authorization');
  assert(preview.semantics.unknown_unclassified_fail_closed_active === false, 'unknown fail-closed should be inactive');
  assert(preview.proof.target_handlers_called === false, 'preview should prove target handlers are not called');
  assert(preview.proof.command_blocking_created === false, 'preview should not create command blocking');
  assert(preview.proof.runtime_interception_created === false, 'preview should not create interception');
  assert(preview.proof.task_wrapping_invoked === false, 'preview should not wrap tasks');
  assert(preview.proof.provider_movement_created === false, 'preview should not move provider work');
}

function verifyCommandRegistration() {
  const command = listServiceCommands().find((entry) => entry.command === 'runtime.enforcement_boundary.preview');
  assert(command, 'runtime enforcement boundary command should be registered');
  assert(command.classification === 'read-only', 'runtime enforcement boundary command should be read-only');
  assert(command.effects.includes('read-only'), 'runtime enforcement boundary command should declare read-only effect');
  assert(command.renderer_allowed === true, 'runtime enforcement boundary command should be renderer eligible as a safe readout');
}

function compactEnvelope(entry) {
  return {
    command: entry.command,
    source: entry.source,
    boundary_reached: entry.proposed_boundary_reached_in_this_envelope,
    eligibility: entry.command_eligibility.state,
    confirmation: entry.confirmation_state.state,
    storage: entry.storage_authority.gate_state,
    budget: entry.budget_posture.state,
    external_io: entry.external_io_posture.gate_state,
    live_gate: entry.provider_live_gate.state,
    destination: entry.destination_path_authority.state,
    trusted_context: entry.trusted_context_requirement.state,
    composed: entry.composed_decision.state,
    active: entry.composed_decision.active
  };
}

function envelope(preview, id) {
  const entry = preview.envelopes.find((candidate) => candidate.id === id);
  assert(entry, `missing representative envelope ${id}`);
  return entry;
}

function tableCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    metadata_runs: count(db, 'metadata_runs'),
    assessment_artifacts: count(db, 'assessment_artifacts'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches'),
    entities: count(db, 'entities')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function captureEnv() {
  return {
    AURA_ATLAS_TEST_TMP: process.env.AURA_ATLAS_TEST_TMP,
    AURA_ATLAS_CACHE_DIR: process.env.AURA_ATLAS_CACHE_DIR,
    AURA_ATLAS_SDE_CACHE_DIR: process.env.AURA_ATLAS_SDE_CACHE_DIR,
    AURA_ATLAS_LIVE_API: process.env.AURA_ATLAS_LIVE_API
  };
}

function restoreEnv(previous) {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nBefore: ${JSON.stringify(expected)}\nAfter: ${JSON.stringify(actual)}`);
  }
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
