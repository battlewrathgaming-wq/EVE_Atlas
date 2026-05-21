const ESI_BASE_URL = 'https://esi.evetech.net';

class EsiClient {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  expandKillmail(killmailId, hash) {
    return this.httpClient.json('esi', `${ESI_BASE_URL}/latest/killmails/${killmailId}/${hash}/?datasource=tranquility`);
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

module.exports = {
  EsiClient
};
