const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { resetLiveGateState } = require('../src/main/services/liveApiGateService');
const { projectRoot } = require('../src/main/util/tempPaths');

const TARGET_ID = 92418041;
const TARGET_NAME = 'Reuben Orlenard';

async function main() {
  const previousLive = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  try {
    const success = await runCase('success', seedProviderNeeded, successPayload(), readyContext({
      fetchImpl: fakeNamesFetch([{ category: 'character', id: TARGET_ID, name: TARGET_NAME }])
    }));
    const localShortCircuit = await runCase('local_short_circuit', seedAlreadyLocal, successPayload(), readyContext({
      fetchImpl: failIfFetched()
    }));
    const held = await runCase('held_external_io', seedProviderNeeded, { ...successPayload(), externalIo: { state: 'off' } }, readyContext({
      fetchImpl: failIfFetched()
    }));
    const storageBlocked = await runCase('storage_blocked', seedProviderNeeded, { ...successPayload(), ...missingStorageFixture() }, readyContext({
      fetchImpl: failIfFetched()
    }));
    delete process.env.AURA_ATLAS_LIVE_API;
    const liveBlocked = await runCase('live_gate_blocked', seedProviderNeeded, successPayload(), readyContext({
      fetchImpl: failIfFetched()
    }));
    process.env.AURA_ATLAS_LIVE_API = '1';
    const idMissing = await runCase('provider_id_missing', seedProviderNeeded, successPayload(), readyContext({
      fetchImpl: fakeNamesFetch([])
    }));
    const categoryMismatch = await runCase('provider_category_mismatch', seedProviderNeeded, successPayload(), readyContext({
      fetchImpl: fakeNamesFetch([{ category: 'corporation', id: TARGET_ID, name: TARGET_NAME }])
    }));
    const unsafeLabel = await runCase('provider_unsafe_label', seedProviderNeeded, successPayload(), readyContext({
      fetchImpl: fakeNamesFetch([{ category: 'character', id: TARGET_ID, name: '' }])
    }));
    const providerError = await runCase('provider_error', seedProviderNeeded, successPayload(), readyContext({
      fetchImpl: fakeErrorFetch()
    }));
    const untrusted = await runCase('untrusted_context', seedProviderNeeded, successPayload(), {
      fetchImpl: failIfFetched()
    });
    const liveProof = process.env.AURA_ATLAS_HS276_LIVE === '1'
      ? await runCase('live_success', seedProviderNeeded, successPayload(), readyContext({ maxAttempts: 1 }))
      : null;
    await verifyRendererRejected();
    verifyCommandRegistration();

    verifySuccess(success);
    if (liveProof) {
      verifySuccess(liveProof);
    }
    verifyNoProviderNoWrite(localShortCircuit, 'local_label_short_circuit');
    verifyNoProviderNoWrite(held, 'external_io_held');
    verifyNoProviderNoWrite(storageBlocked, 'storage_write_blocked');
    verifyNoProviderNoWrite(liveBlocked, 'live_provider_gate_blocked');
    verifyRejectedProvider(idMissing, 'provider_response_selected_id_missing');
    verifyRejectedProvider(categoryMismatch, 'provider_response_category_mismatch');
    verifyRejectedProvider(unsafeLabel, 'provider_response_label_missing_or_unsafe');
    verifyProviderError(providerError);
    verifyNoProviderNoWrite(untrusted, 'blocked_trusted_context');

    console.log(JSON.stringify({
      status: 'hydration selected-ID real execution proof verified',
      success: compact(success.proof),
      local_short_circuit: compact(localShortCircuit.proof),
      held_external_io: compact(held.proof),
      storage_blocked: compact(storageBlocked.proof),
      live_gate_blocked: compact(liveBlocked.proof),
      provider_rejections: {
        id_missing: compact(idMissing.proof),
        category_mismatch: compact(categoryMismatch.proof),
        unsafe_label: compact(unsafeLabel.proof),
        provider_error: compact(providerError.proof)
      },
      live_success: liveProof ? compact(liveProof.proof) : 'not_run_set_AURA_ATLAS_HS276_LIVE_1',
      success_invariants: success.proof.invariants,
      provider_call: success.proof.provider_call_log[0],
      live_provider_call: liveProof ? liveProof.proof.provider_call_log[0] : null,
      boundary: success.proof.boundary
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
  resetLiveGateState();
  const root = path.join(projectRoot(), '.tmp', 'hydration-selected-id-real-execution', name);
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(root, { recursive: true });
  const dbPath = path.join(root, 'atlas.sqlite');
  const db = openDatabase(dbPath);
  migrate(db);
  try {
    seedFn(db);
    const before = snapshot(db);
    const proof = await invokeServiceCommand('metadata.hydration_selected_id_real_execution_proof', {
      ...readyStorageFixture(root),
      ...payload
    }, {
      db,
      databasePath: dbPath,
      allowStorageSetupGateFixtureInput: true,
      storageBudgetBytes: 4096,
      ...context
    });
    const after = snapshot(db);
    assertSame(proof.before.counts, before, `${name} proof before counts should match verifier before`);
    assertSame(proof.after.counts, after, `${name} proof after counts should match verifier after`);
    return { proof, before, after, dbPath };
  } finally {
    closeDatabase(db);
  }
}

function verifySuccess(result) {
  const { proof, before, after } = result;
  verifyCommon(proof);
  assert(proof.outcome === 'success', 'success should complete');
  assert(proof.provider_calls === 1, 'success should call provider exactly once');
  assert(proof.provider_call_log[0].endpoint.includes('/latest/universe/names/'), 'success should call ESI names endpoint');
  assert(proof.provider_call_log[0].body === `[${TARGET_ID}]`, 'success should request exactly one selected ID');
  assert(proof.provider_validation.status === 'provider_response_valid', 'success should validate provider response');
  assert(proof.provider_validation.normalized.name === TARGET_NAME, 'success should preserve provider label');
  assert(proof.metadata_run.run_type === 'selected_id_real_hydration_execution_proof', 'metadata run should identify real proof');
  assert(proof.metadata_run.status === 'success', 'metadata run should finalize success');
  assert(proof.write_summary.metadata_run_writes === 1, 'success should write one metadata run');
  assert(proof.write_summary.api_request_log_writes === 1, 'success should write one API log');
  assert(proof.write_summary.entities_upserted === 1, 'success should upsert one entity');
  assert(proof.write_summary.activity_event_label_patches === 2, 'success should patch matching readability labels');
  assert(after.metadata_runs === before.metadata_runs + 1, 'metadata_runs count should increase by one');
  assert(after.api_request_logs === before.api_request_logs + 1, 'api_request_logs count should increase by one');
  assert(after.entities === before.entities + 1, 'entities count should increase by one');
  assert(proof.after.activity_event_labels[0].entity_name === TARGET_NAME, 'entity_name readability label should be patched');
  assert(proof.after.activity_event_labels[0].character_name === TARGET_NAME, 'character_name readability label should be patched');
  assert(proof.invariants.raw_killmail_payloads_unchanged === true, 'raw payloads should stay unchanged');
  assert(proof.invariants.numeric_activity_event_ids_unchanged === true, 'numeric activity facts should stay unchanged');
  assert(proof.invariants.discovered_refs_unchanged === true, 'Discovery refs should stay unchanged');
  assert(proof.invariants.fetch_runs_unchanged === true, 'fetch runs should stay unchanged');
  assert(proof.invariants.watch_rows_unchanged === true, 'Watch rows should stay unchanged');
  assert(proof.invariants.assessment_rows_unchanged === true, 'Assessment Memory rows should stay unchanged');
}

function verifyNoProviderNoWrite(result, expectedOutcome) {
  const { proof, before, after } = result;
  verifyCommon(proof);
  assert(proof.outcome === expectedOutcome, `expected ${expectedOutcome}, got ${proof.outcome}`);
  assert(proof.provider_calls === 0, `${expectedOutcome} should not call provider`);
  assertSame(after, before, `${expectedOutcome} should not mutate tables`);
  assert(proof.write_summary.metadata_run_writes === 0, `${expectedOutcome} should not write metadata run`);
  assert(proof.write_summary.api_request_log_writes === 0, `${expectedOutcome} should not write API log`);
  assert(proof.write_summary.entities_upserted === 0, `${expectedOutcome} should not upsert entity`);
  assert(proof.write_summary.activity_event_label_patches === 0, `${expectedOutcome} should not patch activity events`);
}

function verifyRejectedProvider(result, expectedIssue) {
  const { proof, before, after } = result;
  verifyCommon(proof);
  assert(proof.outcome === 'provider_response_rejected', 'provider rejection should be classified');
  assert(proof.provider_calls === 1, 'provider rejection should have one provider call');
  assert(proof.provider_validation.issues.includes(expectedIssue), `provider rejection should include ${expectedIssue}`);
  assert(proof.metadata_run.status === 'failed', 'provider rejection should finalize failed metadata run');
  assert(after.metadata_runs === before.metadata_runs + 1, 'provider rejection should write one metadata run');
  assert(after.api_request_logs === before.api_request_logs + 1, 'provider rejection should write one API log');
  assert(after.entities === before.entities, 'provider rejection should not upsert entity');
  assertSame(proof.before.activity_event_labels, proof.after.activity_event_labels, 'provider rejection should not patch labels');
}

function verifyProviderError(result) {
  const { proof, before, after } = result;
  verifyCommon(proof);
  assert(proof.outcome === 'provider_error', 'provider error should be classified');
  assert(proof.provider_calls === 1, 'provider error should make one provider attempt');
  assert(proof.metadata_run.status === 'failed', 'provider error should finalize failed metadata run');
  assert(after.metadata_runs === before.metadata_runs + 1, 'provider error should write one metadata run');
  assert(after.api_request_logs === before.api_request_logs + 1, 'provider error should write one API log');
  assert(after.entities === before.entities, 'provider error should not upsert entity');
  assertSame(proof.before.activity_event_labels, proof.after.activity_event_labels, 'provider error should not patch labels');
}

function verifyCommon(proof) {
  assert(proof.action === 'metadata.hydration_selected_id_real_execution_proof', 'proof action should be named');
  assert(proof.renderer_eligible === false, 'proof should not be renderer eligible');
  assert(proof.trusted_context_only === true, 'proof should be trusted-context only');
  assert(proof.controlled_temp_store_only === true, 'proof should be controlled temp store only');
  assert(proof.real_operator_corpus_mutated === false, 'proof should not mutate operator corpus');
  assert(proof.selected_id.id_type === 'character', 'proof selected type should be character');
  assert(proof.selected_id.id_value === TARGET_ID, 'proof selected ID should be target');
  assert(proof.zkill_calls === 0, 'proof should not call zKill');
  assert(proof.evidence_boundary.hydration_outputs_readability_repair === true, 'Hydration should remain readability repair');
  assert(proof.evidence_boundary.creates_evidence === false, 'proof should not create Evidence/EVEidence');
  assert(proof.forbidden_mutations.discovery_ref_mutations === 0, 'proof should not mutate Discovery refs');
  assert(proof.forbidden_mutations.bucket_persistence === false, 'proof should not persist Bucket state');
  assert(proof.forbidden_mutations.dispatcher_created === false, 'proof should not create Dispatcher');
  assert(proof.forbidden_mutations.schema_changes === 0, 'proof should not change schema');
  assert(proof.forbidden_mutations.runtime_enforcement_active === false, 'proof should not activate enforcement');
  assert(proof.forbidden_mutations.ui_work === false, 'proof should not do UI work');
}

async function verifyRendererRejected() {
  resetLiveGateState();
  const root = path.join(projectRoot(), '.tmp', 'hydration-selected-id-real-execution', 'renderer-rejected');
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(root, { recursive: true });
  const db = openDatabase(path.join(root, 'atlas.sqlite'));
  migrate(db);
  try {
    seedProviderNeeded(db);
    await assertRejects(
      () => invokeServiceCommand('metadata.hydration_selected_id_real_execution_proof', {
        ...readyStorageFixture(root),
        ...successPayload()
      }, {
        db,
        source: 'renderer',
        allowHydrationSelectedIdRealExecutionProof: true,
        controlledTempAtlasStore: true,
        allowStorageSetupGateFixtureInput: true,
        storageBudgetBytes: 4096,
        fetchImpl: failIfFetched()
      }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer should not invoke selected-ID real execution proof'
    );
  } finally {
    closeDatabase(db);
  }
}

function verifyCommandRegistration() {
  const commands = new Map(listServiceCommands().map((entry) => [entry.command, entry]));
  const command = commands.get('metadata.hydration_selected_id_real_execution_proof');
  assert(command, 'selected-ID real execution proof should be listed');
  assert(command.classification === 'metadata-only', 'selected-ID real execution proof should be metadata-only');
  assert(command.effects.includes('external-live-api'), 'selected-ID real execution proof should declare external live API effect');
  assert(command.effects.includes('local-data-mutation'), 'selected-ID real execution proof should declare local mutation effect');
  assert(command.effects.includes('metadata-readability'), 'selected-ID real execution proof should declare metadata readability effect');
  assert(command.renderer_allowed === false, 'selected-ID real execution proof should not be renderer eligible');
  assert(command.authority.confirmation_required === true, 'selected-ID real execution proof should require metadata hydration confirmation authority');
}

function successPayload() {
  return {
    idType: 'character',
    idValue: TARGET_ID,
    operatorAct: true,
    sourceSurface: 'trusted-selected-id-real-execution-proof',
    basisLayer: 'activity_events',
    basisAnchor: { event_key: `276:attacker:${TARGET_ID}` },
    externalIo: { state: 'on' }
  };
}

function readyContext(overrides = {}) {
  return {
    allowHydrationSelectedIdRealExecutionProof: true,
    controlledTempAtlasStore: true,
    now: '2026-06-05T12:00:00Z',
    ...overrides
  };
}

function seedProviderNeeded(db) {
  seedCommon(db, { localLabel: null, entityRow: false });
}

function seedAlreadyLocal(db) {
  seedCommon(db, { localLabel: TARGET_NAME, entityRow: true });
}

function seedCommon(db, options = {}) {
  db.prepare(`
    INSERT INTO killmails (
      killmail_id, killmail_hash, killmail_time, solar_system_id, raw_esi_payload,
      raw_payload_checksum, source, first_seen_at, last_seen_at, ingested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(276001, 'hash_276001', '2026-06-05T10:00:00Z', 30000001, '{"killmail_id":276001}', 'checksum_276001', 'fixture', '2026-06-05T10:00:00Z', '2026-06-05T10:00:00Z', '2026-06-05T10:00:00Z');
  if (options.entityRow) {
    db.prepare(`
      INSERT INTO entities (entity_type, entity_id, entity_name, first_seen_at, last_seen_at, last_enriched_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('character', TARGET_ID, options.localLabel, '2026-06-05T09:00:00Z', '2026-06-05T09:00:00Z', '2026-06-05T09:00:00Z');
  }
  db.prepare(`
    INSERT INTO activity_events (
      event_key, killmail_id, role, entity_type, entity_id, entity_name,
      character_id, character_name, corporation_id, corporation_name, alliance_id, alliance_name,
      ship_type_id, ship_type_name, weapon_type_id, final_blow, damage_done,
      solar_system_id, solar_system_name, region_id, region_name, killmail_time, ingested_at,
      discovered_by_type, discovered_by_id, normalizer_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `276:attacker:${TARGET_ID}`,
    276001,
    'attacker',
    'character',
    TARGET_ID,
    options.localLabel,
    TARGET_ID,
    options.localLabel,
    98027601,
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
    '2026-06-05T10:00:00Z',
    '2026-06-05T10:00:00Z',
    'manual_actor',
    String(TARGET_ID),
    'fixture'
  );
}

function readyStorageFixture(root) {
  const dbPath = path.join(root, 'atlas.sqlite');
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
  const dbPath = path.join(projectRoot(), '.tmp', 'hydration-selected-id-real-execution', 'missing', 'atlas.sqlite');
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

function fakeNamesFetch(rows) {
  return async (endpoint, options = {}) => ({
    ok: true,
    status: 200,
    headers: { get: () => null },
    text: async () => JSON.stringify(rows),
    endpoint,
    options
  });
}

function fakeErrorFetch() {
  return async () => ({
    ok: false,
    status: 500,
    headers: { get: () => null },
    text: async () => JSON.stringify({ error: 'fixture provider error' })
  });
}

function failIfFetched() {
  return async () => {
    throw new Error('provider should not be called in this case');
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
    assessment_artifacts: count(db, 'assessment_artifacts'),
    ingestion_audits: count(db, 'ingestion_audits'),
    data_quality_warnings: count(db, 'data_quality_warnings')
  };
}

function compact(proof) {
  return {
    outcome: proof.outcome,
    provider_calls: proof.provider_calls,
    metadata_run_status: proof.metadata_run?.status || null,
    provider_validation_status: proof.provider_validation?.status || proof.validation_result?.status || null,
    write_summary: proof.write_summary,
    invariants: proof.invariants
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

async function assertRejects(fn, expectedCode, message) {
  try {
    await fn();
  } catch (error) {
    if (error.code === expectedCode) {
      return error;
    }
    throw new Error(`${message}; expected ${expectedCode}, got ${error.code || error.message}`);
  }
  throw new Error(message);
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
