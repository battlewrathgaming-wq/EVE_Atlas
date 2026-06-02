const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildHydrationAttentionLensPreview } = require('../src/main/services/hydrationAttentionLensService');

async function main() {
  delete process.env.AURA_ATLAS_LIVE_API;
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedFixture(db);
    const before = sideEffectCounts(db);
    const preview = await invokeServiceCommand('metadata.hydration_attention_lens.preview', {
      externalIoState: 'off',
      reportTarget: {
        entityType: 'character',
        entityId: 90000003
      },
      now: '2026-06-01T00:00:00Z',
      selectedLimit: 3
    }, { db });
    const after = sideEffectCounts(db);

    assertSame(after, before, 'hydration attention lens should not mutate DB tables');
    verifyPreview(preview);
    verifyDirectBuilder(db);
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'hydration attention lens verified',
      summary: preview.summary,
      lens_input: preview.lens_input,
      selected: preview.selected_candidates.map(compactCandidate),
      deferred: preview.deferred_candidates.map(compactCandidate),
      candidate_groups: preview.candidate_groups,
      priority_posture: preview.priority_posture,
      evidence_boundary: preview.evidence_boundary,
      boundary: preview.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
  }
}

function verifyPreview(preview) {
  assert(preview.action === 'metadata.hydration_attention_lens.preview', 'preview action should be named');
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
  assert(preview.assessment_memory_mutations === 0, 'preview should not mutate Assessment Memory');
  assert(preview.marked_mutations === 0, 'preview should not mutate Marked state');
  assert(preview.support_artifacts_created === 0, 'preview should not create support artifacts');
  assert(preview.persisted_queue === false, 'preview should not persist a queue');
  assert(preview.schema_changes === false, 'preview should not change schema');
  assert(preview.runtime_enforcement_active === false, 'preview should not activate runtime enforcement');
  assert(preview.command_blocking_active === false, 'preview should not activate command blocking');
  assert(preview.ui_work === false, 'preview should not do UI work');

  assert(preview.lens_input.lens_type === 'target_report_scope', 'report target should create target_report_scope lens');
  assert(preview.lens_input.provider_authorization === false, 'lens input should not authorize providers');
  assert(preview.source_preview.action === 'metadata.hydration_candidates.preview', 'attention lens should reuse candidate preview source shape');
  assert(preview.summary.selected_candidate_count === 3, 'fixture should select three readability landmarks');
  assert(preview.summary.deferred_background_candidate_count > 0, 'fixture should leave unresolved/deferred candidates visible');
  assert(preview.summary.provider_needed_selected_count >= 1, 'fixture should include provider-needed selected candidate');
  assert(preview.summary.known_local_selected_count >= 1, 'fixture should include known-local selected candidate');
  assert(preview.summary.local_sde_gap_selected_count >= 1, 'fixture should include selected local SDE gap');
  assert(preview.summary.selected_attention_is_queue === false, 'selected attention should not be a queue');
  assert(preview.summary.selected_attention_authorizes_provider_calls === false, 'selected attention should not authorize provider calls');
  assert(preview.summary.view_local_record_not_starved_by_watch_background === true, 'view/local-record should not be starved by Watch/background');

  const reportCandidate = selected(preview, 'entity:character:90000003');
  assert(reportCandidate.group === 'provider_needed', 'missing report target label should be provider-needed');
  assert(reportCandidate.attention_basis.includes('report_target_match'), 'report target should disclose lens basis');
  assert(reportCandidate.attention_role === 'selected_readability_landmark', 'selected candidate should be readability landmark');
  assert(reportCandidate.source_anchors.some((entry) => entry.type === 'killmail_ids'), 'selected candidate should retain source anchors');

  const staleLocal = selected(preview, 'entity:corporation:98000002');
  assert(staleLocal.group === 'known_local', 'stale local label should still be a known-local readability landmark');
  assert(staleLocal.label_state === 'stale_local_label', 'stale local label state should be preserved');
  assert(staleLocal.local_label === 'Known Local Corp', 'stale local label should expose readable label');

  const sdeGap = selected(preview, 'local_sde:inventory_type:999999');
  assert(sdeGap.group === 'local_sde_gap', 'missing type should be local SDE gap');
  assert(sdeGap.provider_needed === false, 'local SDE gap should not be provider-needed ESI Hydration');

  const watchDeferred = deferred(preview, 'entity:character:90000004');
  assert(watchDeferred.deferred_reason === 'watch_background_patient_not_point_of_need' || watchDeferred.deferred_reason === 'selection_limit_keeps_candidate_unresolved_visible', 'Watch/background candidate should stay deferred/patient');
  assert(watchDeferred.lanes.includes('watch_background'), 'deferred Watch candidate should retain Watch lane');

  assert(preview.candidate_groups.selected.provider_needed >= 1, 'selected groups should count provider-needed separately');
  assert(preview.candidate_groups.selected.known_local >= 1, 'selected groups should count known-local separately');
  assert(preview.candidate_groups.selected.local_sde_gap >= 1, 'selected groups should count local SDE gaps separately');
  assert(preview.priority_posture.watch_background_candidates_are_patient === true, 'Watch/background should be patient');
  assert(preview.evidence_boundary.ids_are_facts === true, 'IDs should remain facts');
  assert(preview.evidence_boundary.labels_are_readability === true, 'labels should be readability');
  assert(preview.evidence_boundary.hydration_creates_evidence === false, 'Hydration should not create Evidence/EVEidence');
  assert(preview.evidence_boundary.unhydrated_ids_are_failure === false, 'unhydrated IDs should not be failure');
  assert(preview.evidence_boundary.unhydrated_ids_are_missing_evidence === false, 'unhydrated IDs should not be missing Evidence/EVEidence');
  assert(preview.evidence_boundary.selected_attention_is_assessment_memory === false, 'selected attention should not be Assessment Memory');
}

function verifyDirectBuilder(db) {
  const preview = buildHydrationAttentionLensPreview(db, {
    explicitIds: ['entity:character:90000004'],
    now: '2026-06-01T00:00:00Z',
    selectedLimit: 1
  });
  assert(preview.lens_input.lens_type === 'explicit_ids', 'explicit IDs should define explicit lens');
  assert(preview.selected_candidates[0].dedupe_key === 'entity:character:90000004', 'explicit Watch candidate should be selectable without provider movement');
  assert(preview.provider_calls === 0, 'direct builder should not call providers');
  assert(preview.persisted_queue === false, 'direct builder should not persist a queue');
}

function verifyCommandRegistration() {
  const command = listServiceCommands().find((entry) => entry.command === 'metadata.hydration_attention_lens.preview');
  assert(command, 'hydration attention lens command should be registered');
  assert(command.classification === 'read-only', 'hydration attention lens should be read-only');
  assert(command.effects.includes('read-only'), 'hydration attention lens should declare read-only effect');
  assert(command.renderer_allowed === true, 'hydration attention lens should be renderer eligible');
}

function seedFixture(db) {
  db.prepare(`
    INSERT INTO entities (
      entity_type, entity_id, entity_name, first_seen_at, last_seen_at, last_enriched_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run('corporation', 98000002, 'Known Local Corp', '2026-01-01T00:00:00Z', '2026-05-01T00:00:00Z', '2026-01-01T00:00:00Z');
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

function selected(preview, dedupeKey) {
  const entry = preview.selected_candidates.find((item) => item.dedupe_key === dedupeKey);
  assert(entry, `${dedupeKey} should be selected`);
  return entry;
}

function deferred(preview, dedupeKey) {
  const entry = preview.deferred_candidates.find((item) => item.dedupe_key === dedupeKey);
  assert(entry, `${dedupeKey} should be deferred`);
  return entry;
}

function compactCandidate(candidate) {
  return {
    dedupe_key: candidate.dedupe_key,
    group: candidate.group,
    label_state: candidate.label_state,
    lanes: candidate.lanes,
    attention_basis: candidate.attention_basis,
    deferred_reason: candidate.deferred_reason
  };
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
