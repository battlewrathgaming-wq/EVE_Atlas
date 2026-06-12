# DevHS438 - Actor Watch Transport / Failure Parity Proof

Status: Dev handoff complete
Date: 2026-06-12
Executor: Dev

## Summary

Implemented a no-live actor Watch transport/failure parity proof before any production redirect.

The proof uses:

- real `HttpClient`
- real `ZKillDiscoveryClient`
- real `EsiClient`
- fake `fetchImpl`
- fixture-owned `:memory:` DBs only

API request logs are written through:

```txt
HttpClient -> EvidenceRepository.insertApiRequestLog(...)
```

The proof does not manually insert synthetic API logs for the main parity cases.

## Files Changed

- `package.json`
- `scripts/verify-watch-actor-transport-failure-parity.js`
- `src/main/discovery/actorWatchTransportFailureParityProof.js`
- `workspace/current.md`
- `workspace/DevHS438-actor-watch-transport-failure-parity-proof.md`

## Proof Shape

New module:

```txt
src/main/discovery/actorWatchTransportFailureParityProof.js
```

Exports:

```txt
buildActorWatchTransportFailureParityProof(...)
runActorWatchTransportParityDirectBody(...)
```

The near-final direct-body candidate preserves the direct actor Watch shape while using real transport clients with fake fetch:

```txt
normalize actor Watch scope
-> plan actor Watch
-> create fetch run
-> construct HttpClient(repository, runId, fake fetchImpl)
-> construct ZKillDiscoveryClient / EsiClient
-> discover refs / expand refs
-> write API logs through HttpClient
-> finalize success or failed fetch run
```

## Cases Covered

```txt
success_transport_logging:
  zKill 200 logged through HttpClient
  ESI 200 logged through HttpClient
  fetch run finalized success
  persisted killmails: 1

retry_after_capacity_deferred:
  final ESI 429 logged through HttpClient
  retry_count: 1
  rate_limited: true
  provider_capacity_deferred: 1
  failed_refs_count: 0
  fetch run finalized success

terminal_esi_failed_expansion:
  ESI 500 logged through HttpClient
  failed_refs_count: 1
  fetch run finalized success with failed-expansion posture

invalid_json_failure:
  invalid ESI JSON logged through HttpClient
  status_code: null
  error_message present
  failed_refs_count: 1

cancelled_fatal_finalization:
  HTTP_CANCELLED logged through HttpClient
  fatal error rethrown
  fetch run finalized failed
  Evidence/EVEidence writes: 0

timeout_fatal_finalization:
  HTTP_TIMEOUT logged through HttpClient
  fatal error rethrown
  fetch run finalized failed
  Evidence/EVEidence writes: 0

zkill_discovery_failure_warning:
  zKill 500 logged through HttpClient
  collection warning present
  Discovery refs written: 0
  Evidence/EVEidence writes: 0
  fetch run finalized success with warning posture
```

## API Log Fields Proven

Persisted fields asserted by verifier:

- `provider`
- `endpoint`
- `status_code`
- `retry_count`
- `rate_limited`
- `error_message`

Focused proof sample:

```txt
success:
  zkill status=200 retry_count=0 rate_limited=false
  esi status=200 retry_count=0 rate_limited=false

capacity:
  esi status=429 retry_count=1 rate_limited=true error_message=true

terminal:
  esi status=500 retry_count=0 rate_limited=false error_message=true

invalid_json:
  esi status=null retry_count=0 rate_limited=false error_message=true

cancelled:
  esi status=null error_message=true fetch_run_status=failed

timeout:
  esi status=null error_message=true fetch_run_status=failed

zkill_failure:
  zkill status=500 error_message=true fetch_run_status=success with warning
```

## Fetch-Run Finalization Behavior

Proven:

- successful transport case finalizes `fetch_runs.status = success`
- ESI provider capacity finalizes `success` with `provider_capacity_deferred`
- terminal ESI failure finalizes `success` with `failed_expansion`
- invalid JSON finalizes `success` with `failed_expansion`
- zKill discovery failure finalizes `success` with collection warning and no Evidence/EVEidence
- cancellation finalizes `failed` before rethrow
- timeout finalizes `failed` before rethrow

## Boundary Confirmation

No live provider calls:

```txt
fake_fetch_impl_only: true
provider_calls: 0
live_api_calls: 0
```

No production redirect:

- production `actor.watch` unchanged
- `runActorWatchService(...)` production call target unchanged
- `watchExecutor.dispatchFor(...)` unchanged
- scheduled actor Watch remains parked on legacy collector
- `collectActorWatch(...)` remains available for legacy paths

Strict import/call proof:

```txt
rg -n "require\(.*actorWatchCollector|collectActorWatch\(" src\main\discovery\actorWatchTransportFailureParityProof.js scripts\verify-watch-actor-transport-failure-parity.js
```

Result:

```txt
no matches
```

## Verification

Syntax checks:

```txt
node --check src\main\discovery\actorWatchTransportFailureParityProof.js
node --check scripts\verify-watch-actor-transport-failure-parity.js
```

Result:

```txt
passed
```

Focused verifier:

```txt
npm.cmd run verify:watch-actor-transport-failure-parity
```

Result:

```txt
passed
```

Required regression verification:

```txt
npm.cmd run verify:watch-actor-production-like-fake-client-direct-proof
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
verify:watch-actor-production-like-fake-client-direct-proof passed
verify:watch-actor-controlled-adapter-disabled-seam passed
verify:watch-actor-controlled-adapter-return-path passed
verify:watch-actor-controlled-runtime-adapter-fixture passed
verify:service-registry passed with 300 second timeout
verify:command-authority passed
verify:passive-side-effects passed
verify:enforcement-dry-run passed; 116 commands covered, 0 gaps
git diff --check passed with CRLF normalization warnings only
git status --short --branch showed main...origin/main [ahead 19] with the existing broad working set plus HS438 files
```

## Limitations Still Remaining

- This is still a proof, not production redirect.
- The near-final proof candidate proves transport logging and fatal finalization shape, but `runActorWatchService(...)` is not changed.
- Scheduled actor Watch still remains on the legacy collector.
- The proof uses fake fetch responses; no live provider behavior, real network latency, or real provider headers beyond fixture `Retry-After` are exercised.
- Full live provider retry/rate-limit behavior remains parked until an explicit live runway.

## Boundary Confirmation

No production `actor.watch` redirect, scheduled Watch redirect, `runActorWatchService(...)` production call-target change, `watchExecutor.dispatchFor(...)` change, `WatchSessionExecutor.tick(...)` invocation, `TaskRunner` change, `collectActorWatch(...)` invocation/import/retirement in the new proof path, live/provider call, operator DB write, operator Discovery ref write, operator Evidence/EVEidence write, Hydration write, Observation/report path change, system/radius Watch behavior change, schema, dispatcher/queue/lease behavior, runtime enforcement, command blocking, renderer UI, source-term rename, or protected-word JSON update was added.
