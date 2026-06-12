# Overseer HS419 - Actor Watch Controlled Runtime Adapter Fixture Proof Runway

Status: Dev runway
Executor: Dev
Date: 2026-06-08

## Request

Implement a no-provider, disposable-DB actor Watch controlled runtime adapter fixture proof.

This packet should prove that actor Watch-shaped input can use the Discovery-owned route-body shape, injected fake provider clients, and real `EvidenceRepository` methods against a disposable DB to preserve the mutation choreography currently owned by `collectActorWatch(...)`.

Do not redirect production `actor.watch`.

## Purpose

HS415 proved route-body composition without durable writes.

HS417/HS418 accepted that the next missing evidence is mutation choreography:

```txt
normalized actor Watch input
-> Discovery-owned route body / production successor
-> fake zKill and fake ESI clients
-> real EvidenceRepository methods against disposable DB
-> candidate refs written / selected / expanded / cached / failed
-> Evidence/EVEidence writer landing in disposable DB
-> fetch_run lifecycle finalized
-> old compatibility summary returned
-> collectActorWatch not invoked
```

## Required Scope

Add a new fixture proof surface. Prefer a new proof module/service/verifier rather than changing production runtime.

The proof must:

- use a disposable DB only, preferably `:memory:`
- use injected fake zKill and fake ESI clients only
- accept normalized actor Watch-shaped input
- avoid importing or invoking `collectActorWatch(...)`
- leave production `actor.watch` unchanged
- leave `runActorWatchService(...)` unchanged
- leave `watchExecutor.dispatchFor(...)` unchanged
- prove real repository writes against the disposable DB
- return an old caller-facing compatibility summary or a clearly mapped compatibility summary
- prove no operator corpus mutation

Use real `EvidenceRepository` methods against the disposable DB where applicable:

- `createFetchRun(...)`
- `pendingDiscoveryRefs(...)`
- `upsertDiscoveredKillmailRefs(...)`
- `markDiscoveryRefsSelected(...)`
- `markDiscoveryRefsFailed(...)`
- `persistEvidencePackage(...)`
- `markDiscoveryRefsExpanded(...)`
- `markDiscoveryRefsCached(...)`
- `insertWarning(...)` or explicitly justify warning persistence exclusion
- `finalizeFetchRun(...)`

## Required Fixture Cases

Cover at minimum:

1. Fresh actor candidate acquisition:
   - fake zKill returns candidate refs
   - candidate refs are written to disposable Discovery memory
   - selected refs are marked selected
   - fake ESI returns expanded killmail payloads
   - Evidence/EVEidence writer lands selected expanded payloads
   - refs are marked expanded
   - `fetch_runs` lifecycle finalizes

2. Pending candidate drain:
   - seed disposable pending Discovery refs
   - zKill fake client is not invoked
   - pending refs are selected and expanded through fake ESI

3. Local Evidence/EVEidence cache skip:
   - seed disposable existing killmail
   - cached candidate skips fake ESI
   - cached ref is marked cached

4. Expansion failure:
   - fake ESI fails for a selected ref
   - failed ref is marked failed
   - run finalization / counts / warning posture is proven

## Boundaries

Do not:

- change production `actor.watch`
- change `runActorWatchService(...)`
- change `watchExecutor.dispatchFor(...)`
- invoke, redirect, or retire `collectActorWatch(...)`
- call live zKill
- call live ESI
- write operator DB rows
- mutate operator Discovery refs
- mutate operator Evidence/EVEidence
- write Hydration metadata
- mutate Watch cadence or Watch run records
- add durable Discovery task/packet schema
- add dispatcher / queue / lease / sequencer behavior
- change runtime enforcement or command blocking
- touch renderer UI
- create support artifacts
- rename source terms
- update protected-word JSON

## Expected Handoff

Create:

```txt
workspace/DevHS419-actor-watch-controlled-runtime-adapter-fixture-proof.md
```

Include:

- files changed
- proof command or verifier name
- fixture cases covered
- table mutation proof for disposable DB
- explicit operator corpus non-mutation proof
- proof that `collectActorWatch(...)` was not imported or invoked by the new proof
- proof that production `actor.watch`, `runActorWatchService(...)`, and `watchExecutor.dispatchFor(...)` remain unchanged
- verification commands and results
- parked items

## Verification

Run focused checks, adjusted for actual file names:

```txt
node --check <new controlled adapter fixture/proof file>
node --check <new verifier file>
node --check src\main\discovery\actorWatchDiscoveryRouteBodyFixture.js
node --check src\main\services\watchActorDiscoveryRouteBodyFixtureService.js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\services\mutatingActionService.js
node --check src\main\watchlist\watchExecutor.js
npm.cmd run <new focused verifier>
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

If the full verifier list is too heavy during implementation, run the focused proof plus registry/authority/passive/enforcement checks before handoff and clearly state any deferred broader checks.
