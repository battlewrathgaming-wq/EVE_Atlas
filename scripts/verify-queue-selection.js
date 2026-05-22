const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { buildQueueExpansionSelection } = require('../src/main/services/queueSelectionService');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  seed(db);

  try {
    const before = counts(db);
    const selection = buildQueueExpansionSelection(db, {
      discoveredByType: 'manual_actor',
      discoveredById: 'character:90000002',
      mode: 'next',
      maxExpansions: 2
    });

    assert(selection.classification === 'queue-selection-preview', 'selection should be preview classified');
    assert(selection.evidence_boundary.includes('not killmail evidence'), 'selection should state evidence boundary');
    assert(selection.counts.selected_for_expansion === 2, 'next selection should select two refs');
    assert(selection.counts.expected_esi_calls === 2, 'selection should estimate two ESI calls');
    assert(selection.refs.some((row) => row.preview_source === 'zkill_discovery_preview'), 'selection should expose zKill preview source');
    assert(selection.refs.every((row) => row.preview_is_evidence === false), 'preview rows should be marked non-evidence');
    assert(selection.refs.some((row) => row.preview?.victim_ship_type_id === 587), 'preview should expose victim ship type ID');
    assert(selection.refs.some((row) => row.preview?.attacker_count === 3), 'preview should expose attacker count');
    assert(selection.refs.some((row) => row.preview?.zkill_total_value === 12000000), 'preview should expose zKill total value');
    assert(selection.refs.filter((row) => row.selected_for_expansion).length === 2, 'two rows should be selected');
    assert(selection.refs.some((row) => row.skip_reason === 'cap_skipped'), 'cap skipped refs should be explained');
    assertSameCounts(before, counts(db), 'queue selection must not create evidence');

    const selected = buildQueueExpansionSelection(db, {
      mode: 'selected',
      killmailIds: [8103],
      maxExpansions: 1
    });
    assert(selected.refs.length === 1, 'selected mode should only load selected killmail ID');
    assert(selected.refs[0].killmail_id === 8103, 'selected mode should select requested killmail');

    const newest = buildQueueExpansionSelection(db, {
      discoveredByType: 'manual_actor',
      discoveredById: 'character:90000002',
      mode: 'newest',
      maxExpansions: 1
    });
    assert(newest.refs.find((row) => row.selected_for_expansion).killmail_id === 8103, 'newest mode should select newest pending ref');

    const commands = listServiceCommands();
    assert(commands.some((entry) => entry.command === 'queue.selection' && entry.classification === 'read-only'), 'queue.selection should be read-only service command');
    const serviceSelection = await invokeServiceCommand('queue.selection', {
      discoveredByType: 'manual_actor',
      discoveredById: 'character:90000002',
      mode: 'priority',
      maxExpansions: 1
    }, { db });
    assert(serviceSelection.counts.selected_for_expansion === 1, 'service queue selection should return selection preview');
    assertSameCounts(before, counts(db), 'service queue selection must not create evidence');
  } finally {
    closeDatabase(db);
  }

  console.log('queue expansion selection verified');
}

function seed(db) {
  db.prepare(`
    INSERT INTO entities (
      entity_type, entity_id, entity_name, first_seen_at, last_seen_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run('character', 90000002, 'Atlas Scout', '2026-05-22T00:00:00Z', '2026-05-22T00:00:00Z');

  const repository = new EvidenceRepository(db);
  repository.upsertDiscoveredKillmailRefs([
    ref(8101, 'hash_8101', '2026-05-22T10:00:00Z', 587, 3, 12000000, 0),
    ref(8102, 'hash_8102', '2026-05-22T10:05:00Z', 603, 1, 8000000, 1),
    ref(8103, 'hash_8103', '2026-05-22T10:10:00Z', 643, 6, 220000000, 2)
  ], {
    runId: 'fixture_queue_selection',
    discoveredByType: 'manual_actor',
    discoveredById: 'character:90000002',
    sourceScope: 'character:90000002',
    sourceActorType: 'character',
    sourceActorId: 90000002
  });
}

function ref(killmailId, hash, time, shipTypeId, attackerCount, totalValue, priority) {
  return {
    killmail_id: killmailId,
    hash,
    discovered_at: time,
    priority,
    preview: {
      killmail_time: time,
      victim: {
        ship_type_id: shipTypeId
      },
      attacker_count: attackerCount,
      zkb: {
        totalValue
      }
    }
  };
}

function counts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    refs: count(db, 'discovered_killmail_refs')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assertSameCounts(before, after, message) {
  assert(JSON.stringify(before) === JSON.stringify(after), `${message}: expected ${JSON.stringify(before)}, got ${JSON.stringify(after)}`);
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
