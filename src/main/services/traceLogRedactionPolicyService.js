const POLICY_FIELDS = Object.freeze([
  policy({
    id: 'operator_debug_trace_pack',
    family: 'trace_pack_support_artifact',
    sensitivity: 'high',
    allowed: [
      'bounded readiness summaries',
      'bounded corpus health counts',
      'bounded fetch run summaries',
      'bounded API request diagnostics without response bodies',
      'bounded Discovery queue counts and latest-ref support samples',
      'bounded warning summaries',
      'task history summaries',
      'runtime boundary status',
      'local path/status summaries with sensitivity labels'
    ],
    forbidden: [
      'raw ESI payload objects',
      'full provider response bodies',
      'full killmail participant payload strings',
      'tokens or secrets',
      'unbounded table dumps',
      'Evidence/EVEidence export packaging',
      'Discovery refs as product truth',
      'Assessment Memory narrative export'
    ],
    redaction: 'Trace pack writers should emit summary objects only; raw payload/body fields are omitted rather than masked.',
    truncation: { max_length: 240, applies_to: ['error_summary', 'error_message', 'warning.message', 'task.error.message'] },
    marker: '[omitted: support trace policy]',
    basis: 'generated time, local DB basis, sample limits, omitted-count disclosure, exclusions, and support/debug classification',
    rawEsi: 'forbidden',
    discovery: 'bounded_support_samples_only',
    evidence: 'counts_and_summaries_only',
    assessment: 'counts_or_anchor_summary_only',
    paths: 'allowed_as_sensitive_support_metadata',
    enforced: 'policy_only'
  }),
  policy({
    id: 'light_operational_logs',
    family: 'operational_support_log',
    sensitivity: 'medium',
    allowed: [
      'bounded command/runtime events',
      'provider name',
      'HTTP method and status code',
      'duration and retry counts',
      'rate-limit/cache posture',
      'non-secret error category',
      'bounded redacted error text'
    ],
    forbidden: [
      'raw provider payloads',
      'raw ESI payloads',
      'response bodies',
      'authorization headers',
      'tokens or secrets',
      'full Evidence/EVEidence rows',
      'full Discovery refs',
      'Assessment Memory narratives'
    ],
    redaction: 'Logs should store or export provider diagnostics with secrets removed and body/payload fields omitted.',
    truncation: { max_length: 180, applies_to: ['error_message', 'runtime exception strings'] },
    marker: '[redacted: operational log policy]',
    basis: 'log source, time window, provider/run provenance, and operational-support-only classification',
    rawEsi: 'forbidden',
    discovery: 'counts_or_ids_only_when_needed',
    evidence: 'forbidden',
    assessment: 'forbidden',
    paths: 'avoid_unless_needed_then_sensitive',
    enforced: 'policy_only'
  }),
  policy({
    id: 'provider_endpoint_and_query_strings',
    family: 'provider_diagnostics',
    sensitivity: 'high',
    allowed: [
      'provider name',
      'endpoint route template or host/path summary',
      'HTTP method',
      'non-secret query key names when useful',
      'status and timing posture'
    ],
    forbidden: [
      'access tokens',
      'authorization parameters',
      'bearer headers',
      'full signed URLs',
      'session identifiers',
      'unbounded query strings',
      'full response bodies'
    ],
    redaction: 'Strip query values by default; preserve route shape and disclose query_key_count when query parameters exist.',
    truncation: { max_length: 160, applies_to: ['endpoint path after query stripping'] },
    marker: '[redacted: provider endpoint]',
    basis: 'provider, method, redacted endpoint route, status, timing, cache/retry posture',
    rawEsi: 'forbidden',
    discovery: 'not_applicable',
    evidence: 'forbidden',
    assessment: 'forbidden',
    paths: 'not_applicable',
    enforced: 'policy_only'
  }),
  policy({
    id: 'provider_and_runtime_error_text',
    family: 'free_text_diagnostics',
    sensitivity: 'high',
    allowed: [
      'error code',
      'severity',
      'bounded redacted message',
      'provider/status context',
      'retry/rate-limit context'
    ],
    forbidden: [
      'raw provider response body',
      'full exception object dumps',
      'stack traces by default',
      'tokens or secrets',
      'local private file contents',
      'unbounded message strings'
    ],
    redaction: 'Remove token-like, authorization-like, cookie-like, and full URL credential material before display/export.',
    truncation: { max_length: 240, applies_to: ['provider error messages', 'runtime exception messages', 'task error messages'] },
    marker: '[truncated: diagnostic text]',
    basis: 'error code/category, redaction applied, truncation applied, source section',
    rawEsi: 'forbidden',
    discovery: 'not_applicable',
    evidence: 'forbidden',
    assessment: 'forbidden',
    paths: 'redact_or_classify_as_sensitive',
    enforced: 'policy_only'
  }),
  policy({
    id: 'data_quality_warning_messages',
    family: 'free_text_diagnostics',
    sensitivity: 'medium',
    allowed: [
      'warning type',
      'bounded message',
      'run id',
      'killmail id when needed for support provenance',
      'created timestamp'
    ],
    forbidden: [
      'raw ESI payload excerpts',
      'full participant payload strings',
      'operator-private notes',
      'unbounded message strings',
      'secrets or tokens'
    ],
    redaction: 'Warnings should summarize mismatch/posture without copying raw payload material.',
    truncation: { max_length: 220, applies_to: ['data_quality_warnings.message'] },
    marker: '[truncated: warning message]',
    basis: 'warning type, source run, bounded sample limit, omitted-count disclosure',
    rawEsi: 'forbidden',
    discovery: 'bounded_id_only_when_needed',
    evidence: 'counts_and_warning_context_only',
    assessment: 'forbidden',
    paths: 'not_applicable',
    enforced: 'policy_only'
  }),
  policy({
    id: 'queue_latest_ref_samples',
    family: 'discovery_queue_support_summary',
    sensitivity: 'medium',
    allowed: [
      'bounded latest-ref samples',
      'killmail id',
      'status',
      'discovered_by type/id',
      'source system id',
      'priority',
      'failure count',
      'bounded redacted last_error',
      'timestamps'
    ],
    forbidden: [
      'unbounded Discovery ref export',
      'Discovery refs as truth/evidence',
      'raw preview payload dumps',
      'full killmail hashes beyond bounded provenance sample',
      'raw ESI payloads'
    ],
    redaction: 'Queue latest refs should be capped, disclose omitted counts, and treat hash/ref samples as support provenance only.',
    truncation: { max_length: 160, applies_to: ['last_error'] },
    marker: '[bounded: queue support sample]',
    basis: 'sample limit, sort/order basis, omitted count, support/provenance-only disclosure',
    rawEsi: 'forbidden',
    discovery: 'bounded_support_provenance_samples_only',
    evidence: 'forbidden',
    assessment: 'forbidden',
    paths: 'not_applicable',
    enforced: 'policy_only'
  }),
  policy({
    id: 'local_filesystem_paths',
    family: 'local_runtime_context',
    sensitivity: 'high',
    allowed: [
      'project-relative label when practical',
      'path role/key',
      'exists/is_file/is_directory status',
      'size/mtime when needed',
      'sensitivity disclosure'
    ],
    forbidden: [
      'private home/user path disclosure unless necessary',
      'full path lists without limit',
      'file contents',
      'secret-bearing filenames',
      'path claims from renderer as authority'
    ],
    redaction: 'Prefer path role plus basename/project-relative path; otherwise classify full path as sensitive support metadata.',
    truncation: { max_length: 260, applies_to: ['path strings'] },
    marker: '[sensitive: local path]',
    basis: 'path role, source helper, sensitivity disclosure, sample limit and omitted count',
    rawEsi: 'not_applicable',
    discovery: 'not_applicable',
    evidence: 'forbidden',
    assessment: 'forbidden',
    paths: 'allowed_as_sensitive_support_metadata',
    enforced: 'policy_only'
  }),
  policy({
    id: 'sample_limits_omissions_and_exclusions',
    family: 'support_artifact_disclosure',
    sensitivity: 'medium',
    allowed: [
      'per-section sample limit',
      'sort/order basis',
      'included count',
      'omitted count when known',
      'excluded material list',
      'redaction/truncation marker catalog'
    ],
    forbidden: [
      'silent omission of sensitive material',
      'claiming complete table export when samples are bounded',
      'hiding raw payload exclusion',
      'unbounded fallback dumps'
    ],
    redaction: 'Every bounded section should disclose limit and exclusion rules before writer hardening.',
    truncation: { max_length: null, applies_to: ['disclosure metadata only'] },
    marker: '[omitted: section limit]',
    basis: 'section name, configured/default limit, omitted-count availability, excluded-material catalog',
    rawEsi: 'forbidden',
    discovery: 'bounded_summary_only',
    evidence: 'counts_and_summaries_only',
    assessment: 'counts_or_anchor_summary_only',
    paths: 'allowed_as_sensitive_support_metadata',
    enforced: 'policy_only'
  }),
  policy({
    id: 'task_run_ids_and_provider_provenance',
    family: 'runtime_provenance',
    sensitivity: 'medium',
    allowed: [
      'run id',
      'request id',
      'task id',
      'provider name',
      'run type',
      'watch type/id',
      'status',
      'timing',
      'API call counts'
    ],
    forbidden: [
      'provider credentials',
      'request headers',
      'full payload bodies',
      'operator-private notes',
      'authority claims beyond support provenance'
    ],
    redaction: 'Identifiers may be shown as support provenance but must not imply Evidence/EVEidence or Discovery truth.',
    truncation: { max_length: 128, applies_to: ['identifier strings'] },
    marker: '[support provenance]',
    basis: 'source run/task/request, generated time, local DB basis, support-only disclosure',
    rawEsi: 'forbidden',
    discovery: 'provenance_ids_only',
    evidence: 'counts_and_summaries_only',
    assessment: 'forbidden',
    paths: 'not_applicable',
    enforced: 'policy_only'
  })
]);

function buildTraceLogRedactionPolicyPreview() {
  const policies = POLICY_FIELDS.map((entry) => ({
    ...entry,
    writer_enforced: entry.enforcement_status === 'writer_enforced',
    policy_only: entry.enforcement_status === 'policy_only',
    read_only: true,
    mutates_state: false,
    provider_calls: 0
  }));

  return {
    action: 'support.trace_log_redaction_policy.preview',
    classification: 'read-only trace/log redaction policy proof',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    renderer_payload_ignored: true,
    creates_support_artifacts: false,
    creates_snapshots: false,
    creates_trace_packs: false,
    creates_logs: false,
    creates_exports: false,
    creates_files: false,
    creates_directories: false,
    inspects_real_operator_artifacts: false,
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
    external_io_config_writes: 0,
    schema_changes: false,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    writer_behavior_changed: false,
    summary: summarize(policies),
    policies,
    global_rules: {
      trace_log_support_artifacts_are_evidence: false,
      trace_log_support_artifacts_are_discovery: false,
      trace_log_support_artifacts_are_observation: false,
      trace_log_support_artifacts_are_assessment_memory: false,
      trace_log_support_artifacts_are_product_truth: false,
      trace_log_support_artifacts_are_deletion_or_pruning_authority: false,
      raw_esi_payloads_allowed_in_trace_logs: false,
      full_provider_response_bodies_allowed: false,
      full_participant_payload_strings_allowed: false,
      secrets_or_tokens_allowed: false,
      unbounded_table_dumps_allowed: false
    },
    boundary: [
      'Read-only trace/log redaction policy proof only; it does not change trace-pack or log writer behavior.',
      'It does not create support artifacts, snapshots, trace packs, logs, exports, files, or directories.',
      'It does not inspect real operator support artifacts or call providers.',
      'It does not mutate Evidence/EVEidence, Discovery refs, Hydration, Assessment Memory, Watch, storage config, External I/O config, or schema.',
      'The policy is support-hardening guidance, not Evidence/EVEidence, Discovery, Observation, Assessment Memory, product truth, deletion authority, pruning authority, runtime enforcement, or command blocking.'
    ]
  };
}

function policy({
  id,
  family,
  sensitivity,
  allowed,
  forbidden,
  redaction,
  truncation,
  marker,
  basis,
  rawEsi,
  discovery,
  evidence,
  assessment,
  paths,
  enforced
}) {
  return {
    policy_id: id,
    family,
    sensitivity_level: sensitivity,
    allowed_summary_content: allowed,
    forbidden_content: forbidden,
    redaction_rule: redaction,
    truncation_or_max_length_rule: truncation,
    replacement_marker_or_disclosure_phrase: marker,
    basis_provenance_requirement: basis,
    raw_esi_payloads: rawEsi,
    discovery_refs_or_killmail_hashes: discovery,
    evidence_rows: evidence,
    assessment_memory: assessment,
    local_paths: paths,
    enforcement_status: enforced
  };
}

function summarize(policies) {
  return {
    total_policies: policies.length,
    by_family: countBy(policies, 'family'),
    by_sensitivity: countBy(policies, 'sensitivity_level'),
    by_enforcement_status: countBy(policies, 'enforcement_status'),
    raw_esi_forbidden: policies
      .filter((entry) => entry.raw_esi_payloads === 'forbidden')
      .map((entry) => entry.policy_id),
    local_path_sensitive: policies
      .filter((entry) => String(entry.local_paths).includes('sensitive'))
      .map((entry) => entry.policy_id),
    max_length_rules: Object.fromEntries(policies
      .filter((entry) => Number.isFinite(entry.truncation_or_max_length_rule?.max_length))
      .map((entry) => [entry.policy_id, entry.truncation_or_max_length_rule.max_length]))
  };
}

function countBy(entries, key) {
  return entries.reduce((counts, entry) => {
    const value = entry[key] || 'unknown';
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

module.exports = {
  buildTraceLogRedactionPolicyPreview
};
