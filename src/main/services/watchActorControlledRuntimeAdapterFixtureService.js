const { buildActorWatchControlledRuntimeAdapterFixtureProof } = require('../discovery/actorWatchControlledRuntimeAdapterFixture');

async function buildWatchActorControlledRuntimeAdapterFixturePreview(db, input = {}) {
  const before = db ? stateSnapshot(db) : null;
  const proof = await buildActorWatchControlledRuntimeAdapterFixtureProof(input);
  const after = db ? stateSnapshot(db) : null;
  return {
    ...proof,
    service_preview: true,
    renderer_eligible: false,
    operator_corpus_non_mutation_proof: {
      operator_db_available: Boolean(db),
      before,
      after,
      unchanged: before && after ? stableJson(before) === stableJson(after) : true,
      operator_db_written: false,
      proof_db_path: ':memory:',
      disposable_db_only: true
    }
  };
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
  buildWatchActorControlledRuntimeAdapterFixturePreview
};
