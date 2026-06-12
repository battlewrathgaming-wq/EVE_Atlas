# OverseerHS377 - Actor Watch Replacement Parity Proof Runway

Status: open
Date: 2026-06-07
Role: Overseer
Executor: Dev

## Purpose

Add a fixture-only, read-only proof that actor Watch behavior can be represented through the future boundary-owned replacement route without invoking `collectActorWatch`, redirecting `actor.watch`, writing rows, or calling providers.

This is the first actor-specific proof after HS374 / HS375 / HS376. It is not runtime replacement.

## Context

Accepted actor flow:

```txt
operator actor input
-> resolve/normalize actor identity
-> actor Watch accepted intent / cadence / caps / lookback
-> zKill Discovery for candidate killmail refs
-> selected refs later enter Discovery ESI-backed killmail/detail expansion
-> expanded ESI killmails become Evidence/EVEidence at the writer boundary
```

Boundary reminders:

- zKill candidate refs are Discovery refs / possible leads, not Evidence.
- Discovery ESI-backed killmail/detail expansion is not Hydration.
- Hydration is readability/name-label repair only.
- Evidence/EVEidence starts at final landed memory.
- Watch owns actor intent, cadence, caps/lookback source, and later receipt/cadence posture.
- Watch must not own zKill acquisition, ESI-backed expansion, or Evidence/EVEidence landing in the future model.

Accepted advisory:

```txt
workspace/EngineeringTraceHS376-actor-watch-first-replacement-slice-readiness.md
```

Accepted review basis:

```txt
workspace/OverseerHS375-hs374-mixed-collector-replacement-route-review.md
```

## Task

Add an actor-only replacement parity preview command.

Suggested command:

```txt
watch.actor_replacement_parity.preview
```

Suggested verifier:

```txt
verify:watch-actor-replacement-parity
```

The proof should consume representative actor Watch source / dispatch payload shape and map current actor Watch behavior into future boundary-owned stages:

```txt
Watch accepted actor intent
-> Discovery zKill candidate-lead acquisition request/posture
-> Discovery ESI-backed killmail/detail expansion intake posture
-> Evidence/EVEidence writer landing boundary placeholder
-> Watch receipt/cadence posture placeholder
```

## Required Output Shape

Include:

- selected actor Watch source
- current actor entry point shape: `actor.watch`
- current legacy collector: `collectActorWatch`
- future boundary-owned route stages with owner/input/output/boundary
- semantic parity map against current actor Watch behavior
- current behavior items represented
- current behavior items explicitly missing / parked
- compatibility-wrapper posture: candidate only, not implemented
- retire posture: `collectActorWatch` retire candidate only, not retired
- non-invocation proof
- no-mutation proof
- proof basis from HS374 / HS376

## Required Behavior Coverage

Represent, or explicitly flag as missing:

- actor target identity: entity type, ID, optional name
- lookback seconds
- max refs
- max expansions
- zKill request target type and ID
- candidate ref extraction from `killmail_id` + hash
- malformed candidate posture
- duplicate candidate posture
- no-ref posture
- acquisition capped posture
- provider deferred posture
- selected candidate refs for Discovery ESI-backed expansion intake
- local cache skip posture before ESI expansion, if fixture basis allows it
- retryable/terminal ESI-backed expansion failure posture, if fixture basis allows it
- Evidence/EVEidence writer landing boundary placeholder
- Watch receipt/cadence posture placeholder

## Fixture Cases

Cover at least:

- actor refs found and selected
- actor no refs
- malformed candidate ref
- duplicate candidate ref
- acquisition capped
- provider deferred
- selected ref becomes Discovery ESI-backed expansion intake candidate
- cached candidate / skip posture if local fixture basis allows it

## Boundaries

This packet is read-only/local-only and fixture-only.

Do not:

- redirect `actor.watch`
- modify runtime behavior in `runActorWatchService`
- modify runtime behavior in `watchExecutor.dispatchFor`
- invoke `collectActorWatch(...)`
- invoke `collectSystemRadiusWatch(...)`
- invoke `WatchSessionExecutor.tick(...)`
- invoke `TaskRunner.runDetachedTask(...)`
- run live Watch dispatch
- create tasks
- call zKill
- call ESI
- write `discovered_killmail_refs`
- write Evidence/EVEidence
- perform live/provider ESI-backed expansion
- write Hydration/metadata
- write API logs or warnings
- write `fetch_runs`
- mutate Watch cadence or Watch rows
- add schema
- add queues, dispatcher, leases, workers, or runtime provider work
- change system/radius Watch behavior
- change renderer/UI
- activate runtime enforcement or command blocking
- rename source-owned terms
- update protected-word JSON
- retire or redirect mixed collectors

## Acceptance Criteria

Dev handoff should show:

1. New command and verifier names.
2. Actor-only scope; system/radius is not selected or changed.
3. Current actor Watch payload / entry shape is represented.
4. `collectActorWatch` is not invoked.
5. No provider calls, DB writes, Watch mutation, tasks, schema, UI, enforcement, redirect, or retirement.
6. Candidate refs remain possible leads, not Evidence/EVEidence.
7. Discovery ESI-backed expansion is represented as Discovery-serviced provider lane, not Hydration.
8. Evidence/EVEidence writer is represented as final landing boundary only.
9. Caps/lookback/provenance/error posture are either represented or explicitly marked missing.
10. Expected actor Watch behavior is not claimed retired, redirected, or replaced in runtime.
11. Recommendation for the next seam after this parity proof.

## Verification

Run focused checks:

```txt
node --check src\main\services\[new-service].js
node --check scripts\verify-watch-actor-replacement-parity.js
npm.cmd run verify:watch-actor-replacement-parity
npm.cmd run verify:watch-mixed-collector-replacement-route
npm.cmd run verify:watch-discovery-acquisition-split-fixture
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Adjust the service syntax-check path to match the implementation.

## Expected Handoff

```txt
workspace/DevHS377-actor-watch-replacement-parity-proof.md
```

