const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');

const ACCEPTED_IDS = [30003597, 30003601, 30003599, 30003598, 30003596];

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedTopology(db);
    const before = sideEffectCounts(db);
    const created = await invokeServiceCommand('watch.create', {
      watchType: 'system_radius',
      centerSystemId: 30003597,
      radiusJumps: 1,
      included_system_ids: ACCEPTED_IDS,
      accepted_preflight_action: 'watch.system_radius_authoring_preflight.preview',
      accepted_preflight_status: 'acceptable',
      included_system_ids_source: 'accepted_preflight_included_system_ids',
      lookbackSeconds: 172800,
      maxSystems: 5,
      maxExpansions: 3,
      pollIntervalMinutes: 45,
      isActive: false,
      notes: 'accepted scope contract fixture'
    }, { db, source: 'trusted-main' });
    const afterCreate = sideEffectCounts(db);

    verifyCommandPosture();
    verifyAcceptedCreateResult(created);
    verifyStoredRow(db, created.watch.watch_id);
    verifyAuthoringOnlyMutation(before, afterCreate, 1);

    await assertRejects(
      () => invokeServiceCommand('watch.create', {
        watchType: 'system_radius',
        centerSystemId: 30003597,
        radiusJumps: 1,
        require_accepted_included_system_ids: true
      }, { db, source: 'trusted-main' }),
      'requires acceptedIncludedSystemIds array',
      'missing accepted IDs should fail'
    );
    await assertRejects(
      () => invokeServiceCommand('watch.create', {
        watchType: 'system_radius',
        centerSystemId: 30003597,
        radiusJumps: 1,
        included_system_ids: [],
        accepted_preflight_status: 'acceptable'
      }, { db, source: 'trusted-main' }),
      'non-empty accepted included_system_ids',
      'empty accepted IDs should fail'
    );
    await assertRejects(
      () => invokeServiceCommand('watch.create', {
        watchType: 'system_radius',
        centerSystemId: 30003597,
        radiusJumps: 1,
        included_system_ids: '30003597',
        accepted_preflight_status: 'acceptable'
      }, { db, source: 'trusted-main' }),
      'requires acceptedIncludedSystemIds array',
      'malformed accepted IDs should fail'
    );
    await assertRejects(
      () => invokeServiceCommand('watch.create', {
        watchType: 'system_radius',
        centerSystemId: 30003597,
        radiusJumps: 1,
        included_system_ids: [30003597, 30003601],
        accepted_preflight_status: 'acceptable'
      }, { db, source: 'trusted-main' }),
      'does not match current local topology',
      'mismatched accepted IDs should fail'
    );
    await assertRejects(
      () => invokeServiceCommand('watch.create', {
        watchType: 'system_radius',
        centerSystemId: 30003597,
        radiusJumps: 1,
        included_system_ids: ACCEPTED_IDS,
        accepted_preflight_status: 'capped_scope_not_acceptable_without_adjustment'
      }, { db, source: 'trusted-main' }),
      'not acceptable',
      'capped/not-acceptable preflight status should fail'
    );
    await assertRejects(
      () => invokeServiceCommand('watch.create', {
        watchType: 'system_radius',
        centerSystemId: 99999999,
        radiusJumps: 1,
        included_system_ids: ACCEPTED_IDS,
        accepted_preflight_status: 'acceptable'
      }, { db, source: 'trusted-main' }),
      'No system found',
      'unknown/invalid center should fail before writing'
    );
    await assertRejects(
      () => invokeServiceCommand('watch.create', {
        watchType: 'system_radius',
        centerSystemId: 30003597,
        radiusJumps: -1,
        included_system_ids: ACCEPTED_IDS,
        accepted_preflight_status: 'acceptable'
      }, { db, source: 'trusted-main' }),
      'radiusJumps',
      'invalid radius should fail before writing'
    );

    const afterRejects = sideEffectCounts(db);
    verifyAuthoringOnlyMutation(before, afterRejects, 1);

    const legacy = await invokeServiceCommand('watch.create', {
      watchType: 'system_radius',
      centerSystemId: 30003597,
      radiusJumps: 0,
      lookbackSeconds: 86400,
      maxSystems: 1,
      maxExpansions: 2,
      notes: 'legacy direct center-radius fixture'
    }, { db, source: 'trusted-main' });
    assert(legacy.scope_authority.source === 'legacy_center_radius_authoring', 'legacy direct authoring should remain separate');
    assert(legacy.scope_authority.topology_recomputed_for_storage === true, 'legacy direct authoring may still compute topology scope');

    const afterLegacy = sideEffectCounts(db);
    verifyAuthoringOnlyMutation(before, afterLegacy, 2);

    console.log(JSON.stringify({
      status: 'watch.create accepted scope contract verified',
      created_scope_authority: created.scope_authority,
      stored_row: {
        watch_id: created.watch.watch_id,
        center_system_id: created.watch.center_system_id,
        radius_jumps: created.watch.radius_jumps,
        included_system_ids: JSON.parse(created.watch.included_system_ids),
        lookback_hours: created.watch.lookback_hours,
        max_systems_per_run: created.watch.max_systems_per_run,
        max_killmails_per_run: created.watch.max_killmails_per_run,
        is_active: created.watch.is_active,
        poll_interval_minutes: created.watch.poll_interval_minutes
      },
      rejected_cases: [
        'missing accepted IDs',
        'empty accepted IDs',
        'malformed accepted IDs',
        'mismatched accepted IDs',
        'capped/not acceptable status',
        'unknown center',
        'invalid radius'
      ],
      legacy_direct_authoring: legacy.scope_authority,
      mutation_check: {
        before,
        after: afterLegacy,
        only_system_watches_changed: onlySystemWatchesChanged(before, afterLegacy, 2)
      }
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('watch.create accepted scope contract verified');
}

function verifyCommandPosture() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.create');
  assert(command?.classification === 'metadata-only', 'watch.create should remain metadata-only');
  assert(command.effects.includes('local-data-mutation'), 'watch.create should remain local data mutation only');
}

function verifyAcceptedCreateResult(created) {
  assert(created.watch_type === 'system_radius', 'created row should be a system/radius Watch');
  assert(created.scope_authority.source === 'accepted_preflight_included_system_ids', 'accepted IDs should be stored-scope authority');
  assert(created.scope_authority.center_radius_role === 'provenance_and_management', 'center/radius should be provenance/management');
  assert(created.scope_authority.topology_recomputed_for_storage === false, 'accepted scope should not be replaced by recomputed topology for storage');
  assertSame(created.scope_authority.included_system_ids, ACCEPTED_IDS, 'scope authority should preserve accepted IDs exactly');
}

function verifyStoredRow(db, watchId) {
  const row = db.prepare('SELECT * FROM system_watches WHERE watch_id = ?').get(watchId);
  assert(row, 'system Watch row should be written');
  assert(row.center_system_id === 30003597, 'center system ID should be stored as provenance/management');
  assert(row.center_system_name === 'Hare', 'center system name should be stored');
  assert(row.radius_jumps === 1, 'radius should be stored as provenance/management');
  assertSame(JSON.parse(row.included_system_ids), ACCEPTED_IDS, 'stored included IDs should match accepted list exactly');
  assert(row.lookback_hours === 48, 'lookback setting should be preserved');
  assert(row.max_systems_per_run === 5, 'max systems setting should be preserved');
  assert(row.max_killmails_per_run === 3, 'max killmails setting should be preserved');
  assert(row.is_active === 0, 'active flag should be preserved');
  assert(row.poll_interval_minutes === 45, 'poll interval should be preserved');
  assert(row.notes === 'accepted scope contract fixture', 'notes should be preserved');
}

function verifyAuthoringOnlyMutation(before, after, expectedSystemWatches) {
  assert(onlySystemWatchesChanged(before, after, expectedSystemWatches), 'only system_watches should change during Watch authoring');
}

function onlySystemWatchesChanged(before, after, expectedSystemWatches) {
  return Object.entries(before).every(([key, value]) => {
    if (key === 'system_watches') {
      return after[key] === value + expectedSystemWatches;
    }
    return after[key] === value;
  });
}

function seedTopology(db) {
  for (const [systemId, name] of [
    [30003597, 'Hare'],
    [30003601, 'Babirmoult'],
    [30003599, 'Heluene'],
    [30003598, 'Ogaria'],
    [30003596, 'Oruse']
  ]) {
    db.prepare(`
      INSERT INTO solar_systems (
        solar_system_id, solar_system_name, constellation_id, constellation_name,
        region_id, region_name, security_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(systemId, name, 20000440, 'Elerelle', 10000048, 'Solitude', 0.2);
  }
  for (const neighbor of [30003601, 30003599, 30003598, 30003596]) {
    db.prepare('INSERT INTO system_adjacency (from_system_id, to_system_id, connection_type) VALUES (?, ?, ?)')
      .run(30003597, neighbor, 'stargate');
    db.prepare('INSERT INTO system_adjacency (from_system_id, to_system_id, connection_type) VALUES (?, ?, ?)')
      .run(neighbor, 30003597, 'stargate');
  }
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
    ingestion_audits: count(db, 'ingestion_audits'),
    assessment_artifacts: count(db, 'assessment_artifacts'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches')
  };
}

function count(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count || 0);
}

async function assertRejects(fn, expectedMessagePart, message) {
  try {
    await fn();
  } catch (error) {
    if (!String(error.message || '').includes(expectedMessagePart)) {
      throw new Error(`${message}: expected error to include "${expectedMessagePart}", got "${error.message}"`);
    }
    return;
  }
  throw new Error(`${message}: expected rejection`);
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
