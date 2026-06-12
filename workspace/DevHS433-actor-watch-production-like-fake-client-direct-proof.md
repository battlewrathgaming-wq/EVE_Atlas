# DevHS433 - Actor Watch Production-Like Fake-Client Direct Proof

Status: Dev handoff complete
Date: 2026-06-11
Executor: Dev

## Summary

Implemented a production-like fake-client direct actor Watch proof body without redirecting production `actor.watch`.

The new proof exercises a function shaped like a future direct `runActorWatchService(...)` replacement body:

```txt
actor input resolution
-> current actor Watch scope normalization
-> actor.watch live-gate posture representation
-> actor Watch planning
-> pending Discovery refs preferred before fresh zKill candidate acquisition
-> selected-ref ESI-backed expansion
-> Evidence/EVEidence writer landing in fixture DB
-> caller compatibility summary
```

The proof uses fixture-owned `:memory:` DBs and injected fake clients only. It does not use the HS428 disabled seam as production authority.

## Files Changed

- `package.json`
- `scripts/verify-watch-actor-production-like-fake-client-direct-proof.js`
- `src/main/discovery/actorWatchProductionLikeFakeClientDirectProof.js`
- `workspace/current.md`
- `workspace/DevHS433-actor-watch-production-like-fake-client-direct-proof.md`

## Proof Shape

New module:

```txt
src/main/discovery/actorWatchProductionLikeFakeClientDirectProof.js
```

Exports:

```txt
buildActorWatchProductionLikeFakeClientDirectProof(...)
runActorWatchProductionLikeDirectBody(...)
```

The direct body accepts a DB, actor-watch payload, and injected fake zKill/ESI clients. The focused verifier invokes it through fixture-owned DB cases.

## Fixture DB / Write Classes Represented

Represented in disposable fixture DBs only:

- fetch-run lifecycle rows
- Discovery candidate refs
- selected candidate-ref status
- expanded candidate-ref status
- cached candidate-ref status
- failed candidate-ref status
- Evidence/EVEidence writer landing for fake expanded killmail payloads
- activity events
- entity updates
- ingestion audits
- data quality warnings
- synthetic fixture `api_request_logs` for API count posture

Cases covered:

```txt
fresh_direct_actor_watch:
  fake zKill invocations: 1
  fake ESI invocations: 2
  refs written: 3
  selected refs: 2
  expanded refs: 2
  persisted killmails: 2
  activity events: 12
  status counts: expanded=2, pending=1

pending_direct_actor_watch:
  fake zKill invocations: 0
  fake ESI invocations: 2
  pending refs considered: 2
  selected refs: 2
  expanded refs: 2
  persisted killmails: 2

cached_direct_actor_watch:
  fake zKill invocations: 1
  fake ESI invocations: 1
  cached refs: 1
  expanded refs: 1
  persisted killmails: 1
  status counts: cached=1, expanded=1

failed_direct_actor_watch:
  fake zKill invocations: 1
  fake ESI invocations: 1
  failed refs: 1
  persisted killmails: 0
  status counts: failed=1
```

## API Count Posture

The proof represents API request count posture with synthetic fixture logs:

```txt
represented: true
fixture_synthetic_logs: true
http_client_logging_parity_proven: false
```

Limitation:

```txt
Injected fake clients insert fixture api_request_logs for count posture; they do not exercise HttpClient/ZKillDiscoveryClient/EsiClient transport logging.
```

## Compatibility Summary

The proof returns the boundary-owned caller compatibility summary.

Validated:

```txt
field_count: 22
missing: []
extra: []
matches: true
```

## Runtime Boundary Confirmation

Production `actor.watch` did not redirect.

Confirmed:

- production `actor.watch` command remains registered as `evidence-creating`
- production `actor.watch` retains `external-live-api`
- production `actor.watch` retains `evidence-creation`
- production `actor.watch` remains non-renderer
- `runActorWatchService(...)` still routes to the legacy collector in this packet
- scheduled actor Watch remains parked on the legacy collector
- `watchExecutor.dispatchFor(...)` remains unchanged
- `collectActorWatch(...)` remains available for the legacy paths and was not retired

Strict import/call proof for the new proof body:

```txt
rg -n "require\(.*actorWatchCollector|collectActorWatch\(" src\main\discovery\actorWatchProductionLikeFakeClientDirectProof.js scripts\verify-watch-actor-production-like-fake-client-direct-proof.js
```

Result:

```txt
no matches
```

## Verification

Syntax checks:

```txt
node --check src\main\discovery\actorWatchProductionLikeFakeClientDirectProof.js
node --check scripts\verify-watch-actor-production-like-fake-client-direct-proof.js
```

Result:

```txt
passed
```

Focused verifier:

```txt
npm.cmd run verify:watch-actor-production-like-fake-client-direct-proof
```

Result:

```txt
passed
```

Required regression verification:

```txt
npm.cmd run verify:watch-actor-controlled-adapter-disabled-seam
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:watch-actor-controlled-runtime-adapter-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
git diff --check
git status --short --branch
```

Results:

```txt
verify:watch-actor-controlled-adapter-disabled-seam passed
verify:watch-actor-controlled-adapter-return-path passed
verify:watch-actor-controlled-runtime-adapter-fixture passed
verify:service-registry passed with 300 second timeout
verify:command-authority passed
verify:passive-side-effects passed
verify:enforcement-dry-run passed; 116 commands covered, 0 gaps
git diff --check passed with CRLF normalization warnings only
git status --short --branch showed main...origin/main [ahead 19] with the existing broad working set plus HS433 files
```

## Boundary Confirmation

No production `actor.watch` redirect, scheduled Watch redirect, `runActorWatchService(...)` production call-target change, `watchExecutor.dispatchFor(...)` change, `WatchSessionExecutor.tick(...)` invocation, `TaskRunner` change, `collectActorWatch(...)` invocation/import/retirement in the new proof body, live/provider call, operator DB write, operator Discovery ref write, operator Evidence/EVEidence write, Hydration write, Observation/report path change, system/radius Watch behavior change, schema, dispatcher/queue/lease behavior, runtime enforcement, command blocking, renderer UI, source-term rename, or protected-word JSON update was added.

## Limitations / Parity Gaps

- This is a proof body, not production redirect.
- API request count posture is represented with synthetic fixture `api_request_logs`; true HttpClient/ZKillDiscoveryClient/EsiClient transport logging parity remains unproven.
- Failure coverage proves selected-ref expansion failure posture, not the full live provider retry/rate-limit/cancellation matrix.
- Direct and scheduled production paths remain on the legacy collector until a future accepted redirect packet.
