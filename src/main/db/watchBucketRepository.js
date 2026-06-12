const crypto = require('node:crypto');

class WatchBucketRepository {
  constructor(db) {
    this.db = db;
  }

  listOpenItems(watchType = null) {
    const rows = watchType
      ? this.db.prepare(`
        SELECT *
        FROM watch_bucket_items
        WHERE status = 'open' AND watch_type = ?
        ORDER BY emitted_at, watch_id
      `).all(watchType)
      : this.db.prepare(`
        SELECT *
        FROM watch_bucket_items
        WHERE status = 'open'
        ORDER BY emitted_at, watch_type, watch_id
      `).all();
    return rows.map(rowFromDb);
  }

  listItems() {
    return this.db.prepare(`
      SELECT *
      FROM watch_bucket_items
      ORDER BY emitted_at, watch_type, watch_id, bucket_item_id
    `).all().map(rowFromDb);
  }

  getOpenItem(watchType, watchId) {
    const row = this.db.prepare(`
      SELECT *
      FROM watch_bucket_items
      WHERE status = 'open' AND watch_type = ? AND watch_id = ?
    `).get(watchType, watchId);
    return row ? rowFromDb(row) : null;
  }

  getByWatchRunId(watchRunId) {
    const row = this.db.prepare(`
      SELECT *
      FROM watch_bucket_items
      WHERE watch_run_id = ?
    `).get(watchRunId);
    return row ? rowFromDb(row) : null;
  }

  persistOpenItem(emission) {
    const normalized = normalizeEmission(emission);
    const existingRun = this.getByWatchRunId(normalized.watch_run_id);
    if (existingRun && existingRun.identity_fingerprint !== normalized.identity_fingerprint) {
      return resultFor(normalized, 'integrity_error_watch_run_id_mismatch', 'same_watch_run_id_mismatched_identity', {
        existing_bucket_item: compactItem(existingRun),
        rows_written_to_watch_bucket_items: 0,
        blocked_integrity_status_written: false
      });
    }

    const existingOpen = this.getOpenItem(normalized.watch_type, normalized.watch_id);
    if (existingOpen) {
      if (existingOpen.identity_fingerprint === normalized.identity_fingerprint) {
        return resultFor(normalized, 'idempotent_existing_open_bucket_item', 'same_watch_same_open_identity_already_exists', {
          bucket_item: compactItem(existingOpen),
          rows_written_to_watch_bucket_items: 0
        });
      }
      return resultFor(normalized, 'integrity_conflict_existing_open_bucket_item', 'same_watch_different_open_identity', {
        existing_bucket_item: compactItem(existingOpen),
        rows_written_to_watch_bucket_items: 0,
        blocked_integrity_status_written: false
      });
    }

    this.db.prepare(`
      INSERT INTO watch_bucket_items (
        bucket_item_id, watch_run_id, watch_type, watch_id, source_kind,
        status, emitted_at, updated_at,
        accepted_scope_json, window_json, caps_json, provenance_json,
        identity_fingerprint, pickup_posture, settled_at, receipt_status,
        receipt_summary_json, provider_timing_json, last_error_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      normalized.bucket_item_id,
      normalized.watch_run_id,
      normalized.watch_type,
      normalized.watch_id,
      normalized.source_kind,
      'open',
      normalized.emitted_at,
      normalized.updated_at,
      stableJson(normalized.accepted_scope),
      stableJson(normalized.window),
      stableJson(normalized.caps),
      stableJson(normalized.provenance),
      normalized.identity_fingerprint,
      normalized.pickup_posture,
      null,
      null,
      null,
      null,
      null
    );

    return resultFor(normalized, 'inserted_open_bucket_item', 'no_existing_open_bucket_item', {
      bucket_item: compactItem(this.getByWatchRunId(normalized.watch_run_id)),
      rows_written_to_watch_bucket_items: 1
    });
  }
}

function normalizeEmission(emission = {}) {
  const watchType = emission.watch_type || 'system_radius';
  const watchId = positiveInteger(emission.watch_id, 'watch_id');
  const sourceKind = emission.source_kind || 'watch_system_radius';
  const acceptedScope = emission.accepted_scope || {};
  const window = emission.window || {};
  const caps = emission.caps || {};
  const provenance = emission.provenance || {};
  const emittedAt = window.emitted_at || emission.emitted_at;
  const watchRunId = emission.watch_run_id || watchRunIdFor({
    watchType,
    watchId,
    sourceKind,
    acceptedScope,
    window,
    caps,
    provenance
  });
  const identityFingerprint = identityFingerprintFor({
    watchType,
    watchId,
    sourceKind,
    acceptedScope,
    window,
    caps,
    provenance
  });
  return {
    bucket_item_id: emission.bucket_item_id || `watch-bucket:${watchType}:${watchId}:${identityFingerprint.slice(0, 16)}`,
    watch_run_id: watchRunId,
    watch_type: watchType,
    watch_id: watchId,
    source_kind: sourceKind,
    emitted_at: emittedAt,
    updated_at: emission.updated_at || emittedAt,
    accepted_scope: acceptedScope,
    window,
    caps,
    provenance,
    identity_fingerprint: identityFingerprint,
    pickup_posture: emission.pickup_posture || null
  };
}

function watchRunIdFor(parts) {
  return `watch-run:${parts.watchType}:${parts.watchId}:${identityFingerprintFor(parts).slice(0, 20)}`;
}

function identityFingerprintFor(parts) {
  return crypto
    .createHash('sha256')
    .update(stableJson({
      watch_type: parts.watchType,
      watch_id: parts.watchId,
      source_kind: parts.sourceKind,
      accepted_scope: parts.acceptedScope,
      window: {
        lookback_seconds: parts.window?.lookback_seconds ?? null,
        due_at: parts.window?.due_at || null
      },
      caps: parts.caps,
      provenance: {
        scope_provenance: parts.provenance?.scope_provenance || null,
        watch_scope_key: parts.provenance?.watch_scope_key || null
      }
    }))
    .digest('hex');
}

function resultFor(emission, persistenceResult, reason, extra = {}) {
  return {
    watch_run_id: emission.watch_run_id,
    watch_type: emission.watch_type,
    watch_id: emission.watch_id,
    source_kind: emission.source_kind,
    bucket_status: persistenceResult === 'inserted_open_bucket_item' || persistenceResult === 'idempotent_existing_open_bucket_item'
      ? 'open'
      : 'blocked_integrity',
    persistence_result: persistenceResult,
    reason,
    identity_fingerprint: emission.identity_fingerprint,
    provider_packets: 0,
    discovery_pickup_started: false,
    discovery_refs_written: 0,
    candidate_refs_written: 0,
    evidence_eveidence_written: 0,
    watch_cadence_mutated: false,
    ...extra
  };
}

function compactItem(item = {}) {
  return {
    bucket_item_id: item.bucket_item_id,
    watch_run_id: item.watch_run_id,
    watch_type: item.watch_type,
    watch_id: item.watch_id,
    source_kind: item.source_kind,
    status: item.status,
    emitted_at: item.emitted_at,
    updated_at: item.updated_at,
    identity_fingerprint: item.identity_fingerprint,
    pickup_posture: item.pickup_posture || null,
    accepted_scope: item.accepted_scope,
    window: item.window,
    caps: item.caps,
    provenance: item.provenance
  };
}

function rowFromDb(row = {}) {
  return {
    ...row,
    accepted_scope: parseJson(row.accepted_scope_json, {}),
    window: parseJson(row.window_json, {}),
    caps: parseJson(row.caps_json, {}),
    provenance: parseJson(row.provenance_json, {}),
    receipt_summary: parseJson(row.receipt_summary_json, null),
    provider_timing: parseJson(row.provider_timing_json, null),
    last_error: parseJson(row.last_error_json, null)
  };
}

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return number;
}

function stableJson(value) {
  return JSON.stringify(value);
}

module.exports = {
  WatchBucketRepository,
  identityFingerprintFor,
  watchRunIdFor
};
