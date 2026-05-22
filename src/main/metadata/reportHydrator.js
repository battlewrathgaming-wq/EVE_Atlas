const { EvidenceRepository } = require('../db/evidenceRepository');
const { HttpClient } = require('../api/httpClient');
const { EsiClient } = require('../api/esiClient');
const { operatorReportCandidates, resolveSystem } = require('../reports/operatorReport');

async function hydrateActorReportCandidates(db, input, dependencies = {}) {
  const repository = dependencies.repository || new EvidenceRepository(db);
  const actor = resolveActor(db, input);
  const run = repository.createMetadataRun({
    trigger: 'manual',
    runType: 'report_actor_candidates',
    targetType: actor.entity_type,
    targetId: String(actor.entity_id)
  });
  const httpClient = dependencies.httpClient || new HttpClient({ repository, runId: run.run_id, runType: 'metadata' });
  httpClient.repository = httpClient.repository || repository;
  httpClient.runId = httpClient.runId || run.run_id;
  httpClient.runType = httpClient.runType || 'metadata';
  const esiClient = dependencies.esiClient || new EsiClient(httpClient);

  try {
    const ids = collectActorHydrationIds(db, actor, {
      topN: dependencies.topN || 10,
      threshold: dependencies.threshold || 1
    });
    const alreadyKnown = countKnown(db, ids);
    const unresolvedIds = ids.filter((id) => !alreadyKnown.knownIds.has(id));
    const resolved = await resolveInChunks(esiClient, unresolvedIds, dependencies.chunkSize || 500);
    const applyResult = applyResolvedNames(db, resolved);
    const apiCounts = apiCountsForRun(db, run.run_id);
    const unresolvedCount = unresolvedIds.length - resolved.length;
    const summary = {
      run_id: run.run_id,
      actor,
      candidates_considered: ids.length,
      ids_discovered: ids.length,
      already_known: alreadyKnown.count,
      requested_from_esi: unresolvedIds.length,
      resolved: resolved.length,
      unresolved: unresolvedCount,
      entities_upserted: applyResult.entitiesUpserted,
      types_upserted: applyResult.typesUpserted,
      activity_events_patched: applyResult.activityEventsPatched,
      api_calls_esi: apiCounts.esi,
      warnings: unresolvedCount > 0 ? [`${unresolvedCount} IDs were not resolved by ESI /universe/names/`] : []
    };

    repository.finalizeMetadataRun(run.run_id, summary, 'success', summary.warnings.join('; ') || null);
    return summary;
  } catch (error) {
    const apiCounts = apiCountsForRun(db, run.run_id);
    repository.finalizeMetadataRun(run.run_id, {
      api_calls_esi: apiCounts.esi
    }, 'failed', null, error.message);
    throw error;
  }
}

async function hydrateOperatorReportCandidates(db, systemNameOrId, dependencies = {}) {
  const repository = dependencies.repository || new EvidenceRepository(db);
  const run = repository.createMetadataRun({
    trigger: 'manual',
    runType: 'report_operator_candidates',
    targetType: 'system',
    targetId: String(systemNameOrId)
  });
  const httpClient = dependencies.httpClient || new HttpClient({ repository, runId: run.run_id, runType: 'metadata' });
  httpClient.repository = httpClient.repository || repository;
  httpClient.runId = httpClient.runId || run.run_id;
  httpClient.runType = httpClient.runType || 'metadata';
  const esiClient = dependencies.esiClient || new EsiClient(httpClient);

  try {
    const system = resolveSystem(db, systemNameOrId);
    const candidates = operatorReportCandidates(db, system.solar_system_id, {
      topN: dependencies.topN || 10,
      threshold: dependencies.threshold || 3
    });
    const ids = collectHydrationIds(db, system.solar_system_id, candidates);
    const alreadyKnown = countKnown(db, ids);
    const unresolvedIds = ids.filter((id) => !alreadyKnown.knownIds.has(id));
    const resolved = await resolveInChunks(esiClient, unresolvedIds, dependencies.chunkSize || 500);
    const applyResult = applyResolvedNames(db, resolved);
    const apiCounts = apiCountsForRun(db, run.run_id);
    const unresolvedCount = unresolvedIds.length - resolved.length;
    const summary = {
      run_id: run.run_id,
      system: {
        solar_system_id: system.solar_system_id,
        solar_system_name: system.solar_system_name
      },
      candidates_considered: candidates.length,
      ids_discovered: ids.length,
      already_known: alreadyKnown.count,
      requested_from_esi: unresolvedIds.length,
      resolved: resolved.length,
      unresolved: unresolvedCount,
      entities_upserted: applyResult.entitiesUpserted,
      types_upserted: applyResult.typesUpserted,
      activity_events_patched: applyResult.activityEventsPatched,
      api_calls_esi: apiCounts.esi,
      warnings: unresolvedCount > 0 ? [`${unresolvedCount} IDs were not resolved by ESI /universe/names/`] : []
    };

    repository.finalizeMetadataRun(run.run_id, summary, 'success', summary.warnings.join('; ') || null);

    return summary;
  } catch (error) {
    const apiCounts = apiCountsForRun(db, run.run_id);
    repository.finalizeMetadataRun(run.run_id, {
      api_calls_esi: apiCounts.esi
    }, 'failed', null, error.message);
    throw error;
  }
}

function resolveActor(db, input) {
  const entityType = String(input?.entityType || input?.entity_type || '').toLowerCase();
  if (!['character', 'corporation', 'alliance'].includes(entityType)) {
    throw new Error('Actor hydration entity type must be character, corporation, or alliance');
  }
  const entityId = Number(input?.entityId ?? input?.entity_id);
  if (!Number.isInteger(entityId) || entityId <= 0) {
    throw new Error('Actor hydration entity ID must be a positive integer');
  }
  const known = db.prepare(`
    SELECT entity_name
    FROM entities
    WHERE entity_type = ? AND entity_id = ?
  `).get(entityType, entityId);
  const watch = db.prepare(`
    SELECT entity_name
    FROM watchlist_entities
    WHERE entity_type = ? AND entity_id = ?
  `).get(entityType, entityId);
  return {
    entity_type: entityType,
    entity_id: entityId,
    entity_name: input?.entityName || input?.entity_name || known?.entity_name || watch?.entity_name || null
  };
}

function collectActorHydrationIds(db, actor, options = {}) {
  const candidateRows = db.prepare(`
    SELECT ae.character_id, ae.corporation_id, ae.alliance_id, COUNT(*) AS appearances
    FROM activity_events ae
    WHERE ae.entity_type = ? AND ae.entity_id = ?
    GROUP BY ae.character_id, ae.corporation_id, ae.alliance_id
    HAVING COUNT(*) >= ?
    ORDER BY appearances DESC
    LIMIT ?
  `).all(actor.entity_type, actor.entity_id, options.threshold || 1, options.topN || 10);
  const ids = new Set([actor.entity_id]);

  for (const row of candidateRows) {
    for (const value of [row.character_id, row.corporation_id, row.alliance_id]) {
      if (value) {
        ids.add(Number(value));
      }
    }
  }

  return [...ids].filter((id) => Number.isInteger(id) && id > 0).sort((a, b) => a - b);
}

function collectHydrationIds(db, systemId, candidates) {
  const ids = new Set();
  for (const row of candidates) {
    ids.add(Number(row.entity_id));
  }

  const candidateKeys = candidates.map((row) => `${row.entity_type}:${row.entity_id}`);
  if (candidateKeys.length) {
    const rows = db.prepare(`
      SELECT entity_type, entity_id, character_id, corporation_id, alliance_id
      FROM activity_events
      WHERE solar_system_id = ?
    `).all(systemId);

    for (const row of rows) {
      if (!candidateKeys.includes(`${row.entity_type}:${row.entity_id}`)) {
        continue;
      }
      for (const value of [row.character_id, row.corporation_id, row.alliance_id]) {
        if (value) {
          ids.add(Number(value));
        }
      }
    }
  }

  return [...ids].filter((id) => Number.isInteger(id) && id > 0).sort((a, b) => a - b);
}

function countKnown(db, ids) {
  const knownIds = new Set();
  const entityStatement = db.prepare('SELECT entity_name FROM entities WHERE entity_id = ? AND entity_name IS NOT NULL');

  for (const id of ids) {
    if (entityStatement.get(id)) {
      knownIds.add(id);
    }
  }

  return {
    count: knownIds.size,
    knownIds
  };
}

async function resolveInChunks(esiClient, ids, chunkSize) {
  const resolved = [];
  for (let index = 0; index < ids.length; index += chunkSize) {
    const chunk = ids.slice(index, index + chunkSize);
    if (!chunk.length) {
      continue;
    }
    const rows = await esiClient.resolveNames(chunk);
    resolved.push(...(Array.isArray(rows) ? rows : []));
  }
  return resolved;
}

function applyResolvedNames(db, resolved) {
  const now = new Date().toISOString();
  const entityStatement = db.prepare(`
    INSERT INTO entities (
      entity_type, entity_id, entity_name, first_seen_at, last_seen_at, last_enriched_at
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(entity_type, entity_id) DO UPDATE SET
      entity_name = excluded.entity_name,
      last_enriched_at = excluded.last_enriched_at
  `);
  const statements = patchStatements(db);
  let entitiesUpserted = 0;
  let activityEventsPatched = 0;

  db.exec('BEGIN IMMEDIATE;');
  try {
    for (const row of resolved) {
      const category = normalizeCategory(row.category);
      if (category === 'character' || category === 'corporation' || category === 'alliance') {
        entityStatement.run(category, row.id, row.name, now, now, now);
        entitiesUpserted += 1;
        activityEventsPatched += patchEntityEvents(statements, category, row.id, row.name);
      }
    }
    db.exec('COMMIT;');
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }

  return {
    entitiesUpserted,
    typesUpserted: 0,
    activityEventsPatched
  };
}

function patchStatements(db) {
  return {
    entity: db.prepare('UPDATE activity_events SET entity_name = ? WHERE entity_type = ? AND entity_id = ? AND entity_name IS NULL'),
    character: db.prepare('UPDATE activity_events SET character_name = ? WHERE character_id = ? AND character_name IS NULL'),
    corporation: db.prepare('UPDATE activity_events SET corporation_name = ? WHERE corporation_id = ? AND corporation_name IS NULL'),
    alliance: db.prepare('UPDATE activity_events SET alliance_name = ? WHERE alliance_id = ? AND alliance_name IS NULL')
  };
}

function patchEntityEvents(statements, category, id, name) {
  let changes = statements.entity.run(name, category, id).changes;
  changes += statements[category].run(name, id).changes;
  return changes;
}

function normalizeCategory(category) {
  const value = String(category || '').toLowerCase();
  if (value === 'character' || value === 'corporation' || value === 'alliance') {
    return value;
  }
  if (value === 'inventory_type' || value === 'inventorytype') {
    return 'inventory_type';
  }
  return value;
}

function apiCountsForRun(db, runId) {
  const rows = db.prepare(`
    SELECT provider, COUNT(*) AS count
    FROM api_request_logs
    WHERE run_id = ?
    GROUP BY provider
  `).all(runId);
  const counts = { esi: 0 };
  for (const row of rows) {
    counts[row.provider] = row.count;
  }
  return counts;
}

module.exports = {
  hydrateActorReportCandidates,
  hydrateOperatorReportCandidates,
  collectHydrationIds,
  collectActorHydrationIds,
  applyResolvedNames
};
