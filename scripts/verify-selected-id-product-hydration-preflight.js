const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');

async function main() {
  const previousLive = process.env.AURA_ATLAS_LIVE_API;
  try {
    process.env.AURA_ATLAS_LIVE_API = '1';
    const ready = await runCase('character_activity_basis', seedCharacterActivityBasis, payload('character', 90000011), readyContext());
    const corporation = await runCase('corporation_activity_basis', seedCorporationActivityBasis, payload('corporation', 98000011), readyContext());
    const alliance = await runCase('alliance_activity_basis', seedAllianceActivityBasis, payload('alliance', 99000011), readyContext());
    const hs276 = await runCase('hs276_not_special', seedHs276ActivityBasis, payload('character', 92418041), readyContext());
    const proofFlags = await runCase('proof_flags_non_authority', seedCharacterActivityBasis, {
      ...payload('character', 90000011),
      allowHydrationSelectedIdRealExecutionProof: true,
      controlledTempAtlasStore: true
    }, {
      ...readyContext(),
      allowHydrationSelectedIdRealExecutionProof: true,
      controlledTempAtlasStore: true
    });
    const renderer = await runCase('renderer_forgery_ignored', seedCharacterActivityBasis, {
      ...payload('character', 90000011),
      localLabel: 'Renderer Forged Label',
      localBasis: ['renderer_forged_basis'],
      storageAuthority: forgedStorageAuthority(),
      externalIo: { state: 'on' },
      liveGate: { allowed: true },
      confirmationToken: 'confirm:metadata.hydration'
    }, {
      ...readyContext(),
      source: 'renderer'
    });
    const missingBasis = await runCase('missing_basis', seedEmpty, payload('character', 90000012), readyContext());
    const discoveryOnly = await runCase('discovery_only', seedDiscoveryOnly, payload('character', 90000013), readyContext());
    const watchOnly = await runCase('watch_only', seedWatchOnly, payload('character', 90000014), readyContext());
    const assessmentOnly = await runCase('assessment_only', seedAssessmentOnly, payload('character', 90000015), readyContext());
    const localLabel = await runCase('local_label_short_circuit', seedLocalLabel, payload('character', 90000016), readyContext());
    const localLookup = await runCase('local_sde_static_lookup', seedLocalLookup, payload('inventory_type', 603), readyContext());
    const held = await runCase('external_io_held', seedCharacterActivityBasis, payload('character', 90000011), {
      ...readyContext(),
      externalIoState: 'off'
    });
    delete process.env.AURA_ATLAS_LIVE_API;
    const liveBlocked = await runCase('live_gate_blocked', seedCharacterActivityBasis, payload('character', 90000011), readyContext());
    process.env.AURA_ATLAS_LIVE_API = '1';
    const storageBlocked = await runCase('storage_blocked', seedCharacterActivityBasis, payload('character', 90000011), {
      ...readyContext(),
      storageAuthority: {
        mode: 'selected_storage_missing_unavailable',
        selected: true,
        validation_status: 'missing_unavailable',
        write_allowed_if_enforced_later: false,
        budget_bytes: 4096,
        budget_source: 'fixture_configured'
      }
    });
    const malformed = await runCase('malformed_id', seedEmpty, payload('character', -1), readyContext());

    verifyReady(ready.preflight, 'character');
    verifyReady(corporation.preflight, 'corporation');
    verifyReady(alliance.preflight, 'alliance');
    verifyHs276(hs276.preflight);
    verifyProofFlags(proofFlags.preflight);
    verifyRenderer(renderer.preflight);
    verifyState(missingBasis.preflight, 'missing_local_basis');
    verifyState(discoveryOnly.preflight, 'conditional_basis_only');
    verifyParked(discoveryOnly.preflight, 'discovered_killmail_refs');
    verifyState(watchOnly.preflight, 'conditional_basis_only');
    verifyParked(watchOnly.preflight, 'watchlist_entities');
    verifyState(assessmentOnly.preflight, 'conditional_basis_only');
    verifyParked(assessmentOnly.preflight, 'assessment_artifacts');
    verifyState(localLabel.preflight, 'local_label_short_circuit');
    assert(localLabel.preflight.local_first.local_label_short_circuit === true, 'local label should short-circuit');
    verifyState(localLookup.preflight, 'invalid_selected_id');
    assert(localLookup.preflight.local_lookup_posture.provider_names_endpoint_should_be_used === false, 'local lookup should not use ESI names');
    verifyState(held.preflight, 'held_by_external_io');
    assert(held.preflight.external_io.held_by_external_io === true, 'External I/O held should be visible');
    verifyState(liveBlocked.preflight, 'blocked_by_live_provider_gate');
    assert(liveBlocked.preflight.live_provider_gate.accepted_attempt_recorded === false, 'live blocked preflight should not record provider attempts');
    verifyState(storageBlocked.preflight, 'blocked_by_storage_write_posture');
    assert(storageBlocked.preflight.storage_write_posture.future_hydration_writes_blocked === true, 'storage block should stop future provider contact');
    verifyState(malformed.preflight, 'invalid_selected_id');
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'selected-ID product Hydration preflight verified',
      ready: compact(ready.preflight),
      corporation: compact(corporation.preflight),
      alliance: compact(alliance.preflight),
      hs276_not_special: compact(hs276.preflight),
      proof_flags: proofFlags.preflight.proof_scaffolding,
      renderer_authority: renderer.preflight.renderer_payload_authority,
      parked_basis: {
        discovery_only: compact(discoveryOnly.preflight),
        watch_only: compact(watchOnly.preflight),
        assessment_only: compact(assessmentOnly.preflight)
      },
      held: compact(held.preflight),
      live_blocked: compact(liveBlocked.preflight),
      storage_blocked: compact(storageBlocked.preflight),
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

async function runCase(name, seedFn, casePayload, context) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedFn(db);
    const before = snapshot(db);
    const preflight = await invokeServiceCommand('metadata.selected_id_readability_repair.product_preflight', {
      ...casePayload,
      storageAuthority: forgedStorageAuthority(),
      localLabel: 'forged payload label',
      commandAuthority: { forged: true }
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

function payload(idType, idValue) {
  return {
    idType,
    idValue,
    operatorAct: true,
    sourceSurface: 'selected-id-product-preflight-verifier',
    basisLayer: 'activity_events'
  };
}

function readyContext() {
  return {
    now: '2026-06-05T12:00:00Z',
    externalIoState: 'on',
    storageBudgetBytes: 5 * 1024 * 1024 * 1024,
    storageAuthority: {
      mode: 'selected_storage',
      selected: true,
      validation_status: 'valid',
      write_allowed_if_enforced_later: true,
      provider_movement_allowed_if_enforced_later: true,
      budget_bytes: 5 * 1024 * 1024 * 1024,
      budget_source: 'fixture_configured',
      config_source: 'trusted_fixture_runtime'
    }
  };
}

function seedCharacterActivityBasis(db) {
  seedEvidenceActivity(db, { eventKey: '9201:attacker:90000011', idType: 'character', idValue: 90000011 });
}

function seedCorporationActivityBasis(db) {
  seedEvidenceActivity(db, { eventKey: '9202:corp:98000011', idType: 'corporation', idValue: 98000011 });
}

function seedAllianceActivityBasis(db) {
  seedEvidenceActivity(db, { eventKey: '9203:alliance:99000011', idType: 'alliance', idValue: 99000011 });
}

function seedHs276ActivityBasis(db) {
  seedEvidenceActivity(db, { eventKey: '9276:attacker:92418041', idType: 'character', idValue: 92418041 });
}

function seedLocalLabel(db) {
  seedEvidenceActivity(db, { eventKey: '9204:attacker:90000016', idType: 'character', idValue: 90000016, label: 'Local Pilot' });
  db.prepare(`
    INSERT INTO entities (entity_type, entity_id, entity_name, first_seen_at, last_seen_at, last_enriched_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('character', 90000016, 'Local Pilot', '2026-06-01T09:00:00Z', '2026-06-01T09:00:00Z', '2026-06-01T09:00:00Z');
}

function seedDiscoveryOnly(db) {
  db.prepare(`
    INSERT INTO discovered_killmail_refs (
      killmail_id, killmail_hash, discovered_by_type, discovered_by_id, source_scope,
      discovered_at, last_seen_at, status, priority
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(9301, 'hash_9301', 'manual_character', 'character:90000013', 'manual', '2026-06-01T00:00:00Z', '2026-06-01T00:00:00Z', 'pending', 1);
}

function seedWatchOnly(db) {
  db.prepare(`
    INSERT INTO watchlist_entities (entity_type, entity_id, entity_name, is_active)
    VALUES (?, ?, ?, ?)
  `).run('character', 90000014, 'Watch Interest', 1);
}

function seedAssessmentOnly(db) {
  db.prepare(`
    INSERT INTO assessment_artifacts (
      artifact_id, artifact_type, entity_type, entity_id, entity_name, status,
      assessment_reason, assessment_summary, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('assessment-90000015', 'entity_interest', 'character', 90000015, null, 'active', 'fixture', 'fixture assessment', '2026-06-01T00:00:00Z', '2026-06-01T00:00:00Z');
}

function seedLocalLookup(db) {
  db.prepare(`
    INSERT INTO type_metadata (type_id, type_name, group_id, group_name, category_id, category_name, last_fetched)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(603, 'Merlin', 25, 'Frigate', 6, 'Ship', '2026-06-01T00:00:00Z');
}

function seedEmpty() {}

function seedEvidenceActivity(db, options) {
  const killmailId = Number(options.eventKey.split(':')[0]);
  db.prepare(`
    INSERT INTO killmails (
      killmail_id, killmail_hash, killmail_time, solar_system_id, raw_esi_payload,
      raw_payload_checksum, source, first_seen_at, last_seen_at, ingested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(killmailId, `hash_${killmailId}`, '2026-06-01T10:00:00Z', 30000001, `{"killmail_id":${killmailId}}`, `checksum_${killmailId}`, 'fixture', '2026-06-01T10:00:00Z', '2026-06-01T10:00:00Z', '2026-06-01T10:00:00Z');
  const characterId = options.idType === 'character' ? options.idValue : 90000099;
  const corporationId = options.idType === 'corporation' ? options.idValue : 98000099;
  const allianceId = options.idType === 'alliance' ? options.idValue : 99000099;
  const entityName = options.label || null;
  const characterName = options.idType === 'character' ? entityName : null;
  const corporationName = options.idType === 'corporation' ? entityName : null;
  const allianceName = options.idType === 'alliance' ? entityName : null;
  db.prepare(`
    INSERT INTO activity_events (
      event_key, killmail_id, role, entity_type, entity_id, entity_name,
      character_id, character_name, corporation_id, corporation_name, alliance_id, alliance_name,
      ship_type_id, ship_type_name, weapon_type_id, final_blow, damage_done,
      solar_system_id, solar_system_name, region_id, region_name, killmail_time, ingested_at,
      discovered_by_type, discovered_by_id, normalizer_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    options.eventKey,
    killmailId,
    'attacker',
    options.idType,
    options.idValue,
    entityName,
    characterId,
    characterName,
    corporationId,
    corporationName,
    allianceId,
    allianceName,
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
    90000001,
    'fixture'
  );
}

function forgedStorageAuthority() {
  return {
    mode: 'selected_storage',
    selected: true,
    validation_status: 'valid',
    write_allowed_if_enforced_later: true,
    budget_bytes: 999999999,
    config_source: 'renderer_forged_payload'
  };
}

function verifyReady(preflight, idType) {
  verifyState(preflight, 'provider_needed_product_preflight_ready');
  assert(preflight.selected_id.id_type === idType, `${idType} should normalize selected ID type`);
  assert(preflight.local_authority.strong_basis_exists === true, `${idType} should expose strong basis`);
  assert(preflight.future_execution_contract.provider_call_authorized_now === false, `${idType} preflight should not authorize provider call`);
  assert(preflight.command_authority.future_execution_command === 'metadata.selected_id_readability_repair.execute', 'future product command should be disclosed');
  assert(preflight.command_authority.future_run_type === 'selected_id_readability_repair', 'future product run type should be disclosed');
}

function verifyHs276(preflight) {
  verifyReady(preflight, 'character');
  assert(preflight.hs276_target_match === true, 'HS276 ID should be recognized as matching only for disclosure');
  assert(preflight.fixed_hs276_id_special === false, 'HS276 fixed ID should not be special product authority');
}

function verifyProofFlags(preflight) {
  verifyReady(preflight, 'character');
  assert(preflight.proof_scaffolding.proof_flags_authoritative === false, 'proof flags should not authorize product preflight');
  assert(preflight.proof_scaffolding.supplied_proof_flags.includes('allowHydrationSelectedIdRealExecutionProof'), 'proof flag should be disclosed');
  assert(preflight.proof_scaffolding.supplied_proof_flags.includes('controlledTempAtlasStore'), 'controlled temp flag should be disclosed');
}

function verifyRenderer(preflight) {
  verifyReady(preflight, 'character');
  assert(preflight.renderer_eligible === true, 'product preflight should be renderer eligible as explanation');
  assert(preflight.renderer_payload_authority.source === 'renderer', 'renderer source should be disclosed');
  assert(preflight.renderer_payload_authority.renderer_payload_authoritative === false, 'renderer payload should not be authoritative');
  assert(preflight.renderer_payload_authority.forged_authority_keys_ignored.includes('localLabel'), 'renderer local label should be ignored');
  assert(preflight.renderer_payload_authority.forged_authority_keys_ignored.includes('storageAuthority'), 'renderer storage authority should be ignored');
  assert(preflight.renderer_payload_authority.forged_authority_keys_ignored.includes('externalIo'), 'renderer External I/O should be ignored');
  assert(preflight.renderer_payload_authority.forged_authority_keys_ignored.includes('liveGate'), 'renderer live gate should be ignored');
}

function verifyParked(preflight, kind) {
  assert(preflight.local_authority.strong_basis_exists === false, `${kind} should not be strong basis`);
  assert(preflight.local_authority.parked_basis.some((entry) => entry.kind === kind), `${kind} should be disclosed as parked`);
  assert(preflight.local_first.parked_basis_authorizes_first_product_preflight === false, `${kind} should not authorize first product preflight`);
}

function verifyState(preflight, state) {
  assert(preflight.product_preflight_state === state, `expected ${state}, got ${preflight.product_preflight_state}`);
}

function verifyCommon(preflight) {
  assert(preflight.action === 'metadata.selected_id_readability_repair.product_preflight', 'preflight action should be named');
  assert(preflight.read_only === true, 'preflight should be read-only');
  assert(preflight.mutates_state === false, 'preflight should not mutate state');
  assert(preflight.renderer_eligible === true, 'preflight should be renderer eligible as explanation');
  assert(preflight.product_execution_started === false, 'preflight should not execute');
  assert(preflight.provider_calls === 0, 'preflight should not call providers');
  assert(preflight.live_api_calls === 0, 'preflight should not make live/API calls');
  assert(preflight.esi_live_calls === 0, 'preflight should not make ESI calls');
  assert(preflight.zkill_calls === 0, 'preflight should not call zKill');
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
  assert(preflight.live_provider_gate.record_blocked_attempts === false, 'preflight should not record blocked attempts');
  assert(preflight.table_mutation_proof.unchanged === true, 'preflight should prove no table mutations');
  assert(preflight.evidence_boundary.hydration_outputs_readability_repair === true, 'Hydration should remain readability repair');
  assert(preflight.evidence_boundary.creates_evidence === false, 'Hydration should not create Evidence/EVEidence');
  assert(preflight.evidence_boundary.fourth_lane_reopened === false, 'fourth lane should stay parked');
}

function verifyCommandRegistration() {
  const commands = new Map(listServiceCommands().map((entry) => [entry.command, entry]));
  const command = commands.get('metadata.selected_id_readability_repair.product_preflight');
  assert(command, 'selected-ID product preflight should be listed');
  assert(command.classification === 'read-only', 'selected-ID product preflight should be read-only');
  assert(command.effects.includes('read-only'), 'selected-ID product preflight should declare read-only effect');
  assert(command.renderer_allowed === true, 'selected-ID product preflight should be renderer eligible');
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
    state: preflight.product_preflight_state,
    reason_codes: preflight.reason_codes,
    selected_id: preflight.selected_id,
    local_authority_state: preflight.local_authority.state,
    strong_basis: preflight.local_authority.strong_basis.map((entry) => entry.kind),
    parked_basis: preflight.local_authority.parked_basis.map((entry) => entry.kind),
    provider_calls: preflight.provider_calls,
    writes_authorized_now: preflight.future_execution_contract.writes_authorized_now,
    next_safe_action: preflight.next_safe_action
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assertSame(actual, expected, message) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}\nactual=${JSON.stringify(actual)}\nexpected=${JSON.stringify(expected)}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
