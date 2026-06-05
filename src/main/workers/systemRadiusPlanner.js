const DEFAULTS = {
  lookbackSeconds: 86400,
  maxSystems: 10,
  maxRefsPerSystem: 10,
  maxExpansions: 50,
  maxRadius: 5,
  maxTopologySystems: 100
};

function planSystemRadiusWatch(input, { topologyService }) {
  if (!topologyService) {
    throw new Error('planSystemRadiusWatch requires a topologyService');
  }

  const settings = normalizeInput(input);
  const guardrailWarnings = [];
  const skippedSystems = [];
  const usesStoredWatchScope = settings.acceptedSystemIds.length > 0;
  const allSystemIds = usesStoredWatchScope
    ? settings.acceptedSystemIds
    : topologyService.getSystemsWithinRadius(
      settings.centerSystemId,
      settings.radiusJumps,
      {
        excludedSystemIds: settings.excludedSystemIds,
        maxRadius: settings.maxRadius,
        maxSystems: settings.maxTopologySystems
      }
    );

  let plannedSystemIds = allSystemIds;
  if (!usesStoredWatchScope && allSystemIds.length > settings.maxSystems) {
    plannedSystemIds = allSystemIds.slice(0, settings.maxSystems);
    const skippedIds = allSystemIds.slice(settings.maxSystems);
    for (const systemId of skippedIds) {
      skippedSystems.push(systemSummary(topologyService, systemId, 'max_systems'));
    }
    guardrailWarnings.push(`System radius produced ${allSystemIds.length} systems; capped at ${settings.maxSystems}`);
  }

  if (settings.maxExpansions < settings.maxSystems * settings.maxRefsPerSystem) {
    guardrailWarnings.push(`Expansion cap ${settings.maxExpansions} is lower than planned discovery cap ${settings.maxSystems * settings.maxRefsPerSystem}`);
  }

  const includedSystems = plannedSystemIds.map((systemId) => systemSummary(topologyService, systemId));
  const plannedZkillRequests = includedSystems.map((system) => ({
    provider: 'zkill',
    method: 'GET',
    target_type: 'system',
    target_id: system.solar_system_id,
    past_seconds: settings.lookbackSeconds,
    max_refs: settings.maxRefsPerSystem,
    route: `/systemID/${system.solar_system_id}/pastSeconds/${settings.lookbackSeconds}/`
  }));

  return {
    input: settings,
    scopeAuthority: usesStoredWatchScope ? {
      source: 'stored_watch_scope',
      uses_stored_included_system_ids: true,
      recomputed_topology_used_as_authority: false,
      center_radius_role: 'provenance_and_explanation',
      accepted_system_ids: settings.acceptedSystemIds,
      provenance: settings.acceptedScopeProvenance
    } : {
      source: 'center_radius_planner',
      uses_stored_included_system_ids: false,
      recomputed_topology_used_as_authority: true,
      center_radius_role: 'direct_manual_execution_authority',
      accepted_system_ids: []
    },
    includedSystems,
    skippedSystems,
    guardrailWarnings,
    plannedZkillRequests,
    estimatedApiCalls: {
      zkill: plannedZkillRequests.length,
      esi: settings.maxExpansions,
      metadata: 0
    },
    caps: {
      maxSystems: usesStoredWatchScope ? includedSystems.length : settings.maxSystems,
      maxRefsPerSystem: settings.maxRefsPerSystem,
      maxExpansions: settings.maxExpansions
    }
  };
}

function normalizeInput(input) {
  const centerSystemId = positiveInteger(input?.centerSystemId, 'centerSystemId');
  const radiusJumps = nonNegativeInteger(input?.radiusJumps ?? 1, 'radiusJumps');
  const lookbackSeconds = positiveInteger(input?.lookbackSeconds ?? DEFAULTS.lookbackSeconds, 'lookbackSeconds');
  const maxSystems = positiveInteger(input?.maxSystems ?? DEFAULTS.maxSystems, 'maxSystems');
  const maxRefsPerSystem = positiveInteger(input?.maxRefsPerSystem ?? DEFAULTS.maxRefsPerSystem, 'maxRefsPerSystem');
  const maxExpansions = positiveInteger(input?.maxExpansions ?? DEFAULTS.maxExpansions, 'maxExpansions');
  const maxRadius = positiveInteger(input?.maxRadius ?? DEFAULTS.maxRadius, 'maxRadius');
  const maxTopologySystems = positiveInteger(input?.maxTopologySystems ?? DEFAULTS.maxTopologySystems, 'maxTopologySystems');
  const excludedSystemIds = [...new Set((input?.excludedSystemIds || []).map((id) => positiveInteger(id, 'excludedSystemIds')))];
  const acceptedSystemIds = normalizeAcceptedSystemIds(input?.acceptedSystemIds || input?.includedSystemIds || []);

  return {
    centerSystemId,
    radiusJumps,
    lookbackSeconds,
    maxSystems,
    maxRefsPerSystem,
    maxExpansions,
    maxRadius,
    maxTopologySystems,
    excludedSystemIds,
    acceptedSystemIds,
    acceptedScopeSource: input?.acceptedScopeSource || null,
    acceptedScopeProvenance: input?.acceptedScopeProvenance || null
  };
}

function normalizeAcceptedSystemIds(value) {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error('acceptedSystemIds must be an array when supplied');
  }
  return [...new Set(value.map((id) => positiveInteger(id, 'acceptedSystemIds')))];
}

function systemSummary(topologyService, systemId, skippedReason = null) {
  const details = topologyService.getSystemDetails(systemId);
  const summary = {
    solar_system_id: systemId,
    solar_system_name: details?.solar_system_name || null,
    constellation_id: details?.constellation_id || null,
    constellation_name: details?.constellation_name || null,
    region_id: details?.region_id || null,
    region_name: details?.region_name || null,
    security_status: details?.security_status ?? null
  };

  if (skippedReason) {
    summary.skipped_reason = skippedReason;
  }

  return summary;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return number;
}

function nonNegativeInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return number;
}

module.exports = {
  planSystemRadiusWatch,
  DEFAULTS
};
