# DevHS428 - Actor Watch Controlled Adapter Disabled Seam

Status: Dev handoff complete
Date: 2026-06-11
Executor: Dev

## Summary

Implemented the disabled/proof-only actor Watch controlled adapter seam:

```txt
watch.actor_controlled_adapter_disabled.preview
```

This command is non-renderer, metadata-only, and fixture/local-mutation classified. It sits near the service surface while remaining disabled and proof-only. It calls the existing boundary-owned controlled runtime adapter fixture preview path and projects the HS423 compatibility return shapes without redirecting production `actor.watch`, scheduled Watch, live providers, or operator corpus state.

## Files Changed

- `package.json`
- `scripts/verify-command-authority.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-watch-actor-controlled-adapter-disabled-seam.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/watchActorControlledAdapterDisabledService.js`
- `workspace/current.md`
- `workspace/DevHS428-actor-watch-controlled-adapter-disabled-seam.md`

## Command Shape

Command:

```txt
watch.actor_controlled_adapter_disabled.preview
```

Registry posture:

```txt
classification: metadata-only
effects: local-data-mutation
renderer_allowed: false
```

Enforcement dry-run posture:

```txt
storage/action class: fixture_disposable_db_mutation
External I/O dependency: none
runtime context: actor_watch_controlled_adapter_disabled_proof
enforcement status: fixture_only_non_production
```

## Direct Compatibility Summary Proof

The disabled seam uses the accepted HS423 compatibility helper:

```txt
buildDirectActorWatchCompatibilityReturn(summary) === summary
top_level_is_summary_object: true
field_count: 22
field_parity.matches: true
```

Compatibility/debug-only old return-shape names remain limited to projection fields:

- `collection`
- `collection_plan`
- `expansion_queue`
- `expansion_queue_summary`
- `zkill_refs_discovered`
- `zkill_discovery_skipped`

## Scheduled-Style Wrapper Posture

The seam includes scheduled-style wrapper posture through the HS423 helper:

```txt
status: succeeded
data.collection === direct_compatibility_summary
tick_invoked: false
task_created: false
```

No `WatchSessionExecutor.tick(...)`, `TaskRunner`, Watch dispatch, scheduled redirect, or task creation is invoked.

## Operator DB Non-Mutation Proof

The focused verifier seeds an operator/caller DB sentinel row, invokes:

```txt
watch.actor_controlled_adapter_disabled.preview
```

and asserts caller/operator table counts are unchanged.

The wrapped controlled runtime adapter proof continues to use internal disposable `:memory:` DBs and fake clients only.

Focused sample:

```txt
command: watch.actor_controlled_adapter_disabled.preview
classification: metadata-only
effects: local-data-mutation
renderer_allowed: false
direct_summary_field_count: 22
scheduled_wrapper_status: succeeded
operator_corpus_non_mutation: true
production_actor_watch_redirected: false
collect_actor_watch_invoked: false
provider_calls: 0
live_api_calls: 0
```

## Production Runtime Unchanged

Confirmed by implementation shape and verifier assertions:

- production `actor.watch` remains registered as evidence-creating with external live API and Evidence/EVEidence creation effects
- no `runActorWatchService(...)` change
- no `watchExecutor.dispatchFor(...)` change
- no `WatchSessionExecutor.tick(...)` invocation
- no `TaskRunner` change or invocation
- no `collectActorWatch(...)` invocation, import, or retirement
- no system/radius Watch behavior change

Strict import/call proof:

```txt
rg -n "require\(.*actorWatchCollector|collectActorWatch\(" src\main\services\watchActorControlledAdapterDisabledService.js scripts\verify-watch-actor-controlled-adapter-disabled-seam.js
```

Result:

```txt
no matches
```

## Verification

Syntax checks:

```txt
node --check src\main\services\watchActorControlledAdapterDisabledService.js
node --check scripts\verify-watch-actor-controlled-adapter-disabled-seam.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
```

Result:

```txt
all passed
```

Required verification:

```txt
npm.cmd run verify:watch-actor-controlled-adapter-disabled-seam
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:watch-actor-controlled-runtime-adapter-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
```

Results:

```txt
verify:watch-actor-controlled-adapter-disabled-seam passed
verify:watch-actor-controlled-adapter-return-path passed
verify:watch-actor-controlled-runtime-adapter-fixture passed
verify:service-registry passed
verify:command-authority passed
verify:passive-side-effects passed
verify:enforcement-dry-run passed; 116 commands covered, 0 gaps
verify:protected-terms passed with warning-only advisory output; 930 warnings across the broad working set
```

Final checks:

```txt
git diff --check
git status --short --branch
```

Results are recorded in `workspace/current.md` after final run.

## Boundary Confirmation

No production `actor.watch` redirect, scheduled Watch redirect, `runActorWatchService(...)` change, `watchExecutor.dispatchFor(...)` change, `WatchSessionExecutor.tick(...)` invocation, `TaskRunner` change, `collectActorWatch(...)` invocation/import/retirement, live/provider call, operator DB write, operator Discovery ref write, operator Evidence/EVEidence write, Hydration write, Observation change, Assessment change, Watch cadence mutation, system/radius behavior change, schema, dispatcher/queue/lease behavior, runtime enforcement, command blocking, renderer UI, source-term rename, or protected-word JSON update was added.

## Risks / Parked Items

- This is still a disabled/proof-only service seam; it is not runtime redirect.
- Production `actor.watch` redirect remains parked.
- Scheduled Watch redirect remains parked.
- `collectActorWatch(...)` retirement remains parked.
- Live zKill/ESI provider movement remains parked.
- Durable Discovery receipt/task/packet persistence, Watch cadence mutation, dispatcher/queue/lease/runtime enforcement/UI work remain parked.
