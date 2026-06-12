# DevHS446 - Scheduled Actor Watch Redirect

Status: ready for Overseer review
Date: 2026-06-12
Executor: Dev

## Summary

HS446 redirected only scheduled actor Watch from the legacy mixed collector runner to the boundary-owned actor Watch route.

Direct actor Watch remains the HS440 path:

```txt
serviceRegistry -> runActorWatchService(...) -> runActorWatchDirectBody(...)
```

Scheduled actor Watch now routes:

```txt
watchExecutor.dispatchFor(actor)
-> command: actor.watch
-> runner: runScheduledActorWatch
-> runActorWatchDirectBody(...)
```

Watch remains scheduler/cadence/result owner.

## Files Changed

- `src/main/watchlist/watchExecutor.js`
- `scripts/verify-watch-actor-scheduled-redirect.js`
- `scripts/verify-watch-actor-direct-redirect.js`
- `scripts/verify-watch-actor-transport-failure-parity.js`
- `scripts/verify-watch-actor-controlled-adapter-return-path.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS446-scheduled-actor-watch-redirect.md`

## Exact Scheduled Runner Change

In `dispatchFor(watch)`, the actor branch changed from:

```txt
runner: collectActorWatch
```

to:

```txt
runner: runScheduledActorWatch
```

The thin wrapper is:

```txt
runScheduledActorWatch(payload, dependencies) -> runActorWatchDirectBody(payload, dependencies)
```

This wrapper was used to name/assert the scheduled boundary while preserving the existing scheduled runner signature.

## Preserved Runtime Shape

Preserved:

- `WatchSessionExecutor.tick(...)`
- `TaskRunner`
- `recordWatchRunResult(...)`
- `actionGate(dispatch.command, dispatch.payload)`
- task classification as `evidence-creating`
- `taskContext.signal` propagation through `dependencies.signal`
- scheduled task result shape:

```txt
{ status: 'succeeded', data: { watch, collection } }
```

- 22-field actor Watch compatibility summary under `data.collection`
- direct `actor.watch` behavior from HS440
- system/radius Watch legacy path through `collectSystemRadiusWatch(...)`
- `collectActorWatch(...)` availability for now

## Focused Proof

Added:

```txt
scripts/verify-watch-actor-scheduled-redirect.js
npm.cmd run verify:watch-actor-scheduled-redirect
```

The verifier proves:

- due actor Watch dispatches through `runScheduledActorWatch`
- `watchExecutor.dispatchFor(actor)` no longer uses `runner: collectActorWatch`
- system/radius still uses `collectSystemRadiusWatch`
- direct `actor.watch` remains the HS440 direct body path
- `collectActorWatch(...)` remains available but is no longer used by direct or scheduled actor Watch runtime
- task classification remains `evidence-creating`
- success task result includes selected `watch`
- success task result places the 22-field summary under `data.collection`
- success updates `last_success_at`, clears `last_error_at`, and sets `next_poll_at`
- timeout-style failure updates `last_error_at`, `backoff_until`, and `next_poll_at`
- fake `fetchImpl` drives zKill and ESI through real `HttpClient`
- API logs are written through `HttpClient -> EvidenceRepository.insertApiRequestLog(...)`
- no live provider calls occur

Sample focused result:

```txt
scheduled actor Watch redirect verified
```

## Verification

Passed:

```txt
node --check src\main\watchlist\watchExecutor.js
node --check src\main\discovery\actorWatchDirectBody.js
node --check scripts\verify-watch-actor-scheduled-redirect.js
node --check scripts\verify-watch-actor-direct-redirect.js
node --check scripts\verify-watch-actor-transport-failure-parity.js
node --check scripts\verify-watch-actor-controlled-adapter-return-path.js
npm.cmd run verify:watch-actor-scheduled-redirect
npm.cmd run verify:watch-executor
npm.cmd run verify:watch-actor-direct-redirect
npm.cmd run verify:watch-actor-transport-failure-parity
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Additional source-boundary sweep:

```txt
rg -n "collectActorWatch|runScheduledActorWatch|runActorWatchDirectBody|collectSystemRadiusWatch|runner:" src\main\watchlist\watchExecutor.js src\main\services\mutatingActionService.js src\main\discovery\actorWatchDirectBody.js src\main\workers\actorWatchCollector.js scripts\verify-watch-actor-scheduled-redirect.js
```

Result:

- direct service path calls `runActorWatchDirectBody(...)`
- scheduled actor Watch dispatch uses `runner: runScheduledActorWatch`
- scheduled wrapper calls `runActorWatchDirectBody(...)`
- system/radius Watch dispatch still uses `runner: collectSystemRadiusWatch`
- `collectActorWatch(...)` remains defined/exported in `actorWatchCollector.js`
- direct body does not import or call `collectActorWatch(...)`

Final hygiene commands are run after this handoff/current update:

```txt
git diff --check
git status --short --branch
```

## Boundary Confirmation

Changed:

- scheduled actor Watch runner target only

Not changed:

- direct `actor.watch` behavior beyond the already accepted HS440 path
- `WatchSessionExecutor.tick(...)`
- `TaskRunner`
- `recordWatchRunResult(...)`
- system/radius Watch behavior
- `collectSystemRadiusWatch(...)`
- `collectActorWatch(...)` availability
- schema
- dispatcher / queue / lease behavior
- runtime enforcement or command blocking
- Hydration
- Observation/report behavior
- Assessment behavior
- renderer UI
- source terms / protected-word JSON

No collector retirement was performed.
No live provider verification was run.
