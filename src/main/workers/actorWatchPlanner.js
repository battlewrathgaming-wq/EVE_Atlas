const VALID_ENTITY_TYPES = new Set(['character', 'corporation', 'alliance']);

const DEFAULTS = {
  lookbackSeconds: 2592000,
  maxRefs: 100,
  maxExpansions: 10
};

function planActorWatch(input) {
  const settings = normalizeInput(input);
  const guardrailWarnings = [];

  if (settings.maxExpansions < settings.maxRefs) {
    guardrailWarnings.push(`Expansion cap ${settings.maxExpansions} is lower than actor discovery cap ${settings.maxRefs}`);
  }

  return {
    input: settings,
    actor: {
      entity_type: settings.entityType,
      entity_id: settings.entityId,
      entity_name: settings.entityName || null
    },
    guardrailWarnings,
    plannedZkillRequests: [{
      provider: 'zkill',
      method: 'GET',
      target_type: settings.entityType,
      target_id: settings.entityId,
      past_seconds: settings.lookbackSeconds,
      max_refs: settings.maxRefs,
      route: `/${routeModifier(settings.entityType)}/${settings.entityId}/pastSeconds/${settings.lookbackSeconds}/`
    }],
    estimatedApiCalls: {
      zkill: 1,
      esi: settings.maxExpansions,
      metadata: 0
    },
    caps: {
      maxRefs: settings.maxRefs,
      maxExpansions: settings.maxExpansions
    }
  };
}

function normalizeInput(input) {
  const entityType = String(input?.entityType || input?.entity_type || '').toLowerCase();
  if (!VALID_ENTITY_TYPES.has(entityType)) {
    throw new Error('entityType must be character, corporation, or alliance');
  }

  return {
    entityType,
    entityId: positiveInteger(input?.entityId ?? input?.entity_id, 'entityId'),
    entityName: input?.entityName || input?.entity_name || null,
    lookbackSeconds: positiveInteger(input?.lookbackSeconds ?? DEFAULTS.lookbackSeconds, 'lookbackSeconds'),
    maxRefs: positiveInteger(input?.maxRefs ?? input?.max_killmails_per_run ?? DEFAULTS.maxRefs, 'maxRefs'),
    maxExpansions: positiveInteger(input?.maxExpansions ?? DEFAULTS.maxExpansions, 'maxExpansions')
  };
}

function routeModifier(entityType) {
  return {
    character: 'characterID',
    corporation: 'corporationID',
    alliance: 'allianceID'
  }[entityType];
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return number;
}

module.exports = {
  planActorWatch,
  DEFAULTS
};
