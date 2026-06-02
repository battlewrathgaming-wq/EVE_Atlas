const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildHydrationAttentionRuntimePosturePreview } = require('../src/main/services/hydrationAttentionRuntimePostureService');

async function main() {
  delete process.env.AURA_ATLAS_LIVE_API;
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedFixture(db);
    const before = sideEffectCounts(db);
    const preview = await invokeServiceCommand('metadata.hydration_attention_runtime.preview', {
      externalIoState: 'off',
      reportTarget: {
        entityType: 'character',
        entityId: 90000003
      },
      now: '2026-06-01T00:00:00Z',
      selectedLimit: 3
    }, {
      db,
      source: 'renderer'
    });
    const after = sideEffectCounts(db);

    assertSame(after, before, 'hydration attention runtime posture should not mutate DB tables');
    verifyPreview(preview);
    verifyDirectBuilder(db);
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'hydration attention runtime posture verified',
      command: preview.action,
      input_lens_summary: preview.input_lens_summary,
      runtime_summary: preview.runtime_posture.summary,
      posture_scope: preview.runtime_posture.posture_scope,
      external_io: preview.runtime_posture.external_io,
      storage_setup: preview.runtime_posture.storage_setup,
      groups: Object.fromEntries(Object.entries(preview.runtime_posture.groups).map(([key, value]) => [
        key,
        {
          count: value.count,
          representatives: value.representatives.map(compactItem)
        }
      ])),
      boundary_statements: preview.boundary_statements,
      boundary: preview.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
  }
}

function verifyPreview(preview) {
  assert(preview.action === 'metadata.hydration_attention_runtime.preview', 'preview action should be named');
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

  assert(preview.input_lens_summary.action === 'metadata.hydration_attention_lens.preview', 'runtime posture should reuse the attention lens');
  assert(preview.input_lens_summary.lens_type === 'target_report_scope', 'fixture should be target/report-scoped');
  assert(preview.input_lens_summary.provider_authorization === false, 'lens input should not authorize providers');

  const summary = preview.runtime_posture.summary;
  assert(summary.provider_needed_labels >= 1, 'runtime posture should count provider-needed labels');
  assert(summary.known_local_labels >= 1, 'runtime posture should count known local labels');
  assert(summary.local_sde_lookup_gaps >= 1, 'runtime posture should count local SDE gaps');
  assert(summary.raw_visible_for_now >= 1, 'runtime posture should count raw visible/deferred IDs');
  assert(summary.deferred_candidates >= 1, 'runtime posture should count deferred candidates');
  assert(summary.selected_attention_authorizes_provider_calls === false, 'selected attention must not authorize provider calls');
  assert(summary.eligibility_authorizes_provider_calls === false, 'eligibility must not authorize provider calls');
  assert(summary.local_readability_need_authorizes_provider_calls === false, 'local readability need must not authorize provider calls');
  assert(summary.provider_needed_labels_are_failure === false, 'provider-needed labels should not be failure');
  assert(summary.unhydrated_ids_are_report_failure === false, 'unhydrated IDs should not be report failure');
  assert(summary.local_readout_blocked_by_storage === false, 'storage should not block this local readout');

  assert(preview.runtime_posture.external_io.provider_backed_hydration_posture === 'held_by_external_io', 'External I/O off should hold provider-needed labels');
  assert(preview.runtime_posture.external_io.held_is_failure === false, 'External I/O hold should not be failure');
  assert(preview.runtime_posture.external_io.provider_calls === 0, 'External I/O posture should not spend calls');
  assert(preview.runtime_posture.external_io.selected_attention_is_authorization === false, 'selected attention should not become authorization');
  assert(preview.runtime_posture.storage_setup.local_readout_available === true, 'storage posture should keep local readout available');
  assert(preview.runtime_posture.storage_setup.local_readout_blocked_by_storage === false, 'storage posture should not block readout');

  const providerNeeded = representative(preview, 'provider_needed_labels', 'entity:character:90000003');
  assert(providerNeeded.runtime_state === 'provider_needed_label', 'report target should be provider-needed label');
  assert(providerNeeded.provider_posture.state === 'held_by_external_io', 'provider-needed label should be held by External I/O off');
  assert(providerNeeded.provider_call_authorized === false, 'provider-needed label should not authorize provider call');
  assert(providerNeeded.reason_codes.includes('provider_label_held_by_external_io'), 'provider-needed label should disclose External I/O hold');

  const knownLocal = representative(preview, 'known_local_labels', 'entity:corporation:98000002');
  assert(knownLocal.runtime_state === 'known_local_label', 'stale local label should be known-local runtime posture');
  assert(knownLocal.local_label === 'Known Local Corp', 'known local representative should expose label');

  const sdeGap = representative(preview, 'local_sde_lookup_gaps', 'local_sde:inventory_type:999999');
  assert(sdeGap.runtime_state === 'local_sde_lookup_gap', 'missing type should be local SDE lookup gap');
  assert(sdeGap.provider_needed === false, 'local SDE gap should not be provider-needed Hydration');
  assert(sdeGap.reason_codes.includes('local_sde_gap_not_provider_hydration'), 'SDE gap should disclose provider boundary');

  const raw = representative(preview, 'raw_visible_for_now', 'entity:character:90000004');
  assert(raw.runtime_state === 'raw_visible_for_now', 'deferred Watch/background ID should stay raw visible for now');
  assert(raw.posture_scope === 'Watch/background', 'raw deferred item should disclose Watch/background scope');
  assert(raw.reason_codes.includes('raw_id_remains_visible_truthful'), 'raw item should state ID remains truthful');

  assert(preview.boundary_statements.ids_are_facts === true, 'IDs should remain facts');
  assert(preview.boundary_statements.labels_are_readability === true, 'labels should be readability');
  assert(preview.boundary_statements.provider_needed_labels_are_evidence_work === false, 'provider-needed labels should not be Evidence/EVEidence work');
  assert(preview.boundary_statements.local_sde_gaps_are_provider_hydration === false, 'local SDE gaps should not be provider-backed Hydration');
  assert(preview.boundary_statements.persisted_hydration_queue_created === false, 'runtime posture should not create a queue');
}

function verifyDirectBuilder(db) {
  const preview = buildHydrationAttentionRuntimePosturePreview(db, {
    externalIoState: 'on',
    explicitIds: ['entity:character:90000004'],
    now: '2026-06-01T00:00:00Z',
    selectedLimit: 1
  });
  assert(preview.input_lens_summary.lens_type === 'explicit_ids', 'explicit IDs should define explicit runtime posture scope');
  assert(preview.runtime_posture.external_io.provider_backed_hydration_posture === 'released_to_normal_gates_only', 'External I/O on should only release to normal gates');
  assert(preview.runtime_posture.external_io.external_io_on_is_authorization === false, 'External I/O on should remain non-authorizing');
  assert(preview.provider_calls === 0, 'direct builder should not call providers');
  assert(preview.persisted_queue === false, 'direct builder should not persist a queue');
}

function verifyCommandRegistration() {
  const command = listServiceCommands().find((entry) => entry.command === 'metadata.hydration_attention_runtime.preview');
  assert(command, 'hydration attention runtime command should be registered');
  assert(command.classification === 'read-only', 'hydration attention runtime should be read-only');
  assert(command.effects.includes('read-only'), 'hydration attention runtime should declare read-only effect');
  assert(command.renderer_allowed === true, 'hydration attention runtime should be renderer eligible');
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

function representative(preview, groupName, dedupeKey) {
  const entry = preview.runtime_posture.groups[groupName].representatives.find((item) => item.dedupe_key === dedupeKey);
  assert(entry, `${dedupeKey} should be represented in ${groupName}`);
  return entry;
}

function compactItem(item) {
  return {
    dedupe_key: item.dedupe_key,
    runtime_state: item.runtime_state,
    posture_scope: item.posture_scope,
    provider_posture: item.provider_posture.state,
    reason_codes: item.reason_codes
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
