# OverseerHS438 - Actor Watch Transport / Failure Parity Proof Runway

Status: open
Date: 2026-06-12
Executor: Dev

## Purpose

Prove that the future direct `actor.watch` boundary-owned body can preserve provider transport logging and fatal failure finalization semantics before any production redirect.

This packet exists because HS436 found that HS433 represented API count posture with synthetic fixture logs, but did not prove `HttpClient` transport logging parity or top-level failed fetch-run finalization parity.

This is a proof packet, not a redirect packet.

## Source Truth

Read:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/EngineeringTraceHS436-actor-watch-failure-logging-parity.md`
- `workspace/OverseerHS437-hs436-actor-watch-failure-logging-parity-review.md`
- `workspace/DevHS433-actor-watch-production-like-fake-client-direct-proof.md`
- `src/main/api/httpClient.js`
- `src/main/api/zkillClient.js`
- `src/main/api/esiClient.js`
- `src/main/services/mutatingActionService.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/discovery/actorWatchProductionLikeFakeClientDirectProof.js`
- `src/main/discovery/zkillCandidateAcquisition.js`
- `src/main/discovery/esiBackedExpansionPackage.js`
- `src/main/db/evidenceRepository.js`

## Required Shape

Add a narrow no-live proof using:

- real `HttpClient`
- fake `fetchImpl`
- real `ZKillDiscoveryClient` and `EsiClient` where practical
- fixture-owned DB only
- the boundary-owned direct body or a near-final direct-body candidate

The proof must log through:

```txt
HttpClient -> EvidenceRepository.insertApiRequestLog(...)
```

Do not manually insert synthetic API logs for the main parity proof.

## Minimum Cases

Prove:

- successful zKill logging through `HttpClient`
- successful ESI logging through `HttpClient`
- retryable HTTP status with retry count recorded
- `Retry-After` path represented without waiting on real provider time
- final `420` / `429` / `503` ESI capacity posture becomes `provider_capacity_deferred`
- terminal ESI failure becomes `failed_expansion`
- invalid JSON / validation failure posture is represented
- cancellation / timeout rethrows and finalizes fetch run as failed
- zKill discovery failure remains a collection warning and does not create Evidence/EVEidence
- persisted API log fields include expected provider, endpoint, status, retry_count, rate_limited, and error_message posture
- fetch run finalizes success or failure consistently with old collector semantics

## Must Not Change

Do not change:

- production `actor.watch`
- `runActorWatchService(...)` production call target
- `watchExecutor.dispatchFor(...)`
- scheduled actor Watch behavior
- `WatchSessionExecutor.tick(...)`
- `TaskRunner`
- `collectActorWatch(...)` availability for legacy paths
- service registry production `actor.watch` metadata
- command authority
- operator corpus rows
- operator Discovery refs
- operator Evidence/EVEidence
- Hydration
- Observation/report behavior
- system/radius Watch behavior
- schema
- dispatcher / queue / lease behavior
- runtime enforcement activation
- renderer UI
- source terms / protected-word JSON

No live zKill or ESI calls.

## Verification Required

Create a focused verifier, recommended:

```txt
npm.cmd run verify:watch-actor-transport-failure-parity
```

The verifier must prove:

- proof uses fake `fetchImpl`
- proof does not make live provider calls
- proof uses fixture-owned DB only
- proof logs via `HttpClient`, not manual synthetic insertion
- new proof path does not import or call `collectActorWatch(...)`
- production `actor.watch` remains unchanged
- scheduled actor Watch remains parked on legacy collector
- no Hydration, Observation, system/radius, schema, dispatcher, runtime enforcement, UI, or source-term change

Also run:

```txt
node --check <touched JavaScript files>
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

If a broad verifier times out, rerun with a longer timeout and report that.

## Stop Conditions

Stop and report if the proof requires:

- production `actor.watch` redirect
- scheduled Watch redirect
- live provider access
- operator corpus mutation
- schema changes
- renderer/UI changes
- runtime enforcement changes
- treating synthetic fixture API logs as transport parity
- swallowing cancellation/timeout as warnings
- leaving fatal runs in `running` posture
- turning zKill discovery failure into Evidence/EVEidence failure without explicit acceptance
- turning ESI provider capacity/rate-limit into terminal failed expansion without explicit acceptance

## Expected Handoff

Create:

```txt
workspace/DevHS438-actor-watch-transport-failure-parity-proof.md
```

The handoff must include:

- files changed
- proof shape
- cases covered
- API log fields proven
- fetch-run finalization behavior proven
- explicit no-live-provider confirmation
- explicit no-production-redirect confirmation
- verification commands and results
- limitations still remaining before direct redirect

