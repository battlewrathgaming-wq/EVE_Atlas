const { actionGate } = require('./liveApiGateService');
const { taxonomyMessage } = require('./messageTaxonomy');
const { discoverManualRefs } = require('../workers/manualDiscoveryWorker');
const { expandManualRefs } = require('../workers/manualExpansionWorker');
const { collectActorWatch } = require('../workers/actorWatchCollector');
const { collectSystemRadiusWatch } = require('../workers/systemRadiusCollector');
const {
  hydrateActorReportCandidates,
  hydrateCorporationReportCandidates,
  hydrateOperatorReportCandidates
} = require('../metadata/reportHydrator');
const { resolveActorIdentity } = require('../resolution/actorResolver');
const {
  normalizeManualDiscoveryScope,
  normalizeManualExpansionScope,
  normalizeActorWatchScope,
  normalizeSystemRadiusWatchScope
} = require('../scopes/scopeControls');
const { SdeTopologyImporter } = require('../sde/sdeImporter');
const { SdeInventoryImporter } = require('../sde/sdeInventoryImporter');
const { addWatchlistEntity, listWatchlistEntities } = require('../watchlist/watchlistRepository');
const { buildWatchScheduleStatus, recordWatchRunResult } = require('../watchlist/watchScheduler');

async function runManualDiscoveryService(db, payload = {}, dependencies = {}) {
  assertLiveAllowed('manual.discovery', payload);
  const input = await normalizeManualDiscoveryInput(db, payload, dependencies);
  return discoverManualRefs(input, { ...dependencies, db });
}

async function runManualExpansionService(db, payload = {}, dependencies = {}) {
  assertLiveAllowed('manual.expansion', payload);
  const input = normalizeManualExpansionScope({
    ...payload,
    trigger: payload.trigger || 'manual'
  });
  return expandManualRefs(input, { ...dependencies, db });
}

async function runActorWatchService(db, payload = {}, dependencies = {}) {
  const actor = await resolveActorInput(db, payload, dependencies);
  const input = normalizeActorWatchScope({
    ...payload,
    entityType: actor.entity_type,
    entityId: actor.entity_id,
    entityName: actor.entity_name
  });
  assertLiveAllowed('actor.watch', input);
  return collectActorWatch(input, { ...dependencies, db });
}

async function runSystemRadiusWatchService(db, payload = {}, dependencies = {}) {
  const input = normalizeSystemRadiusWatchScope(payload);
  assertLiveAllowed('system.radius.watch', input);
  return collectSystemRadiusWatch(input, { ...dependencies, db });
}

async function runMetadataHydrationService(db, payload = {}, dependencies = {}) {
  assertLiveAllowed('metadata.hydration', payload);
  const target = String(payload.target || payload.kind || '').toLowerCase();
  if (target === 'actor') {
    const actor = await resolveActorInput(db, payload, dependencies);
    return hydrateActorReportCandidates(db, {
      entityType: actor.entity_type,
      entityId: actor.entity_id,
      entityName: actor.entity_name
    }, dependencies);
  }
  if (target === 'corporation') {
    const corporation = await resolveActorInput(db, {
      ...payload,
      entityType: 'corporation'
    }, dependencies);
    return hydrateCorporationReportCandidates(db, {
      entityType: 'corporation',
      entityId: corporation.entity_id,
      entityName: corporation.entity_name
    }, dependencies);
  }
  if (target === 'operators' || target === 'system') {
    const systemNameOrId = payload.systemNameOrId || payload.systemName || payload.systemId;
    if (!systemNameOrId) {
      throw new Error('metadata.hydration for operators requires systemNameOrId or systemId');
    }
    return hydrateOperatorReportCandidates(db, systemNameOrId, dependencies);
  }
  throw new Error('metadata.hydration target must be actor, corporation, operators, or system');
}

async function runSdeTopologyImportService(db, payload = {}) {
  const inputPath = payload.path || payload.inputPath;
  if (!inputPath) {
    throw new Error('sde.import.topology requires a local SDE JSONL path');
  }
  return new SdeTopologyImporter(db).importFromPath(inputPath, payload.options || {});
}

async function runSdeInventoryImportService(db, payload = {}) {
  const inputPath = payload.path || payload.inputPath;
  if (!inputPath) {
    throw new Error('sde.import.inventory requires a local SDE JSONL path');
  }
  return new SdeInventoryImporter(db).importFromPath(inputPath, payload.options || {});
}

async function runWatchCreateService(db, payload = {}, dependencies = {}) {
  const actor = await resolveActorInput(db, payload, dependencies);
  return addWatchlistEntity(db, {
    ...payload,
    entityType: actor.entity_type,
    entityId: actor.entity_id,
    entityName: actor.entity_name
  });
}

async function runWatchUpdateService(db, payload = {}, dependencies = {}) {
  return runWatchCreateService(db, payload, dependencies);
}

function runWatchListService(db) {
  return {
    watches: listWatchlistEntities(db)
  };
}

function runWatchScheduleService(db, payload = {}) {
  return buildWatchScheduleStatus(db, payload);
}

function runWatchRecordRunService(db, payload = {}) {
  return recordWatchRunResult(db, payload);
}

async function normalizeManualDiscoveryInput(db, payload, dependencies) {
  if (String(payload.scope || '').toLowerCase() === 'actor') {
    const actor = await resolveActorInput(db, payload, dependencies);
    return normalizeManualDiscoveryScope({
      ...payload,
      trigger: payload.trigger || 'manual',
      entityType: actor.entity_type,
      entityId: actor.entity_id,
      entityName: actor.entity_name
    });
  }
  return normalizeManualDiscoveryScope({
    ...payload,
    trigger: payload.trigger || 'manual'
  });
}

async function resolveActorInput(db, payload = {}, dependencies = {}) {
  return resolveActorIdentity(db, {
    entityType: payload.entityType || payload.entity_type || payload.actorType || payload.actor_type,
    entityId: payload.entityId || payload.entity_id || payload.actorId || payload.actor_id,
    entityName: payload.entityName || payload.entity_name || payload.actorName || payload.actor_name
  }, dependencies);
}

function assertLiveAllowed(action, input = {}) {
  const gate = actionGate(action, input);
  if (!gate.allowed) {
    const blocker = gate.blockers[0] || taxonomyMessage('LIVE_API_DISABLED', `${action} is not allowed`, { source: 'mutating.action' });
    const error = new Error(blocker.message);
    error.code = blocker.code;
    error.details = gate;
    throw error;
  }
  return gate;
}

module.exports = {
  runManualDiscoveryService,
  runManualExpansionService,
  runActorWatchService,
  runSystemRadiusWatchService,
  runMetadataHydrationService,
  runSdeTopologyImportService,
  runSdeInventoryImportService,
  runWatchCreateService,
  runWatchUpdateService,
  runWatchListService,
  runWatchScheduleService,
  runWatchRecordRunService
};
