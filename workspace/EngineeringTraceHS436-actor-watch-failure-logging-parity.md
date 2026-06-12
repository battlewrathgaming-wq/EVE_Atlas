# EngineeringTraceHS436 - Actor Watch Failure / Logging Parity

Status: advisory/source-trace only  
Date: 2026-06-12  
Role: Engineering / source trace  

## 1. Request Restatement

HS436 asks whether direct production `actor.watch` can safely redirect after HS433, or whether API logging and failure semantics need another proof first.

Conclusion: **another narrow no-live proof is needed first**. HS433 proves production-like fixture mutation and caller shape, but it does not prove true `HttpClient` transport logging parity, and the current boundary-owned direct body does not yet preserve the old collector's top-level failed-run finalization behavior for fatal provider/cancellation paths.

Recommended next seam: **failure/logging parity proof using real `HttpClient` with fake `fetchImpl`, plus injected failure cases**, still with no production redirect and no live provider calls.

## 2. Files Traced

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS436-actor-watch-failure-logging-parity-trace-request.md`
- `workspace/OverseerHS435-actor-watch-direct-redirect-decision-surface.md`
- `workspace/OverseerHS434-hs433-actor-watch-production-like-fake-client-direct-proof-review.md`
- `workspace/DevHS433-actor-watch-production-like-fake-client-direct-proof.md`
- `workspace/EngineeringTraceHS431-actor-watch-production-redirect-readiness.md`
- `src/main/services/mutatingActionService.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/discovery/actorWatchProductionLikeFakeClientDirectProof.js`
- `src/main/discovery/zkillCandidateAcquisition.js`
- `src/main/discovery/esiBackedExpansionPackage.js`
- `src/main/discovery/expansionQueueSelection.js`
- `src/main/db/evidenceRepository.js`
- `src/main/api/httpClient.js`
- `src/main/api/zkillClient.js`
- `src/main/api/esiClient.js`

## 3. Current Production Direct `actor.watch` Provider / Client Path

Direct production `actor.watch` currently enters through `runActorWatchService(...)`:

- `src/main/services/mutatingActionService.js:52` defines `runActorWatchService(...)`.
- `src/main/services/mutatingActionService.js:53` resolves actor input.
- `src/main/services/mutatingActionService.js:54` normalizes actor Watch scope.
- `src/main/services/mutatingActionService.js:60` runs `assertLiveAllowed('actor.watch', input, dependencies)`.
- `src/main/services/mutatingActionService.js:61` calls `collectActorWatch(input, { ...dependencies, db })`.

The current collector creates production clients when dependencies do not inject them:

- `src/main/workers/actorWatchCollector.js:28` creates `new HttpClient({ repository, runId, signal, timeoutMs })`.
- `src/main/workers/actorWatchCollector.js:34` creates `new ZKillDiscoveryClient(httpClient)`.
- `src/main/workers/actorWatchCollector.js:35` creates `new EsiClient(httpClient)`.

So the present direct path shares one `HttpClient` across zKill candidate acquisition and ESI-backed killmail expansion.

## 4. Current API Request Logging Path

API request logs are written by `HttpClient`, not by `ZKillDiscoveryClient` or `EsiClient` directly.

Source trace:

- `src/main/api/httpClient.js:29` starts `HttpClient.json(...)`.
- `src/main/api/httpClient.js:53` logs successful responses.
- `src/main/api/httpClient.js:64` logs final non-ok HTTP status responses.
- `src/main/api/httpClient.js:79` logs non-retryable normalized request errors.
- `src/main/api/httpClient.js:101` logs final retry exhaustion errors.
- `src/main/api/httpClient.js:119` writes through `repository.insertApiRequestLog(...)`.
- `src/main/db/evidenceRepository.js:399` persists API request log rows.
- `src/main/db/evidenceRepository.js:592` sanitizes persisted endpoint/error fields before insert.

Provider-specific calls:

- `src/main/api/zkillClient.js` builds zKill discovery endpoints and calls `httpClient.json('zkill', endpoint)`.
- `src/main/api/esiClient.js` validates killmail id/hash and calls `httpClient.json('esi', endpoint)`.

The old collector then derives API call counts from persisted logs:

- `src/main/workers/actorWatchCollector.js:88` reads API counts before summary/finalization.
- `src/main/workers/actorWatchCollector.js:173` groups `api_request_logs` by provider for the run.

## 5. HS433 Logging / Count Posture Comparison

HS433 mirrors API count posture but bypasses true transport logging.

Source trace:

- `src/main/discovery/actorWatchProductionLikeFakeClientDirectProof.js:130` says `http_client_logging_parity_proven: false`.
- `src/main/discovery/actorWatchProductionLikeFakeClientDirectProof.js:325` reports `synthetic_fixture_logs: true`.
- `src/main/discovery/actorWatchProductionLikeFakeClientDirectProof.js:328` again reports `http_client_logging_parity_proven: false`.
- `src/main/discovery/actorWatchProductionLikeFakeClientDirectProof.js:403` defines fixture zKill client.
- `src/main/discovery/actorWatchProductionLikeFakeClientDirectProof.js:412` manually inserts zKill fixture API logs.
- `src/main/discovery/actorWatchProductionLikeFakeClientDirectProof.js:428` defines fixture ESI client.
- `src/main/discovery/actorWatchProductionLikeFakeClientDirectProof.js:435` manually inserts ESI fixture API logs.

This is an honest HS433 limitation. It proves that the boundary-owned body can count API-like rows and return compatibility fields, but it does not prove that `HttpClient` status, retry, timeout, cancellation, rate-limit, endpoint sanitization, and error logging flow through the new path.

## 6. Failure / Retry / Timeout / Rate-Limit / Cancellation Semantics

### zKill Acquisition

`discoverActorRefs(...)` currently catches zKill discovery errors and converts them into collection warnings:

- `src/main/discovery/zkillCandidateAcquisition.js:1` defines `discoverActorRefs(...)`.
- `src/main/discovery/zkillCandidateAcquisition.js:20` warns on non-array zKill responses.
- `src/main/discovery/zkillCandidateAcquisition.js:47` catches zKill errors.
- `src/main/discovery/zkillCandidateAcquisition.js:48` records a warning message.

This means zKill discovery failure does not necessarily fail the whole actor collection run. The run can finalize as success with warnings and zero/fewer refs.

### ESI-Backed Expansion

`buildEvidencePackageFromRefs(...)` treats ESI failures differently by failure type:

- `src/main/discovery/esiBackedExpansionPackage.js:27` rethrows cancellation-style errors: `HTTP_CANCELLED`, `TASK_CANCELLED`, or `AbortError`.
- `src/main/discovery/esiBackedExpansionPackage.js:33` records `provider_capacity_deferred` warnings for capacity/rate-limit-like provider failures.
- `src/main/discovery/esiBackedExpansionPackage.js:42` records `failed_expansion` warnings for other expansion failures.
- `src/main/discovery/esiBackedExpansionPackage.js:75` defines provider-capacity classification.
- `src/main/discovery/esiBackedExpansionPackage.js:78` includes status `420`, `429`, and `503` in capacity/deferred classification.

The selected-ref expansion failure posture is therefore not simply pass/fail:

- cancellation aborts the run
- provider capacity defers the ref through warnings without incrementing failed count
- ordinary terminal/payload/validation errors increment failed expansion count and warnings

### HTTP Retry / Rate-Limit / Timeout

`HttpClient` owns provider transport retry and request logging:

- `src/main/api/httpClient.js:4` defines retry statuses `420`, `429`, and `503`.
- `src/main/api/httpClient.js:6` sets default max attempts to `3`.
- `src/main/api/httpClient.js:58` retries retryable statuses when attempts remain.
- `src/main/api/httpClient.js:137` honors `Retry-After` when present.
- `src/main/api/httpClient.js:199` normalizes request errors.
- `src/main/api/httpClient.js:240` creates cancellation/timeout errors.
- `src/main/api/httpClient.js:247` creates logged terminal HTTP status errors.

Timeout becomes `HTTP_TIMEOUT` with `TimeoutError`. Cancellation becomes `HTTP_CANCELLED` with `AbortError`. Final non-ok HTTP status throws `HTTP_STATUS_ERROR` with `statusCode` and `logged = true`.

### Old Collector Fatal Failure Finalization

The current old collector finalizes failed runs in a top-level catch:

- `src/main/workers/actorWatchCollector.js:145` catches fatal errors.
- `src/main/workers/actorWatchCollector.js:146` reads API counts.
- `src/main/workers/actorWatchCollector.js:147` finalizes the fetch run with status `failed`.

That behavior is not a minor detail. It prevents fatal provider/cancellation paths from leaving a fetch run in `running` posture.

## 7. Boundary-Owned Body Preservation Readiness

The boundary-owned direct body has a reasonable place to preserve these semantics, because HS433 already routes through the same Discovery helper functions:

- zKill acquisition still goes through `discoverActorRefs(...)`.
- candidate selection still goes through `selectExpansionCandidates(...)`.
- ESI-backed expansion still goes through `buildEvidencePackageFromRefs(...)`.
- candidate failure marking still goes through `markFailedExpansionCandidates(...)`.
- Evidence/EVEidence landing still goes through `EvidenceRepository.persistEvidencePackage(...)`.

However, HS433 is not ready to be redirected as-is because:

- `runActorWatchProductionLikeDirectBody(...)` requires injected clients and does not create production `HttpClient` / `ZKillDiscoveryClient` / `EsiClient`.
- it does not exercise `HttpClient` logging.
- it does not prove retry-after, retry count, rate-limited, timeout, invalid JSON, final HTTP status, or cancellation logging.
- it lacks the old collector's top-level failed-run finalization catch.

So the issue is not that the model cannot preserve failure/logging semantics. The issue is that source does not yet prove the direct body preserves them.

## 8. Risks And Stop Conditions

Stop before direct redirect if:

- the redirect would use synthetic fixture API logs as evidence of transport logging parity
- the redirected path would not construct or receive a real `HttpClient` with repository/run id/signal/timeout
- fatal errors can leave `fetch_runs.status = running`
- cancellation or timeout is swallowed into a warning instead of aborting/finalizing failed as the old collector does
- zKill discovery failure becomes Evidence failure or task failure without deliberate acceptance
- provider capacity/rate-limit ESI failures become terminal failed expansions without deliberate acceptance
- `api_request_logs.retry_count`, `rate_limited`, `status_code`, `error_message`, or sanitization behavior changes silently
- direct redirect touches scheduled Watch, `watchExecutor.dispatchFor(...)`, `collectActorWatch(...)` retirement, system/radius Watch, Hydration, Observation, schema, dispatcher/queue/lease behavior, runtime enforcement, UI, or source terms

Residual risk if a redirect proceeds without another proof:

- API counts may be correct in success paths but wrong or absent in retry/failure paths.
- failed/cancelled runs may lose finalization parity.
- the first production redirect would combine replacement behavior with unproven failure/logging behavior, making regression diagnosis harder.

## 9. Recommendation

Classification: **another fake/no-live proof is needed first**.

More precise shape: a narrow **transport/failure parity proof** should run before direct production `actor.watch` redirect.

This does not need a broad provider/client review. The code is localized enough for a focused proof:

- use real `HttpClient`
- use fake `fetchImpl`
- use real `ZKillDiscoveryClient` and `EsiClient` where practical
- use fixture-owned DB only
- exercise the boundary-owned direct body or a near-final direct-body candidate
- prove successful logging parity and failure finalization parity
- do not redirect production `actor.watch`

## 10. Verification Required For The Next Packet

For the next proof packet:

- `node --check` for touched JavaScript files.
- focused verifier for actor Watch failure/logging parity.
- existing HS433 verifier still passes.
- existing HS428, HS423, and HS419 verifiers still pass.
- command authority, service registry, passive side-effects, and enforcement dry-run verifiers still pass.
- strict `rg` proof that the new proof path does not import or call `collectActorWatch(...)`.
- proof uses fake `fetchImpl`, not live provider calls.
- proof logs through `HttpClient -> EvidenceRepository.insertApiRequestLog(...)`, not manual synthetic fixture log insertion.

Minimum cases to prove:

- successful zKill and ESI logging through `HttpClient`
- retryable HTTP status with retry count recorded
- `Retry-After` path represented without waiting on real provider time
- final `420` / `429` / `503` ESI capacity posture becomes `provider_capacity_deferred`
- terminal ESI failure becomes `failed_expansion`
- invalid JSON / validation failure posture is represented
- cancellation / timeout rethrows and finalizes fetch run as failed
- zKill discovery failure remains a collection warning and does not create Evidence/EVEidence
- API log fields persist with expected provider, endpoint, status, retry_count, rate_limited, error_message posture
- fetch run finalizes success or failure consistently with the old collector semantics

For a later direct redirect packet, after that proof is accepted:

- change only direct `actor.watch` call target in `runActorWatchService(...)`
- preserve actor resolution, scope normalization, and `assertLiveAllowed('actor.watch', ...)`
- keep scheduled actor Watch on legacy `collectActorWatch(...)`
- keep production command metadata/effects/enforcement posture unchanged
- verify direct path no longer imports/calls `collectActorWatch(...)`
- verify scheduled legacy path still imports/uses `collectActorWatch(...)`
- verify no live provider calls in tests
- verify no Hydration, Observation, system/radius, schema, dispatcher, runtime enforcement, UI, or source-term changes

## 11. Parked Items

- production direct `actor.watch` redirect
- scheduled actor Watch redirect
- `watchExecutor.dispatchFor(...)` replacement
- `WatchSessionExecutor.tick(...)` changes
- `TaskRunner` changes
- `collectActorWatch(...)` retirement
- live zKill / ESI provider movement expansion
- operator corpus writes through the new direct path
- Hydration writes
- Observation/report changes
- system/radius Watch movement
- schema changes
- durable Discovery task/packet persistence
- dispatcher / queue / lease behavior
- runtime enforcement activation
- renderer UI
- source-term rename or protected-word JSON updates

