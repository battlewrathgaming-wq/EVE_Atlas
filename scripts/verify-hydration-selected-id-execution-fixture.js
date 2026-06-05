const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const previousLive = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  try {
    const success = await runCase('success', seedProviderNeeded, successPayload());
    const cases = {
      not_a_request: await runCase('not_a_request', seedProviderNeeded, { ...successPayload(), operatorAct: false }),
      invalid: await runCase('invalid', seedProviderNeeded, { ...successPayload(), idType: 'region' }),
      insufficient_basis: await runCase('insufficient_basis', seedEmpty, successPayload()),
      already_local: await runCase('already_local', seedAlreadyLocal, successPayload()),
      local_lookup_available: await runCase('local_lookup_available', seedProviderNeeded, { ...successPayload(), idType: 'inventory_type', idValue: 603, fixtureProviderResponse: { id: 603, category: 'inventory_type', name: 'Merlin' } }),
      held: await runCase('held', seedProviderNeeded, { ...successPayload(), externalIo: { state: 'off' } }),
      blocked: await runCase('blocked', seedProviderNeeded, { ...successPayload(), ...missingStorageFixture() }),
      id_mismatch: await runCase('id_mismatch', seedProviderNeeded, { ...successPayload(), fixtureProviderResponse: { id: 90000004, category: 'character', name: 'Wrong Pilot' } }),
      category_mismatch: await runCase('category_mismatch', seedProviderNeeded, { ...successPayload(), fixtureProviderResponse: { id: 90000003, category: 'corporation', name: 'Wrong Corp' } }),
      unsafe_label: await runCase('unsafe_label', seedProviderNeeded, { ...successPayload(), fixtureProviderResponse: { id: 90000003, category: 'character', name: '' } })
    };
    const untrusted = await verifyUntrustedContext();
    await verifyRendererCannotInvoke();
    verifyCommandRegistration();
    verifySuccess(success);
    verifyRejectedCases(cases);

    console.log(JSON.stringify({
      status: 'hydration selected-ID execution fixture proof verified',
      success: compact(success.proof),
      rejected_cases: Object.fromEntries(Object.entries(cases).map(([key, value]) => [key, compact(value.proof)])),
      untrusted_context: {
        validation_status: untrusted.validation_result.status,
        mutates_state: untrusted.mutates_state
      },
      success_invariants: success.proof.invariants,
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

async function runCase(name, seedFn, payload) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedFn(db);
    const before = snapshot(db);
    const proof = await invokeServiceCommand('metadata.hydration_selected_id_execution_fixture_proof', {
      ...readyStorageFixture(),
      ...payload,
      pickup_contract: { renderer_forged: true }
    }, {
      db,
      allowStorageSetupGateFixtureInput: true,
      storageBudgetBytes: 4096,
      allowHydrationSelectedIdExecutionFixtureProof: true
    });
    const after = snapshot(db);
    assertSame(proof.before.counts, before.counts, `${name} proof before counts should match verifier before counts`);
    assertSame(proof.after.counts, after.counts, `${name} proof after counts should match verifier after counts`);
    return { proof, before, after };
  } finally {
    closeDatabase(db);
  }
}

function verifySuccess(result) {
  const { proof, before, after } = result;
  verifyCommon(proof);
  assert(proof.outcome === 'success', 'success case should succeed');
  assert(proof.pickup_contract_summary.pickup_candidate === true, 'success should start from pickup candidate');
  assert(proof.pickup_contract_summary.request_posture_state === 'provider_needed', 'success should revalidate provider_needed posture');
  assert(proof.pickup_contract_summary.provider_posture === 'released_to_normal_gates_only', 'success should be released to normal gates');
  assert(proof.execution_revalidation.status === 'fixture_provider_response_valid', 'success should validate fixture provider response');
  assert(proof.write_summary.metadata_run_writes === 1, 'success should write one metadata run');
  assert(proof.write_summary.api_request_log_writes === 1, 'success should write one fixture API log');
  assert(proof.write_summary.entities_upserted === 1, 'success should upsert selected entity');
  assert(proof.write_summary.activity_event_label_patches === 2, 'success should patch matching activity event labels');
  assert(proof.metadata_run.run_type === 'selected_id_execution_fixture_proof', 'metadata run should identify selected-ID fixture proof');
  assert(proof.metadata_run.requested_from_esi === 1, 'metadata run should count one fixture ESI request');
  assert(proof.metadata_run.api_calls_esi === 1, 'metadata run should count one fixture ESI API log');
  assert(after.counts.metadata_runs === before.counts.metadata_runs + 1, 'metadata_runs should increase by one');
  assert(after.counts.api_request_logs === before.counts.api_request_logs + 1, 'api_request_logs should increase by one');
  assert(after.counts.entities === before.counts.entities + 1, 'entities should increase by one');
  assert(after.activity_event_labels[0].entity_name === 'Fixture Pilot', 'primary entity label should be patched');
  assert(after.activity_event_labels[0].character_name === 'Fixture Pilot', 'character label should be patched');
  assert(proof.invariants.numeric_activity_event_ids_unchanged === true, 'numeric IDs should stay unchanged');
  assert(proof.invariants.raw_killmail_payloads_unchanged === true, 'raw killmail payloads should stay unchanged');
  assert(proof.invariants.discovered_refs_unchanged === true, 'Discovery refs should stay unchanged');
  assert(proof.invariants.fetch_runs_unchanged === true, 'fetch runs should stay unchanged');
  assert(proof.invariants.watch_rows_unchanged === true, 'Watch rows should stay unchanged');
  assert(proof.invariants.assessment_rows_unchanged === true, 'Assessment Memory rows should stay unchanged');
}

function verifyRejectedCases(cases) {
  for (const [name, { proof, before, after }] of Object.entries(cases)) {
    verifyCommon(proof);
    assert(proof.outcome !== 'success', `${name} should not succeed`);
    assert(proof.write_summary.entities_upserted === 0, `${name} should not upsert entities`);
    assert(proof.write_summary.activity_event_label_patches === 0, `${name} should not patch activity events`);
    assert(after.counts.metadata_runs === before.counts.metadata_runs + 1, `${name} should finalize one metadata run`);
    assert(after.counts.entities === before.counts.entities, `${name} should not change entity count`);
    assert(JSON.stringify(before.activity_event_labels) === JSON.stringify(after.activity_event_labels), `${name} should not change labels`);
    assert(proof.invariants.numeric_activity_event_ids_unchanged === true, `${name} numeric IDs should stay unchanged`);
    assert(proof.invariants.raw_killmail_payloads_unchanged === true, `${name} raw payloads should stay unchanged`);
    assert(proof.invariants.discovered_refs_unchanged === true, `${name} Discovery refs should stay unchanged`);
    assert(proof.invariants.watch_rows_unchanged === true, `${name} Watch rows should stay unchanged`);
  }
  assert(cases.already_local.proof.outcome === 'local_label_short_circuit', 'already_local should short-circuit');
  assert(cases.id_mismatch.proof.execution_revalidation.issues.includes('fixture_provider_response_id_mismatch'), 'ID mismatch should be rejected');
  assert(cases.category_mismatch.proof.execution_revalidation.issues.includes('fixture_provider_response_category_mismatch'), 'category mismatch should be rejected');
  assert(cases.unsafe_label.proof.execution_revalidation.issues.includes('fixture_provider_response_label_missing_or_unsafe'), 'unsafe label should be rejected');
}

function verifyCommon(proof) {
  assert(proof.action === 'metadata.hydration_selected_id_execution_fixture_proof', 'proof action should be named');
  assert(proof.fixture_offline_only === true, 'proof should be fixture-only');
  assert(proof.renderer_eligible === false, 'proof should not be renderer eligible');
  assert(proof.real_operator_hydration === false, 'proof should not be real operator hydration');
  assert(proof.provider_calls === 0, 'proof should not call providers');
  assert(proof.live_api_calls === 0, 'proof should not make live/API calls');
  assert(proof.esi_live_calls === 0, 'proof should not make live ESI calls');
  assert(proof.fixture_provider_results_only === true, 'proof should use fixture provider results only');
  assert(proof.evidence_writes === 0, 'proof should not write Evidence/EVEidence');
  assert(proof.discovery_ref_mutations === 0, 'proof should not mutate Discovery refs');
  assert(proof.queue_dispatches === 0, 'proof should not dispatch queues');
  assert(proof.pickup_persistence === false, 'proof should not persist pickup');
  assert(proof.request_persistence === false, 'proof should not persist request state');
  assert(proof.lease_persistence === false, 'proof should not persist leases');
  assert(proof.retry_persistence === false, 'proof should not persist retries');
  assert(proof.dispatcher_created === false, 'proof should not create dispatcher');
  assert(proof.worker_created === false, 'proof should not create worker');
  assert(proof.watch_state_mutations === 0, 'proof should not mutate Watch state');
  assert(proof.marked_mutations === 0, 'proof should not mutate Marked state');
  assert(proof.assessment_memory_mutations === 0, 'proof should not mutate Assessment Memory');
  assert(proof.storage_config_writes === 0, 'proof should not write storage config');
  assert(proof.external_io_config_writes === 0, 'proof should not write External I/O config');
  assert(proof.support_artifacts_created === 0, 'proof should not create support artifacts');
  assert(proof.schema_changes === 0, 'proof should not change schema');
  assert(proof.runtime_enforcement_active === false, 'proof should not activate runtime enforcement');
  assert(proof.command_blocking_active === false, 'proof should not activate command blocking');
  assert(proof.fourth_lane_reopened === false, 'proof should not reopen fourth lane');
  assert(proof.evidence_boundary.hydration_outputs_readability_repair === true, 'Hydration should output readability repair');
  assert(proof.evidence_boundary.creates_evidence === false, 'Hydration should not create Evidence/EVEidence');
  assert(proof.forged_payload_authority_ignored === true, 'forged payload authority should be ignored');
}

async function verifyUntrustedContext() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedProviderNeeded(db);
    const before = snapshot(db);
    const blocked = await invokeServiceCommand('metadata.hydration_selected_id_execution_fixture_proof', successPayload(), { db });
    const after = snapshot(db);
    assert(blocked.validation_result.valid === false, 'untrusted context should be invalid');
    assert(blocked.mutates_state === false, 'untrusted context should not mutate');
    assertSame(after, before, 'untrusted context should not change DB');
    return blocked;
  } finally {
    closeDatabase(db);
  }
}

async function verifyRendererCannotInvoke() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedProviderNeeded(db);
    await assertRejects(
      () => invokeServiceCommand('metadata.hydration_selected_id_execution_fixture_proof', successPayload(), {
        db,
        source: 'renderer',
        allowHydrationSelectedIdExecutionFixtureProof: true
      }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer should not invoke selected-ID execution fixture proof'
    );
  } finally {
    closeDatabase(db);
  }
}

function verifyCommandRegistration() {
  const commands = new Map(listServiceCommands().map((entry) => [entry.command, entry]));
  const command = commands.get('metadata.hydration_selected_id_execution_fixture_proof');
  assert(command, 'selected-ID execution fixture proof should be listed');
  assert(command.classification === 'metadata-only', 'selected-ID execution fixture proof should be metadata-only');
  assert(command.effects.includes('local-data-mutation'), 'selected-ID execution fixture proof should declare local mutation');
  assert(command.effects.includes('metadata-readability'), 'selected-ID execution fixture proof should declare metadata readability');
  assert(command.renderer_allowed === false, 'selected-ID execution fixture proof should not be renderer eligible');
}

function successPayload() {
  return {
    idType: 'character',
    idValue: 90000003,
    operatorAct: true,
    sourceSurface: 'fixture-selected-id',
    basisLayer: 'activity_events',
    basisAnchor: { event_key: '9201:attacker:90000003' },
    fixtureProviderResponse: {
      id: 90000003,
      category: 'character',
      name: 'Fixture Pilot'
    },
    logFixtureProviderAttempt: true
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
  const dbPath = path.join(projectRoot(), '.tmp', 'hydration-selected-id-fixture', 'ready', 'atlas.sqlite');
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
  const dbPath = path.join(projectRoot(), '.tmp', 'hydration-selected-id-fixture', 'missing', 'atlas.sqlite');
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
    counts: {
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
    },
    activity_event_labels: db.prepare('SELECT event_key, entity_name, character_name, corporation_name, alliance_name FROM activity_events ORDER BY event_key').all()
  };
}

function compact(proof) {
  return {
    outcome: proof.outcome,
    request_posture_state: proof.pickup_contract_summary?.request_posture_state || null,
    provider_posture: proof.pickup_contract_summary?.provider_posture || null,
    metadata_run_status: proof.metadata_run?.status || null,
    write_summary: proof.write_summary,
    validation_status: proof.execution_revalidation?.status || proof.validation_result?.status
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
