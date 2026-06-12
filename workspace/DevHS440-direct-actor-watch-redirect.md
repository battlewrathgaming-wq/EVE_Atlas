# DevHS440 - Direct Actor Watch Redirect

Status: ready for Overseer review
Date: 2026-06-12
Executor: Dev

## Summary

HS440 redirected only the direct production `actor.watch` call path away from the legacy mixed collector and onto a boundary-owned direct body under Discovery.

Direct path now:

```txt
serviceRegistry
-> runActorWatchService(...)
-> resolveActorInput(...)
-> normalizeActorWatchScope(...)
-> assertLiveAllowed('actor.watch', input, dependencies)
-> runActorWatchDirectBody(input, { ...dependencies, db })
```

Scheduled actor Watch remains parked:

```txt
watchExecutor.dispatchFor(actor)
-> runner: collectActorWatch
```

## Files Changed

- `src/main/services/mutatingActionService.js`
- `src/main/discovery/actorWatchDirectBody.js`
- `scripts/verify-watch-actor-direct-redirect.js`
- `scripts/verify-watch-actor-production-like-fake-client-direct-proof.js`
- `scripts/verify-watch-actor-transport-failure-parity.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS440-direct-actor-watch-redirect.md`

## Redirect Shape

`runActorWatchService(...)` still owns the direct command envelope:

- actor input resolution
- actor Watch scope normalization
- `assertLiveAllowed('actor.watch', input, dependencies)`
- existing production `actor.watch` registry metadata and effects

Only the final call target changed:

```txt
before: collectActorWatch(input, { ...dependencies, db })
after:  runActorWatchDirectBody(input, { ...dependencies, db })
```

`runActorWatchDirectBody(...)` uses:

- real `EvidenceRepository`
- real `HttpClient`
- real `ZKillDiscoveryClient`
- real `EsiClient`
- Discovery-owned zKill candidate acquisition helper
- Discovery-owned pending candidate-ref memory helper
- Discovery-owned expansion queue selection helpers
- existing Evidence/EVEidence writer landing through `EvidenceRepository.persistEvidencePackage(...)`
- existing 22-field actor Watch compatibility summary builder

## Compatibility Proof

`verify:watch-actor-direct-redirect` proves:

- direct `runActorWatchService(...)` no longer calls `collectActorWatch(...)`
- `mutatingActionService.js` no longer imports `actorWatchCollector`
- the direct body does not import or call `collectActorWatch(...)`
- direct actor.watch constructs real `HttpClient`, `ZKillDiscoveryClient`, and `EsiClient`
- scheduled actor Watch still imports `collectActorWatch(...)`
- scheduled actor Watch still dispatches `runner: collectActorWatch`
- production `actor.watch` remains `evidence-creating`
- production `actor.watch` still declares `external-live-api` and `evidence-creation`
- production `actor.watch` remains non-renderer
- direct caller return shape retains the accepted 22-field compatibility summary

Sample focused result:

```txt
direct actor.watch redirect verified
```

## Failure / Logging Parity

HS438 failure/logging parity remains covered by:

```txt
npm.cmd run verify:watch-actor-transport-failure-parity
```

The parity verifier still passes after HS440 and covers:

- real `HttpClient`
- fake `fetchImpl` only
- zKill and ESI API request logging through `EvidenceRepository.insertApiRequestLog(...)`
- success finalization
- retry-after/capacity deferred posture
- terminal expansion failure posture
- invalid JSON posture
- fatal cancellation rethrow and failed fetch-run finalization
- fatal timeout rethrow and failed fetch-run finalization
- zKill discovery failure warning posture

## Boundary Confirmation

Changed:

- direct production `actor.watch` final call target only

Not changed:

- scheduled actor Watch runtime
- `watchExecutor.dispatchFor(...)`
- `WatchSessionExecutor.tick(...)`
- `TaskRunner`
- system/radius Watch behavior
- `collectActorWatch(...)` availability for scheduled legacy path
- service registry production `actor.watch` metadata/effects
- command authority classification
- Hydration
- Observation/report behavior
- Assessment
- schema
- dispatcher / queue / lease behavior
- runtime enforcement activation
- renderer UI
- source terms / protected-word JSON

No live provider verification was run. All provider-shaped verification used fake `fetchImpl` or fixture clients.

## Verification

Passed:

```txt
node --check src\main\discovery\actorWatchDirectBody.js
node --check src\main\services\mutatingActionService.js
node --check scripts\verify-watch-actor-direct-redirect.js
node --check scripts\verify-watch-actor-transport-failure-parity.js
node --check scripts\verify-watch-actor-production-like-fake-client-direct-proof.js
npm.cmd run verify:watch-actor-direct-redirect
npm.cmd run verify:watch-actor-transport-failure-parity
npm.cmd run verify:watch-actor-production-like-fake-client-direct-proof
npm.cmd run verify:watch-actor-controlled-adapter-disabled-seam
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:watch-actor-controlled-runtime-adapter-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Also run:

```txt
rg -n "runActorWatchDirectBody|collectActorWatch|actorWatchCollector" src\main\services\mutatingActionService.js src\main\discovery\actorWatchDirectBody.js src\main\watchlist\watchExecutor.js scripts\verify-watch-actor-direct-redirect.js
```

Result:

- direct service path calls `runActorWatchDirectBody(...)`
- direct service path no longer imports or calls `collectActorWatch(...)`
- direct body no longer imports or calls `collectActorWatch(...)`
- scheduled actor Watch still imports and dispatches `collectActorWatch(...)`

Final hygiene commands are run after this handoff/current update:

```txt
git diff --check
git status --short --branch
```

## Limitations / Parked Work

Still parked:

- scheduled actor Watch redirect
- system/radius Watch redirect
- mixed collector retirement
- live provider verification
- dispatcher / queue / lease work
- schema work
- renderer UI work
- runtime enforcement

This is the first direct behavior-changing actor Watch replacement slice only.
