const BROAD_FACT_CLASSES = Object.freeze([
  'storage_authority',
  'budget',
  'external_io',
  'provider_live_gate',
  'destination_path_authority'
]);

function buildRuntimeHookTelemetryReadout(input = {}) {
  const previews = normalizePreviews(input);
  const entries = previews.map((preview, index) => summarizePreview(preview, index));
  const missingFactClasses = [...new Set(entries.flatMap((entry) => entry.missing_fact_classes))];
  const sourcedBroadFactClasses = [...new Set(entries.flatMap((entry) => entry.sourced_broad_fact_classes))];
  const unsourcedBroadFactClasses = BROAD_FACT_CLASSES.filter((key) => !sourcedBroadFactClasses.includes(key));

  return {
    action: 'runtime.enforcement_hook_telemetry.readout',
    classification: 'read-only inactive runtime hook telemetry readout',
    read_only: true,
    active_runtime_enforcement: false,
    command_blocking_active: false,
    preview_only: true,
    telemetry_persisted: false,
    support_artifacts_created: false,
    provider_calls: 0,
    repository_calls: 0,
    task_runner_calls: 0,
    file_writes: 0,
    config_writes: 0,
    handler_dispatches: 0,
    preview_count: entries.length,
    missing_fact_classes: missingFactClasses,
    coverage: coverageSummary(entries),
    broad_fact_classes_absent: entries.every((entry) => entry.broad_fact_classes_absent === true),
    sourced_broad_fact_classes: sourcedBroadFactClasses,
    unsourced_broad_fact_classes: unsourcedBroadFactClasses,
    entries,
    authority_notes: {
      dry_run_would_allow_is_authorization: false,
      external_io_on_is_authorization: false,
      missing_facts_are_telemetry_not_failure: true
    },
    boundary: [
      'Read-only inactive hook telemetry readout only; it does not enable runtime enforcement or command blocking.',
      'It summarizes supplied preview objects and does not capture, persist, write files, create support artifacts, call providers, call repositories, run tasks, or dispatch target handlers.',
      'Missing fact classes are reported as posture evidence and are not treated as verification failures by this readout.'
    ]
  };
}

function normalizePreviews(input = {}) {
  if (Array.isArray(input)) {
    return input.filter(isObject);
  }
  if (Array.isArray(input.previews)) {
    return input.previews.filter(isObject);
  }
  if (isObject(input.preview)) {
    return [input.preview];
  }
  return [];
}

function summarizePreview(preview, index) {
  const evaluatorDecision = preview.evaluator_decision || {};
  const gateInputs = evaluatorDecision.gate_inputs_used || {};
  const missingFactClasses = Array.isArray(preview.missing_fact_classes)
    ? [...preview.missing_fact_classes]
    : [];
  const coverageMissing = missingFactClasses.includes('classification_coverage') ||
    evaluatorDecision.classified === false;

  return {
    index,
    command: preview.command || evaluatorDecision.command || null,
    source: preview.source || gateInputs.source || null,
    evaluator_decision: evaluatorDecision.decision || null,
    missing_fact_classes: missingFactClasses,
    coverage_present: !coverageMissing,
    coverage_status: coverageMissing ? 'missing_or_null' : 'present_from_hook_or_supplied_fact',
    broad_fact_classes_absent: broadFactClassesAbsent(gateInputs),
    sourced_broad_fact_classes: sourcedBroadFactClasses(gateInputs),
    broad_fact_class_statuses: broadFactClassStatuses(gateInputs),
    broad_fact_class_inputs: broadFactClassInputs(gateInputs),
    active_runtime_enforcement: false,
    active_enforcement_false: preview.active === false && evaluatorDecision.active === false,
    preview_only: preview.preview_only === true && evaluatorDecision.preview_only === true,
    dry_run_would_allow_is_authorization: preview.authority_notes?.dry_run_would_allow_is_authorization === true,
    external_io_on_is_authorization: preview.authority_notes?.external_io_on_is_authorization === true,
    dry_run_would_allow_non_authorizing: preview.authority_notes?.dry_run_would_allow_is_authorization === false,
    external_io_on_non_authorizing: preview.authority_notes?.external_io_on_is_authorization === false,
    missing_facts_are_failures: false
  };
}

function coverageSummary(entries) {
  const present = entries.filter((entry) => entry.coverage_present).map((entry) => entry.command);
  const missing = entries.filter((entry) => !entry.coverage_present).map((entry) => entry.command);
  return {
    present_count: present.length,
    missing_or_null_count: missing.length,
    present_commands: present,
    missing_or_null_commands: missing
  };
}

function broadFactClassesAbsent(gateInputs = {}) {
  return BROAD_FACT_CLASSES.every((key) => gateInputs[key] == null);
}

function broadFactClassInputs(gateInputs = {}) {
  return Object.fromEntries(BROAD_FACT_CLASSES.map((key) => [key, gateInputs[key] || null]));
}

function sourcedBroadFactClasses(gateInputs = {}) {
  return BROAD_FACT_CLASSES.filter((key) => gateInputs[key] != null);
}

function broadFactClassStatuses(gateInputs = {}) {
  return Object.fromEntries(BROAD_FACT_CLASSES.map((key) => {
    const input = gateInputs[key] || null;
    if (!input) {
      return [key, {
        status: 'not_sourced',
        source_status: 'not_sourced',
        fact_source: null
      }];
    }
    return [key, {
      status: 'sourced',
      source_status: input.source_status || 'sourced_status_unspecified',
      fact_source: input.fact_source || 'supplied_runtime_fact',
      non_authorizing_preview: input.non_authorizing_preview !== false
    }];
  }));
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

module.exports = {
  buildRuntimeHookTelemetryReadout
};
