const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildHydrationBacklogPreview } = require('../src/main/services/hydrationBacklogPreviewService');

async function main() {
  delete process.env.AURA_ATLAS_LIVE_API;
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedFixture(db);
    const before = sideEffectCounts(db);
    const preview = await invokeServiceCommand('metadata.hydration_backlog.preview', {
      externalIoState: 'off',
      limit: 5
    }, { db });
    const after = sideEffectCounts(db);

    assertSame(after, before, 'hydration backlog preview should not mutate DB tables');
    verifyPreview(preview);
    verifyDirectBuilder(db);
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'hydration backlog preview verified',
      summary: preview.summary,
      external_io: preview.external_io,
      sample_provider_needed: preview.candidates.entity_labels.representatives.find((entry) => entry.provider_needed),
      sample_known_local: preview.candidates.entity_labels.representatives.find((entry) => entry.label_state === 'known_local_label'),
      lanes: preview.lanes.map((lane) => ({
        lane_id: lane.lane_id,
        candidate_count: lane.candidate_count,
        provider_needed_count: lane.provider_needed_count,
        locally_known_count: lane.locally_known_count,
        local_sde_gap_count: lane.local_sde_gap_count,
        waiting_is_failure: lane.waiting_is_failure,
        persisted_queue: lane.persisted_queue
      })),
      boundary: preview.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
  }
}

function verifyPreview(preview) {
  assert(preview.read_only === true, 'preview should be read-only');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.hydration_writes === 0, 'preview should not write hydration output');
  assert(preview.persisted_backlog === false, 'preview should not persist a backlog');
  assert(preview.schema_changes === false, 'preview should not require schema changes');
  assert(preview.summary.hydration_creates_evidence === false, 'hydration preview must not create evidence');
  assert(preview.summary.discovery_refs_used_as_evidence === false, 'discovery refs must not become evidence');
  assert(preview.summary.missing_labels_are_report_failure === false, 'missing labels must not be report failure');
  assert(preview.external_io.provider_backed_hydration_posture === 'held_by_external_io', 'provider-backed hydration should be held when External I/O is off');
  assert(preview.external_io.held_is_failure === false, 'External I/O hold should not be failure');

  const providerNeeded = preview.candidates.entity_labels.representatives.find((entry) => entry.entity_id === 90000003);
  assert(providerNeeded, 'provider-needed character should be represented');
  assert(providerNeeded.label_state === 'provider_needed', 'missing local entity label should be provider-needed');
  assert(providerNeeded.provider_needed === true, 'provider-needed candidate should declare provider need');
  assert(providerNeeded.hydration_boundary.includes('readability metadata'), 'candidate should preserve hydration boundary');

  const knownLocal = preview.candidates.entity_labels.representatives.find((entry) => entry.entity_id === 98000002);
  assert(knownLocal, 'known local corporation should be represented');
  assert(knownLocal.label_state === 'known_local_label', 'known local candidate should be locally known');
  assert(knownLocal.provider_needed === false, 'known local candidate should not require provider');
  assert(knownLocal.freshness === 'stale_over_30_days', 'known local stale label should expose freshness');

  const sdeGap = preview.candidates.local_sde_gaps.representatives.find((entry) => entry.id === 999999);
  assert(sdeGap, 'missing local SDE type should be represented');
  assert(sdeGap.label_state === 'local_sde_gap', 'missing type should be a local SDE gap');
  assert(sdeGap.provider_needed === false, 'local SDE gap should not require ESI');
  assert(sdeGap.recommended_source.includes('local SDE'), 'SDE gap should point to local SDE metadata');

  assert(lane(preview, 'view_local_record').candidate_count > 0, 'view/local-record lane should have candidates');
  assert(lane(preview, 'watch_background').candidate_count > 0, 'Watch/background lane should have candidates');
  assert(lane(preview, 'target_report_scoped').candidate_count > 0, 'target/report-scoped lane should have candidates');
  assert(lane(preview, 'corpus_hygiene_low_priority').local_sde_gap_count > 0, 'corpus hygiene lane should include local SDE gaps');
  for (const entry of preview.lanes) {
    assert(entry.waiting_is_failure === false, `${entry.lane_id} should treat backlog as normal waiting`);
    assert(entry.persisted_queue === false, `${entry.lane_id} should not create a queue`);
  }

  assert(preview.metadata_run_context.recent_runs.length === 1, 'recent metadata run context should be included');
  assert(preview.gate_stack_context.metadata_hydration.external_io_state === 'held_by_external_io', 'gate context should preserve External I/O hold');
  assert(preview.gate_stack_context.local_metadata_status.external_io_state === 'local_only_available', 'local metadata status should stay available');
  assert(preview.gate_stack_context.local_report_view.external_io_state === 'local_only_available', 'local report view should stay available');
}

function verifyDirectBuilder(db) {
  const preview = buildHydrationBacklogPreview(db, { externalIoState: 'on', limit: 3 }, { commandMetadata: listServiceCommands() });
  assert(preview.external_io.provider_backed_hydration_posture === 'released_to_normal_gates', 'External I/O on should only release hydration to normal gates');
  assert(preview.external_io.reenable_policy.includes('no catch-up flood'), 're-enable policy should say no catch-up flood');
}

function verifyCommandRegistration() {
  const command = listServiceCommands().find((entry) => entry.command === 'metadata.hydration_backlog.preview');
  assert(command, 'hydration backlog preview command should be registered');
  assert(command.classification === 'read-only', 'hydration backlog preview should be read-only');
  assert(command.effects.includes('read-only'), 'hydration backlog preview should declare read-only effect');
  assert(command.renderer_allowed === true, 'hydration backlog preview should be renderer eligible');
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
    entities: count(db, 'entities'),
    metadata_runs: count(db, 'metadata_runs'),
    activity_events: count(db, 'activity_events'),
    killmails: count(db, 'killmails'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
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
