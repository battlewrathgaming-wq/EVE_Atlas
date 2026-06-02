const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildSupportArtifactContentsContractPreview } = require('../src/main/services/supportArtifactContentsContractService');
const { projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const root = path.join(projectRoot(), '.tmp', 'support-artifact-contents-contract-should-not-exist');
  fs.rmSync(root, { recursive: true, force: true });
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    const beforeRootExists = fs.existsSync(root);
    const beforeCounts = tableCounts(db);
    const preview = await invokeServiceCommand('support.artifact_contents_contract.preview', {
      outputDir: root,
      contentPolicy: 'renderer-forged'
    }, {
      db,
      source: 'renderer'
    });
    const afterCounts = tableCounts(db);
    const afterRootExists = fs.existsSync(root);

    verifyReadOnlyBoundary(preview);
    verifyNoSideEffects({ beforeRootExists, afterRootExists, beforeCounts, afterCounts });
    verifyClassContract(preview);
    verifyDirectBuilder();
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'support artifact contents contract verified',
      command: preview.action,
      class_count: preview.summary.total_classes,
      families: preview.summary.by_family,
      high_sensitivity: preview.summary.high_sensitivity,
      raw_esi_payloads_forbidden: preview.summary.raw_esi_payloads_forbidden,
      db_copy_classes: preview.summary.db_copy_classes,
      non_authoritative_classes: preview.summary.non_authoritative_classes,
      trace_pack_contract: classById(preview, 'operator_debug_trace_pack'),
      snapshot_contract: classById(preview, 'runtime_snapshot_retained'),
      boundary: preview.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'support.artifact_contents_contract.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should declare read-only');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.creates_support_artifacts === false, 'preview should not create support artifacts');
  assert(preview.creates_snapshots === false, 'preview should not create snapshots');
  assert(preview.creates_trace_packs === false, 'preview should not create trace packs');
  assert(preview.creates_logs === false, 'preview should not create logs');
  assert(preview.creates_files === false, 'preview should not create files');
  assert(preview.creates_directories === false, 'preview should not create directories');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.zkill_calls === 0, 'preview should not call zKill');
  assert(preview.esi_calls === 0, 'preview should not call ESI');
  assert(preview.sde_download_calls === 0, 'preview should not download SDE');
  assert(preview.evidence_writes === 0, 'preview should not write Evidence/EVEidence');
  assert(preview.discovery_ref_mutations === 0, 'preview should not mutate Discovery refs');
  assert(preview.hydration_writes === 0, 'preview should not write Hydration output');
  assert(preview.assessment_writes === 0, 'preview should not write Assessment Memory');
  assert(preview.watch_mutations === 0, 'preview should not mutate Watch state');
  assert(preview.storage_config_writes === 0, 'preview should not write storage config');
  assert(preview.schema_changes === false, 'preview should not change schema');
  assert(preview.runtime_enforcement_active === false, 'preview should not activate runtime enforcement');
  assert(preview.command_blocking_active === false, 'preview should not activate command blocking');
}

function verifyNoSideEffects({ beforeRootExists, afterRootExists, beforeCounts, afterCounts }) {
  assert(beforeRootExists === false, 'fixture temp root should start missing');
  assert(afterRootExists === false, 'preview must not create fixture temp root');
  assertSame(afterCounts, beforeCounts, 'contents contract preview should not mutate DB tables');
}

function verifyClassContract(preview) {
  assert(preview.summary.total_classes === 5, 'contract should cover five artifact classes');
  assert(preview.summary.by_family.operational_support === 2, 'contract should cover operational support classes');
  assert(preview.summary.by_family.corpus_adjacent_support === 3, 'contract should cover corpus-adjacent support classes');

  const rolling = classById(preview, 'runtime_snapshot_rolling');
  const retained = classById(preview, 'runtime_snapshot_retained');
  const tracePack = classById(preview, 'operator_debug_trace_pack');
  const logs = classById(preview, 'light_operational_logs');
  const readiness = classById(preview, 'readiness_preflight_export');

  for (const snapshot of [rolling, retained]) {
    assert(snapshot.family === 'corpus_adjacent_support', `${snapshot.id} should be corpus-adjacent`);
    assert(snapshot.privacy_sensitivity === 'high', `${snapshot.id} should be high sensitivity`);
    assert(snapshot.raw_esi_payloads === 'included_as_existing_db_copy_only', `${snapshot.id} may include raw ESI only as DB copy`);
    assert(snapshot.evidence_rows === 'included_as_existing_db_copy_only', `${snapshot.id} may include Evidence only as DB copy`);
    assert(snapshot.can_be_used_as_evidence === false, `${snapshot.id} should not be new Evidence/EVEidence`);
    assert(snapshot.can_be_used_as_deletion_or_pruning_authority === false, `${snapshot.id} should not override deletion/pruning`);
  }

  assert(tracePack.raw_esi_payloads === 'forbidden', 'trace packs must forbid raw ESI payload dumps');
  assert(tracePack.forbidden_content_categories.includes('raw ESI payload dumps'), 'trace pack forbidden content should name raw ESI payload dumps');
  assert(tracePack.forbidden_content_categories.includes('full provider response bodies'), 'trace pack should forbid full provider response bodies');
  assert(tracePack.evidence_rows === 'counts_and_summaries_only', 'trace pack Evidence posture should be summary only');
  assert(tracePack.discovery_refs === 'bounded_summary_only', 'trace pack Discovery refs should be bounded summary only');
  assert(tracePack.can_be_used_as_evidence === false, 'trace pack must not be Evidence/EVEidence');
  assert(tracePack.can_be_used_as_observation === false, 'trace pack must not be Observation');
  assert(tracePack.can_be_used_as_assessment_memory === false, 'trace pack must not be Assessment Memory');

  assert(logs.raw_esi_payloads === 'forbidden', 'logs should forbid raw ESI payloads');
  assert(logs.forbidden_content_categories.includes('secrets or auth tokens'), 'logs should forbid secrets');
  assert(readiness.raw_esi_payloads === 'forbidden', 'readiness/preflight exports should forbid raw ESI payloads');
  assert(readiness.evidence_rows === 'counts_and_posture_only', 'readiness/preflight should be counts/posture only');
  assert(readiness.canonical_artifact_class === 'readiness_preflight_export', 'readiness/preflight export should remain canonical');
  assert(readiness.aliases.includes('readiness_preflight_reports'), 'readiness/preflight reports should be disclosed as an alias');
  assert(readiness.alias_disclosure.includes('path-authority alias'), 'readiness/preflight alias disclosure should name path authority');

  assert(preview.global_rules.support_artifacts_are_evidence === false, 'support artifacts must not be Evidence/EVEidence');
  assert(preview.global_rules.support_artifacts_are_observation === false, 'support artifacts must not be Observation');
  assert(preview.global_rules.support_artifacts_are_assessment_memory === false, 'support artifacts must not be Assessment Memory');
  assert(preview.global_rules.support_artifacts_are_deletion_or_pruning_authority === false, 'support artifacts must not be deletion/pruning authority');
  assert(preview.global_rules.snapshots_can_contain_db_copy === true, 'snapshots should disclose DB copy capability');
  assert(preview.global_rules.snapshot_artifact_itself_is_new_evidence === false, 'snapshot artifact itself should not be new Evidence');
  assert(preview.global_rules.trace_packs_are_evidence_exports === false, 'trace packs should not be evidence exports');
  assert(preview.global_rules.trace_packs_forbid_raw_esi_payload_dumps === true, 'trace packs should forbid raw ESI payload dumps');
}

function verifyDirectBuilder() {
  const preview = buildSupportArtifactContentsContractPreview();
  assert(preview.summary.total_classes === 5, 'direct builder should return full contract');
  assert(preview.creates_files === false, 'direct builder should not create files');
}

function verifyCommandRegistration() {
  const command = listServiceCommands().find((entry) => entry.command === 'support.artifact_contents_contract.preview');
  assert(command, 'support artifact contents contract command should be registered');
  assert(command.classification === 'read-only', 'support artifact contents contract should be read-only');
  assert(command.effects.includes('read-only'), 'support artifact contents contract should declare read-only effect');
  assert(command.renderer_allowed === true, 'support artifact contents contract should be renderer eligible');
}

function classById(preview, id) {
  const entry = preview.classes.find((candidate) => candidate.id === id);
  assert(entry, `missing artifact class ${id}`);
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

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
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
