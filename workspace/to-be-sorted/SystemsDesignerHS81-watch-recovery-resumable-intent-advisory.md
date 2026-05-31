# SystemsDesignerHS81 - Watch Recovery Resumable Intent Advisory

Date: 2026-05-26
Role: Atlas Systems Designer / Architecture Reviewer
Status: advisory complete
Milestone: Atlas Storage And Runtime Hardening

## Purpose

Provide practical architecture input for Watch restart recovery and resumable sequencer intent.

This advisory does not authorize implementation. It evaluates whether Atlas should next focus on durable request-control counting or restart recovery from durable Watch intent.

## Executive Recommendation

Atlas should focus next on Watch restart recovery and resumable intent, not durable request-control counting.

The preferred direction is sound, but should be kept smaller than the prompt implies: do not persist a high-volume request-attempt ledger, and do not add a broad provider work queue yet. Current Atlas already has enough durable anchors to reconstruct alpha Watch recovery state:

- Watch configuration rows
- `fetch_runs`
- `api_request_logs`
- `discovered_killmail_refs`
- expanded Evidence / activity-event records

The next safe step is a read-only recovery diagnostic that proves Atlas can derive "what should happen next" after restart before adding new scheduler state.

## Baseline Verification

Implementation baseline checked against current docs/schema/code:

- Live radius rejection exists for manual Discovery gate behavior.
- Live cooldown/lockout state is service-memory-only.
- Watch schedule can emit planned packet diagnostics.
- Retryable provider capacity deferral leaves refs pending and does not write Evidence.
- No broad provider work queue exists.
- `discovered_killmail_refs` remains a returned-ref Discovery queue, not a provider request sequencer.
- Metadata hydration remains outside request-control sequencing.

Relevant evidence inspected:

- `workspace/current.md`
- `workspace/OverseerHS81-watch-recovery-systems-design-request.md`
- `workspace/DevHS79-live-gate-sequencer-diagnostic.md`
- `workspace/OverseerHS80-hs79-live-gate-review.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `docs/adr/ADR-0005-watch-offline-readout-aggregation.md`
- `src/main/db/schema.sql`
- `src/main/services/liveApiGateService.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/services/mutatingActionService.js`
- `src/main/services/taskRunner.js`
- `src/main/db/evidenceRepository.js`
- `src/main/workers/systemRadiusPlanner.js`
- `src/main/watchlist/watchlistRepository.js`
- `scripts/verify-watch-scheduler.js`

## Recommended Architecture Direction

Use this model:

```txt
Watch config = durable intent
Fetch/API logs = recent execution evidence
Discovery refs = returned zKill work awaiting ESI/cache handling
Evidence = completed truth
Watch recovery readout = derived operator state
```

The next packet should not create persisted sequencer packets. Atlas should first prove that durable Watch intent plus current execution records are enough to restart safely, avoid obvious duplicate work, and explain the next safe action.

Refined model from Human advisory:

```txt
Watch row = durable train / payload contract
Timer / sequencer = payload-agnostic conductor
Worker = engine that moves the Watch payload
```

This is a strong fit for the existing system. The Watch row should carry the meaningful acquisition envelope: target, radius, lookback, caps, cadence, included systems, active state, and next expected run time. The timer/sequencer should not need to understand exact provider packet details. It should only decide whether a due Watch may move now, must wait, or appears to have missed movement after disconnect/restart.

The practical comparison is:

```txt
expected_next_run_at   = when the Watch intended to be considered
last_observed_move_at  = when Atlas actually dispatched or completed work
sequencer_decision     = computed hold / dispatch / recover decision
```

This supports missed-run recovery without a request-attempt ledger: if the expected time is in the past and observed movement is older than that expectation, Atlas can classify the Watch as missed-but-recoverable, then admit it only when armed and capacity allows.

## Minimal Durable State Needed

Current durable state is already useful:

- `system_watches` and `watchlist_entities`: target, radius/lookback/caps/cadence, last/next/backoff.
- `fetch_runs`: latest Watch run evidence and execution counts.
- `api_request_logs`: recent provider activity.
- `discovered_killmail_refs`: pending/expanded/cached/failed returned refs.
- Evidence/activity tables: durable ESI-expanded truth.

No new table is justified for the first recovery packet.

A future checkpoint table may become useful only after Atlas has real packet identity for paced radius/lookback work. Adding it now would risk preserving the wrong abstraction.

If later derivation from `fetch_runs` and `api_request_logs` is awkward, the smallest justified durable addition would be rewritten Watch movement checkpoints, not a ledger:

- `last_dispatch_at`
- `last_completion_at`
- `last_provider_attempt_at`, if provider-specific delay cannot be derived cleanly
- `deferred_until`, if provider/capacity waits need a compact durable hold

These fields describe whether the train moved. They should not describe the full payload packet.

## State That Should Remain Volatile

The following can be forgotten on restart:

- session armed state
- active task ID
- in-memory task locks
- in-memory Live cooldown/lockout counters
- transient duplicate-running checks
- exact in-flight packet
- UI wait messaging

This is acceptable because Watch execution restarts disarmed and must be deliberately resumed.

## Recovery Model After Restart

On restart, Atlas should assume:

1. No active task is safely running.
2. Watch execution is disarmed.
3. Watch rows remain the durable source of operator intent.
4. Pending Discovery refs should be drained before fresh zKill Discovery.
5. Recent `fetch_runs` and `api_request_logs` explain recent work but do not become the scheduler.
6. Any old `running` fetch run should be surfaced as orphaned or unknown, not silently resumed.

Per Watch, the derived state should be one of:

- `arm_required`
- `waiting`
- `ready`
- `has_pending_refs`
- `recently_attempted`
- `provider_deferred`
- `orphaned_run`
- `missed_slot_recoverable`
- `complete_enough_alpha`

These are readout states, not necessarily persisted enum values.

Missed-slot logic should be based on expected timing versus observed movement:

```txt
next_poll_at is in the past
last_dispatch_at or last_completion_at is older than next_poll_at
=> Watch did not move for its expected slot
=> recoverable when armed, not an immediate provider call
```

This keeps the timer agnostic to payload shape. The timer notices that the Watch did not move; the worker still owns how the Watch payload is processed.

## Duplicate-Work Prevention Model

Atlas already has meaningful duplicate protection:

- returned refs are keyed by killmail ID/hash/provider-scope identity
- workers drain pending refs before asking zKill for fresh Discovery
- Evidence persistence is based on durable killmail identity
- `fetch_runs` record recent execution

The missing piece is restart interpretation. If Atlas crashes mid-run, the recovery readout should prefer local pending work and flag orphaned work before another provider request is made.

Do not solve this with a large request ledger.

## API Hammering Prevention Model

Current safe controls:

- Watch execution is session-armed and does not auto-resume provider work after restart.
- Watch rows contain `next_poll_at` and `backoff_until`.
- scheduler dispatches due Watch work rather than free-running.
- Live has service-memory cooldown/lockout.
- provider capacity deferral can leave refs pending without writing Evidence.

For the next packet, do not persist all Live request attempts. If restart hammering later becomes a proven issue, use a minimal current-cooldown footprint or derive recent provider activity from `api_request_logs`.

Important critique: Watch execution should be documented as paced by Watch cadence, not by Live cooldown. Live gate policy should not be treated as the hidden Watch scheduler.

The timer firing should mean "this Watch should be considered," not "provider work must start now." The sequencer admission check should be able to hold a due Watch for conflict, capacity, recent movement, or provider deferment.

## Partial-Completion Model

Partial completion should be derived from existing records:

- pending Discovery refs
- expanded/cached refs
- failed expansion refs
- provider capacity warnings
- latest fetch run status
- orphaned pre-restart `running` fetch runs
- last success/error timestamps
- next eligible Watch time

Do not represent partial completion by mutating Discovery refs into sequencer packets.

For alpha, partial completion means Atlas can say: "this Watch has durable local work/results, but the last intended acquisition cycle did not fully complete."

## Current Support And Gaps

Supported now:

- Watch intent is durable.
- Watch schedule/readout already has a diagnostic surface.
- Discovery refs can be resumed locally.
- provider capacity deferral can avoid false Evidence writes.
- hydration is already separate from request-control policy.

Gaps:

- no explicit restart recovery readout per Watch
- no orphaned `fetch_runs` interpretation
- no durable packet identity for paced radius/lookback work
- possible radius readout undercount if only center-system evidence is counted
- planned packet diagnostics may use caps rather than actual included systems
- provider-capacity deferral may look like successful task completion unless warnings/pending refs are surfaced

## Rejections And Deferrals

Reject for the next step:

- broad provider work queue
- high-volume request-attempt ledger
- making `discovered_killmail_refs` the sequencer
- direct Live radius
- treating waiting as failure
- coupling hydration to request-control
- UI redesign

Defer:

- persisted sequencer packet table
- stale/expired Discovery ref mutation
- durable Live cooldown/lockout storage
- full provider orchestration
- R2Z2/feed ingestion
- operator-facing full timeline/story UI

## Risks And Tradeoffs

Keeping Live cooldown volatile means a deliberate restart can forget Live lockout. That is acceptable for alpha because Live is explicit operator action and Watch restarts disarmed.

Avoiding packet persistence means Atlas cannot resume "packet 4 of 12" exactly. That is acceptable until paced radius sequencing exists as real behavior rather than diagnostic intent.

Using derived recovery state avoids data bloat, but it requires clear tests proving the readout does not accidentally trigger provider work.

The biggest current risk is ambiguity: a Watch run with provider-capacity deferral may appear successful unless pending refs and warning state are surfaced clearly.

## Smallest Next Dev Packet Recommendation

Recommended packet:

```txt
Watch Recovery Diagnostic And Resumable Intent Readout
```

Scope:

- no schema migration
- no live/API calls
- no broad provider queue
- no hydration changes
- no Discovery ref lifecycle mutation
- read-only recovery model from existing durable tables

Expected output per Watch:

- durable intent source
- session/armed state
- next eligible time
- expected next run time versus observed movement
- reconstructed planned scope
- pending refs count
- latest fetch/API activity
- provider deferral/wait signal
- orphaned run signal
- missed-slot recoverability signal
- next safe action

Suggested next-safe-action values:

- `arm_required`
- `wait`
- `drain_pending_refs`
- `ready_for_discovery`
- `review_orphan`
- `recover_missed_slot_when_capacity_allows`
- `complete_enough_alpha`

## Acceptance Criteria

The packet is acceptable if it proves:

- restart recovery is derived from Watch config plus existing durable execution evidence
- diagnostic generation performs no provider work
- pending refs are preferred before fresh zKill Discovery
- retryable provider capacity is represented as waiting/deferred, not failure
- Discovery refs remain Discovery, not Evidence and not sequencer packets
- hydration remains outside request-control sequencing
- orphaned pre-restart runs are visible
- Live cooldown remains documented as service-memory-only
- no broad provider queue is introduced
- radius recovery uses included-system scope where available, or explicitly reports when it cannot

## Verification Commands Expected

Focused verification should include:

```powershell
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-executor
npm.cmd run verify:app-restart-recovery
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-scope-isolation
npm.cmd run verify:manual-discovery
npm.cmd run verify:hydration
npm.cmd run verify:db-integrity
```

If service wiring or schema/migration files are touched:

```powershell
npm.cmd run verify:service-registry
npm.cmd run verify:migrations
npm.cmd run verify:all
npm.cmd run verify:protected-terms
```

Expected evidence:

- readout fixture with due Watch after restart but `arm_required`
- readout fixture with pending refs selecting `drain_pending_refs`
- readout fixture with orphaned old `running` fetch run
- readout fixture with provider-capacity warning shown as deferred/waiting
- proof that metadata hydration is unaffected
- proof that no provider calls are made by the recovery diagnostic

## Human / Overseer Decisions Needed

Decisions before Dev:

- Accept read-only recovery diagnostic as the next packet, or require schema work now.
- Confirm Watch restart must remain disarmed by default.
- Confirm Live cooldown/lockout can remain volatile for alpha.
- Decide whether provider-capacity deferral should only appear in readout first, or also update Watch timing/backoff.
- Confirm radius recovery should use included-system scope, not only center-system evidence.

## Final Position

The smallest functional solution is not a durable request-control ledger. It is a recovery readout that proves Atlas can restart, explain what it knows, prefer local pending work, and avoid provider hammering through Watch cadence and disarmed startup.

That keeps Atlas aligned with the product doctrine: patient scoped acquisition creates durable local memory, while Live search remains narrow and immediate.
