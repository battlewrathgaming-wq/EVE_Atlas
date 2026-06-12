const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

const NOW = '2026-06-12T12:00:00.000Z';

async function main() {
  verifyRegistrationAndCoverage();

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    verifySchema(db);
    insertSystemWatches(db);

    const beforeFirst = sideEffectCounts(db);
    const first = await invokeServiceCommand('watch.bucket_product_persistence.emit', {
      now: NOW,
      externalIoState: 'off'
    }, {
      db,
      trusted: true
    });
    const afterFirst = sideEffectCounts(db);
    verifyBoundary(first, 'first emission');
    verifyFirstEmission(first);
    assert(afterFirst.watch_bucket_items - beforeFirst.watch_bucket_items === 5, 'first emission should insert five bucket rows');
    assertOnlyBucketChanged(afterFirst, beforeFirst, 'first emission');

    const beforeSecond = sideEffectCounts(db);
    const second = await invokeServiceCommand('watch.bucket_product_persistence.emit', {
      now: NOW,
      externalIoState: 'off'
    }, {
      db,
      trusted: true
    });
    const afterSecond = sideEffectCounts(db);
    verifyBoundary(second, 'second emission');
    verifyIdempotent(second);
    assertSame(afterSecond, beforeSecond, 'second emission should be restart-safe/idempotent');

    db.prepare('UPDATE system_watches SET included_system_ids = ? WHERE watch_id = ?').run(JSON.stringify([30003601]), 1);
    const beforeConflict = sideEffectCounts(db);
    const conflict = await invokeServiceCommand('watch.bucket_product_persistence.emit', {
      now: NOW,
      externalIoState: 'on'
    }, {
      db,
      trusted: true
    });
    const afterConflict = sideEffectCounts(db);
    verifyBoundary(conflict, 'conflict emission');
    assert(conflict.summary.integrity_conflict_count === 1, 'same Watch with mismatched open identity should produce one integrity conflict');
    assert(conflict.persistence_results.some((row) => row.persistence_result === 'integrity_conflict_existing_open_bucket_item'), 'conflict result should be present');
    assertSame(afterConflict, beforeConflict, 'integrity conflict should not write another bucket row');

    const beforeRunMismatch = sideEffectCounts(db);
    const runMismatch = await invokeServiceCommand('watch.bucket_product_persistence.emit', {
      now: NOW,
      trustedLocalEmissionBasis: [
        trustedBasis(30, 'trusted-run-mismatch-001', [30003597, 30003599]),
        trustedBasis(30, 'trusted-run-mismatch-001', [30003597, 30003601])
      ]
    }, {
      db,
      trusted: true
    });
    const afterRunMismatch = sideEffectCounts(db);
    verifyBoundary(runMismatch, 'watch_run_id mismatch');
    assert(runMismatch.summary.inserted_open_bucket_item_count === 1, 'trusted mismatch fixture should insert the first trusted basis');
    assert(runMismatch.summary.integrity_error_count === 1, 'same watch_run_id mismatched identity should produce integrity error');
    assert(runMismatch.persistence_results.some((row) => row.persistence_result === 'integrity_error_watch_run_id_mismatch'), 'watch_run_id mismatch result should be present');
    assert(afterRunMismatch.watch_bucket_items - beforeRunMismatch.watch_bucket_items === 1, 'watch_run_id mismatch should only insert the first trusted basis');

    await assertTrustedActorBasisRejected(db);
    await assertRendererCannotForgeRows(db);

    console.log(JSON.stringify({
      status: 'Watch bucket product persistence verified',
      command: 'watch.bucket_product_persistence.emit',
      first_summary: first.summary,
      idempotent_summary: second.summary,
      conflict_summary: conflict.summary,
      watch_run_id_mismatch_summary: runMismatch.summary,
      sample_open_bucket_item: first.open_bucket_items[0],
      sample_idempotent_result: second.persistence_results[0],
      sample_conflict_result: conflict.persistence_results.find((row) => row.persistence_result === 'integrity_conflict_existing_open_bucket_item'),
      sample_integrity_error_result: runMismatch.persistence_results.find((row) => row.persistence_result === 'integrity_error_watch_run_id_mismatch'),
      sample_overlap: first.overlapping_open_items[0],
      boundary_table_check: first.boundary_table_check
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('Watch bucket product persistence verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.bucket_product_persistence.emit');
  assert(command, 'Watch bucket product persistence command should be registered');
  assert(command.classification === 'metadata-only', 'Watch bucket product persistence should be metadata-only/local mutation');
  assert(command.effects.includes('local-data-mutation'), 'Watch bucket product persistence should declare local mutation effect');
  assert(command.renderer_allowed === false, 'Watch bucket product persistence should not be renderer eligible');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'watch.bucket_product_persistence.emit');
  assert(row?.storage_action_class === 'setup_config_changes', 'bucket persistence should be local mutation class');
  assert(row?.runtime_context === 'watch_bucket_product_persistence', 'bucket persistence should have runtime context');
  assert(row?.external_io_dependency === 'none', 'bucket persistence should not depend on External I/O');
  assert(row?.enforcement_status === 'covered_local_mutation', 'bucket persistence should be covered local mutation');
}

function verifySchema(db) {
  assert(tableExists(db, 'watch_bucket_items'), 'watch_bucket_items table should exist');
  for (const column of [
    'bucket_item_id',
    'watch_run_id',
    'watch_type',
    'watch_id',
    'source_kind',
    'status',
    'accepted_scope_json',
    'window_json',
    'caps_json',
    'provenance_json',
    'identity_fingerprint',
    'pickup_posture',
    'receipt_summary_json',
    'provider_timing_json'
  ]) {
    assert(columnExists(db, 'watch_bucket_items', column), `watch_bucket_items.${column} should exist`);
  }
  assert(indexExists(db, 'idx_watch_bucket_items_one_open_per_watch'), 'one-open-per-Watch partial index should exist');
}

function verifyBoundary(proof, label) {
  assert(proof.action === 'watch.bucket_product_persistence.emit', `${label} should name action`);
  assert(proof.product_persistence === true, `${label} should be product persistence`);
  assert(proof.system_radius_only === true, `${label} should be system/radius only`);
  assert(proof.actor_watch_migration === false, `${label} should not migrate actor Watch`);
  assert(proof.trusted_local_service_only === true, `${label} should be trusted local service only`);
  assert(proof.renderer_eligible === false, `${label} should not be renderer eligible`);
  assert(proof.external_io_posture.bucket_row_creation_blocked === false, `${label} should not block bucket creation on External I/O`);
  assert(proof.external_io_posture.held_by_external_io_persisted_as_bucket_status === false, `${label} should not persist held_by_external_io as bucket status`);
  assert(proof.provider_calls === 0, `${label} should not call providers`);
  assert(proof.live_api_calls === 0, `${label} should not call live APIs`);
  assert(proof.zkill_calls === 0, `${label} should not call zKill`);
  assert(proof.esi_calls === 0, `${label} should not call ESI`);
  assert(proof.provider_packets === 0, `${label} should not create provider packets`);
  assert(proof.discovery_pickup_started === false, `${label} should not start Discovery pickup`);
  assert(proof.discovery_pickup_packets_created === 0, `${label} should not create Discovery pickup packets`);
  assert(proof.leases_created === 0, `${label} should not create leases`);
  assert(proof.queue_items_created === 0, `${label} should not create queue items`);
  assert(proof.dispatcher_queue_lease_behavior === false, `${label} should not implement dispatcher/queue/lease`);
  assert(proof.candidate_refs_written === 0, `${label} should not write candidate refs`);
  assert(proof.discovered_killmail_refs_written === 0, `${label} should not write discovered refs`);
  assert(proof.discovery_refs_mutated === 0, `${label} should not mutate Discovery refs`);
  assert(proof.evidence_writes === 0, `${label} should not write Evidence/EVEidence`);
  assert(proof.hydration_writes === 0, `${label} should not write Hydration`);
  assert(proof.observation_created === false, `${label} should not create Observation`);
  assert(proof.api_request_log_writes === 0, `${label} should not write API logs`);
  assert(proof.watch_mutations === 0, `${label} should not mutate Watch rows`);
  assert(proof.cadence_mutations === 0, `${label} should not mutate Watch cadence`);
  assert(proof.fetch_runs_as_bucket_state === false, `${label} should not use fetch_runs as bucket state`);
  assert(proof.discovered_killmail_refs_as_bucket_state === false, `${label} should not use discovered refs as bucket state`);
  assert(proof.runtime_enforcement_active === false, `${label} should not activate enforcement`);
  assert(proof.command_blocking_active === false, `${label} should not activate command blocking`);
  assert(proof.ui_work === false, `${label} should not do UI work`);
}

function verifyFirstEmission(proof) {
  assert(proof.external_io_posture.state === 'off', 'first proof should run with External I/O off');
  assert(proof.summary.emission_basis_count === 5, 'first emission should derive five valid due system/radius bases');
  assert(proof.summary.inserted_open_bucket_item_count === 5, 'first emission should insert five open bucket items');
  assert(proof.summary.open_bucket_item_count === 5, 'first emission should leave five open items');
  assert(proof.summary.stale_current_open_item_count === 1, 'stale missed intervals should collapse to one current open item');
  assert(proof.summary.catch_up_rows_created === 0, 'stale missed intervals should create no catch-up rows');
  assert(proof.summary.overlapping_open_item_pairs > 0, 'overlapping Watches should coexist');
  assert(proof.summary.provider_packets === 0, 'first emission should create zero provider packets');
  assert(proof.boundary_table_check.only_watch_bucket_items_changed === true, 'only bucket table should change');
  for (const item of proof.open_bucket_items) {
    assert(item.status === 'open', 'created item should be open');
    assert(item.watch_type === 'system_radius', 'created item should be system/radius');
    assert(item.accepted_scope.execution_authority === 'stored_included_system_ids', 'accepted scope should come from stored included systems');
    assert(item.accepted_scope.center_radius_used_as_execution_authority === false, 'center/radius should not be execution authority');
    assert(item.pickup_posture === null, 'bucket row should not persist held_by_external_io');
  }
}

function verifyIdempotent(proof) {
  assert(proof.summary.emission_basis_count === 5, 'second emission should rederive five bases');
  assert(proof.summary.inserted_open_bucket_item_count === 0, 'second emission should insert no new rows');
  assert(proof.summary.idempotent_existing_open_count === 5, 'second emission should suppress five duplicates');
  assert(proof.summary.open_bucket_item_count === 5, 'second emission should keep five open rows');
  assert(proof.summary.watch_bucket_items_delta === 0, 'second emission should not change bucket row count');
}

async function assertRendererCannotForgeRows(db) {
  const before = sideEffectCounts(db);
  let rejected = false;
  try {
    await invokeServiceCommand('watch.bucket_product_persistence.emit', {
      trustedLocalEmissionBasis: [trustedBasis(99, 'renderer-forged-run', [30003597])]
    }, {
      db,
      source: 'renderer'
    });
  } catch (error) {
    rejected = error.code === 'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE';
  }
  const after = sideEffectCounts(db);
  assert(rejected, 'renderer should not be able to call bucket product persistence');
  assertSame(after, before, 'renderer rejection should not mutate bucket or product tables');
}

async function assertTrustedActorBasisRejected(db) {
  const before = sideEffectCounts(db);
  let rejected = false;
  try {
    await invokeServiceCommand('watch.bucket_product_persistence.emit', {
      trustedLocalEmissionBasis: [{
        ...trustedBasis(199, 'trusted-actor-run', [30003597]),
        watch_type: 'actor',
        source_kind: 'watch_actor'
      }]
    }, {
      db,
      trusted: true
    });
  } catch (error) {
    rejected = error.message === 'watch_bucket_product_persistence_supports_system_radius_only';
  }
  const after = sideEffectCounts(db);
  assert(rejected, 'trusted actor bucket basis should remain parked/rejected in HS482');
  assertSame(after, before, 'trusted actor rejection should not mutate bucket or product tables');
}

function insertSystemWatches(db) {
  insertSystemWatch(db, { watchId: 1, includedSystemIds: [30003597, 30003599] });
  insertSystemWatch(db, { watchId: 3, includedSystemIds: [30003597, 30003601], nextPollAt: '2026-06-11T12:00:00.000Z' });
  insertSystemWatch(db, { watchId: 4, includedSystemIds: [30003597, 30003599] });
  insertSystemWatch(db, { watchId: 5, includedSystemIds: [30003599, 30003601] });
  insertSystemWatch(db, { watchId: 9, includedSystemIds: [30003597, 30003599] });
  insertSystemWatch(db, { watchId: 10, includedSystemIds: [30003597, 'bad'] });
  insertSystemWatch(db, { watchId: 11, includedSystemIds: [30003597], nextPollAt: '2026-06-13T12:00:00.000Z' });
  insertSystemWatch(db, { watchId: 12, includedSystemIds: [30003597], isActive: 0 });
  insertSystemWatch(db, { watchId: 13, includedSystemIds: [30003597], backoffUntil: '2026-06-12T13:00:00.000Z' });
}

function insertSystemWatch(db, input = {}) {
  db.prepare(`
    INSERT INTO system_watches (
      watch_id, center_system_id, center_system_name, radius_jumps,
      included_system_ids, excluded_system_ids,
      lookback_hours, max_systems_per_run, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.watchId,
    30003597,
    'Hare',
    1,
    JSON.stringify(input.includedSystemIds),
    '[]',
    24,
    35,
    8,
    input.isActive ?? 1,
    45,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS482 product bucket verifier'
  );
}

function trustedBasis(watchId, watchRunId, includedSystemIds) {
  return {
    watch_type: 'system_radius',
    watch_id: watchId,
    watch_run_id: watchRunId,
    source_kind: 'watch_system_radius',
    accepted_scope: {
      execution_authority: 'stored_included_system_ids',
      included_system_ids: includedSystemIds,
      center_system_id: 30003597,
      center_system_name: 'Hare',
      radius_jumps: 1,
      center_radius_is_provenance_only: true,
      center_radius_used_as_execution_authority: false
    },
    window: {
      lookback_seconds: 86400,
      due_at: NOW,
      emitted_at: NOW
    },
    caps: {
      max_systems: includedSystemIds.length,
      max_refs_per_system: 4,
      max_expansions: 8
    },
    provenance: {
      source_action: 'watch.bucket_product_persistence.emit',
      source_intent: 'Watch/system-radius',
      scope_provenance: 'trusted_fixture_basis',
      watch_scope_key: `trusted:${watchId}`,
      center_radius_role: 'provenance_and_explanation'
    }
  };
}

function sideEffectCounts(db) {
  return {
    watch_bucket_items: count(db, 'watch_bucket_items'),
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

function assertOnlyBucketChanged(actual, expected, label) {
  for (const [name, value] of Object.entries(actual)) {
    const expectedValue = expected[name];
    const delta = value - expectedValue;
    if (name === 'watch_bucket_items') {
      assert(delta >= 0, `${label} should not delete bucket rows`);
    } else {
      assert(delta === 0, `${label} should not mutate ${name}`);
    }
  }
}

function tableExists(db, tableName) {
  return Boolean(db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name = ?
  `).get(tableName));
}

function columnExists(db, tableName, columnName) {
  return db.prepare(`PRAGMA table_info(${tableName})`)
    .all()
    .some((column) => column.name === columnName);
}

function indexExists(db, indexName) {
  return Boolean(db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'index' AND name = ?
  `).get(indexName));
}

function count(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count || 0);
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
