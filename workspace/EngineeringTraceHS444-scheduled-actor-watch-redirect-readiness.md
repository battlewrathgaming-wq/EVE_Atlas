# EngineeringTraceHS444 - Scheduled Actor Watch Redirect Readiness

Status: advisory/source-trace only  
Date: 2026-06-12  
Role: Engineering / source trace  

## 1. Executive Finding

Scheduled actor Watch is **structurally ready for a narrow scheduled redirect runway with strict verification**, but it should not be treated as collector retirement or a broader Watch rewrite.

The safest next Dev packet is not a blind terminology replacement. It is a bounded scheduled actor Watch redirect that changes only the actor branch of `watchExecutor.dispatchFor(...)` to use the boundary-owned actor Watch route, while preserving `WatchSessionExecutor.tick(...)`, `TaskRunner`, `recordWatchRunResult(...)`, caller result wrapping, direct `actor.watch`, system/radius Watch, and all existing gate behavior.

If Dev wants less runtime risk, the first step can be a no-live scheduled-adapter verifier/proof. From source trace, however, the direct body already has the runner-compatible shape needed by scheduled Watch, provided the scheduler wrapper remains the owner of cadence and task result recording.

## 2. Current Scheduled Actor Watch Path

Current scheduled actor Watch path:

```txt
WatchSessionExecutor.tick(...)
-> buildWatchScheduleStatus(...)
-> selectDueWatch(...)
-> dispatchFor(watch)
-> actionGate(dispatch.command, dispatch.payload)
-> taskRunner.runDetachedTask(...)
-> dispatch.runner(dispatch.payload, { ...dependencies, db, signal })
-> recordWatchRunResult(success/failed)
-> task result { status: 'succeeded', data: { watch, collection } }
```

Source trace:

- `src/main/watchlist/watchExecutor.js:60` defines `WatchSessionExecutor.tick(...)`.
- `src/main/watchlist/watchExecutor.js:88` calls `dispatchFor(watch)`.
- `src/main/watchlist/watchExecutor.js:97` gates `dispatch.command` and `dispatch.payload`.
- `src/main/watchlist/watchExecutor.js:103` creates an evidence-creating detached task.
- `src/main/watchlist/watchExecutor.js:110` invokes `dispatch.runner(dispatch.payload, { ...dependencies, db, signal })`.
- `src/main/watchlist/watchExecutor.js:115` records Watch success.
- `src/main/watchlist/watchExecutor.js:124` wraps result under `data`.
- `src/main/watchlist/watchExecutor.js:126` places runner output under `data.collection`.
- `src/main/watchlist/watchExecutor.js:130` records Watch failure on thrown error.
- `src/main/watchlist/watchExecutor.js:286` defines `dispatchFor(watch)`.
- `src/main/watchlist/watchExecutor.js:300` currently sets actor `runner: collectActorWatch`.

Current actor dispatch payload:

```txt
entityType
entityId
entityName
lookbackSeconds
maxRefs
maxExpansions
```

This payload is already compatible with the input shape consumed by `runActorWatchDirectBody(...)`.

## 3. Direct Path Versus Scheduled Path Differences

Direct production path after HS440:

```txt
serviceRegistry
-> runActorWatchService(...)
-> resolveActorInput(...)
-> normalizeActorWatchScope(...)
-> assertLiveAllowed('actor.watch', input, dependencies)
-> runActorWatchDirectBody(input, { ...dependencies, db })
```

Source trace:

- `src/main/services/mutatingActionService.js:6` imports `runActorWatchDirectBody`.
- `src/main/services/mutatingActionService.js:52` defines `runActorWatchService(...)`.
- `src/main/services/mutatingActionService.js:60` keeps `assertLiveAllowed('actor.watch', input, dependencies)`.
- `src/main/services/mutatingActionService.js:61` calls `runActorWatchDirectBody(input, { ...dependencies, db })`.

Scheduled path differences:

- scheduled path already has a resolved actor row from Watch source
- scheduled path does not call `runActorWatchService(...)`
- scheduled path owns due selection, task creation, active-task lock behavior, and Watch cadence recording
- scheduled path wraps runner output as `data.collection`
- scheduled path passes `taskContext.signal` into runner dependencies
- scheduled path gates with `actionGate(...)` before task runner invocation

Therefore scheduled redirect should not route through the direct service command unless explicitly adapting the signature and avoiding duplicate ownership. The cleaner movement is to keep scheduler ownership in `watchExecutor` and swap only the actor runner target to the boundary-owned body or a thin scheduled wrapper around it.

## 4. Caller / Result Shape Requirements

Scheduled caller shape requires:

- task status from `TaskRunner`
- task result with `watch`
- actor Watch collection summary under `data.collection`
- same 22-field compatibility summary currently returned by legacy actor collector and direct body

Accepted compatibility source:

- `src/main/discovery/actorWatchCompatibilitySummary.js:1` defines the 22-field compatibility field list.
- `src/main/discovery/actorWatchCompatibilitySummary.js:26` builds the summary.
- `src/main/discovery/actorWatchCompatibilitySummary.js:104` defines scheduled-style wrapping through `buildScheduledActorWatchCompatibilityResult(...)`.

The scheduled wrapper is not future Discovery receipt doctrine. It is caller compatibility for the current Watch executor/task result shape.

## 5. Dependency And Lifecycle Requirements

Scheduled execution currently provides these dependencies to the runner:

- `db`
- `signal` from `TaskRunner`
- any injected dependencies passed to `executor.tick(...)`

Source trace:

- `src/main/watchlist/watchExecutor.js:110` calls runner with payload and dependency object.
- `src/main/watchlist/watchExecutor.js:113` passes `signal: taskContext.signal`.
- `src/main/services/taskRunner.js:86` exposes task context signal.
- `src/main/services/taskRunner.js:96` stores abort signal in context.
- `src/main/services/taskRunner.js:200` supports cancellation by aborting the task controller.

`runActorWatchDirectBody(...)` is compatible with this dependency shape:

- `src/main/discovery/actorWatchDirectBody.js:16` defines `runActorWatchDirectBody(input, dependencies = {})`.
- `src/main/discovery/actorWatchDirectBody.js:29` constructs `HttpClient` with repository/run id/signal/timeout/fetch/max attempts.
- `src/main/discovery/actorWatchDirectBody.js:38` constructs `ZKillDiscoveryClient`.
- `src/main/discovery/actorWatchDirectBody.js:39` constructs `EsiClient`.
- `src/main/discovery/actorWatchDirectBody.js:137` finalizes failed fetch runs in its catch path.

Watch cadence remains outside the body:

- `src/main/watchlist/watchScheduler.js:22` defines `recordWatchRunResult(...)`.
- `src/main/watchlist/watchScheduler.js:33` writes `last_success_at`.
- `src/main/watchlist/watchScheduler.js:36` writes next poll after success.
- `src/main/watchlist/watchScheduler.js:47` writes failure backoff.

## 6. Compatibility, Logging, And Finalization Requirements

Scheduled redirect must preserve:

- 22-field compatibility summary under `task.result.collection`
- `api_calls_zkill` and `api_calls_esi` from `api_request_logs`
- collection warnings and Evidence warning messages
- fetch run success finalization
- fetch run failed finalization on fatal provider/cancellation errors
- zKill discovery failure as warning posture, not Evidence/EVEidence
- ESI capacity/rate-limit as deferred warning posture
- ESI terminal failure as `failed_expansion`
- Hydration remains untouched
- Observation/report remains untouched

Direct body already carries the relevant core behavior:

- `src/main/discovery/actorWatchDirectBody.js:126` finalizes successful fetch runs.
- `src/main/discovery/actorWatchDirectBody.js:137` catches fatal body errors.
- `src/main/discovery/actorWatchDirectBody.js:139` finalizes failed fetch runs.
- `src/main/discovery/actorWatchDirectBody.js:216` treats cancellation/timeout as fatal transport errors.

Existing accepted verifiers around the direct body cover the hard parts:

- `verify:watch-actor-direct-redirect`
- `verify:watch-actor-transport-failure-parity`
- `verify:watch-actor-controlled-adapter-return-path`

But scheduled redirect still needs its own executor-level verifier because task/cadence/result wrapping is owned by `WatchSessionExecutor`, not by the direct body.

## 7. Risks If Redirect Is Attempted Too Directly

Main risks:

- changing `WatchSessionExecutor.tick(...)` unnecessarily and disturbing task/cadence behavior
- routing through `runActorWatchService(...)` and confusing service-layer authority with scheduled runner authority
- losing `data.collection` wrapper shape expected by scheduled task callers
- failing to pass `taskContext.signal` into the direct body
- changing `recordWatchRunResult(...)` semantics
- changing system/radius Watch dispatch while touching `dispatchFor(...)`
- treating scheduled redirect as permission to retire `collectActorWatch(...)`
- allowing old proof scripts to keep asserting scheduled actor Watch is legacy after the scheduled redirect lands
- accidentally weakening `actionGate('actor.watch', payload)` posture

A simple `runner: runActorWatchDirectBody` is mechanically plausible because the signature matches, but Dev should still treat it as a scheduled redirect with explicit scheduler-level verification. A thin scheduled adapter function may be cleaner if it names the transition and lets verification assert the wrapper boundary directly.

## 8. Recommended Next Dev Packet

Recommended next packet: **narrow scheduled actor Watch redirect**.

Scope:

- change only the actor branch of `watchExecutor.dispatchFor(...)`
- use `runActorWatchDirectBody(...)` directly or through a thin scheduled actor runner wrapper
- keep `WatchSessionExecutor.tick(...)` behavior unchanged
- keep `TaskRunner` unchanged
- keep `recordWatchRunResult(...)` unchanged
- keep direct `actor.watch` unchanged
- keep system/radius Watch on its existing collector
- do not retire `collectActorWatch(...)`

Preferred implementation posture:

```txt
watchExecutor.dispatchFor(actor)
-> command: 'actor.watch'
-> payload: existing actor Watch payload
-> runner: boundary-owned actor Watch scheduled runner / runActorWatchDirectBody
```

No provider/live verification should be run. Use fake `fetchImpl` or injected fake clients as current verifiers do.

## 9. Verification Evidence Expected

Required focused verification:

- new scheduled actor Watch redirect verifier
- existing `verify:watch-executor`, updated if needed for the new runner
- `verify:watch-actor-direct-redirect`
- `verify:watch-actor-transport-failure-parity`
- `verify:watch-actor-controlled-adapter-return-path`
- `verify:service-registry`
- `verify:command-authority`
- `verify:passive-side-effects`
- `verify:enforcement-dry-run`
- `node --check` for touched files/scripts
- strict source check that `watchExecutor.dispatchFor(actor)` no longer uses `runner: collectActorWatch`
- strict source check that system/radius still uses `collectSystemRadiusWatch`
- strict source check that `collectActorWatch(...)` remains available but is no longer used by direct or scheduled actor Watch runtime

The scheduled verifier should prove:

- a due actor Watch dispatches through the boundary-owned runner
- task classification remains `evidence-creating`
- task result status remains `succeeded` on success
- task result still includes selected `watch`
- task result still places actor summary under `data.collection`
- compatibility field parity remains 22 fields
- Watch success updates `last_success_at`, clears `last_error_at`, and sets `next_poll_at`
- Watch failure updates `last_error_at`, `backoff_until`, and `next_poll_at`
- task cancellation/timeout behavior still records task cancelled/failed appropriately
- API logs still flow through `HttpClient` when fake `fetchImpl` is used
- no live provider calls occur
- no Hydration, Observation/report, schema, UI, runtime enforcement, dispatcher/queue/lease, or source-term changes occur

Expected verifier language should be updated so older “scheduled actor Watch legacy parked” assertions do not become stale after this movement.

## 10. Parked Items

Keep parked:

- `collectActorWatch(...)` retirement
- mixed collector retirement
- system/radius Watch redirect
- live/provider verification
- durable Discovery task/packet persistence
- dispatcher / queue / lease behavior
- Watch cadence redesign
- runtime enforcement activation
- command blocking
- Hydration writes
- Observation/report changes
- Assessment behavior
- renderer UI
- schema changes
- source-term rename
- protected-word JSON updates

