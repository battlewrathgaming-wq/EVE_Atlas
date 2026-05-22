function resolveSystemIdentity(db, input = {}) {
  if (!db) {
    throw new Error('resolveSystemIdentity requires a db');
  }

  const systemId = input.systemId ?? input.centerSystemId ?? input.solarSystemId;
  const systemName = input.systemName ?? input.centerSystemName ?? input.name;

  if (systemId !== undefined && systemId !== null && systemId !== '') {
    return resolveSystemById(db, systemId);
  }

  if (systemName !== undefined && systemName !== null && String(systemName).trim()) {
    return resolveSystemByName(db, systemName);
  }

  throw new Error('System resolution requires a system ID or exact system name');
}

function resolveSystemById(db, rawId) {
  const systemId = Number(rawId);
  if (!Number.isInteger(systemId) || systemId <= 0) {
    throw new Error('System ID must be a positive integer');
  }
  const row = systemRowById(db, systemId);
  if (!row) {
    throw new Error(`System ID ${systemId} was not found in local SDE topology`);
  }
  return systemResult(row, 'id');
}

function resolveSystemByName(db, rawName) {
  const name = String(rawName || '').trim();
  const rows = db.prepare(`
    SELECT solar_system_id, solar_system_name, constellation_id, constellation_name,
           region_id, region_name, security_status
    FROM solar_systems
    WHERE lower(solar_system_name) = lower(?)
    ORDER BY solar_system_name, solar_system_id
  `).all(name);

  if (rows.length === 0) {
    throw new Error(`System "${name}" was not found in local SDE topology`);
  }
  if (rows.length > 1) {
    const candidates = rows.map((row) => `${row.solar_system_name} [solarSystemID: ${row.solar_system_id}]`).join(', ');
    throw new Error(`System "${name}" matched multiple local systems: ${candidates}`);
  }
  return systemResult(rows[0], 'name');
}

function systemRowById(db, systemId) {
  return db.prepare(`
    SELECT solar_system_id, solar_system_name, constellation_id, constellation_name,
           region_id, region_name, security_status
    FROM solar_systems
    WHERE solar_system_id = ?
  `).get(systemId) || null;
}

function systemResult(row, resolvedBy) {
  return {
    solar_system_id: row.solar_system_id,
    solar_system_name: row.solar_system_name,
    constellation_id: row.constellation_id,
    constellation_name: row.constellation_name,
    region_id: row.region_id,
    region_name: row.region_name,
    security_status: row.security_status,
    resolved_by: resolvedBy,
    source: 'local_sde_topology'
  };
}

module.exports = {
  resolveSystemIdentity
};
