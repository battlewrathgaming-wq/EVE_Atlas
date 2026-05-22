const {
  evidenceWindowClause,
  formatEntityLabel,
  formatTypeLabel
} = require('./reportUtils');

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function roleMix(row) {
  if (row.attacker_appearances && row.victim_appearances) {
    return `attacker ${row.attacker_appearances} / victim ${row.victim_appearances}`;
  }
  if (row.attacker_appearances) {
    return `attacker ${row.attacker_appearances}`;
  }
  return `victim ${row.victim_appearances || 0}`;
}

function formatUtcBucket(row) {
  const weekday = WEEKDAYS[Number(row.utc_weekday)] || `day ${row.utc_weekday}`;
  return `${weekday} ${String(row.utc_hour).padStart(2, '0')}:00`;
}

function activityCadenceRows(db, filters, options = {}) {
  const where = buildActivityFilter(filters, options.evidenceWindow, 'ae');
  return db.prepare(`
    SELECT strftime('%w', ae.killmail_time) AS utc_weekday,
           strftime('%H', ae.killmail_time) AS utc_hour,
           SUM(CASE WHEN ae.role = 'attacker' THEN 1 ELSE 0 END) AS attacker_appearances,
           SUM(CASE WHEN ae.role = 'victim' THEN 1 ELSE 0 END) AS victim_appearances,
           COUNT(*) AS appearances,
           COUNT(DISTINCT ae.killmail_id) AS killmails
    FROM activity_events ae
    WHERE ${where.sql}
    GROUP BY strftime('%w', ae.killmail_time), strftime('%H', ae.killmail_time)
    ORDER BY appearances DESC, killmails DESC, utc_weekday ASC, utc_hour ASC
    LIMIT ?
  `).all(...where.params, options.limit || 12);
}

function finalBlowRows(db, filters, options = {}) {
  const where = buildActivityFilter(filters, options.evidenceWindow, 'ae');
  return db.prepare(`
    SELECT ae.character_id,
           MAX(ae.character_name) AS character_name,
           ae.corporation_id,
           MAX(ae.corporation_name) AS corporation_name,
           ae.alliance_id,
           MAX(ae.alliance_name) AS alliance_name,
           ae.ship_type_id,
           COALESCE(MAX(ae.ship_type_name), MAX(tm.type_name)) AS ship_name,
           COUNT(*) AS final_blows,
           SUM(COALESCE(ae.damage_done, 0)) AS damage_done,
           COUNT(DISTINCT ae.solar_system_id) AS unique_systems,
           MIN(ae.killmail_time) AS first_observed,
           MAX(ae.killmail_time) AS last_observed
    FROM activity_events ae
    LEFT JOIN type_metadata tm ON tm.type_id = ae.ship_type_id
    WHERE ${where.sql}
      AND ae.role = 'attacker'
      AND ae.final_blow = 1
    GROUP BY ae.character_id, ae.corporation_id, ae.alliance_id, ae.ship_type_id
    ORDER BY final_blows DESC, damage_done DESC, character_name ASC
    LIMIT ?
  `).all(...where.params, options.limit || 20);
}

function counterpartEntityRows(db, filters, counterpartType, options = {}) {
  const killmailIds = filters.killmailIds || [];
  if (!killmailIds.length) {
    return [];
  }

  const activityWindow = evidenceWindowClause(options.evidenceWindow || {}, 'ae.killmail_time');
  const placeholders = killmailIds.map(() => '?').join(', ');
  const idColumn = counterpartType === 'corporation' ? 'corporation_id' : 'alliance_id';
  const nameColumn = counterpartType === 'corporation' ? 'corporation_name' : 'alliance_name';
  const excludedIds = new Set((filters.excludeIds || []).filter(Boolean));
  const excludeSql = excludedIds.size ? `AND ae.${idColumn} NOT IN (${[...excludedIds].map(() => '?').join(', ')})` : '';
  const params = [
    ...killmailIds,
    ...activityWindow.params,
    ...[...excludedIds]
  ];

  return db.prepare(`
    SELECT ae.${idColumn} AS entity_id,
           MAX(ae.${nameColumn}) AS entity_name,
           SUM(CASE WHEN ae.role = 'attacker' THEN 1 ELSE 0 END) AS attacker_appearances,
           SUM(CASE WHEN ae.role = 'victim' THEN 1 ELSE 0 END) AS victim_appearances,
           COUNT(*) AS appearances,
           COUNT(DISTINCT ae.killmail_id) AS killmails,
           COUNT(DISTINCT ae.solar_system_id) AS unique_systems,
           MIN(ae.killmail_time) AS first_observed,
           MAX(ae.killmail_time) AS last_observed
    FROM activity_events ae
    WHERE ae.killmail_id IN (${placeholders})
      AND ae.${idColumn} IS NOT NULL
      ${activityWindow.sql}
      ${excludeSql}
    GROUP BY ae.${idColumn}
    ORDER BY appearances DESC, killmails DESC, entity_name ASC
    LIMIT ?
  `).all(...params, options.limit || 20)
    .map((row) => ({ ...row, entity_type: counterpartType }));
}

function formatFinalBlowPilot(row) {
  if (row.character_id) {
    return formatEntityLabel(row.character_name, 'character', row.character_id);
  }
  if (row.corporation_id) {
    return formatEntityLabel(row.corporation_name, 'corporation', row.corporation_id);
  }
  if (row.alliance_id) {
    return formatEntityLabel(row.alliance_name, 'alliance', row.alliance_id);
  }
  return 'unresolved attacker';
}

function formatShip(row) {
  return formatTypeLabel(row.ship_name, row.ship_type_id);
}

function buildActivityFilter(filters, evidenceWindow = {}, alias = 'ae') {
  const clauses = [];
  const params = [];
  if (filters.killmailIds?.length) {
    clauses.push(`${alias}.killmail_id IN (${filters.killmailIds.map(() => '?').join(', ')})`);
    params.push(...filters.killmailIds);
  }
  if (filters.entityType) {
    clauses.push(`${alias}.entity_type = ?`);
    params.push(filters.entityType);
  }
  if (filters.entityId) {
    clauses.push(`${alias}.entity_id = ?`);
    params.push(filters.entityId);
  }
  if (filters.corporationId) {
    clauses.push(`${alias}.corporation_id = ?`);
    params.push(filters.corporationId);
  }
  if (filters.characterRowsOnly) {
    clauses.push(`${alias}.entity_type = 'character'`);
  }

  const activityWindow = evidenceWindowClause(evidenceWindow, `${alias}.killmail_time`);
  params.push(...activityWindow.params);
  return {
    sql: `${clauses.length ? clauses.join(' AND ') : '1 = 1'} ${activityWindow.sql}`,
    params
  };
}

module.exports = {
  activityCadenceRows,
  counterpartEntityRows,
  finalBlowRows,
  formatFinalBlowPilot,
  formatShip,
  formatUtcBucket,
  roleMix
};
