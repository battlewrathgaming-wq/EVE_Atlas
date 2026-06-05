# OverseerHS293 HS292 Watch/task Outcome Map Preview Review

Status: accepted
Date: 2026-06-05
Reviewer: Overseer

## Reviewed

- `workspace/OverseerHS292-watch-task-outcome-map-preview-runway.md`
- `workspace/DevHS292-watch-task-outcome-map-preview.md`
- `src/main/services/watchTaskOutcomeMapPreviewService.js`
- `scripts/verify-watch-task-outcome-map-preview.js`
- related service registry, enforcement dry-run, command authority, passive side-effect, and package script updates

## Acceptance

HS292 is accepted.

Atlas now has a read-only/local-only Watch/task origin and durable outcome map preview:

```txt
runtime.watch_task_outcome_map.preview
```

Accepted behavior:

- Reports Manual Discovery as Discovery refs / possible leads and provenance, not Evidence/EVEidence.
- Reports Manual Expansion as ESI Evidence Expansion with durable Evidence/EVEidence and provenance when execution has already happened.
- Reports Watch authoring as durable intent rows only.
- Reports Watch schedule/offline posture as derived readout only.
- Reports Watch executor dispatch as volatile task/runtime movement, with durable collector outputs only if dispatch already produced local rows.
- Reports Actor Watch and system/radius Watch collection output from existing `fetch_runs`, Discovery refs, Evidence/EVEidence rows, API logs, warnings, deferrals, and Watch schedule posture.
- Marks TaskRunner and WatchSessionExecutor state as volatile session memory.
- Discloses system/radius authored included/excluded scope versus current collector-planned scope where computable.
- Discloses current system/radius Discovery ref identity as center-only, with radius/watch-id not present.
- Discloses that no durable `watch_result`, `watch_results`, `watch_result_items`, relationship tag column, or relationship truth artifact exists.

## Boundary Check

Accepted boundaries:

- no provider calls
- no live/API verification
- no Watch dispatch
- no task creation
- no queue dispatch
- no Evidence/EVEidence writes
- no Discovery ref mutation
- no Watch row mutation
- no Hydration or metadata writes
- no `watch_result`, `watch_result_items`, relationship tag, or relationship truth creation
- no schema changes
- no runtime enforcement or command blocking
- no renderer/UI behavior beyond renderer-eligible read-only service registration
- no support artifacts
- no fourth lane / fast lane

## Verification

Overseer re-ran:

```txt
node --check src\main\services\watchTaskOutcomeMapPreviewService.js
node --check scripts\verify-watch-task-outcome-map-preview.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-enforcement-dry-run.js
node --check scripts\verify-passive-side-effects.js
npm.cmd run verify:watch-task-outcome-map
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
```

Result:

- All syntax checks passed.
- `verify:watch-task-outcome-map` passed and proved table counts unchanged.
- Registry, command authority, enforcement dry-run, and passive side-effect checks passed.
- `verify:protected-terms` passed with warning-only advisory output; no renames or protected-word JSON updates were performed.
- `git diff --check` passed with CRLF normalization warnings only.

## Parked

Do not infer these from HS292:

- durable `watch_result` or `watch_result_items`
- relationship tags or relationship truth
- durable task queue
- Dispatcher/Bucket work
- schema migration
- support artifact creation
- renderer UI behavior
- active runtime enforcement
- fourth lane / fast lane

Open decisions remain:

- whether future system/radius Discovery ref identity should stay center-only or include radius/watch identity
- whether stored system/radius included/excluded scope should be authoritative snapshot, recomputed topology posture, or both with disclosed basis
- whether durable Watch/task results are needed later, and at what identity level

## Resting State

HS292 can rest as a local truth/readout seam. It gives Atlas a map of what current Watch/task flows can explain without pretending result persistence exists.

No new Dev runway is opened by this review.
