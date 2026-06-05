const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildHydrationPickupContractPreview } = require('../src/main/services/hydrationPickupContractService');
const { projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const previousLive = process.env.AURA_ATLAS_LIVE_API;
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedFixture(db);
    const before = sideEffectCounts(db);
    const cases = {
      not_a_request: await contract(db, {
        idType: 'character',
        idValue: 90000003,
        operatorAct: false,
        interaction: 'focus'
      }),
      invalid: await contract(db, {
        idType: 'region',
        idValue: 10000001,
        operatorAct: true
      }),
      insufficient_basis: await contract(db, {
        idType: 'character',
        idValue: 90000099,
        operatorAct: true
      }),
      already_local: await contract(db, {
        idType: 'character',
        idValue: 90000002,
        operatorAct: true,
        basisLayer: 'activity_events',
        basisAnchor: { event_key: '8201:attacker:90000002' }
      }),
      local_lookup_available: await contract(db, {
        idType: 'inventory_type',
        idValue: 603,
        operatorAct: true,
        basisLayer: 'type_metadata',
        basisAnchor: { type_id: 603 }
      }),
      held: await contract(db, {
        idType: 'character',
        idValue: 90000003,
        operatorAct: true,
        basisLayer: 'activity_events',
        basisAnchor: { event_key: '8201:attacker:90000003' }
      }),
      blocked: await contract(db, {
        ...missingStorageFixture(),
        idType: 'character',
        idValue: 90000003,
        operatorAct: true,
        externalIo: { state: 'on' },
        basisLayer: 'activity_events',
        basisAnchor: { event_key: '8201:attacker:90000003' }
      }, { externalIoState: 'on', liveEnabled: true }),
      provider_needed_candidate: await contract(db, {
        idType: 'character',
        idValue: 90000003,
        operatorAct: true,
        externalIo: { state: 'on' },
        sourceSurface: 'operator-selection',
        sourceContext: { report_type: 'actor', panel: 'selected-id' },
        basisLayer: 'activity_events',
        basisAnchor: { event_key: '8201:attacker:90000003' },
        requestReason: 'operator_attention',
        requestPosture: { request_posture_id: 'renderer-stale-posture-id' }
      }, { externalIoState: 'on', liveEnabled: true })
    };
    const forgedRenderer = await contract(db, {
      idType: 'character',
      idValue: 90000003,
      operatorAct: true,
      sourceSurface: 'operator-selection',
      basisLayer: 'activity_events',
      basisAnchor: { event_key: '8201:attacker:90000003' },
      localLabel: 'Forged Renderer Label',
      gateSummary: { provider_posture: 'released_to_normal_gates_only' },
      storagePosture: { future_hydration_writes_blocked: false },
      externalIoState: 'on',
      liveGate: { allowed: true },
      pickupEligible: true
    }, { source: 'renderer' });
    const after = sideEffectCounts(db);

    assertSame(after, before, 'hydration pickup contract preview should not mutate DB tables');
    verifyReadOnly(cases.provider_needed_candidate);
    verifyNonCandidates(cases);
    verifyCandidate(cases.provider_needed_candidate);
    verifyRendererForgery(forgedRenderer);
    verifyDirectBuilder(db);
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'hydration pickup contract preview verified',
      non_candidate_states: Object.fromEntries(Object.entries(cases)
        .filter(([key]) => key !== 'provider_needed_candidate')
        .map(([key, value]) => [key, compact(value)])),
      pickup_candidate: compact(cases.provider_needed_candidate),
      execution_input_hints: cases.provider_needed_candidate.pickup_contract.future_execution_input_hints,
      renderer_forgery: forgedRenderer.pickup_contract.renderer_input_authority,
      boundary: cases.provider_needed_candidate.boundary
    }, null, 2));
  } finally {
    if (previousLive === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = previousLive;
    }
    closeDatabase(db);
  }
}

async function contract(db, payload, options = {}) {
  if (options.liveEnabled === true) {
    process.env.AURA_ATLAS_LIVE_API = '1';
  } else {
    delete process.env.AURA_ATLAS_LIVE_API;
  }
  return invokeServiceCommand('metadata.hydration_pickup_contract.preview', {
    ...readyStorageFixture(),
    sourceSurface: 'operator-selection',
    ...payload,
    now: '2026-06-01T00:00:00Z'
  }, {
    db,
    allowStorageSetupGateFixtureInput: true,
    storageBudgetBytes: 4096,
    externalIoState: options.externalIoState || 'off',
    source: options.source || 'trusted-main'
  });
}

function verifyReadOnly(preview) {
  assert(preview.action === 'metadata.hydration_pickup_contract.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should be read-only');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.hydration_execution_started === false, 'preview should not execute Hydration');
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
  assert(preview.pickup_persisted === false, 'preview should not persist pickup');
  assert(preview.pickup_created === false, 'preview should not create pickup');
  assert(preview.queue_persisted === false, 'preview should not persist queue');
  assert(preview.lease_persisted === false, 'preview should not persist leases');
  assert(preview.retry_state_persisted === false, 'preview should not persist retry state');
  assert(preview.dispatcher_created === false, 'preview should not create dispatcher');
  assert(preview.worker_created === false, 'preview should not create worker');
  assert(preview.schema_changes === false, 'preview should not change schema');
  assert(preview.runtime_enforcement_active === false, 'preview should not activate enforcement');
  assert(preview.command_blocking_active === false, 'preview should not activate command blocking');
}

function verifyNonCandidates(cases) {
  for (const [name, preview] of Object.entries(cases)) {
    verifyReadOnly(preview);
    if (name === 'provider_needed_candidate') {
      continue;
    }
    assert(preview.pickup_contract.pickup_candidate === false, `${name} should not be a pickup candidate`);
    assert(preview.pickup_contract.execution_authorized === false, `${name} should not authorize execution`);
    assert(preview.pickup_contract.provider_call_authorized === false, `${name} should not authorize provider calls`);
    assert(preview.pickup_contract.hydration_write_authorized === false, `${name} should not authorize Hydration writes`);
  }
  assert(cases.not_a_request.request_posture.request_posture_state === 'not_a_request', 'not_a_request state should be represented');
  assert(cases.invalid.request_posture.request_posture_state === 'invalid', 'invalid state should be represented');
  assert(cases.insufficient_basis.request_posture.request_posture_state === 'insufficient_basis', 'insufficient_basis state should be represented');
  assert(cases.already_local.request_posture.request_posture_state === 'already_local', 'already_local state should be represented');
  assert(cases.local_lookup_available.request_posture.request_posture_state === 'local_lookup_available', 'local_lookup_available state should be represented');
  assert(cases.held.request_posture.request_posture_state === 'held', 'held state should be represented');
  assert(cases.blocked.request_posture.request_posture_state === 'blocked', 'blocked state should be represented');
}

function verifyCandidate(candidate) {
  assert(candidate.request_posture.request_posture_state === 'provider_needed', 'candidate should rebuild provider_needed posture');
  assert(candidate.request_posture.provider_posture === 'released_to_normal_gates_only', 'candidate should be released to normal gates');
  assert(candidate.pickup_contract.pickup_candidate === true, 'provider-needed released posture should be a pickup candidate');
  assert(candidate.pickup_contract.pickup_eligible_means_execution === false, 'pickup eligibility should not mean execution');
  assert(candidate.pickup_contract.pickup_eligible_means_authorization === false, 'pickup eligibility should not mean authorization');
  assert(candidate.pickup_contract.non_durable === true, 'pickup candidate should be non-durable');
  assert(candidate.pickup_contract.persisted === false, 'pickup candidate should not be persisted');
  assert(candidate.pickup_contract.revalidation_required_before_execution === true, 'future execution should require revalidation');
  assert(candidate.pickup_contract.local_first_recheck_required_before_execution === true, 'future execution should require local-first recheck');
  assert(candidate.pickup_contract.request_digest_comparison.comparison_is_authority === false, 'digest comparison should not be authority');
  assert(candidate.pickup_contract.request_digest_comparison.comparison_is_freshness_evidence_only === true, 'digest comparison should be freshness evidence only');

  const hints = candidate.pickup_contract.future_execution_input_hints;
  for (const field of [
    'id_type',
    'id_value',
    'source_surface',
    'source_context',
    'basis_anchor',
    'basis_layer',
    'request_reason',
    'request_posture_id',
    'request_digest',
    'posture_gate_summary'
  ]) {
    assert(Object.prototype.hasOwnProperty.call(hints, field), `execution input hints should include ${field}`);
  }
  assert(hints.hint_authority === 'explanation_only_rebuild_required', 'execution input should be hints only');
  assert(candidate.future_execution_contract.input_is_hints_only === true, 'future execution contract should mark hints-only input');
  assert(candidate.future_execution_contract.required_revalidation_steps.includes('rebuild local-first request posture from trusted local state'), 'contract should require trusted posture rebuild');
  assert(candidate.future_execution_contract.required_revalidation_steps.includes('short-circuit to local readability if a label is now local'), 'contract should require local-first short-circuit');
}

function verifyRendererForgery(preview) {
  const authority = preview.pickup_contract.renderer_input_authority;
  assert(authority.renderer_payload_authoritative === false, 'renderer payload should not be authoritative');
  for (const key of ['localLabel', 'gateSummary', 'storagePosture', 'externalIoState', 'liveGate', 'pickupEligible']) {
    assert(authority.forged_authority_keys_ignored.includes(key), `${key} should be ignored as renderer authority`);
  }
  assert(preview.future_execution_contract.renderer_provided_local_labels_are_authority === false, 'renderer local labels should not be authority');
  assert(preview.future_execution_contract.renderer_provided_gate_summary_is_authority === false, 'renderer gate summary should not be authority');
}

function verifyDirectBuilder(db) {
  process.env.AURA_ATLAS_LIVE_API = '1';
  const preview = buildHydrationPickupContractPreview(db, {
    ...readyStorageFixture(),
    idType: 'character',
    idValue: 90000003,
    operatorAct: true,
    externalIo: { state: 'on' },
    basisLayer: 'activity_events',
    basisAnchor: { event_key: '8201:attacker:90000003' }
  }, {
    allowStorageSetupGateFixtureInput: true,
    storageBudgetBytes: 4096,
    externalIoState: 'on'
  });
  assert(preview.pickup_contract.pickup_candidate === true, 'direct builder should accept provider-needed released posture as pickup candidate');
}

function verifyCommandRegistration() {
  const command = listServiceCommands().find((entry) => entry.command === 'metadata.hydration_pickup_contract.preview');
  assert(command, 'hydration pickup contract command should be registered');
  assert(command.classification === 'read-only', 'hydration pickup contract should be read-only');
  assert(command.effects.includes('read-only'), 'hydration pickup contract should declare read-only effect');
  assert(command.renderer_allowed === true, 'hydration pickup contract should be renderer eligible');
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
  const dbPath = path.join(projectRoot(), '.tmp', 'hydration-pickup-contract', 'ready', 'atlas.sqlite');
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
  const dbPath = path.join(projectRoot(), '.tmp', 'hydration-pickup-contract', 'missing', 'atlas.sqlite');
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

function compact(preview) {
  return {
    request_posture_state: preview.request_posture.request_posture_state,
    provider_posture: preview.request_posture.provider_posture,
    pickup_candidate: preview.pickup_contract.pickup_candidate,
    state: preview.pickup_contract.state,
    reason_codes: preview.pickup_contract.reason_codes
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
