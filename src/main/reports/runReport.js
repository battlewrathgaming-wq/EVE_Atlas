const {
  parsePastSeconds,
  parseSystemId,
  formatWindow,
  table,
  printSection,
  formatSystemLabel,
  formatEntityLabel
} = require('./reportUtils');

function buildRunReport(db, runId) {
  const run = db.prepare('SELECT * FROM fetch_runs WHERE run_id = ?').get(runId);
  if (!run) {
    throw new Error(`No fetch_run found for ${runId}`);
  }

  const zkillLogs = db.prepare(`
    SELECT endpoint, status_code, duration_ms, cache_status, retry_count, rate_limited, error_message, requested_at
    FROM api_request_logs
    WHERE run_id = ? AND provider = 'zkill'
    ORDER BY requested_at
  `).all(runId);
  const esiLogs = db.prepare(`
    SELECT endpoint, status_code, duration_ms, cache_status, retry_count, rate_limited, error_message, requested_at
    FROM api_request_logs
    WHERE run_id = ? AND provider = 'esi'
    ORDER BY requested_at
  `).all(runId);
  const pastSeconds = parsePastSeconds(zkillLogs[0]?.endpoint);
  const systemId = parseSystemId(zkillLogs[0]?.endpoint);
  const actorTarget = parseActorTarget(zkillLogs[0]?.endpoint) || parseWatchActor(run);
  const system = systemId ? db.prepare('SELECT * FROM solar_systems WHERE solar_system_id = ?').get(systemId) : null;
  const actor = actorTarget ? resolveActor(db, actorTarget) : null;
  const killmails = db.prepare(`
    SELECT k.killmail_id, k.killmail_time, k.solar_system_id, ss.solar_system_name, ss.region_name
    FROM killmails k
    LEFT JOIN solar_systems ss ON ss.solar_system_id = k.solar_system_id
    WHERE k.killmail_id IN (SELECT killmail_id FROM ingestion_audits WHERE run_id = ?)
    ORDER BY k.killmail_time DESC, k.killmail_id DESC
  `).all(runId);
  const eventCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM activity_events
    WHERE killmail_id IN (SELECT killmail_id FROM ingestion_audits WHERE run_id = ?)
  `).get(runId).count;
  const warnings = db.prepare(`
    SELECT warning_type, message
    FROM data_quality_warnings
    WHERE run_id = ?
    ORDER BY created_at
  `).all(runId);
  const roleSplit = db.prepare(`
    SELECT role, COUNT(*) AS count
    FROM activity_events
    WHERE killmail_id IN (SELECT killmail_id FROM ingestion_audits WHERE run_id = ?)
    GROUP BY role
    ORDER BY role
  `).all(runId);
  const apiCalls = db.prepare(`
    SELECT provider, COUNT(*) AS count, SUM(duration_ms) AS duration_ms
    FROM api_request_logs
    WHERE run_id = ?
    GROUP BY provider
    ORDER BY provider
  `).all(runId);
  const range = db.prepare(`
    SELECT MIN(killmail_time) AS earliest, MAX(killmail_time) AS latest
    FROM killmails
    WHERE killmail_id IN (SELECT killmail_id FROM ingestion_audits WHERE run_id = ?)
  `).get(runId);
  const zkillSystemIds = zkillLogs
    .map((log) => parseSystemId(log.endpoint))
    .filter(Boolean);
  const systemRows = zkillSystemIds.length ? db.prepare(`
    SELECT solar_system_id, solar_system_name, constellation_name, region_name
    FROM solar_systems
    WHERE solar_system_id IN (${zkillSystemIds.map(() => '?').join(', ')})
    ORDER BY solar_system_name
  `).all(...zkillSystemIds) : [];
  const partialReasons = partialSampleReasons(run);
  const status = runSampleStatus(run);

  return [
    `AURA Atlas Run Report - ${status}`,
    `Run ID: ${run.run_id}`,
    `Run status: ${run.status}`,
    `Watch: ${run.watch_type} / ${run.watch_id || 'n/a'}`,
    `Collection target: ${collectionTargetLabel(system, systemId, actor, actorTarget)}`,
    `First zKill system: ${system ? formatSystemLabel(system.solar_system_name, system.solar_system_id) : systemId ? formatSystemLabel(null, systemId) : 'unknown'}`,
    `First zKill actor: ${actor ? formatEntityLabel(actor.entity_name, actor.entity_type, actor.entity_id) : actorTarget ? formatEntityLabel(null, actorTarget.entity_type, actorTarget.entity_id) : 'unknown'}`,
    `First zKill geography: ${system?.region_name || 'unknown'} / ${system?.constellation_name || 'unknown'}`,
    `Discovery window: ${formatWindow(pastSeconds)}`,
    `Collection run timestamp: ${run.started_at} -> ${run.finished_at || 'not finished'}`,
    `Duration: ${run.duration_ms ?? 'unknown'} ms`,
    `zKill route(s): ${zkillLogs.length || 0}`,
    `Expanded evidence range: ${range.earliest || 'none'} -> ${range.latest || 'none'}`,
    `Expanded sample: ${run.expanded_new} expanded / ${run.discovered_refs} discovered refs; ${run.failed_expansions} failed`,
    `Coverage note: ${coverageNote(run, partialReasons)}`,
    printSection('Diagnostics Summary', [
      `zKill requests: ${zkillLogs.length}`,
      `zKill refs discovered: ${run.discovered_refs}`,
      `Already cached killmails: ${run.already_cached}`,
      `New ESI expansions: ${run.expanded_new}`,
      `Failed expansions: ${run.failed_expansions}`,
      `Activity events written: ${run.activity_events_written}`,
      `API calls by provider: zkill ${zkillLogs.length} / esi ${esiLogs.length}`,
      `Error summary: ${run.error_summary || 'none'}`
    ].join('\n')),
    printSection('Evidence Footer', [
      `zKill requests: ${zkillLogs.length}`,
      `zKill refs discovered: ${run.discovered_refs}`,
      `Already cached: ${run.already_cached}`,
      `Expanded new: ${run.expanded_new}`,
      `Failed expansions: ${run.failed_expansions}`,
      `Activity events written: ${run.activity_events_written}`,
      'Source: zKill discovery + ESI expanded killmails'
    ].join('\n')),
    printSection('Systems Scanned', table(systemRows, [
      { label: 'System', value: (row) => formatSystemLabel(row.solar_system_name, row.solar_system_id) },
      { label: 'Constellation', value: (row) => row.constellation_name || 'unknown' },
      { label: 'Region', value: (row) => row.region_name || 'unknown' }
    ])),
    printSection('Killmail Timeline', table(killmails, [
      { label: 'Time', value: (row) => row.killmail_time },
      { label: 'Killmail', value: (row) => row.killmail_id },
      { label: 'System', value: (row) => formatSystemLabel(row.solar_system_name, row.solar_system_id) },
      { label: 'Region', value: (row) => row.region_name || 'unknown' }
    ])),
    printSection('Participant Role Split', table(roleSplit, [
      { label: 'Role', value: (row) => row.role },
      { label: 'Events', value: (row) => row.count }
    ])),
    printSection('API Calls', table(apiCalls, [
      { label: 'Provider', value: (row) => row.provider },
      { label: 'Calls', value: (row) => row.count },
      { label: 'Duration ms', value: (row) => row.duration_ms || 0 }
    ])),
    printSection('Collection Routes', table(routeRows(db, zkillLogs), [
      { label: 'Route Type', value: (row) => row.route_type },
      { label: 'Target', value: (row) => row.target },
      { label: 'Window', value: (row) => formatWindow(row.past_seconds) },
      { label: 'Requests', value: (row) => row.requests }
    ])),
    printSection('zKill Requests', table(zkillLogs, requestColumns())),
    printSection('ESI Requests', table(esiLogs, requestColumns())),
    printSection('Warnings', warnings.length ? warnings.map((warning) => `${warning.warning_type}: ${warning.message}`).join('\n') : '(none)'),
    `\nStored events in this run's expanded sample: ${eventCount}`
  ].join('\n');
}

function parseActorTarget(endpoint) {
  const text = String(endpoint || '');
  const match = text.match(/\/(characterID|corporationID|allianceID)\/(\d+)\//);
  if (!match) {
    return null;
  }
  const entityType = {
    characterID: 'character',
    corporationID: 'corporation',
    allianceID: 'alliance'
  }[match[1]];
  return {
    entity_type: entityType,
    entity_id: Number(match[2])
  };
}

function parseWatchActor(run) {
  if (run.watch_type !== 'actor') {
    return null;
  }
  const match = String(run.watch_id || '').match(/^actor:(character|corporation|alliance):(\d+)$/);
  if (!match) {
    return null;
  }
  return {
    entity_type: match[1],
    entity_id: Number(match[2])
  };
}

function resolveActor(db, actorTarget) {
  const known = db.prepare(`
    SELECT entity_name
    FROM entities
    WHERE entity_type = ? AND entity_id = ?
  `).get(actorTarget.entity_type, actorTarget.entity_id);
  const watchlisted = db.prepare(`
    SELECT entity_name
    FROM watchlist_entities
    WHERE entity_type = ? AND entity_id = ?
  `).get(actorTarget.entity_type, actorTarget.entity_id);

  return {
    ...actorTarget,
    entity_name: known?.entity_name || watchlisted?.entity_name || null
  };
}

function collectionTargetLabel(system, systemId, actor, actorTarget) {
  if (actor) {
    return formatEntityLabel(actor.entity_name, actor.entity_type, actor.entity_id);
  }
  if (actorTarget) {
    return formatEntityLabel(null, actorTarget.entity_type, actorTarget.entity_id);
  }
  if (system) {
    return formatSystemLabel(system.solar_system_name, system.solar_system_id);
  }
  if (systemId) {
    return formatSystemLabel(null, systemId);
  }
  return 'unknown';
}

function routeRows(db, zkillLogs) {
  const grouped = new Map();
  for (const log of zkillLogs) {
    const systemId = parseSystemId(log.endpoint);
    const actorTarget = parseActorTarget(log.endpoint);
    const actor = actorTarget ? resolveActor(db, actorTarget) : null;
    const system = systemId ? db.prepare('SELECT solar_system_name FROM solar_systems WHERE solar_system_id = ?').get(systemId) : null;
    const pastSeconds = parsePastSeconds(log.endpoint);
    const routeType = actorTarget?.entity_type || (systemId ? 'system' : 'unknown');
    const target = actor
      ? formatEntityLabel(actor.entity_name, actor.entity_type, actor.entity_id)
      : systemId ? formatSystemLabel(system?.solar_system_name, systemId) : 'unknown';
    const key = `${routeType}:${target}:${pastSeconds || 'unknown'}`;
    const existing = grouped.get(key) || {
      route_type: routeType,
      target,
      past_seconds: pastSeconds,
      requests: 0
    };
    existing.requests += 1;
    grouped.set(key, existing);
  }
  return [...grouped.values()];
}

function partialSampleReasons(run) {
  const reasons = [];
  if (run.failed_expansions > 0) {
    reasons.push(`${run.failed_expansions} expansion failure${run.failed_expansions === 1 ? '' : 's'}`);
  }
  if (run.error_summary && /Expansion cap skipped/i.test(run.error_summary)) {
    reasons.push('expansion cap skipped refs');
  }
  if (run.expanded_new + run.failed_expansions + run.already_cached < run.discovered_refs) {
    reasons.push('not all discovered refs are represented in this run sample');
  }
  return reasons;
}

function coverageNote(run, partialReasons) {
  if (partialReasons.length) {
    return partialReasons.join('; ');
  }
  if (!run.discovered_refs && run.expanded_new > 0) {
    return 'expanded refs from local pending discovery queue; no live zKill discovery was needed for this run';
  }
  if (run.already_cached > 0) {
    return 'all discovered refs are represented by cached or newly expanded evidence for this run';
  }
  return 'all discovered refs expanded successfully for this run';
}

function runSampleStatus(run) {
  if (!run.discovered_refs) {
    if (run.expanded_new > 0 || run.already_cached > 0) {
      return 'PENDING REF EXPANSION';
    }
    return 'NO DISCOVERY SAMPLE';
  }
  if (run.failed_expansions > 0) {
    return 'PARTIAL SAMPLE';
  }
  if (run.expanded_new + run.already_cached < run.discovered_refs) {
    return 'PARTIAL SAMPLE';
  }
  if (run.already_cached > 0) {
    return 'COMPLETE LOCAL SAMPLE';
  }
  return 'COMPLETE EXPANDED SAMPLE';
}

function requestColumns() {
  return [
    { label: 'Time', value: (row) => row.requested_at },
    { label: 'Status', value: (row) => row.status_code ?? 'n/a' },
    { label: 'Duration', value: (row) => row.duration_ms ?? 'n/a' },
    { label: 'Cache', value: (row) => row.cache_status || 'n/a' },
    { label: 'Retries', value: (row) => row.retry_count || 0 },
    { label: 'Rate Limited', value: (row) => row.rate_limited ? 'yes' : 'no' },
    { label: 'Endpoint', value: (row) => row.endpoint },
    { label: 'Error', value: (row) => row.error_message || '' }
  ];
}

module.exports = {
  buildRunReport
};
