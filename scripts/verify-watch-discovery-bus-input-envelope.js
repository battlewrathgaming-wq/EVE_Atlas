const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildWatchDiscoveryBusInputEnvelopeProof } = require('../src/main/services/watchDiscoveryBusInputEnvelopeService');

const NOW = '2026-06-06T20:00:00.000Z';
const ACCEPTED_IDS = [30003597, 30003599, 30003601];

async function main() {
  const originalLive = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  try {
    await verifyCase('due actor Discovery bus input', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifyActorEnvelope);
    await verifyCase('due system/radius Discovery bus input', insertSystemOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifySystemEnvelope);
    await verifyCase('invalid stored scope blocks Discovery bus input', insertInvalidSystemOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, (proof) => verifyNoBusInput(proof, 'watch_scope_authority_invalid'));
    await verifyCase('disarmed blocks Discovery bus input', insertActorOnly, {
      sessionArmed: false,
      liveApiEnabled: true
    }, (proof) => verifyNoBusInput(proof, 'session_not_armed'));
    await verifyCase('active task blocks Discovery bus input', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      activeTaskId: 'task-1',
      activeTaskPresent: true
    }, (proof) => verifyNoBusInput(proof, 'active_task'));
    await verifyCase('live gate blocks Discovery bus input', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: false
    }, (proof) => verifyNoBusInput(proof, 'live_api_disabled'));
    await verifyCase('no due idles without Discovery bus input', insertWaitingOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, (proof) => verifyNoBusInput(proof, 'no_due_watches'));
    await verifyCase('inactive not-due backoff no Discovery bus input', insertWaitingOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifyWaitingRows);

    console.log(JSON.stringify({
      status: 'Watch Discovery bus input envelope validated',
      helper: 'buildWatchDiscoveryBusInputEnvelopeProof',
      cases: [
        'due_actor_bus_input',
        'due_system_radius_bus_input',
        'invalid_stored_scope_no_bus_input',
        'disarmed_no_bus_input',
        'active_task_no_bus_input',
        'live_gate_no_bus_input',
        'no_due_no_bus_input',
        'inactive_not_due_backoff_no_bus_input'
      ],
      sample_actor_bus_input: await sample(insertActorOnly),
      sample_system_radius_bus_input: await sample(insertSystemOnly),
      sample_invalid_scope: await sample(insertInvalidSystemOnly)
    }, null, 2));
  } finally {
    if (originalLive === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = originalLive;
    }
  }
  console.log('Watch Discovery bus input envelope validated');
}

async function verifyCase(label, insertRows, input, verifier) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertRows(db);
    const before = sideEffectCounts(db);
    const proof = buildWatchDiscoveryBusInputEnvelopeProof(db, {
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
    const proof = buildWatchDiscoveryBusInputEnvelopeProof(db, {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true
    });
    return {
      bus_input_status: proof.bus_input_status,
      bus_input_reason: proof.bus_input_reason,
      bus_input_envelope_emitted: proof.bus_input_envelope_emitted,
      bus_input_envelope: proof.bus_input_envelope,
      source_task_proof: proof.source_task_proof,
      table_mutation_proof: proof.table_mutation_proof
    };
  } finally {
    closeDatabase(db);
  }
}

function verifyActorEnvelope(proof) {
  assert(proof.bus_input_envelope_emitted === true, 'actor should emit bus input envelope');
  assert(proof.bus_input_status === 'emitted_candidate_intake_intent', 'actor bus input should be candidate intent');
  const envelope = proof.bus_input_envelope;
  assert(envelope.source_lane === 'watch', 'actor source lane should be watch');
  assert(envelope.source_kind === 'actor', 'actor source kind should be actor');
  assert(envelope.scope_key === 'actor:character:90000001', 'actor scope key should match');
  assert(envelope.watch_id === 1, 'actor watch ID should match');
  assert(envelope.task_type === 'watch.executor.actor.watch', 'actor task type should match');
  assert(envelope.task_classification === 'evidence-creating', 'actor task classification should match');
  assert(envelope.candidate_only === true, 'actor bus input should be candidate-only');
  assert(envelope.discovery_refs_written === false, 'actor bus input should not be refs');
  assert(envelope.evidence_created === false, 'actor bus input should not be Evidence');
  assert(envelope.provider_movement === false, 'actor bus input should not move providers');
  assert(envelope.entity_type === 'character', 'actor entity type should match');
  assert(envelope.entity_id === 90000001, 'actor entity ID should match');
  assert(envelope.entity_name === 'Bus Input Pilot', 'actor entity name should be preserved');
  assert(envelope.lookback_seconds === 14 * 86400, 'actor lookback should match');
  assert(envelope.caps.max_refs === 5, 'actor cap max refs should match');
  assert(envelope.caps.max_expansions === 5, 'actor cap max expansions should match');
}

function verifySystemEnvelope(proof) {
  assert(proof.bus_input_envelope_emitted === true, 'system should emit bus input envelope');
  const envelope = proof.bus_input_envelope;
  assert(envelope.source_lane === 'watch', 'system source lane should be watch');
  assert(envelope.source_kind === 'system_radius', 'system source kind should be system_radius');
  assert(envelope.scope_key === 'system:30003597:radius:1', 'system scope key should match');
  assert(envelope.task_type === 'watch.executor.system.radius.watch', 'system task type should match');
  assert(envelope.task_classification === 'evidence-creating', 'system task classification should match');
  assert(envelope.candidate_only === true, 'system bus input should be candidate-only');
  assert(envelope.discovery_refs_written === false, 'system bus input should not be refs');
  assert(envelope.evidence_created === false, 'system bus input should not be Evidence');
  assertSame(envelope.accepted_system_ids, ACCEPTED_IDS, 'system bus input should preserve stored accepted IDs');
  assert(envelope.accepted_scope_source === 'stored_watch_scope', 'system accepted scope source should match');
  assert(envelope.center_system_id === 30003597, 'system center should be present as provenance');
  assert(envelope.radius_jumps === 1, 'system radius should be present as provenance');
  assert(envelope.center_radius_role === 'provenance_and_management', 'center/radius should be provenance/management');
  assert(envelope.center_radius_used_as_authority === false, 'center/radius should not be authority');
  assert(envelope.lookback_seconds === 24 * 3600, 'system lookback should match');
  assert(envelope.caps.max_systems === ACCEPTED_IDS.length, 'system max systems should match');
  assert(envelope.caps.max_refs_per_system === 2, 'system max refs per system should match');
  assert(envelope.caps.max_expansions === 6, 'system max expansions should match');
}

function verifyNoBusInput(proof, reason) {
  assert(proof.bus_input_envelope_emitted === false, 'blocked/idle state should emit no bus input');
  assert(proof.bus_input_envelope === null, 'blocked/idle state should have no envelope');
  assert(proof.bus_input_status === 'blocked_no_bus_input', 'blocked/idle state should state no bus input');
  assert(proof.bus_input_reason === reason, `expected no-bus reason ${reason}, got ${proof.bus_input_reason}`);
  if (reason === 'watch_scope_authority_invalid') {
    assert(proof.invalid_stored_scope_blocks_before_bus_input === true, 'invalid scope should block before bus input');
  }
}

function verifyWaitingRows(proof) {
  verifyNoBusInput(proof, 'no_due_watches');
  assert(proof.source_task_proof.fixture_task_created === false, 'waiting rows should not create fixture task');
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
  assert(proof.discovery_refs_written === false, `${label} should not write Discovery refs`);
  assert(proof.discovery_refs_mutated === 0, `${label} should not mutate Discovery refs`);
  assert(proof.discovery_ref_writes === 0, `${label} should not write Discovery ref rows`);
  assert(proof.evidence_created === false, `${label} should not create Evidence`);
  assert(proof.evidence_written === false, `${label} should not write Evidence/EVEidence`);
  assert(proof.evidence_writes === 0, `${label} should not write Evidence rows`);
  assert(proof.hydration_writes === 0, `${label} should not write Hydration output`);
  assert(proof.metadata_writes === 0, `${label} should not write metadata`);
  assert(proof.api_request_log_writes === 0, `${label} should not write API logs`);
  assert(proof.data_quality_warning_writes === 0, `${label} should not write warnings`);
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
  assert(proof.accepted_model.discovery_bus_input_role === 'acquisition_intent', `${label} should label bus input as acquisition intent`);
  assert(proof.accepted_model.discovery_bus_input_is_discovery_refs === false, `${label} should not treat input as refs`);
  assert(proof.accepted_model.discovery_bus_input_is_evidence === false, `${label} should not treat input as Evidence`);
  assert(proof.accepted_model.watch_only_bus_model === false, `${label} should not define a Watch-only bus`);
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
  insertActorWatch(db, { watchId: 1, nextPollAt: '2026-06-06T21:00:00.000Z' });
  insertSystemWatch(db, {
    watchId: 1,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    backoffUntil: '2026-06-06T20:30:00.000Z'
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
    input.entityName || 'Bus Input Pilot',
    14,
    input.maxKillmailsPerRun || 5,
    input.isActive ?? 1,
    60,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS340 bus input fixture'
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
    'HS340 bus input fixture'
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
