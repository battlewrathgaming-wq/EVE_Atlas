const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const previous = captureEnv();
  const root = path.join(projectRoot(), '.tmp', 'composed-gate-policy-should-not-exist');
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
    const preview = await invokeServiceCommand('storage.composed_gate_policy.preview', {
      externalIoState: 'off',
      outputDir: 'C:\\renderer-forged-support-output',
      storageRoot: 'C:\\renderer-forged-storage'
    }, {
      db,
      databasePath: path.join(root, 'candidate-atlas.sqlite'),
      source: 'renderer'
    });
    const afterCounts = tableCounts(db);
    const afterRootExists = fs.existsSync(root);

    verifyReadOnlyBoundary(preview);
    verifyNoSideEffects({ beforeRootExists, afterRootExists, beforeCounts, afterCounts });
    verifyRepresentativeRows(preview);
    verifyComposedSemantics(preview);
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'composed gate policy preview verified',
      command: preview.action,
      total_rows: preview.summary.total_rows,
      by_composed_state: preview.summary.by_composed_state,
      provider_or_external_io_rows: preview.summary.provider_or_external_io_rows,
      fixture_only_rows: preview.summary.fixture_only_rows,
      unknown_fail_closed_rows: preview.summary.unknown_fail_closed_rows,
      dry_run_input_only_rows: preview.summary.dry_run_input_only_rows,
      authorization_semantics: preview.authorization_semantics,
      unknown_policy: preview.unknown_unclassified_policy_intent,
      boundary: preview.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
    restoreEnv(previous);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'storage.composed_gate_policy.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should declare read-only');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.filesystem_writes === 0, 'preview should not write files');
  assert(preview.db_mutations === 0, 'preview should not mutate DB state');
  assert(preview.schema_changes === 0, 'preview should not change schema');
  assert(preview.runtime_interception_active === false, 'preview should not activate runtime interception');
  assert(preview.command_blocking_active === false, 'preview should not activate command blocking');
  assert(preview.enforcement_active === false, 'preview should not activate enforcement');
  assert(preview.future_fail_closed_active === false, 'future fail-closed should be inactive');
}

function verifyNoSideEffects({ beforeRootExists, afterRootExists, beforeCounts, afterCounts }) {
  assert(beforeRootExists === false, 'fixture temp root should start missing');
  assert(afterRootExists === false, 'preview must not create the fixture temp root');
  assertSame(afterCounts, beforeCounts, 'preview should not mutate DB table counts');
}

function verifyRepresentativeRows(preview) {
  const expected = [
    'local_read_report_preflight',
    'assessment_local_metadata_write',
    'watch_local_metadata_write',
    'zkill_discovery',
    'esi_evidence_expansion',
    'hydration_write',
    'sde_local_import_rewrite',
    'sde_download_build',
    'runtime_snapshot_creation',
    'trace_pack_creation',
    'pruning_deletion_preflight',
    'pruning_deletion_execution',
    'runtime_control_task_cancel',
    'external_io_operator_config_write',
    'fixture_only_write_proof',
    'unknown_unclassified_future_command'
  ];
  assert(preview.summary.total_rows === expected.length, 'preview should include all representative rows');
  for (const id of expected) {
    row(preview, id);
  }

  assert(row(preview, 'local_read_report_preflight').gates.external_io.state === 'not_applicable', 'local read row should not require External I/O');
  assert(row(preview, 'assessment_local_metadata_write').gates.storage_authority.state !== 'not_applicable', 'assessment write should carry storage posture');
  assert(row(preview, 'watch_local_metadata_write').effects_classification_basis.storage_action_class === 'setup_config_changes', 'watch metadata row should expose broad setup class source');
  assert(row(preview, 'zkill_discovery').gates.external_io.state === 'hold', 'zKill discovery should be held when External I/O is off');
  assert(row(preview, 'esi_evidence_expansion').gates.external_io.state === 'hold', 'ESI expansion should be held when External I/O is off');
  assert(row(preview, 'hydration_write').gates.external_io.state === 'hold', 'hydration writes should be held when External I/O is off');
  assert(row(preview, 'sde_local_import_rewrite').effects_classification_basis.runtime_context === 'local_sde_import', 'local SDE import should be represented separately');
  assert(row(preview, 'sde_download_build').gates.external_io.state === 'hold', 'SDE download/build should be held when External I/O is off');
  assert(row(preview, 'runtime_snapshot_creation').gates.destination_path_authority.reason === 'snapshot_destination_authority_required', 'snapshot creation should require destination authority');
  assert(row(preview, 'trace_pack_creation').gates.destination_path_authority.reason === 'trace_pack_destination_authority_required', 'trace pack creation should require destination authority');
  assert(row(preview, 'pruning_deletion_preflight').effects_classification_basis.storage_action_class === 'pruning_deletion_preflight', 'retention preflight should have preflight class');
  assert(row(preview, 'pruning_deletion_execution').effects_classification_basis.storage_action_class === 'pruning_deletion_execution', 'retention action definitions should expose future deletion class');
  assert(row(preview, 'runtime_control_task_cancel').gates.confirmation_ux.reason === 'confirmation_ux_required_not_security_secret', 'task cancel should preserve confirmation UX posture');
  assert(row(preview, 'external_io_operator_config_write').effects_classification_basis.runtime_context === 'external_io_operator_config_write', 'External I/O operator config write should be represented separately');
  assert(row(preview, 'external_io_operator_config_write').gates.external_io.state === 'not_applicable', 'External I/O config writes should not require provider movement permission');
  assert(row(preview, 'fixture_only_write_proof').gates.trusted_context_fixture_exclusion.reason === 'fixture_only_non_production_trusted_context_required', 'fixture proof should remain trusted-context only');
  assert(row(preview, 'unknown_unclassified_future_command').composed_state === 'block', 'unknown future command should fail closed in policy intent');
}

function verifyComposedSemantics(preview) {
  assert(preview.authorization_semantics.answers_may_run_now === false, 'preview should not answer may-run-now');
  assert(preview.authorization_semantics.would_allow_is_authorization === false, 'would_allow should not be authorization');
  assert(preview.unknown_unclassified_policy_intent.future_posture === 'fail_closed', 'unknown policy should be fail-closed intent');
  assert(preview.unknown_unclassified_policy_intent.active_now === false, 'unknown fail-closed should not be active');
  assert(preview.summary.dry_run_input_only_rows.length > 0, 'preview should expose dry-run input rows');
  for (const candidate of preview.rows) {
    assert(candidate.would_allow_is_authorization === false, `${candidate.id} should not treat would_allow as authorization`);
    assert(candidate.enforcement_active === false, `${candidate.id} should keep enforcement inactive`);
    assert(candidate.runtime_authorization_active === false, `${candidate.id} should keep runtime authorization inactive`);
  }
  assert(preview.split_notes.some((entry) => entry.broad_class === 'setup_config_changes'), 'preview should mark setup_config_changes as broad');
  assert(preview.split_notes.some((entry) => entry.broad_class === 'background_hydration'), 'preview should mark background_hydration split');
  assert(preview.split_notes.some((entry) => entry.broad_class === 'snapshot_support_artifact_write'), 'preview should mark support artifact split');
}

function verifyCommandRegistration() {
  const command = listServiceCommands().find((entry) => entry.command === 'storage.composed_gate_policy.preview');
  assert(command, 'composed gate policy command should be registered');
  assert(command.classification === 'read-only', 'composed gate policy command should be read-only');
  assert(command.effects.includes('read-only'), 'composed gate policy command should declare read-only effect');
  assert(command.renderer_allowed === true, 'composed gate policy command should be renderer eligible as a safe readout');
}

function row(preview, id) {
  const entry = preview.rows.find((candidate) => candidate.id === id);
  assert(entry, `missing composed gate row ${id}`);
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
