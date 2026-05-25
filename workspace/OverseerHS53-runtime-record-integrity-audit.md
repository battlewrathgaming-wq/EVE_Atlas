# OverseerHS53 - Runtime And Record Integrity Audit

Date: 2026-05-25
Role: Atlas Engineering Audit / Overseer Review
Status: complete read-only audit

## Request Received

The Human asked for the active read-only audit packet in `workspace/current.md` to be executed from `F:\Projects\AURA-Atlas`, producing this handoff. The audit was to inspect runtime, queue, Watch, enrichment, storage, provenance, deletion/retention, and restart/recovery behavior; run the focused offline verification set; avoid implementation, live API checks, destructive actions, real user data mutation, schema/persistence/bridge/IPC/service/payload/command/UI changes; and separate implemented behavior from HS52 design input and proposed policy.

## Executive Answer

Discovery becomes Evidence only when an accepted ESI expansion path returns a full killmail, Atlas normalizes it, and `persistEvidencePackage` writes the expanded record to `killmails` plus derived `activity_events`, `ingestion_audits`, entity updates, and warnings. zKill refs and preview data remain Discovery/provenance in `discovered_killmail_refs`.

`Enrich selected` is implemented as `manual.expansion`: it selects queued refs, calls ESI for selected uncached refs, writes new expanded ESI killmails and derived activity events, updates queue status to `expanded` / `cached` / `failed`, records a `fetch_runs` summary, and records ESI request logs. It does not mutate existing raw ESI payloads beyond updating `killmails.last_seen_at`; checksum/hash/time/system mismatches are warning-only and preserve the existing stored evidence.

Offline hydration exists only for known local labels and local lookup/SDE report joins. `metadata.hydration` itself is live-gated because unresolved entity names call ESI `/universe/names/`; however its first phase can patch report labels from existing `entities` rows without live resolution. System/type labels in reports can hydrate from local SDE tables. Offline Discovery draining also exists for pending queue refs in actor/system Watch collectors, skipping zKill discovery when scoped pending refs are already present.

Provenance is split across `fetch_runs`, `api_request_logs`, `ingestion_audits`, `data_quality_warnings`, discovery ref source fields, metadata runs, and report joins. Assessment Memory is separately stored in `assessment_artifacts`, can cite local killmail IDs and source run IDs, and validation prevents cited missing killmails or actor-scope mismatch from being silently accepted.

Partial provider failure is mostly contained per stage: zKill request failures become warnings and the run may continue with other requests; ESI expansion failures become `failed_expansion` warnings and queue refs become `failed`; persistence is transaction-wrapped so a failed write rolls back the evidence package. Cancellation/timeouts abort rather than becoming partial evidence. Runs can still finalize as `success` with warnings and nonzero failed counts when some refs fail.

Queue and Watch definitions are persistent in SQLite, but task/executor state is not. Discovery queue rows, watch rows, schedule timestamps, backoff, and last success/error survive restart. `TaskRunner` task history, active locks, cancellation state, and `WatchSessionExecutor.sessionArmed` are in memory only. After restart, Watches can be due but remain blocked by `session_not_armed` until the user explicitly arms the session.

Deletion/retention execution is not implemented as product capability. Current behavior is read-only preflight/impact preview plus explicit snapshot creation under project-local paths. HS52's possible broad deletion plus footprint file idea is design input only and is not implemented or accepted policy.

## Files And Code Paths Reviewed

Authority and current-state:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/OverseerHS52-runtime-record-integrity-design-input.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
- `docs/contracts/assessment-compaction-contract.md`
- `docs/contracts/session-armed-watch-executor-contract.md`

Implementation:

- `src/main/db/schema.sql`
- `src/main/db/evidenceRepository.js`
- `src/main/workers/manualDiscoveryWorker.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/watchlist/watchlistRepository.js`
- `src/main/metadata/reportHydrator.js`
- `src/main/assessment/assessmentArtifactRepository.js`
- `src/main/services/liveApiGateService.js`
- `src/main/services/mutatingActionService.js`
- `src/main/services/queueSelectionService.js`
- `src/main/services/retentionActionService.js`
- `src/main/services/runtimeSnapshotService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/taskRunner.js`
- `src/main/api/httpClient.js`
- `package.json`

## Record Lifecycle Trace

1. Discovery packet/ref

   - Manual discovery and routine Watch discovery receive zKill refs containing `killmail_id`, hash, source scope, optional preview, priority, and discovered time.
   - Refs are stored in `discovered_killmail_refs` with source fields such as `discovered_by_type`, `discovered_by_id`, `source_scope`, `source_system_id`, `source_actor_type`, and `source_actor_id`.
   - Queue refs are Discovery/provenance only. They do not create `killmails` or `activity_events`.

2. Gate

   - Renderer service commands require confirmation tokens for live/evidence-affecting actions.
   - Live actions are blocked unless `AURA_ATLAS_LIVE_API=1` and a User-Agent exists.
   - `queue.selection`, reports, schedule status, readiness, and preflights are read-only.

3. Evidence write

   - Evidence creation happens in `manual.expansion`, `actor.watch`, and `system.radius.watch` after ESI expansion.
   - `buildEvidencePackageFromRefs` skips already cached killmails, calls `esiClient.expandKillmail` for selected refs, normalizes full ESI payloads, and accumulates killmails, activity events, entity updates, ingestion audits, and warnings.
   - `EvidenceRepository.persistEvidencePackage` writes the evidence package inside `BEGIN IMMEDIATE` / `COMMIT`; on error it rolls back.
   - `killmails.raw_esi_payload` stores the full raw ESI payload and checksum. `activity_events` stores derived evidence events with discovered-by fields.

4. Enrichment / hydration

   - `manual.expansion` is evidence enrichment/creation: selected queued refs become expanded ESI killmail evidence when ESI succeeds.
   - Repeated expansion of an already cached killmail does not overwrite raw payload; existing `killmails` receive only `last_seen_at` update, and conflicting incoming payload details are recorded as warnings.
   - `metadata.hydration` is readability-only label work. It uses `metadata_runs`, patches null names in `activity_events`, upserts names in `entities`, and does not mutate raw killmail payloads or numeric IDs.
   - Offline-known hydration is limited: known `entities` rows can patch missing names; report joins can use local `solar_systems` and `type_metadata`; unresolved entity names require live ESI and are gated.

5. Provenance attachment

   - `fetch_runs` records collection trigger, watch type/id, run status, counts, duration, API call counts, and error summary.
   - `api_request_logs` records provider, endpoint, method, status, duration, retry count, rate limit, and error message for zKill/ESI calls.
   - `ingestion_audits` links run IDs to killmail IDs, checksums, normalized event counts, attacker/victim counts, warnings, and normalizer version.
   - `data_quality_warnings` records run-scoped warnings, including manual discovery boundary notes and failed expansions.
   - `metadata_runs` separately records label-refresh/hydration provenance.

6. Assessment linkage

   - `assessment_artifacts` stores Assessment Memory separately from Evidence.
   - Artifacts can record source report type/parameters, source run IDs, sample killmail IDs, evidence window/scope, appearance counts, observed systems/regions/ships, and assessed-by metadata.
   - Citation validation verifies cited local killmail IDs and, for entity/evidence compaction artifacts, verifies the actor appears in cited local activity events.
   - Assessment artifacts do not replace or delete raw evidence.

7. Deletion / footprint behavior

   - No executable evidence deletion or pruning path is implemented.
   - `retention.preflight` calculates impact and confirmation requirements only; it does not delete.
   - `assessment.compact_from_evidence` preflight builds a read-only assessment preview; actual pruning remains blocked.
   - No implemented footprint file remains after deletion because deletion itself is not implemented.

8. Stale / refresh behavior

   - Staleness is visible mostly through timestamps: `last_seen_at`, `last_polled_at`, `next_poll_at`, `last_success_at`, `last_error_at`, `backoff_until`, `metadata_runs`, and latest fetch/evidence timestamps.
   - There is no accepted automatic stale-record refresh policy. HS52's "information becomes stale" note remains design input/open policy.

## Runtime / Queue / Watch Trace

1. External API gate

   - `live.gate` and `assertLiveAllowed` block live-required actions unless live API is enabled and User-Agent is configured.
   - A service-level confirmation token is also required from renderer for manual discovery, manual expansion, metadata hydration, Watch arming, Watch authoring, assessment creation, snapshots, and task cancellation where applicable.

2. Task / queue state

   - Queue state is persisted in `discovered_killmail_refs`.
   - Queue preview is read-only and returns evidence boundary copy, selected refs, expected ESI call counts, status counts, preview fields, and skip reasons.
   - `TaskRunner` state is in-memory only, capped by history limit, and not persisted across restart.

3. Provider call or offline hydration

   - Manual discovery calls zKill and queues refs only.
   - Manual expansion calls ESI for selected uncached queued refs.
   - Actor/system Watch collection first drains scoped pending refs if present, skipping zKill discovery, then expands selected refs through ESI. If no pending refs exist, it discovers through zKill first.
   - Metadata hydration can patch from local known labels first, then calls ESI for unresolved IDs if allowed.

4. Partial failure handling

   - zKill discovery failures per request are warning-only and do not necessarily abort the whole run.
   - ESI expansion failures per ref produce `failed_expansion` warnings, mark queue refs failed, and allow other selected refs to persist.
   - HTTP timeouts/cancellation are non-retryable and abort the action/task.
   - HTTP retry statuses 420, 429, and 503 are retried up to the configured attempt limit.
   - Evidence package persistence is atomic, but fetch run finalization and queue status updates happen around that package rather than inside one global transaction.

5. Watch cadence / lookback

   - Actor watches store `lookback_days`, `max_killmails_per_run`, `poll_interval_minutes`, active flag, next poll, last success/error, and backoff.
   - System/radius watches store center system, radius, included/excluded systems, `lookback_hours`, `max_systems_per_run`, `max_killmails_per_run`, poll interval, active flag, next poll, success/error, and backoff.
   - Executor dispatch payloads derive from stored watch rows and enforce one due watch per tick and one active evidence task at a time.

6. Restart / recovery

   - Persistent: Discovery queue, Watch definitions, next poll/backoff/success/error timestamps, fetch/API/metadata/assessment/evidence records.
   - Volatile: task history, active task locks, executor `sessionArmed`, interval timer, active task pointer, last tick/dispatch/blocked reason.
   - Restart behavior matches the session-armed contract: Watches can still be due, but execution stays blocked until the operator arms the session again.

7. Renderer / user-facing status

   - Renderer-eligible services expose read-only queue selection, Watch schedule/status, executor arm/disarm/status, manual discovery/expansion as confirmed tasks, metadata hydration, reports, readiness, snapshot preflight/create, assessment create/list/get, and task history.
   - Direct `actor.watch`, `system.radius.watch`, `watch.recordRun`, and `watch.executor.tick` are not renderer-eligible; Watch execution is routed through the session executor.

## Implemented Behavior Confirmed

- zKill refs and previews are Discovery/provenance, not Evidence.
- Evidence is stored only from expanded ESI killmails and derived activity events.
- Manual discovery queues refs only and records an explicit warning that no ESI expansion was attempted.
- Manual expansion is explicit, selects pending/failed queue refs, records selection time, expands through ESI, persists evidence atomically, and updates queue statuses.
- Existing raw ESI payloads are preserved on rediscovery; conflicts create warnings instead of overwrites.
- Metadata hydration is separate from evidence creation and records `metadata_runs`.
- Assessment Memory is separate from Evidence and validates citations.
- API/fetch provenance is stored and reportable.
- Watch authoring is metadata-only; Watch execution is session-armed, live-gated, capped, and task-wrapped.
- Watch schedule metadata survives restart; executor armed state does not.
- Retention/destructive behavior is preflight-only; snapshot creation is explicit support artifact creation, not deletion/retention.

## HS52 Design Input Not Implemented

- Broad deletion with a footprint file containing `[id]` and `[interest]` is not implemented and is not accepted policy.
- A general stale/refresh policy is not implemented.
- "Enrichment is a pipeline" is partly true in the broad architecture, but the visible command split is precise: `manual.expansion` creates evidence; `metadata.hydration` refreshes labels; offline-known label patching is limited.
- Watch background collection exists only after explicit session arming and live/API gates; it is not an always-on live feed.
- Partial failure hardening is implemented for common provider/ref-level failures, but there is not one unified durable failure/retry state machine across every run phase.

## Unknowns / Needs Decision

- Whether Atlas should ever support evidence deletion, and if so what footprint survives.
- Whether queue ref expiration should preserve any aggregate failure/history record before deleting queue rows.
- What "stale" means for evidence, Discovery refs, metadata labels, fetch/API logs, and assessments.
- Whether `External API` remains the durable UI phrase or becomes Lab-translatable later.
- Whether metadata hydration should expose an explicitly offline-only mode that patches known local labels without attempting ESI.
- Whether fetch run finalization plus queue status updates should be transactionally coupled more tightly around evidence persistence.

## Risks And Gaps

- Discovery/Evidence boundary is currently strong in code and docs, but UI copy must keep pairing `Enrich selected` with ESI expansion/evidence creation to avoid label-refresh confusion.
- Offline enrichment expectations can overrun implementation. Known local labels and SDE joins are offline; unresolved entity names still require live ESI.
- Partial API failures are survivable, but runs can finalize as `success` with warnings and failed counts. Operator display should keep partial success visible.
- Queue rows are durable and scoped, but failed/pending refs can persist indefinitely without an accepted stale/expiration policy.
- Watch state is split between persistent schedule rows and volatile executor/task state. This is intentional, but support/debug displays should keep "session not armed" and "last run/backoff" clear after restart.
- Retention preflight names destructive actions, but no action execution exists. Any future UI must not imply deletion is available.
- Snapshot creation writes a support artifact under project-local `.tmp`; it is safe but not read-only. This audit did not run the snapshot CLI against the real DB; verification used fixtures.

## Recommended Bounded Dev Packets

1. Offline label refresh clarity packet

   - Add or expose an explicitly offline-only metadata label patch path/status that uses known `entities`, SDE type/geography tables, and report joins without attempting ESI.
   - Acceptance: operator can distinguish "patched from local labels" from "requested from ESI"; raw evidence remains unchanged.

2. Partial run status surfacing packet

   - Improve report/task/user-facing status for runs that finalize `success` with nonzero `failed_expansions`, zKill request warnings, or unresolved hydration IDs.
   - Acceptance: partial success is visible without treating partial data as complete.

3. Queue stale/expiration design packet

   - Decide policy for old pending/failed/expanded/cached Discovery refs, including whether failed context must survive before queue expiration.
   - Acceptance: no implementation until Human/Overseer accepts retention meaning and footprint expectations.

4. Evidence deletion policy design packet

   - Decide whether evidence deletion should exist, what survives, whether assessment preservation is required or declinable, and whether a footprint file/table is required.
   - Acceptance: policy artifact only; no destructive code.

5. Watch recovery/readout polish packet

   - Tighten post-restart Watch display around persistent due/backoff state versus volatile session-armed/task state.
   - Acceptance: no collection on startup; operator sees why due watches are blocked.

## Required Human Decisions

- Is evidence deletion desired at all, or should Atlas remain append/retain for raw ESI evidence?
- If deletion is desired, what exact footprint survives: ID, interest, assessment snapshot, source run IDs, checksums, timestamps, or something else?
- Should queue refs be treated as disposable backlog with age/status expiry, and what warning/error summary should remain?
- Should stale/refresh be a product concept for raw evidence, metadata labels, queue refs, Watch schedules, or all of them separately?
- Should "External API" remain preserve-exact for Atlas interfaces?

## Verification Run

Focused offline verification from `workspace/current.md`:

```txt
npm.cmd run verify:queue-selection - passed
npm.cmd run verify:queue-scope-isolation - passed
npm.cmd run verify:manual-discovery - passed
npm.cmd run verify:manual - passed
npm.cmd run verify:watch-scheduler - passed
npm.cmd run verify:watch-executor - passed
npm.cmd run verify:restart-recovery - passed
npm.cmd run verify:task-concurrency - passed
npm.cmd run verify:partial-failures - passed
npm.cmd run verify:retention-preflight - passed
npm.cmd run verify:runtime-snapshot - passed
npm.cmd run verify:db-integrity - passed
npm.cmd run verify:evidence-rules - passed
npm.cmd run verify:protected-terms - passed, warning-only scan found 0 files because working set was clean
git status --short --branch - clean before handoff creation
```

Conditional broad verification:

```txt
npm.cmd run verify:all - passed, 62 scripts
git status --short --branch - clean before handoff creation
```

No focused verification command was skipped.

## Guardrail Confirmation

- No implementation was performed.
- No live API checks were run.
- No destructive actions were run.
- No real user data mutation was performed.
- No schema, persistence, bridge, IPC, service, payload, command, or UI changes were made.
- No protected-term updates or renames were performed.
- This handoff file is the only intended workspace change from the audit.
