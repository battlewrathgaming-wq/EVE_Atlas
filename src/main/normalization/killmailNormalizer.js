const { NORMALIZER_VERSION } = require('../../shared/constants');
const { checksumPayload } = require('./checksum');

function normalizeKillmail(rawKillmail, options = {}) {
  if (!rawKillmail?.killmail_id) {
    throw new Error('Cannot normalize killmail without killmail_id');
  }

  const ingestedAt = options.ingestedAt || new Date().toISOString();
  const discoveredBy = options.discoveredBy || {};
  const checksum = checksumPayload(rawKillmail);
  const warnings = [];
  const events = [];

  const base = {
    killmail_id: rawKillmail.killmail_id,
    killmail_time: rawKillmail.killmail_time,
    solar_system_id: rawKillmail.solar_system_id,
    solar_system_name: options.systemName || null,
    region_id: options.regionId || null,
    region_name: options.regionName || null,
    ingested_at: ingestedAt,
    discovered_by_type: discoveredBy.type || null,
    discovered_by_id: discoveredBy.id || null,
    normalizer_version: NORMALIZER_VERSION
  };

  if (!rawKillmail.victim) {
    warnings.push(warning(rawKillmail.killmail_id, 'missing_victim', 'Killmail has no victim object'));
  } else {
    events.push(...participantEvents('victim', rawKillmail.victim, base));
  }

  const attackers = Array.isArray(rawKillmail.attackers) ? rawKillmail.attackers : [];
  if (!attackers.length) {
    warnings.push(warning(rawKillmail.killmail_id, 'missing_attackers', 'Killmail has no attackers array'));
  }

  for (const attacker of attackers) {
    if (!attacker.character_id) {
      warnings.push(warning(rawKillmail.killmail_id, 'missing_attacker_character_id', 'Attacker has no character ID; this may be NPC-only evidence'));
    }
    events.push(...participantEvents('attacker', attacker, base));
  }

  const uniqueEvents = dedupeEvents(events);

  return {
    killmail: {
      killmail_id: rawKillmail.killmail_id,
      killmail_hash: options.killmailHash,
      killmail_time: rawKillmail.killmail_time,
      solar_system_id: rawKillmail.solar_system_id,
      raw_esi_payload: rawKillmail,
      raw_payload_checksum: checksum,
      source: 'esi',
      first_seen_at: ingestedAt,
      last_seen_at: ingestedAt,
      ingested_at: ingestedAt
    },
    activity_events: uniqueEvents,
    entity_updates: entityUpdates(uniqueEvents),
    ingestion_audit: {
      killmail_id: rawKillmail.killmail_id,
      raw_payload_checksum: checksum,
      normalized_event_count: uniqueEvents.length,
      attacker_count: attackers.length,
      victim_present: Boolean(rawKillmail.victim),
      warnings: warnings.map((entry) => entry.message),
      normalizer_version: NORMALIZER_VERSION,
      created_at: ingestedAt
    },
    warnings
  };
}

function dedupeEvents(events) {
  const byKey = new Map();
  for (const event of events) {
    if (!byKey.has(event.event_key)) {
      byKey.set(event.event_key, event);
    }
  }
  return [...byKey.values()];
}

function participantEvents(role, participant, base) {
  const rows = [];
  const identities = [
    ['character', participant.character_id, participant.character_name],
    ['corporation', participant.corporation_id, participant.corporation_name],
    ['alliance', participant.alliance_id, participant.alliance_name]
  ];

  for (const [entityType, entityId, entityName] of identities) {
    if (!entityId) {
      continue;
    }

    rows.push({
      ...base,
      event_key: `${base.killmail_id}:${role}:${entityType}:${entityId}`,
      role,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName || null,
      character_id: participant.character_id || null,
      character_name: participant.character_name || null,
      corporation_id: participant.corporation_id || null,
      corporation_name: participant.corporation_name || null,
      alliance_id: participant.alliance_id || null,
      alliance_name: participant.alliance_name || null,
      ship_type_id: participant.ship_type_id || null,
      ship_type_name: participant.ship_type_name || null,
      weapon_type_id: participant.weapon_type_id || null,
      final_blow: Boolean(participant.final_blow),
      damage_done: participant.damage_done ?? null
    });
  }

  return rows;
}

function entityUpdates(events) {
  const byKey = new Map();

  for (const event of events) {
    const key = `${event.entity_type}:${event.entity_id}`;
    byKey.set(key, {
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      entity_name: event.entity_name,
      current_corporation_id: event.entity_type === 'character' ? event.corporation_id : null,
      current_corporation_name: event.entity_type === 'character' ? event.corporation_name : null,
      current_alliance_id: event.entity_type === 'character' || event.entity_type === 'corporation' ? event.alliance_id : null,
      current_alliance_name: event.entity_type === 'character' || event.entity_type === 'corporation' ? event.alliance_name : null,
      first_seen_at: event.killmail_time,
      last_seen_at: event.killmail_time
    });
  }

  return [...byKey.values()];
}

function warning(killmailId, warningType, message) {
  return {
    killmail_id: killmailId,
    warning_type: warningType,
    message,
    created_at: new Date().toISOString()
  };
}

module.exports = {
  normalizeKillmail
};
