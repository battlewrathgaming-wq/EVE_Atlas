const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { SdeTopologyImporter } = require('../src/main/sde/sdeImporter');
const { TopologyService } = require('../src/main/sde/topologyService');
const { planSystemRadiusWatch } = require('../src/main/workers/systemRadiusPlanner');
const {
  buildActorQueuePreflight,
  buildSystemRadiusQueuePreflight
} = require('../src/main/queue/queuePreflight');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  const importer = new SdeTopologyImporter(db);
  await importer.importFromPath(path.resolve(__dirname, '..', 'fixtures', 'sde-jsonl'), {
    buildNumber: 'fixture-build',
    sourceUrl: 'fixtures/sde-jsonl'
  });

  const repository = new EvidenceRepository(db);
  const emptyActor = buildActorQueuePreflight(db, {
    entityId: 90000002,
    maxExpansions: 2
  });
  assert(emptyActor.mode === 'discover_new_refs', 'empty actor queue should discover new refs');
  assert(emptyActor.expected_zkill_calls === 1, 'empty actor queue should expect one zKill call');
  assert(emptyActor.expected_esi_calls === 'unknown_until_discovery', 'empty actor ESI calls should be unknown');
  assert(emptyActor.esi_expansion_rate === 2, 'actor preflight should expose ESI Expansion Rate');

  seedPendingRefs(repository, 'actor', 90000002, 'character', 90000002);
  const pendingActor = buildActorQueuePreflight(db, {
    entityId: 90000002,
    maxExpansions: 2
  });
  assert(pendingActor.mode === 'drain_discovery_queue', 'pending actor queue should drain local refs');
  assert(pendingActor.expected_zkill_calls === 0, 'pending actor queue should not need zKill');
  assert(pendingActor.expected_esi_calls === 2, 'pending actor queue should expect min(pending, rate) ESI calls');
  assert(pendingActor.remaining_queued_after_run_estimate === 1, 'pending actor queue should estimate remaining refs');

  const systemInput = {
    centerSystemId: 30000001,
    radiusJumps: 0,
    lookbackSeconds: 86400,
    maxSystems: 1,
    maxRefsPerSystem: 2,
    maxExpansions: 2
  };
  const plannerOutput = planSystemRadiusWatch(systemInput, { topologyService: new TopologyService(db) });
  const emptySystem = buildSystemRadiusQueuePreflight(db, systemInput, plannerOutput);
  assert(emptySystem.mode === 'discover_new_refs', 'empty system queue should discover new refs');
  assert(emptySystem.expected_zkill_calls === 1, 'empty system queue should expect planned zKill calls');
  assert(emptySystem.expected_esi_calls === 'unknown_until_discovery', 'empty system ESI calls should be unknown');

  seedPendingRefs(repository, 'system_radius', 30000001, null, null, 30000001);
  const pendingSystem = buildSystemRadiusQueuePreflight(db, systemInput, plannerOutput);
  assert(pendingSystem.mode === 'drain_discovery_queue', 'pending system queue should drain local refs');
  assert(pendingSystem.expected_zkill_calls === 0, 'pending system queue should not need zKill');
  assert(pendingSystem.expected_esi_calls === 2, 'pending system queue should expect min(pending, rate) ESI calls');

  closeDatabase(db);
  console.log('queue preflight verified');
}

function seedPendingRefs(repository, discoveredByType, discoveredById, sourceActorType, sourceActorId, sourceSystemId = null) {
  repository.upsertDiscoveredKillmailRefs([1, 2, 3].map((offset) => ({
    killmail_id: Number(`${discoveredById}${offset}`),
    hash: `hash_${discoveredByType}_${offset}`,
    source_actor_type: sourceActorType,
    source_actor_id: sourceActorId,
    source_system_id: sourceSystemId,
    discovered_at: `2026-05-21T00:0${offset}:00Z`,
    priority: offset
  })), {
    runId: `run_${discoveredByType}`,
    discoveredByType,
    discoveredById,
    sourceScope: `${discoveredByType}:${discoveredById}`,
    sourceActorType,
    sourceActorId,
    sourceSystemId
  });
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
