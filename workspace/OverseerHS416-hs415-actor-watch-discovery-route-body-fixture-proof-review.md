# Overseer HS416 - HS415 Actor Watch Discovery Route Body Fixture Review

Status: accepted
Date: 2026-06-08
Role: Overseer

## Reviewed

- `workspace/OverseerHS415-actor-watch-discovery-route-body-fixture-proof-runway.md`
- `workspace/DevHS415-actor-watch-discovery-route-body-fixture-proof.md`
- `src/main/discovery/actorWatchDiscoveryRouteBodyFixture.js`
- `src/main/services/watchActorDiscoveryRouteBodyFixtureService.js`
- `scripts/verify-watch-actor-discovery-route-body-fixture.js`
- related command registry, command authority, passive side-effect, and enforcement dry-run coverage

## Decision

HS415 is accepted.

The packet proves a Discovery-owned actor Watch route body in fixture form. It accepts actor Watch-shaped input, composes Discovery-owned helper surfaces, uses injected fake clients, returns an old caller-facing compatibility summary, and does not redirect production `actor.watch`.

This is the expected proof stage before any runtime adapter, redirect, collector retirement, provider movement, or durable write behavior.

## Accepted Result

- `watch.actor_discovery_route_body_fixture.preview` is registered as a read-only preview command.
- `src/main/discovery/actorWatchDiscoveryRouteBodyFixture.js` owns the route-body fixture proof.
- `src/main/services/watchActorDiscoveryRouteBodyFixtureService.js` wraps the proof with durable table count snapshots.
- The proof composes current Discovery helper surfaces:
  - `discoverActorRefs(...)`
  - `pendingActorDiscovery(...)`
  - `selectExpansionCandidates(...)`
  - `markFailedExpansionCandidates(...)`
  - `summarizeExpansionQueue(...)`
  - `buildEvidencePackageFromRefs(...)`
- Fresh fixture acquisition, pending-ref drain, local Evidence/EVEidence cache skip, and expansion failure posture are covered.
- Candidate refs remain possible leads/provenance, not Evidence/EVEidence.
- ESI-backed selected-ref expansion remains Discovery-owned and is not Hydration.
- Evidence/EVEidence writer landing is represented as a boundary and is not invoked.

## Boundary Review

Confirmed no:

- production `actor.watch` redirect
- `runActorWatchService(...)` change
- `watchExecutor.dispatchFor(...)` change
- `collectActorWatch(...)` invocation or retirement
- provider/live/API call
- real/operator Discovery ref write
- real/operator Evidence/EVEidence write from the route proof
- Hydration write
- Watch cadence mutation
- schema, dispatcher, system/radius, UI, support artifact, source-term rename, or protected-word JSON update

## Notes

The route body currently imports `planActorWatch(...)` from the existing worker planner. That is acceptable for this fixture proof because the packet proves route-body composition rather than final ownership purity. Future runtime replacement work may want to revisit whether actor planning belongs under Watch, Discovery, or a neutral planning helper.

The compatibility summary reports real provider/API calls as zero while fake client invocation counters are nonzero. That is acceptable and desirable: fake fixture clients prove route behavior without live provider movement.

## Verification

Passed:

```txt
node --check src\main\discovery\actorWatchDiscoveryRouteBodyFixture.js
node --check src\main\services\watchActorDiscoveryRouteBodyFixtureService.js
node --check scripts\verify-watch-actor-discovery-route-body-fixture.js
npm.cmd run verify:watch-actor-discovery-route-body-fixture
npm.cmd run verify:watch-actor-compatibility-wrapper-runtime-preview
npm.cmd run verify:watch-actor-compatibility-wrapper-adapter-fixture
npm.cmd run verify:watch-actor-compatibility-wrapper-contract
npm.cmd run verify:watch-actor-replacement-parity
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:evidence-writer-landing-package-fixture
npm.cmd run verify:evidence-rules
npm.cmd run verify:watch-executor
npm.cmd run verify:mutating-services
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- all syntax checks passed
- all listed npm verification commands passed
- `verify:service-registry` passed with a 300 second ceiling
- `verify:enforcement-dry-run` remained complete: 114 commands covered, 0 gaps
- `verify:protected-terms` completed as warning-only advisory evidence; no rename or protected-word JSON update was performed
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- git status remains noisy: `main...origin/main [ahead 19]` with the existing broad uncommitted/untracked milestone stack plus HS415/HS416 artifacts

## Next Recommendation

Do not open default runtime redirect yet.

Strongest next seam:

```txt
actor Watch controlled runtime adapter readiness
```

Purpose:

```txt
decide what must be true before a real actor Watch runtime path can call the Discovery-owned route body without silently losing current behavior or preserving mixed collector ownership
```

Likely output should be advisory/source trace first, not immediate implementation, unless the trace shows the remaining gap is purely mechanical.
