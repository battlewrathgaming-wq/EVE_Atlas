const CONTRACT_CLASSES = Object.freeze([
  contentsClass({
    id: 'runtime_snapshot_rolling',
    label: 'Rolling runtime DB snapshot',
    family: 'corpus_adjacent_support',
    allowed: [
      'SQLite runtime database copy',
      'schema and local lookup rows',
      'local Evidence/EVEidence rows as copied DB content',
      'Discovery refs as copied DB content',
      'Hydration labels and metadata_runs as copied DB content',
      'Watch definitions and schedule state as copied DB content',
      'Assessment Memory rows as copied DB content'
    ],
    forbidden: [
      'new provider calls',
      'new Evidence/EVEidence creation',
      'new Discovery expansion',
      'new Hydration writes',
      'new Assessment Memory writes',
      'deletion/pruning authority'
    ],
    redaction: [
      'no redaction inside DB copy; classify and disclose sensitivity instead',
      'do not present snapshot extracts as user-facing Evidence exports'
    ],
    rawEsiPayloads: 'included_as_existing_db_copy_only',
    discoveryRefs: 'included_as_existing_db_copy_only',
    evidenceRows: 'included_as_existing_db_copy_only',
    hydration: 'included_as_existing_db_copy_only',
    assessment: 'included_as_existing_db_copy_only',
    watch: 'included_as_existing_db_copy_only',
    localPaths: 'may_include',
    runtimeTelemetry: 'may_include_existing_rows_only',
    basisDisclosure: 'must disclose source DB path, generated time, snapshot class, storage/budget context, and that this is recovery support.',
    sensitivity: 'high',
    canUseAsAuthority: false,
    notes: 'A copied DB can contain corpus truth, but the snapshot artifact itself is not new Evidence/EVEidence.'
  }),
  contentsClass({
    id: 'runtime_snapshot_retained',
    label: 'Retained/manual runtime DB snapshot',
    family: 'corpus_adjacent_support',
    allowed: [
      'SQLite runtime database copy',
      'schema and local lookup rows',
      'local Evidence/EVEidence rows as copied DB content',
      'Discovery refs as copied DB content',
      'Hydration labels and metadata_runs as copied DB content',
      'Watch definitions and schedule state as copied DB content',
      'Assessment Memory rows as copied DB content'
    ],
    forbidden: [
      'new provider calls',
      'new Evidence/EVEidence creation',
      'new Discovery expansion',
      'new Hydration writes',
      'new Assessment Memory writes',
      'deletion/pruning authority'
    ],
    redaction: [
      'no redaction inside DB copy; classify and disclose sensitivity instead',
      'retained path must be disclosed for future cleanup/deletion review'
    ],
    rawEsiPayloads: 'included_as_existing_db_copy_only',
    discoveryRefs: 'included_as_existing_db_copy_only',
    evidenceRows: 'included_as_existing_db_copy_only',
    hydration: 'included_as_existing_db_copy_only',
    assessment: 'included_as_existing_db_copy_only',
    watch: 'included_as_existing_db_copy_only',
    localPaths: 'may_include',
    runtimeTelemetry: 'may_include_existing_rows_only',
    basisDisclosure: 'must disclose source DB path, retained destination, generated time, storage/budget context, and cleanup responsibility.',
    sensitivity: 'high',
    canUseAsAuthority: false,
    notes: 'Retained snapshots may outlive active records and must not override deletion/pruning policy.'
  }),
  contentsClass({
    id: 'operator_debug_trace_pack',
    label: 'Operator debug trace pack',
    family: 'corpus_adjacent_support',
    allowed: [
      'bounded readiness summaries',
      'bounded corpus health counts',
      'bounded fetch run summaries',
      'bounded API request diagnostics without full response bodies',
      'bounded Discovery queue counts and redacted/latest ref summaries',
      'bounded warning summaries',
      'task history summaries',
      'runtime boundary status',
      'local path/status summaries'
    ],
    forbidden: [
      'raw ESI payload dumps',
      'full provider response bodies',
      'full killmail participant payload strings',
      'secrets or auth tokens',
      'unbounded table dumps',
      'Evidence/EVEidence export packaging',
      'Discovery ref export as truth',
      'Assessment Memory full narrative export'
    ],
    redaction: [
      'omit raw_esi_payload and full provider payload strings',
      'summarize request/response posture without secrets',
      'bound row counts and latest samples',
      'omit or summarize long free-text/narrative fields'
    ],
    rawEsiPayloads: 'forbidden',
    discoveryRefs: 'bounded_summary_only',
    evidenceRows: 'counts_and_summaries_only',
    hydration: 'counts_and_metadata_summary_only',
    assessment: 'counts_or_anchor_summary_only',
    watch: 'state_summary_only',
    localPaths: 'may_include_with_sensitivity',
    runtimeTelemetry: 'bounded_summary_allowed',
    basisDisclosure: 'must disclose generated time, local DB basis, limits, exclusions, and support/debug classification.',
    sensitivity: 'high',
    canUseAsAuthority: false,
    notes: 'Trace packs are diagnostics and must not become raw Evidence/EVEidence exports.'
  }),
  contentsClass({
    id: 'light_operational_logs',
    label: 'Light operational logs',
    family: 'operational_support',
    allowed: [
      'bounded runtime events',
      'command names and statuses',
      'non-secret error codes',
      'timing and task state summaries',
      'local path/status hints when needed for diagnosis'
    ],
    forbidden: [
      'raw provider payloads',
      'raw ESI payloads',
      'secrets or auth tokens',
      'full Evidence/EVEidence rows',
      'full Discovery refs',
      'Assessment Memory narratives'
    ],
    redaction: [
      'remove secrets and tokens',
      'truncate long error messages',
      'avoid full payload logging',
      'prefer IDs/counts/status over body dumps'
    ],
    rawEsiPayloads: 'forbidden',
    discoveryRefs: 'counts_or_ids_only_when_needed',
    evidenceRows: 'forbidden',
    hydration: 'status_counts_only',
    assessment: 'forbidden',
    watch: 'status_summary_only',
    localPaths: 'may_include_with_sensitivity',
    runtimeTelemetry: 'bounded_summary_allowed',
    basisDisclosure: 'must disclose log source, time window, and that logs are operational support only.',
    sensitivity: 'medium',
    canUseAsAuthority: false,
    notes: 'Logs help diagnose runtime behavior and must not become product truth or evidence exports.'
  }),
  contentsClass({
    id: 'readiness_preflight_export',
    label: 'Readiness/preflight export',
    family: 'operational_support',
    allowed: [
      'readiness checks',
      'storage/path posture',
      'External I/O posture',
      'gate/preflight status',
      'lookup table counts',
      'support-artifact policy summaries',
      'non-secret runtime configuration posture'
    ],
    forbidden: [
      'raw ESI payloads',
      'full provider response bodies',
      'Evidence/EVEidence row dumps',
      'Discovery ref row dumps',
      'Assessment Memory narratives',
      'secrets or auth tokens',
      'deletion/pruning authority'
    ],
    redaction: [
      'report posture and counts rather than raw rows',
      'hide secrets and tokens',
      'avoid renderer-origin path claims as authority'
    ],
    rawEsiPayloads: 'forbidden',
    discoveryRefs: 'counts_and_posture_only',
    evidenceRows: 'counts_and_posture_only',
    hydration: 'counts_and_posture_only',
    assessment: 'counts_only',
    watch: 'counts_and_schedule_posture_only',
    localPaths: 'may_include_with_sensitivity',
    runtimeTelemetry: 'bounded_summary_allowed',
    basisDisclosure: 'must disclose readout source, generated time, and non-authoritative support/preflight status.',
    sensitivity: 'medium',
    canUseAsAuthority: false,
    notes: 'Readiness/preflight exports explain local posture; they are not product truth.'
  })
]);

function buildSupportArtifactContentsContractPreview() {
  const classes = CONTRACT_CLASSES.map((entry) => ({
    ...entry,
    read_only: true,
    mutates_state: false,
    creates_files: false,
    creates_directories: false,
    provider_calls: 0
  }));

  return {
    action: 'support.artifact_contents_contract.preview',
    classification: 'read-only support artifact contents contract preview',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    creates_support_artifacts: false,
    creates_snapshots: false,
    creates_trace_packs: false,
    creates_logs: false,
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
    summary: summarize(classes),
    classes,
    global_rules: {
      support_artifacts_are_evidence: false,
      support_artifacts_are_discovery: false,
      support_artifacts_are_observation: false,
      support_artifacts_are_assessment_memory: false,
      support_artifacts_are_deletion_or_pruning_authority: false,
      snapshots_can_contain_db_copy: true,
      snapshot_artifact_itself_is_new_evidence: false,
      trace_packs_are_evidence_exports: false,
      trace_packs_forbid_raw_esi_payload_dumps: true,
      readiness_preflight_exports_are_product_truth: false,
      logs_may_contain_secrets: false
    },
    boundary: [
      'Read-only support artifact contents contract preview only; it does not create snapshots, trace packs, logs, exports, files, or directories.',
      'It does not inspect existing artifact files, package outputs, call providers, mutate DB state, write storage config, or change schema.',
      'Support artifacts are support/recovery/debug material, not Evidence/EVEidence, Discovery, Observation, Assessment Memory, product reports, or deletion/pruning authority.',
      'Snapshots may contain a DB copy, but the snapshot artifact itself is not new Evidence/EVEidence.',
      'Trace packs must stay bounded and must not dump raw ESI payloads, full provider payloads, or secrets.'
    ]
  };
}

function contentsClass({
  id,
  label,
  family,
  allowed,
  forbidden,
  redaction,
  rawEsiPayloads,
  discoveryRefs,
  evidenceRows,
  hydration,
  assessment,
  watch,
  localPaths,
  runtimeTelemetry,
  basisDisclosure,
  sensitivity,
  canUseAsAuthority,
  notes
}) {
  return {
    id,
    artifact_class: id,
    label,
    family,
    allowed_content_categories: allowed,
    forbidden_content_categories: forbidden,
    redaction_or_omission_rules: redaction,
    raw_esi_payloads: rawEsiPayloads,
    discovery_refs: discoveryRefs,
    evidence_rows: evidenceRows,
    hydration_labels_or_candidates: hydration,
    assessment_memory: assessment,
    watch_state: watch,
    local_paths: localPaths,
    runtime_telemetry: runtimeTelemetry,
    can_be_used_as_evidence: canUseAsAuthority,
    can_be_used_as_observation: canUseAsAuthority,
    can_be_used_as_assessment_memory: canUseAsAuthority,
    can_be_used_as_deletion_or_pruning_authority: canUseAsAuthority,
    basis_provenance_disclosure_required: basisDisclosure,
    privacy_sensitivity: sensitivity,
    notes
  };
}

function summarize(classes) {
  return {
    total_classes: classes.length,
    by_family: classes.reduce((counts, entry) => {
      counts[entry.family] = (counts[entry.family] || 0) + 1;
      return counts;
    }, {}),
    high_sensitivity: classes.filter((entry) => entry.privacy_sensitivity === 'high').map((entry) => entry.id),
    raw_esi_payloads_forbidden: classes.filter((entry) => entry.raw_esi_payloads === 'forbidden').map((entry) => entry.id),
    db_copy_classes: classes
      .filter((entry) => entry.raw_esi_payloads === 'included_as_existing_db_copy_only')
      .map((entry) => entry.id),
    non_authoritative_classes: classes
      .filter((entry) =>
        entry.can_be_used_as_evidence === false &&
        entry.can_be_used_as_observation === false &&
        entry.can_be_used_as_assessment_memory === false &&
        entry.can_be_used_as_deletion_or_pruning_authority === false
      )
      .map((entry) => entry.id)
  };
}

module.exports = {
  buildSupportArtifactContentsContractPreview
};
