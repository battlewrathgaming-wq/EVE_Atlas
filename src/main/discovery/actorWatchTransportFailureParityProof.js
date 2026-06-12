const { openDatabase, migrate, closeDatabase } = require('../db/database');
const { EvidenceRepository } = require('../db/evidenceRepository');
const { HttpClient } = require('../api/httpClient');
const { ZKillDiscoveryClient } = require('../api/zkillClient');
const { EsiClient } = require('../api/esiClient');
const { normalizeKillmail } = require('../normalization/killmailNormalizer');
const { actionGate } = require('../services/liveApiGateService');
const { normalizeActorWatchScope } = require('../scopes/scopeControls');
const { planActorWatch } = require('../workers/actorWatchPlanner');
const { discoverActorRefs } = require('./zkillCandidateAcquisition');
const {
  selectExpansionCandidates,
  markFailedExpansionCandidates,
  summarizeExpansionQueue
} = require('./expansionQueueSelection');
const {
  buildActorWatchCompatibilitySummary,
  actorWatchCompatibilitySummaryFieldParity
} = require('./actorWatchCompatibilitySummary');

const ACTION = 'watch.actor_transport_failure_parity_proof';

async function buildActorWatchTransportFailureParityProof(input = {}) {
  const now = input.now || '2026-06-12T00:00:00.000Z';
  const cases = {
    success_transport_logging: await runTransportCase({
      caseName: 'success_transport_logging',
      now,
      scenario: successScenario()
    }),
    retry_after_capacity_deferred: await runTransportCase({
      caseName: 'retry_after_capacity_deferred',
      now,
      scenario: capacityScenario()
    }),
    terminal_esi_failed_expansion: await runTransportCase({
      caseName: 'terminal_esi_failed_expansion',
      now,
      scenario: terminalEsiScenario()
    }),
    invalid_json_failure: await runTransportCase({
      caseName: 'invalid_json_failure',
      now,
      scenario: invalidJsonScenario()
    }),
    cancelled_fatal_finalization: await runTransportCase({
      caseName: 'cancelled_fatal_finalization',
      now,
      scenario: cancellationScenario()
    }),
    timeout_fatal_finalization: await runTransportCase({
      caseName: 'timeout_fatal_finalization',
      now,
      scenario: timeoutScenario()
    }),
    zkill_discovery_failure_warning: await runTransportCase({
      caseName: 'zkill_discovery_failure_warning',
      now,
      scenario: zkillFailureScenario()
    })
  };

  return {
    action: ACTION,
    generated_at: now,
    fixture_only: true,
    fixture_owned_db_only: true,
    disposable_db_path: ':memory:',
    real_http_client: true,
    real_zkill_client: true,
    real_esi_client: true,
    fake_fetch_impl_only: true,
    provider_calls: 0,
    live_api_calls: 0,
    manual_synthetic_api_logs: false,
    http_client_logging_path: 'HttpClient -> EvidenceRepository.insertApiRequestLog',
    production_actor_watch_redirected: false,
    runActorWatchService_production_call_target_changed: false,
    watchExecutor_dispatchFor_changed: false,
    scheduled_actor_watch_current_runner: 'runScheduledActorWatch',
    scheduled_actor_watch_runner_call_target: 'runActorWatchDirectBody',
    collectActorWatch_status: 'legacy_compatibility_available_retirement_candidate',
    collect_actor_watch_imported: false,
    collect_actor_watch_called: false,
    hydration_writes: 0,
    observation_report_paths_touched: false,
    system_radius_behavior_changed: false,
    schema_changes: 0,
    dispatcher_queue_lease_behavior_changed: false,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    source_terms_renamed: false,
    protected_word_json_updated: false,
    cases,
    api_log_fields_proven: [
      'provider',
      'endpoint',
      'status_code',
      'retry_count',
      'rate_limited',
      'error_message'
    ],
    compatibility_summary_field_parity: actorWatchCompatibilitySummaryFieldParity(cases.success_transport_logging.compatibility_summary),
    non_invocation_proof: {
      proof_body_file: 'src/main/discovery/actorWatchTransportFailureParityProof.js',
      actorWatchCollector_imported: false,
      collectActorWatch_called: false,
      production_actor_watch_redirected: false,
      scheduled_actor_watch_redirected_by_this_proof: false,
      scheduled_actor_watch_current_runner_changed_by_this_proof: false
    }
  };
}

async function runTransportCase({ caseName, now, scenario }) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const repository = new EvidenceRepository(db);
    const before = stateSnapshot(db);
    const fakeFetch = createScenarioFetch(scenario);
    try {
      const result = await runActorWatchTransportParityDirectBody(db, {
        entityType: 'character',
        entityId: scenario.entityId,
        entityName: scenario.entityName,
        maxRefs: scenario.maxRefs || 3,
        maxExpansions: scenario.maxExpansions || 2,
        trigger: `hs438_${caseName}`
      }, {
        now,
        repository,
        fetchImpl: fakeFetch,
        maxAttempts: scenario.maxAttempts || 2,
        timeoutMs: scenario.timeoutMs || 50
      });
      const after = stateSnapshot(db);
      return {
        case_name: caseName,
        fatal_error_rethrown: false,
        ...result,
        fake_fetch_invocations: fakeFetch.invocations(),
        disposable_table_mutation_proof: mutationProof(before, after)
      };
    } catch (error) {
      const after = stateSnapshot(db);
      return {
        case_name: caseName,
        fatal_error_rethrown: true,
        fatal_error_code: error.code || error.name,
        fatal_error_message: error.message,
        fetch_run_row: latestFetchRun(db),
        api_request_logs: apiLogs(db),
        api_request_log_summary: apiLogSummary(db),
        fake_fetch_invocations: fakeFetch.invocations(),
        provider_calls: 0,
        live_api_calls: 0,
        evidence_writes: count(db, 'killmails'),
        hydration_writes: count(db, 'metadata_runs'),
        fetch_run_finalized_failed: latestFetchRun(db)?.status === 'failed',
        disposable_table_mutation_proof: mutationProof(before, after)
      };
    }
  } finally {
    closeDatabase(db);
  }
}

async function runActorWatchTransportParityDirectBody(db, payload = {}, dependencies = {}) {
  const repository = dependencies.repository || new EvidenceRepository(db);
  const input = normalizeActorWatchScope(payload);
  const liveGate = actionGate('actor.watch', input, { now: dependencies.now });
  const plannerOutput = planActorWatch(input);
  const fetchRun = repository.createFetchRun({
    runId: `hs438_${input.entityId}_${Date.now()}`,
    trigger: payload.trigger || 'hs438_transport_failure_parity_proof',
    watchType: 'actor',
    watchId: `${plannerOutput.actor.entity_type}:${plannerOutput.actor.entity_id}`
  });
  const httpClient = new HttpClient({
    repository,
    runId: fetchRun.run_id,
    runType: 'collection',
    fetchImpl: dependencies.fetchImpl,
    maxAttempts: dependencies.maxAttempts || 2,
    timeoutMs: dependencies.timeoutMs || 50
  });
  const zkillClient = new ZKillDiscoveryClient(httpClient);
  const esiClient = new EsiClient(httpClient);
  const queueScope = {
    discoveredByType: 'actor',
    discoveredById: plannerOutput.actor.entity_id
  };

  try {
    const discovery = await discoverActorRefs(plannerOutput, zkillClient);
    const refsWritten = repository.upsertDiscoveredKillmailRefs(discovery.expansionQueue, {
      runId: fetchRun.run_id,
      discoveredByType: 'actor',
      discoveredById: plannerOutput.actor.entity_id,
      sourceScope: `${plannerOutput.actor.entity_type}:${plannerOutput.actor.entity_id}`,
      sourceActorType: plannerOutput.actor.entity_type,
      sourceActorId: plannerOutput.actor.entity_id
    });
    const selection = selectExpansionCandidates(discovery.expansionQueue, repository, plannerOutput.caps.maxExpansions);
    repository.markDiscoveryRefsSelected(selection.selectedRefs, undefined, queueScope);
    const evidencePackage = await buildEvidencePackageFromRefsWithFatalTransport({
      refs: selection.selectedRefs,
      repository,
      esiClient,
      run: {
        run_id: fetchRun.run_id,
        source_type: 'actor',
        source_id: `${plannerOutput.actor.entity_type}:${plannerOutput.actor.entity_id}`,
        started_at: fetchRun.started_at
      },
      discoveredBy: {
        type: 'actor',
        id: plannerOutput.actor.entity_id
      }
    });

    markFailedExpansionCandidates(selection.expansionQueue, evidencePackage.warnings);
    selection.skipCounts = summarizeExpansionQueue(selection.expansionQueue);
    repository.markDiscoveryRefsFailed(
      selection.expansionQueue.filter((candidate) => candidate.skip_reason === 'failed'),
      undefined,
      queueScope
    );
    const persistResult = repository.persistEvidencePackage(evidencePackage);
    repository.markDiscoveryRefsExpanded(evidencePackage.killmails.map((killmail) => ({
      killmail_id: killmail.killmail_id,
      hash: killmail.killmail_hash
    })), undefined, queueScope);

    const collectionWarnings = [
      ...plannerOutput.guardrailWarnings,
      ...discovery.warnings
    ];
    if (selection.skipCounts.cap_skipped > 0) {
      collectionWarnings.push(`Expansion cap skipped ${selection.skipCounts.cap_skipped} uncached refs`);
    }
    for (const message of collectionWarnings) {
      repository.insertWarning(fetchRun.run_id, {
        warning_type: 'actor_collection',
        message,
        created_at: dependencies.now
      });
    }

    const apiCounts = apiCountsForRun(db, fetchRun.run_id);
    const compatibilitySummary = buildActorWatchCompatibilitySummary({
      fetchRun,
      plannerOutput,
      discovery,
      selection,
      evidencePackage,
      persistResult,
      apiCounts,
      collectionWarnings,
      pendingRefs: []
    });
    repository.finalizeFetchRun(fetchRun.run_id, {
      discovered_refs: compatibilitySummary.zkill_refs_discovered,
      already_cached: compatibilitySummary.already_cached_killmails,
      expanded_new: compatibilitySummary.new_esi_expansions,
      failed_expansions: compatibilitySummary.failed_expansions,
      activity_events_written: compatibilitySummary.activity_events_written,
      api_calls_zkill: compatibilitySummary.api_calls_zkill,
      api_calls_esi: compatibilitySummary.api_calls_esi
    }, 'success', compatibilitySummary.warnings.length ? compatibilitySummary.warnings.join('; ') : null);

    return {
      normalized_actor_watch_input: input,
      live_gate_posture: {
        action: 'actor.watch',
        mode: liveGate.mode,
        providers: liveGate.providers,
        allowed_in_current_environment: liveGate.allowed,
        production_provider_attempt_entered: false
      },
      provider_calls: 0,
      live_api_calls: 0,
      refs_written_to_fixture_discovery_memory: refsWritten,
      selected_refs_count: selection.selectedRefs.length,
      expanded_refs_count: evidencePackage.killmails.length,
      cached_refs_count: evidencePackage.run.already_cached,
      failed_refs_count: evidencePackage.run.failed_count,
      provider_capacity_deferred_count: evidencePackage.warnings.filter((entry) => entry.warning_type === 'provider_capacity_deferred').length,
      persisted_killmails: persistResult.killmailsWritten,
      activity_events_written: persistResult.eventsWritten,
      collection_warning_count: collectionWarnings.length,
      evidence_warning_count: evidencePackage.warnings.length,
      fetch_run_finalized_success: latestFetchRun(db)?.status === 'success',
      fetch_run_row: latestFetchRun(db),
      discovery_ref_status_counts: discoveryStatusCounts(db),
      api_request_logs: apiLogs(db, fetchRun.run_id),
      api_request_log_summary: apiLogSummary(db, fetchRun.run_id),
      compatibility_summary: compatibilitySummary,
      compatibility_summary_field_parity: actorWatchCompatibilitySummaryFieldParity(compatibilitySummary),
      boundary_flags: boundaryFlags()
    };
  } catch (error) {
    const apiCounts = apiCountsForRun(db, fetchRun.run_id);
    repository.finalizeFetchRun(fetchRun.run_id, {
      discovered_refs: 0,
      already_cached: 0,
      expanded_new: 0,
      failed_expansions: 1,
      activity_events_written: 0,
      api_calls_zkill: apiCounts.zkill,
      api_calls_esi: apiCounts.esi
    }, 'failed', error.message);
    throw error;
  }
}

async function buildEvidencePackageFromRefsWithFatalTransport({ refs, repository, esiClient, run, discoveredBy }) {
  const output = {
    run: {
      run_id: run.run_id,
      source_type: run.source_type,
      source_id: run.source_id,
      started_at: run.started_at,
      finished_at: null,
      discovered_refs: refs.length,
      already_cached: 0,
      expanded_count: 0,
      failed_count: 0,
      warnings: []
    },
    killmails: [],
    activity_events: [],
    entity_updates: [],
    type_updates: [],
    ingestion_audits: [],
    warnings: []
  };

  for (const ref of refs) {
    if (repository.hasKillmail(ref.killmail_id)) {
      output.run.already_cached += 1;
      continue;
    }
    try {
      const rawKillmail = await esiClient.expandKillmail(ref.killmail_id, ref.hash);
      const normalized = normalizeKillmail(rawKillmail, {
        killmailHash: ref.hash,
        discoveredBy
      });
      output.killmails.push(normalized.killmail);
      output.activity_events.push(...normalized.activity_events);
      output.entity_updates.push(...normalized.entity_updates);
      output.ingestion_audits.push(normalized.ingestion_audit);
      output.warnings.push(...normalized.warnings);
      output.run.expanded_count += 1;
    } catch (error) {
      if (isFatalTransportError(error)) {
        throw error;
      }
      if (isProviderCapacityError(error)) {
        output.warnings.push({
          killmail_id: ref.killmail_id,
          warning_type: 'provider_capacity_deferred',
          message: error.message,
          created_at: new Date().toISOString()
        });
        continue;
      }
      output.run.failed_count += 1;
      output.warnings.push({
        killmail_id: ref.killmail_id,
        warning_type: 'failed_expansion',
        message: error.message,
        created_at: new Date().toISOString()
      });
    }
  }
  return output;
}

function isFatalTransportError(error) {
  return error?.code === 'HTTP_CANCELLED' ||
    error?.code === 'TASK_CANCELLED' ||
    error?.code === 'HTTP_TIMEOUT' ||
    error?.name === 'AbortError' ||
    error?.name === 'TimeoutError';
}

function isProviderCapacityError(error) {
  return error?.code === 'PROVIDER_CAPACITY_DEFERRED' ||
    error?.code === 'HTTP_RETRYABLE_CAPACITY' ||
    [420, 429, 503].includes(Number(error?.statusCode || error?.status_code));
}

function createScenarioFetch(scenario) {
  const state = { zkill: 0, esi: 0 };
  const fn = async (endpoint, options = {}) => {
    if (endpoint.includes('zkillboard.com')) {
      state.zkill += 1;
      return scenario.zkill(endpoint, options, state.zkill);
    }
    if (endpoint.includes('esi.evetech.net')) {
      state.esi += 1;
      return scenario.esi(endpoint, options, state.esi);
    }
    throw new Error(`Unexpected fixture endpoint: ${endpoint}`);
  };
  fn.invocations = () => ({ ...state });
  return fn;
}

function successScenario() {
  return baseScenario({
    entityId: 90043801,
    entityName: 'HS438 Success Actor',
    zkill: () => response(200, zkillRows([ref(400438001, 'hs438success001')])),
    esi: () => response(200, rawKillmail(400438001))
  });
}

function capacityScenario() {
  return baseScenario({
    entityId: 90043802,
    entityName: 'HS438 Capacity Actor',
    maxExpansions: 1,
    zkill: () => response(200, zkillRows([ref(400438002, 'hs438capacity002')])),
    esi: (_endpoint, _options, attempt) => response(429, { error: 'rate limited' }, {
      'retry-after': attempt === 1 ? '0.001' : null
    })
  });
}

function terminalEsiScenario() {
  return baseScenario({
    entityId: 90043803,
    entityName: 'HS438 Terminal Actor',
    maxExpansions: 1,
    zkill: () => response(200, zkillRows([ref(400438003, 'hs438terminal003')])),
    esi: () => response(500, { error: 'terminal fixture failure' })
  });
}

function invalidJsonScenario() {
  return baseScenario({
    entityId: 90043804,
    entityName: 'HS438 Invalid Json Actor',
    maxExpansions: 1,
    zkill: () => response(200, zkillRows([ref(400438004, 'hs438invalid004')])),
    esi: () => textResponse(200, '{')
  });
}

function cancellationScenario() {
  return baseScenario({
    entityId: 90043805,
    entityName: 'HS438 Cancelled Actor',
    maxExpansions: 1,
    zkill: () => response(200, zkillRows([ref(400438005, 'hs438cancel005')])),
    esi: () => {
      const error = new Error('HTTP request cancelled');
      error.name = 'AbortError';
      throw error;
    }
  });
}

function timeoutScenario() {
  return baseScenario({
    entityId: 90043806,
    entityName: 'HS438 Timeout Actor',
    maxExpansions: 1,
    timeoutMs: 5,
    zkill: () => response(200, zkillRows([ref(400438006, 'hs438timeout006')])),
    esi: (_endpoint, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const error = new Error('aborted by timeout');
        error.name = 'AbortError';
        reject(error);
      }, { once: true });
    })
  });
}

function zkillFailureScenario() {
  return baseScenario({
    entityId: 90043807,
    entityName: 'HS438 zKill Failure Actor',
    maxExpansions: 1,
    zkill: () => response(500, { error: 'zkill fixture failure' }),
    esi: () => response(200, rawKillmail(400438007))
  });
}

function baseScenario(overrides) {
  return {
    maxRefs: 3,
    maxExpansions: 2,
    maxAttempts: 2,
    timeoutMs: 50,
    ...overrides
  };
}

function response(status, body, headers = {}) {
  return textResponse(status, JSON.stringify(body), headers);
}

function textResponse(status, text, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        const value = headers[String(name).toLowerCase()];
        return value === undefined ? null : value;
      }
    },
    async text() {
      return text;
    }
  };
}

function zkillRows(refs) {
  return refs.map((item) => ({
    killmail_id: item.killmail_id,
    zkb: { hash: item.hash },
    killmail_time: '2026-06-12T00:00:00Z',
    solar_system_id: 30003597,
    victim: { character_id: 90043801 },
    attackers: []
  }));
}

function rawKillmail(killmailId) {
  return {
    killmail_id: killmailId,
    killmail_time: '2026-06-12T00:00:00Z',
    solar_system_id: 30003597,
    victim: {
      character_id: 90043801,
      character_name: 'HS438 Fixture Victim',
      corporation_id: 98043801,
      corporation_name: 'HS438 Fixture Victim Corp',
      alliance_id: 99043801,
      alliance_name: 'HS438 Fixture Victim Alliance',
      ship_type_id: 587,
      ship_type_name: 'Rifter'
    },
    attackers: [{
      character_id: 90043802,
      character_name: 'HS438 Fixture Attacker',
      corporation_id: 98043802,
      corporation_name: 'HS438 Fixture Attackers',
      alliance_id: 99043802,
      alliance_name: 'HS438 Fixture Coalition',
      ship_type_id: 603,
      ship_type_name: 'Merlin',
      weapon_type_id: 2488,
      damage_done: 1200,
      final_blow: true
    }]
  };
}

function apiLogs(db, runId = null) {
  const sql = `
    SELECT provider, endpoint, method, status_code, retry_count, rate_limited, error_message
    FROM api_request_logs
    ${runId ? 'WHERE run_id = ?' : ''}
    ORDER BY requested_at, request_id
  `;
  return runId ? db.prepare(sql).all(runId) : db.prepare(sql).all();
}

function apiLogSummary(db, runId = null) {
  return apiLogs(db, runId).map((row) => ({
    provider: row.provider,
    status_code: row.status_code,
    retry_count: Number(row.retry_count || 0),
    rate_limited: Number(row.rate_limited || 0) === 1,
    has_error_message: Boolean(row.error_message)
  }));
}

function apiCountsForRun(db, runId) {
  const rows = db.prepare(`
    SELECT provider, COUNT(*) AS count
    FROM api_request_logs
    WHERE run_id = ?
    GROUP BY provider
  `).all(runId);
  const counts = { zkill: 0, esi: 0 };
  for (const row of rows) {
    counts[row.provider] = Number(row.count);
  }
  return counts;
}

function discoveryStatusCounts(db) {
  const rows = db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM discovered_killmail_refs
    GROUP BY status
    ORDER BY status
  `).all();
  return Object.fromEntries(rows.map((row) => [row.status, Number(row.count)]));
}

function latestFetchRun(db) {
  return db.prepare('SELECT * FROM fetch_runs ORDER BY started_at DESC, run_id DESC LIMIT 1').get() || null;
}

function stateSnapshot(db) {
  return {
    fetch_runs: count(db, 'fetch_runs'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    entities: count(db, 'entities'),
    ingestion_audits: count(db, 'ingestion_audits'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    api_request_logs: count(db, 'api_request_logs'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches'),
    metadata_runs: count(db, 'metadata_runs'),
    assessment_artifacts: count(db, 'assessment_artifacts')
  };
}

function mutationProof(before, after) {
  return {
    before,
    after,
    deltas: Object.fromEntries(Object.keys(after).map((key) => [key, after[key] - (before[key] || 0)])),
    operator_corpus_mutated: false
  };
}

function boundaryFlags() {
  return {
    fake_fetch_impl_only: true,
    live_provider_called: false,
    manual_synthetic_api_logs: false,
    mixed_collector_invoked: false,
    production_actor_watch_redirected: false,
    runActorWatchService_changed: false,
    watchExecutor_dispatchFor_changed: false,
    operator_db_written: false,
    hydration_written: false,
    observation_path_touched: false,
    schema_changed: false
  };
}

function ref(killmailId, hash) {
  return { killmail_id: Number(killmailId), hash };
}

function count(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count || 0);
}

module.exports = {
  ACTION,
  buildActorWatchTransportFailureParityProof,
  runActorWatchTransportParityDirectBody
};
