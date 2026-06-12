# OverseerHS424 - HS423 Actor Watch Controlled Adapter Return-Path Review

Status: accepted
Date: 2026-06-11
Role: Overseer

## Reviewed

- `workspace/OverseerHS423-actor-watch-controlled-adapter-return-path-proof-runway.md`
- `workspace/DevHS423-actor-watch-controlled-adapter-return-path-proof.md`
- `src/main/discovery/actorWatchCompatibilitySummary.js`
- `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js`
- `scripts/verify-watch-actor-controlled-adapter-return-path.js`
- `workspace/current.md`
- `workspace/overview.md`

## Result

HS423 is accepted.

The packet proves the return-path compatibility seam without changing production actor Watch runtime. It centralizes the actor Watch compatibility summary projection, proves the direct caller return is the summary object, proves scheduled-style wrapping under `data.collection`, and asserts field-set parity against the current production collector summary contract.

## Accepted Evidence

- New helper: `src/main/discovery/actorWatchCompatibilitySummary.js`
- New verifier: `scripts/verify-watch-actor-controlled-adapter-return-path.js`
- Updated proof path: `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js` now uses the shared compatibility summary builder.
- Compatibility field count: 22.
- Compatibility parity: `missing: []`, `extra: []`, `matches: true`.
- Direct caller proof: `buildDirectActorWatchCompatibilityReturn(summary) === summary`.
- Scheduled-style proof: `data.collection === summary`.

## Verification Run By Overseer

```txt
npm.cmd run verify:watch-actor-controlled-adapter-return-path
```

Result: passed.

Focused import/call check:

```txt
rg -n "require\(.*actorWatchCollector|collectActorWatch\(" src\main\discovery\actorWatchCompatibilitySummary.js src\main\discovery\actorWatchControlledRuntimeAdapterFixture.js scripts\verify-watch-actor-controlled-adapter-return-path.js
```

Result: no matches. This is the expected result: the new proof path does not import or call `collectActorWatch(...)`.

## Boundary Confirmation

Accepted as unchanged:

- production `actor.watch`
- `runActorWatchService(...)`
- `watchExecutor.dispatchFor(...)`
- `collectActorWatch(...)`
- scheduled Watch runtime
- live/provider/API behavior
- operator Discovery refs
- operator Evidence/EVEidence
- Hydration
- Observation
- Assessment
- schema
- dispatcher / queue / lease / enforcement
- renderer UI
- source terms / protected-word JSON

## Notes

The compatibility helper intentionally carries old return-shape language such as `collection`, `collection_plan`, `expansion_queue`, `zkill_refs_discovered`, and `zkill_discovery_skipped`. These names are accepted only as compatibility/debug projection fields. They are not future Discovery, Watch, Evidence/EVEidence, Hydration, Observation, or Assessment doctrine.

## Next Decision

Move to HS425 as a decision surface before opening another Dev runway.

The remaining question is whether Atlas should:

1. run one more readiness trace around production-adjacent adapter insertion points, or
2. open a narrow controlled adapter seam that remains explicitly disabled from default `actor.watch` / scheduled Watch redirect.

Production redirect, scheduled Watch redirect, provider movement, operator corpus writes, and collector retirement remain unopened.
