const ENDPOINT_INVENTORY = {
  zkill_discovery: {
    route_class: 'external-live-discovery',
    provider: 'zkill',
    allowed_protocols: ['https:'],
    allowed_hosts: ['zkillboard.com'],
    live_gate: 'manual.discovery'
  },
  esi_killmail_expansion: {
    route_class: 'external-live-evidence-expansion',
    provider: 'esi',
    allowed_protocols: ['https:'],
    allowed_hosts: ['esi.evetech.net'],
    live_gate: 'manual.expansion'
  },
  esi_universe_names: {
    route_class: 'external-live-metadata-hydration',
    provider: 'esi',
    allowed_protocols: ['https:'],
    allowed_hosts: ['esi.evetech.net'],
    live_gate: 'metadata.hydration'
  },
  sde_lookup_download: {
    route_class: 'external-operator-sde-source-download',
    provider: 'ccp-sde',
    allowed_protocols: ['https:'],
    allowed_hosts: ['developers.eveonline.com'],
    live_gate: 'sde.build-lookups'
  },
  diagnostics_readiness: {
    route_class: 'local-diagnostics',
    provider: 'local',
    allowed_protocols: [],
    allowed_hosts: [],
    live_gate: null
  },
  future_export_sync: {
    route_class: 'reserved-external-sync',
    provider: 'reserved',
    allowed_protocols: ['https:'],
    allowed_hosts: [],
    live_gate: 'future.explicit-sync'
  }
};

function endpointPolicy(name) {
  const policy = ENDPOINT_INVENTORY[name];
  if (!policy) {
    const error = new Error(`Unknown endpoint policy: ${name}`);
    error.code = 'UNKNOWN_ENDPOINT_POLICY';
    throw error;
  }
  return policy;
}

function validateEndpointUrl(url, policyName) {
  const policy = endpointPolicy(policyName);
  const parsed = new URL(url);
  if (!policy.allowed_protocols.includes(parsed.protocol)) {
    const error = new Error(`${policyName} denied protocol ${parsed.protocol}`);
    error.code = 'ENDPOINT_PROTOCOL_DENIED';
    throw error;
  }
  if (policy.allowed_hosts.length && !policy.allowed_hosts.includes(parsed.hostname)) {
    const error = new Error(`${policyName} denied host ${parsed.hostname}`);
    error.code = 'ENDPOINT_HOST_DENIED';
    throw error;
  }
  return parsed;
}

function routeDiagnostics(policyName, state, extra = {}) {
  const policy = endpointPolicy(policyName);
  return {
    route_class: policy.route_class,
    provider: policy.provider,
    status: state,
    live_gate: policy.live_gate,
    ...extra
  };
}

module.exports = {
  ENDPOINT_INVENTORY,
  endpointPolicy,
  validateEndpointUrl,
  routeDiagnostics
};
