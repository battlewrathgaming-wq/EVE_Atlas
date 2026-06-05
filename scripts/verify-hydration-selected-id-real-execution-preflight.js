const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const previousLive = process.env.AURA_ATLAS_LIVE_API;
  try {
    process.env.AURA_ATLAS_LIVE_API = '1';
    const ready = await runCase('provider_needed_live_preflight_ready', seedProviderNeeded, successPayload(), readyContext());
    const cases = {
      not_a_request: await runCase('not_a_request', seedProviderNeeded, { ...successPayload(), operatorAct: false }, readyContext()),
      invalid: await runCase('invalid', seedProviderNeeded, { ...successPayload(), idType: 'region' }, readyContext()),
      insufficient_basis: await runCase('insufficient_basis', seedEmpty, successPayload(), readyContext()),
      already_local: await runCase('already_local', seedAlreadyLocal, successPayload(), readyContext()),
      local_lookup_available: await runCase('local_lookup_available', seedProviderNeeded, { ...successPayload(), idType: 'inventory_type', idValue: 603 }, readyContext()),
      held: await runCase('held', seedProviderNeeded, { ...successPayload(), externalIo: { state: 'off' } }, readyContext()),
      blocked: await runCase('blocked', seedProviderNeeded, { ...successPayload(), ...missingStorageFixture() }, readyContext())
    };

    delete process.env.AURA_ATLAS_LIVE_API;
    const notLiveReady = await runCase('provider_needed_but_not_live_ready', seedProviderNeeded, successPayload(), readyContext());
    const renderer = await runRendererCase();

    verifyReady(ready.preflight);
    verifyCases(cases);
    verifyNotLiveReady(notLiveReady.preflight);
    verifyRenderer(renderer);
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'hydration selected-ID real execution preflight verified',
      ready: compact(ready.preflight),
      provider_needed_but_not_live_ready: compact(notLiveReady.preflight),
      states: Object.fromEntries(Object.entries(cases).map(([name, result]) => [name, compact(result.preflight)])),
      renderer_authority: renderer.pickup_contract.renderer_input_authority,
      mutation_proof: ready.preflight.table_mutation_proof,
      boundary: ready.preflight.boundary
    }, null, 2));
  } finally {
    if (previousLive === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = previousLive;
    }
  }
}

async function runCase(name, seedFn, payload, context) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedFn(db);
    const before = snapshot(db);
    const preflight = await invokeServiceCommand('metadata.hydration_selected_id_real_execution_preflight.preview', {
      ...readyStorageFixture(),
      ...payload,
      local_label: 'renderer forged label',
      storagePosture: 'renderer_forged_allow',
      externalIoState: 'on',
      providerPosture: 'renderer_forged_release',
      gateSummary: { forged: true }
    }, {
      db,
      allowStorageSetupGateFixtureInput: true,
      storageBudgetBytes: 4096,
      ...context
    });
    const after = snapshot(db);
    assertSame(after, before, `${name} should not mutate DB tables`);
    assertSame(preflight.table_mutation_proof.before, before, `${name} preflight before counts should match`);
    assertSame(preflight.table_mutation_proof.after, after, `${name} preflight after counts should match`);
    verifyCommon(preflight);
    return { preflight, before, after };
  } finally {
    closeDatabase(db);
  }
}

async function runRendererCase() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedProviderNeeded(db);
    return invokeServiceCommand('metadata.hydration_selected_id_real_execution_preflight.preview', {
      ...readyStorageFixture(),
      ...successPayload(),
      localLabel: 'forged renderer label',
      storagePosture: 'forged renderer storage release',
      externalIoState: 'on',
      liveGate: { allowed: true },
      providerPosture: 'forged renderer provider release'
    }, {
      db,
      source: 'renderer',
      allowStorageSetupGateFixtureInput: true,
      storageBudgetBytes: 4096
    });
  } finally {
    closeDatabase(db);
  }
}

function verifyReady(preflight) {
  assert(preflight.preflight_state === 'provider_needed_live_preflight_ready', 'ready case should report live preflight ready');
  assert(preflight.request_posture.request_posture_state === 'provider_needed', 'ready case should preserve provider_needed request posture');
  assert(preflight.pickup_contract.pickup_candidate === true, 'ready case should produce pickup candidate');
  assert(preflight.external_io.held_by_external_io === false, 'ready case should not be held by External I/O');
  assert(preflight.live_provider_gate.allowed === true, 'ready case should expose live provider gate allowed');
  assert(preflight.storage_write_posture.future_hydration_writes_blocked === false, 'ready case should not block future Hydration writes');
  assert(preflight.command_authority.command_authority_satisfied_now === false, 'preflight should not satisfy command authority');
  assert(preflight.command_authority.fixture_proof_is_live_execution_authority === false, 'fixture proof should not be live authority');
  assert(preflight.expected_write_path.writes_authorized_now === false, 'preflight should not authorize writes');
}

function verifyCases(cases) {
  for (const [name, { preflight }] of Object.entries(cases)) {
    assert(preflight.preflight_state === name, `${name} should be classified`);
    assert(preflight.provider_calls === 0, `${name} should not call providers`);
    assert(preflight.table_mutation_proof.unchanged === true, `${name} should prove unchanged tables`);
  }
  assert(cases.already_local.preflight.local_first.short_circuit_to_local_readability === true, 'already_local should short-circuit to local readability');
  assert(cases.local_lookup_available.preflight.selected_id.supported_provider_hydration_type === false, 'local lookup type should not be provider-backed supported');
  assert(cases.held.preflight.external_io.held_by_external_io === true, 'held case should expose External I/O hold');
  assert(cases.blocked.preflight.storage_write_posture.future_hydration_writes_blocked === true, 'blocked case should expose storage write block');
}

function verifyNotLiveReady(preflight) {
  assert(preflight.preflight_state === 'provider_needed_but_not_live_ready', 'live disabled case should report provider-needed but not live ready');
  assert(preflight.request_posture.request_posture_state === 'blocked', 'live disabled case should preserve blocked request posture');
  assert(preflight.live_provider_gate.allowed === false, 'live disabled case should expose live provider gate blocked');
  assert(preflight.reason_codes.includes('live_or_provider_gate_not_ready'), 'live disabled case should disclose live/provider gate reason');
}

function verifyRenderer(preflight) {
  verifyCommon(preflight);
  assert(preflight.renderer_eligible === true, 'preflight should be renderer eligible as read-only preview');
  assert(preflight.pickup_contract.renderer_input_authority.source === 'renderer', 'renderer case should expose renderer source');
  assert(preflight.pickup_contract.renderer_input_authority.renderer_payload_authoritative === false, 'renderer payload should not be authoritative');
  assert(preflight.pickup_contract.renderer_input_authority.forged_authority_keys_ignored.includes('localLabel'), 'renderer forged label should be ignored');
  assert(preflight.pickup_contract.renderer_input_authority.forged_authority_keys_ignored.includes('storagePosture'), 'renderer forged storage posture should be ignored');
  assert(preflight.pickup_contract.renderer_input_authority.forged_authority_keys_ignored.includes('providerPosture'), 'renderer forged provider posture should be ignored');
}

function verifyCommon(preflight) {
  assert(preflight.action === 'metadata.hydration_selected_id_real_execution_preflight.preview', 'preflight action should be named');
  assert(preflight.read_only === true, 'preflight should be read-only');
  assert(preflight.mutates_state === false, 'preflight should not mutate state');
  assert(preflight.real_operator_hydration_execution === false, 'preflight should not be real execution');
  assert(preflight.provider_calls === 0, 'preflight should not call providers');
  assert(preflight.live_api_calls === 0, 'preflight should not make live/API calls');
  assert(preflight.esi_live_calls === 0, 'preflight should not make live ESI calls');
  assert(preflight.hydration_writes === 0, 'preflight should not write Hydration output');
  assert(preflight.metadata_run_writes === 0, 'preflight should not write metadata_runs');
  assert(preflight.api_request_log_writes === 0, 'preflight should not write api_request_logs');
  assert(preflight.entity_writes === 0, 'preflight should not write entities');
  assert(preflight.activity_event_label_patches === 0, 'preflight should not patch activity_events');
  assert(preflight.evidence_writes === 0, 'preflight should not write Evidence/EVEidence');
  assert(preflight.discovery_ref_mutations === 0, 'preflight should not mutate Discovery refs');
  assert(preflight.watch_mutations === 0, 'preflight should not mutate Watch');
  assert(preflight.marked_mutations === 0, 'preflight should not mutate Marked');
  assert(preflight.assessment_memory_mutations === 0, 'preflight should not mutate Assessment Memory');
  assert(preflight.bucket_persistence === false, 'preflight should not persist Bucket state');
  assert(preflight.dispatcher_created === false, 'preflight should not create Dispatcher');
  assert(preflight.schema_changes === 0, 'preflight should not change schema');
  assert(preflight.runtime_enforcement_active === false, 'preflight should not activate enforcement');
  assert(preflight.command_blocking_active === false, 'preflight should not activate command blocking');
  assert(preflight.ui_work === false, 'preflight should not do UI work');
  assert(preflight.request_posture.request_posture_is_execution_authority === false, 'request posture should not be execution authority');
  assert(preflight.pickup_contract.pickup_is_execution_authority === false, 'pickup should not be execution authority');
  assert(preflight.live_provider_gate.record_blocked_attempts === false, 'preflight should not record blocked attempts');
  assert(preflight.table_mutation_proof.unchanged === true, 'preflight should prove no table mutations');
  assert(preflight.evidence_boundary.hydration_outputs_readability_repair === true, 'Hydration should remain readability repair');
  assert(preflight.evidence_boundary.creates_evidence === false, 'Hydration should not create Evidence/EVEidence');
  assert(preflight.evidence_boundary.fourth_lane_reopened === false, 'fourth lane should stay parked');
}

function verifyCommandRegistration() {
  const commands = new Map(listServiceCommands().map((entry) => [entry.command, entry]));
  const command = commands.get('metadata.hydration_selected_id_real_execution_preflight.preview');
  assert(command, 'selected-ID real execution preflight should be listed');
  assert(command.classification === 'read-only', 'selected-ID real execution preflight should be read-only');
  assert(command.effects.includes('read-only'), 'selected-ID real execution preflight should declare read-only effect');
  assert(command.renderer_allowed === true, 'selected-ID real execution preflight should be renderer eligible');
}

function successPayload() {
  return {
    idType: 'character',
    idValue: 90000003,
    operatorAct: true,
    sourceSurface: 'selected-id-real-execution-preflight-fixture',
    basisLayer: 'activity_events',
    basisAnchor: { event_key: '9201:attacker:90000003' },
    externalIo: { state: 'on' }
  };
}

function readyContext() {
  return {
    now: '2026-06-05T12:00:00Z'
  };
}

function seedProviderNeeded(db) {
  seedCommon(db, { localLabel: null, entityRow: false });
}

function seedAlreadyLocal(db) {
  seedCommon(db, { localLabel: 'Local Pilot', entityRow: true });
}

function seedEmpty() {}

function seedCommon(db, options = {}) {
  db.prepare(`
    INSERT INTO killmails (
      killmail_id, killmail_hash, killmail_time, solar_system_id, raw_esi_payload,
      raw_payload_checksum, source, first_seen_at, last_seen_at, ingested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(9201, 'hash_9201', '2026-06-01T10:00:00Z', 30000001, '{"killmail_id":9201}', 'checksum_9201', 'fixture', '2026-06-01T10:00:00Z', '2026-06-01T10:00:00Z', '2026-06-01T10:00:00Z');
  if (options.entityRow) {
    db.prepare(`
      INSERT INTO entities (entity_type, entity_id, entity_name, first_seen_at, last_seen_at, last_enriched_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('character', 90000003, options.localLabel, '2026-06-01T09:00:00Z', '2026-06-01T09:00:00Z', '2026-06-01T09:00:00Z');
  }
  db.prepare(`
    INSERT INTO type_metadata (type_id, type_name, group_id, group_name, category_id, category_name, last_fetched)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(603, 'Merlin', 25, 'Frigate', 6, 'Ship', '2026-06-01T00:00:00Z');
  db.prepare(`
    INSERT INTO activity_events (
      event_key, killmail_id, role, entity_type, entity_id, entity_name,
      character_id, character_name, corporation_id, corporation_name, alliance_id, alliance_name,
      ship_type_id, ship_type_name, weapon_type_id, final_blow, damage_done,
      solar_system_id, solar_system_name, region_id, region_name, killmail_time, ingested_at,
      discovered_by_type, discovered_by_id, normalizer_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    '9201:attacker:90000003',
    9201,
    'attacker',
    'character',
    90000003,
    options.localLabel,
    90000003,
    options.localLabel,
    98000003,
    null,
    null,
    null,
    603,
    'Merlin',
    null,
    1,
    42,
    30000001,
    'Atlas Prime',
    10000001,
    'Test Region',
    '2026-06-01T10:00:00Z',
    '2026-06-01T10:00:00Z',
    'manual_actor',
    '90000003',
    'fixture'
  );
  db.prepare(`
    INSERT INTO discovered_killmail_refs (
      killmail_id, killmail_hash, discovered_by_type, discovered_by_id,
      discovered_at, first_seen_run_id, last_seen_run_id, last_seen_at,
      status, priority
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(9201, 'hash_9201', 'manual_actor', 'character:90000003', '2026-06-01T09:59:00Z', 'fetch_fixture', 'fetch_fixture', '2026-06-01T09:59:00Z', 'expanded', 0);
  db.prepare(`
    INSERT INTO fetch_runs (
      run_id, trigger, watch_type, watch_id, started_at, finished_at, status,
      discovered_refs, expanded_new, activity_events_written
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('fetch_fixture', 'fixture', 'manual_scan', 'fixture', '2026-06-01T09:59:00Z', '2026-06-01T10:00:00Z', 'success', 1, 1, 1);
  db.prepare(`
    INSERT INTO watchlist_entities (
      entity_type, entity_id, entity_name, lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes, next_poll_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('character', 90000001, 'Existing Watch Pilot', 30, 5, 1, 60, '2026-06-01T12:00:00Z', 'fixture watch row');
  db.prepare(`
    INSERT INTO assessment_artifacts (
      artifact_id, artifact_type, entity_type, entity_id, entity_name, status,
      assessment_reason, created_at, updated_at, assessed_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('assessment_fixture', 'entity_interest', 'character', 90000001, 'Existing Watch Pilot', 'active', 'Fixture assessment memory', '2026-06-01T00:00:00Z', '2026-06-01T00:00:00Z', 'fixture');
}

function readyStorageFixture() {
  const dbPath = path.join(projectRoot(), '.tmp', 'hydration-selected-id-real-execution-preflight', 'ready', 'atlas.sqlite');
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
  const dbPath = path.join(projectRoot(), '.tmp', 'hydration-selected-id-real-execution-preflight', 'missing', 'atlas.sqlite');
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

function fixturePreflight({ mode, source, path: dbPath, exists }) {
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
      total_bytes: 32
    },
    snapshot: { settings: { status: 'ready' } },
    byte_usage: { database_bytes: 32, known_controlled_locations_bytes: 96 }
  };
}

function snapshot(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    metadata_runs: count(db, 'metadata_runs'),
    entities: count(db, 'entities'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches'),
    assessment_artifacts: count(db, 'assessment_artifacts')
  };
}

function compact(preflight) {
  return {
    preflight_state: preflight.preflight_state,
    request_posture_state: preflight.request_posture.request_posture_state,
    provider_posture: preflight.request_posture.provider_posture,
    external_io_held: preflight.external_io.held_by_external_io,
    live_gate_allowed: preflight.live_provider_gate.allowed,
    storage_writes_blocked: preflight.storage_write_posture.future_hydration_writes_blocked,
    next_safe_action: preflight.next_safe_action,
    table_mutation_unchanged: preflight.table_mutation_proof.unchanged
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
