const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildTraceLogRedactionPolicyPreview } = require('../src/main/services/traceLogRedactionPolicyService');
const { projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const root = path.join(projectRoot(), '.tmp', 'trace-log-redaction-policy-should-not-exist');
  fs.rmSync(root, { recursive: true, force: true });
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    const beforeRootExists = fs.existsSync(root);
    const beforeCounts = tableCounts(db);
    const preview = await invokeServiceCommand('support.trace_log_redaction_policy.preview', {
      outputDir: root,
      redactionPolicy: 'renderer-forged',
      maxLength: 999999
    }, {
      db,
      source: 'renderer'
    });
    const afterCounts = tableCounts(db);
    const afterRootExists = fs.existsSync(root);

    verifyReadOnlyBoundary(preview);
    verifyNoSideEffects({ beforeRootExists, afterRootExists, beforeCounts, afterCounts });
    verifyPolicyCoverage(preview);
    verifyPolicyRules(preview);
    verifyDirectBuilder();
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'support trace/log redaction policy verified',
      command: preview.action,
      policy_count: preview.summary.total_policies,
      by_family: preview.summary.by_family,
      by_sensitivity: preview.summary.by_sensitivity,
      by_enforcement_status: preview.summary.by_enforcement_status,
      raw_esi_forbidden: preview.summary.raw_esi_forbidden,
      local_path_sensitive: preview.summary.local_path_sensitive,
      max_length_rules: preview.summary.max_length_rules,
      boundary: preview.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'support.trace_log_redaction_policy.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should declare read-only');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.renderer_payload_ignored === true, 'renderer policy claims should be ignored');
  assert(preview.creates_support_artifacts === false, 'preview should not create support artifacts');
  assert(preview.creates_snapshots === false, 'preview should not create snapshots');
  assert(preview.creates_trace_packs === false, 'preview should not create trace packs');
  assert(preview.creates_logs === false, 'preview should not create logs');
  assert(preview.creates_exports === false, 'preview should not create exports');
  assert(preview.creates_files === false, 'preview should not create files');
  assert(preview.creates_directories === false, 'preview should not create directories');
  assert(preview.inspects_real_operator_artifacts === false, 'preview should not inspect real operator artifacts');
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
  assert(preview.external_io_config_writes === 0, 'preview should not write External I/O config');
  assert(preview.schema_changes === false, 'preview should not change schema');
  assert(preview.runtime_enforcement_active === false, 'preview should not activate enforcement');
  assert(preview.command_blocking_active === false, 'preview should not activate command blocking');
  assert(preview.writer_behavior_changed === false, 'preview should not change writers');
}

function verifyNoSideEffects({ beforeRootExists, afterRootExists, beforeCounts, afterCounts }) {
  assert(beforeRootExists === false, 'fixture temp root should start missing');
  assert(afterRootExists === false, 'preview must not create fixture temp root');
  assertSame(afterCounts, beforeCounts, 'trace/log policy preview should not mutate DB tables');
}

function verifyPolicyCoverage(preview) {
  for (const id of [
    'operator_debug_trace_pack',
    'light_operational_logs',
    'provider_endpoint_and_query_strings',
    'provider_and_runtime_error_text',
    'data_quality_warning_messages',
    'queue_latest_ref_samples',
    'local_filesystem_paths',
    'sample_limits_omissions_and_exclusions',
    'task_run_ids_and_provider_provenance'
  ]) {
    const entry = policyById(preview, id);
    assert(entry.policy_only === true, `${id} should be policy-only`);
    assert(entry.writer_enforced === false, `${id} should not claim writer enforcement`);
    assert(entry.allowed_summary_content.length > 0, `${id} should list allowed summary content`);
    assert(entry.forbidden_content.length > 0, `${id} should list forbidden content`);
    assert(entry.redaction_rule, `${id} should define redaction rule`);
    assert(entry.replacement_marker_or_disclosure_phrase, `${id} should define marker/disclosure phrase`);
    assert(entry.basis_provenance_requirement, `${id} should define basis/provenance`);
  }
  assert(preview.summary.total_policies === 9, 'preview should cover nine policy families');
  assert(preview.summary.by_enforcement_status.policy_only === 9, 'all policies should be policy-only');
}

function verifyPolicyRules(preview) {
  const trace = policyById(preview, 'operator_debug_trace_pack');
  const logs = policyById(preview, 'light_operational_logs');
  const endpoints = policyById(preview, 'provider_endpoint_and_query_strings');
  const errors = policyById(preview, 'provider_and_runtime_error_text');
  const queue = policyById(preview, 'queue_latest_ref_samples');
  const paths = policyById(preview, 'local_filesystem_paths');
  const samples = policyById(preview, 'sample_limits_omissions_and_exclusions');

  assert(trace.raw_esi_payloads === 'forbidden', 'trace policy should forbid raw ESI');
  assert(trace.evidence_rows === 'counts_and_summaries_only', 'trace policy should only allow Evidence summaries');
  assert(trace.assessment_memory === 'counts_or_anchor_summary_only', 'trace policy should not export Assessment Memory narrative');
  assert(logs.raw_esi_payloads === 'forbidden', 'log policy should forbid raw ESI');
  assert(logs.evidence_rows === 'forbidden', 'log policy should forbid Evidence rows');
  assert(endpoints.forbidden_content.includes('full signed URLs'), 'endpoint policy should forbid full signed URLs');
  assert(endpoints.redaction_rule.includes('Strip query values'), 'endpoint policy should strip query values');
  assert(errors.truncation_or_max_length_rule.max_length === 240, 'error text policy should have max length');
  assert(queue.discovery_refs_or_killmail_hashes === 'bounded_support_provenance_samples_only', 'queue refs should be bounded support provenance only');
  assert(queue.forbidden_content.includes('Discovery refs as truth/evidence'), 'queue policy should forbid Discovery refs as truth');
  assert(paths.local_paths === 'allowed_as_sensitive_support_metadata', 'local paths should be sensitive support metadata');
  assert(samples.allowed_summary_content.includes('omitted count when known'), 'sample policy should require omitted-count disclosure');

  assert(preview.global_rules.trace_log_support_artifacts_are_evidence === false, 'trace/log artifacts should not be Evidence');
  assert(preview.global_rules.trace_log_support_artifacts_are_discovery === false, 'trace/log artifacts should not be Discovery');
  assert(preview.global_rules.trace_log_support_artifacts_are_observation === false, 'trace/log artifacts should not be Observation');
  assert(preview.global_rules.trace_log_support_artifacts_are_assessment_memory === false, 'trace/log artifacts should not be Assessment Memory');
  assert(preview.global_rules.trace_log_support_artifacts_are_product_truth === false, 'trace/log artifacts should not be product truth');
  assert(preview.global_rules.trace_log_support_artifacts_are_deletion_or_pruning_authority === false, 'trace/log artifacts should not be deletion/pruning authority');
  assert(preview.global_rules.raw_esi_payloads_allowed_in_trace_logs === false, 'raw ESI should be globally forbidden');
  assert(preview.global_rules.secrets_or_tokens_allowed === false, 'secrets should be globally forbidden');
}

function verifyDirectBuilder() {
  const preview = buildTraceLogRedactionPolicyPreview();
  assert(preview.summary.total_policies === 9, 'direct builder should return full policy set');
  assert(preview.creates_files === false, 'direct builder should not create files');
}

function verifyCommandRegistration() {
  const command = listServiceCommands().find((entry) => entry.command === 'support.trace_log_redaction_policy.preview');
  assert(command, 'trace/log redaction policy command should be registered');
  assert(command.classification === 'read-only', 'trace/log redaction policy should be read-only');
  assert(command.effects.includes('read-only'), 'trace/log redaction policy should declare read-only effect');
  assert(command.renderer_allowed === true, 'trace/log redaction policy should be renderer eligible');
}

function policyById(preview, id) {
  const entry = preview.policies.find((candidate) => candidate.policy_id === id);
  assert(entry, `missing policy ${id}`);
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
