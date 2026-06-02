const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildSupportArtifactWriterConformanceGapMapPreview } = require('../src/main/services/supportArtifactWriterConformanceGapMapService');
const { projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const root = path.join(projectRoot(), '.tmp', 'support-artifact-writer-gap-map-should-not-exist');
  fs.rmSync(root, { recursive: true, force: true });
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    const beforeRootExists = fs.existsSync(root);
    const beforeCounts = tableCounts(db);
    const preview = await invokeServiceCommand('support.artifact_writer_conformance_gap_map.preview', {
      outputDir: root,
      createArtifacts: true,
      writerBehavior: 'renderer-forged'
    }, {
      db,
      source: 'renderer'
    });
    const afterCounts = tableCounts(db);
    const afterRootExists = fs.existsSync(root);

    verifyReadOnlyBoundary(preview);
    verifyNoSideEffects({ beforeRootExists, afterRootExists, beforeCounts, afterCounts });
    verifyMappedClasses(preview);
    verifyKnownConcerns(preview);
    verifyDirectBuilder();
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'support artifact writer conformance gap map verified',
      command: preview.action,
      class_count: preview.summary.total_classes,
      check_count: preview.summary.total_checks,
      by_status: preview.summary.by_status,
      by_risk: preview.summary.by_risk,
      classes_with_gaps: preview.summary.classes_with_gaps,
      classes_with_unknowns: preview.summary.classes_with_unknowns,
      hs180_focus_areas: preview.hs180_focus_areas,
      boundary: preview.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'support.artifact_writer_conformance_gap_map.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should declare read-only');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.creates_support_artifacts === false, 'preview should not create support artifacts');
  assert(preview.creates_snapshots === false, 'preview should not create snapshots');
  assert(preview.creates_trace_packs === false, 'preview should not create trace packs');
  assert(preview.creates_logs === false, 'preview should not create logs');
  assert(preview.creates_exports === false, 'preview should not create exports');
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
  assert(preview.runtime_enforcement_active === false, 'preview should not activate enforcement');
  assert(preview.command_blocking_active === false, 'preview should not activate command blocking');
  assert(preview.writer_behavior_changed === false, 'preview should not change writer behavior');
  assert(preview.renderer_payload_ignored === true, 'renderer payload should be ignored');
}

function verifyNoSideEffects({ beforeRootExists, afterRootExists, beforeCounts, afterCounts }) {
  assert(beforeRootExists === false, 'fixture temp root should start missing');
  assert(afterRootExists === false, 'preview must not create fixture temp root');
  assertSame(afterCounts, beforeCounts, 'gap map preview should not mutate DB tables');
}

function verifyMappedClasses(preview) {
  for (const id of [
    'runtime_snapshot_rolling',
    'runtime_snapshot_retained',
    'operator_debug_trace_pack',
    'readiness_preflight_export',
    'light_operational_logs'
  ]) {
    const entry = classById(preview, id);
    assert(entry.contract_present === true, `${id} should map to contents contract`);
    assert(['conforms', 'gap', 'partial', 'unknown'].includes(entry.overall_status), `${id} should have a valid overall status`);
    assert(entry.checks.length > 0, `${id} should have checks`);
    for (const mappedCheck of entry.checks) {
      assert(['conforms', 'gap', 'partial', 'not_applicable', 'unknown'].includes(mappedCheck.conformance_status), `${id} check should have valid status`);
      assert(mappedCheck.contract_rule, `${id} check should name contract rule`);
      assert(mappedCheck.current_behavior_or_emitted_field_posture, `${id} check should describe current behavior`);
      assert(mappedCheck.recommended_later_hardening, `${id} check should recommend later hardening`);
      assert(typeof mappedCheck.exposes_full_esi_payloads === 'boolean', `${id} check should expose full ESI flag`);
      assert(typeof mappedCheck.exposes_secrets === 'boolean', `${id} check should expose secrets flag`);
      assert(typeof mappedCheck.exposes_deletion_or_pruning_authority === 'boolean', `${id} check should expose pruning authority flag`);
    }
  }

  assert(preview.summary.total_classes === 5, 'gap map should cover five classes');
  assert(preview.summary.by_status.gap >= 1, 'gap map should expose remaining known gaps');
  assert(preview.summary.by_status.partial >= 2, 'gap map should expose remaining partial conformance');
  assert(!preview.summary.by_status.unknown, 'gap map should not leave HS192-proven persisted API log posture unknown');
}

function verifyKnownConcerns(preview) {
  const rolling = classById(preview, 'runtime_snapshot_rolling');
  const retained = classById(preview, 'runtime_snapshot_retained');
  const tracePack = classById(preview, 'operator_debug_trace_pack');
  const readiness = classById(preview, 'readiness_preflight_export');
  const logs = classById(preview, 'light_operational_logs');

  assert(checkById(rolling, 'sensitivity_manifest_disclosure').conformance_status === 'conforms', 'snapshot sensitivity manifest should conform after HS184');
  assert(checkById(rolling, 'raw_esi_payload_posture').conformance_status === 'conforms', 'snapshot raw ESI posture should conform after HS184');
  assert(checkById(retained, 'class_id_split').conformance_status === 'conforms', 'retained snapshot class split should conform after HS184');
  assert(checkById(retained, 'non_authority_disclosure').conformance_status === 'conforms', 'retained snapshot non-authority should conform after HS184');
  assert(checkById(tracePack, 'raw_esi_payload_dumps_forbidden').conformance_status === 'conforms', 'trace pack raw ESI dumps should conform');
  assert(checkById(tracePack, 'free_text_length_policy').conformance_status === 'conforms', 'trace pack free text length policy should conform after HS188');
  assert(checkById(tracePack, 'provider_endpoint_secret_leakage').conformance_status === 'conforms', 'trace pack provider endpoint secret posture should conform after HS188');
  assert(checkById(tracePack, 'queue_latest_refs_bounded_summary').conformance_status === 'conforms', 'queue latest refs should conform as bounded support summaries after HS188');
  assert(checkById(readiness, 'class_id_alias_normalization').conformance_status === 'gap', 'readiness alias normalization should be a gap');
  assert(checkById(logs, 'writer_surface_exists').conformance_status === 'partial', 'light operational log export writer should remain absent/partial');
  assert(checkById(logs, 'persisted_endpoint_error_sanitization').conformance_status === 'conforms', 'persisted API log row sanitization should conform after HS192');
  assert(checkById(logs, 'endpoint_query_value_redaction').conformance_status === 'conforms', 'persisted API log query value redaction should conform after HS192');
  assert(checkById(logs, 'secret_redaction_policy').conformance_status === 'conforms', 'persisted API log secret redaction should conform for tested patterns after HS192');
  assert(checkById(logs, 'free_text_length_policy').conformance_status === 'conforms', 'persisted API log free text bounds should conform after HS192');

  assert(preview.hs180_focus_areas.trace_pack_free_text_max_length.conformance_status === 'conforms', 'HS180 free-text focus should be mapped as conforming after HS188');
  assert(preview.hs180_focus_areas.readiness_class_id_alias_normalization.conformance_status === 'gap', 'HS180 readiness alias focus should be mapped');
  assert(preview.hs180_focus_areas.provider_endpoint_error_secret_leakage.every((entry) => entry.conformance_status === 'conforms'), 'HS180 provider/secret focus should reflect HS188 and HS192 conforming posture');
}

function verifyDirectBuilder() {
  const preview = buildSupportArtifactWriterConformanceGapMapPreview();
  assert(preview.summary.total_classes === 5, 'direct builder should return full map');
  assert(preview.creates_files === false, 'direct builder should not create files');
}

function verifyCommandRegistration() {
  const command = listServiceCommands().find((entry) => entry.command === 'support.artifact_writer_conformance_gap_map.preview');
  assert(command, 'support artifact writer conformance gap map command should be registered');
  assert(command.classification === 'read-only', 'gap map command should be read-only');
  assert(command.effects.includes('read-only'), 'gap map command should declare read-only effect');
  assert(command.renderer_allowed === true, 'gap map command should be renderer eligible');
}

function classById(preview, id) {
  const entry = preview.classes.find((candidate) => candidate.artifact_class === id);
  assert(entry, `missing artifact class ${id}`);
  return entry;
}

function checkById(entry, id) {
  const mappedCheck = entry.checks.find((candidate) => candidate.check_id === id);
  assert(mappedCheck, `missing check ${entry.artifact_class}:${id}`);
  return mappedCheck;
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
