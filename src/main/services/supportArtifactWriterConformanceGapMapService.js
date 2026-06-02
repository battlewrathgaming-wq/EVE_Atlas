const { buildSupportArtifactContentsContractPreview } = require('./supportArtifactContentsContractService');

const WRITER_SHAPES = Object.freeze([
  {
    artifact_class: 'runtime_snapshot_rolling',
    writer_source_file: 'src/main/services/runtimeSnapshotService.js',
    writer_or_source_posture: 'runtime.db_snapshot.create uses VACUUM INTO to copy the local SQLite runtime DB and returns snapshot metadata.',
    command: 'runtime.db_snapshot.create',
    current_fields: [
      'action',
      'status',
      'created_at',
      'database_path',
      'snapshot_path',
      'snapshot',
      'storage',
      'table_counts',
      'latest_fetch_run',
      'latest_evidence_timestamp',
      'assessment_artifacts',
      'boundary'
    ],
    checks: [
      check('db_copy_support_only', 'snapshots may include copied DB contents only as support/recovery material', 'conforms', 'low',
        'Writer copies the file-backed SQLite runtime DB and does not issue provider calls.',
        'Keep this as DB-copy support; future manifest should continue to label the copy as support/recovery, not new Evidence/EVEidence.'),
      check('sensitivity_manifest_disclosure', 'snapshot metadata should disclose high sensitivity and corpus-adjacent support posture', 'conforms', 'low',
        'Returned metadata now includes support_artifact_disclosure with privacy_sensitivity=high and artifact_family=corpus_adjacent_support.',
        'Keep support_artifact_disclosure in both preflight and create results.'),
      check('non_authority_disclosure', 'snapshot metadata should state the artifact is not Evidence/EVEidence, Observation, Assessment Memory, or pruning/deletion authority', 'conforms', 'low',
        'support_artifact_disclosure.non_authority explicitly marks snapshot artifacts as not Evidence/EVEidence, Discovery, Observation, Assessment Memory, product truth, deletion/pruning authority, or cleanup authority.',
        'Keep the non-authority block aligned with the support artifact contents contract.'),
      check('cleanup_deletion_review_disclosure', 'snapshot metadata should disclose cleanup/deletion review responsibilities', 'conforms', 'low',
        'support_artifact_disclosure.retained_snapshot_posture discloses cleanup_deletion_review_required and automatic_cleanup posture.',
        'Future cleanup tooling should consume this as disclosure only, not authority.'),
      check('raw_esi_payload_posture', 'raw ESI payloads may appear only as existing DB-copy content', 'conforms', 'low',
        'support_artifact_disclosure.db_copy_content_posture.raw_esi_payloads is included_as_existing_db_copy_only.',
        'Keep snapshot disclosure explicit that DB-copy payloads are existing content only.'),
      check('local_path_sensitivity', 'local paths may be included with sensitivity disclosure', 'conforms', 'low',
        'support_artifact_disclosure.local_path_sensitivity labels database_path, snapshot_path, and destination_directory as sensitive support metadata.',
        'Keep local path sensitivity labels when adding any future manifest/export surface.')
    ]
  },
  {
    artifact_class: 'runtime_snapshot_retained',
    writer_source_file: 'src/main/services/runtimeSnapshotService.js',
    writer_or_source_posture: 'Same runtime.db_snapshot.create writer; retained/manual posture is destination/settings driven rather than a separate writer.',
    command: 'runtime.db_snapshot.create',
    current_fields: [
      'database_path',
      'snapshot_path',
      'storage',
      'table_counts',
      'latest_fetch_run',
      'latest_evidence_timestamp',
      'assessment_artifacts',
      'boundary'
    ],
    checks: [
      check('class_id_split', 'retained/manual snapshot should be distinguishable from rolling snapshot when retention posture matters', 'conforms', 'low',
        'support_artifact_disclosure.artifact_class distinguishes configured/explicit retained snapshots from fallback generated rolling snapshots.',
        'Keep class inference limited to backend-known destination source.'),
      check('retained_cleanup_disclosure', 'retained path must be disclosed for future cleanup/deletion review', 'conforms', 'low',
        'support_artifact_disclosure.retained_snapshot_posture discloses may_outlive_active_records and cleanup_deletion_review_required.',
        'Future deletion review should treat this as disclosure, not cleanup authority.'),
      check('non_authority_disclosure', 'retained snapshots must not override deletion/pruning policy', 'conforms', 'low',
        'support_artifact_disclosure.non_authority.deletion_or_pruning_authority is false for retained snapshots.',
        'Keep retained snapshot copies subordinate to future deletion/pruning policy.')
    ]
  },
  {
    artifact_class: 'operator_debug_trace_pack',
    writer_source_file: 'src/main/support/operatorDebugTracePack.js',
    writer_or_source_posture: 'buildOperatorDebugTracePack composes bounded local summaries; writeOperatorDebugTracePack writes that JSON pack.',
    command: 'support.debug_trace_pack',
    current_fields: [
      'trace_pack_type',
      'generated_at',
      'classification',
      'boundaries',
      'exclusions',
      'runtime',
      'runtime_boundary',
      'readiness',
      'corpus_health',
      'fetch_runs',
      'api_request_logs',
      'task_history',
      'data_quality_warnings',
      'queue_status',
      'smoke_artifacts'
    ],
    checks: [
      check('raw_esi_payload_dumps_forbidden', 'trace packs must not dump raw ESI payload objects or full provider payload strings', 'conforms', 'low',
        'Boundaries and exclusions explicitly exclude raw_esi_payload, full participant payloads, and full API response bodies.',
        'Keep verifier coverage for raw_esi_payload object/string absence.'),
      check('free_text_length_policy', 'trace-pack free text should be bounded/truncated or summarized', 'conforms', 'low',
        'HS188 redacts secret-like strings and truncates fetch error_summary, API error_message, task scope_key/error.message, data-quality warning message, queue last_error, and local path strings in the trace-pack writer.',
        'Keep verifier coverage for secret redaction and max-length posture when adding new trace-pack fields.'),
      check('sample_limit_disclosure', 'trace pack should disclose sample limits and exclusions', 'conforms', 'low',
        'The emitted trace_pack_disclosure includes policy source, sample_limit, omitted/excluded material posture, and smoke artifact omitted_count where available.',
        'Keep omitted/excluded material disclosure aligned with support.trace_log_redaction_policy.preview.'),
      check('local_path_sensitivity', 'local paths may be included only with sensitivity disclosure', 'conforms', 'low',
        'runtime.database_path, runtime.temp_root, smoke root, and smoke artifact file paths are emitted as local path summary objects with sensitive support metadata labels.',
        'Keep local path emission as role/basename/value posture rather than treating renderer path claims as authority.'),
      check('provider_endpoint_secret_leakage', 'provider endpoint/error diagnostics must avoid secrets and full payloads', 'conforms', 'low',
        'api_request_logs endpoint query values are stripped in the trace pack and API error_message is secret-redacted and truncated at trace-pack assembly.',
        'This does not harden persisted API logs or light-log exports; keep that as a separate light-log seam.'),
      check('queue_latest_refs_bounded_summary', 'queue latest refs should remain bounded support summary, not Discovery truth export', 'conforms', 'low',
        'latest_refs remain limited and now include sample_posture plus redacted/truncated last_error values.',
        'Keep queue latest refs as bounded support provenance only, not Evidence/EVEidence or Discovery truth export.')
    ]
  },
  {
    artifact_class: 'readiness_preflight_export',
    writer_source_file: 'src/main/services/appReadinessService.js',
    writer_or_source_posture: 'app.readiness builds local posture/readiness output; no dedicated readiness/preflight export writer exists.',
    command: 'app.readiness',
    aliases: ['readiness_preflight_reports'],
    current_fields: [
      'status',
      'generated_at',
      'app',
      'live_api',
      'paths',
      'path_state',
      'checks',
      'lookup_counts',
      'runtime_boundary',
      'sde',
      'blockers',
      'warnings'
    ],
    checks: [
      check('writer_surface_exists', 'readiness/preflight export posture should be mapped even without a write-capable surface', 'partial', 'low',
        'There is a read-only readiness output but no dedicated export writer in current service registry.',
        'If a future export writer is added, bind it to readiness_preflight_export contract before writing files.'),
      check('class_id_alias_normalization', 'readiness_preflight_export versus readiness_preflight_reports should be normalized', 'gap', 'low',
        'The contract uses readiness_preflight_export; existing language may refer to readiness/readiness reports and has no emitted alias list.',
        'Add class-id alias normalization when export/report surfaces become writer-capable.'),
      check('raw_payload_forbidden', 'readiness/preflight exports must avoid raw ESI payloads and Evidence/EVEidence row dumps', 'conforms', 'low',
        'Readiness reports local posture, counts, checks, warnings, runtime boundary, and SDE summaries, not raw provider payloads.',
        'Keep readiness export limited to posture/counts if a writer is introduced.'),
      check('local_path_sensitivity', 'readiness/preflight local paths should include sensitivity posture', 'partial', 'medium',
        'paths and path_state include local path values; sensitivity is implicit rather than field-level.',
        'Add local path sensitivity disclosure before adding export packaging.')
    ]
  },
  {
    artifact_class: 'light_operational_logs',
    writer_source_file: 'src/main/db/evidenceRepository.js and src/main/api/httpClient.js',
    writer_or_source_posture: 'Operational/API request log rows are persisted during provider-capable work; no separate light-log export writer exists.',
    command: null,
    current_fields: [
      'api_request_logs.provider',
      'api_request_logs.endpoint',
      'api_request_logs.method',
      'api_request_logs.status_code',
      'api_request_logs.duration_ms',
      'api_request_logs.cache_status',
      'api_request_logs.retry_count',
      'api_request_logs.rate_limited',
      'api_request_logs.error_message',
      'api_request_logs.requested_at'
    ],
    checks: [
      check('writer_surface_exists', 'light operational logs should be mapped without creating a new export surface', 'partial', 'low',
        'Atlas has operational/API log rows but no dedicated light-log support artifact writer.',
        'Keep future log export separate from provider movement and support-artifact authority.'),
      check('raw_payload_forbidden', 'logs must not contain raw provider or raw ESI payloads', 'conforms', 'low',
        'API request log schema stores endpoint/status/timing/error posture, not response bodies or raw ESI payload columns.',
        'Maintain response-body exclusion if log export is introduced.'),
      check('secret_redaction_policy', 'logs must avoid secrets or auth tokens', 'unknown', 'high',
        'Current map does not prove every endpoint/error_message is secret-redacted before persistence.',
        'Add centralized endpoint/error redaction proof before treating logs as support artifact output.'),
      check('free_text_length_policy', 'log free text should be truncated or bounded', 'unknown', 'medium',
        'error_message persistence/export length policy is not expressed in the support artifact contract surface.',
        'Add max-length/truncation policy for exported log messages.')
    ]
  }
]);

function buildSupportArtifactWriterConformanceGapMapPreview() {
  const contract = buildSupportArtifactContentsContractPreview();
  const contractById = new Map(contract.classes.map((entry) => [entry.id, entry]));
  const mapped = WRITER_SHAPES.map((shape) => mapWriterShape(shape, contractById.get(shape.artifact_class)));
  return {
    action: 'support.artifact_writer_conformance_gap_map.preview',
    classification: 'read-only support artifact writer conformance gap map',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    creates_support_artifacts: false,
    creates_snapshots: false,
    creates_trace_packs: false,
    creates_logs: false,
    creates_exports: false,
    creates_files: false,
    creates_directories: false,
    provider_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    sde_download_calls: 0,
    evidence_writes: 0,
    discovery_ref_mutations: 0,
    hydration_writes: 0,
    assessment_writes: 0,
    watch_mutations: 0,
    storage_config_writes: 0,
    schema_changes: false,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    writer_behavior_changed: false,
    renderer_payload_ignored: true,
    contract_source: contract.action,
    summary: summarize(mapped),
    classes: mapped,
    hs180_focus_areas: hs180FocusAreas(mapped),
    boundary: [
      'Read-only writer conformance gap map only; it does not call or change support artifact writers.',
      'It does not create snapshots, trace packs, logs, exports, files, or directories.',
      'It does not inspect existing support artifact files or read packaged artifact contents.',
      'It does not call providers, mutate DB state, write storage config, change schema, activate runtime enforcement, or block commands.',
      'Gap statuses are support-hardening guidance, not Evidence/EVEidence, Discovery, Observation, Assessment Memory, product truth, or deletion/pruning authority.'
    ]
  };
}

function mapWriterShape(shape, contract) {
  const checks = shape.checks.map((entry) => ({
    check_id: entry.key,
    artifact_class: shape.artifact_class,
    writer_source_file: shape.writer_source_file,
    contract_rule: entry.contract_rule,
    current_behavior_or_emitted_field_posture: entry.current_behavior,
    conformance_status: entry.status,
    risk_level: entry.risk_level,
    recommended_later_hardening: entry.recommended_later_hardening,
    exposure: entry.exposure,
    exposes_raw_provider_payloads: entry.exposure.raw_provider_payloads,
    exposes_full_esi_payloads: entry.exposure.full_esi_payloads,
    exposes_secrets: entry.exposure.secrets,
    exposes_local_paths: entry.exposure.local_paths,
    exposes_full_discovery_refs: entry.exposure.full_discovery_refs,
    exposes_evidence_export_posture: entry.exposure.evidence_export_posture,
    exposes_assessment_memory_narrative: entry.exposure.assessment_memory_narrative,
    exposes_deletion_or_pruning_authority: entry.exposure.deletion_or_pruning_authority
  }));
  return {
    artifact_class: shape.artifact_class,
    writer_source_file: shape.writer_source_file,
    writer_or_source_posture: shape.writer_or_source_posture,
    command: shape.command,
    aliases: shape.aliases || [],
    contract_present: Boolean(contract),
    contract_family: contract?.family || null,
    contract_privacy_sensitivity: contract?.privacy_sensitivity || null,
    current_fields: [...shape.current_fields],
    overall_status: overallStatus(checks),
    highest_risk_level: highestRisk(checks),
    checks
  };
}

function check(key, contractRule, status, riskLevel, currentBehavior, recommendedLaterHardening, exposure = {}) {
  return {
    key,
    contract_rule: contractRule,
    status,
    risk_level: riskLevel,
    current_behavior: currentBehavior,
    recommended_later_hardening: recommendedLaterHardening,
    exposure: {
      raw_provider_payloads: exposure.raw_provider_payloads || false,
      full_esi_payloads: exposure.full_esi_payloads || false,
      secrets: exposure.secrets || status === 'unknown' && key.includes('secret'),
      local_paths: exposure.local_paths || key.includes('local_path'),
      full_discovery_refs: exposure.full_discovery_refs || false,
      evidence_export_posture: exposure.evidence_export_posture || false,
      assessment_memory_narrative: exposure.assessment_memory_narrative || false,
      deletion_or_pruning_authority: exposure.deletion_or_pruning_authority || key.includes('deletion') || key.includes('non_authority')
    }
  };
}

function summarize(classes) {
  const checks = classes.flatMap((entry) => entry.checks);
  return {
    total_classes: classes.length,
    total_checks: checks.length,
    by_status: countBy(checks, 'conformance_status'),
    by_risk: countBy(checks, 'risk_level'),
    classes_with_gaps: classes
      .filter((entry) => entry.checks.some((checkEntry) => checkEntry.conformance_status === 'gap'))
      .map((entry) => entry.artifact_class),
    classes_with_unknowns: classes
      .filter((entry) => entry.checks.some((checkEntry) => checkEntry.conformance_status === 'unknown'))
      .map((entry) => entry.artifact_class),
    high_risk_checks: checks
      .filter((entry) => entry.risk_level === 'high')
      .map((entry) => `${entry.artifact_class}:${entry.contract_rule}`),
    writer_behavior_changed: false
  };
}

function hs180FocusAreas(classes) {
  const checks = classes.flatMap((entry) => entry.checks);
  return {
    trace_pack_free_text_max_length: statusFor(checks, 'operator_debug_trace_pack', 'free_text_length_policy'),
    local_path_sensitivity_disclosure: checks
      .filter((entry) => entry.contract_rule.includes('local paths'))
      .map(focusSummary),
    sample_limit_and_exclusions_disclosure: statusFor(checks, 'operator_debug_trace_pack', 'sample_limit_disclosure'),
    readiness_class_id_alias_normalization: statusFor(checks, 'readiness_preflight_export', 'class_id_alias_normalization'),
    snapshot_manifest_disclosure: checks
      .filter((entry) => entry.artifact_class.startsWith('runtime_snapshot') && ['sensitivity_manifest_disclosure', 'non_authority_disclosure', 'retained_cleanup_disclosure'].includes(entry.check_id))
      .map(focusSummary),
    provider_endpoint_error_secret_leakage: [
      statusFor(checks, 'operator_debug_trace_pack', 'provider_endpoint_secret_leakage'),
      statusFor(checks, 'light_operational_logs', 'secret_redaction_policy')
    ],
    queue_latest_refs_bounded_summary: statusFor(checks, 'operator_debug_trace_pack', 'queue_latest_refs_bounded_summary')
  };
}

function statusFor(checks, artifactClass, key) {
  const entry = checks.find((candidate) => candidate.artifact_class === artifactClass && candidate.check_id === key);
  if (!entry) {
    return {
      artifact_class: artifactClass,
      conformance_status: 'unknown',
      risk_level: 'medium',
      note: 'focus area not mapped'
    };
  }
  return focusSummary(entry);
}

function focusSummary(entry) {
  return {
    artifact_class: entry.artifact_class,
    conformance_status: entry.conformance_status,
    risk_level: entry.risk_level,
    recommended_later_hardening: entry.recommended_later_hardening
  };
}

function overallStatus(checks) {
  if (checks.some((entry) => entry.conformance_status === 'gap')) {
    return 'gap';
  }
  if (checks.some((entry) => entry.conformance_status === 'unknown')) {
    return 'unknown';
  }
  if (checks.some((entry) => entry.conformance_status === 'partial')) {
    return 'partial';
  }
  return 'conforms';
}

function highestRisk(checks) {
  const order = ['none', 'low', 'medium', 'high'];
  return checks.reduce((highest, entry) => (
    order.indexOf(entry.risk_level) > order.indexOf(highest) ? entry.risk_level : highest
  ), 'none');
}

function countBy(entries, key) {
  return entries.reduce((counts, entry) => {
    const value = entry[key] || 'unknown';
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

module.exports = {
  buildSupportArtifactWriterConformanceGapMapPreview
};
