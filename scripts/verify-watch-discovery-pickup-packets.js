const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildWatchDiscoveryPickupPacketProof } = require('../src/main/services/watchDiscoveryPickupPacketProofService');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');

const NOW = '2026-06-06T22:00:00.000Z';
const ACCEPTED_IDS = [30003597, 30003599, 30003601, 30003602];

async function main() {
  const originalLive = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  try {
    await verifyCase('due actor pickup packet', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifyActorPacket);
    await verifyCase('due system/radius pickup packets', insertSystemOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifySystemPackets);
    await verifyCase('invalid stored scope no pickup packets', insertInvalidSystemOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, (proof) => verifyNoPackets(proof, 'watch_scope_authority_invalid'));
    await verifyCase('disarmed no pickup packets', insertActorOnly, {
      sessionArmed: false,
      liveApiEnabled: true
    }, (proof) => verifyNoPackets(proof, 'session_not_armed'));
    await verifyCase('active task no pickup packets', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      activeTaskId: 'task-1',
      activeTaskPresent: true
    }, (proof) => verifyNoPackets(proof, 'active_task'));
    await verifyCase('live disabled no pickup packets', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: false
    }, (proof) => verifyNoPackets(proof, 'live_api_disabled'));
    await verifyCase('no due no pickup packets', insertWaitingOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, (proof) => verifyNoPackets(proof, 'no_due_watches'));
    await verifyCase('inactive not-due backoff no pickup packets', insertWaitingOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifyWaitingRows);
    await verifyServiceCommand();

    console.log(JSON.stringify({
      status: 'Watch Discovery pickup packets validated',
      command: 'watch.discovery_pickup_packet_proof.preview',
      helper: 'buildWatchDiscoveryPickupPacketProof',
      cases: [
        'due_actor_one_packet',
        'due_system_radius_one_packet_per_accepted_system',
        'invalid_stored_scope_no_packets',
        'disarmed_no_packets',
        'active_task_no_packets',
        'live_disabled_no_packets',
        'no_due_no_packets',
        'inactive_not_due_backoff_no_packets',
        'service_command_preview'
      ],
      sample_actor_pickup: await sample(insertActorOnly),
      sample_system_radius_pickup: await sample(insertSystemOnly),
      sample_invalid_scope: await sample(insertInvalidSystemOnly)
    }, null, 2));
  } finally {
    if (originalLive === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = originalLive;
    }
  }
  console.log('Watch Discovery pickup packets validated');
}

async function verifyCase(label, insertRows, input, verifier) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertRows(db);
    const before = sideEffectCounts(db);
    const proof = buildWatchDiscoveryPickupPacketProof(db, {
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
    const result = await invokeServiceCommand('watch.discovery_pickup_packet_proof.preview', {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true
    }, { db });
    const after = sideEffectCounts(db);
    verifyActorPacket(result);
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
    const proof = buildWatchDiscoveryPickupPacketProof(db, {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true
    });
    return {
      pickup_status: proof.pickup_status,
      pickup_reason: proof.pickup_reason,
      pickup_packets_emitted: proof.pickup_packets_emitted,
      pickup_packets: proof.pickup_packets,
      selected_watch: proof.selected_watch,
      source_tick_preview: proof.source_tick_preview,
      table_mutation_proof: proof.table_mutation_proof
    };
  } finally {
    closeDatabase(db);
  }
}

function verifyActorPacket(proof) {
  assert(proof.pickup_status === 'emitted_discovery_pickup_packets', 'actor should emit pickup packet');
  assert(proof.pickup_packets.length === 1, 'actor should emit exactly one pickup packet');
  assert(proof.selected_due_watch_count === 1, 'actor should select one due Watch');
  const packet = proof.pickup_packets[0];
  verifyCommonPacket(packet, 'actor');
  assert(packet.packet_index === 0, 'actor packet index should be zero');
  assert(packet.packet_count === 1, 'actor packet count should be one');
  assert(packet.scope_key === 'actor:character:90000001', 'actor scope key should match');
  assert(packet.watch_id === 1, 'actor Watch ID should match');
  assert(packet.entity_type === 'character', 'actor entity type should match');
  assert(packet.entity_id === 90000001, 'actor entity ID should match');
  assert(packet.entity_name === 'Pickup Packet Pilot', 'actor entity name should be preserved');
  assert(packet.lookback_seconds === 14 * 86400, 'actor lookback should match');
  assert(packet.caps.max_refs === 5, 'actor max refs should match');
  assert(packet.provider_target_posture.provider === 'zkill', 'actor target provider should be zKill');
  assert(packet.provider_target_posture.target_kind === 'character', 'actor provider target kind should match');
  assert(packet.provider_target_posture.target_id === 90000001, 'actor provider target ID should match');
}

function verifySystemPackets(proof) {
  assert(proof.pickup_status === 'emitted_discovery_pickup_packets', 'system should emit pickup packets');
  assert(proof.pickup_packets.length === ACCEPTED_IDS.length, 'system should emit one packet per accepted system');
  assert(proof.selected_due_watch_count === 1, 'system should select one due Watch');
  const candidateSystemIds = proof.pickup_packets.map((packet) => packet.candidate_system_id);
  assertSame(candidateSystemIds, ACCEPTED_IDS, 'candidate systems should exactly equal accepted IDs in order');
  for (const [index, packet] of proof.pickup_packets.entries()) {
    verifyCommonPacket(packet, 'system_radius');
    assert(packet.packet_index === index, 'system packet index should match deterministic order');
    assert(packet.packet_count === ACCEPTED_IDS.length, 'system packet count should match accepted system count');
    assert(packet.scope_key === 'system:30003597:radius:1', 'system scope key should match');
    assertSame(packet.accepted_system_ids, ACCEPTED_IDS, 'system accepted IDs should be preserved');
    assert(packet.candidate_system_id === ACCEPTED_IDS[index], 'candidate system should match accepted ID');
    assert(packet.accepted_scope_source === 'stored_watch_scope', 'accepted scope source should match');
    assert(packet.center_system_id === 30003597, 'center should be provenance');
    assert(packet.radius_jumps === 1, 'radius should be provenance');
    assert(packet.center_radius_role === 'provenance_and_explanation', 'center/radius role should match pickup proof');
    assert(packet.center_radius_used_as_execution_authority === false, 'center/radius should not be execution authority');
    assert(packet.lookback_seconds === 24 * 3600, 'system lookback should match');
    assert(packet.caps.max_systems === ACCEPTED_IDS.length, 'system caps should preserve accepted count');
    assert(packet.caps.max_refs_per_system === 2, 'system max refs per system should match');
    assert(packet.provider_target_posture.provider === 'zkill', 'system target provider should be zKill');
    assert(packet.provider_target_posture.target_kind === 'solar_system', 'system provider target kind should match');
    assert(packet.provider_target_posture.target_id === ACCEPTED_IDS[index], 'system provider target ID should match');
  }
}

function verifyCommonPacket(packet, sourceKind) {
  assert(packet.source_lane === 'watch', 'packet source lane should be watch');
  assert(packet.source_kind === sourceKind, 'packet source kind should match');
  assert(packet.selected_command, 'packet should carry selected command');
  assert(packet.candidate_only === true, 'packet should be candidate-only');
  assert(packet.pickup_intent_only === true, 'packet should be pickup intent only');
  assert(packet.durable_ref_written === false, 'packet should not be durable ref');
  assert(packet.evidence_created === false, 'packet should not create Evidence');
  assert(packet.hydration_created === false, 'packet should not create Hydration');
  assert(packet.observation_created === false, 'packet should not create Observation');
  assert(packet.provider_movement === false, 'packet should not move providers');
  assert(packet.watch_execution === false, 'packet should not execute Watch');
  assert(packet.provider_target_posture.provider_calls === 0, 'packet should not call providers');
  assert(packet.provider_target_posture.live_api_calls === 0, 'packet should not make live/API calls');
  assert(packet.provider_target_posture.acquisition_not_started === true, 'packet should not start acquisition');
  assert(packet.provenance.source_action === 'watch.discovery_pickup_packet_proof.preview', 'packet provenance should name pickup proof');
}

function verifyNoPackets(proof, reason) {
  assert(proof.pickup_packets_emitted === 0, 'blocked/idle state should emit no pickup packets');
  assert(proof.pickup_packets.length === 0, 'blocked/idle state should have empty pickup packet list');
  assert(proof.pickup_status === 'blocked_no_pickup_packets', 'blocked/idle state should state no pickup packets');
  assert(proof.pickup_reason === reason, `expected no-pickup reason ${reason}, got ${proof.pickup_reason}`);
}

function verifyWaitingRows(proof) {
  verifyNoPackets(proof, 'no_due_watches');
  assert(proof.source_tick_preview.decision.status === 'idle', 'waiting rows should leave tick preview idle');
}

function verifyNoProviderNoWriteBoundary(proof, label) {
  assert(proof.read_only === true, `${label} should be read-only`);
  assert(proof.mutates_state === false, `${label} should not mutate state`);
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
  assert(proof.accepted_model.watch_role === 'scheduler_and_scope_authority_source', `${label} should preserve Watch role`);
  assert(proof.accepted_model.discovery_role === 'acquisition_utility', `${label} should preserve Discovery role`);
  assert(proof.accepted_model.watch_acquires_candidates_itself === false, `${label} should not let Watch acquire candidates`);
  assert(proof.accepted_model.pickup_packets_are_durable_discovery_refs === false, `${label} should not treat pickup packets as durable refs`);
  assert(proof.accepted_model.pickup_packets_are_evidence === false, `${label} should not treat pickup packets as Evidence`);
  assert(proof.accepted_model.pickup_packets_are_hydration === false, `${label} should not treat pickup packets as Hydration`);
  assert(proof.accepted_model.pickup_packets_are_observation === false, `${label} should not treat pickup packets as Observation`);
  assert(proof.accepted_model.watch_only_discovery_machinery === false, `${label} should not define Watch-only Discovery machinery`);
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
  insertActorWatch(db, { watchId: 1, nextPollAt: '2026-06-06T23:00:00.000Z' });
  insertSystemWatch(db, {
    watchId: 1,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    backoffUntil: '2026-06-06T22:30:00.000Z'
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
    input.entityName || 'Pickup Packet Pilot',
    14,
    input.maxKillmailsPerRun || 5,
    input.isActive ?? 1,
    60,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS347 pickup packet fixture'
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
    'HS347 pickup packet fixture'
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
