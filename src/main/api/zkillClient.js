const ZKILL_BASE_URL = 'https://zkillboard.com/api';

class ZKillDiscoveryClient {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  async discoverRefs({ targetType, targetId, pastSeconds, maxRefs = 100, includePreview = false }) {
    const endpoint = buildZkillDiscoveryEndpoint({ targetType, targetId, pastSeconds });
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

      refs.push({
        killmail_id: killmailId,
        hash,
        ...(includePreview ? { preview: discoveryPreview(row) } : {})
      });
      seen.add(key);

      if (refs.length >= maxRefs) {
        break;
      }
    }

    return refs;
  }
}

function buildZkillDiscoveryEndpoint({ targetType, targetId, pastSeconds }) {
  const modifier = modifierForTarget(targetType);
  const id = Number(targetId);
  const seconds = Number(pastSeconds);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('zKill discovery targetId must be a positive integer');
  }
  if (!Number.isInteger(seconds) || seconds <= 0) {
    throw new Error('zKill discovery pastSeconds must be a positive integer');
  }
  return `${ZKILL_BASE_URL}/${modifier}/${id}/pastSeconds/${seconds}/`;
}

function discoveryPreview(row) {
  return {
    killmail_time: row.killmail_time || null,
    solar_system_id: row.solar_system_id || null,
    victim: row.victim ? {
      character_id: row.victim.character_id || null,
      corporation_id: row.victim.corporation_id || null,
      alliance_id: row.victim.alliance_id || null,
      ship_type_id: row.victim.ship_type_id || null
    } : null,
    attacker_count: Array.isArray(row.attackers) ? row.attackers.length : null,
    zkb: row.zkb ? {
      totalValue: row.zkb.totalValue ?? null,
      points: row.zkb.points ?? null,
      npc: row.zkb.npc ?? null,
      solo: row.zkb.solo ?? null,
      awox: row.zkb.awox ?? null
    } : null
  };
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
  modifierForTarget,
  buildZkillDiscoveryEndpoint,
  discoveryPreview
};
