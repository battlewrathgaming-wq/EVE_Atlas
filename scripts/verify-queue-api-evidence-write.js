const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { buildQueueExpansionSelection } = require('../src/main/services/queueSelectionService');
const { expandManualRefs } = require('../src/main/workers/manualExpansionWorker');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');

async function main() {
  await verifyCachedAndRepeatedSelectionBoundary();
  await verifyPartialFailureRetryAndProvenance();
  console.log('queue API/evidence write boundary verified');
}

async function verifyCachedAndRepeatedSelectionBoundary() {
  const db = openDatabase(':memory:');
  migrate(db);
  seedTopology(db);

  try {
    const repository = new EvidenceRepository(db);
    seedAcceptedEvidence(db, 9100, 'hash_9100');
    seedQueue(repository, [
      { killmail_id: 9100, hash: 'hash_9100', discovered_at: '2026-05-23T10:00:00Z' },
      { killmail_id: 9101, hash: 'hash_9101', discovered_at: '2026-05-23T10:01:00Z' }
    ]);

    assert(queueStatus(db, 9100) === 'cached', 'already accepted evidence should make rediscovered queue ref cached');
    assert(count(db, 'killmails') === 1, 'queued discovery refs must not create evidence before expansion');

    const selection = buildQueueExpansionSelection(db, {
      discoveredByType: 'manual_actor',
      discoveredById: 'character:90000002',
      mode: 'selected',
      killmailIds: [9100, 9101],
      maxExpansions: 2
    });
    assert(selection.counts.selected_for_expansion === 1, 'selected preview should exclude cached refs from expansion');
    assert(selection.counts.expected_esi_calls === 1, 'cached refs should not count as expected ESI calls');
    assert(selection.refs.some((ref) => ref.killmail_id === 9100 && ref.skip_reason === 'cached'), 'cached selected ref should be explained');
    assert(selection.refs.every((ref) => ref.preview_is_evidence === false), 'queue preview rows should remain non-evidence');

    const esiCalls = [];
    const expansion = await expandManualRefs({
      discoveredByType: 'manual_actor',
      discoveredById: 'character:90000002',
      killmailIds: [9100, 9101],
      maxExpansions: 2,
      trigger: 'fixture_boundary'
    }, {
      db,
      repository,
      esiClient: loggingEsiClient(db, repository, esiCalls)
    });

    assertSame(esiCalls, [9101], 'manual expansion should spend ESI only on uncached selected refs');
    assert(expansion.new_esi_expansions === 1, 'uncached selected ref should expand once');
    assert(expansion.api_calls_esi === 1, 'fetch run result should count only the uncached ESI request');
    assert(queueStatus(db, 9100) === 'cached', 'cached ref should remain cached');
    assert(queueStatus(db, 9101) === 'expanded', 'expanded ref should be marked expanded');
    assert(count(db, 'killmails') === 2, 'one new expanded killmail should be persisted');
    assert(count(db, 'ingestion_audits') === 2, 'accepted and newly expanded ESI evidence should have audits');

    const countsAfterFirstExpansion = evidenceCounts(db);
    esiCalls.length = 0;
    const repeated = await expandManualRefs({
      discoveredByType: 'manual_actor',
      discoveredById: 'character:90000002',
      killmailIds: [9101],
      maxExpansions: 1,
      trigger: 'fixture_boundary_repeat'
    }, {
      db,
      repository,
      esiClient: loggingEsiClient(db, repository, esiCalls)
    });

    assertSame(esiCalls, [], 'repeated selection of expanded ref should not spend ESI');
    assert(repeated.candidates_considered === 0, 'expanded refs should not be selected as retry candidates');
    assertSame(evidenceCounts(db), countsAfterFirstExpansion, 'repeated selection should not double-create evidence rows');
  } finally {
    closeDatabase(db);
  }
}

async function verifyPartialFailureRetryAndProvenance() {
  const db = openDatabase(':memory:');
  migrate(db);
  seedTopology(db);

  try {
    const repository = new EvidenceRepository(db);
    seedQueue(repository, [
      { killmail_id: 9201, hash: 'hash_9201', discovered_at: '2026-05-23T11:00:00Z' },
      { killmail_id: 9202, hash: 'hash_9202', discovered_at: '2026-05-23T11:01:00Z' }
    ]);
    assert(count(db, 'killmails') === 0, 'fresh queued discovery refs should not be evidence');

    const firstCalls = [];
    const first = await expandManualRefs({
      discoveredByType: 'manual_actor',
      discoveredById: 'character:90000002',
      killmailIds: [9201, 9202],
      maxExpansions: 2,
      trigger: 'fixture_boundary_partial'
    }, {
      db,
      repository,
      esiClient: loggingEsiClient(db, repository, firstCalls, { failKillmailId: 9202 })
    });

    assertSame(firstCalls, [9201, 9202], 'partial run should attempt both selected uncached refs');
    assert(first.new_esi_expansions === 1, 'partial run should persist successful expansion');
    assert(first.failed_expansions === 1, 'partial run should record failed ESI expansion');
    assert(first.api_calls_esi === 2, 'partial run should retain scoped ESI API count');
    assert(queueStatus(db, 9201) === 'expanded', 'successful partial ref should become expanded');
    assert(queueStatus(db, 9202) === 'failed', 'failed partial ref should stay reviewable as failed');
    assert(count(db, 'killmails') === 1, 'partial run should persist only successful ESI evidence');
    assert(count(db, 'ingestion_audits') === 1, 'partial run should audit only successful ESI evidence');

    const partialRun = latestFetchRun(db);
    assert(partialRun.status === 'success', 'partial ESI failure should finalize run with warning state');
    assert(partialRun.expanded_new === 1, 'partial fetch run should record successful expansion count');
    assert(partialRun.failed_expansions === 1, 'partial fetch run should record failed expansion count');
    assert(String(partialRun.error_summary || '').includes('fixture ESI failure for 9202'), 'partial fetch run should preserve failure summary');
    assert(apiLogsForRun(db, partialRun.run_id).length === 2, 'partial run should have reconstructable ESI API logs');
    assert(ingestionAuditsForRun(db, partialRun.run_id).length === 1, 'partial run should have audit row for accepted ESI evidence');

    const retryCalls = [];
    const retry = await expandManualRefs({
      discoveredByType: 'manual_actor',
      discoveredById: 'character:90000002',
      killmailIds: [9202],
      maxExpansions: 1,
      trigger: 'fixture_boundary_retry'
    }, {
      db,
      repository,
      esiClient: loggingEsiClient(db, repository, retryCalls)
    });

    assertSame(retryCalls, [9202], 'retry should pick up only unresolved failed ref');
    assert(retry.new_esi_expansions === 1, 'retry should persist previously failed ref');
    assert(queueStatus(db, 9202) === 'expanded', 'retry should mark failed ref expanded after success');
    assert(count(db, 'killmails') === 2, 'retry should complete the two selected ESI evidence writes');
    assert(duplicateEventKeys(db) === 0, 'partial retry should not duplicate activity event keys');

    const retryRun = latestFetchRun(db);
    assert(retryRun.api_calls_esi === 1, 'retry fetch run should record one ESI API call');
    assert(apiLogsForRun(db, retryRun.run_id).length === 1, 'retry run should keep scoped API log');
    assert(ingestionAuditsForRun(db, retryRun.run_id).length === 1, 'retry run should keep scoped ingestion audit');
  } finally {
    closeDatabase(db);
  }
}

function seedTopology(db) {
  db.prepare(`
    INSERT INTO regions (region_id, region_name)
    VALUES (?, ?)
  `).run(10000001, 'Test Region');
  db.prepare(`
    INSERT INTO constellations (constellation_id, constellation_name, region_id, region_name)
    VALUES (?, ?, ?, ?)
  `).run(20000001, 'Test Constellation', 10000001, 'Test Region');
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);
}

function seedQueue(repository, refs) {
  repository.upsertDiscoveredKillmailRefs(refs.map((ref, index) => ({
    killmail_id: ref.killmail_id,
    hash: ref.hash,
    discovered_at: ref.discovered_at,
    priority: index,
    preview: {
      killmail_time: ref.discovered_at,
      victim: { ship_type_id: 603 + index },
      attacker_count: 2 + index,
      zkb: { totalValue: 1000000 + index }
    }
  })), {
    runId: 'run_seed_queue',
    discoveredByType: 'manual_actor',
    discoveredById: 'character:90000002',
    sourceActorType: 'character',
    sourceActorId: 90000002,
    sourceScope: 'character:90000002'
  });
}

function seedAcceptedEvidence(db, killmailId, hash) {
  const repository = new EvidenceRepository(db);
  const run = repository.createFetchRun({
    runId: `run_seed_${killmailId}`,
    trigger: 'fixture_seed',
    watchType: 'manual_expand',
    watchId: 'fixture_seed'
  });
  const pkg = evidencePackageFromExpandedKillmails({
    killmails: [{ raw: expandedKillmail(killmailId, hash), hash }],
    run: {
      run_id: run.run_id,
      source_type: 'fixture',
      source_id: 'seed',
      started_at: run.started_at
    },
    discoveredBy: {
      type: 'fixture',
      id: killmailId
    }
  });
  const result = repository.persistEvidencePackage(pkg);
  repository.finalizeFetchRun(run.run_id, {
    expanded_new: result.killmailsWritten,
    activity_events_written: result.eventsWritten
  }, 'success');
}

function loggingEsiClient(db, repository, calls, options = {}) {
  return {
    async expandKillmail(killmailId, hash) {
      calls.push(killmailId);
      const run = latestRunningFetchRun(db);
      const shouldFail = killmailId === options.failKillmailId;
      repository.insertApiRequestLog({
        run_id: run?.run_id || null,
        run_type: 'collection',
        provider: 'esi',
        endpoint: `fixture://esi/killmails/${killmailId}/${hash}`,
        method: 'GET',
        status_code: shouldFail ? 503 : 200,
        duration_ms: 1,
        cache_status: 'miss',
        error_message: shouldFail ? `fixture ESI failure for ${killmailId}` : null
      });
      if (shouldFail) {
        throw new Error(`fixture ESI failure for ${killmailId}`);
      }
      return expandedKillmail(killmailId, hash);
    }
  };
}

function expandedKillmail(killmailId, hash) {
  const clone = JSON.parse(JSON.stringify(fixtureKillmail));
  clone.killmail_id = killmailId;
  clone.killmail_time = `2026-05-23T12:${String(killmailId % 60).padStart(2, '0')}:00Z`;
  clone.solar_system_id = 30000001;
  clone.victim.character_id = 90000001;
  clone.victim.corporation_id = 98000001;
  clone.victim.alliance_id = 99000001;
  clone.victim.ship_type_id = 603;
  clone.attackers = (clone.attackers || []).slice(0, 2).map((attacker, index) => ({
    ...attacker,
    character_id: 90000002 + index,
    corporation_id: 98000002,
    alliance_id: 99000002,
    ship_type_id: 587,
    final_blow: index === 0
  }));
  clone.__fixture_hash = hash;
  return clone;
}

function evidenceCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    ingestion_audits: count(db, 'ingestion_audits'),
    data_quality_warnings: count(db, 'data_quality_warnings')
  };
}

function latestRunningFetchRun(db) {
  return db.prepare(`
    SELECT *
    FROM fetch_runs
    WHERE status = 'running'
    ORDER BY rowid DESC
    LIMIT 1
  `).get();
}

function latestFetchRun(db) {
  return db.prepare(`
    SELECT *
    FROM fetch_runs
    ORDER BY rowid DESC
    LIMIT 1
  `).get();
}

function apiLogsForRun(db, runId) {
  return db.prepare(`
    SELECT *
    FROM api_request_logs
    WHERE run_id = ?
    ORDER BY rowid ASC
  `).all(runId);
}

function ingestionAuditsForRun(db, runId) {
  return db.prepare(`
    SELECT *
    FROM ingestion_audits
    WHERE run_id = ?
    ORDER BY killmail_id ASC
  `).all(runId);
}

function queueStatus(db, killmailId) {
  return db.prepare(`
    SELECT status
    FROM discovered_killmail_refs
    WHERE killmail_id = ?
  `).get(killmailId)?.status;
}

function duplicateEventKeys(db) {
  return db.prepare(`
    SELECT COUNT(*) AS count
    FROM (
      SELECT event_key
      FROM activity_events
      GROUP BY event_key
      HAVING COUNT(*) > 1
    )
  `).get().count;
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
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
