const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildHydrationExecutionPolicyPreview } = require('../src/main/services/hydrationExecutionPolicyPreviewService');
const { projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const previous = captureEnv();
  const root = path.join(projectRoot(), '.tmp', 'hydration-execution-policy-should-not-exist');
  fs.rmSync(root, { recursive: true, force: true });
  process.env.AURA_ATLAS_TEST_TMP = root;
  process.env.AURA_ATLAS_CACHE_DIR = path.join(root, 'cache');
  process.env.AURA_ATLAS_SDE_CACHE_DIR = path.join(root, 'sde');
  delete process.env.AURA_ATLAS_LIVE_API;

  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedFixture(db);
    const beforeRootExists = fs.existsSync(root);
    const before = sideEffectCounts(db);
    const preview = await invokeServiceCommand('metadata.hydration_execution_policy.preview', {
      externalIoState: 'off',
      limit: 5
    }, {
      db,
      databasePath: path.join(root, 'candidate-atlas.sqlite'),
      source: 'renderer'
    });
    const after = sideEffectCounts(db);
    const afterRootExists = fs.existsSync(root);

    verifyReadOnlyBoundary(preview);
    verifyNoSideEffects({ beforeRootExists, afterRootExists, before, after });
    verifyPolicyShape(preview);
    verifyDirectBuilder(db);
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'hydration execution policy preview verified',
      command: preview.action,
      by_policy_state: preview.summary.by_policy_state,
      provider_needed_entity_label_candidates: preview.summary.provider_needed_entity_label_candidates,
      local_known_label_candidates: preview.summary.local_known_label_candidates,
      local_sde_gap_candidates: preview.summary.local_sde_gap_candidates,
      lanes: preview.lanes.map((lane) => ({
        lane_id: lane.lane_id,
        policy_state: lane.policy_state,
        candidate_count: lane.candidate_count,
        candidate_groups: lane.candidate_groups,
        priority: lane.priority,
        reason_codes: lane.reason_codes
      })),
      evidence_boundary: preview.evidence_boundary,
      priority_policy: preview.priority_policy,
      boundary: preview.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
    restoreEnv(previous);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'metadata.hydration_execution_policy.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should declare read-only');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.hydration_writes === 0, 'preview should not write hydration output');
  assert(preview.entity_label_writes === 0, 'preview should not write entity labels');
  assert(preview.activity_event_label_patches === 0, 'preview should not patch activity event labels');
  assert(preview.metadata_run_writes === 0, 'preview should not write metadata runs');
  assert(preview.persisted_queue === false, 'preview should not persist a queue');
  assert(preview.schema_changes === false, 'preview should not change schema');
  assert(preview.ui_work === false, 'preview should not add UI work');
  assert(preview.enforcement_active === false, 'preview should not activate enforcement');
  assert(preview.runtime_authorization_active === false, 'preview should not authorize runtime execution');
  assert(preview.eligibility_is_authorization === false, 'eligible policy state should not be authorization');
}

function verifyNoSideEffects({ beforeRootExists, afterRootExists, before, after }) {
  assert(beforeRootExists === false, 'fixture temp root should start missing');
  assert(afterRootExists === false, 'preview must not create the fixture temp root');
  assertSame(after, before, 'hydration execution policy preview should not mutate DB state');
}

function verifyPolicyShape(preview) {
  assert(preview.evidence_boundary.creates_evidence === false, 'hydration must not create evidence');
  assert(preview.evidence_boundary.replaces_ids_as_facts === false, 'hydration must not replace IDs as facts');
  assert(preview.evidence_boundary.missing_labels_are_report_failure === false, 'missing labels must not be report failure');
  assert(preview.evidence_boundary.provider_needed_labels_are_evidence_work === false, 'provider-needed labels must not be Evidence/EVEidence work');
  assert(preview.priority_policy.view_local_record_not_starved_by_background === true, 'view/local hydration must not be starved by background');
  assert(preview.priority_policy.no_catch_up_flood_on_external_io_reenable === true, 're-enable must not imply catch-up flood');

  const viewLane = lane(preview, 'view_local_record');
  const watchLane = lane(preview, 'watch_background');
  const targetLane = lane(preview, 'target_report_scoped');
  const hygieneLane = lane(preview, 'corpus_hygiene_low_priority');
  const sdeLane = lane(preview, 'local_sde_lookup_gaps');

  assert(viewLane.priority === 'point_of_need_not_starved', 'view lane should be point-of-need priority');
  assert(['held_by_external_io', 'blocked_by_storage'].includes(viewLane.policy_state), 'provider-needed view hydration should be held or blocked by a composed gate when External I/O is off');
  assert(viewLane.gates.external_io.state === 'hold', 'view lane should expose External I/O hold even when another gate blocks first');
  assert(watchLane.priority === 'patient_background', 'Watch/background lane should be patient background');
  assert(watchLane.waiting_is_failure === false, 'Watch/background waiting should not be failure');
  assert(targetLane.priority === 'scoped_operator_relevance', 'target/report-scoped lane should be scoped relevance');
  assert(['held_by_external_io', 'deferred_by_priority', 'blocked_by_storage'].includes(hygieneLane.policy_state), 'corpus hygiene lane should hold, defer, or block, not authorize');
  assert(sdeLane.policy_state === 'local_lookup_gap' || sdeLane.policy_state === 'eligible_local', 'SDE lane should be local lookup posture');
  assert(sdeLane.reason_codes.includes('local_sde_lookup_gap'), 'SDE lane should expose local lookup gap');

  assert(preview.gates.external_io.state === 'hold', 'External I/O off should hold provider-backed hydration');
  assert(preview.gates.external_io.held_is_failure === false, 'External I/O hold should not be failure');
  assert(preview.gates.live_provider.state === 'block', 'live provider gate should block while live API disabled');
  assert(preview.gates.composed_policy.would_allow_is_authorization === false, 'composed policy should not treat would_allow as authorization');
  assert(preview.gates.command_authority.confirmation_token_is_secret === false, 'confirmation token must not be secret authority');
  assert(preview.backlog_context.persisted_backlog === false, 'backlog context should remain non-persistent');

  for (const entry of preview.lanes) {
    assert(entry.persisted_queue === false, `${entry.lane_id} should not create a queue`);
    assert(entry.creates_evidence === false, `${entry.lane_id} should not create evidence`);
    assert(entry.replaces_ids_as_facts === false, `${entry.lane_id} should not replace IDs`);
    assert(entry.missing_labels_are_report_failure === false, `${entry.lane_id} should not make missing labels report failure`);
  }
}

function verifyDirectBuilder(db) {
  const preview = buildHydrationExecutionPolicyPreview(db, {
    externalIoState: 'on',
    limit: 3
  }, {
    commandMetadata: listServiceCommands()
  });
  assert(preview.gates.external_io.state === 'pass', 'External I/O on should release provider-backed hydration only to normal gates');
  assert(preview.priority_policy.no_catch_up_flood_on_external_io_reenable === true, 'External I/O re-enable should not imply catch-up flood');
  assert(preview.eligibility_is_authorization === false, 'direct builder should not authorize execution');
}

function verifyCommandRegistration() {
  const command = listServiceCommands().find((entry) => entry.command === 'metadata.hydration_execution_policy.preview');
  assert(command, 'hydration execution policy command should be registered');
  assert(command.classification === 'read-only', 'hydration execution policy should be read-only');
  assert(command.effects.includes('read-only'), 'hydration execution policy should declare read-only effect');
  assert(command.renderer_allowed === true, 'hydration execution policy should be renderer eligible as a safe readout');
}

function seedFixture(db) {
  db.prepare(`
    INSERT INTO entities (
      entity_type, entity_id, entity_name, first_seen_at, last_seen_at, last_enriched_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run('corporation', 98000002, 'Known Local Corp', '2026-01-01T00:00:00Z', '2026-05-01T00:00:00Z', '2026-01-01T00:00:00Z');
  db.prepare(`
    INSERT INTO entities (
      entity_type, entity_id, entity_name, first_seen_at, last_seen_at, last_enriched_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run('character', 90000002, 'Known Pilot', '2026-05-01T00:00:00Z', '2026-05-01T00:00:00Z', '2026-05-30T00:00:00Z');
  db.prepare(`
    INSERT INTO watchlist_entities (
      entity_type, entity_id, entity_name, lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes, next_poll_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('character', 90000002, 'Known Pilot', 30, 5, 1, 60, '2026-05-31T12:00:00Z', 'fixture watch');
  db.prepare(`
    INSERT INTO assessment_artifacts (
      artifact_id, artifact_type, entity_type, entity_id, entity_name, status,
      assessment_reason, created_at, updated_at, assessed_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('artifact_interest_90000003', 'entity_interest', 'character', 90000003, null, 'active', 'Fixture marked interest', '2026-05-31T00:00:00Z', '2026-05-31T00:00:00Z', 'fixture');
  db.prepare(`
    INSERT INTO type_metadata (
      type_id, type_name, group_id, group_name, category_id, category_name, last_fetched
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(603, 'Merlin', 25, 'Frigate', 6, 'Ship', '2026-05-01T00:00:00Z');
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name, region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);
  db.prepare(`
    INSERT INTO metadata_runs (
      run_id, trigger, run_type, target_type, target_id, started_at, finished_at, status,
      ids_discovered, already_known, requested_from_esi, resolved, unresolved,
      activity_events_patched, api_calls_esi
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('metadata_fixture_recent', 'manual', 'report_scoped_ids', 'character', '90000002', '2026-05-30T00:00:00Z', '2026-05-30T00:01:00Z', 'success', 3, 1, 2, 2, 0, 1, 1);
  db.prepare(`
    INSERT INTO killmails (
      killmail_id, killmail_hash, killmail_time, solar_system_id, raw_esi_payload,
      raw_payload_checksum, source, first_seen_at, last_seen_at, ingested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(8101, 'hash_8101', '2026-05-30T10:00:00Z', 30000001, '{}', 'checksum', 'fixture', '2026-05-30T10:00:00Z', '2026-05-30T10:00:00Z', '2026-05-30T10:00:00Z');
  db.prepare(`
    INSERT INTO activity_events (
      event_key, killmail_id, role, entity_type, entity_id, entity_name,
      character_id, character_name, corporation_id, corporation_name, alliance_id, alliance_name,
      ship_type_id, ship_type_name, weapon_type_id, final_blow, damage_done,
      solar_system_id, solar_system_name, region_id, region_name, killmail_time, ingested_at,
      discovered_by_type, discovered_by_id, normalizer_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    '8101:attacker:90000003',
    8101,
    'attacker',
    'character',
    90000003,
    null,
    90000003,
    null,
    98000002,
    null,
    99000003,
    null,
    999999,
    null,
    603,
    1,
    1234,
    30000001,
    'Atlas Prime',
    10000001,
    'Test Region',
    '2026-05-30T10:00:00Z',
    '2026-05-30T10:00:00Z',
    'actor',
    '90000002',
    'fixture'
  );
}

function lane(preview, laneId) {
  const entry = preview.lanes.find((candidate) => candidate.lane_id === laneId);
  assert(entry, `${laneId} should exist`);
  return entry;
}

function sideEffectCounts(db) {
  return {
    entities: db.prepare('SELECT entity_type, entity_id, entity_name, last_enriched_at FROM entities ORDER BY entity_type, entity_id').all(),
    metadata_runs: count(db, 'metadata_runs'),
    activity_events: db.prepare(`
      SELECT event_key, entity_name, character_name, corporation_name, alliance_name, ship_type_name, solar_system_name
      FROM activity_events
      ORDER BY event_key
    `).all(),
    killmails: count(db, 'killmails'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function captureEnv() {
  return {
    AURA_ATLAS_TEST_TMP: process.env.AURA_ATLAS_TEST_TMP,
    AURA_ATLAS_CACHE_DIR: process.env.AURA_ATLAS_CACHE_DIR,
    AURA_ATLAS_SDE_CACHE_DIR: process.env.AURA_ATLAS_SDE_CACHE_DIR,
    AURA_ATLAS_LIVE_API: process.env.AURA_ATLAS_LIVE_API
  };
}

function restoreEnv(previous) {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
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
