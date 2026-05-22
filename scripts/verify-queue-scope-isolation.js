const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');

function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  const repository = new EvidenceRepository(db);

  try {
    seedScopedRefs(repository);

    repository.markDiscoveryRefsSelected([scopedRef('manual_actor', 'character:9001')]);
    repository.markDiscoveryRefsExpanded([scopedRef('manual_actor', 'character:9001')]);
    assertStatus(db, 'manual_actor', 'character:9001', 'expanded');
    assertStatus(db, 'actor', '9001', 'pending');
    assertStatus(db, 'system_radius', '30000001', 'pending');

    repository.markDiscoveryRefsCached([scopedRef('actor', '9001')]);
    assertStatus(db, 'manual_actor', 'character:9001', 'expanded');
    assertStatus(db, 'actor', '9001', 'cached');
    assertStatus(db, 'system_radius', '30000001', 'pending');

    repository.markDiscoveryRefsFailed([{
      ...scopedRef('system_radius', '30000001'),
      error_message: 'fixture scoped failure'
    }]);
    assertStatus(db, 'manual_actor', 'character:9001', 'expanded');
    assertStatus(db, 'actor', '9001', 'cached');
    assertStatus(db, 'system_radius', '30000001', 'failed');

    const selected = db.prepare(`
      SELECT COUNT(*) AS count
      FROM discovered_killmail_refs
      WHERE selected_for_expansion_at IS NOT NULL
    `).get().count;
    assert(selected === 1, 'selected timestamp should be scoped to one queue row');

    const failed = db.prepare(`
      SELECT failure_count, last_error
      FROM discovered_killmail_refs
      WHERE discovered_by_type = 'system_radius'
        AND discovered_by_id = '30000001'
    `).get();
    assert(failed.failure_count === 1, 'failed scoped row should increment failure count');
    assert(failed.last_error === 'fixture scoped failure', 'failed scoped row should keep error message');
  } finally {
    closeDatabase(db);
  }

  console.log('queue scope isolation verified');
}

function seedScopedRefs(repository) {
  const ref = {
    killmail_id: 99001,
    hash: 'shared_hash_99001',
    discovered_at: '2026-05-22T10:00:00Z',
    priority: 1
  };
  repository.upsertDiscoveredKillmailRefs([ref], {
    runId: 'fixture_manual_actor',
    discoveredByType: 'manual_actor',
    discoveredById: 'character:9001',
    sourceActorType: 'character',
    sourceActorId: 9001
  });
  repository.upsertDiscoveredKillmailRefs([ref], {
    runId: 'fixture_actor',
    discoveredByType: 'actor',
    discoveredById: 9001,
    sourceActorType: 'character',
    sourceActorId: 9001
  });
  repository.upsertDiscoveredKillmailRefs([ref], {
    runId: 'fixture_system_radius',
    discoveredByType: 'system_radius',
    discoveredById: 30000001,
    sourceSystemId: 30000001
  });
}

function scopedRef(discoveredByType, discoveredById) {
  return {
    killmail_id: 99001,
    hash: 'shared_hash_99001',
    discovered_by_type: discoveredByType,
    discovered_by_id: discoveredById
  };
}

function assertStatus(db, discoveredByType, discoveredById, expectedStatus) {
  const row = db.prepare(`
    SELECT status
    FROM discovered_killmail_refs
    WHERE killmail_id = 99001
      AND killmail_hash = 'shared_hash_99001'
      AND discovered_by_type = ?
      AND discovered_by_id = ?
  `).get(discoveredByType, String(discoveredById));
  assert(row, `missing scoped queue row for ${discoveredByType}:${discoveredById}`);
  assert(row.status === expectedStatus, `${discoveredByType}:${discoveredById} expected ${expectedStatus}, got ${row.status}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main();
