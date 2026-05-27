# Systems Audit HS103: Sequencer / Provider Cadence

Role: Atlas Systems Auditor
Date: 2026-05-27
Scope: Advisory audit only. No code, schema, provider behavior, Dev runway, or product direction changed.

## Executive Summary

Atlas can support a cautious alpha version of patient acquisition today, but not a full Sequencer/provider-cadence model as a separate persisted runtime system.

Implemented support exists in narrow pieces: explicit Live gate checks, service-memory cooldown/lockout by provider/action/scope fingerprint, session-armed Watch execution, one due Watch dispatch at a time, Watch schedule/backoff rows, Discovery ref persistence, capped ESI expansion, retryable provider-capacity deferral handling, and `Watch_offline` restart/recovery readout.

The accepted future model is clearer than the implementation: Live search remains immediate and narrow; Watch / Sequencer should own patient scoped acquisition; Discovery Sequencer should pace zKill and output Discovery refs; Enrichment Sequencer should pace ESI expansion and output Evidence/EVEidence; hydration remains separate local readability repair.

The largest current gap is that actor/system Watch collection still performs discovery and capped ESI expansion inside one dispatched run. There is no durable Sequencer packet table, no durable provider-capacity wait ledger, no persisted request-control state, and no separate Enrichment Sequencer queue beyond `discovered_killmail_refs` status and selection.

## Files Reviewed

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `docs/index.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/features/r-scanner-sequencer-presentation.md`
- `docs/features/persistent-discovery-ref-queue.md`
- `docs/features/ui-trigger-and-scope-map.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
- `package.json`
- `src/main/db/schema.sql`
- `src/main/db/evidenceRepository.js`
- `src/main/services/liveApiGateService.js`
- `src/main/services/mutatingActionService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/queueSelectionService.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/api/httpClient.js`
- `src/main/workers/manualDiscoveryWorker.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`

## Current Implementation Map

### Live Search / Manual Behavior

Live/manual provider work is explicit and narrow.

- `manual.discovery` is live-gated zKill discovery only. It creates a `fetch_runs` row with `watch_type='manual_discovery'`, calls zKill, writes `discovered_killmail_refs`, writes warnings, and finalizes with `api_calls_esi=0`.
- `manual.expansion` is live-gated ESI expansion of selected queued refs. It selects `pending` or `failed` refs under cap, marks selection time, calls ESI, writes `killmails` and `activity_events` for successful expansions, and updates queue status.
- Direct manual radius discovery is rejected by `liveApiGateService` with `LIVE_RADIUS_REJECTED`; radius acquisition is meant to move through Watch / Sequencer behavior.
- Live gate request control uses provider/action/target/lookback/cap scope fingerprints, not persisted queue rows.

### Watch / Patient Acquisition

Watch acquisition is partially patient and gated, but not yet split into durable Sequencer lanes.

- Watch intent is durable in `watchlist_entities` and `system_watches`: target, lookback, caps, active flag, poll interval, last/next poll times, last success/error, and backoff.
- `watch.schedule` computes due/blocked state from Watch rows plus volatile `sessionArmed` and live API state.
- `watchExecutor` starts disarmed, arms only by explicit command, polls every 60 seconds by default, dispatches at most one due Watch per tick, and blocks when an evidence-creating task is active.
- Due Watch execution dispatches to `actor.watch` or `system.radius.watch` through detached task execution.
- On success/failure, `recordWatchRunResult` updates Watch timing and backoff.

The Watch collectors themselves still combine phases:

- `actorWatchCollector` drains pending local actor refs first; if none exist, it performs zKill discovery, writes refs, selects expansion candidates, calls ESI under cap, writes Evidence/EVEidence, and updates queue status.
- `systemRadiusCollector` does the same for system/radius scope, including topology planning and per-system zKill requests.

This supports cautious, capped work but does not yet implement separate Discovery Sequencer and Enrichment Sequencer runtime lanes.

### Discovery Sequencer Output

The current Discovery output is `discovered_killmail_refs`.

Fields that matter today:

- Identity: `killmail_id`, `killmail_hash`, `discovered_by_type`, `discovered_by_id`
- Scope/provenance: `source_scope`, `source_system_id`, `source_actor_type`, `source_actor_id`
- Run lineage: `first_seen_run_id`, `last_seen_run_id`
- Timing: `discovered_at`, `last_seen_at`
- State: `status`, `selected_for_expansion_at`, `expanded_at`, `failed_at`, `failure_count`, `last_error`
- Ordering/readout: `priority`, `preview_json`

This table is a returned zKill ref queue and provenance surface. It is not a provider request queue, not a Sequencer packet table, and not Evidence/EVEidence.

### Enrichment Sequencer Output

The current enrichment output is completed ESI-expanded Evidence/EVEidence:

- `killmails`
- `activity_events`
- `entities`
- `ingestion_audits`
- `data_quality_warnings`

The operational precursor is queue selection from `discovered_killmail_refs`, but there is no separate persisted Enrichment Sequencer queue. Selection is computed at run time from pending/failed refs and local cache state.

### Provider Waits And Failures

Provider wait exists, but it is mostly local to a run and readout.

- `httpClient` retries 420/429/503 responses within a request attempt, then logs API request state.
- `killmailIngestionWorker` treats 420/429/503-style failures as `provider_capacity_deferred`.
- Provider capacity deferral writes a warning, writes no Evidence/EVEidence, does not increment failed expansion count, and leaves the ref eligible for later work.
- Terminal expansion failures produce `failed_expansion` warnings and can mark queue refs `failed`.

The current model preserves the accepted rule that waiting is not failure. It does not persist a durable provider `deferred_until` or provider-capacity schedule.

### Restart Recovery / Readout

`Watch_offline` is the strongest current recovery surface.

It derives state from Watch rows, fetch runs, API logs, Discovery refs, Evidence rows, and warnings. It reports session/disarmed state, pending refs, provider deferral, missed slots, orphaned runs, reconstructed scope, and `next_safe_action` without mutation.

It does not resume exact packet progress. It reconstructs operator-safe posture.

### Queue State vs Request-Control State

These are separate today.

- Queue state is durable in `discovered_killmail_refs`.
- Fetch/run provenance is durable in `fetch_runs`, `api_request_logs`, `data_quality_warnings`, and `ingestion_audits`.
- Watch schedule/cadence intent is durable in Watch tables.
- Request-control cooldown/lockout is volatile service memory in `liveApiGateService`.
- Task active/queued/running state is volatile task-runner memory.

## Accepted Direction Map

Accepted durable direction says:

- Live search is immediate, narrow, and provider-style.
- Watch / Sequencer is patient scoped acquisition over time.
- Discovery Sequencer should pace zKill acquisition and return Discovery refs.
- Enrichment Sequencer should pace ESI expansion of known refs into Evidence/EVEidence.
- Hydration stays separate from request-control sequencing.
- Waiting is not failure.
- Retryable provider/capacity waits do not mark refs failed and do not write Evidence/EVEidence.
- `Watch_offline` is read-only support/readout, not an execution engine.
- `discovered_killmail_refs` must remain returned zKill refs/provenance, not become the Sequencer itself.
- Current guardrails explicitly reject a broad provider work queue, high-volume request-attempt ledger, persisted sequencer packet table, stale/expired ref mutation, schema migration, and durable movement checkpointing unless later opened.

## Gaps / Risks

1. Discovery and enrichment are still coupled in Watch collectors.
   A single `actor.watch` or `system.radius.watch` run can perform zKill discovery and ESI expansion. That is bounded by caps and gates, but it is not the future split Sequencer model.

2. Request-control state is not restart durable.
   Cooldown and lockout are service-memory-only. A restart forgets accepted attempt timing and abuse lockout state.

3. Provider capacity wait lacks durable next-attempt semantics.
   Capacity deferral is represented as a warning and readout state, not a durable wait-until schedule. This is honest, but not enough for precise patient retry cadence.

4. `fetch_runs` can show run outcomes, but not packet progress.
   It records counts and final status; it cannot reconstruct exact zKill packet index, exact ESI expansion index, or remaining request work.

5. Queue refs are eligible work, not active work claims.
   `selected_for_expansion_at` records selection, but there is no active lease, ownership, or durable one-active-enrichment item per Watch target/time/scope.

6. Manual expansion includes `failed` refs as selectable.
   This enables retry, but without stale/expiration or retry-class fields it cannot distinguish terminal failure, operator-approved retry, or provider-capacity deferred retry beyond warnings and `last_error`.

7. Hydration is intentionally separate, but provider-cadence protection is uneven.
   `metadata.hydration` is live-gated, metadata-only, and uses `metadata_runs`, but `runMetadataHydrationService` disables request-control attempt recording. This preserves the boundary from Watch sequencing, but repeated hydration is not governed by the same cooldown/lockout accounting.

8. Actor/system identity resolution may perform provider-backed resolution before Watch collection.
   It is outside the Discovery/Enrichment lanes and should remain explicit if future cadence policy expands beyond killmail acquisition.

9. Hidden partial success remains possible without readout.
   A run can succeed overall while some discovery packets fail, expansion cap skips refs, provider capacity defers refs, or terminal expansion failures leave queue rows failed. Existing reports and `Watch_offline` surface much of this, but a future Sequencer status should make it first-class.

10. Boundary drift risk remains around naming.
    R-Scanner / Sequencer is presentation/product direction. Backend source terms remain Watch, `Watch_offline`, Discovery, Evidence/EVEidence, hydration, and provider calls.

## Current Support For Patient Acquisition

Currently supported:

- explicit live enablement and User-Agent gate
- narrow manual discovery/expansion actions
- manual live radius rejection
- per-fingerprint live cooldown and lockout while the service remains alive
- duplicate active task block by scope fingerprint
- durable Watch schedule fields and backoff
- volatile session arming with restart-disarmed default
- one due Watch dispatch per tick
- local pending-ref drain before fresh zKill discovery in Watch collectors
- capped ESI expansion
- provider-capacity deferral as warning/wait rather than failure
- read-only restart/offline recovery readout

Not currently supported:

- durable Discovery Sequencer packets
- durable Enrichment Sequencer packets
- persisted request-control cooldown/lockout
- durable provider `retry_after` / `deferred_until`
- exact restart resume of partially completed packet movement
- one-active-work uniqueness enforced by DB constraint
- stale/expired Discovery ref policy
- broad provider work queue

## Suggested Bounded Next Packet

No full Sequencer implementation packet is ready without a Human/Overseer decision to open schema/runtime design. The current guardrails explicitly defer broad provider work queues, persisted sequencer packets, stale/expired ref mutation, and durable movement checkpointing.

Smallest safe next packet, if opened, should be readout/verification-only:

**Sequencer cadence readout proof from existing state.**

Boundaries:

- no schema migration
- no provider calls
- no persisted Sequencer packet table
- no broad provider queue
- no Discovery ref stale/expired mutation
- no hydration coupling
- no change to Watch collection behavior

Purpose:

- prove from fixtures that Atlas can classify a Watch into: drain local pending refs, wait provider capacity, wait schedule/backoff, ready for discovery, ready for capped enrichment, review orphan, blocked by live gate, blocked by malformed scope
- show Discovery and Enrichment as separate readout phases even if the current collector implementation still combines them at execution time
- expose partial-success indicators without treating waiting as failure

This would sharpen operator/runtime understanding before deciding whether schema-backed Sequencer movement is justified.

## Verification Suggestions

Relevant non-live verification commands:

```powershell
npm.cmd run verify:live-api-gate
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-executor
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:restart-recovery
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-scope-isolation
npm.cmd run verify:manual-discovery
npm.cmd run verify:partial-failures
npm.cmd run verify:hydration
npm.cmd run verify:service-registry
npm.cmd run verify:task-concurrency
npm.cmd run verify:controlled-workflow
npm.cmd run verify:passive-side-effects
npm.cmd run verify:http-boundaries
npm.cmd run verify:http-timeouts
npm.cmd run verify:db-integrity
git diff --check
git status --short --branch
```

Future packet-specific verification should prove:

- Live search/manual discovery does not run radius acquisition directly.
- Manual discovery queues refs and makes zero ESI calls.
- Manual expansion calls ESI only for explicit selected refs under cap.
- Watch executor starts disarmed after restart.
- Arming dispatches at most one due Watch.
- An active evidence task blocks another Watch dispatch.
- Pending local Discovery refs are drained before fresh zKill discovery.
- Provider-capacity deferral leaves refs pending and writes no Evidence/EVEidence.
- Terminal expansion failures mark failed refs without aborting successful expansions.
- `Watch_offline` remains read-only and does not arm, hydrate, call providers, create Evidence, mutate refs, or persist Sequencer packets.
- Hydration remains metadata/readability-only and uses `metadata_runs`, not `fetch_runs`.

## Human / Overseer Decisions Needed

- Whether the next work should remain readout/verification-only or open schema-backed Sequencer design.
- Whether provider-capacity waits need a durable `deferred_until`/retry policy before heavier collection.
- Whether request-control cooldown/lockout should become restart durable, and at what granularity.
- Whether future uniqueness/idempotency should be enforced by DB constraints, runtime leases, or both.
- Whether hydration should remain outside request-control accounting completely or gain separate provider-cadence protection.
- Whether future Watch execution should split into two commands/lanes: Discovery Sequencer and Enrichment Sequencer.
- Whether exact movement checkpointing is worth the schema cost, or whether derived `Watch_offline` readout remains sufficient.

## No Code Changed

No code, schema, docs authority, product direction, Dev runway, provider calls, live checks, or runtime behavior were changed by this audit. This file is an advisory workspace artifact only.
