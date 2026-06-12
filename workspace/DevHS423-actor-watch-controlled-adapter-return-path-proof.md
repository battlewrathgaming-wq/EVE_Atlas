# DevHS423 - Actor Watch Controlled Adapter Return-Path Proof

Status: complete for Overseer review

## Scope

Executed HS423 only: prove direct caller and scheduled-style compatibility return shapes for the boundary-owned actor Watch adapter proof path without changing production actor Watch runtime.

This is a no-provider, non-production return-path proof. It does not redirect `actor.watch`, change `runActorWatchService(...)`, change `watchExecutor.dispatchFor(...)`, invoke/import/retire `collectActorWatch(...)`, call live providers, write operator DB rows, change schema, add UI, or activate enforcement.

## Files Changed

- `package.json`
- `src/main/discovery/actorWatchCompatibilitySummary.js`
- `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js`
- `scripts/verify-watch-actor-controlled-adapter-return-path.js`
- `workspace/current.md`
- `workspace/DevHS423-actor-watch-controlled-adapter-return-path-proof.md`

## Implementation

Added Discovery-owned compatibility projection helper:

- `src/main/discovery/actorWatchCompatibilitySummary.js`

It defines:

- `PRODUCTION_ACTOR_WATCH_COMPATIBILITY_SUMMARY_FIELDS`
- `buildActorWatchCompatibilitySummary(...)`
- `buildActorWatchCompatibilityCollectionPlan(...)`
- `actorWatchCompatibilitySummaryFields()`
- `actorWatchCompatibilitySummaryFieldParity(...)`
- `buildDirectActorWatchCompatibilityReturn(...)`
- `buildScheduledActorWatchCompatibilityResult(...)`

Updated HS419 fixture path to use `buildActorWatchCompatibilitySummary(...)` instead of its local duplicate summary builder.

Added focused verifier:

- `scripts/verify-watch-actor-controlled-adapter-return-path.js`
- npm script `verify:watch-actor-controlled-adapter-return-path`

## Direct Caller Return Shape

The verifier builds the boundary-owned fixture proof and selects the fresh actor case summary.

It proves:

```txt
buildDirectActorWatchCompatibilityReturn(summary) === summary
```

The direct caller return is the summary object itself, matching current direct `actor.watch` caller posture.

## Scheduled-Style Return Shape

The verifier wraps the same summary with:

```txt
{
  status: "succeeded",
  data: {
    watch,
    collection: summary
  }
}
```

It proves:

- wrapper status remains `succeeded`
- the watch object is preserved
- the summary is preserved under `data.collection`
- `data.collection` has the same compatibility field set as the direct return

`collection` is treated as scheduled-wrapper compatibility language only, not future Atlas ownership doctrine.

## Compatibility Field-Set Parity

The compatibility summary field set is:

```txt
run_id
actor
zkill_refs_discovered
duplicate_refs_removed
malformed_refs_removed
unique_refs_after_dedupe
pending_refs_considered
already_cached_killmails
expansion_attempted
expansion_cap_skipped
new_esi_expansions
failed_expansions
persisted_killmails
activity_events_written
api_calls_zkill
api_calls_esi
warnings
planned_zkill_requests
zkill_discovery_skipped
collection_plan
expansion_queue
expansion_queue_summary
```

Verifier result:

```txt
compatibility_field_set_parity.matches: true
missing: []
extra: []
field_count: 22
```

The verifier also inspects `src/main/workers/actorWatchCollector.js` and asserts every expected field remains present in the production `collectActorWatch(...)` summary source, plus `const summary = {` and `return summary;` remain visible.

## Source / Import Proof

Command:

```txt
rg -n "collectActorWatch|actor\.watch|runActorWatchService|dispatchFor|data\.collection|compatibility" src\main\discovery\actorWatchCompatibilitySummary.js src\main\discovery\actorWatchControlledRuntimeAdapterFixture.js scripts\verify-watch-actor-controlled-adapter-return-path.js scripts\verify-watch-actor-controlled-runtime-adapter-fixture.js package.json
```

Result:

- expected references appeared in proof labels, assertions, compatibility field names, and npm script names
- no production runtime redirect was introduced

Strict import/call check:

```txt
rg -n "require\(.*actorWatchCollector|collectActorWatch\(" src\main\discovery\actorWatchCompatibilitySummary.js src\main\discovery\actorWatchControlledRuntimeAdapterFixture.js scripts\verify-watch-actor-controlled-adapter-return-path.js
```

Result:

- no matches
- `collectActorWatch(...)` is not imported or called by the new path
- `actorWatchCollector.js` is not imported by the new path

## Verification

Passed:

```txt
node --check src\main\discovery\actorWatchCompatibilitySummary.js
node --check src\main\discovery\actorWatchControlledRuntimeAdapterFixture.js
node --check scripts\verify-watch-actor-controlled-adapter-return-path.js
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:watch-actor-controlled-runtime-adapter-fixture
```

Focused verifier sample:

```txt
Actor Watch controlled adapter return-path proof validated
direct_caller_return_shape.top_level_is_summary_object: true
direct_caller_return_shape.field_count: 22
scheduled_style_return_shape.wrapper_status: succeeded
scheduled_style_return_shape.collection_under_data: true
scheduled_style_return_shape.collection_field_count: 22
compatibility_field_set_parity.matches: true
provider_calls: 0
live_api_calls: 0
operator_db_writes: 0
```

Final hygiene after this handoff/current update passed:

```txt
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- `npm.cmd run verify:protected-terms` completed with exit code 0 and warning-only advisory output: 838 warnings across the broad current working set; no source-term rename or protected-word JSON update was performed.
- `git diff --check` returned exit code 0 with CRLF normalization warnings only.
- `git status --short --branch` showed `main...origin/main [ahead 19]` with the existing broad unaccepted working set plus HS423 files.

## Boundary Confirmation

Confirmed:

- no production `actor.watch` redirect
- no `runActorWatchService(...)` change
- no `watchExecutor.dispatchFor(...)` change
- no `collectActorWatch(...)` import, invocation, or retirement
- no live/provider/API call
- no operator DB write
- no operator Discovery ref write
- no operator Evidence/EVEidence write
- no Hydration, Observation, or Assessment change
- no Watch cadence mutation
- no schema, dispatcher, queue, lease, enforcement, command blocking, UI, source-term rename, or protected-word JSON update

## Remaining Parked

- production actor Watch redirect
- scheduled Watch redirect
- `runActorWatchService(...)` replacement
- `watchExecutor.dispatchFor(...)` replacement
- `collectActorWatch(...)` retirement
- live zKill/ESI provider movement
- durable Discovery receipt/task/packet persistence
- Watch cadence mutation from Discovery receipt
- dispatcher/queue/lease/runtime enforcement/UI work

## Recommended Next Action

Overseer should review whether direct and scheduled-style return-path compatibility is sufficient to shape the next narrow controlled adapter seam, still without default redirect, scheduled Watch redirect, live providers, or collector retirement.
