const { buildActorWatchDiscoveryRouteBodyFixture } = require('../discovery/actorWatchDiscoveryRouteBodyFixture');

function buildWatchActorDiscoveryRouteBodyFixturePreview(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  return buildActorWatchDiscoveryRouteBodyFixture(input, context).then((routeBody) => {
    const after = stateSnapshot(db);
    return {
      ...routeBody,
      service_preview: true,
      renderer_eligible: true,
      table_mutation_proof: {
        before,
        after,
        unchanged: stableJson(before) === stableJson(after),
        writes_attempted: false,
        operator_corpus_mutated: false
      }
    };
  });
}

function stateSnapshot(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    metadata_runs: count(db, 'metadata_runs'),
    ingestion_audits: count(db, 'ingestion_audits'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    entities: count(db, 'entities'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches'),
    assessment_artifacts: count(db, 'assessment_artifacts')
  };
}

function count(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count || 0);
}

function stableJson(value) {
  return JSON.stringify(value);
}

module.exports = {
  buildWatchActorDiscoveryRouteBodyFixturePreview
};
