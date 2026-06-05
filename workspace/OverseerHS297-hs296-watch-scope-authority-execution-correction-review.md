# OverseerHS297 HS296 Watch Scope Authority Execution Correction Review

Status: accepted
Date: 2026-06-05
Owner: Overseer
Reviewed handoff: `workspace/DevHS296-watch-scope-authority-execution-correction.md`
Reviewed runway: `workspace/OverseerHS296-watch-scope-authority-execution-correction-runway.md`

## Decision

Accepted.

HS296 closes the accepted execution gap from HS294/HS295:

```txt
system/radius Watch execution now consumes accepted stored included_system_ids
```

The correction matches the accepted Watch scope authority model:

```txt
local topology lookup tables
-> authoring/preflight center + radius resolution
-> operator-accepted included system ID set
-> stored Watch scope
-> Watch execution uses stored included system IDs
```

Center/radius remain provenance and explanation after Watch acceptance. Recompute remains available for authoring, preflight, direct/manual collection, and diagnostic comparison, but it is no longer accepted Watch execution authority.

## Scope Review

Accepted implementation:

- `watchExecutor.dispatchFor` passes stored accepted `included_system_ids` as `acceptedSystemIds` for system/radius Watch execution.
- Invalid stored Watch scope blocks before task creation with `watch_scope_authority_invalid`.
- `systemRadiusPlanner.planSystemRadiusWatch` uses supplied accepted IDs as exact execution authority when present.
- Direct/manual `system.radius.watch` behavior remains center/radius planner behavior when no accepted IDs are supplied.
- `systemRadiusCollector` exposes scope authority in summaries.
- `watch.scope_authority_conformance.preview` now reports the execution seam as conforming.

Boundary review:

- no provider/live/API verification
- no schema changes
- no `system_watches` stored shape changes
- no Discovery ref identity changes
- no durable `watch_result`, `watch_result_items`, relationship tag, or relationship truth
- no durable Watch result semantics
- no renderer/UI work
- no runtime enforcement or command blocking activation
- no support artifacts
- no fourth lane / fast lane work

## Verification Reviewed

Overseer reran:

```txt
node --check src\main\watchlist\watchExecutor.js
node --check src\main\workers\systemRadiusCollector.js
node --check src\main\workers\systemRadiusPlanner.js
node --check src\main\services\watchScopeAuthorityConformanceService.js
node --check scripts\verify-watch-scope-authority-conformance.js
node --check scripts\verify-system-radius-collector.js
node --check scripts\verify-watch-executor.js
npm.cmd run verify:watch-scope-authority-conformance
node scripts\verify-system-radius-collector.js
npm.cmd run verify:watch-executor
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- All syntax and focused verifier checks passed.
- `watch.scope_authority_conformance.preview` reports `accepted_model_conformance: conforms`.
- Stored-vs-recomputed mismatch fixture proves execution follows stored scope.
- Invalid stored scope blocks before provider work/task creation.
- Direct/manual center-radius behavior remains covered.
- `verify:protected-terms` passed with warning-only advisory output; no renames or protected-word JSON changes were made.
- `git diff --check` passed with CRLF normalization warnings only.

## Notes

One implementation nuance is worth keeping visible: `systemRadiusPlanner` accepts `acceptedSystemIds` and also currently accepts `includedSystemIds` as an alias. Current callers do not appear to use `includedSystemIds` outside the accepted-scope path, and existing verification covers the intended behavior. If future direct/manual callers begin passing `includedSystemIds`, revisit whether that alias should remain or be narrowed to `acceptedSystemIds` only.

This is not blocking for HS296.

## Resting State

Watch scope authority can rest.

Current accepted state:

- Watch authoring/preflight resolves center/radius against local topology lookup tables.
- Stored included system IDs are accepted Watch execution authority.
- Watch execution consumes stored included system IDs.
- Center/radius explain how the scope was formed.
- Direct/manual system radius collection can still use center/radius planning.
- SDE source material is import/source provenance only, not runtime lookup authority.

## Parked

Do not open without a new bounded decision:

- Discovery ref identity redesign
- durable `watch_result` / `watch_result_items`
- relationship tags or relationship truth
- provider movement / live testing
- schema changes
- UI work
- runtime enforcement activation
- support artifacts
- fourth lane / fast lane

## Suggested Next Position

Rest after HS296 unless the Human opens another seam.

If continuing the same area later, the next likely decision is not execution scope authority. It is whether Atlas needs a separate Watch/task result read model to answer:

```txt
what did this Watch/task find in this window?
```

That remains parked until deliberately opened.
