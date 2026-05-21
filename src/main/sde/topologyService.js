class TopologyService {
  constructor(db) {
    this.db = db;
    this.neighborsStatement = db.prepare(`
      SELECT to_system_id
      FROM system_adjacency
      WHERE from_system_id = ? AND connection_type = ?
      ORDER BY to_system_id
    `);
    this.systemExistsStatement = db.prepare('SELECT solar_system_id FROM solar_systems WHERE solar_system_id = ?');
    this.systemDetailsStatement = db.prepare(`
      SELECT solar_system_id, solar_system_name, constellation_id, constellation_name,
             region_id, region_name, security_status
      FROM solar_systems
      WHERE solar_system_id = ?
    `);
  }

  getSystemsWithinRadius(centerSystemId, radiusJumps, options = {}) {
    const center = Number(centerSystemId);
    const radius = Number(radiusJumps);
    const maxRadius = options.maxRadius ?? 5;
    const maxSystems = options.maxSystems ?? 100;
    const excluded = new Set((options.excludedSystemIds || []).map(Number));

    if (!Number.isInteger(center) || center <= 0) {
      throw new Error(`Invalid center system ID: ${centerSystemId}`);
    }

    if (!this.systemExistsStatement.get(center)) {
      throw new Error(`Unknown center system ID: ${center}`);
    }

    if (!Number.isInteger(radius) || radius < 0) {
      throw new Error(`Invalid radius: ${radiusJumps}`);
    }

    if (radius > maxRadius) {
      throw new Error(`Radius ${radius} exceeds guard max ${maxRadius}`);
    }

    const visited = new Set();
    const queue = [{ systemId: center, depth: 0 }];

    while (queue.length) {
      const current = queue.shift();
      if (visited.has(current.systemId) || excluded.has(current.systemId)) {
        continue;
      }

      visited.add(current.systemId);
      if (visited.size > maxSystems) {
        throw new Error(`Radius result exceeds guard max ${maxSystems} systems`);
      }

      if (current.depth >= radius) {
        continue;
      }

      for (const row of this.neighborsStatement.all(current.systemId, 'stargate')) {
        if (!visited.has(row.to_system_id)) {
          queue.push({ systemId: row.to_system_id, depth: current.depth + 1 });
        }
      }
    }

    return [...visited].sort((a, b) => a - b);
  }

  getSystemDetails(systemId) {
    return this.systemDetailsStatement.get(Number(systemId)) || null;
  }
}

module.exports = {
  TopologyService
};
