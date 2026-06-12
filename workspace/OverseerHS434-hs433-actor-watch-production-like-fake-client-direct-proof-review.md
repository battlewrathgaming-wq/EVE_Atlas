# OverseerHS434 - HS433 Actor Watch Production-Like Fake-Client Direct Proof Review

Status: accepted
Date: 2026-06-12
Role: Overseer

## Review Target

Dev handoff:

```txt
workspace/DevHS433-actor-watch-production-like-fake-client-direct-proof.md
```

Runway:

```txt
workspace/OverseerHS433-actor-watch-production-like-fake-client-direct-proof-runway.md
```

## Decision

HS433 is accepted.

The proof shows that a future direct `actor.watch` replacement body can run in a production-like shape with:

- fixture-owned DB mutation only
- injected fake zKill and ESI clients
- candidate-ref acquisition/status movement
- selected-ref ESI-backed expansion posture
- Evidence/EVEidence writer landing
- fetch-run finalization
- warning posture
- caller compatibility summary field parity

This does not authorize production redirect by itself.

## Boundary Confirmation

Confirmed:

- no production `actor.watch` redirect
- no scheduled Watch redirect
- no `runActorWatchService(...)` production call-target change
- no `watchExecutor.dispatchFor(...)` change
- no `WatchSessionExecutor.tick(...)` change
- no `TaskRunner` change
- no `collectActorWatch(...)` import/call/retirement in the new proof body
- no live zKill or ESI calls
- no operator DB / corpus writes
- no operator Discovery ref writes
- no operator Evidence/EVEidence writes
- no Hydration writes
- no Observation/report path changes
- no system/radius Watch behavior changes
- no schema changes
- no dispatcher / queue / lease behavior changes
- no runtime enforcement activation
- no renderer UI
- no source-term rename or protected-word JSON update

## Accepted Limitation

API request count posture is represented with synthetic fixture `api_request_logs`.

This proves count posture in fixture DBs. It does not prove true `HttpClient` / `ZKillDiscoveryClient` / `EsiClient` transport logging parity.

That limitation is acceptable for HS433 because the packet was fake-client proof, not live/provider transport proof.

## Verification Run By Overseer

```txt
npm.cmd run verify:watch-actor-production-like-fake-client-direct-proof
npm.cmd run verify:watch-actor-controlled-adapter-disabled-seam
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:watch-actor-controlled-runtime-adapter-fixture
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
node --check src\main\discovery\actorWatchProductionLikeFakeClientDirectProof.js
node --check scripts\verify-watch-actor-production-like-fake-client-direct-proof.js
git diff --check
```

Results:

- all listed verifiers passed
- `verify:service-registry` passed with 300 second timeout
- `verify:enforcement-dry-run` remained complete: 116 commands covered, 0 gaps
- `git diff --check` passed with CRLF normalization warnings only

## Next Decision

HS433 moves Atlas to a real decision point.

Potential next seams:

1. Direct production `actor.watch` redirect packet, with strict no-live verification.
2. Failure/logging parity advisory or proof before redirect.
3. Park direct redirect and inspect scheduled actor Watch split next.

Overseer recommendation:

```txt
open a small decision surface before Dev, because production redirect is the first behavior-changing seam in this chain
```

