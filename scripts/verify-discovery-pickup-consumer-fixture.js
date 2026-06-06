const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildDiscoveryPickupConsumerFixtureProof } = require('../src/main/services/discoveryPickupConsumerFixtureService');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');

const NOW = '2026-06-06T23:00:00.000Z';
const ACCEPTED_IDS = [30003597, 30003599, 30003601, 30003602];

async function main() {
  const originalLive = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  try {
    await verifyCase('due actor fixture candidates', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifyActorCandidates);
    await verifyCase('due system/radius fixture candidates', insertSystemOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifySystemCandidates);
    await verifyCase('invalid stored scope no fixture candidates', insertInvalidSystemOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, (proof) => verifyNoCandidates(proof, 'watch_scope_authority_invalid'));
    await verifyCase('disarmed no fixture candidates', insertActorOnly, {
      sessionArmed: false,
      liveApiEnabled: true
    }, (proof) => verifyNoCandidates(proof, 'session_not_armed'));
    await verifyCase('active task no fixture candidates', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      activeTaskId: 'task-1',
      activeTaskPresent: true
    }, (proof) => verifyNoCandidates(proof, 'active_task'));
    await verifyCase('live disabled no fixture candidates', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: false
    }, (proof) => verifyNoCandidates(proof, 'live_api_disabled'));
    await verifyCase('no due no fixture candidates', insertWaitingOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, (proof) => verifyNoCandidates(proof, 'no_due_watches'));
    await verifyCase('inactive not-due backoff no fixture candidates', insertWaitingOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifyWaitingRows);
    await verifyServiceCommand();

    console.log(JSON.stringify({
      status: 'Discovery pickup consumer fixture validated',
      command: 'discovery.pickup_consumer_fixture.preview',
      helper: 'buildDiscoveryPickupConsumerFixtureProof',
      cases: [
        'due_actor_fixture_candidates',
        'due_system_radius_fixture_candidates',
        'invalid_stored_scope_no_fixture_candidates',
        'disarmed_no_fixture_candidates',
        'active_task_no_fixture_candidates',
        'live_disabled_no_fixture_candidates',
        'no_due_no_fixture_candidates',
        'inactive_not_due_backoff_no_fixture_candidates',
        'service_command_preview'
      ],
      sample_actor_candidates: await sample(insertActorOnly),
      sample_system_radius_candidates: await sample(insertSystemOnly),
      sample_invalid_scope: await sample(insertInvalidSystemOnly)
    }, null, 2));
  } finally {
    if (originalLive === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = originalLive;
    }
  }
  console.log('Discovery pickup consumer fixture validated');
}

async function verifyCase(label, insertRows, input, verifier) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertRows(db);
    const before = sideEffectCounts(db);
    const proof = buildDiscoveryPickupConsumerFixtureProof(db, {
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

async function verifyServiceCommand() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertActorOnly(db);
    const before = sideEffectCounts(db);
    const result = await invokeServiceCommand('discovery.pickup_consumer_fixture.preview', {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true
    }, { db });
    const after = sideEffectCounts(db);
    verifyActorCandidates(result);
    assertSame(after, before, 'service command should not mutate persistent tables');
  } finally {
    closeDatabase(db);
  }
}

async function sample(insertRows) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertRows(db);
    const proof = buildDiscoveryPickupConsumerFixtureProof(db, {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true
    });
    return {
      consumer_status: proof.consumer_status,
      consumer_reason: proof.consumer_reason,
      pickup_packets_consumed: proof.pickup_packets_consumed,
      candidate_refs_emitted: proof.candidate_refs_emitted,
      candidate_refs: proof.candidate_refs,
      source_pickup_proof: proof.source_pickup_proof,
      table_mutation_proof: proof.table_mutation_proof
    };
  } finally {
    closeDatabase(db);
  }
}

function verifyActorCandidates(proof) {
  assert(proof.consumer_status === 'emitted_fixture_candidate_refs', 'actor should emit fixture candidates');
  assert(proof.pickup_packets_consumed === 1, 'actor should consume one pickup packet');
  assert(proof.candidate_refs.length >= 1, 'actor should emit one or more fixture candidates');
  for (const candidate of proof.candidate_refs) {
    verifyCommonCandidate(candidate, 'actor');
    assert(candidate.killmail_id, 'actor candidate should include killmail ID');
    assert(candidate.killmail_hash, 'actor candidate should include killmail hash');
    assert(candidate.scope_key === 'actor:character:90000001', 'actor scope key should match');
    assert(candidate.watch_id === 1, 'actor Watch ID should match');
    assert(candidate.pickup_packet_index === 0, 'actor pickup packet index should match');
    assert(candidate.pickup_packet_count === 1, 'actor pickup packet count should match');
    assert(candidate.entity_type === 'character', 'actor entity type should match');
    assert(candidate.entity_id === 90000001, 'actor entity ID should match');
    assert(candidate.entity_name === 'Pickup Consumer Pilot', 'actor entity name should be preserved');
    assert(candidate.lookback_seconds === 14 * 86400, 'actor lookback should match');
    assert(candidate.caps.max_refs === 5, 'actor cap max refs should match');
    assert(candidate.provider_target_posture.target_kind === 'character', 'actor provider target kind should match');
    assert(candidate.provider_target_posture.target_id === 90000001, 'actor provider target ID should match');
  }
}

function verifySystemCandidates(proof) {
  assert(proof.consumer_status === 'emitted_fixture_candidate_refs', 'system should emit fixture candidates');
  assert(proof.pickup_packets_consumed === ACCEPTED_IDS.length, 'system should consume one pickup packet per accepted system');
  assert(proof.candidate_refs.length === ACCEPTED_IDS.length, 'system should emit one candidate per pickup packet');
  const candidateSystemIds = proof.candidate_refs.map((candidate) => candidate.candidate_system_id);
  assertSame(candidateSystemIds, ACCEPTED_IDS, 'candidate systems should come from pickup packets in order');
  for (const [index, candidate] of proof.candidate_refs.entries()) {
    verifyCommonCandidate(candidate, 'system_radius');
    assert(candidate.killmail_id, 'system candidate should include killmail ID');
    assert(candidate.killmail_hash, 'system candidate should include killmail hash');
    assert(candidate.scope_key === 'system:30003597:radius:1', 'system scope key should match');
    assert(candidate.pickup_packet_index === index, 'system pickup packet index should match');
    assert(candidate.pickup_packet_count === ACCEPTED_IDS.length, 'system pickup packet count should match');
    assertSame(candidate.accepted_system_ids, ACCEPTED_IDS, 'system accepted IDs should be preserved');
    assert(candidate.candidate_system_id === ACCEPTED_IDS[index], 'candidate system should match pickup packet system');
    assert(candidate.accepted_scope_source === 'stored_watch_scope', 'accepted scope source should match');
    assert(candidate.center_system_id === 30003597, 'center should be provenance');
    assert(candidate.radius_jumps === 1, 'radius should be provenance');
    assert(candidate.center_radius_role === 'provenance_and_explanation', 'center/radius role should match');
    assert(candidate.center_radius_used_as_execution_authority === false, 'center/radius should not be execution authority');
    assert(candidate.topology_recomputed === false, 'system candidates should not recompute topology');
    assert(candidate.provider_target_posture.target_kind === 'solar_system', 'system provider target kind should match');
    assert(candidate.provider_target_posture.target_id === ACCEPTED_IDS[index], 'system provider target ID should match');
  }
}

function verifyCommonCandidate(candidate, sourceKind) {
  assert(candidate.provider === 'zkill_fixture', 'candidate provider should be local zKill fixture');
  assert(candidate.provider_return_like === true, 'candidate should be provider-return-like fixture data');
  assert(candidate.source_lane === 'watch', 'candidate source lane should be watch');
  assert(candidate.source_kind === sourceKind, 'candidate source kind should match');
  assert(candidate.candidate_only === true, 'candidate should be candidate-only');
  assert(candidate.fixture_only === true, 'candidate should be fixture-only');
  assert(candidate.durable_ref_written === false, 'candidate should not be durable ref');
  assert(candidate.evidence_created === false, 'candidate should not create Evidence');
  assert(candidate.hydration_created === false, 'candidate should not create Hydration');
  assert(candidate.observation_created === false, 'candidate should not create Observation');
  assert(candidate.provider_movement === false, 'candidate should not move providers');
  assert(candidate.provider_target_posture.provider_calls === 0, 'candidate should not call providers');
  assert(candidate.provider_target_posture.live_api_calls === 0, 'candidate should not make live/API calls');
  assert(candidate.provider_target_posture.acquisition_not_started === true, 'candidate should not start acquisition');
  assert(candidate.provenance.source_action === 'discovery.pickup_consumer_fixture.preview', 'candidate provenance should name consumer proof');
  assert(candidate.provenance.pickup_action === 'watch.discovery_pickup_packet_proof.preview', 'candidate should preserve pickup proof source');
}

function verifyNoCandidates(proof, reason) {
  assert(proof.pickup_packets_consumed === 0, 'blocked/idle state should consume no pickup packets');
  assert(proof.candidate_refs_emitted === 0, 'blocked/idle state should emit no candidate refs');
  assert(proof.candidate_refs.length === 0, 'blocked/idle state should have empty candidate list');
  assert(proof.consumer_status === 'blocked_no_candidate_refs', 'blocked/idle state should state no candidates');
  assert(proof.consumer_reason === reason, `expected no-candidate reason ${reason}, got ${proof.consumer_reason}`);
}

function verifyWaitingRows(proof) {
  verifyNoCandidates(proof, 'no_due_watches');
  assert(proof.source_pickup_proof.pickup_packets_emitted === 0, 'waiting rows should emit no pickup packets');
}

function verifyNoProviderNoWriteBoundary(proof, label) {
  assert(proof.read_only === true, `${label} should be read-only`);
  assert(proof.mutates_state === false, `${label} should not mutate state`);
  assert(proof.fixture_only === true, `${label} should be fixture-only`);
  assert(proof.renderer_eligible === true, `${label} should be renderer eligible read-only preview`);
  assert(proof.provider_movement === false, `${label} should not move providers`);
  assert(proof.watch_execution === false, `${label} should not execute Watch`);
  assert(proof.watch_dispatches === 0, `${label} should not dispatch Watch`);
  assert(proof.dispatch_runner_invoked === false, `${label} should not invoke dispatch runner`);
  assert(proof.dispatch_runner_invocations === 0, `${label} should not invoke dispatch runners`);
  assert(proof.collectors_called === false, `${label} should not call collectors`);
  assert(proof.task_runner_methods_called.length === 0, `${label} should not call TaskRunner methods`);
  assert(proof.tasks_created === 0, `${label} should not create tasks`);
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
  assert(proof.hydration_created === false, `${label} should not create Hydration`);
  assert(proof.hydration_writes === 0, `${label} should not write Hydration output`);
  assert(proof.metadata_writes === 0, `${label} should not write metadata`);
  assert(proof.observation_created === false, `${label} should not create Observation`);
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
  assert(proof.accepted_model.discovery_consumes_pickup_packets === true, `${label} should preserve Discovery consumer role`);
  assert(proof.accepted_model.watch_acquires_candidates_itself === false, `${label} should not let Watch acquire candidates`);
  assert(proof.accepted_model.candidate_refs_are_plain_fixture_data === true, `${label} should treat candidates as fixture data`);
  assert(proof.accepted_model.candidate_refs_are_durable_discovery_refs === false, `${label} should not treat candidates as durable refs`);
  assert(proof.accepted_model.candidate_refs_are_evidence === false, `${label} should not treat candidates as Evidence`);
  assert(proof.accepted_model.candidate_refs_are_hydration === false, `${label} should not treat candidates as Hydration`);
  assert(proof.accepted_model.candidate_refs_are_observation === false, `${label} should not treat candidates as Observation`);
  assert(proof.accepted_model.watch_only_discovery_machinery === false, `${label} should not define Watch-only Discovery machinery`);
  assert(proof.accepted_model.topology_recomputed === false, `${label} should not recompute topology`);
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
  insertActorWatch(db, { watchId: 1, nextPollAt: '2026-06-07T00:00:00.000Z' });
  insertSystemWatch(db, {
    watchId: 1,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    backoffUntil: '2026-06-06T23:30:00.000Z'
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
    input.entityName || 'Pickup Consumer Pilot',
    14,
    input.maxKillmailsPerRun || 5,
    input.isActive ?? 1,
    60,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS349 pickup consumer fixture'
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
    input.maxKillmailsPerRun || 8,
    input.isActive ?? 1,
    45,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS349 pickup consumer fixture'
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
