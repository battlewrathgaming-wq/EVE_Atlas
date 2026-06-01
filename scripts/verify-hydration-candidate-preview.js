const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildHydrationCandidatePreview } = require('../src/main/services/hydrationCandidatePreviewService');

async function main() {
  delete process.env.AURA_ATLAS_LIVE_API;
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedFixture(db);
    const before = sideEffectCounts(db);
    const preview = await invokeServiceCommand('metadata.hydration_candidates.preview', {
      externalIoState: 'off',
      reportTarget: {
        entityType: 'character',
        entityId: 90000003
      },
      now: '2026-06-01T00:00:00Z',
      limit: 20
    }, { db });
    const after = sideEffectCounts(db);

    assertSame(after, before, 'hydration candidate preview should not mutate DB tables');
    verifyPreview(preview);
    verifyDirectBuilder(db);
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'hydration candidate preview verified',
      summary: preview.summary,
      lane_counts: preview.summary.lane_counts,
      sample_report_candidate: candidate(preview, 'entity:character:90000003'),
      sample_watch_candidate: candidate(preview, 'entity:character:90000004'),
      sample_sde_gap: candidate(preview, 'local_sde:inventory_type:999999'),
      external_io: preview.external_io,
      evidence_boundary: preview.evidence_boundary,
      boundary: preview.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
  }
}

function verifyPreview(preview) {
  assert(preview.action === 'metadata.hydration_candidates.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should be read-only');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.hydration_writes === 0, 'preview should not write Hydration output');
  assert(preview.entity_writes === 0, 'preview should not write entities');
  assert(preview.activity_event_label_patches === 0, 'preview should not patch activity_event labels');
  assert(preview.metadata_run_writes === 0, 'preview should not write metadata runs');
  assert(preview.evidence_writes === 0, 'preview should not write Evidence/EVEidence');
  assert(preview.discovery_ref_mutations === 0, 'preview should not mutate Discovery refs');
  assert(preview.watch_mutations === 0, 'preview should not mutate Watch rows');
  assert(preview.support_artifacts_created === 0, 'preview should not create support artifacts');
  assert(preview.persisted_queue === false, 'preview should not persist queue state');
  assert(preview.schema_changes === false, 'preview should not change schema');

  assert(preview.summary.total_candidates === preview.summary.unique_dedupe_keys, 'each dedupe key should appear once in the candidate list');
  assert(preview.candidates.filter((entry) => entry.dedupe_key === 'entity:character:90000003').length === 1, 'repeated report-visible ID should dedupe to one candidate');

  const reportCandidate = candidate(preview, 'entity:character:90000003');
  assert(reportCandidate.killmail_count === 2, 'deduped candidate should aggregate multiple killmail appearances');
  assert(reportCandidate.lanes.includes('target_report_scoped'), 'report-visible candidate should be in target/report-scoped lane');
  assert(reportCandidate.provider_needed === true, 'missing local entity label should be provider-needed');
  assert(reportCandidate.label_state === 'provider_needed', 'missing entity label should be provider_needed');
  assert(reportCandidate.hydration_boundary.includes('readability'), 'candidate should state Hydration readability boundary');
  assert(reportCandidate.evidence_boundary.includes('not Evidence/EVEidence'), 'provider-needed label should not be Evidence/EVEidence work');

  const watchCandidate = candidate(preview, 'entity:character:90000004');
  assert(watchCandidate.lanes.includes('watch_background'), 'Watch-derived candidate should be in Watch/background lane');
  assert(lane(preview, 'target_report_scoped').dedupe_keys.includes('entity:character:90000003'), 'target/report lane should reference selected/report-visible candidate');
  assert(lane(preview, 'watch_background').dedupe_keys.includes('entity:character:90000004'), 'Watch/background lane should reference Watch-derived candidate');
  assert(preview.lanes[0].lane_id === 'view_local_record', 'view/local-record lane should appear first');
  assert(preview.summary.watch_background_starves_view_local_record === false, 'Watch/background must not starve view/local-record candidates');

  const sdeGap = candidate(preview, 'local_sde:inventory_type:999999');
  assert(sdeGap.label_state === 'local_sde_gap', 'missing type should be local_sde_gap');
  assert(sdeGap.provider_needed === false, 'local SDE gap should not be ESI provider-needed entity Hydration');
  assert(sdeGap.hydration_boundary.includes('Local SDE'), 'SDE gap should keep local lookup boundary');
  assert(lane(preview, 'corpus_hygiene_low_priority').dedupe_keys.includes('local_sde:inventory_type:999999'), 'corpus hygiene should reference local SDE gap');

  const staleLocal = candidate(preview, 'entity:corporation:98000002');
  assert(staleLocal.label_state === 'stale_local_label', 'old local label should be stale_local_label');
  assert(staleLocal.local_label === 'Known Local Corp', 'stale local label should preserve readable local label');

  assert(preview.external_io.provider_backed_hydration_posture === 'held_by_external_io', 'External I/O off should hold provider-backed Hydration');
  assert(preview.external_io.held_is_failure === false, 'External I/O hold should not be failure');
  assert(preview.external_io.external_io_on_is_authorization === false, 'External I/O on must not be authorization');
  assert(preview.evidence_boundary.ids_are_facts === true, 'IDs should remain facts');
  assert(preview.evidence_boundary.labels_are_readability === true, 'labels should be readability');
  assert(preview.evidence_boundary.hydration_creates_evidence === false, 'Hydration should not create Evidence/EVEidence');
  assert(preview.evidence_boundary.provider_needed_labels_are_evidence_work === false, 'provider-needed Hydration should not be Evidence work');
}

function verifyDirectBuilder(db) {
  const preview = buildHydrationCandidatePreview(db, {
    externalIoState: 'on',
    now: '2026-06-01T00:00:00Z',
    limit: 5
  });
  assert(preview.external_io.provider_backed_hydration_posture === 'released_to_normal_gates', 'External I/O on should only release to normal gates');
  assert(preview.external_io.external_io_on_is_authorization === false, 'External I/O on should remain non-authorizing');
  assert(preview.summary.persisted_queue === false, 'direct builder should not create a queue');
}

function verifyCommandRegistration() {
  const command = listServiceCommands().find((entry) => entry.command === 'metadata.hydration_candidates.preview');
  assert(command, 'hydration candidate preview command should be registered');
  assert(command.classification === 'read-only', 'hydration candidate preview should be read-only');
  assert(command.effects.includes('read-only'), 'hydration candidate preview should declare read-only effect');
  assert(command.renderer_allowed === true, 'hydration candidate preview should be renderer eligible');
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
  `).run('character', 90000004, 'Watch Pilot', 30, 5, 1, 60, '2026-05-31T12:00:00Z', 'fixture watch');
  db.prepare(`
    INSERT INTO assessment_artifacts (
      artifact_id, artifact_type, entity_type, entity_id, entity_name, status,
      assessment_reason, created_at, updated_at, assessed_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('artifact_interest_90000003', 'entity_interest', 'character', 90000003, null, 'active', 'Fixture interest', '2026-05-31T00:00:00Z', '2026-05-31T00:00:00Z', 'fixture');
  db.prepare(`
    INSERT INTO metadata_runs (
      run_id, trigger, run_type, target_type, target_id, started_at, finished_at, status,
      ids_discovered, already_known, requested_from_esi, resolved, unresolved,
      activity_events_patched, api_calls_esi
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('metadata_fixture_recent', 'manual', 'report_scoped_ids', 'character', '90000003', '2026-05-30T00:00:00Z', '2026-05-30T00:01:00Z', 'success', 3, 1, 2, 2, 0, 1, 1);
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
  insertKillmail(db, 8201);
  insertKillmail(db, 8202);
  insertEvent(db, {
    eventKey: '8201:attacker:90000003',
    killmailId: 8201,
    characterId: 90000003,
    corporationId: 98000002,
    shipTypeId: 999999,
    discoveredByType: 'manual_actor',
    discoveredById: 90000003
  });
  insertEvent(db, {
    eventKey: '8202:attacker:90000003',
    killmailId: 8202,
    characterId: 90000003,
    corporationId: 98000002,
    shipTypeId: 999999,
    discoveredByType: 'manual_actor',
    discoveredById: 90000003
  });
  insertEvent(db, {
    eventKey: '8202:victim:90000004',
    killmailId: 8202,
    characterId: 90000004,
    corporationId: 98000002,
    shipTypeId: 603,
    discoveredByType: 'actor',
    discoveredById: 90000004
  });
}

function insertKillmail(db, killmailId) {
  db.prepare(`
    INSERT INTO killmails (
      killmail_id, killmail_hash, killmail_time, solar_system_id, raw_esi_payload,
      raw_payload_checksum, source, first_seen_at, last_seen_at, ingested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    killmailId,
    `hash_${killmailId}`,
    `2026-05-30T10:${String(killmailId % 60).padStart(2, '0')}:00Z`,
    30000001,
    '{}',
    `checksum_${killmailId}`,
    'fixture',
    '2026-05-30T10:00:00Z',
    '2026-05-30T10:00:00Z',
    '2026-05-30T10:00:00Z'
  );
}

function insertEvent(db, fixture) {
  db.prepare(`
    INSERT INTO activity_events (
      event_key, killmail_id, role, entity_type, entity_id, entity_name,
      character_id, character_name, corporation_id, corporation_name, alliance_id, alliance_name,
      ship_type_id, ship_type_name, weapon_type_id, final_blow, damage_done,
      solar_system_id, solar_system_name, region_id, region_name, killmail_time, ingested_at,
      discovered_by_type, discovered_by_id, normalizer_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    fixture.eventKey,
    fixture.killmailId,
    fixture.eventKey.includes(':victim:') ? 'victim' : 'attacker',
    'character',
    fixture.characterId,
    null,
    fixture.characterId,
    null,
    fixture.corporationId,
    null,
    null,
    null,
    fixture.shipTypeId,
    null,
    603,
    0,
    100,
    30000001,
    'Atlas Prime',
    10000001,
    'Test Region',
    '2026-05-30T10:00:00Z',
    '2026-05-30T10:00:00Z',
    fixture.discoveredByType,
    fixture.discoveredById,
    'fixture'
  );
}

function candidate(preview, dedupeKey) {
  const entry = preview.candidates.find((item) => item.dedupe_key === dedupeKey);
  assert(entry, `${dedupeKey} should be represented`);
  return entry;
}

function lane(preview, laneId) {
  const entry = preview.lanes.find((item) => item.lane_id === laneId);
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
    api_request_logs: count(db, 'api_request_logs'),
    assessment_artifacts: count(db, 'assessment_artifacts'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches')
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
