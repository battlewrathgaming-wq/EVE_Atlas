# OverseerHS331 HS330 Watch Runtime Readiness Advisory Review

Status: accepted
Date: 2026-06-06
Role: Overseer

## Reviewed

- `workspace/OverseerHS330-watch-runtime-movement-readiness-advisory-request.md`
- `workspace/EngineeringDataSecurityHS330-watch-runtime-movement-readiness-advisory.md`
- `src/main/watchlist/watchExecutor.js`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `docs/current-state/current-storage-runtime-hardening.md`

## Decision

HS330 is accepted.

Accepted recommendation:

```txt
A no-dispatch executor/tick dry-run is the right next proof.
```

The current Watch setup-to-runtime-planning chain is coherent enough to build on, but only up to the next execution-adjacent proof boundary. Atlas is not ready for real Watch execution, task creation, provider movement, durable Watch results, relationship tags, schema work, UI work, active enforcement, or support artifacts from HS330 alone.

## Accepted Findings

HS327 proves:

- accepted Watch state can become read-only runtime packet-plan posture;
- actor Watch and system/radius Watch plan shapes can be derived locally;
- system/radius plans use stored accepted `included_system_ids`;
- invalid stored scope creates no accepted packet plan;
- inactive, not-due, and backoff Watches remain blocked/no-plan or waiting;
- preview is not dispatch and performs no provider calls, tasks, writes, schema changes, UI work, active enforcement, support artifacts, Watch result identity, relationship tags, or fourth-lane behavior.

HS327 does not prove:

- real executor/tick gate behavior;
- task creation boundary safety;
- dispatcher/collector call boundary;
- provider/live gate ordering in the executor path;
- no-catch-up-flood behavior when multiple Watches are due;
- parity between `dispatchFor(...)` payloads and packet-plan preview payloads as code changes;
- durable Watch result/outcome semantics;
- live zKill or ESI behavior.

## Source Sanity Check

`src/main/watchlist/watchExecutor.js` confirms the accepted concern:

- `WatchSessionExecutor.tick(...)` mutates volatile executor fields such as `lastTick`, `lastBlockedReason`, `activeTaskId`, and `lastDispatch`.
- The real tick path checks session state, active task, live API state, schedule due state, `dispatchFor(...)`, `actionGate(...)`, then calls `taskRunner.runDetachedTask(...)`.
- `dispatchFor(...)` uses stored accepted system IDs for system/radius Watch payloads and throws `watch_scope_authority_invalid` if stored scope is not valid.

That means the next proof must not call `tick(...)` directly if it would mutate executor state or create tasks. It should inspect the would-be decision path up to the task-creation boundary.

## Accepted Next Packet Shape

Open a Dev runway for:

```txt
watch.executor_tick_dry_run.preview
```

Purpose:

Prove the executor/tick movement boundary without movement.

Core rule:

```txt
dry-run may say what would happen
dry-run must not make it happen
```

## Boundary To Preserve

Do not open:

- real Watch execution
- executor arm/disarm behavior changes
- interval start/stop behavior
- task creation
- task runner behavior changes
- collector behavior changes
- provider/API/live calls
- Watch row mutation
- Discovery ref mutation
- Evidence/EVEidence writes
- Hydration/metadata writes
- API log or warning writes
- durable Watch result semantics
- relationship tags
- schema changes
- renderer UI
- active runtime enforcement or command blocking
- support artifacts
- fourth-lane behavior

## Human / Overseer Decision

No additional Human decision is needed before opening the dry-run proof. It follows the accepted assurance recommendation and stays before task creation.

Renderer eligibility can be allowed only as read-only inspection if command authority and passive-side-effect checks preserve the boundary. If Dev finds renderer eligibility unsafe, they may keep the command internal/trusted and report why.
