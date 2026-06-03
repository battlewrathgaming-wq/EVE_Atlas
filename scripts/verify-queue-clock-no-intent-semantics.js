const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');

const NOW = '2026-06-03T13:00:00.000Z';

async function main() {
  const results = [];

  results.push(await runCase('empty_db_no_watch_no_manual_scope', async ({ preview }) => {
    const zkill = lane(preview, 'zkill_discovery');
    assert(zkill.provider_capability_available === true, 'zKill capability should remain visible');
    assert(zkill.current_provider_backed_work === 0, 'empty DB should not count current zKill provider work');
    assert(zkill.provider_backed_work === 0, 'legacy zKill provider_backed_work should mean current work');
    assert(zkill.requires_explicit_scope_or_watch_intent === true, 'empty DB should require explicit manual scope or Watch intent');
    assert(zkill.manual_discovery_intent.state === 'absent', 'manual discovery intent should be absent');
    assert(zkill.watch_acquisition_intent.state === 'absent', 'Watch acquisition intent should be absent');
    assert(preview.summary.provider_backed_work === 0, 'empty summary should exclude capability-only provider posture');
    assert(preview.summary.capability_only_lanes >= 1, 'summary should expose capability-only posture');
  }));

  results.push(await runCase('no_pending_refs_no_explicit_or_watch_intent', async ({ db, runPreview }) => {
    seedDiscoveryRef(db, {
      killmailId: 950001,
      hash: 'hash_expanded_only',
      status: 'expanded'
    });
    const preview = await runPreview(db);
    const zkill = lane(preview, 'zkill_discovery');
    assert(zkill.current_provider_backed_work === 0, 'expanded-only refs should not create zKill current work');
    assert(zkill.requires_explicit_scope_or_watch_intent === true, 'expanded-only refs should still require scope/intent');
    assert(preview.summary.provider_backed_work === 0, 'summary should exclude expanded-only capability posture');
  }));

  results.push(await runCase('explicit_manual_discovery_scope', async ({ db, runPreview }) => {
    const preview = await runPreview(db, {
      discoveryGateInput: {
        scope: 'actor',
        entityType: 'character',
        entityId: 950002,
        maxRefs: 5
      }
    });
    const zkill = lane(preview, 'zkill_discovery');
    assert(zkill.manual_discovery_intent.state === 'present', 'explicit manual scope should be present');
    assert(zkill.current_provider_backed_work === 1, 'explicit manual scope should count one current zKill provider work unit');
    assert(zkill.requires_explicit_scope_or_watch_intent === false, 'explicit manual scope should satisfy intent requirement');
    assert(preview.summary.provider_backed_work === 1, 'summary should count explicit current provider work');
  }));

  results.push(await runCase('pending_failed_discovery_refs_preferred', async ({ db, runPreview }) => {
    seedDiscoveryRef(db, {
      killmailId: 950003,
      hash: 'hash_pending',
      status: 'pending'
    });
    seedDiscoveryRef(db, {
      killmailId: 950004,
      hash: 'hash_failed',
      status: 'failed'
    });
    const preview = await runPreview(db);
    const zkill = lane(preview, 'zkill_discovery');
    const expansion = lane(preview, 'esi_evidence_expansion');
    assert(zkill.posture === 'local_only_available', 'pending refs should prefer local Discovery refs before fresh zKill');
    assert(zkill.local_only_available_work === 2, 'pending/failed refs should count as local work');
    assert(zkill.current_provider_backed_work === 0, 'pending refs should not create fresh zKill provider work');
    assert(expansion.current_provider_backed_work === 2, 'refs with hashes should count as ESI current provider-backed work');
  }));

  results.push(await runCase('due_watch_acquisition_valid_scope', async ({ db, runPreview }) => {
    seedActorWatch(db, { watchId: 1, entityId: 950005 });
    const preview = await runPreview(db);
    const zkill = lane(preview, 'zkill_discovery');
    assert(zkill.watch_acquisition_intent.state === 'present', 'due valid Watch should create Watch acquisition intent');
    assert(zkill.watch_acquisition_intent.current_provider_backed_work === 1, 'due valid Watch should count one current provider work unit');
    assert(zkill.current_provider_backed_work === 1, 'zKill current work should include due valid Watch intent');
    assert(zkill.manual_discovery_intent.state === 'absent', 'Watch acquisition intent should be distinct from manual discovery');
  }));

  results.push(await runCase('not_due_inactive_missing_malformed_watch_posture', async ({ db, runPreview }) => {
    seedActorWatch(db, {
      watchId: 1,
      entityId: 950006,
      nextPollAt: '2026-06-03T14:00:00.000Z'
    });
    seedActorWatch(db, {
      watchId: 2,
      entityId: 950007,
      isActive: 0
    });
    seedSystemWatch(db, {
      watchId: 1,
      included: '',
      excluded: ''
    });
    seedSystemWatch(db, {
      watchId: 2,
      centerSystemId: 30000200,
      included: 'not-json',
      excluded: '{"bad":true}'
    });
    const preview = await runPreview(db);
    const zkill = lane(preview, 'zkill_discovery');
    assert(zkill.current_provider_backed_work === 0, 'not-due/inactive/missing/malformed Watch posture should not count current zKill work');
    assert(zkill.watch_acquisition_intent.current_provider_backed_work === 0, 'Watch acquisition current work should be zero');
    assert(zkill.watch_acquisition_intent.waiting_count >= 2, 'not-due and inactive watches should be waiting posture');
    assert(zkill.watch_acquisition_intent.missing_or_malformed_scope_count >= 2, 'missing/malformed radius scopes should be disclosed');
  }));

  results.push(await runCase('watch_background_hydration_without_acquisition_intent', async ({ db, runPreview }) => {
    seedKillmail(db, 950008);
    seedActivityEvent(db, {
      killmailId: 950008,
      eventKey: '950008:attacker:950008',
      entityId: 950008,
      characterId: 950008,
      corporationId: 980008,
      discoveredByType: 'actor',
      discoveredById: '950008'
    });
    const preview = await runPreview(db);
    const zkill = lane(preview, 'zkill_discovery');
    const hydration = lane(preview, 'watch_background_hydration');
    assert(zkill.current_provider_backed_work === 0, 'Watch/background Hydration demand should not create zKill acquisition intent');
    assert(zkill.watch_acquisition_intent.state === 'absent', 'no Watch rows should mean no Watch acquisition intent');
    assert(hydration.current_provider_backed_work > 0, 'Watch/background Hydration demand can be current provider-backed readability work');
    assert(hydration.provider_action === 'metadata.hydration', 'Watch/background Hydration should stay Hydration, not zKill Discovery');
  }));

  results.push(await runCase('summary_excludes_capability_only_posture', async ({ db, runPreview }) => {
    seedSystemWatch(db, {
      watchId: 1,
      included: '',
      excluded: ''
    });
    const preview = await runPreview(db);
    const zkill = lane(preview, 'zkill_discovery');
    assert(zkill.provider_capability_available === true, 'capability should be visible for zKill');
    assert(zkill.current_provider_backed_work === 0, 'missing-scope Watch should not be current work');
    assert(preview.summary.provider_backed_work === 0, 'summary provider_backed_work should exclude capability-only zKill posture');
    assert(preview.summary.current_provider_backed_work === 0, 'summary current_provider_backed_work should be zero');
    assert(preview.summary.capability_only_lanes >= 1, 'summary should disclose capability-only lane count');
  }));

  console.log(JSON.stringify({
    status: 'queue clock no-intent semantics verified',
    cases: results.map((entry) => entry.case),
    required_cases_covered: results.length,
    semantics: {
      provider_backed_work_means: 'current_provider_backed_work',
      provider_capability_available_is_counted_as_current_work: false,
      manual_discovery_intent_requires_explicit_scope: true,
      watch_acquisition_intent_distinct_from_hydration: true
    },
    boundary: {
      read_only: true,
      provider_calls: 0,
      queue_dispatches: 0,
      evidence_writes: 0,
      hydration_writes: 0,
      discovery_ref_mutations: 0,
      watch_mutations: 0,
      schema_changes: false,
      runtime_enforcement_active: false,
      command_blocking_active: false,
      ui_work: false
    }
  }, null, 2));
  console.log('queue clock no-intent semantics verified');
}

async function runCase(name, verify) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const runPreview = async (database, payload = {}) => {
      const before = sideEffectCounts(database);
      const result = await invokeServiceCommand('runtime.queue_clock_posture.preview', {
        now: NOW,
        limit: 10,
        ...payload
      }, {
        db: database
      });
      const after = sideEffectCounts(database);
      assertSame(after, before, `${name} preview should not mutate persistent tables`);
      verifyReadOnlyBoundary(result);
      return result;
    };
    const initialPreview = await runPreview(db);
    await verify({ db, preview: initialPreview, runPreview });
    return { case: name, status: 'passed' };
  } finally {
    closeDatabase(db);
  }
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.read_only === true, 'preview should be read-only');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.queue_dispatches === 0, 'preview should not dispatch queue work');
  assert(preview.discovery_ref_mutations === 0, 'preview should not mutate Discovery refs');
  assert(preview.evidence_writes === 0, 'preview should not write Evidence/EVEidence');
  assert(preview.hydration_writes === 0, 'preview should not write Hydration');
  assert(preview.watch_mutations === 0, 'preview should not mutate Watch');
  assert(preview.persisted_sequencer_packets === false, 'preview should not persist packets');
  assert(preview.provider_work_queue_created === false, 'preview should not create provider work queue');
  assert(preview.dispatcher_added === false, 'preview should not add dispatcher');
  assert(preview.schema_changes === false, 'preview should not change schema');
  assert(preview.runtime_enforcement_active === false, 'preview should not activate runtime enforcement');
  assert(preview.command_blocking_active === false, 'preview should not block commands');
  assert(preview.ui_work === false, 'preview should not add UI');
}

function seedActorWatch(db, input) {
  db.prepare(`
    INSERT INTO watchlist_entities (
      watch_id, entity_type, entity_id, entity_name,
      lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes,
      next_poll_at
    ) VALUES (?, 'character', ?, ?, 30, 5, ?, 60, ?)
  `).run(
    input.watchId,
    input.entityId,
    `Fixture ${input.entityId}`,
    input.isActive === 0 ? 0 : 1,
    input.nextPollAt || null
  );
}

function seedSystemWatch(db, input) {
  db.prepare(`
    INSERT INTO system_watches (
      watch_id, center_system_id, center_system_name, radius_jumps,
      included_system_ids, excluded_system_ids,
      lookback_hours, max_systems_per_run, max_killmails_per_run,
      is_active, poll_interval_minutes
    ) VALUES (?, ?, ?, 2, ?, ?, 24, 3, 12, ?, 90)
  `).run(
    input.watchId,
    input.centerSystemId || 30000100,
    input.centerSystemName || 'Fixture System',
    input.included,
    input.excluded,
    input.isActive === 0 ? 0 : 1
  );
}

function seedDiscoveryRef(db, input) {
  db.prepare(`
    INSERT INTO discovered_killmail_refs (
      killmail_id, killmail_hash, discovered_by_type, discovered_by_id,
      source_scope, source_system_id, source_actor_type, source_actor_id,
      discovered_at, first_seen_run_id, last_seen_run_id, last_seen_at,
      status, priority, preview_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.killmailId,
    input.hash,
    input.discoveredByType || 'manual_actor',
    input.discoveredById || 'character:950000',
    input.sourceScope || input.discoveredById || 'character:950000',
    input.sourceSystemId || null,
    input.sourceActorType || 'character',
    input.sourceActorId || 950000,
    '2026-06-03T12:00:00.000Z',
    'run_queue_clock_no_intent_fixture',
    'run_queue_clock_no_intent_fixture',
    '2026-06-03T12:00:00.000Z',
    input.status,
    1,
    '{}'
  );
}

function seedKillmail(db, killmailId) {
  db.prepare(`
    INSERT INTO killmails (
      killmail_id, killmail_hash, killmail_time, solar_system_id,
      raw_esi_payload, raw_payload_checksum, source,
      first_seen_at, last_seen_at, ingested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    killmailId,
    `hash_${killmailId}`,
    '2026-06-03T12:10:00.000Z',
    30000100,
    '{}',
    `checksum_${killmailId}`,
    'fixture',
    '2026-06-03T12:11:00.000Z',
    '2026-06-03T12:11:00.000Z',
    '2026-06-03T12:11:00.000Z'
  );
}

function seedActivityEvent(db, input) {
  db.prepare(`
    INSERT INTO activity_events (
      event_key, killmail_id, role, entity_type, entity_id, entity_name,
      character_id, character_name, corporation_id, corporation_name,
      alliance_id, alliance_name, ship_type_id, ship_type_name,
      weapon_type_id, final_blow, damage_done,
      solar_system_id, solar_system_name, region_id, region_name,
      killmail_time, ingested_at, discovered_by_type, discovered_by_id,
      normalizer_version
    ) VALUES (?, ?, 'attacker', 'character', ?, NULL, ?, NULL, ?, NULL, NULL, NULL, 603, NULL, NULL, 1, 100, 30000100, NULL, 10000001, NULL, ?, ?, ?, ?, 'fixture')
  `).run(
    input.eventKey,
    input.killmailId,
    input.entityId,
    input.characterId,
    input.corporationId,
    '2026-06-03T12:10:00.000Z',
    '2026-06-03T12:11:00.000Z',
    input.discoveredByType,
    input.discoveredById
  );
}

function lane(preview, laneId) {
  const lanes = [
    ...(preview.clocks?.acquisition_clock?.lanes || []),
    ...(preview.clocks?.hydration_recovery_clock?.lanes || [])
  ];
  const entry = lanes.find((candidate) => candidate.lane_id === laneId);
  assert(entry, `${laneId} lane should exist`);
  return entry;
}

function sideEffectCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    metadata_runs: count(db, 'metadata_runs'),
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
