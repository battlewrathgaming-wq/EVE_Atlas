# DevHS91 - Watch_offline Alpha Observation

Date: 2026-05-26
Executor: Dev
Milestone: Atlas Storage And Runtime Hardening

## Scope

Completed a targeted offline/runtime observation pass using the existing `Watch_offline` readout and related support surfaces.

No renderer work, UI redesign, live/private/API calls, provider calls, backend behavior changes, schema migration, durable movement checkpoint, sequencer packet table, provider queue, Discovery ref mutation, Evidence/EVEidence writes, metadata hydration coupling, deletion/retention work, or terminology rename was performed.

## Files Reviewed

- `AGENTS.md`
- `workspace/README.md`
- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/current.md`
- `workspace/OverseerHS91-watch-offline-alpha-observation-runway.md`
- `workspace/OverseerHS89-hs88-runtime-evidence-review.md`
- `workspace/OverseerHS90-keyword-housekeeping-review.md`
- `workspace/DevHS88-watch-offline-runtime-evidence.md`
- `workspace/OverseerHS87-hs86-lab-response-review.md`
- `workspace/DisplayResponseHS86-atlas-r-scanner-powered-down-console.md`
- `docs/adr/ADR-0005-watch-offline-readout-aggregation.md`
- `docs/current-state/current-evidence-pipeline.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `src/main/services/serviceRegistry.js`
- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/watchlist/watchlistRepository.js`
- `scripts/verify-watch-offline-readout.js`
- `scripts/verify-app-readiness.js`
- `scripts/verify-queue-report.js`
- `scripts/verify-operator-debug-trace-pack.js`
- `package.json`

## Files Changed

- `workspace/current.md`
- `workspace/DevHS91-watch-offline-alpha-observation.md`

No source, verifier, service, schema, renderer, payload, IPC, or behavior files were changed.

## Surfaces Observed

- `watch.offline_readout`: renderer-eligible, read-only service command. It exposes the precise `Watch_offline` model, per-Watch recovery diagnostics, and `next_safe_action`.
- `watch.schedule`: renderer-eligible, read-only schedule state. It is useful for due/blocked/backoff gates but less operator-complete than `Watch_offline`.
- `watch.executor.status`: renderer-eligible, read-only volatile executor state for armed/active task context.
- `report.queue`: renderer-eligible, read-only Discovery queue report. It tells an operator pending/failed/expanded Discovery ref counts and preserves the non-Evidence boundary, but it does not explain Watch recovery state.
- `app.readiness`: renderer-eligible, read-only readiness/status readout with compact `runtime_boundary` support context.
- `support.debug_trace_pack`: renderer-eligible support artifact command. It writes a bounded support/debug artifact and explicitly excludes raw expanded ESI payloads; it is useful for support review, not first-screen operator understanding.

## Observed Runtime State

From `npm.cmd run verify:watch-offline-readout`:

- model: `Watch_offline`
- `session_armed=false`
- `collection_active=false`
- configured watches: `10`
- eligible if armed: `8`
- unarmed restart: actor Watch 4 reports `next_safe_action=arm_required`
- pending local Discovery refs: actor Watch 1 reports `pending_refs_count=1` and `next_safe_action=drain_pending_refs`
- provider deferral: actor Watch 7 reports `provider_deferral=true`, observed movement `2026-05-25T10:41:00.000Z`, and `next_safe_action=wait`
- missed slot recoverable: actor Watch 5 reports expected next run `2026-05-25T11:00:00.000Z`, observed movement `2026-05-25T10:00:00.000Z`, `missed_slot.present=true`, `recoverable=true`, and `next_safe_action=recover_missed_slot_when_capacity_allows`
- orphan review: actor Watch 6 reports orphaned run `run_orphan_actor`, status `running`, and `next_safe_action=review_orphan`
- valid radius scope: system/radius Watch 1 reports `scope_status=valid` and `next_safe_action=drain_pending_refs`
- missing radius scope: system/radius Watch 2 reports `scope_status=not_stored` and center-system fallback limitation
- malformed radius scope: system/radius Watch 3 reports `scope_status=malformed` and does not guess exact radius membership
- no mutation: persisted counts before and after readout were identical for killmails, activity_events, discovered_killmail_refs, fetch_runs, api_request_logs, data_quality_warnings, metadata_runs, and assessment_artifacts
- boundary flags: `no_provider_work=true`, `mutates_state=false`

## Operator Questions

What a fresh operator can understand today:

- Atlas is disarmed or active: yes, through `session_armed`, `collection_active`, `watch.executor.status`, and `Watch_offline`.
- Local context is available: yes, through `local_context_available`, per-Watch local context, queue report, and runtime boundary indicators.
- Pending local Discovery refs exist: yes, through `pending_refs_count`, `drain_pending_refs`, queue report counts, and debug trace queue summaries.
- Provider work is deferred/waiting: yes, through `provider_deferral` and `next_safe_action=wait`; the state is not presented as failure.
- Missed slot is recoverable: yes, through expected next run versus observed movement and `recover_missed_slot_when_capacity_allows`.
- Orphaned run needs review: yes, through `orphaned_run.present=true` and `review_orphan`.
- Radius scope quality: yes, through `scope_status=valid`, `not_stored`, or `malformed`, with limitations for missing/malformed scope.
- Next safe action: yes, per Watch through `next_safe_action`.

## Readability Gaps

Observation findings, not implementation decisions:

- `Watch_offline` is rich enough for a renderer prototype, but it is still a raw support/readout payload. A first-screen operator would need presentation mapping for `arm_required`, `drain_pending_refs`, `review_orphan`, and `recover_missed_slot_when_capacity_allows`.
- The best single source for recovery meaning is `watch.offline_readout`; queue/readiness/debug surfaces are complementary, not substitutes.
- Queue report makes pending Discovery refs visible but does not connect them to Watch recovery or explain why they should be handled before fresh zKill Discovery.
- `app.readiness` and debug trace explain storage/runtime boundaries well, but they do not answer the Watch-specific next action questions at first glance.
- Missing/malformed radius scope is safely represented, but a UI must avoid drawing exact coverage or implying live radius precision.
- `support.debug_trace_pack` is useful for support review, but it is too artifact-oriented for ordinary operator first-screen understanding.

## Verification

Commands run:

```powershell
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-executor
npm.cmd run verify:restart-recovery
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-report
npm.cmd run verify:app-readiness
npm.cmd run verify:operator-debug-trace
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- `verify:watch-offline-readout`: passed and printed runtime evidence JSON.
- `verify:watch-scheduler`: passed.
- `verify:watch-executor`: passed.
- `verify:restart-recovery`: passed.
- `verify:queue-api-evidence-write`: passed.
- `verify:queue-selection`: passed.
- `verify:queue-report`: passed.
- `verify:app-readiness`: passed.
- `verify:operator-debug-trace`: passed.
- `verify:protected-terms`: passed with exit code 0, warning-only.
- Protected-term discovery ran in working-set mode against 2 files.
- Warning count: 264.
- Warning classes: cross-project-borrowing 45, lab-quarantine-borrowing 150, atlas-candidate 69.
- `git diff --check`: passed with the existing LF-to-CRLF working-copy warning for `workspace/current.md`.
- `git status --short --branch`: expected HS91 workspace file changes.

## Recommendation

Proceed to a bounded renderer-only presentation prototype next, using `watch.offline_readout` as the source model and treating R-Scanner / R-scan as presentation-only language. A durable movement checkpoint can remain deferred until alpha observation shows that derived `Watch_offline` state is insufficient in real use.
