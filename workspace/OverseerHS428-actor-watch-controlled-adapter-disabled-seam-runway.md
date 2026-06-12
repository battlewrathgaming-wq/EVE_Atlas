# OverseerHS428 - Actor Watch Controlled Adapter Disabled Seam Runway

Status: Dev runway
Date: 2026-06-11
Executor: Dev

## Purpose

Add a disabled, non-renderer actor Watch controlled adapter command/service seam that proves the boundary-owned adapter can sit near production service surfaces without becoming production `actor.watch`, scheduled Watch redirect, live provider movement, or operator corpus mutation.

This is a disabled/proof-only seam. It is not runtime redirect.

## Source Truth

Read:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS427-hs426-actor-watch-production-adjacent-adapter-insertion-review.md`
- `workspace/EngineeringTraceHS426-actor-watch-production-adjacent-adapter-insertion.md`
- `workspace/OverseerHS424-hs423-actor-watch-controlled-adapter-return-path-review.md`
- `workspace/DevHS423-actor-watch-controlled-adapter-return-path-proof.md`

Likely source:

- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js`
- `src/main/discovery/actorWatchCompatibilitySummary.js`
- `src/main/services/watchActorControlledRuntimeAdapterFixtureService.js`
- command authority / service registry / passive side-effect / enforcement dry-run verifiers
- existing `scripts/verify-watch-actor-*`

## Required Command

Add:

```txt
watch.actor_controlled_adapter_disabled.preview
```

Required posture:

- non-renderer service command only
- disabled / proof-only / fixture-only
- fake or injected provider clients only
- internal disposable DBs only, or explicit operator DB non-mutation proof
- no live zKill or ESI calls
- no operator DB writes
- no production `actor.watch` redirect
- no scheduled Watch redirect

## Required Behavior

The disabled seam should:

1. Call the boundary-owned actor Watch controlled adapter proof path, not `collectActorWatch(...)`.
2. Return the accepted direct compatibility summary shape from HS423.
3. Include scheduled-style wrapper posture using `data.collection` without invoking `WatchSessionExecutor.tick(...)`.
4. Include proof flags showing:
   - production `actor.watch` unchanged
   - `runActorWatchService(...)` unchanged
   - `watchExecutor.dispatchFor(...)` unchanged
   - `collectActorWatch(...)` not imported/called/retired
   - provider calls: `0`
   - live API calls: `0`
   - operator corpus mutated: `false`
5. Preserve old return-shape names only as compatibility/debug projection fields.

## Command Authority / Registry Requirements

The new command should be:

- classification: `metadata-only`
- effects: fixture/local mutation only, not `external-live-api` and not `evidence-creation`
- renderer eligible: false
- enforcement dry-run posture: `fixture_only_non_production`
- storage/provider posture: no external I/O dependency, no live provider movement

Update focused command authority, service registry, passive side-effect, and enforcement dry-run coverage as needed.

## Must Not Change

Do not change:

- production `actor.watch`
- `runActorWatchService(...)`
- `watchExecutor.dispatchFor(...)`
- `WatchSessionExecutor.tick(...)`
- `TaskRunner`
- `collectActorWatch(...)`
- system/radius Watch behavior
- provider/live/API behavior
- operator Discovery refs
- operator Evidence/EVEidence
- Hydration
- Observation
- Assessment
- schema
- dispatcher / queue / lease behavior
- runtime enforcement activation
- renderer UI
- source terms / protected-word JSON

Do not import `actorWatchCollector.js` from the new seam.

Do not call `collectActorWatch(...)` from the new seam.

## Expected Handoff

Create:

```txt
workspace/DevHS428-actor-watch-controlled-adapter-disabled-seam.md
```

Include:

1. Summary of files changed.
2. Command name and classification/effects.
3. Direct compatibility summary proof.
4. Scheduled-style wrapper posture proof.
5. Operator DB non-mutation proof.
6. Proof that production `actor.watch`, `runActorWatchService(...)`, `watchExecutor.dispatchFor(...)`, and `collectActorWatch(...)` remain unchanged.
7. Proof that `collectActorWatch(...)` is not imported/called by the new seam.
8. Verification commands and results.

## Required Verification

Add and run:

```txt
npm.cmd run verify:watch-actor-controlled-adapter-disabled-seam
```

Also run:

```txt
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:watch-actor-controlled-runtime-adapter-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
```

Include a focused import/call proof:

```txt
rg -n "require\(.*actorWatchCollector|collectActorWatch\(" <new/changed disabled seam files>
```

The expected result is no matches in the new seam path. If matches appear only in proof labels or assertions, state that clearly.

## Stop Conditions

Stop and report instead of widening scope if:

- command registration requires changing production `actor.watch`
- implementation needs `runActorWatchService(...)`
- implementation needs `watchExecutor.dispatchFor(...)`
- implementation needs `WatchSessionExecutor.tick(...)`
- implementation needs `collectActorWatch(...)`
- implementation needs live provider clients
- implementation needs operator DB mutation
- command must be renderer eligible
- command must be classified as `evidence-creating` or `external-live-api`
- service registry / command authority checks require broad policy changes
