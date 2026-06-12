# OverseerHS446 - Scheduled Actor Watch Redirect Runway

Status: open
Date: 2026-06-12
Executor: Dev
Expected handoff: `workspace/DevHS446-scheduled-actor-watch-redirect.md`

## Purpose

Redirect only scheduled actor Watch from the legacy mixed collector runner to the boundary-owned actor Watch route.

This is the scheduled counterpart to HS440's direct `actor.watch` redirect.

## Accepted Context

Direct actor Watch already routes:

```txt
serviceRegistry -> runActorWatchService(...) -> runActorWatchDirectBody(...)
```

Scheduled actor Watch currently routes:

```txt
watchExecutor.dispatchFor(actor) -> runner: collectActorWatch
```

Accepted target shape:

```txt
watchExecutor.dispatchFor(actor)
-> command: 'actor.watch'
-> existing actor Watch payload
-> boundary-owned actor Watch scheduled runner / runActorWatchDirectBody(...)
```

Keep Watch as scheduler/cadence/result owner. Do not route scheduled execution through `runActorWatchService(...)`.

## Required Work

Change only the scheduled actor branch of `watchExecutor.dispatchFor(...)`.

Acceptable implementation:

- use `runActorWatchDirectBody(...)` directly as actor runner, if the existing scheduled runner signature is preserved
- or add a thin scheduled actor runner wrapper that calls `runActorWatchDirectBody(...)` and exists only to name/assert the scheduled boundary

The implementation must preserve:

- `WatchSessionExecutor.tick(...)`
- `TaskRunner`
- `recordWatchRunResult(...)`
- `actionGate(dispatch.command, dispatch.payload)`
- task classification as `evidence-creating`
- `taskContext.signal` propagation into the actor body
- scheduled task result shape:

```txt
{ status: 'succeeded', data: { watch, collection } }
```

- 22-field actor Watch compatibility summary under `data.collection`
- direct `actor.watch` behavior from HS440
- system/radius Watch legacy path
- `collectActorWatch(...)` availability for now

## Boundaries

Do not add:

- `collectActorWatch(...)` retirement
- mixed collector retirement
- system/radius Watch redirect
- live/provider verification
- durable Discovery task/packet persistence
- dispatcher/queue/lease behavior
- Watch cadence redesign
- runtime enforcement activation
- command blocking
- Hydration writes
- Observation/report changes
- Assessment behavior
- renderer UI
- schema changes
- source-term rename
- protected-word JSON update

## Verification

Add or update a focused scheduled actor Watch redirect verifier.

It should prove:

- due actor Watch dispatches through the boundary-owned runner
- `watchExecutor.dispatchFor(actor)` no longer uses `runner: collectActorWatch`
- system/radius still uses `collectSystemRadiusWatch`
- `collectActorWatch(...)` remains available but is no longer used by direct or scheduled actor Watch runtime
- task classification remains `evidence-creating`
- success task result includes selected `watch`
- success task result places summary under `data.collection`
- compatibility field parity remains 22 fields
- Watch success updates `last_success_at`, clears `last_error_at`, and sets `next_poll_at`
- Watch failure updates `last_error_at`, `backoff_until`, and `next_poll_at`
- cancellation/timeout behavior remains compatible with current TaskRunner/Watch executor behavior
- API logs still flow through `HttpClient` when fake `fetchImpl` is used
- no live provider calls occur

Run:

```powershell
node --check src\main\watchlist\watchExecutor.js
node --check src\main\discovery\actorWatchDirectBody.js
node --check scripts\<new-or-updated-scheduled-actor-watch-redirect-verifier>.js
npm.cmd run verify:<new-or-updated-scheduled-actor-watch-redirect>
npm.cmd run verify:watch-executor
npm.cmd run verify:watch-actor-direct-redirect
npm.cmd run verify:watch-actor-transport-failure-parity
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
git diff --check
git status --short --branch
```

Use the actual verifier script/command names if they differ.

## Stop Conditions

Stop and report if:

- scheduled redirect requires `WatchSessionExecutor.tick(...)` redesign
- scheduled redirect requires `TaskRunner` redesign
- scheduled redirect requires `recordWatchRunResult(...)` redesign
- direct `actor.watch` would need to change
- system/radius Watch would need to change
- live/provider verification is required
- schema/UI/enforcement/dispatcher work appears necessary

## Expected Handoff

Create:

```txt
workspace/DevHS446-scheduled-actor-watch-redirect.md
```

Include:

- files changed
- exact scheduled actor runner change
- whether a thin scheduled wrapper was used
- verification commands and results
- confirmation that direct `actor.watch` remains HS440
- confirmation that system/radius Watch remains legacy
- confirmation that no collector retirement was performed
