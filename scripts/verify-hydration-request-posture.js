const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildHydrationRequestPosturePreview } = require('../src/main/services/hydrationRequestPostureService');
const { projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  delete process.env.AURA_ATLAS_LIVE_API;
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedFixture(db);
    const before = sideEffectCounts(db);
    const samples = {
      not_request_focus: await preview(db, {
        idType: 'character',
        idValue: 90000003,
        operatorAct: false,
        interaction: 'focus'
      }),
      already_local: await preview(db, {
        idType: 'character',
        idValue: 90000002,
        operatorAct: true,
        sourceSurface: 'operator-selection',
        basisAnchor: { event_key: '8201:attacker:90000002' }
      }),
      local_lookup_available: await preview(db, {
        idType: 'inventory_type',
        idValue: 603,
        operatorAct: true,
        sourceSurface: 'operator-selection',
        basisAnchor: { event_key: '8201:attacker:90000003' }
      }),
      local_sde_gap: await preview(db, {
        idType: 'inventory_type',
        idValue: 999999,
        operatorAct: true,
        sourceSurface: 'operator-selection',
        basisAnchor: { event_key: '8201:attacker:90000003' }
      }),
      provider_held_external_io: await preview(db, {
        idType: 'character',
        idValue: 90000003,
        operatorAct: true,
        sourceSurface: 'operator-selection',
        basisAnchor: { event_key: '8201:attacker:90000003' }
      }),
      storage_blocked: await preview(db, {
        ...missingStorageFixture(),
        idType: 'character',
        idValue: 90000003,
        operatorAct: true,
        sourceSurface: 'operator-selection',
        externalIo: { state: 'on' },
        basisAnchor: { event_key: '8201:attacker:90000003' }
      }, { externalIoState: 'on' }),
      insufficient_basis: await preview(db, {
        idType: 'character',
        idValue: 90000099,
        operatorAct: true,
        sourceSurface: 'operator-selection'
      }),
      invalid: await preview(db, {
        idType: 'region',
        idValue: 10000001,
        operatorAct: true,
        sourceSurface: 'operator-selection'
      })
    };
    const after = sideEffectCounts(db);

    assertSame(after, before, 'hydration request posture preview should not mutate DB tables');
    verifySamples(samples);
    verifyDirectBuilder(db);
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'hydration request posture preview verified',
      sample_states: Object.fromEntries(Object.entries(samples).map(([key, value]) => [key, value.summary])),
      sample_provider_gate: samples.provider_held_external_io.posture_row.gates,
      sample_storage_block: samples.storage_blocked.storage_write_posture,
      boundary: samples.provider_held_external_io.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
  }
}

async function preview(db, payload, context = {}) {
  return invokeServiceCommand('metadata.hydration_request_posture.preview', {
    ...readyStorageFixture(),
    ...payload,
    now: '2026-06-01T00:00:00Z'
  }, {
    db,
    allowStorageSetupGateFixtureInput: true,
    storageBudgetBytes: 4096,
    externalIoState: 'off',
    ...context
  });
}

function verifySamples(samples) {
  for (const sample of Object.values(samples)) {
    assertReadOnly(sample);
  }
  assert(samples.not_request_focus.request_posture_state === 'not_a_request', 'focus should not become a Hydration request');
  assert(samples.not_request_focus.posture_row.provider_needed === false, 'focus should not need provider movement');
  assert(samples.not_request_focus.posture_row.pickup_eligible === false, 'focus should not create pickup eligibility');

  assert(samples.already_local.request_posture_state === 'already_local', 'local entity label should short-circuit');
  assert(samples.already_local.posture_row.local_label === 'Known Pilot', 'already_local should expose local label');
  assert(samples.already_local.posture_row.provider_needed === false, 'already_local should not need provider');

  assert(samples.local_lookup_available.request_posture_state === 'local_lookup_available', 'inventory type label should use local lookup');
  assert(samples.local_lookup_available.posture_row.local_label === 'Merlin', 'local lookup should expose type name');
  assert(samples.local_lookup_available.posture_row.provider_needed === false, 'local lookup should not need ESI');

  assert(samples.local_sde_gap.request_posture_state === 'local_lookup_available', 'missing SDE label should stay local lookup posture');
  assert(samples.local_sde_gap.posture_row.label_state === 'local_sde_gap', 'missing type should be local_sde_gap');
  assert(samples.local_sde_gap.posture_row.provider_needed === false, 'local SDE gap should not need provider');

  assert(samples.provider_held_external_io.request_posture_state === 'held', 'supported missing entity label should be held when External I/O is off');
  assert(samples.provider_held_external_io.posture_row.label_state === 'provider_needed', 'supported missing label should be provider_needed');
  assert(samples.provider_held_external_io.posture_row.provider_posture === 'held_by_external_io', 'External I/O off should hold provider-backed Hydration');
  assert(samples.provider_held_external_io.external_io.held_is_failure === false, 'External I/O hold should not be failure');
  assert(samples.provider_held_external_io.external_io.external_io_on_is_authorization === false, 'External I/O on is not authorization');

  assert(samples.storage_blocked.request_posture_state === 'blocked', 'missing storage should block future Hydration writes');
  assert(samples.storage_blocked.posture_row.reason_codes.includes('blocked_by_storage_write_posture'), 'storage block should name storage write posture');
  assert(samples.storage_blocked.storage_write_posture.future_hydration_writes_blocked === true, 'storage gate should show future write block');

  assert(samples.insufficient_basis.request_posture_state === 'insufficient_basis', 'free-floating supported ID should need local basis');
  assert(samples.insufficient_basis.posture_row.provider_needed === false, 'insufficient basis should not request provider movement');

  assert(samples.invalid.request_posture_state === 'invalid', 'unsupported ID type should be invalid');
  assert(samples.invalid.posture_row.label_state === 'invalid_or_unsupported_id', 'invalid should name unsupported ID');

  assert(samples.provider_held_external_io.evidence_boundary.hydration_creates_evidence === false, 'Hydration should not create Evidence/EVEidence');
  assert(samples.provider_held_external_io.persisted_queue === false, 'preview should not persist queue');
  assert(samples.provider_held_external_io.pickup_created === false, 'preview should not create pickup');
  assert(samples.provider_held_external_io.execution_started === false, 'preview should not start execution');
}

function verifyDirectBuilder(db) {
  const direct = buildHydrationRequestPosturePreview(db, {
    ...readyStorageFixture(),
    idType: 'character',
    idValue: 90000003,
    operatorAct: true,
    sourceSurface: 'operator-selection'
  }, {
    allowStorageSetupGateFixtureInput: true,
    storageBudgetBytes: 4096,
    externalIoState: 'off'
  });
  assert(direct.request_posture_state === 'held', 'direct builder should derive held posture from local basis and External I/O off');
}

function verifyCommandRegistration() {
  const command = listServiceCommands().find((entry) => entry.command === 'metadata.hydration_request_posture.preview');
  assert(command, 'hydration request posture command should be registered');
  assert(command.classification === 'read-only', 'hydration request posture should be read-only');
  assert(command.effects.includes('read-only'), 'hydration request posture should declare read-only effect');
  assert(command.renderer_allowed === true, 'hydration request posture should be renderer eligible');
}

function assertReadOnly(preview) {
  assert(preview.action === 'metadata.hydration_request_posture.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should be read-only');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.hydration_writes === 0, 'preview should not write Hydration output');
  assert(preview.metadata_run_writes === 0, 'preview should not write metadata runs');
  assert(preview.entity_writes === 0, 'preview should not write entities');
  assert(preview.activity_event_label_patches === 0, 'preview should not patch activity_event labels');
  assert(preview.evidence_writes === 0, 'preview should not write Evidence/EVEidence');
  assert(preview.discovery_ref_mutations === 0, 'preview should not mutate Discovery refs');
  assert(preview.watch_mutations === 0, 'preview should not mutate Watch rows');
  assert(preview.assessment_memory_mutations === 0, 'preview should not mutate Assessment Memory');
  assert(preview.marked_mutations === 0, 'preview should not mutate Marked state');
  assert(preview.support_artifacts_created === 0, 'preview should not create support artifacts');
  assert(preview.persisted_queue_created === false, 'preview should not create persisted queue');
  assert(preview.queue_dispatches === 0, 'preview should not dispatch queue work');
  assert(preview.schema_changes === false, 'preview should not change schema');
  assert(preview.runtime_enforcement_active === false, 'preview should not activate enforcement');
  assert(preview.command_blocking_active === false, 'preview should not activate command blocking');
  assert(preview.storage_config_writes === 0, 'preview should not write storage config');
  assert(preview.external_io_config_writes === 0, 'preview should not write External I/O config');
  assert(preview.ui_work === false, 'preview should not do UI work');
}

function seedFixture(db) {
  db.prepare(`
    INSERT INTO entities (
      entity_type, entity_id, entity_name, first_seen_at, last_seen_at, last_enriched_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run('character', 90000002, 'Known Pilot', '2026-05-01T00:00:00Z', '2026-05-01T00:00:00Z', '2026-05-30T00:00:00Z');
  db.prepare(`
    INSERT INTO type_metadata (
      type_id, type_name, group_id, group_name, category_id, category_name, last_fetched
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(603, 'Merlin', 25, 'Frigate', 6, 'Ship', '2026-05-01T00:00:00Z');
  insertKillmail(db, 8201);
  insertEvent(db, {
    eventKey: '8201:attacker:90000002',
    killmailId: 8201,
    characterId: 90000002,
    characterName: 'Known Pilot',
    corporationId: 98000002,
    shipTypeId: 603
  });
  insertEvent(db, {
    eventKey: '8201:attacker:90000003',
    killmailId: 8201,
    characterId: 90000003,
    characterName: null,
    corporationId: 98000003,
    shipTypeId: 999999
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
    '2026-05-30T10:00:00Z',
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
    'attacker',
    'character',
    fixture.characterId,
    fixture.characterName,
    fixture.characterId,
    fixture.characterName,
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
    'manual_actor',
    fixture.characterId,
    'fixture'
  );
}

function readyStorageFixture() {
  const dbPath = path.join(projectRoot(), '.tmp', 'hydration-request-posture', 'ready', 'atlas.sqlite');
  return {
    storagePreflight: fixturePreflight({
      mode: 'configured',
      source: 'configured',
      path: dbPath,
      exists: true
    }),
    storageAuthority: {
      mode: 'selected_storage',
      selected: true,
      config_source: 'fixture_explicit_selection',
      config_version: 1,
      budget_source: 'fixture_configured',
      budget_bytes: 4096
    }
  };
}

function missingStorageFixture() {
  const dbPath = path.join(projectRoot(), '.tmp', 'hydration-request-posture', 'missing', 'atlas.sqlite');
  return {
    storagePreflight: fixturePreflight({
      mode: 'missing',
      source: 'configured',
      path: dbPath,
      exists: false
    }),
    storageAuthority: {
      mode: 'selected_storage_missing_unavailable',
      selected: true,
      config_source: 'fixture_explicit_selection',
      config_version: 1,
      budget_source: 'fixture_configured',
      budget_bytes: 4096
    }
  };
}

function fixturePreflight({
  mode,
  source,
  path: dbPath,
  exists,
  databaseBytes = 32,
  controlledBytes = 96
}) {
  return {
    action: 'storage.authority_preflight',
    read_only: true,
    mutates_state: false,
    database: {
      path: dbPath,
      source,
      mode,
      mode_flags: {
        configured: source === 'configured',
        fallback: source !== 'configured',
        missing: !exists,
        outside_policy: false,
        demo_fixture: false
      },
      parent: {
        path: path.dirname(dbPath),
        exists: exists !== false,
        is_directory: exists !== false
      },
      exists: exists === true,
      total_bytes: databaseBytes
    },
    snapshot: {
      settings: {
        status: 'ready'
      }
    },
    byte_usage: {
      database_bytes: databaseBytes,
      known_controlled_locations_bytes: controlledBytes
    }
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
