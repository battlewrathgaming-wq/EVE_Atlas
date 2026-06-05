# EngineeringDataSecurityHS330 Watch Runtime Movement Readiness Advisory

Status: advisory
Date: 2026-06-06
Role: Engineering / Data Engineering / Security advisory

## 1. Executive Recommendation

The current Watch setup-to-runtime-planning chain is coherent enough to build on, but only up to the next execution-adjacent proof boundary.

A no-dispatch executor/tick dry-run is the right next proof if Atlas wants to move closer to Watch runtime behavior. It would prove something materially different from HS327: not packet-plan shape alone, but whether the real executor tick decision path can be inspected up to the task-creation boundary without dispatching, creating tasks, calling providers, writing rows, arming runtime, or mutating Watch state.

Atlas is not ready for real Watch execution, provider-backed movement, task creation, durable Watch results, relationship tags, schema work, UI work, active enforcement, or support artifacts from this review alone.

## 2. Current Chain Assurance Summary

Reviewed source supports the accepted chain:

```txt
topology preflight
-> explicit operator confirmation
-> stored included_system_ids
-> post-create readout
-> authored execution readiness
-> readout/readiness bridge
-> runtime packet plan preview
```

The chain is coherent because each layer has a narrow authority:

- topology preflight helps author scope before acceptance;
- explicit operator confirmation is the acceptance point;
- stored `included_system_ids` are the accepted system/radius Watch scope authority;
- center/radius remain provenance and management after acceptance;
- readouts and readiness previews inspect local state without creating execution authority;
- `watch.runtime_packet_plan.preview` shapes accepted Watch state into future packet plans while declaring no dispatch, task creation, provider calls, writes, schema changes, UI work, active enforcement, Watch results, or relationship tags.

The chain should be treated as source-backed planning posture, not live execution readiness.

## 3. What HS327 Proves

HS327 proves that accepted Watch state can be transformed into read-only runtime packet-plan posture.

Source-backed points:

- `workspace/OverseerHS328-hs327-watch-runtime-packet-plan-review.md` accepts `watch.runtime_packet_plan.preview` as read-only/local-only and explicitly states it does not call `dispatchFor(...)`, Watch runners, provider gates, task runners, collectors, zKillboard, ESI, or providers.
- `src/main/services/watchRuntimePacketPlanService.js` composes `buildWatchScheduleStatus(...)` and `buildWatchAuthoredExecutionReadinessPreview(...)`.
- Actor Watch plans use actor Watch source fields from `watchlist_entities`.
- System/radius Watch plans use stored accepted system IDs from readiness rows, not center/radius recomputation.
- Invalid stored scope produces no accepted packet plan, no selected runtime systems, and diagnostic-only parseable IDs.
- Inactive, not-due, backoff, missing-scope, malformed-scope, and empty-scope rows remain blocked/no-plan or waiting states; waiting is not failure.
- `scripts/verify-watch-runtime-packet-plan.js` verifies zero provider calls, zero live API calls, zero dispatches, zero tasks, zero writes, zero Watch mutations, zero schema changes, zero support artifacts, and unchanged table counts.

HS327 also proves the packet plan's intended Acquisition lane language: Discovery then ESI Evidence Expansion. It does not blur Hydration, Observation, or Assessment into Watch acquisition.

## 4. What HS327 Does Not Prove

HS327 does not prove the real executor tick boundary.

Not proven from reviewed source:

- whether `WatchSessionExecutor.tick(...)` can be inspected without mutating volatile executor fields;
- whether a future dry-run can use the real tick gate order without calling `runDetachedTask(...)`;
- whether active task lock behavior is fully represented in packet planning;
- whether `dispatchFor(...)` payloads and `watch.runtime_packet_plan.preview` payload previews stay in parity as code changes;
- whether `actionGate(...)`, provider/live gate state, External I/O state, storage setup posture, and task concurrency facts are assembled in the same place before task creation;
- whether the executor can produce a no-catch-up-flood dry-run result when multiple watches are overdue;
- whether success/failure recording through `recordWatchRunResult(...)` remains correct after real task execution;
- whether durable Watch result/outcome semantics are sufficient for product reporting.

`src/main/watchlist/watchExecutor.js` already contains the runtime path that HS327 intentionally avoids: session armed check, active task check, live API gate check, schedule due selection, `dispatchFor(...)`, `actionGate(...)`, `taskRunner.runDetachedTask(...)`, collector invocation, and `recordWatchRunResult(...)`.

That means HS327 is a necessary planning proof, but it is not an executor movement proof.

## 5. Source-Code Gaps / False-Confidence Risks

The main false-confidence risk is assuming a packet-plan preview proves executor behavior. It does not.

Observed risks:

- `watch.runtime_packet_plan.preview` builds a plan independently from `dispatchFor(...)`; payload-preview drift is possible if one changes without the other.
- `watch.runtime_packet_plan.preview` accepts `sessionArmed` and `liveApiEnabled` as input posture, while `WatchSessionExecutor.tick(...)` uses volatile executor state and live API state. A dry-run must prove which state source is authoritative.
- `WatchSessionExecutor.tick(...)` mutates volatile fields such as `lastTick`, `lastBlockedReason`, `activeTaskId`, and `lastDispatch`; a dry-run must not mutate those while still reporting the would-be decision path.
- Current executor verification in `scripts/verify-watch-executor.js` proves real fixture execution with fake clients and task creation, plus invalid stored scope blocking before task creation. That is useful, but it is not a no-dispatch dry-run surface.
- `docs/contracts/session-armed-watch-executor-contract.md` states gate order as session armed, live API gate, task lock, schedule due, then caps/stored scope. Current source checks active task before live API in `WatchSessionExecutor.tick(...)`. This is not necessarily unsafe, but it is a contract/source ordering mismatch that a no-dispatch review should either normalize or explicitly document before execution-adjacent work.
- External I/O is accepted as the broader provider trust boundary in `docs/current-state/current-storage-runtime-hardening.md`, but the current executor source directly checks `AURA_ATLAS_LIVE_API` / `liveApiEnabled` and `actionGate(...)`. A dry-run should expose External I/O posture if the runtime hook/composed gate model is expected to constrain Watch movement before task creation.

## 6. Whether No-Dispatch Executor/Tick Dry-Run Is The Right Next Proof

Yes, with a strict boundary.

The dry-run should answer: given the current executor state, task state, local schedule, stored Watch scope, provider/live gate posture, and relevant storage/External I/O facts, what would the executor do on this tick if dispatch were allowed?

It would prove beyond HS327:

- the real executor tick gate path can be made inspectable before dispatch;
- due Watch selection follows stable executor ordering;
- one tick selects at most one would-be Watch, preventing catch-up flooding;
- disarmed, active-task, live/provider-gated, not-due, backoff, inactive, and invalid-stored-scope cases stop before task creation;
- system/radius Watch movement uses stored accepted system IDs and does not recompute center/radius;
- actor and system/radius would-dispatch payloads match `dispatchFor(...)` shape without invoking runners;
- invalid stored scope blocks in the executor path before task creation;
- provider gate, External I/O, storage setup, and runtime enforcement facts remain blockers/readouts, not implicit authorization;
- the dry-run can prove zero tasks, zero provider calls, zero Watch mutations, zero Evidence/EVEidence writes, zero Discovery ref mutations, and zero support artifacts.

This proof should not arm the executor, call `tick(...)` directly if that mutates volatile runtime fields, call `runDetachedTask(...)`, call collectors, call providers, write Watch run results, or treat `would_dispatch` as authorization.

## 7. Smallest Safe Next Dev Packet

If Overseer opens a Dev packet later, the smallest useful seam is:

```txt
watch.executor_tick_dry_run.preview
```

Suggested scope:

- read-only/local-only preview;
- non-renderer or renderer-eligible only if command authority review says safe;
- no dispatch, no task creation, no provider calls, no row mutation, no schema, no UI;
- use the current executor/tick source path as the comparison target;
- report would-block / would-idle / would-select / would-dispatch posture without movement;
- prove no catch-up flood by selecting at most one due Watch in a fixture with multiple due watches;
- surface where the dry-run differs from current contract/source ordering instead of hiding it.

This is a suggested seam only. This advisory does not create a Dev runway.

## 8. Acceptance Criteria For That Packet

A future packet should prove:

- executor starts from explicit supplied or actual volatile state and does not arm/disarm;
- no interval starts;
- no `taskRunner.runDetachedTask(...)` occurs;
- no collectors run;
- no providers are called;
- no Watch, Discovery, Evidence/EVEidence, Hydration, metadata, API log, warning, task-result, support artifact, or schema rows are written;
- disarmed tick reports blocked;
- active task reports blocked and does not select a new Watch;
- live/provider gate disabled reports blocked;
- External I/O off, if sourced in the packet, reports held/blocked and not failed;
- no due watches reports idle/waiting, not failure;
- inactive, not-due, and backoff Watches remain waiting/blocked without failure;
- invalid stored system/radius scope reports `watch_scope_authority_invalid` and produces no would-dispatch payload;
- due actor Watch produces one would-dispatch payload for `actor.watch`;
- due system/radius Watch produces one would-dispatch payload for `system.radius.watch` using stored accepted IDs only;
- multiple due Watches select one stable candidate only;
- packet-plan preview and dry-run payload shape are either proven in parity or differences are explicitly reported.

## 9. Verification Commands / Evidence Expected

Expected evidence for a later implementation packet would include focused verifier output, not live/API proof.

Likely commands:

```txt
node --check src/main/services/<new-dry-run-service>.js
node --check scripts/verify-watch-executor-tick-dry-run.js
npm.cmd run verify:watch-executor-tick-dry-run
npm.cmd run verify:watch-runtime-packet-plan
npm.cmd run verify:watch-executor
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-scope-authority-conformance
npm.cmd run verify:command-authority
npm.cmd run verify:service-registry
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
git diff --check
```

The verifier should include side-effect counts before/after and explicit assertions that no tasks were created and no providers were called.

## 10. Parked Items

Keep parked:

- real Watch execution;
- executor arm/disarm product behavior;
- provider/API/live calls;
- task creation;
- task runner behavior changes;
- collector behavior changes;
- Discovery ref writes/mutations;
- ESI Evidence Expansion writes;
- Hydration writes;
- durable Watch result/outcome map semantics;
- relationship tags;
- schema changes;
- persisted queues, Buckets, leases, retries, dispatcher, broad Sequencer;
- runtime enforcement activation or command blocking;
- support artifacts;
- UI work;
- fourth lane reopening.

## 11. Human / Overseer Decisions Needed

Overseer should decide whether to open the no-dispatch executor/tick dry-run as the next bounded proof.

If opened, Overseer should also decide:

- whether the proof must source External I/O and storage setup facts now, or merely expose that they remain not proven in the executor path;
- whether to resolve or document the gate-order mismatch between the executor contract and current source before movement-adjacent work;
- whether the dry-run should be implemented as an executor-owned helper or a separate service that mirrors executor decisions with parity checks;
- whether renderer eligibility is appropriate, or whether the dry-run should remain trusted/internal first.

## Reviewed Sources

- `AGENTS.md`
- `workspace/current.md`
- `workspace/OverseerHS330-watch-runtime-movement-readiness-advisory-request.md`
- `workspace/OverseerHS328-hs327-watch-runtime-packet-plan-review.md`
- `workspace/OverseerHS329-watch-runtime-next-seam-decision-surface.md`
- `src/main/services/watchRuntimePacketPlanService.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/services/composedGatePolicyService.js`
- `src/main/services/runtimeEnforcementDryAdapter.js`
- `src/main/watchlist/watchScheduler.js`
- `scripts/verify-watch-runtime-packet-plan.js`
- `scripts/verify-watch-executor.js`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/current-state/current-evidence-pipeline.md`

## Advisory Acceptance Check

- Advisory only: yes.
- No implementation work created: yes.
- No Dev runway created: yes.
- No provider/API/live calls recommended or run: yes.
- Current Atlas docs/source distinguished from recommendation: yes.
- HS327 proof separated from executor tick proof: yes.
- No-dispatch executor/tick dry-run recommendation answered: yes.
- Discovery, Evidence/EVEidence, Hydration, Observation, and Assessment boundaries preserved: yes.
- Next action routed to Human/Overseer: yes.
