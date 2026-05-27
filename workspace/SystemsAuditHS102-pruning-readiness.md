# Systems Audit HS102: Pruning Readiness

Date: 2026-05-27
Role: Atlas Systems Auditor
Focus: Pruning Readiness Audit
Scope: Advisory audit only. No code or schema changes were made.

## Executive summary

Atlas is not ready for destructive pruning execution, but it is ready to preview several pruning impacts from existing local data.

Current implementation has a read-only `retention.preflight` service that can estimate impact for:

- scoped Evidence/EVEidence pruning by selected killmail ID, actor/entity ID, system ID, and `before` / `after` time windows
- Discovery queue expiration by status and `last_seen_at`
- API log pruning by `requested_at`
- metadata run pruning by `started_at`
- disposable runtime DB deletion as a non-executing note
- assessment compaction preview from actor-scoped evidence

The strongest current pruning support is preview-only. `evidence.prune_scope` reports affected `killmails`, `activity_events`, `ingestion_audits`, `data_quality_warnings`, and related `assessment_artifacts` references. It also repeats accepted deletion policy: execution is blocked, retained deletion footprint is rejected, snapshots/backups are separate support artifacts, and Assessment Memory is mutable/stale after evidence deletion but not a deletion blocker.

The largest readiness gaps are not query feasibility; they are relationship semantics and safe execution design. The schema has foreign keys from `activity_events` and `ingestion_audits` to `killmails`, but no `ON DELETE` cascade. `data_quality_warnings` are run-linked and sometimes killmail-linked, queue refs are provenance/staging rather than Evidence, `fetch_runs` and `api_request_logs` explain provenance across many rows, and Assessment Memory intentionally snapshots references that can outlive Evidence. A future pruning packet must define delete ordering, transaction behavior, preview-to-execution consistency, and operator warnings before deleting any active records.

No destructive Dev packet is ready. The smallest safe next packet is a read-only pruning relationship preview hardening packet, not deletion execution.

## Files reviewed

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `docs/index.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/report-scope-contract.md`
- `docs/features/evidence-compaction-to-assessment.md`
- `docs/features/entity-interest-artifacts.md`
- `docs/features/persistent-discovery-ref-queue.md`
- `docs/features/presentation-layer-information-index.md`
- `docs/schemas/activity-event.md`
- `docs/schemas/killmail-evidence.md`
- `docs/statements/retention-and-deprecation-policy.md`
- `docs/terms/entity-interest.md`
- `docs/terms/marked.md`
- `docs/terms/watchlist.md`
- `docs/runbooks/local-alpha-trial.md`
- `docs/runbooks/local-alpha-known-limits-and-feedback.md`
- `docs/runbooks/local-alpha-release-tag-checklist.md`
- `src/main/db/schema.sql`
- `src/main/services/retentionActionService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/runtimeSnapshotService.js`
- `src/main/assessment/assessmentArtifactRepository.js`
- `src/main/support/operatorDebugTracePack.js`
- `src/main/reports/corpusHealthReport.js`
- `scripts/verify-retention-preflight.js`
- `scripts/verify-retention-deletion-boundary.js`
- `scripts/verify-assessment-artifacts.js`
- `scripts/verify-runtime-db-snapshot.js`
- `package.json`

## Current implementation map

### Pruning actions currently modeled

`src/main/services/retentionActionService.js` defines these retention actions:

- `diagnostics.prune_api_logs`: destructive diagnostic class, preview counts `api_request_logs` older than `scope.before`.
- `metadata.prune_runs`: destructive metadata class, preview counts `metadata_runs` older than `scope.before`.
- `queue.expire_refs`: destructive ephemeral-queue class, preview counts `discovered_killmail_refs` filtered by `last_seen_at < scope.before` and/or `status`.
- `runtime.delete_disposable_db`: destructive runtime class, preview returns a database path note only; no file deletion.
- `evidence.prune_scope`: destructive evidence class, preview counts selected active Evidence/EVEidence rows and related rows; execution blocked.
- `assessment.compact_from_evidence`: assessment-creating class, preview builds an Assessment Memory input from scoped evidence; it does not delete evidence or create the artifact by itself.

`serviceRegistry` exposes `retention.actions` and `retention.preflight` only. There is no executable `evidence.prune_scope` service command.

### Age / time-window pruning feasibility

Current preview support:

- Evidence scope supports `before` and `after` against `killmails.killmail_time`.
- Assessment compaction preview supports `before` and `after` against `activity_events.killmail_time`.
- Queue refs support `before` against `discovered_killmail_refs.last_seen_at`.
- API logs support `before` against `api_request_logs.requested_at`.
- Metadata runs support `before` against `metadata_runs.started_at`.

Current limitations:

- Time-window behavior is preview-only.
- There is no unified pruning window model shared across all data classes.
- There are no operator-facing presets such as one month / two months.
- `fetch_runs`, `ingestion_audits`, warnings, and snapshots/support artifacts do not yet have a complete time-window pruning model.

### Entity ID pruning feasibility

Current preview support:

- `evidence.prune_scope` supports actor scope through `activity_events.entity_type` + `activity_events.entity_id`.
- `assessment.compact_from_evidence` supports typed actor scope and can summarize appearances, systems, regions, ships, source run IDs, and sample killmail IDs.
- `assessment_artifacts` can be listed by entity type / ID.
- Reports already use actor/system/radius/corporation evidence windows, so the query foundation exists.

Current limitations:

- There is no general entity deletion/pruning service.
- No prune preview currently groups by corporation/alliance relationship impact beyond affected rows and Assessment Memory references.
- `entities`, `entity_dispositions`, `watchlist_entities`, and Assessment Memory have separate meanings that should not be silently pruned just because an entity’s evidence is pruned.

### Marked / no-interest signals

Current durable signals:

- `watchlist_entities` is legacy/internal state for actor watch intent and can be presented as Marked when meaning is attention.
- `assessment_artifacts` can record `entity_interest`, `evidence_compaction`, and `analyst_note`.
- `entity_dispositions` exists in schema with `friendly`, `neutral`, `hostile`, and `ignored`, but this audit did not find active service/UI behavior for it.

Current limitations:

- There is no explicit `marked` table.
- There is no implemented no-interest pruning predicate.
- Marked/Watch semantics are accepted in docs, but no pruning service consumes them.
- `Watch -> Marked` and `Marked does not imply Watch` must be preserved; pruning must not treat watched or marked state as evidence.

### Discovery refs as metadata / provenance

Current support:

- `discovered_killmail_refs` stores zKill refs with `killmail_id`, `killmail_hash`, scope identity, source actor/system fields, timestamps, status, priority, failure count/error, and preview JSON.
- Queue statuses are `pending`, `expanded`, `cached`, `failed`, and `superseded`.
- `queue.expire_refs` preflight can count refs by age/status.
- Discovery refs are explicitly documented as staging/provenance metadata, not Evidence/EVEidence.

Current warnings:

- Queue refs may be provenance for how Evidence entered Atlas.
- Pending refs may still represent future local work; deleting them changes what Atlas can later enrich without rediscovery.
- Expanded/cached refs may be lower-risk to prune than pending/failed refs, but exact policy is not implemented.
- Queue refs are scoped by collection route; pruning them must not blur Discovery/Evidence or Watch/Sequencer state.

### Evidence/EVEidence rows and activity events

Current support:

- `killmails` are the authoritative expanded ESI payloads, deduped by `killmail_id`.
- `activity_events` are derived query rows with FK to `killmails`.
- `evidence.prune_scope` can count candidate killmails and linked activity events.
- Verification simulates deletion in disposable DBs by deleting `activity_events`, `ingestion_audits`, warnings, then `killmails`.

Current warnings:

- Actual deletion execution is not implemented.
- Schema FKs do not specify cascade, so deleting `killmails` first would violate integrity if dependent rows remain.
- Reports, corpus health, Observation surfaces, and Assessment citation review depend on these rows.
- Raw ESI payloads must not be replaced by retained footprint or hidden copies.

### Assessment references

Current support:

- `assessment_artifacts` store Assessment Memory with evidence window, source report/run context, sample killmail IDs, citation status/details, appearance counts, observed systems/regions/ships, status, scores, reason/summary, and assessed_by.
- Assessment creation validates cited killmail IDs and actor scope at creation time.
- Retention preflight scans `sample_killmail_ids_json` and reports affected Assessment Memory references.
- Tests prove Assessment Memory can survive simulated Evidence deletion and retain its creation-time citation status.

Current warnings:

- Assessment Memory is not a deletion blocker.
- Assessment Memory becomes stale after Evidence deletion.
- Creation-time citation status does not automatically change if evidence is later deleted.
- Future pruning UI must clearly show affected assessments and stale-citation consequences.

### Snapshots and support artifacts

Current support:

- `runtime.db_snapshot.preflight` is read-only and reports destination, source DB, WAL/SHM state, projected size, budget, table counts, latest fetch run, latest evidence timestamp, and assessment counts.
- `runtime.db_snapshot.create` explicitly writes a SQLite support artifact and does not prune/delete Evidence.
- Snapshot settings can persist a validated destination and budget; over-budget creation is blocked.
- Debug trace packs summarize runtime/readiness/corpus/queue/log state, exclude raw ESI payloads by default, and are support/debug artifacts.

Current warnings:

- Snapshots/backups may retain records removed from active storage unless separately cleaned.
- Snapshot/support artifact pruning is not implemented.
- Support artifact budget exists for snapshots, but broader storage-budget/pruning accounting is future work.

### Provenance and logs

Current support:

- `fetch_runs` summarize collection runs.
- `api_request_logs` preserve provider call audit detail.
- `ingestion_audits` preserve normalization audits per run/killmail.
- `data_quality_warnings` preserve warnings by run and sometimes killmail.
- Corpus health and trace packs read these tables for partial-success and support status.

Current limitations:

- Only `api_request_logs` and `metadata_runs` have dedicated pruning preview actions.
- There is no implemented pruning policy for `fetch_runs`, `ingestion_audits`, or `data_quality_warnings` separate from scoped Evidence impact.
- Warnings are linked by `run_id`; deleting warning rows for one killmail in a multi-killmail run needs careful design.

### Reports and read models

Reports are currently computed from local tables rather than persisted read-model tables. That makes report/read-model pruning mostly unnecessary today. Future persisted Observation snapshots or read models would need their own pruning classification.

## Accepted direction map

Durable docs already establish these rules:

- Evidence/EVEidence is expanded ESI killmail data plus Atlas-derived activity events.
- Discovery refs are possible leads and staging/provenance, not Evidence.
- Observation reports derive from stored Evidence/EVEidence and must not hide evidence because of disposition or watchlist state.
- Assessment Memory is deliberate operator judgment, mutable/disposable after Evidence deletion, not Evidence, and not a deletion blocker.
- Runtime snapshots, trace packs, logs, readiness reports, and debug artifacts are support/readout material.
- Deletion of active local records should be absolute; retained deletion footprint is rejected.
- Snapshots/backups must be disclosed as separate historical support artifacts.
- Deletion preflight remains read-only until a future bounded deletion execution packet is explicitly opened.
- Pruning should become a suite: variable time window, no-interest/Marked filtering, entity ID filtering, and Assessment reference review.
- Noise means stale or excessive records that no longer serve target hunting, threat detection, or current behavior pattern recognition.

## Gaps / risks

1. No destructive pruning execution exists, and that is correct for now.

   Current code intentionally exposes preview only. Future deletion needs separate authority, disposable destructive tests, and a precise transaction plan.

2. Delete ordering is not encoded.

   For Evidence deletion, dependent rows must be deleted before `killmails`: `activity_events`, `ingestion_audits`, and likely warning rows tied to affected runs/killmails. The schema does not provide cascade semantics.

3. Run-level provenance can span many evidence records.

   `fetch_runs`, `api_request_logs`, and `data_quality_warnings` may describe mixed outcomes. Pruning one killmail’s Evidence can leave run summaries that mention counts including deleted rows unless policy defines whether to retain, redact, recompute, or mark provenance stale.

4. Assessment references are detectable but not live-updated.

   Preflight can warn about affected Assessment Memory references, but assessment artifacts preserve creation-time citation status and snapshots. Future deletion must decide whether to leave them as stale, update status, or append review metadata.

5. Marked/no-interest pruning is not implemented.

   There is no first-class Marked persistence model. `watchlist_entities`, Assessment Memory, and `entity_dispositions.ignored` are adjacent signals but not yet a safe no-interest pruning rule.

6. Discovery ref pruning policy is incomplete.

   Queue refs are metadata/provenance, but pending/failed/expanded/cached refs carry different recovery meanings. Existing preview can count them, not decide which are safe to expire.

7. Snapshot/support artifact cleanup is separate and currently absent.

   Active-record deletion would not remove snapshots or trace packs. The operator must be shown that old support artifacts may retain deleted records.

8. Preview-to-execution race is unresolved.

   A future destructive action must guarantee the executed deletion matches the reviewed preview or revalidate immediately before commit.

9. Relationship warnings need better grouping.

   Current impact counts are useful but not enough for operator trust. Future preview should group by affected Evidence, Assessment Memory, Watch/Marked context, Discovery refs, provenance/logs, and support artifact disclosure.

## Suggested bounded next packet

No destructive Dev packet is ready.

Smallest safe next packet:

Read-only pruning relationship preview hardening.

Acceptance shape:

- Keep `retention.preflight` read-only.
- Add richer relationship groups for `evidence.prune_scope` without deletion:
  - selected Evidence rows
  - derived activity events
  - ingestion audits
  - warnings
  - queue refs sharing selected killmail IDs
  - affected Assessment Memory references
  - Watch/Marked-adjacent rows where determinable
  - provenance/log summaries
  - snapshot/support-artifact disclosure
- Add no execution command.
- Add no schema migration unless Human/Overseer explicitly choose to model Marked/no-interest state first.
- Add verification for preview immutability and relationship counts across selected killmail, actor/entity ID, system, and before/after windows.

Deletion execution should remain blocked until Human/Overseer answer the relationship and stale-assessment decisions below.

## Verification suggestions

Relevant existing non-live commands:

```powershell
npm.cmd run verify:retention-preflight
npm.cmd run verify:retention-deletion-boundary
npm.cmd run verify:assessment-artifacts
npm.cmd run verify:runtime-snapshot
npm.cmd run verify:corpus-health
npm.cmd run verify:queue-report
npm.cmd run verify:queue-preflight
npm.cmd run verify:db-integrity
npm.cmd run verify:evidence-rules
npm.cmd run verify:service-registry
npm.cmd run verify:controlled-workflow
```

Suggested future targeted checks:

- Preflight by `killmailId` reports killmail, activity event, audit, warning, queue ref, provenance, and Assessment Memory relationships without mutation.
- Preflight by actor/entity ID reports the full set of distinct affected killmails and relationship groups.
- Preflight by system/time window reports only matching Evidence/EVEidence and does not use queue refs as observations.
- Queue expiration preview distinguishes pending, failed, cached, expanded, and superseded refs.
- Assessment Memory reference warning survives malformed or partial `sample_killmail_ids_json`.
- Snapshot/support artifact disclosure appears on every active-record pruning preview.
- No executable prune command is renderer-eligible or registered before the explicit deletion packet.
- Any future destructive fixture test deletes in safe dependency order and proves no orphan `activity_events`, `ingestion_audits`, or warning relationships remain.

## Human / Overseer decisions needed

- Should first pruning execution ever delete Evidence/EVEidence, or should the next work stay preview-only until storage path/budget authority is complete?
- What is the first accepted no-interest signal: absence of Marked, explicit ignored disposition, archived/cooling Assessment Memory, or a new Marked model?
- Should stale Assessment Memory be automatically marked after Evidence deletion, or only warned in preflight?
- Which Discovery refs are safe to expire independently: expanded/cached only, failed after review, pending after Watch interval expiry, or another policy?
- Should provenance/logs be retained as aggregate history after Evidence deletion, redacted, recomputed, or pruned with evidence?
- Should support artifact pruning be designed before active Evidence deletion, given snapshots can retain deleted records?
- What operator grouping is preferred for preview: time window, entity, Watch scope, Observation story impact, or storage budget impact?

## No code changed

This artifact is advisory. No source code, schema, runtime configuration, `workspace/current.md`, or Dev runway was changed. No live/API/private/provider calls were run.
