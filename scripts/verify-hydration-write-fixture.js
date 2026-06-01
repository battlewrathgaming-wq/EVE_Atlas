const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedFixture(db);
    const before = snapshot(db);
    const proof = await invokeServiceCommand('metadata.hydration_write_fixture_proof', {
      entityIds: [123],
      labels: {
        character: 'renderer forged label'
      },
      providerResults: [{
        id: 90000001,
        name: 'forged provider result'
      }],
      databasePath: 'C:\\forged\\atlas.sqlite'
    }, {
      db,
      allowHydrationWriteFixtureProof: true
    });
    const after = snapshot(db);
    const blocked = await verifyUntrustedDirectContext(db);
    await verifyRendererCannotInvoke(db);
    verifyCommandRegistration();
    verifyProof({ proof, before, after });

    console.log(JSON.stringify({
      status: 'hydration write fixture proof verified',
      sample_write: {
        command: proof.action,
        candidates_considered: proof.candidates_considered,
        activity_event_label_patches: proof.write_summary.activity_event_label_patches,
        metadata_run: proof.metadata_run,
        forged_payload_authority_ignored: proof.forged_payload_authority_ignored,
        invariants: proof.invariants
      },
      sample_before_labels: before.activity_event_labels,
      sample_after_labels: after.activity_event_labels,
      sample_blocked_untrusted: {
        validation_status: blocked.validation_result.status,
        mutates_state: blocked.mutates_state
      },
      boundary: proof.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
  }
}

function verifyProof({ proof, before, after }) {
  assert(proof.action === 'metadata.hydration_write_fixture_proof', 'proof action should be named');
  assert(proof.validation_result.valid === true, 'trusted fixture proof should be valid');
  assert(proof.fixture_offline_only === true, 'proof should be fixture/offline only');
  assert(proof.provider_calls === 0, 'proof should not call providers');
  assert(proof.esi_calls === 0, 'proof should not call ESI');
  assert(proof.zkill_calls === 0, 'proof should not call zKill');
  assert(proof.evidence_writes === 0, 'proof should not write Evidence/EVEidence');
  assert(proof.discovery_ref_mutations === 0, 'proof should not mutate Discovery refs');
  assert(proof.queue_dispatches === 0, 'proof should not dispatch queues');
  assert(proof.watch_state_mutations === 0, 'proof should not mutate Watch state');
  assert(proof.schema_changes === 0, 'proof should not change schema');
  assert(proof.runtime_authorization_active === false, 'proof should not activate runtime authorization');
  assert(proof.command_blocking_active === false, 'proof should not activate command blocking');
  assert(proof.forged_payload_authority_ignored === true, 'forged payload authority should be ignored');
  assert(proof.write_summary.metadata_run_writes === 1, 'proof should write one metadata run');
  assert(proof.write_summary.activity_event_label_patches > 0, 'proof should patch activity event labels');
  assert(proof.write_summary.entity_label_writes === 0, 'proof should not write entity labels');
  assert(proof.write_summary.entities_upserted === 0, 'proof should not upsert entities');
  assert(proof.metadata_run.requested_from_esi === 0, 'metadata run should not request ESI');
  assert(proof.metadata_run.api_calls_esi === 0, 'metadata run should not log ESI calls');
  assert(proof.evidence_boundary.numeric_ids_remain_facts === true, 'numeric IDs should remain facts');
  assert(proof.evidence_boundary.raw_killmail_payloads_mutated === false, 'raw killmail payloads should not mutate');
  assert(proof.evidence_boundary.creates_evidence === false, 'Hydration proof should not create Evidence/EVEidence');
  assert(proof.invariants.numeric_activity_event_ids_unchanged === true, 'numeric activity event IDs should be unchanged');
  assert(proof.invariants.raw_killmail_payloads_unchanged === true, 'raw killmail payloads should be unchanged');
  assert(proof.invariants.discovered_refs_unchanged === true, 'Discovery refs should be unchanged');
  assert(proof.invariants.fetch_runs_unchanged === true, 'fetch runs should be unchanged');
  assert(proof.invariants.api_request_logs_unchanged === true, 'provider logs should be unchanged');
  assert(proof.invariants.watch_rows_unchanged === true, 'Watch rows should be unchanged');
  assert(proof.invariants.entity_rows_unchanged === true, 'entity rows should be unchanged');
  assert(proof.invariants.only_expected_tables_changed === true, 'only metadata_runs and activity labels should change');

  assert(after.counts.metadata_runs === before.counts.metadata_runs + 1, 'metadata_runs should increase by one');
  assert(after.counts.fetch_runs === before.counts.fetch_runs, 'fetch_runs count should not change');
  assert(after.counts.discovered_killmail_refs === before.counts.discovered_killmail_refs, 'Discovery ref count should not change');
  assert(after.counts.api_request_logs === before.counts.api_request_logs, 'API log count should not change');
  assert(after.activity_event_labels[0].character_name === 'Known Fixture Pilot', 'character label should be patched from local entity');
  assert(after.activity_event_labels[0].corporation_name === 'Known Fixture Corp', 'corporation label should be patched from local entity');
  assert(after.activity_event_labels[0].alliance_name === 'Known Fixture Alliance', 'alliance label should be patched from local entity');
  assert(JSON.stringify(before.killmails) === JSON.stringify(after.killmails), 'killmails should be unchanged');
  assert(JSON.stringify(before.activity_event_ids) === JSON.stringify(after.activity_event_ids), 'activity numeric IDs should be unchanged');
}

async function verifyUntrustedDirectContext(db) {
  const before = snapshot(db);
  const blocked = await invokeServiceCommand('metadata.hydration_write_fixture_proof', {}, { db });
  const after = snapshot(db);
  assert(blocked.validation_result.valid === false, 'untrusted context should be invalid');
  assert(blocked.validation_result.issues.includes('trusted_hydration_write_fixture_context_required'), 'untrusted context should require fixture flag');
  assert(blocked.mutates_state === false, 'untrusted context should not mutate');
  assertSame(after, before, 'untrusted direct context should not change DB state');
  return blocked;
}

async function verifyRendererCannotInvoke(db) {
  await assertRejects(
    () => invokeServiceCommand('metadata.hydration_write_fixture_proof', {
      labels: { character: 'forged' },
      entityIds: [90000001]
    }, {
      db,
      source: 'renderer',
      allowHydrationWriteFixtureProof: true
    }),
    'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
    'renderer should not invoke Hydration write fixture proof'
  );
}

function verifyCommandRegistration() {
  const commands = new Map(listServiceCommands().map((entry) => [entry.command, entry]));
  const command = commands.get('metadata.hydration_write_fixture_proof');
  assert(command, 'Hydration write fixture proof should be listed');
  assert(command.classification === 'metadata-only', 'Hydration write fixture proof should be metadata-only');
  assert(command.effects.includes('local-data-mutation'), 'Hydration write fixture proof should declare local mutation');
  assert(command.effects.includes('metadata-readability'), 'Hydration write fixture proof should declare metadata readability');
  assert(command.renderer_allowed === false, 'Hydration write fixture proof should not be renderer eligible');
}

function seedFixture(db) {
  db.prepare(`
    INSERT INTO entities (
      entity_type, entity_id, entity_name, first_seen_at, last_seen_at, last_enriched_at
    ) VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)
  `).run(
    'character', 90000001, 'Known Fixture Pilot', '2026-05-01T00:00:00Z', '2026-05-01T00:00:00Z', '2026-05-01T00:00:00Z',
    'corporation', 98000001, 'Known Fixture Corp', '2026-05-01T00:00:00Z', '2026-05-01T00:00:00Z', '2026-05-01T00:00:00Z',
    'alliance', 99000001, 'Known Fixture Alliance', '2026-05-01T00:00:00Z', '2026-05-01T00:00:00Z', '2026-05-01T00:00:00Z'
  );
  db.prepare(`
    INSERT INTO killmails (
      killmail_id, killmail_hash, killmail_time, solar_system_id, raw_esi_payload,
      raw_payload_checksum, source, first_seen_at, last_seen_at, ingested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(9101, 'hash_9101', '2026-05-31T10:00:00Z', 30000001, '{"killmail_id":9101}', 'checksum_9101', 'fixture', '2026-05-31T10:00:00Z', '2026-05-31T10:00:00Z', '2026-05-31T10:00:00Z');
  db.prepare(`
    INSERT INTO activity_events (
      event_key, killmail_id, role, entity_type, entity_id, entity_name,
      character_id, character_name, corporation_id, corporation_name, alliance_id, alliance_name,
      ship_type_id, ship_type_name, weapon_type_id, final_blow, damage_done,
      solar_system_id, solar_system_name, region_id, region_name, killmail_time, ingested_at,
      discovered_by_type, discovered_by_id, normalizer_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    '9101:attacker:90000001',
    9101,
    'attacker',
    'character',
    90000001,
    null,
    90000001,
    null,
    98000001,
    null,
    99000001,
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
    '2026-05-31T10:00:00Z',
    '2026-05-31T10:00:00Z',
    'manual_actor',
    '90000001',
    'fixture'
  );
  db.prepare(`
    INSERT INTO discovered_killmail_refs (
      killmail_id, killmail_hash, discovered_by_type, discovered_by_id,
      discovered_at, first_seen_run_id, last_seen_run_id, last_seen_at,
      status, priority
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(9101, 'hash_9101', 'manual_actor', 'character:90000001', '2026-05-31T09:59:00Z', 'fetch_fixture', 'fetch_fixture', '2026-05-31T09:59:00Z', 'expanded', 0);
  db.prepare(`
    INSERT INTO fetch_runs (
      run_id, trigger, watch_type, watch_id, started_at, finished_at, status,
      discovered_refs, expanded_new, activity_events_written
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('fetch_fixture', 'fixture', 'manual_scan', 'fixture', '2026-05-31T09:59:00Z', '2026-05-31T10:00:00Z', 'success', 1, 1, 1);
  db.prepare(`
    INSERT INTO api_request_logs (
      request_id, run_id, run_type, provider, endpoint, method, status_code,
      duration_ms, cache_status, requested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('api_fixture', 'fetch_fixture', 'collection', 'zkill', 'fixture://zkill', 'GET', 200, 1, 'fixture', '2026-05-31T09:59:00Z');
  db.prepare(`
    INSERT INTO watchlist_entities (
      entity_type, entity_id, entity_name, lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes, next_poll_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('character', 90000001, 'Known Fixture Pilot', 30, 5, 1, 60, '2026-06-01T00:00:00Z', 'fixture watch row');
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
      system_watches: count(db, 'system_watches')
    },
    killmails: db.prepare(`
      SELECT killmail_id, killmail_hash, killmail_time, solar_system_id, raw_esi_payload, raw_payload_checksum
      FROM killmails
      ORDER BY killmail_id
    `).all(),
    activity_event_ids: db.prepare(`
      SELECT event_key, killmail_id, role, entity_type, entity_id, character_id,
             corporation_id, alliance_id, ship_type_id, weapon_type_id, solar_system_id
      FROM activity_events
      ORDER BY event_key
    `).all(),
    activity_event_labels: db.prepare(`
      SELECT event_key, entity_name, character_name, corporation_name, alliance_name
      FROM activity_events
      ORDER BY event_key
    `).all(),
    discovered_refs: db.prepare('SELECT * FROM discovered_killmail_refs ORDER BY killmail_id, killmail_hash, discovered_by_type, discovered_by_id').all(),
    fetch_runs: db.prepare('SELECT * FROM fetch_runs ORDER BY run_id').all(),
    api_request_logs: db.prepare('SELECT * FROM api_request_logs ORDER BY request_id').all(),
    entities: db.prepare('SELECT * FROM entities ORDER BY entity_type, entity_id').all(),
    watch_rows: db.prepare('SELECT * FROM watchlist_entities ORDER BY watch_id').all()
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
    throw new Error(message);
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
