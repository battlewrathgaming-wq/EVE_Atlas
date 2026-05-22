const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { buildQueueReport } = require('../src/main/reports/queueReport');

function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  db.prepare(`
    INSERT INTO entities (
      entity_type, entity_id, entity_name, first_seen_at, last_seen_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run('character', 90000002, 'Atlas Scout', '2026-05-21T00:00:00Z', '2026-05-21T00:00:00Z');
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);

  const repository = new EvidenceRepository(db);
  seedQueue(repository);

  const allReport = buildQueueReport(db);
  const actorReport = buildQueueReport(db, {
    type: 'actor',
    id: 90000002,
    limit: 2
  });
  const pendingReport = buildQueueReport(db, {
    status: 'pending',
    limit: 5
  });

  assertIncludes(allReport, 'AURA Atlas Discovery Queue Report');
  assertIncludes(allReport, 'Scope: all discovery refs');
  assertIncludes(allReport, 'Queued refs: 4');
  assertIncludes(allReport, 'Pending refs: 2');
  assertIncludes(allReport, 'Failed refs: 1');
  assertIncludes(allReport, 'Status Totals');
  assertIncludes(allReport, 'Scope Totals');
  assertIncludes(allReport, 'Next Pending Expansion Candidates');
  assertIncludes(allReport, 'Evidence Boundary');
  assertIncludes(actorReport, 'Scope: actor:90000002');
  assertIncludes(actorReport, 'Queued refs: 3');
  assertIncludes(actorReport, 'Pending refs: 1');
  assertIncludes(actorReport, 'Failed refs: 1');
  assertIncludes(actorReport, 'Atlas Scout [characterID: 90000002]');
  assertIncludes(pendingReport, 'Status filter: pending');
  assertIncludes(pendingReport, 'Queued refs: 2');
  assertIncludes(pendingReport, 'Atlas Prime [solarSystemID: 30000001]');

  closeDatabase(db);
  console.log('queue report verified');
}

function seedQueue(repository) {
  repository.upsertDiscoveredKillmailRefs([
    {
      killmail_id: 5001,
      hash: 'hash_5001_pending_actor',
      source_actor_type: 'character',
      source_actor_id: 90000002,
      discovered_at: '2026-05-21T00:00:00Z',
      priority: 1
    },
    {
      killmail_id: 5002,
      hash: 'hash_5002_pending_actor',
      source_actor_type: 'character',
      source_actor_id: 90000002,
      discovered_at: '2026-05-21T00:01:00Z',
      priority: 2
    },
    {
      killmail_id: 5003,
      hash: 'hash_5003_expanded_actor',
      source_actor_type: 'character',
      source_actor_id: 90000002,
      discovered_at: '2026-05-21T00:02:00Z',
      priority: 3
    }
  ], {
    runId: 'run_actor_fixture',
    discoveredByType: 'actor',
    discoveredById: 90000002,
    sourceScope: 'character:90000002',
    sourceActorType: 'character',
    sourceActorId: 90000002
  });
  repository.upsertDiscoveredKillmailRefs([
    {
      killmail_id: 6001,
      hash: 'hash_6001_pending_system',
      source_system_id: 30000001,
      discovered_at: '2026-05-21T00:03:00Z',
      priority: 1
    }
  ], {
    runId: 'run_system_fixture',
    discoveredByType: 'system_radius',
    discoveredById: 30000001,
    sourceScope: 'system:30000001:radius:0'
  });
  repository.markDiscoveryRefsExpanded([{ killmail_id: 5003, hash: 'hash_5003_expanded_actor' }]);
  repository.markDiscoveryRefsFailed([{
    killmail_id: 5002,
    warning_type: 'failed_expansion',
    message: 'fixture ESI failure'
  }]);
}

function assertIncludes(text, expected) {
  if (!text.includes(expected)) {
    throw new Error(`Expected queue report to include "${expected}"`);
  }
}

main();
