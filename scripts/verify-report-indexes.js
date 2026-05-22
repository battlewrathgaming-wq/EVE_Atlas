const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');

function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedSyntheticRows(db);
    assertPlanUses(db, `
      SELECT COUNT(*) AS count
      FROM activity_events
      WHERE entity_type = ? AND entity_id = ? AND killmail_time >= ?
    `, ['character', 90001000, '2026-05-22T00:00:00.000Z'], 'idx_activity_events_entity_time');

    assertPlanUses(db, `
      SELECT COUNT(*) AS count
      FROM activity_events
      WHERE solar_system_id = ? AND killmail_time >= ?
    `, [30004660, '2026-05-22T00:00:00.000Z'], 'idx_activity_events_system_time');

    assertPlanUses(db, `
      SELECT COUNT(*) AS count
      FROM activity_events
      WHERE corporation_id = ? AND killmail_time >= ?
    `, [98000001, '2026-05-22T00:00:00.000Z'], 'idx_activity_events_corporation_time');

    assertPlanUses(db, `
      SELECT COUNT(*) AS count
      FROM activity_events
      WHERE alliance_id = ? AND killmail_time >= ?
    `, [99000001, '2026-05-22T00:00:00.000Z'], 'idx_activity_events_alliance_time');

    assertPlanUses(db, `
      SELECT COUNT(*) AS count
      FROM activity_events
      WHERE killmail_id = ? AND role = ?
    `, [70000001, 'attacker'], 'idx_activity_events_killmail_role');

    assertPlanUses(db, `
      SELECT COUNT(*) AS count
      FROM killmails
      WHERE solar_system_id = ? AND killmail_time >= ?
    `, [30004660, '2026-05-22T00:00:00.000Z'], 'idx_killmails_system_time');

    assertPlanUses(db, `
      SELECT *
      FROM discovered_killmail_refs
      WHERE discovered_by_type = ? AND discovered_by_id = ? AND status IN ('pending', 'failed')
      ORDER BY status = 'failed', priority ASC, discovered_at ASC, killmail_id ASC
      LIMIT 20
    `, ['manual_actor', 'character:90001000'], 'idx_discovered_refs_scope_status_priority_time');

    assertPlanUses(db, `
      SELECT *
      FROM discovered_killmail_refs
      WHERE discovered_by_type = ? AND discovered_by_id = ?
      ORDER BY last_seen_at DESC, discovered_at DESC, killmail_id DESC
      LIMIT 20
    `, ['manual_actor', 'character:90001000'], 'idx_discovered_refs_scope_last_seen');

    assertPlanUses(db, `
      SELECT provider, COUNT(*) AS count
      FROM api_request_logs
      WHERE run_id = ? AND provider = ?
      GROUP BY provider
    `, ['run_1', 'esi'], 'idx_api_request_logs_run_provider_requested');

    assertPlanUses(db, `
      SELECT *
      FROM data_quality_warnings
      WHERE run_id = ? AND killmail_id = ?
    `, ['run_1', 70000001], 'idx_data_quality_warnings_run_killmail');

    assertReportQueriesStillReturnRows(db);
  } finally {
    closeDatabase(db);
  }

  console.log('report performance indexes verified');
}

function seedSyntheticRows(db) {
  db.prepare(`
    INSERT INTO fetch_runs (
      run_id, trigger, watch_type, watch_id, started_at, finished_at, status,
      discovered_refs, already_cached, expanded_new, failed_expansions,
      activity_events_written, api_calls_zkill, api_calls_esi, duration_ms,
      error_summary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'run_1',
    'fixture_test',
    'manual_scan',
    'report-indexes',
    '2026-05-22T00:00:00.000Z',
    '2026-05-22T00:01:00.000Z',
    'succeeded',
    240,
    0,
    240,
    0,
    480,
    1,
    240,
    60000,
    null
  );

  const insertKillmail = db.prepare(`
    INSERT INTO killmails (
      killmail_id, killmail_hash, killmail_time, solar_system_id,
      raw_esi_payload, raw_payload_checksum, source,
      first_seen_at, last_seen_at, ingested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertEvent = db.prepare(`
    INSERT INTO activity_events (
      event_key, killmail_id, role, entity_type, entity_id, entity_name,
      character_id, character_name, corporation_id, corporation_name,
      alliance_id, alliance_name, ship_type_id, ship_type_name, weapon_type_id,
      final_blow, damage_done, solar_system_id, solar_system_name,
      region_id, region_name, killmail_time, ingested_at,
      discovered_by_type, discovered_by_id, normalizer_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertRef = db.prepare(`
    INSERT INTO discovered_killmail_refs (
      killmail_id, killmail_hash, discovered_by_type, discovered_by_id,
      source_scope, source_system_id, source_actor_type, source_actor_id,
      discovered_at, first_seen_run_id, last_seen_run_id, last_seen_at,
      status, priority, preview_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertApiLog = db.prepare(`
    INSERT INTO api_request_logs (
      request_id, run_id, run_type, provider, endpoint, method,
      status_code, duration_ms, cache_status, retry_count,
      rate_limited, error_message, requested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertWarning = db.prepare(`
    INSERT INTO data_quality_warnings (
      warning_id, run_id, killmail_id, warning_type, message, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < 240; i += 1) {
    const killmailId = 70000000 + i;
    const time = `2026-05-22T${String(i % 24).padStart(2, '0')}:00:00.000Z`;
    const systemId = i % 3 === 0 ? 30004660 : 30004661;
    const characterId = 90001000 + (i % 20);
    const corporationId = 98000001 + (i % 8);
    const allianceId = 99000001 + (i % 4);

    insertKillmail.run(
      killmailId,
      `hash_${killmailId}`,
      time,
      systemId,
      JSON.stringify({ killmail_id: killmailId }),
      `checksum_${killmailId}`,
      'fixture',
      time,
      time,
      time
    );

    insertEvent.run(
      `${killmailId}:attacker:character:${characterId}`,
      killmailId,
      'attacker',
      'character',
      characterId,
      `Pilot ${characterId}`,
      characterId,
      `Pilot ${characterId}`,
      corporationId,
      `Corp ${corporationId}`,
      allianceId,
      `Alliance ${allianceId}`,
      587,
      'Rifter',
      null,
      i % 5 === 0 ? 1 : 0,
      100 + i,
      systemId,
      systemId === 30004660 ? 'ZTS-4D' : 'Neighbor',
      10000058,
      'Fountain',
      time,
      time,
      'fixture',
      1,
      'verify'
    );

    insertEvent.run(
      `${killmailId}:victim:corporation:${corporationId}`,
      killmailId,
      'victim',
      'corporation',
      corporationId,
      `Corp ${corporationId}`,
      null,
      null,
      corporationId,
      `Corp ${corporationId}`,
      allianceId,
      `Alliance ${allianceId}`,
      643,
      'Armageddon',
      null,
      0,
      null,
      systemId,
      systemId === 30004660 ? 'ZTS-4D' : 'Neighbor',
      10000058,
      'Fountain',
      time,
      time,
      'fixture',
      1,
      'verify'
    );

    insertRef.run(
      killmailId,
      `hash_${killmailId}`,
      'manual_actor',
      'character:90001000',
      'manual actor character:90001000',
      null,
      'character',
      90001000,
      time,
      'run_1',
      'run_1',
      time,
      i % 7 === 0 ? 'failed' : 'pending',
      i % 5,
      JSON.stringify({ killmail_time: time, attacker_count: 2 })
    );

    insertApiLog.run(
      `request_${i}`,
      'run_1',
      'collection',
      i % 2 === 0 ? 'esi' : 'zkill',
      `/fixture/${i}`,
      'GET',
      200,
      20,
      'miss',
      0,
      0,
      null,
      time
    );
  }

  insertWarning.run(
    'warning_1',
    'run_1',
    70000001,
    'MISSING_ATTACKER_CHARACTER_ID',
    'Fixture warning',
    '2026-05-22T00:00:00.000Z'
  );
}

function assertReportQueriesStillReturnRows(db) {
  const entityRows = db.prepare(`
    SELECT COUNT(*) AS count
    FROM activity_events
    WHERE entity_type = ? AND entity_id = ? AND killmail_time >= ?
  `).get('character', 90001000, '2026-05-22T00:00:00.000Z');
  assert(entityRows.count > 0, 'synthetic actor scope query should return rows');

  const queueRows = db.prepare(`
    SELECT COUNT(*) AS count
    FROM discovered_killmail_refs
    WHERE discovered_by_type = ? AND discovered_by_id = ? AND status = ?
  `).get('manual_actor', 'character:90001000', 'pending');
  assert(queueRows.count > 0, 'synthetic queue scope query should return rows');
}

function assertPlanUses(db, sql, params, indexName) {
  const plan = planText(db, sql, params);
  if (!plan.includes(indexName)) {
    throw new Error(`Expected query plan to use ${indexName}, got: ${plan}`);
  }
}

function planText(db, sql, params = []) {
  return db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...params)
    .map((row) => row.detail)
    .join(' | ');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main();
