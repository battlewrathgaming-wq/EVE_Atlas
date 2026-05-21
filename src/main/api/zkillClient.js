const ZKILL_BASE_URL = 'https://zkillboard.com/api';

class ZKillDiscoveryClient {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  async discoverRefs({ targetType, targetId, pastSeconds, maxRefs = 100 }) {
    const modifier = modifierForTarget(targetType);
    const endpoint = `${ZKILL_BASE_URL}/${modifier}/${targetId}/pastSeconds/${pastSeconds}/`;
    const data = await this.httpClient.json('zkill', endpoint);
    const refs = [];
    const seen = new Set();

    for (const row of Array.isArray(data) ? data : []) {
      const killmailId = Number(row.killmail_id);
      const hash = row.zkb?.hash;
      if (!killmailId || !hash) {
        continue;
      }

      const key = `${killmailId}:${hash}`;
      if (seen.has(key)) {
        continue;
      }

      refs.push({ killmail_id: killmailId, hash });
      seen.add(key);

      if (refs.length >= maxRefs) {
        break;
      }
    }

    return refs;
  }
}

function modifierForTarget(targetType) {
  const modifiers = {
    system: 'systemID',
    character: 'characterID',
    corporation: 'corporationID',
    alliance: 'allianceID'
  };

  if (!modifiers[targetType]) {
    throw new Error(`Unsupported zKill target type: ${targetType}`);
  }

  return modifiers[targetType];
}

module.exports = {
  ZKillDiscoveryClient,
  modifierForTarget
};
