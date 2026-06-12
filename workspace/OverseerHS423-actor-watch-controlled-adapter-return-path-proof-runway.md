# OverseerHS423 - Actor Watch Controlled Adapter Return-Path Proof Runway

Status: Dev runway
Date: 2026-06-11
Executor: Dev

## Purpose

Prove that the boundary-owned actor Watch adapter path can return the caller-facing compatibility summary shape expected by current `actor.watch` callers, without reviving `collectActorWatch(...)` ownership or changing production runtime behavior.

This is a no-provider, non-production-return-path proof. It should prepare Atlas for a later controlled redirect decision, but it must not perform that redirect.

## Source Truth

Read:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS422-hs421-actor-watch-compatibility-summary-caller-return-path-review.md`
- `workspace/EngineeringTraceHS421-actor-watch-compatibility-summary-caller-return-path.md`
- `workspace/OverseerHS420-hs419-actor-watch-controlled-runtime-adapter-fixture-review.md`
- `workspace/DevHS419-actor-watch-controlled-runtime-adapter-fixture-proof.md`

Likely relevant source:

- `src/main/workers/actorWatchCollector.js`
- `src/main/services/mutatingActionService.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js`
- `src/main/services/watchActorControlledRuntimeAdapterFixtureService.js`
- existing `scripts/verify-watch-actor-*`

## Required Work

Create a focused proof that:

1. Defines or extracts a single compatibility summary field-set/builder usable by the boundary-owned actor Watch adapter proof path.
2. Asserts compatibility summary field-set parity against the current production `collectActorWatch(...)` summary contract.
3. Proves direct caller return shape is the summary object.
4. Proves scheduled-style wrapping would preserve the result under `data.collection`.
5. Does not call, import, or route through `collectActorWatch(...)`.
6. Uses fake clients, fixture inputs, disposable data, or read-only inspection only.
7. Writes no operator DB rows.

## Must Not Change

Do not change:

- production `actor.watch`
- `runActorWatchService(...)`
- `watchExecutor.dispatchFor(...)`
- `collectActorWatch(...)`
- service command behavior used by live/operator paths
- scheduled Watch runtime
- provider/live/API behavior
- operator Discovery refs
- operator Evidence/EVEidence
- Hydration
- Observation
- Assessment
- schema
- dispatcher / queue / lease / enforcement
- renderer UI
- source terms / protected-word JSON

No live zKill or ESI calls.

## Compatibility Language

These may appear only as compatibility/debug fields:

- `collection`
- `collection_plan`
- `expansion_queue`
- `expansion_queue_summary`
- `zkill_refs_discovered`
- `zkill_discovery_skipped`

The proof should not make those names future doctrine. Internally, preserve the accepted Atlas boundaries:

- Watch = intent / cadence / accepted scope authority
- Discovery = provider-facing acquisition utility, including zKill candidate acquisition and ESI-backed selected-ref expansion
- Discovery refs = possible leads / Discovery memory, not Evidence
- Evidence/EVEidence = expanded ESI killmail memory
- Hydration = readability repair
- Observation = local story/readout transform
- Assessment = human judgment

## Expected Handoff

Create:

```txt
workspace/DevHS423-actor-watch-controlled-adapter-return-path-proof.md
```

Include:

1. Summary of files changed.
2. How direct caller return shape is proven.
3. How scheduled-style wrapping under `data.collection` is proven.
4. Compatibility field-set parity evidence.
5. Proof that `collectActorWatch(...)` is not imported or invoked by the new path.
6. Confirmation that production actor Watch runtime remains unchanged.
7. Verification commands and results.

## Required Verification

Run the new focused verifier added by this packet.

Also run any existing focused verifiers touched by the implementation. Prefer focused verification over broad `verify:all` unless this packet changes shared command authority or registry posture enough to require it.

At minimum, include a source/import proof similar to:

```txt
rg -n "collectActorWatch|actor.watch|runActorWatchService|dispatchFor|data.collection|compatibility" <changed files and focused verifier>
```

The handoff must explicitly state whether `collectActorWatch` appears only in labels/assertions/proof text or appears as an import/call.

## Stop Conditions

Stop and report instead of widening scope if:

- parity requires changing production `actor.watch`
- scheduled wrapping requires invoking `WatchSessionExecutor.tick(...)`
- proof requires live provider behavior
- proof requires operator DB mutation
- compatibility fields cannot be represented without reusing mixed collector code
- implementation pressure points toward collector retirement or runtime redirect
