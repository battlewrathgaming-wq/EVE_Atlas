const { EvidenceRepository } = require('../db/evidenceRepository');

function buildHydrationWriteFixtureProof(db, input = {}, context = {}) {
  const validation = validateFixtureContext(context);
  const forgedPayloadIgnored = hasForgedPayloadAuthority(input);
  if (!validation.valid) {
    return proofResult({
      validation,
      forgedPayloadIgnored,
      before: null,
      after: null,
      run: null,
      candidates: [],
      patchResult: null
    });
  }

  const before = stateSnapshot(db);
  const candidates = knownLocalLabelCandidates(db, boundedLimit(input.limit || input.previewLimit || input.preview_limit));
  const repository = context.repository || new EvidenceRepository(db);
  const run = repository.createMetadataRun({
    trigger: 'fixture_test',
    runType: 'hydration_write_fixture_proof',
    targetType: 'fixture',
    targetId: 'known_local_labels'
  });
  let patchResult;

  try {
    patchResult = patchKnownLocalLabels(db, candidates);
    repository.finalizeMetadataRun(run.run_id, {
      candidates_considered: candidates.length,
      ids_discovered: candidates.length,
      already_known: candidates.length,
      requested_from_esi: 0,
      resolved: candidates.length,
      unresolved: 0,
      entities_upserted: 0,
      types_upserted: 0,
      activity_events_patched: patchResult.activity_events_patched,
      api_calls_esi: 0
    }, 'success', 'fixture/offline proof used only existing local entity labels');
  } catch (error) {
    repository.finalizeMetadataRun(run.run_id, {
      candidates_considered: candidates.length,
      ids_discovered: candidates.length,
      already_known: candidates.length,
      requested_from_esi: 0,
      resolved: 0,
      unresolved: candidates.length,
      entities_upserted: 0,
      types_upserted: 0,
      activity_events_patched: 0,
      api_calls_esi: 0
    }, 'failed', null, error.message);
    throw error;
  }

  const after = stateSnapshot(db);
  return proofResult({
    validation,
    forgedPayloadIgnored,
    before,
    after,
    run: metadataRun(db, run.run_id),
    candidates,
    patchResult
  });
}

function validateFixtureContext(context = {}) {
  const issues = [];
  if (context.source === 'renderer') {
    issues.push('renderer_not_allowed_to_write_hydration_fixture');
  }
  if (context.allowHydrationWriteFixtureProof !== true) {
    issues.push('trusted_hydration_write_fixture_context_required');
  }
  const uniqueIssues = [...new Set(issues)];
  return {
    valid: uniqueIssues.length === 0,
    status: uniqueIssues.length === 0 ? 'hydration_write_fixture_valid' : uniqueIssues[0],
    issues: uniqueIssues,
    enforcement_state: 'not_implemented_readout_only'
  };
}

function knownLocalLabelCandidates(db, limit) {
  return db.prepare(`
    WITH refs AS (
      SELECT 'primary' AS ref_kind, entity_type, entity_id, entity_name AS event_label
      FROM activity_events
      WHERE entity_id IS NOT NULL
      UNION ALL
      SELECT 'character', 'character', character_id, character_name
      FROM activity_events
      WHERE character_id IS NOT NULL
      UNION ALL
      SELECT 'corporation', 'corporation', corporation_id, corporation_name
      FROM activity_events
      WHERE corporation_id IS NOT NULL
      UNION ALL
      SELECT 'alliance', 'alliance', alliance_id, alliance_name
      FROM activity_events
      WHERE alliance_id IS NOT NULL
    )
    SELECT refs.entity_type,
           refs.entity_id,
           entities.entity_name AS local_label,
           COUNT(*) AS appearances,
           SUM(CASE WHEN refs.event_label IS NULL THEN 1 ELSE 0 END) AS missing_labels
    FROM refs
    JOIN entities
      ON entities.entity_type = refs.entity_type
     AND entities.entity_id = refs.entity_id
     AND entities.entity_name IS NOT NULL
    GROUP BY refs.entity_type, refs.entity_id, entities.entity_name
    HAVING missing_labels > 0
    ORDER BY missing_labels DESC, appearances DESC, refs.entity_type, refs.entity_id
    LIMIT ?
  `).all(limit).map((row) => ({
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    local_label: row.local_label,
    appearances: Number(row.appearances || 0),
    missing_labels: Number(row.missing_labels || 0),
    provider_needed: false,
    source: 'existing_entities_local_label',
    factual_basis: 'numeric IDs in activity_events remain unchanged'
  }));
}

function patchKnownLocalLabels(db, candidates) {
  const statements = {
    primary: db.prepare('UPDATE activity_events SET entity_name = ? WHERE entity_type = ? AND entity_id = ? AND entity_name IS NULL'),
    character: db.prepare('UPDATE activity_events SET character_name = ? WHERE character_id = ? AND character_name IS NULL'),
    corporation: db.prepare('UPDATE activity_events SET corporation_name = ? WHERE corporation_id = ? AND corporation_name IS NULL'),
    alliance: db.prepare('UPDATE activity_events SET alliance_name = ? WHERE alliance_id = ? AND alliance_name IS NULL')
  };
  const patched = [];
  let activityEventsPatched = 0;

  db.exec('BEGIN IMMEDIATE;');
  try {
    for (const candidate of candidates) {
      let changes = statements.primary.run(candidate.local_label, candidate.entity_type, candidate.entity_id).changes;
      changes += statements[candidate.entity_type].run(candidate.local_label, candidate.entity_id).changes;
      activityEventsPatched += changes;
      patched.push({
        ...candidate,
        patched_columns: patchColumnsFor(candidate.entity_type),
        activity_event_label_patches: changes
      });
    }
    db.exec('COMMIT;');
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }

  return {
    activity_events_patched: activityEventsPatched,
    entities_upserted: 0,
    types_upserted: 0,
    provider_calls: 0,
    patched
  };
}

function proofResult({ validation, forgedPayloadIgnored, before, after, run, candidates, patchResult }) {
  return {
    action: 'metadata.hydration_write_fixture_proof',
    classification: 'fixture/offline hydration writer proof',
    generated_at: new Date().toISOString(),
    read_only: false,
    mutates_state: validation.valid === true,
    fixture_offline_only: true,
    enforcement_state: 'not_implemented_readout_only',
    runtime_authorization_active: false,
    command_blocking_active: false,
    provider_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    sde_download_calls: 0,
    evidence_writes: 0,
    discovery_ref_mutations: 0,
    queue_dispatches: 0,
    watch_state_mutations: 0,
    schema_changes: 0,
    real_operator_hydration: false,
    validation_result: validation,
    forged_payload_authority_ignored: forgedPayloadIgnored,
    candidates_considered: candidates.length,
    candidates,
    write_summary: patchResult ? {
      metadata_run_writes: 1,
      activity_event_label_patches: patchResult.activity_events_patched,
      entity_label_writes: 0,
      entities_upserted: 0,
      types_upserted: 0,
      provider_calls: 0,
      patched: patchResult.patched
    } : null,
    metadata_run: run ? {
      run_id: run.run_id,
      run_type: run.run_type,
      status: run.status,
      ids_discovered: run.ids_discovered,
      already_known: run.already_known,
      requested_from_esi: run.requested_from_esi,
      resolved: run.resolved,
      activity_events_patched: run.activity_events_patched,
      api_calls_esi: run.api_calls_esi
    } : null,
    before,
    after,
    invariants: invariants(before, after),
    evidence_boundary: {
      hydration_repairs: 'local readability labels on activity_events only',
      numeric_ids_remain_facts: true,
      raw_killmail_payloads_mutated: false,
      creates_evidence: false,
      discovery_refs_are_evidence: false,
      provider_needed_labels_are_evidence_work: false
    },
    gates: {
      external_io: 'separate_not_bypassed_or_enforced',
      live_gate: 'separate_not_bypassed_or_enforced',
      storage_authority: 'separate_not_bypassed_or_enforced',
      runtime_enforcement: 'inactive'
    },
    boundary: [
      'Fixture/offline Hydration writer proof only; it does not call providers or perform real operator hydration.',
      'It derives labels only from existing local entities rows and patches readability labels on existing activity_events rows.',
      'It writes one metadata_runs row for provenance; metadata_runs are Hydration context, not fetch_runs or Evidence/EVEidence.',
      'It does not mutate raw killmail payloads, numeric IDs, Discovery refs, queues, Watch rows, provider logs, schema, or renderer UI.',
      'Renderer payloads cannot invoke this proof or provide label/provider authority.'
    ]
  };
}

function invariants(before, after) {
  if (!before || !after) {
    return null;
  }
  return {
    numeric_activity_event_ids_unchanged: stableJson(before.activity_event_ids) === stableJson(after.activity_event_ids),
    raw_killmail_payloads_unchanged: stableJson(before.killmails) === stableJson(after.killmails),
    discovered_refs_unchanged: stableJson(before.discovered_refs) === stableJson(after.discovered_refs),
    fetch_runs_unchanged: stableJson(before.fetch_runs) === stableJson(after.fetch_runs),
    api_request_logs_unchanged: stableJson(before.api_request_logs) === stableJson(after.api_request_logs),
    watch_rows_unchanged: stableJson(before.watch_rows) === stableJson(after.watch_rows),
    queue_state_unchanged: stableJson(before.discovered_refs) === stableJson(after.discovered_refs),
    entity_rows_unchanged: stableJson(before.entities) === stableJson(after.entities),
    only_expected_tables_changed: (
      before.counts.metadata_runs + 1 === after.counts.metadata_runs &&
      before.counts.killmails === after.counts.killmails &&
      before.counts.discovered_killmail_refs === after.counts.discovered_killmail_refs &&
      before.counts.fetch_runs === after.counts.fetch_runs &&
      before.counts.api_request_logs === after.counts.api_request_logs &&
      before.counts.watchlist_entities === after.counts.watchlist_entities &&
      before.counts.system_watches === after.counts.system_watches &&
      before.counts.entities === after.counts.entities
    )
  };
}

function stateSnapshot(db) {
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
      SELECT event_key, killmail_id, role, entity_type, entity_id, character_id, corporation_id,
             alliance_id, ship_type_id, weapon_type_id, solar_system_id
      FROM activity_events
      ORDER BY event_key
    `).all(),
    activity_event_labels: db.prepare(`
      SELECT event_key, entity_name, character_name, corporation_name, alliance_name
      FROM activity_events
      ORDER BY event_key
    `).all(),
    discovered_refs: db.prepare(`
      SELECT killmail_id, killmail_hash, discovered_by_type, discovered_by_id, status, selected_for_expansion_at, expanded_at
      FROM discovered_killmail_refs
      ORDER BY killmail_id, killmail_hash, discovered_by_type, discovered_by_id
    `).all(),
    fetch_runs: db.prepare('SELECT * FROM fetch_runs ORDER BY run_id').all(),
    api_request_logs: db.prepare('SELECT * FROM api_request_logs ORDER BY request_id').all(),
    watch_rows: {
      actor: db.prepare('SELECT * FROM watchlist_entities ORDER BY watch_id').all(),
      system: db.prepare('SELECT * FROM system_watches ORDER BY watch_id').all()
    },
    entities: db.prepare('SELECT * FROM entities ORDER BY entity_type, entity_id').all()
  };
}

function metadataRun(db, runId) {
  return db.prepare('SELECT * FROM metadata_runs WHERE run_id = ?').get(runId);
}

function patchColumnsFor(entityType) {
  return ['entity_name', `${entityType}_name`];
}

function hasForgedPayloadAuthority(input = {}) {
  return Boolean(
    input.entityIds ||
    input.entity_ids ||
    input.labels ||
    input.resolved ||
    input.providerResults ||
    input.provider_results ||
    input.databasePath ||
    input.database_path
  );
}

function boundedLimit(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return 8;
  }
  return Math.min(Math.floor(number), 25);
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function stableJson(value) {
  return JSON.stringify(value);
}

module.exports = {
  buildHydrationWriteFixtureProof
};
