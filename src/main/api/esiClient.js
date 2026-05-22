const ESI_BASE_URL = 'https://esi.evetech.net';

class EsiClient {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  expandKillmail(killmailId, hash) {
    const safeKillmailId = validateKillmailId(killmailId);
    const safeHash = validateKillmailHash(hash);
    return this.httpClient.json('esi', `${ESI_BASE_URL}/latest/killmails/${encodeURIComponent(safeKillmailId)}/${encodeURIComponent(safeHash)}/?datasource=tranquility`);
  }

  resolveIds(names) {
    return this.httpClient.json('esi', `${ESI_BASE_URL}/latest/universe/ids/?datasource=tranquility`, {
      method: 'POST',
      body: JSON.stringify(names)
    });
  }

  resolveNames(ids) {
    const uniqueIds = [...new Set(ids.filter(Boolean).map(Number))];
    if (!uniqueIds.length) {
      return Promise.resolve([]);
    }

    return this.httpClient.json('esi', `${ESI_BASE_URL}/latest/universe/names/?datasource=tranquility`, {
      method: 'POST',
      body: JSON.stringify(uniqueIds)
    });
  }
}

function validateKillmailId(killmailId) {
  const value = Number(killmailId);
  if (!Number.isInteger(value) || value <= 0) {
    const error = new Error('ESI killmail_id must be a positive integer');
    error.code = 'ESI_KILLMAIL_ID_INVALID';
    throw error;
  }
  return String(value);
}

function validateKillmailHash(hash) {
  const value = String(hash || '');
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(value)) {
    const error = new Error('ESI killmail hash must be a safe token');
    error.code = 'ESI_KILLMAIL_HASH_INVALID';
    throw error;
  }
  return value;
}

module.exports = {
  EsiClient,
  validateKillmailId,
  validateKillmailHash
};
