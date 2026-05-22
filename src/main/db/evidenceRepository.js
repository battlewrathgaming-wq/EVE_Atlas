const crypto = require('node:crypto');

function nowIso() {
  return new Date().toISOString();
}

function json(value) {
  return JSON.stringify(value ?? null);
}

function createRunId(prefix = 'run') {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

class EvidenceRepository {
  constructor(db) {
    this.db = db;
    this.prepareStatements();
  }

  prepareStatements() {
    this.statements = {
      createFetchRun: this.db.prepare(`
        INSERT INTO fetch_runs (
          run_id, trigger, watch_type, watch_id, started_at, status
        ) VALUES (?, ?, ?, ?, ?, ?)
      `),
      finalizeFetchRun: this.db.prepare(`
        UPDATE fetch_runs
        SET finished_at = ?, status = ?, discovered_refs = ?, already_cached = ?,
            expanded_new = ?, failed_expansions = ?, activity_events_written = ?,
            api_calls_zkill = ?, api_calls_esi = ?, duration_ms = ?, error_summary = ?
        WHERE run_id = ?
      `),
      createMetadataRun: this.db.prepare(`
        INSERT INTO metadata_runs (
          run_id, trigger, run_type, target_type, target_id, started_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `),
      finalizeMetadataRun: this.db.prepare(`
        UPDATE metadata_runs
        SET finished_at = ?, status = ?, candidates_considered = ?, ids_discovered = ?,
            already_known = ?, requested_from_esi = ?, resolved = ?, unresolved = ?,
            entities_upserted = ?, types_upserted = ?, activity_events_patched = ?,
            api_calls_esi = ?, duration_ms = ?, warning_summary = ?, error_summary = ?
        WHERE run_id = ?
      `),
      killmailExists: this.db.prepare('SELECT killmail_id FROM killmails WHERE killmail_id = ?'),
      killmailDetails: this.db.prepare(`
        SELECT killmail_id, killmail_hash, killmail_time, solar_system_id, raw_payload_checksum
        FROM killmails
        WHERE killmail_id = ?
      `),
      upsertKillmail: this.db.prepare(`
        INSERT INTO killmails (
          killmail_id, killmail_hash, killmail_time, solar_system_id, raw_esi_payload,
          raw_payload_checksum, source, first_seen_at, last_seen_at, ingested_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(killmail_id) DO UPDATE SET
          last_seen_at = excluded.last_seen_at
      `),
      upsertActivityEvent: this.db.prepare(`
        INSERT INTO activity_events (
          event_key, killmail_id, role, entity_type, entity_id, entity_name,
          character_id, character_name, corporation_id, corporation_name,
          alliance_id, alliance_name, ship_type_id, ship_type_name, weapon_type_id,
          final_blow, damage_done, solar_system_id, solar_system_name, region_id,
          region_name, killmail_time, ingested_at, discovered_by_type,
          discovered_by_id, normalizer_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(event_key) DO NOTHING
      `),
      upsertEntity: this.db.prepare(`
        INSERT INTO entities (
          entity_type, entity_id, entity_name, current_corporation_id,
          current_corporation_name, current_alliance_id, current_alliance_name,
          first_seen_at, last_seen_at, last_enriched_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(entity_type, entity_id) DO UPDATE SET
          entity_name = COALESCE(excluded.entity_name, entities.entity_name),
          current_corporation_id = COALESCE(excluded.current_corporation_id, entities.current_corporation_id),
          current_corporation_name = COALESCE(excluded.current_corporation_name, entities.current_corporation_name),
          current_alliance_id = COALESCE(excluded.current_alliance_id, entities.current_alliance_id),
          current_alliance_name = COALESCE(excluded.current_alliance_name, entities.current_alliance_name),
          last_seen_at = excluded.last_seen_at,
          last_enriched_at = COALESCE(excluded.last_enriched_at, entities.last_enriched_at)
      `),
      insertAudit: this.db.prepare(`
        INSERT OR REPLACE INTO ingestion_audits (
          run_id, killmail_id, raw_payload_checksum, normalized_event_count,
          attacker_count, victim_present, warnings, normalizer_version, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      insertWarning: this.db.prepare(`
        INSERT INTO data_quality_warnings (
          warning_id, run_id, killmail_id, warning_type, message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `),
      insertApiLog: this.db.prepare(`
        INSERT INTO api_request_logs (
          request_id, run_id, run_type, provider, endpoint, method, status_code,
          duration_ms, cache_status, retry_count, rate_limited,
          error_message, requested_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      upsertDiscoveredKillmailRef: this.db.prepare(`
        INSERT INTO discovered_killmail_refs (
          killmail_id, killmail_hash, discovered_by_type, discovered_by_id,
          source_scope, source_system_id, source_actor_type, source_actor_id,
          discovered_at, first_seen_run_id, last_seen_run_id, last_seen_at,
          status, priority
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(killmail_id, killmail_hash, discovered_by_type, discovered_by_id) DO UPDATE SET
          last_seen_run_id = excluded.last_seen_run_id,
          last_seen_at = excluded.last_seen_at,
          priority = excluded.priority,
          status = CASE
            WHEN discovered_killmail_refs.status IN ('expanded', 'cached') THEN discovered_killmail_refs.status
            WHEN discovered_killmail_refs.status = 'failed' THEN discovered_killmail_refs.status
            ELSE excluded.status
          END
      `)
    };
  }

  createFetchRun({ runId = createRunId(), trigger, watchType, watchId = null }) {
    const startedAt = nowIso();
    this.statements.createFetchRun.run(runId, trigger, watchType, watchId, startedAt, 'running');
    return { run_id: runId, started_at: startedAt };
  }

  createMetadataRun({ runId = createRunId('metadata'), trigger, runType, targetType = null, targetId = null }) {
    const startedAt = nowIso();
    this.statements.createMetadataRun.run(runId, trigger, runType, targetType, targetId, startedAt, 'running');
    return { run_id: runId, started_at: startedAt };
  }

  finalizeFetchRun(runId, counts, status = 'success', errorSummary = null) {
    const finishedAt = nowIso();
    const started = this.db.prepare('SELECT started_at FROM fetch_runs WHERE run_id = ?').get(runId);
    const durationMs = started ? Date.parse(finishedAt) - Date.parse(started.started_at) : null;
    this.statements.finalizeFetchRun.run(
      finishedAt,
      status,
      counts.discovered_refs || 0,
      counts.already_cached || 0,
      counts.expanded_new || 0,
      counts.failed_expansions || 0,
      counts.activity_events_written || 0,
      counts.api_calls_zkill || 0,
      counts.api_calls_esi || 0,
      durationMs,
      errorSummary,
      runId
    );
  }

  finalizeMetadataRun(runId, counts, status = 'success', warningSummary = null, errorSummary = null) {
    const finishedAt = nowIso();
    const started = this.db.prepare('SELECT started_at FROM metadata_runs WHERE run_id = ?').get(runId);
    const durationMs = started ? Date.parse(finishedAt) - Date.parse(started.started_at) : null;
    this.statements.finalizeMetadataRun.run(
      finishedAt,
      status,
      counts.candidates_considered || 0,
      counts.ids_discovered || 0,
      counts.already_known || 0,
      counts.requested_from_esi || 0,
      counts.resolved || 0,
      counts.unresolved || 0,
      counts.entities_upserted || 0,
      counts.types_upserted || 0,
      counts.activity_events_patched || 0,
      counts.api_calls_esi || 0,
      durationMs,
      warningSummary,
      errorSummary,
      runId
    );
  }

  hasKillmail(killmailId) {
    return Boolean(this.statements.killmailExists.get(killmailId));
  }

  killmailDetails(killmailId) {
    return this.statements.killmailDetails.get(killmailId);
  }

  persistEvidencePackage(evidencePackage) {
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      let eventsWritten = 0;
      let killmailsWritten = 0;

      for (const killmail of evidencePackage.killmails || []) {
        const existing = this.killmailDetails(killmail.killmail_id);
        if (existing) {
          this.insertKillmailConflictWarnings(evidencePackage.run.run_id, existing, killmail);
        } else {
          killmailsWritten += 1;
        }
        this.upsertKillmail(killmail);
      }

      for (const event of evidencePackage.activity_events || []) {
        const result = this.upsertActivityEvent(event);
        if (result.changes > 0) {
          eventsWritten += 1;
        }
      }

      for (const entity of evidencePackage.entity_updates || []) {
        this.upsertEntity(entity);
      }

      for (const audit of evidencePackage.ingestion_audits || []) {
        this.insertAudit(evidencePackage.run.run_id, audit);
      }

      for (const warning of evidencePackage.warnings || []) {
        this.insertWarning(evidencePackage.run.run_id, warning);
      }

      this.db.exec('COMMIT;');
      return {
        killmailsWritten,
        eventsWritten
      };
    } catch (error) {
      this.db.exec('ROLLBACK;');
      throw error;
    }
  }

  upsertKillmail(killmail) {
    const timestamp = nowIso();
    this.statements.upsertKillmail.run(
      killmail.killmail_id,
      killmail.killmail_hash,
      killmail.killmail_time,
      killmail.solar_system_id,
      json(killmail.raw_esi_payload),
      killmail.raw_payload_checksum,
      killmail.source || 'esi',
      killmail.first_seen_at || timestamp,
      timestamp,
      killmail.ingested_at || timestamp
    );
  }

  insertKillmailConflictWarnings(runId, existing, incoming) {
    const mismatches = [];
    if (existing.raw_payload_checksum !== incoming.raw_payload_checksum) {
      mismatches.push(`checksum ${existing.raw_payload_checksum} != ${incoming.raw_payload_checksum}`);
    }
    if (existing.killmail_hash !== incoming.killmail_hash) {
      mismatches.push(`hash ${existing.killmail_hash} != ${incoming.killmail_hash}`);
    }
    if (existing.killmail_time !== incoming.killmail_time) {
      mismatches.push(`killmail_time ${existing.killmail_time} != ${incoming.killmail_time}`);
    }
    if (existing.solar_system_id !== incoming.solar_system_id) {
      mismatches.push(`solar_system_id ${existing.solar_system_id} != ${incoming.solar_system_id}`);
    }

    if (!mismatches.length) {
      return;
    }

    this.insertWarning(runId, {
      killmail_id: incoming.killmail_id,
      warning_type: 'KILLMAIL_PAYLOAD_CHECKSUM_MISMATCH',
      message: `Existing killmail evidence was preserved for killmail ${incoming.killmail_id}; incoming rediscovery differed: ${mismatches.join('; ')}`,
      created_at: nowIso()
    });
  }

  upsertActivityEvent(event) {
    return this.statements.upsertActivityEvent.run(
      event.event_key,
      event.killmail_id,
      event.role,
      event.entity_type,
      event.entity_id,
      event.entity_name || null,
      event.character_id || null,
      event.character_name || null,
      event.corporation_id || null,
      event.corporation_name || null,
      event.alliance_id || null,
      event.alliance_name || null,
      event.ship_type_id || null,
      event.ship_type_name || null,
      event.weapon_type_id || null,
      event.final_blow ? 1 : 0,
      Number.isFinite(event.damage_done) ? event.damage_done : null,
      event.solar_system_id,
      event.solar_system_name || null,
      event.region_id || null,
      event.region_name || null,
      event.killmail_time,
      event.ingested_at,
      event.discovered_by_type || null,
      event.discovered_by_id || null,
      event.normalizer_version
    );
  }

  upsertEntity(entity) {
    const timestamp = nowIso();
    this.statements.upsertEntity.run(
      entity.entity_type,
      entity.entity_id,
      entity.entity_name || null,
      entity.current_corporation_id || null,
      entity.current_corporation_name || null,
      entity.current_alliance_id || null,
      entity.current_alliance_name || null,
      entity.first_seen_at || timestamp,
      entity.last_seen_at || timestamp,
      entity.last_enriched_at || null
    );
  }

  insertAudit(runId, audit) {
    this.statements.insertAudit.run(
      runId,
      audit.killmail_id,
      audit.raw_payload_checksum,
      audit.normalized_event_count,
      audit.attacker_count,
      audit.victim_present ? 1 : 0,
      json(audit.warnings || []),
      audit.normalizer_version,
      audit.created_at || nowIso()
    );
  }

  insertWarning(runId, warning) {
    this.statements.insertWarning.run(
      warning.warning_id || createRunId('warning'),
      runId,
      warning.killmail_id || null,
      warning.warning_type,
      warning.message,
      warning.created_at || nowIso()
    );
  }

  insertApiRequestLog(log) {
    this.statements.insertApiLog.run(
      log.request_id || createRunId('request'),
      log.run_id || null,
      log.run_type || (log.run_id ? 'collection' : 'unscoped'),
      log.provider,
      log.endpoint,
      log.method,
      log.status_code || null,
      log.duration_ms || null,
      log.cache_status || null,
      log.retry_count || 0,
      log.rate_limited ? 1 : 0,
      log.error_message || null,
      log.requested_at || nowIso()
    );
  }

  upsertDiscoveredKillmailRefs(candidates, context) {
    let written = 0;
    const timestamp = nowIso();
    for (const candidate of candidates || []) {
      if (!candidate.killmail_id || !candidate.hash || ['malformed', 'duplicate'].includes(candidate.skip_reason)) {
        continue;
      }
      const discoveredByType = context.discoveredByType;
      const discoveredById = String(context.discoveredById);
      this.statements.upsertDiscoveredKillmailRef.run(
        candidate.killmail_id,
        candidate.hash,
        discoveredByType,
        discoveredById,
        context.sourceScope || null,
        candidate.source_system_id || context.sourceSystemId || null,
        candidate.source_actor_type || context.sourceActorType || null,
        candidate.source_actor_id || context.sourceActorId || null,
        candidate.discovered_at || timestamp,
        context.runId || null,
        context.runId || null,
        timestamp,
        this.hasKillmail(candidate.killmail_id) ? 'cached' : 'pending',
        candidate.priority || 0
      );
      written += 1;
    }
    return written;
  }

  pendingDiscoveryRefs({ discoveredByType, discoveredById, limit }) {
    return this.db.prepare(`
      SELECT killmail_id, killmail_hash AS hash, priority
      FROM discovered_killmail_refs
      WHERE discovered_by_type = ?
        AND discovered_by_id = ?
        AND status IN ('pending', 'failed')
      ORDER BY status = 'failed', priority ASC, discovered_at ASC, killmail_id ASC
      LIMIT ?
    `).all(discoveredByType, String(discoveredById), limit);
  }

  markDiscoveryRefsSelected(refs, selectedAt = nowIso()) {
    const statement = this.db.prepare(`
      UPDATE discovered_killmail_refs
      SET selected_for_expansion_at = ?
      WHERE killmail_id = ? AND killmail_hash = ?
    `);
    for (const ref of refs || []) {
      statement.run(selectedAt, ref.killmail_id, ref.hash);
    }
  }

  markDiscoveryRefsExpanded(refs, expandedAt = nowIso()) {
    const statement = this.db.prepare(`
      UPDATE discovered_killmail_refs
      SET status = 'expanded', expanded_at = ?, last_error = NULL
      WHERE killmail_id = ? AND killmail_hash = ?
    `);
    for (const ref of refs || []) {
      statement.run(expandedAt, ref.killmail_id, ref.hash);
    }
  }

  markDiscoveryRefsCached(refs) {
    const statement = this.db.prepare(`
      UPDATE discovered_killmail_refs
      SET status = 'cached'
      WHERE killmail_id = ? AND killmail_hash = ?
        AND status != 'expanded'
    `);
    for (const ref of refs || []) {
      statement.run(ref.killmail_id, ref.hash);
    }
  }

  markDiscoveryRefsFailed(warnings, failedAt = nowIso()) {
    const statement = this.db.prepare(`
      UPDATE discovered_killmail_refs
      SET status = 'failed',
          failed_at = ?,
          failure_count = failure_count + 1,
          last_error = ?
      WHERE killmail_id = ?
    `);
    for (const warning of warnings || []) {
      if (warning.warning_type !== 'failed_expansion' || !warning.killmail_id) {
        continue;
      }
      statement.run(failedAt, warning.message || 'ESI expansion failed', warning.killmail_id);
    }
  }

  count(tableName) {
    return this.db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
  }
}

module.exports = {
  EvidenceRepository,
  createRunId,
  nowIso
};
