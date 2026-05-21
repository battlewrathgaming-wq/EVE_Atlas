const { normalizeKillmail } = require('../normalization/killmailNormalizer');

async function buildEvidencePackageFromRefs({ refs, repository, esiClient, run, discoveredBy }) {
  const output = emptyEvidencePackage(run);
  output.run.discovered_refs = refs.length;

  for (const ref of refs) {
    if (repository.hasKillmail(ref.killmail_id)) {
      output.run.already_cached += 1;
      continue;
    }

    try {
      const rawKillmail = await esiClient.expandKillmail(ref.killmail_id, ref.hash);
      const normalized = normalizeKillmail(rawKillmail, {
        killmailHash: ref.hash,
        discoveredBy
      });

      output.killmails.push(normalized.killmail);
      output.activity_events.push(...normalized.activity_events);
      output.entity_updates.push(...normalized.entity_updates);
      output.ingestion_audits.push(normalized.ingestion_audit);
      output.warnings.push(...normalized.warnings);
      output.run.expanded_count += 1;
    } catch (error) {
      output.run.failed_count += 1;
      output.warnings.push({
        killmail_id: ref.killmail_id,
        warning_type: 'failed_expansion',
        message: error.message,
        created_at: new Date().toISOString()
      });
    }
  }

  return output;
}

function evidencePackageFromExpandedKillmails({ killmails, run, discoveredBy }) {
  const output = emptyEvidencePackage(run);
  output.run.discovered_refs = killmails.length;

  for (const entry of killmails) {
    const normalized = normalizeKillmail(entry.raw, {
      killmailHash: entry.hash,
      discoveredBy
    });

    output.killmails.push(normalized.killmail);
    output.activity_events.push(...normalized.activity_events);
    output.entity_updates.push(...normalized.entity_updates);
    output.ingestion_audits.push(normalized.ingestion_audit);
    output.warnings.push(...normalized.warnings);
    output.run.expanded_count += 1;
  }

  return output;
}

function emptyEvidencePackage(run) {
  return {
    run: {
      run_id: run.run_id,
      source_type: run.source_type,
      source_id: run.source_id,
      started_at: run.started_at,
      finished_at: null,
      discovered_refs: 0,
      already_cached: 0,
      expanded_count: 0,
      failed_count: 0,
      warnings: []
    },
    killmails: [],
    activity_events: [],
    entity_updates: [],
    type_updates: [],
    ingestion_audits: [],
    warnings: []
  };
}

module.exports = {
  buildEvidencePackageFromRefs,
  evidencePackageFromExpandedKillmails
};
