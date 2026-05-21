const {
  parsePastSeconds,
  parseSystemId,
  formatWindow,
  table,
  printSection,
  sampleStatus,
  formatSystemLabel
} = require('./reportUtils');

function buildRunReport(db, runId) {
  const run = db.prepare('SELECT * FROM fetch_runs WHERE run_id = ?').get(runId);
  if (!run) {
    throw new Error(`No fetch_run found for ${runId}`);
  }

  const zkillLogs = db.prepare(`
    SELECT endpoint, status_code, duration_ms, requested_at
    FROM api_request_logs
    WHERE run_id = ? AND provider = 'zkill'
    ORDER BY requested_at
  `).all(runId);
  const esiLogs = db.prepare(`
    SELECT endpoint, status_code, duration_ms, requested_at
    FROM api_request_logs
    WHERE run_id = ? AND provider = 'esi'
    ORDER BY requested_at
  `).all(runId);
  const pastSeconds = parsePastSeconds(zkillLogs[0]?.endpoint);
  const systemId = parseSystemId(zkillLogs[0]?.endpoint);
  const system = systemId ? db.prepare('SELECT * FROM solar_systems WHERE solar_system_id = ?').get(systemId) : null;
  const killmails = db.prepare(`
    SELECT killmail_id, killmail_time, solar_system_id
    FROM killmails
    WHERE killmail_id IN (SELECT killmail_id FROM ingestion_audits WHERE run_id = ?)
    ORDER BY killmail_time DESC, killmail_id DESC
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
  const status = sampleStatus({
    expandedCount: run.expanded_new,
    discoveredRefs: run.discovered_refs,
    failedExpansions: run.failed_expansions
  });

  return [
    `AURA Atlas Run Report - ${status}`,
    `Run ID: ${run.run_id}`,
    `Watch: ${run.watch_type} / ${run.watch_id || 'n/a'}`,
    `System: ${system ? formatSystemLabel(system.solar_system_name, system.solar_system_id) : systemId ? formatSystemLabel(null, systemId) : 'unknown'}`,
    `Region/Constellation: ${system?.region_name || 'unknown'} / ${system?.constellation_name || 'unknown'}`,
    `Discovery window: ${formatWindow(pastSeconds)}`,
    `Collection run timestamp: ${run.started_at} -> ${run.finished_at || 'not finished'}`,
    `zKill route: ${zkillLogs[0]?.endpoint || 'unknown'}`,
    `Expanded evidence range: ${range.earliest || 'none'} -> ${range.latest || 'none'}`,
    `Expanded sample: ${run.expanded_new} expanded / ${run.discovered_refs} discovered refs; ${run.failed_expansions} failed`,
    printSection('Evidence Footer', [
      `Systems scanned: ${zkillLogs.length}`,
      `zKill refs discovered: ${run.discovered_refs}`,
      `Already cached: ${run.already_cached}`,
      `Expanded new: ${run.expanded_new}`,
      `Failed expansions: ${run.failed_expansions}`,
      `Activity events written: ${run.activity_events_written}`,
      'Source: zKill discovery + ESI expanded killmails'
    ].join('\n')),
    printSection('Killmail Timeline', table(killmails, [
      { label: 'Time', value: (row) => row.killmail_time },
      { label: 'Killmail', value: (row) => row.killmail_id },
      { label: 'System', value: (row) => formatSystemLabel(system?.solar_system_name, row.solar_system_id) }
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
    printSection('Warnings', warnings.length ? warnings.map((warning) => `${warning.warning_type}: ${warning.message}`).join('\n') : '(none)'),
    `\nStored events in this run's expanded sample: ${eventCount}`
  ].join('\n');
}

module.exports = {
  buildRunReport
};
