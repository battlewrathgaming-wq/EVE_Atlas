const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildDiscoveryIntakeConsumerStubCandidateProof } = require('../src/main/services/discoveryIntakeConsumerStubCandidateService');

const NOW = '2026-06-06T21:00:00.000Z';
const ACCEPTED_IDS = [30003597, 30003599, 30003601];

async function main() {
  const originalLive = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  try {
    await verifyCase('due actor stub candidates', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifyActorCandidates);
    await verifyCase('due system/radius stub candidates', insertSystemOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifySystemCandidates);
    await verifyCase('invalid stored scope no stub candidates', insertInvalidSystemOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, (proof) => verifyNoCandidates(proof, 'watch_scope_authority_invalid'));
    await verifyCase('disarmed no stub candidates', insertActorOnly, {
      sessionArmed: false,
      liveApiEnabled: true
    }, (proof) => verifyNoCandidates(proof, 'session_not_armed'));
    await verifyCase('active task no stub candidates', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      activeTaskId: 'task-1',
      activeTaskPresent: true
    }, (proof) => verifyNoCandidates(proof, 'active_task'));
    await verifyCase('live gate no stub candidates', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: false
    }, (proof) => verifyNoCandidates(proof, 'live_api_disabled'));
    await verifyCase('no due idles without stub candidates', insertWaitingOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, (proof) => verifyNoCandidates(proof, 'no_due_watches'));
    await verifyCase('inactive not-due backoff no stub candidates', insertWaitingOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifyWaitingRows);

    console.log(JSON.stringify({
      status: 'Discovery intake consumer stub candidates validated',
      helper: 'buildDiscoveryIntakeConsumerStubCandidateProof',
      cases: [
        'due_actor_stub_candidates',
        'due_system_radius_stub_candidates',
        'invalid_stored_scope_no_stub_candidates',
        'disarmed_no_stub_candidates',
        'active_task_no_stub_candidates',
        'live_gate_no_stub_candidates',
        'no_due_no_stub_candidates',
        'inactive_not_due_backoff_no_stub_candidates'
      ],
      sample_actor_stub_candidates: await sample(insertActorOnly),
      sample_system_radius_stub_candidates: await sample(insertSystemOnly),
      sample_invalid_scope: await sample(insertInvalidSystemOnly)
    }, null, 2));
  } finally {
    if (originalLive === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = originalLive;
    }
  }
  console.log('Discovery intake consumer stub candidates validated');
}

async function verifyCase(label, insertRows, input, verifier) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertRows(db);
    const before = sideEffectCounts(db);
    const proof = buildDiscoveryIntakeConsumerStubCandidateProof(db, {
      now: NOW,
      ...input
    });
    const after = sideEffectCounts(db);
    verifier(proof);
    verifyNoProviderNoWriteBoundary(proof, label);
    assertSame(after, before, `${label} should not mutate persistent tables`);
    assert(proof.table_mutation_proof.unchanged === true, `${label} should include unchanged table proof`);
  } finally {
    closeDatabase(db);
  }
}

async function sample(insertRows) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertRows(db);
    const proof = buildDiscoveryIntakeConsumerStubCandidateProof(db, {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true
    });
    return {
      candidate_output_status: proof.candidate_output_status,
      candidate_output_reason: proof.candidate_output_reason,
      candidate_refs_emitted: proof.candidate_refs_emitted,
      candidate_refs: proof.candidate_refs,
      source_bus_input_proof: proof.source_bus_input_proof,
      table_mutation_proof: proof.table_mutation_proof
    };
  } finally {
    closeDatabase(db);
  }
}

function verifyActorCandidates(proof) {
  assert(proof.candidate_output_status === 'emitted_stub_candidate_refs', 'actor should emit stub candidate refs');
  assert(proof.candidate_refs.length >= 1, 'actor should emit one or more candidates');
  assert(proof.source_bus_input_proof.bus_input_envelope_emitted === true, 'actor should come from bus input');
  for (const candidate of proof.candidate_refs) {
    verifyCommonCandidate(candidate, 'actor');
    assert(candidate.killmail_id, 'actor candidate should include killmail ID');
    assert(candidate.killmail_hash, 'actor candidate should include killmail hash');
    assert(candidate.scope_key === 'actor:character:90000001', 'actor candidate scope key should match');
    assert(candidate.watch_id === 1, 'actor candidate Watch ID should match');
    assert(candidate.entity_type === 'character', 'actor entity type should match');
    assert(candidate.entity_id === 90000001, 'actor entity ID should match');
    assert(candidate.entity_name === 'Stub Candidate Pilot', 'actor entity name should be preserved');
    assert(candidate.lookback_seconds === 14 * 86400, 'actor lookback should match');
    assert(candidate.caps.max_refs === 5, 'actor caps should preserve max refs');
  }
}

function verifySystemCandidates(proof) {
  assert(proof.candidate_output_status === 'emitted_stub_candidate_refs', 'system should emit stub candidate refs');
  assert(proof.candidate_refs.length >= 1, 'system should emit one or more candidates');
  assert(proof.source_bus_input_proof.bus_input_envelope_emitted === true, 'system should come from bus input');
  for (const candidate of proof.candidate_refs) {
    verifyCommonCandidate(candidate, 'system_radius');
    assert(candidate.killmail_id, 'system candidate should include killmail ID');
    assert(candidate.killmail_hash, 'system candidate should include killmail hash');
    assert(candidate.scope_key === 'system:30003597:radius:1', 'system candidate scope key should match');
    assertSame(candidate.accepted_system_ids, ACCEPTED_IDS, 'system accepted IDs should be preserved');
    assert(ACCEPTED_IDS.includes(candidate.candidate_system_id), 'candidate system should come from accepted scope');
    assert(candidate.accepted_scope_source === 'stored_watch_scope', 'accepted scope source should match');
    assert(candidate.center_system_id === 30003597, 'center should be provenance');
    assert(candidate.radius_jumps === 1, 'radius should be provenance');
    assert(candidate.center_radius_role === 'provenance_and_management', 'center/radius role should match');
    assert(candidate.center_radius_used_as_authority === false, 'center/radius should not be authority');
    assert(candidate.lookback_seconds === 24 * 3600, 'system lookback should match');
    assert(candidate.caps.max_systems === ACCEPTED_IDS.length, 'system caps should preserve max systems');
  }
}

function verifyCommonCandidate(candidate, sourceKind) {
  assert(candidate.provider === 'zkill_stub', 'candidate provider should be local zKill stub');
  assert(candidate.source_lane === 'watch', 'candidate source lane should be watch');
  assert(candidate.source_kind === sourceKind, 'candidate source kind should match');
  assert(candidate.task_context.fixture_only === true, 'candidate task context should be fixture-only');
  assert(candidate.task_context.handler_attached === false, 'candidate should not attach handler');
  assert(candidate.task_context.handler_invoked === false, 'candidate should not invoke handler');
  assert(candidate.candidate_only === true, 'candidate should be candidate-only');
  assert(candidate.stub_only === true, 'candidate should be stub-only');
  assert(candidate.durable_ref_written === false, 'candidate should not be durable ref');
  assert(candidate.evidence_created === false, 'candidate should not be Evidence');
  assert(candidate.provider_movement === false, 'candidate should not move providers');
  assert(candidate.provenance.source_action === 'discovery.intake_consumer_stub_candidates_proof', 'provenance should name stub proof');
  assert(candidate.provenance.stub_source === 'local_fixture_candidate', 'candidate should use local fixture source');
}

function verifyNoCandidates(proof, reason) {
  assert(proof.candidate_refs_emitted === 0, 'blocked/idle state should emit no candidates');
  assert(proof.candidate_refs.length === 0, 'blocked/idle state should have empty candidate list');
  assert(proof.candidate_output_status === 'blocked_no_candidate_refs', 'blocked/idle state should state no candidates');
  assert(proof.candidate_output_reason === reason, `expected no-candidate reason ${reason}, got ${proof.candidate_output_reason}`);
  if (reason === 'watch_scope_authority_invalid') {
    assert(proof.invalid_stored_scope_blocks_before_candidates === true, 'invalid scope should block before candidates');
  }
}

function verifyWaitingRows(proof) {
  verifyNoCandidates(proof, 'no_due_watches');
  assert(proof.source_bus_input_proof.bus_input_envelope_emitted === false, 'waiting rows should not create bus input');
}

function verifyNoProviderNoWriteBoundary(proof, label) {
  assert(proof.read_only === true, `${label} should be read-only`);
  assert(proof.mutates_state === false, `${label} should not mutate state`);
  assert(proof.fixture_only_source === true, `${label} should use fixture-only source`);
  assert(proof.renderer_eligible === false, `${label} should not be renderer eligible`);
  assert(proof.provider_movement === false, `${label} should not move providers`);
  assert(proof.watch_execution === false, `${label} should not execute Watch`);
  assert(proof.dispatch_runner_invoked === false, `${label} should not invoke dispatch runner`);
  assert(proof.dispatch_runner_invocations === 0, `${label} should not invoke dispatch runners`);
  assert(proof.collectors_called === false, `${label} should not call collectors`);
  assert(proof.provider_calls === 0, `${label} should not call providers`);
  assert(proof.live_api_calls === 0, `${label} should not make live/API calls`);
  assert(proof.zkill_calls === 0, `${label} should not call zKill`);
  assert(proof.esi_calls === 0, `${label} should not call ESI`);
  assert(proof.durable_discovery_refs_written === false, `${label} should not write durable Discovery refs`);
  assert(proof.discovery_refs_written === false, `${label} should not write Discovery refs`);
  assert(proof.discovered_killmail_refs_written === 0, `${label} should not write discovered_killmail_refs`);
  assert(proof.discovery_refs_mutated === 0, `${label} should not mutate Discovery refs`);
  assert(proof.evidence_created === false, `${label} should not create Evidence`);
  assert(proof.evidence_written === false, `${label} should not write Evidence/EVEidence`);
  assert(proof.evidence_writes === 0, `${label} should not write Evidence rows`);
  assert(proof.hydration_writes === 0, `${label} should not write Hydration output`);
  assert(proof.metadata_writes === 0, `${label} should not write metadata`);
  assert(proof.api_request_log_writes === 0, `${label} should not write API logs`);
  assert(proof.data_quality_warning_writes === 0, `${label} should not write data quality rows`);
  assert(proof.watch_mutations === 0, `${label} should not mutate Watch rows`);
  assert(proof.schema_changes === 0, `${label} should not change schema`);
  assert(proof.support_artifacts_created === 0, `${label} should not create support artifacts`);
  assert(proof.runtime_enforcement_active === false, `${label} should not activate enforcement`);
  assert(proof.command_blocking_active === false, `${label} should not activate command blocking`);
  assert(proof.ui_work === false, `${label} should not do UI work`);
  assert(proof.broad_provider_queue_created === false, `${label} should not create broad provider queue`);
  assert(proof.durable_watch_result_created === false, `${label} should not create durable Watch result`);
  assert(proof.relationship_tags_written === 0, `${label} should not write relationship tags`);
  assert(proof.fourth_lane_opened === false, `${label} should not open fourth lane`);
  assert(proof.accepted_model.stub_candidate_refs_are_durable_discovery_refs === false, `${label} should not treat stub candidates as durable refs`);
  assert(proof.accepted_model.stub_candidate_refs_are_evidence === false, `${label} should not treat stub candidates as Evidence`);
  assert(proof.accepted_model.watch_only_intake_model === false, `${label} should not define Watch-only intake`);
}

function insertActorOnly(db) {
  insertActorWatch(db, { watchId: 1 });
}

function insertSystemOnly(db) {
  insertSystemWatch(db, { watchId: 1, includedSystemIds: JSON.stringify(ACCEPTED_IDS) });
}

function insertInvalidSystemOnly(db) {
  insertSystemWatch(db, { watchId: 1, includedSystemIds: '[30003597,"bad"]' });
}

function insertWaitingOnly(db) {
  insertActorWatch(db, { watchId: 1, nextPollAt: '2026-06-06T22:00:00.000Z' });
  insertSystemWatch(db, {
    watchId: 1,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    backoffUntil: '2026-06-06T21:30:00.000Z'
  });
  insertSystemWatch(db, {
    watchId: 2,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    isActive: 0
  });
}

function insertActorWatch(db, input = {}) {
  db.prepare(`
    INSERT INTO watchlist_entities (
      watch_id, entity_type, entity_id, entity_name,
      lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.watchId,
    input.entityType || 'character',
    input.entityId || 90000001,
    input.entityName || 'Stub Candidate Pilot',
    14,
    input.maxKillmailsPerRun || 5,
    input.isActive ?? 1,
    60,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS342 stub candidate fixture'
  );
}

function insertSystemWatch(db, input = {}) {
  db.prepare(`
    INSERT INTO system_watches (
      watch_id, center_system_id, center_system_name, radius_jumps,
      included_system_ids, excluded_system_ids,
      lookback_hours, max_systems_per_run, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.watchId,
    30003597,
    'Hare',
    1,
    input.includedSystemIds,
    '[]',
    24,
    35,
    input.maxKillmailsPerRun || 6,
    input.isActive ?? 1,
    45,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS342 stub candidate fixture'
  );
}

function sideEffectCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    metadata_runs: count(db, 'metadata_runs'),
    ingestion_audits: count(db, 'ingestion_audits'),
    assessment_artifacts: count(db, 'assessment_artifacts'),
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
