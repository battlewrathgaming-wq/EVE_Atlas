# DevHS82 - Watch Recovery Diagnostic Readout

Date: 2026-05-26
Executor: Dev
Milestone: HS82 Watch Recovery Diagnostic And Resumable Intent Readout

## Scope

Implemented a read-only Watch recovery diagnostic inside the existing `Watch_offline` readout.

No live/API calls, schema migration, provider work queue, high-volume request-attempt ledger, persisted sequencer packet table, stale/expired Discovery ref mutation, `discovered_killmail_refs` schema change, metadata hydration coupling, Watch auto-arm, UI work, deletion/retention change, or exact packet replay was added.

## Files Reviewed

- `workspace/current.md`
- `workspace/OverseerHS82-hs81-systems-advisory-review.md`
- `workspace/SystemsDesignerHS81-watch-recovery-resumable-intent-advisory.md`
- `workspace/OverseerHS81-watch-recovery-systems-design-request.md`
- `workspace/OverseerHS80-hs79-live-gate-review.md`
- `workspace/DevHS79-live-gate-sequencer-diagnostic.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-manual-discovery-lane.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `docs/adr/ADR-0005-watch-offline-readout-aggregation.md`
- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/watchlist/watchlistRepository.js`
- `src/main/db/schema.sql`
- `scripts/verify-watch-offline-readout.js`

## Files Changed

- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/watchlist/watchScheduler.js`
- `scripts/verify-watch-offline-readout.js`
- `docs/adr/ADR-0005-watch-offline-readout-aggregation.md`
- `docs/current-state/current-evidence-pipeline.md`
- `workspace/current.md`
- `workspace/DevHS82-watch-recovery-diagnostic-readout.md`

## Recovery Diagnostic

Each `Watch_offline.watches[]` entry now includes `recovery` and `next_safe_action`.

The recovery diagnostic derives:

- durable intent source: `watchlist_entities` or `system_watches`
- session/armed state
- expected next run time
- observed movement from Watch timestamps, latest fetch run, and latest API log
- reconstructed planned scope
- pending Discovery ref count
- latest fetch run summary
- latest API activity summary
- provider capacity deferral/wait signal
- orphaned pre-restart `running` fetch run signal
- missed-slot recoverability
- next safe action

Accepted next safe actions implemented:

- `arm_required`
- `wait`
- `drain_pending_refs`
- `ready_for_discovery`
- `review_orphan`
- `recover_missed_slot_when_capacity_allows`
- `complete_enough_alpha`

## Durable State Used

The diagnostic reads existing durable state only:

- `watchlist_entities`
- `system_watches`
- `fetch_runs`
- `api_request_logs`
- `data_quality_warnings`
- `discovered_killmail_refs`
- `activity_events`
- `killmails`

It does not persist recovery state.

## Radius Scope Handling

`watch.schedule` now exposes stored system/radius included/excluded scope fields from `system_watches` for readout use.

The recovery diagnostic distinguishes:

- valid stored included/excluded scope
- no stored included-system scope, with center-system fallback limitation
- malformed/unparseable stored scope, with explicit limitation instead of guessing exact radius membership

Valid included-system scope is used for system/radius local queue and evidence counts.

## Boundary Proof

The diagnostic:

- makes no provider calls
- creates no Evidence
- mutates no Discovery refs
- mutates no Watch rows
- does not hydrate metadata
- does not arm Watch execution
- does not persist sequencer packets
- does not attempt exact packet replay

Pending Discovery refs are preferred before fresh zKill Discovery through `next_safe_action: drain_pending_refs`.

Provider-capacity deferral is surfaced as waiting/deferred through `provider_deferral` and `next_safe_action: wait`, not as failed Evidence.

Orphaned `running` fetch runs are surfaced as `review_orphan`; they are not resumed.

## Verification

Commands run:

```powershell
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-executor
npm.cmd run verify:restart-recovery
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-scope-isolation
npm.cmd run verify:manual-discovery
npm.cmd run verify:hydration
npm.cmd run verify:db-integrity
npm.cmd run verify:service-registry
npm.cmd run verify:migrations
npm.cmd run verify:all
npm.cmd run verify:protected-terms
git status --short --branch
```

Results:

- `verify:watch-offline-readout`: passed.
- `verify:watch-scheduler`: passed.
- `verify:watch-executor`: passed.
- `verify:restart-recovery`: passed.
- `verify:queue-api-evidence-write`: passed.
- `verify:queue-selection`: passed.
- `verify:queue-scope-isolation`: passed.
- `verify:manual-discovery`: passed.
- `verify:hydration`: passed.
- `verify:db-integrity`: passed.
- `verify:service-registry`: passed.
- `verify:migrations`: passed.
- `verify:all`: passed, 65 scripts.
- `verify:protected-terms`: passed warning-only.
- Protected-term discovery scanned 7 working-set files.
- Warning count: 530.
- Warning classes: cross-project-borrowing 79, lab-quarantine-borrowing 274, atlas-candidate 177.
- `git status --short --branch`: `main...origin/main` with expected HS82 modified/untracked files.

## Risks / Deferred

- No persisted sequencer packet table exists.
- No durable high-volume request attempt ledger exists.
- Exact packet replay remains deferred.
- Durable Live cooldown/lockout storage remains deferred.
- Watch timing/backoff mutation for provider capacity deferral remains deferred.

## Recommended Next Action

Overseer review HS82. If accepted, decide whether the next packet should keep improving readout clarity or introduce a minimal durable Watch movement checkpoint after more runtime evidence.
