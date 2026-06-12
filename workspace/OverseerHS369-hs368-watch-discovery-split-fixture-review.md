# OverseerHS369 - HS368 Watch-to-Discovery Split Fixture Review

Status: accepted
Date: 2026-06-07
Role: Overseer
Reviewed handoff: workspace/DevHS368-watch-to-discovery-acquisition-split-fixture-bridge.md
Reviewed runway: workspace/OverseerHS368-watch-to-discovery-acquisition-split-fixture-bridge-runway.md

## Decision

HS368 is accepted.

The implementation proves current Watch dispatch payloads can feed a Discovery-owned acquisition fixture boundary without entering the existing mixed Watch collector path.

## Accepted Result

Accepted command:

```txt
watch.discovery_acquisition_split_fixture.preview
```

Accepted verifier:

```txt
verify:watch-discovery-acquisition-split-fixture
```

Accepted behavior:

- actor Watch dispatch payload bridges to one Discovery acquisition packet
- system/radius Watch dispatch payload bridges to one packet per stored accepted `included_system_ids`
- stored accepted system IDs remain execution authority
- center/radius remain provenance/explanation and are not execution authority
- bridge emits a Discovery-owned canonical receipt basis and `watch_summary` projection
- fixture outcomes cover refs found, no refs, provider deferred, acquisition capped, retryable failure, and terminal failure
- request-level `held_by_external_io` holds before acquisition with no packet outcomes emitted
- `dispatchFor(...)` payload compatibility is proven through parity proof, while dispatch runners are present but not invoked
- mixed collectors are explicitly not invoked

## Boundary Review

Confirmed preserved:

- no providers or live/API calls
- no `collectActorWatch(...)`
- no `collectSystemRadiusWatch(...)`
- no `WatchSessionExecutor.tick(...)`
- no `TaskRunner.runDetachedTask(...)`
- no live Watch task dispatch
- no task creation
- no Watch mutation
- no Discovery ref writes
- no Evidence/EVEidence writes
- no ESI Evidence Expansion
- no Hydration/metadata writes
- no API logs/warnings
- no `fetch_runs` writes
- no durable Discovery task/packet/receipt schema
- no queue, dispatcher, lease, or runtime provider work
- no support artifacts
- no UI
- no runtime enforcement or command blocking
- no source-term rename
- no protected-word JSON update

## Verification

Overseer reran focused checks:

```txt
node --check src\main\services\watchDiscoveryAcquisitionSplitFixtureService.js
node --check scripts\verify-watch-discovery-acquisition-split-fixture.js
npm.cmd run verify:watch-discovery-acquisition-split-fixture
npm.cmd run verify:watch-discovery-pickup-packets
npm.cmd run verify:discovery-pickup-consumer-fixture
npm.cmd run verify:discovery-receipt-projection-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- syntax checks passed
- `verify:watch-discovery-acquisition-split-fixture` passed
- `verify:watch-discovery-pickup-packets` passed
- `verify:discovery-pickup-consumer-fixture` passed
- `verify:discovery-receipt-projection-fixture` passed
- `verify:service-registry` passed
- `verify:command-authority` passed
- `verify:passive-side-effects` passed
- `verify:enforcement-dry-run` passed with `105/105` command coverage
- `verify:protected-terms` passed with warning-only advisory output; no renames or protected-word JSON updates
- `git diff --check` passed with line-ending warnings only
- `git status --short --branch` showed `main...origin/main [ahead 19]` with the expected Discovery-series working tree

## Resting State

Atlas now has a proven fixture bridge:

```txt
Watch dispatch payload
-> Discovery-owned acquisition request
-> fixture pickup packets / fixture zKill outcomes
-> canonical Discovery receipt basis
-> watch_summary projection
```

The current live-capable `actor.watch` and `system.radius.watch` commands still point at mixed collector paths. HS368 does not redirect them.

## Next Decision

The next practical seam is no longer "can the split exist?" It is:

```txt
How should the mixed collector path be retired or redirected without enabling provider movement?
```

Candidate next moves:

1. Advisory/design packet for retiring or redirecting the mixed Watch collector path.
2. Another no-live proof around the future Discovery acquisition utility boundary.
3. Pause Discovery implementation and consolidate the boundary docs before opening more code.

No Dev runway is open from this review.
