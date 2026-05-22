const { EvidenceRepository } = require('../db/evidenceRepository');
const { HttpClient } = require('../api/httpClient');
const { EsiClient } = require('../api/esiClient');

const VALID_ENTITY_TYPES = new Set(['character', 'corporation', 'alliance']);
const ESI_CATEGORY_BY_TYPE = {
  character: 'characters',
  corporation: 'corporations',
  alliance: 'alliances'
};

async function resolveActorIdentity(db, input, dependencies = {}) {
  const entityType = normalizeEntityType(input.entityType || input.entity_type);
  const entityId = input.entityId ?? input.entity_id;
  const entityName = input.entityName ?? input.entity_name;

  if (entityId) {
    return resolveById(db, entityType, entityId, entityName);
  }

  if (!entityName) {
    throw new Error('Actor resolution requires an entity ID or typed entity name');
  }

  const local = resolveByLocalName(db, entityType, entityName);
  if (local) {
    return local;
  }

  if (!dependencies.esiClient && process.env.AURA_ATLAS_LIVE_API !== '1') {
    throw new Error('Typed actor name resolution requires AURA_ATLAS_LIVE_API=1 unless the actor is already cached locally');
  }

  return resolveByEsiName(db, entityType, entityName, dependencies);
}

function resolveById(db, entityType, entityId, entityName = null) {
  const id = normalizeEntityId(entityId);
  const known = db.prepare(`
    SELECT entity_name
    FROM entities
    WHERE entity_type = ? AND entity_id = ?
  `).get(entityType, id);
  const watch = db.prepare(`
    SELECT entity_name
    FROM watchlist_entities
    WHERE entity_type = ? AND entity_id = ?
  `).get(entityType, id);
  const resolved = {
    entity_type: entityType,
    entity_id: id,
    entity_name: entityName || known?.entity_name || watch?.entity_name || null
  };

  if (entityName) {
    upsertResolvedEntity(db, resolved);
  }

  return resolved;
}

function resolveByLocalName(db, entityType, entityName) {
  const rows = db.prepare(`
    SELECT entity_type, entity_id, entity_name
    FROM entities
    WHERE entity_type = ? AND lower(entity_name) = lower(?)
    UNION
    SELECT entity_type, entity_id, entity_name
    FROM watchlist_entities
    WHERE entity_type = ? AND lower(entity_name) = lower(?)
    ORDER BY entity_id
  `).all(entityType, entityName.trim(), entityType, entityName.trim());

  if (rows.length > 1) {
    throw new Error(`Actor name "${entityName}" matched multiple cached ${entityType} entities: ${rows.map((row) => `${row.entity_name} [${row.entity_id}]`).join(', ')}`);
  }

  if (!rows.length) {
    return null;
  }

  return {
    entity_type: rows[0].entity_type,
    entity_id: rows[0].entity_id,
    entity_name: rows[0].entity_name
  };
}

async function resolveByEsiName(db, entityType, entityName, dependencies) {
  const repository = dependencies.repository || new EvidenceRepository(db);
  const metadataRun = dependencies.metadataRun || repository.createMetadataRun({
    trigger: dependencies.trigger || 'manual',
    runType: 'actor_name_resolution',
    targetType: entityType,
    targetId: entityName
  });
  const esiClient = dependencies.esiClient || new EsiClient(new HttpClient({
    repository,
    runId: metadataRun.run_id,
    runType: 'metadata'
  }));

  try {
    const result = await esiClient.resolveIds([entityName]);
    const candidates = candidatesForType(result, entityType);
    if (!candidates.length) {
      finalizeMetadataRunIfOwned(repository, dependencies, metadataRun.run_id, {
        candidates_considered: 1,
        ids_discovered: 0,
        requested_from_esi: 1,
        resolved: 0,
        unresolved: 1,
        api_calls_esi: 1
      }, 'failed', null, `No ${entityType} found for "${entityName}"`);
      throw new Error(`No ${entityType} found for "${entityName}"`);
    }
    if (candidates.length > 1) {
      const candidateList = candidates.map((candidate) => `${candidate.name} [${candidate.id}]`).join(', ');
      finalizeMetadataRunIfOwned(repository, dependencies, metadataRun.run_id, {
        candidates_considered: candidates.length,
        ids_discovered: candidates.length,
        requested_from_esi: 1,
        resolved: 0,
        unresolved: candidates.length,
        api_calls_esi: 1
      }, 'failed', null, `Multiple ${entityType} matches for "${entityName}": ${candidateList}`);
      throw new Error(`Multiple ${entityType} matches for "${entityName}": ${candidateList}`);
    }

    const resolved = {
      entity_type: entityType,
      entity_id: Number(candidates[0].id),
      entity_name: candidates[0].name
    };
    upsertResolvedEntity(db, resolved);
    finalizeMetadataRunIfOwned(repository, dependencies, metadataRun.run_id, {
      candidates_considered: 1,
      ids_discovered: 1,
      requested_from_esi: 1,
      resolved: 1,
      entities_upserted: 1,
      api_calls_esi: 1
    }, 'success');
    return resolved;
  } catch (error) {
    if (!dependencies.metadataRun && !isHandledResolutionError(error)) {
      repository.finalizeMetadataRun(metadataRun.run_id, { api_calls_esi: 1 }, 'failed', null, error.message);
    }
    throw error;
  }
}

function candidatesForType(result, entityType) {
  const category = ESI_CATEGORY_BY_TYPE[entityType];
  return (result?.[category] || []).filter((candidate) => candidate?.id && candidate?.name);
}

function upsertResolvedEntity(db, actor) {
  const repository = new EvidenceRepository(db);
  const now = new Date().toISOString();
  repository.upsertEntity({
    entity_type: actor.entity_type,
    entity_id: actor.entity_id,
    entity_name: actor.entity_name,
    first_seen_at: now,
    last_seen_at: now,
    last_enriched_at: now
  });
}

function finalizeMetadataRunIfOwned(repository, dependencies, runId, counts, status, warningSummary = null, errorSummary = null) {
  if (dependencies.metadataRun) {
    return;
  }
  repository.finalizeMetadataRun(runId, counts, status, warningSummary, errorSummary);
}

function isHandledResolutionError(error) {
  return /^No .* found for /.test(error.message) || /^Multiple .* matches for /.test(error.message);
}

function normalizeEntityType(entityType) {
  const value = String(entityType || '').toLowerCase();
  if (!VALID_ENTITY_TYPES.has(value)) {
    throw new Error('Actor entity type must be character, corporation, or alliance');
  }
  return value;
}

function normalizeEntityId(entityId) {
  const value = Number(entityId);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error('Actor entity ID must be a positive integer');
  }
  return value;
}

module.exports = {
  resolveActorIdentity
};
