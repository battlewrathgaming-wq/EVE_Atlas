# OverseerHS371 - HS370 Discovery Acquisition To Evidence Handoff Review

Status: accepted
Date: 2026-06-07
Role: Overseer
Reviewed handoff: workspace/DevHS370-discovery-acquisition-to-evidence-handoff-fixture.md
Reviewed runway: workspace/OverseerHS370-discovery-acquisition-to-evidence-handoff-fixture-runway.md

## Decision

HS370 is accepted.

The implementation proves Discovery can carry the provider-facing acquisition utility shape up to ESI Evidence Expansion handoff candidates, in fixture form, without retiring or redirecting mixed Watch collectors.

## Accepted Result

Accepted command:

```txt
discovery.acquisition_to_evidence_handoff_fixture.preview
```

Accepted verifier:

```txt
verify:discovery-acquisition-to-evidence-handoff-fixture
```

Accepted behavior:

- Discovery receives an acquisition request.
- Discovery emits provider-facing fixture packet shapes.
- Fixture zKill-style outcomes normalize into candidate refs.
- Candidate refs include `killmail_id`, `killmail_hash`, provider/source basis, packet/caller basis, and candidate system where available.
- Candidate dedupe is disclosed by `killmail_id` + `killmail_hash`.
- Discovery carries the canonical receipt basis and `watch_summary` projection through.
- Selected refs emit `esi_evidence_expansion_handoff_candidate` shapes.
- Not-selected refs disclose reasons such as duplicate candidate or max handoff cap.
- Request-level `held_by_external_io` holds before acquisition and emits no packet outcomes.

## Boundary Review

Confirmed preserved:

- no providers or live/API calls
- no mixed Watch collector invocation
- no `collectActorWatch(...)`
- no `collectSystemRadiusWatch(...)`
- no `WatchSessionExecutor.tick(...)`
- no `TaskRunner.runDetachedTask(...)`
- no live Watch dispatch
- no task creation
- no Watch mutation
- no Discovery ref writes
- no Evidence/EVEidence writes
- no real ESI Evidence Expansion
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
- no mixed collector retirement or redirect

## Verification

Overseer reran focused checks:

```txt
node --check src\main\services\discoveryAcquisitionToEvidenceHandoffFixtureService.js
node --check scripts\verify-discovery-acquisition-to-evidence-handoff-fixture.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:discovery-receipt-projection-fixture
npm.cmd run verify:watch-discovery-acquisition-split-fixture
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
- `verify:discovery-acquisition-to-evidence-handoff-fixture` passed
- `verify:discovery-receipt-projection-fixture` passed
- `verify:watch-discovery-acquisition-split-fixture` passed
- `verify:service-registry` passed
- `verify:command-authority` passed
- `verify:passive-side-effects` passed
- `verify:enforcement-dry-run` passed with `106/106` command coverage
- `verify:protected-terms` passed with warning-only advisory output; no renames or protected-word JSON updates
- `git diff --check` passed with line-ending warnings only
- `git status --short --branch` showed `main...origin/main [ahead 19]` with the expected Discovery-series working tree

## Resting State

Atlas now has this fixture-proven chain:

```txt
Watch dispatch payload
-> Discovery acquisition request
-> provider-facing fixture packets
-> fixture zKill outcomes
-> normalized candidate refs
-> canonical Discovery receipt / watch_summary
-> ESI Evidence Expansion handoff candidates
```

The useful provider-facing shape formerly trapped inside mixed Watch collectors is now mirrored far enough to support a deliberate redirect/retirement discussion.

## Next Decision

The next practical seam is:

```txt
How should mixed Watch collectors be retired, bypassed, or redirected now that Discovery can carry the acquisition-to-handoff fixture shape?
```

Candidate next moves:

1. Advisory/source-trace packet for mixed collector redirect/retirement planning.
2. Fixture proof around ESI Evidence Expansion intake ownership.
3. Pause implementation and update durable boundary docs/map before touching runtime paths.

No Dev runway is open from this review.

