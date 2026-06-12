const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildDiscoveryOutcomeDerivationPreview } = require('../src/main/services/discoveryOutcomeDerivationService');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');

const START = '2026-06-07T00:00:00.000Z';
const FINISH = '2026-06-07T00:01:00.000Z';

async function main() {
  await verifyCase('actor refs found', insertActorRefsFound, verifyActorRefsFound);
  await verifyCase('actor no refs coarse', insertActorNoRefs, verifyActorNoRefs);
  await verifyCase('system refs found packet gap', insertSystemPartialRefs, verifySystemPartialRefs);
  await verifyCase('provider deferred not normalized', insertProviderDeferred, verifyProviderDeferred);
  await verifyCase('acquisition capped summary', insertAcquisitionCapped, verifyAcquisitionCapped);
  await verifyCase('ESI context outside Discovery', insertEsiExpansionContext, verifyEsiContext);
  await verifyCase('no durable packet rows', insertSystemPartialRefs, verifyNoPacketRows);
  await verifyExternalIoHeldPosture();
  await verifyServiceCommand();

  const sample = await sampleOutput();
  console.log(JSON.stringify({
    status: 'Discovery outcome derivation validated',
    command: 'discovery.outcome_derivation.preview',
    sample
  }, null, 2));
  console.log('Discovery outcome derivation validated');
}

async function verifyCase(label, insertRows, verifier) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertRows(db);
    const before = sideEffectCounts(db);
    const proof = buildDiscoveryOutcomeDerivationPreview(db);
    const after = sideEffectCounts(db);
    verifyBoundary(proof, label);
    verifier(proof);
    assertSame(after, before, `${label} should not mutate local rows`);
    assert(proof.table_mutation_proof.unchanged === true, `${label} should include unchanged table proof`);
  } finally {
    closeDatabase(db);
  }
}

async function verifyServiceCommand() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertActorRefsFound(db);
    const before = sideEffectCounts(db);
    const result = await invokeServiceCommand('discovery.outcome_derivation.preview', {}, { db });
    const after = sideEffectCounts(db);
    verifyActorRefsFound(result);
    assertSame(after, before, 'service command should not mutate local rows');
  } finally {
    closeDatabase(db);
  }
}

async function verifyExternalIoHeldPosture() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertActorNoRefs(db, { runId: 'run_held', apiCallsZkill: 0 });
    const proof = buildDiscoveryOutcomeDerivationPreview(db, { externalIoState: 'off' });
    const row = byRun(proof, 'run_held');
    assert(row.task_level_derived_outcome === 'held_by_external_io', 'External I/O off should expose held posture');
    assert(row.missing_basis_flags.includes('held_by_external_io_posture_only'), 'held posture should be flagged as posture-only');
  } finally {
    closeDatabase(db);
  }
}

async function sampleOutput() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertActorRefsFound(db);
    insertSystemPartialRefs(db);
    insertEsiExpansionContext(db);
    const proof = buildDiscoveryOutcomeDerivationPreview(db);
    return {
      summary: proof.summary,
      packet_level_derivability: proof.packet_level_derivability,
      outcome_candidates: proof.outcome_candidates.map((row) => ({
        run_id: row.run_id,
        source_intent_kind: row.source_intent_kind,
        approximate_scope_key: row.approximate_scope_key,
        task_level_derived_outcome: row.task_level_derived_outcome,
        task_level_confidence: row.task_level_confidence,
        discovered_ref_count: row.discovered_ref_count,
        zkill_api_call_count: row.zkill_api_call_count,
        esi_api_call_count: row.esi_api_call_count,
        missing_basis_flags: row.missing_basis_flags
      }))
    };
  } finally {
    closeDatabase(db);
  }
}

function verifyActorRefsFound(proof) {
  const row = byRun(proof, 'run_actor_refs');
  assert(row.source_intent_kind === 'actor_watch', 'actor source kind should derive');
  assert(row.watch_id === '1', 'actor Watch ID should derive');
  assert(row.approximate_scope_key === 'actor:character:90000001', 'actor scope key should derive from refs');
  assert(row.task_level_derived_outcome === 'complete_refs_found', 'actor refs should derive complete_refs_found');
  assert(row.task_level_confidence === 'medium', 'actor refs should have medium task confidence');
  assert(row.discovered_ref_count === 2, 'actor ref count should derive');
  assert(row.candidate_ref_handles.length === 2, 'actor candidate handles should be sampled');
  assert(row.zkill_api_call_count === 1, 'actor zKill call count should derive');
  assert(row.esi_api_call_count === 0, 'actor ESI count should be zero');
  assert(row.missing_basis_flags.includes('packet_outcome_not_proven'), 'actor packet gap should be explicit');
  assert(row.boundary_flags.candidate_refs_are_not_task_memory === true, 'refs should not become task memory');
}

function verifyActorNoRefs(proof) {
  const row = byRun(proof, 'run_actor_no_refs');
  assert(row.task_level_derived_outcome === 'complete_no_refs', 'actor no-ref run should derive complete_no_refs');
  assert(row.task_level_confidence === 'medium', 'actor no-ref confidence should be medium');
  assert(row.discovered_ref_count === 0, 'no-ref run should report zero refs');
  assert(row.missing_basis_flags.includes('no_ref_not_represented'), 'no-ref missing basis should be explicit');
}

function verifySystemPartialRefs(proof) {
  const row = byRun(proof, 'run_system_partial');
  assert(row.source_intent_kind === 'system_radius_watch', 'system source kind should derive');
  assert(row.task_level_derived_outcome === 'complete_refs_found', 'system found refs should derive coarse complete_refs_found');
  assert(row.task_level_confidence === 'low', 'system/radius confidence should be low without packet rows');
  assert(row.packet_level_derivability.packet_outcomes_proven === false, 'system packet outcomes should not be proven');
  assert(row.missing_basis_flags.includes('system_radius_no_per_packet_completion_rows'), 'system/radius packet gap should be explicit');
  assert(row.candidate_ref_handles.some((ref) => ref.source_system_id === 30003597), 'system candidate should preserve source system');
}

function verifyProviderDeferred(proof) {
  const row = byRun(proof, 'run_provider_deferred');
  assert(row.task_level_derived_outcome === 'provider_deferred', 'zKill rate-limit posture should derive provider_deferred');
  assert(row.task_level_confidence === 'low', 'provider deferred confidence should be low');
  assert(row.missing_basis_flags.includes('provider_deferred_not_normalized'), 'provider deferral should be missing normalized basis');
}

function verifyAcquisitionCapped(proof) {
  const row = byRun(proof, 'run_acquisition_capped');
  assert(row.task_level_derived_outcome === 'acquisition_capped', 'acquisition cap posture should derive acquisition_capped');
  assert(row.missing_basis_flags.includes('cap_basis_summary_only'), 'cap basis should be summary-only');
}

function verifyEsiContext(proof) {
  const row = byRun(proof, 'run_esi_context');
  assert(row.esi_api_call_count === 2, 'ESI call count should derive as context');
  assert(row.esi_context.outside_discovery_completion === true, 'ESI context should be outside Discovery completion');
  assert(row.esi_context.expansion_rows_present === true, 'ESI expansion/ref lifecycle rows should be detected');
  assert(row.missing_basis_flags.includes('esi_expansion_not_discovery_completion'), 'ESI expansion should be flagged outside Discovery');
  assert(row.boundary_flags.discovery_completion_not_evidence_completion === true, 'Discovery completion must not mean Evidence completion');
}

function verifyNoPacketRows(proof) {
  assert(proof.packet_level_derivability.packet_rows_present === false, 'durable packet rows should not be claimed');
  assert(proof.packet_level_derivability.product_grade_packet_outcomes_derivable === false, 'product-grade packet outcomes should not be derivable');
  assert(proof.packet_level_derivability.missing_basis_flags.includes('packet_outcome_not_proven'), 'packet gap should be top-level');
}

function verifyBoundary(proof, label) {
  assert(proof.read_only === true, `${label} should be read-only`);
  assert(proof.mutates_state === false, `${label} should not mutate state`);
  assert(proof.renderer_eligible === true, `${label} should be renderer eligible`);
  assert(proof.provider_calls === 0, `${label} should not call providers`);
  assert(proof.live_api_calls === 0, `${label} should not make live/API calls`);
  assert(proof.zkill_calls === 0, `${label} should not call zKill`);
  assert(proof.esi_calls === 0, `${label} should not call ESI`);
  assert(proof.watch_execution === false, `${label} should not execute Watch`);
  assert(proof.watch_dispatches === 0, `${label} should not dispatch Watch`);
  assert(proof.collectors_called === false, `${label} should not call collectors`);
  assert(proof.tasks_created === 0, `${label} should not create tasks`);
  assert(proof.queue_created === false, `${label} should not create queue`);
  assert(proof.dispatcher_created === false, `${label} should not create dispatcher`);
  assert(proof.task_packet_schema_created === false, `${label} should not create task/packet schema`);
  assert(proof.discovery_refs_written === false, `${label} should not write Discovery refs`);
  assert(proof.discovered_killmail_refs_written === 0, `${label} should not write discovered_killmail_refs`);
  assert(proof.discovery_refs_mutated === 0, `${label} should not mutate Discovery refs`);
  assert(proof.evidence_writes === 0, `${label} should not write Evidence/EVEidence`);
  assert(proof.hydration_writes === 0, `${label} should not write Hydration`);
  assert(proof.api_request_log_writes === 0, `${label} should not write API logs`);
  assert(proof.data_quality_warning_writes === 0, `${label} should not write warnings`);
  assert(proof.watch_mutations === 0, `${label} should not mutate Watch rows`);
  assert(proof.schema_changes === 0, `${label} should not change schema`);
  assert(proof.support_artifacts_created === 0, `${label} should not create support artifacts`);
  assert(proof.runtime_enforcement_active === false, `${label} should not activate enforcement`);
  assert(proof.command_blocking_active === false, `${label} should not block commands`);
  for (const outcome of proof.outcome_candidates.map((row) => row.task_level_derived_outcome)) {
    assert(proof.outcome_vocabulary.includes(outcome), `derived outcome ${outcome} should be in accepted vocabulary`);
  }
}

function byRun(proof, runId) {
  const row = proof.outcome_candidates.find((entry) => entry.run_id === runId);
  assert(Boolean(row), `expected outcome row for ${runId}`);
  return row;
}

function insertActorRefsFound(db) {
  insertRun(db, {
    run_id: 'run_actor_refs',
    trigger: 'watch_executor',
    watch_type: 'actor',
    watch_id: '1',
    discovered_refs: 2,
    api_calls_zkill: 1
  });
  insertRef(db, { killmail_id: 910001, hash: 'actor_hash_1', run_id: 'run_actor_refs', type: 'actor', id: 'character:90000001', source_actor_type: 'character', source_actor_id: 90000001 });
  insertRef(db, { killmail_id: 910002, hash: 'actor_hash_2', run_id: 'run_actor_refs', type: 'actor', id: 'character:90000001', source_actor_type: 'character', source_actor_id: 90000001 });
  insertApiLog(db, { run_id: 'run_actor_refs', provider: 'zkill', status_code: 200 });
}

function insertActorNoRefs(db, input = {}) {
  insertRun(db, {
    run_id: input.runId || 'run_actor_no_refs',
    trigger: 'watch_executor',
    watch_type: 'actor',
    watch_id: '2',
    discovered_refs: 0,
    api_calls_zkill: input.apiCallsZkill ?? 1
  });
}

function insertSystemPartialRefs(db) {
  insertRun(db, {
    run_id: 'run_system_partial',
    trigger: 'watch_executor',
    watch_type: 'system_radius',
    watch_id: '4',
    discovered_refs: 2,
    api_calls_zkill: 4
  });
  insertRef(db, { killmail_id: 920001, hash: 'system_hash_1', run_id: 'run_system_partial', type: 'system_radius', id: '30003597', source_system_id: 30003597 });
  insertRef(db, { killmail_id: 920002, hash: 'system_hash_2', run_id: 'run_system_partial', type: 'system_radius', id: '30003597', source_system_id: 30003599 });
}

function insertProviderDeferred(db) {
  insertRun(db, {
    run_id: 'run_provider_deferred',
    trigger: 'watch_executor',
    watch_type: 'actor',
    watch_id: '5',
    discovered_refs: 0,
    api_calls_zkill: 1,
    error_summary: 'zKill discovery provider deferred by rate limit'
  });
  insertApiLog(db, { run_id: 'run_provider_deferred', provider: 'zkill', status_code: 429, rate_limited: 1, error_message: 'zKill rate limited' });
  insertWarning(db, { run_id: 'run_provider_deferred', warning_type: 'actor_collection', message: 'zKill discovery failed for character 90000002: rate limited' });
}

function insertAcquisitionCapped(db) {
  insertRun(db, {
    run_id: 'run_acquisition_capped',
    trigger: 'watch_executor',
    watch_type: 'actor',
    watch_id: '6',
    discovered_refs: 5,
    api_calls_zkill: 1,
    error_summary: 'zKill acquisition cap reached at local max refs'
  });
  insertRef(db, { killmail_id: 930001, hash: 'cap_hash_1', run_id: 'run_acquisition_capped', type: 'actor', id: 'character:90000003', source_actor_type: 'character', source_actor_id: 90000003 });
}

function insertEsiExpansionContext(db) {
  insertRun(db, {
    run_id: 'run_esi_context',
    trigger: 'manual_expansion',
    watch_type: 'manual',
    watch_id: null,
    discovered_refs: 2,
    api_calls_zkill: 0,
    api_calls_esi: 2,
    expanded_new: 1,
    failed_expansions: 1
  });
  insertRef(db, { killmail_id: 940001, hash: 'esi_hash_1', run_id: 'run_esi_context', type: 'manual_actor', id: 'character:90000004', status: 'expanded' });
  insertRef(db, { killmail_id: 940002, hash: 'esi_hash_2', run_id: 'run_esi_context', type: 'manual_actor', id: 'character:90000004', status: 'failed' });
  insertApiLog(db, { run_id: 'run_esi_context', provider: 'esi', status_code: 200 });
  insertApiLog(db, { run_id: 'run_esi_context', provider: 'esi', status_code: 503, error_message: 'ESI provider capacity deferred' });
  insertWarning(db, { run_id: 'run_esi_context', warning_type: 'provider_capacity_deferred', message: 'ESI Evidence Expansion deferred by provider capacity' });
}

function insertRun(db, input) {
  db.prepare(`
    INSERT INTO fetch_runs (
      run_id, trigger, watch_type, watch_id, started_at, finished_at, status,
      discovered_refs, already_cached, expanded_new, failed_expansions,
      activity_events_written, api_calls_zkill, api_calls_esi, duration_ms, error_summary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.run_id,
    input.trigger,
    input.watch_type,
    input.watch_id,
    START,
    FINISH,
    input.status || 'success',
    input.discovered_refs || 0,
    input.already_cached || 0,
    input.expanded_new || 0,
    input.failed_expansions || 0,
    input.activity_events_written || 0,
    input.api_calls_zkill || 0,
    input.api_calls_esi || 0,
    60000,
    input.error_summary || null
  );
}

function insertRef(db, input) {
  db.prepare(`
    INSERT INTO discovered_killmail_refs (
      killmail_id, killmail_hash, discovered_by_type, discovered_by_id,
      source_scope, source_system_id, source_actor_type, source_actor_id,
      discovered_at, first_seen_run_id, last_seen_run_id, last_seen_at,
      status, priority, preview_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.killmail_id,
    input.hash,
    input.type,
    input.id,
    input.source_scope || null,
    input.source_system_id || null,
    input.source_actor_type || null,
    input.source_actor_id || null,
    START,
    input.run_id,
    input.run_id,
    FINISH,
    input.status || 'pending',
    0,
    null
  );
}

function insertApiLog(db, input) {
  db.prepare(`
    INSERT INTO api_request_logs (
      request_id, run_id, run_type, provider, endpoint, method, status_code,
      duration_ms, cache_status, retry_count, rate_limited, error_message, requested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `request_${input.run_id}_${input.provider}_${input.status_code}_${count(db, 'api_request_logs')}`,
    input.run_id,
    'collection',
    input.provider,
    `/${input.provider}/fixture`,
    'GET',
    input.status_code || null,
    10,
    null,
    input.retry_count || 0,
    input.rate_limited || 0,
    input.error_message || null,
    START
  );
}

function insertWarning(db, input) {
  db.prepare(`
    INSERT INTO data_quality_warnings (
      warning_id, run_id, killmail_id, warning_type, message, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    `warning_${input.run_id}_${count(db, 'data_quality_warnings')}`,
    input.run_id,
    input.killmail_id || null,
    input.warning_type,
    input.message,
    START
  );
}

function sideEffectCounts(db) {
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

function count(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count || 0);
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
