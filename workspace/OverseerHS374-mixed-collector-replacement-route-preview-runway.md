# OverseerHS374 - Mixed Collector Replacement Route Preview Runway

Status: open
Date: 2026-06-07
Role: Overseer
Executor: Dev

## Purpose

Add a read-only/local-only proof that shows how current Watch payload shapes can route through the future boundary-owned model without invoking legacy mixed collectors.

This is the first replacement proof after HS372. It is not a redirect, not retirement, and not provider movement.

## Context

Accepted model:

```txt
Watch = intent source, scheduler, accepted scope/cadence authority.
Discovery = provider-facing acquisition utility with two service lanes:
  - zKill candidate-lead acquisition
  - ESI-backed killmail/detail expansion
Evidence/EVEidence = final landed memory.
```

HS368 proved Watch dispatch payloads can feed a Discovery-owned acquisition fixture boundary.

HS370 proved Discovery can carry acquisition request -> provider-facing fixture packets -> fixture zKill outcomes -> normalized candidate refs -> receipt / `watch_summary` -> ESI-backed expansion handoff candidates.

HS372 accepted that mixed Watch collectors should be replaced in stages, not kept as the long-term runtime model.

## Task

Add a read-only/local-only route preview command.

Suggested command:

```txt
watch.mixed_collector_replacement_route.preview
```

Suggested verifier:

```txt
verify:watch-mixed-collector-replacement-route
```

The command should consume representative actor Watch and system/radius Watch dispatch shapes and emit the intended future route:

```txt
Watch accepted intent / cadence
-> Discovery zKill candidate-lead acquisition lane
-> Discovery ESI-backed killmail/detail expansion lane
-> Evidence/EVEidence writer / landed memory
-> Watch receipt / cadence posture
```

## Required Output Shape

Include:

- selected/representative Watch source
- current command entry point shape (`actor.watch` / `system.radius.watch`) if available
- current legacy collector that would have been used
- future route stages with owner, input, output, and boundary for each stage
- compatibility-wrapper posture for old command entry points
- retire posture for old mixed collector functions/files
- missing proof flags
- existing proof basis from HS368 and HS370
- explicit non-invocation proof for mixed collectors
- explicit no-mutation proof

## Fixture Cases

Cover at least:

- actor Watch route
- system/radius Watch route using stored accepted `included_system_ids`
- held by External I/O before provider movement
- route with no candidate refs
- route with candidate refs selected for Discovery ESI-backed expansion lane
- route where Evidence/EVEidence writer is only a future landing boundary, not invoked

## Boundaries

This packet is read-only/local-only.

Do not:

- call providers or perform live/API calls
- invoke `collectActorWatch(...)`
- invoke `collectSystemRadiusWatch(...)`
- invoke `WatchSessionExecutor.tick(...)`
- invoke `TaskRunner.runDetachedTask(...)`
- run live Watch dispatch
- create tasks
- mutate Watch rows
- write Discovery refs
- write Evidence/EVEidence
- perform live/provider ESI-backed expansion
- write Hydration/metadata
- write API logs or warnings
- write `fetch_runs`
- add durable Discovery task/packet/receipt schema
- add queues, dispatcher, leases, or runtime provider work
- create support artifacts
- change renderer/UI
- change service registry behavior for live commands beyond registering the new read-only command
- change command authority beyond adding the new read-only command
- activate runtime enforcement or command blocking
- rename source-owned terms
- update protected-word JSON
- retire or redirect mixed collectors

## Acceptance Criteria

Dev handoff should show:

1. New command and verifier names.
2. Actor and system/radius route previews.
3. Future route stage owners and boundaries.
4. Which legacy entry points are compatibility-wrapper candidates.
5. Which legacy mixed collectors are retire candidates.
6. Existing proof basis from HS368/HS370.
7. Missing proof flags.
8. Proof that no provider movement, DB writes, Watch mutation, collector invocation, redirect, or retirement occurred.
9. Recommendation for the next seam after this route preview.

## Verification

Run focused checks:

```txt
node --check src\main\services\[new-service].js
node --check scripts\verify-watch-mixed-collector-replacement-route.js
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
workspace/DevHS374-mixed-collector-replacement-route-preview.md
```

