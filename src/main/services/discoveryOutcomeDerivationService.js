const ACTION = 'discovery.outcome_derivation.preview';
const OUTCOMES = new Set([
  'complete_refs_found',
  'complete_no_refs',
  'partial_deferred',
  'provider_deferred',
  'held_by_external_io',
  'acquisition_capped',
  'failed_retryable',
  'failed_terminal'
]);

function buildDiscoveryOutcomeDerivationPreview(db, input = {}) {
  const before = stateSnapshot(db);
  const limit = clampLimit(input.limit, 25);
  const externalIoState = normalizeExternalIoState(input.externalIoState);
  const rows = readRuns(db, limit).map((run) => deriveRunOutcome(db, run, externalIoState));
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only Discovery outcome derivation proof',
    read_only: true,
    mutates_state: false,
    renderer_eligible: true,
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    watch_execution: false,
    watch_dispatches: 0,
    dispatch_runner_invoked: false,
    dispatch_runner_invocations: 0,
    collectors_called: false,
    task_runner_methods_called: [],
    tasks_created: 0,
    queue_created: false,
    dispatcher_created: false,
    leases_created: 0,
    task_packet_schema_created: false,
    discovery_refs_written: false,
    discovered_killmail_refs_written: 0,
    discovery_refs_mutated: 0,
    evidence_written: false,
    evidence_writes: 0,
    hydration_writes: 0,
    metadata_writes: 0,
    api_request_log_writes: 0,
    data_quality_warning_writes: 0,
    watch_mutations: 0,
    schema_changes: 0,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    outcome_vocabulary: [...OUTCOMES],
    summary: summarize(rows, externalIoState),
    outcome_candidates: rows,
    packet_level_derivability: packetDerivabilitySummary(rows),
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
    },
    boundary: [
      'Discovery outcome derivation is read-only/local-only and non-authorizing.',
      'Derived outcomes are coarse posture from existing rows, not product-grade task or packet completion.',
      'discovered_killmail_refs remains candidate-ref memory, not Discovery task or packet memory.',
      'ESI calls, Evidence/EVEidence writes, Hydration, Observation, and Assessment are outside Discovery completion.',
      'Invalid scope belongs before Discovery acceptance and is not emitted as a Discovery outcome.'
    ]
  };
}

function deriveRunOutcome(db, run, externalIoState) {
  const refs = readRefsForRun(db, run.run_id);
  const logs = readApiLogsForRun(db, run.run_id);
  const warnings = readWarningsForRun(db, run.run_id);
  const warningText = [run.error_summary, ...warnings.map((entry) => entry.message), ...logs.map((entry) => entry.error_message)]
    .filter(Boolean)
    .join(' | ');
  const providerDeferred = hasProviderDeferral(logs, warningText);
  const capBasis = hasCapBasis(run, warningText);
  const esiContext = buildEsiContext(run, logs, warnings, refs);
  const derived = deriveOutcomeWord(run, refs, logs, warningText, providerDeferred, capBasis, externalIoState);
  const source = deriveSource(run, refs);
  const missingBasis = missingBasisFlags(run, refs, logs, warningText, providerDeferred, capBasis, externalIoState, esiContext);

  return {
    source_intent_kind: source.kind,
    source_id: source.id,
    watch_id: run.watch_id || null,
    run_id: run.run_id,
    approximate_scope_key: source.scopeKey,
    task_level_derived_outcome: derived.outcome,
    task_level_confidence: derived.confidence,
    confidence_reason: derived.reason,
    packet_level_derivability: {
      status: source.kind === 'system_radius_watch' ? 'not_product_grade_derivable' : 'not_proven_without_packet_rows',
      confidence: 'low',
      packet_outcomes_proven: false,
      accepted_packet_rows_present: false,
      notes: [
        'No durable discovery_task_packet row exists.',
        'Candidate refs only represent refs found, not no-ref/deferred/capped/failed packet completion.'
      ]
    },
    discovered_ref_count: refs.length || Number(run.discovered_refs || 0),
    candidate_ref_handles: refs.slice(0, 5).map(refHandle),
    zkill_api_call_count: Number(run.api_calls_zkill || 0),
    esi_api_call_count: Number(run.api_calls_esi || 0),
    esi_context: esiContext,
    warning_error_summary: warningSummary(run, logs, warnings),
    missing_basis_flags: missingBasis,
    boundary_flags: {
      candidate_refs_are_not_task_memory: true,
      esi_expansion_not_discovery_completion: true,
      discovery_completion_not_evidence_completion: true,
      discovery_completion_not_hydration_completion: true,
      discovery_completion_not_observation_completion: true,
      discovery_completion_not_assessment_completion: true
    }
  };
}

function deriveOutcomeWord(run, refs, logs, warningText, providerDeferred, capBasis, externalIoState) {
  if (externalIoState === 'off' && Number(run.api_calls_zkill || 0) === 0 && refs.length === 0) {
    return result('held_by_external_io', 'low', 'External I/O posture can be shown, but no durable Discovery task held row exists.');
  }
  if (providerDeferred && refs.length > 0) {
    return result('partial_deferred', 'low', 'Refs exist, but provider deferral is not normalized as a Discovery packet outcome.');
  }
  if (providerDeferred) {
    return result('provider_deferred', 'low', 'Provider defer/failure posture is inferred from logs or warnings, not normalized Discovery outcome rows.');
  }
  if (capBasis) {
    return result('acquisition_capped', 'low', 'Cap posture is summary-supported only; current rows cannot prove provider-side full coverage.');
  }
  if (String(run.status) === 'failed') {
    const retryable = /retry|rate|429|420|503|timeout|defer|capacity/i.test(warningText);
    return result(retryable ? 'failed_retryable' : 'failed_terminal', 'low', 'Failed run status is durable, but Discovery retryable/terminal class is not normalized.');
  }
  if (refs.length > 0 || Number(run.discovered_refs || 0) > 0) {
    const confidence = run.watch_type === 'system_radius' ? 'low' : 'medium';
    return result('complete_refs_found', confidence, 'Found refs are durable candidate-ref memory; packet completion is still not proven.');
  }
  if (String(run.status) === 'success' && Number(run.api_calls_zkill || 0) > 0 && Number(run.discovered_refs || 0) === 0) {
    const confidence = run.watch_type === 'system_radius' ? 'low' : 'medium';
    return result('complete_no_refs', confidence, 'No-ref posture is coarse run-level derivation; no durable no-ref packet row exists.');
  }
  return result('partial_deferred', 'low', 'Current rows do not provide enough basis for a stronger Discovery outcome.');
}

function missingBasisFlags(run, refs, logs, warningText, providerDeferred, capBasis, externalIoState, esiContext) {
  const flags = [
    'packet_outcome_not_proven',
    'candidate_refs_are_not_task_memory'
  ];
  if (refs.length === 0) {
    flags.push('no_ref_not_represented');
  }
  if (providerDeferred) {
    flags.push('provider_deferred_not_normalized');
  }
  if (externalIoState === 'off') {
    flags.push('held_by_external_io_posture_only');
  }
  if (capBasis) {
    flags.push('cap_basis_summary_only');
  }
  if (esiContext.api_calls_esi > 0 || esiContext.expansion_rows_present) {
    flags.push('esi_expansion_not_discovery_completion');
  }
  if (run.watch_type === 'system_radius') {
    flags.push('system_radius_no_per_packet_completion_rows');
  }
  if (/invalid_scope/i.test(warningText)) {
    flags.push('invalid_scope_pre_discovery_acceptance');
  }
  if (logs.some((log) => log.provider === 'zkill') && !logs.some((log) => log.provider === 'zkill' && log.status_code)) {
    flags.push('provider_status_basis_partial');
  }
  return [...new Set(flags)];
}

function readRuns(db, limit) {
  return db.prepare(`
    SELECT *
    FROM fetch_runs
    ORDER BY started_at DESC, run_id DESC
    LIMIT ?
  `).all(limit);
}

function readRefsForRun(db, runId) {
  return db.prepare(`
    SELECT killmail_id, killmail_hash, discovered_by_type, discovered_by_id,
           source_scope, source_system_id, source_actor_type, source_actor_id,
           status, first_seen_run_id, last_seen_run_id, preview_json
    FROM discovered_killmail_refs
    WHERE first_seen_run_id = ? OR last_seen_run_id = ?
    ORDER BY killmail_id ASC, killmail_hash ASC
  `).all(runId, runId);
}

function readApiLogsForRun(db, runId) {
  return db.prepare(`
    SELECT provider, endpoint, method, status_code, retry_count, rate_limited, error_message
    FROM api_request_logs
    WHERE run_id = ?
    ORDER BY requested_at ASC, request_id ASC
  `).all(runId);
}

function readWarningsForRun(db, runId) {
  return db.prepare(`
    SELECT warning_type, message, killmail_id
    FROM data_quality_warnings
    WHERE run_id = ?
    ORDER BY created_at ASC, warning_id ASC
  `).all(runId);
}

function deriveSource(run, refs) {
  const firstRef = refs[0] || null;
  const watchId = run.watch_id || null;
  if (run.watch_type === 'actor') {
    const actorType = firstRef?.source_actor_type || 'watch_actor';
    const actorId = firstRef?.source_actor_id || watchId;
    return {
      kind: 'actor_watch',
      id: actorId ? `${actorType}:${actorId}` : watchId,
      scopeKey: actorId ? `actor:${actorType}:${actorId}` : `watch:actor:${watchId || 'unknown'}`
    };
  }
  if (run.watch_type === 'system_radius') {
    const centerId = firstRef?.discovered_by_id || watchId;
    return {
      kind: 'system_radius_watch',
      id: centerId,
      scopeKey: centerId ? `system_radius:${centerId}` : `watch:system_radius:${watchId || 'unknown'}`
    };
  }
  if (run.trigger === 'manual_expansion') {
    return {
      kind: 'manual_expansion',
      id: firstRef ? `${firstRef.discovered_by_type}:${firstRef.discovered_by_id}` : run.watch_id || null,
      scopeKey: firstRef ? `${firstRef.discovered_by_type}:${firstRef.discovered_by_id}` : 'manual_expansion:unknown'
    };
  }
  if (run.trigger === 'manual_discovery' || run.watch_type === 'manual') {
    return {
      kind: 'manual_discovery',
      id: firstRef ? `${firstRef.discovered_by_type}:${firstRef.discovered_by_id}` : run.watch_id || null,
      scopeKey: firstRef ? `${firstRef.discovered_by_type}:${firstRef.discovered_by_id}` : 'manual_discovery:unknown'
    };
  }
  return {
    kind: run.watch_type || run.trigger || 'unknown',
    id: watchId,
    scopeKey: watchId ? `${run.watch_type || 'run'}:${watchId}` : `run:${run.run_id}`
  };
}

function buildEsiContext(run, logs, warnings, refs) {
  const apiCallsEsi = Number(run.api_calls_esi || 0);
  const esiWarnings = warnings.filter((entry) => /esi|expansion|provider_capacity/i.test(`${entry.warning_type} ${entry.message}`));
  return {
    api_calls_esi: apiCallsEsi,
    expansion_rows_present: Number(run.expanded_new || 0) > 0 || Number(run.failed_expansions || 0) > 0 || refs.some((ref) => ['expanded', 'cached', 'failed'].includes(ref.status)),
    expanded_new: Number(run.expanded_new || 0),
    failed_expansions: Number(run.failed_expansions || 0),
    warning_count: esiWarnings.length,
    outside_discovery_completion: true,
    note: apiCallsEsi > 0 || esiWarnings.length
      ? 'ESI Evidence Expansion context is present, but is not Discovery completion.'
      : 'No ESI context present for this run.'
  };
}

function warningSummary(run, logs, warnings) {
  return {
    fetch_run_status: run.status,
    error_summary: run.error_summary || null,
    warning_count: warnings.length,
    warnings: warnings.slice(0, 5).map((entry) => ({
      warning_type: entry.warning_type,
      message: entry.message,
      killmail_id: entry.killmail_id || null
    })),
    api_error_count: logs.filter((entry) => entry.error_message || Number(entry.rate_limited || 0) > 0).length,
    api_errors: logs
      .filter((entry) => entry.error_message || Number(entry.rate_limited || 0) > 0)
      .slice(0, 5)
      .map((entry) => ({
        provider: entry.provider,
        status_code: entry.status_code || null,
        retry_count: Number(entry.retry_count || 0),
        rate_limited: Number(entry.rate_limited || 0) > 0,
        error_message: entry.error_message || null
      }))
  };
}

function hasProviderDeferral(logs, warningText) {
  return logs.some((entry) => entry.provider === 'zkill' && (Number(entry.rate_limited || 0) > 0 || [420, 429, 503].includes(Number(entry.status_code || 0))))
    || /zkill[^|]*(rate.?limit|defer|retry|503|429|420|failed)/i.test(warningText)
    || /discovery[^|]*(provider.?defer|rate.?limit|retry)/i.test(warningText);
}

function hasCapBasis(run, warningText) {
  return /acquisition.?cap|discovery.?cap|zkill[^|]*(cap|limit|max refs)/i.test(warningText)
    || Number(run.discovered_refs || 0) > 0 && /acquisition.?cap|discovery.?cap|zkill[^|]*(cap|limit|max refs)/i.test(String(run.error_summary || ''));
}

function refHandle(ref) {
  return {
    killmail_id: ref.killmail_id,
    killmail_hash: ref.killmail_hash,
    status: ref.status,
    discovered_by_type: ref.discovered_by_type,
    discovered_by_id: ref.discovered_by_id,
    source_system_id: ref.source_system_id || null,
    source_actor_type: ref.source_actor_type || null,
    source_actor_id: ref.source_actor_id || null
  };
}

function summarize(rows, externalIoState) {
  const counts = {};
  for (const row of rows) {
    counts[row.task_level_derived_outcome] = (counts[row.task_level_derived_outcome] || 0) + 1;
  }
  return {
    run_count: rows.length,
    external_io_state: externalIoState,
    outcome_counts: counts,
    packet_completion_product_grade_derivable: false,
    missing_basis_flags: [...new Set(rows.flatMap((row) => row.missing_basis_flags))]
  };
}

function packetDerivabilitySummary(rows) {
  return {
    packet_rows_present: false,
    product_grade_packet_outcomes_derivable: false,
    rows_with_packet_gap: rows.filter((row) => row.missing_basis_flags.includes('packet_outcome_not_proven')).length,
    missing_basis_flags: [
      'packet_outcome_not_proven',
      'no_ref_not_represented',
      'candidate_refs_are_not_task_memory'
    ],
    note: 'Existing rows can show coarse run/ref posture, but cannot prove every accepted Discovery packet reached an outcome.'
  };
}

function stateSnapshot(db) {
  return {
    fetch_runs: count(db, 'fetch_runs'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    api_request_logs: count(db, 'api_request_logs'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    metadata_runs: count(db, 'metadata_runs'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches')
  };
}

function result(outcome, confidence, reason) {
  return { outcome, confidence, reason };
}

function count(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count || 0);
}

function clampLimit(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(parsed), 100);
}

function normalizeExternalIoState(value) {
  return value === 'off' ? 'off' : 'unknown_or_on';
}

function stableJson(value) {
  return JSON.stringify(value);
}

module.exports = {
  buildDiscoveryOutcomeDerivationPreview
};
