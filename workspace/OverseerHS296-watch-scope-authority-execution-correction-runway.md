# OverseerHS296 Watch Scope Authority Execution Correction Runway

Status: open
Date: 2026-06-05
Owner: Overseer
Executor: Dev
Expected handoff: `workspace/DevHS296-watch-scope-authority-execution-correction.md`

## Purpose

Correct the accepted HS294 conformance gap in the Watch executor path:

```txt
system/radius Watch execution should consume accepted stored included_system_ids
```

The correction should make Watch execution use the operator-accepted stored system set instead of silently recomputing execution scope from center/radius.

## Accepted Model

```txt
local topology lookup tables
-> authoring/preflight center + radius resolution
-> operator-accepted included system ID set
-> stored Watch scope
-> Watch execution uses stored included system IDs
```

SDE is import/source provenance only. Runtime geometry uses local topology lookup tables. Center/radius are provenance/explanation after Watch acceptance. Recompute remains valid for authoring/preflight and diagnostic comparison only.

## Task

Implement the smallest execution correction:

- Update `watchExecutor.dispatchFor` so system/radius Watch dispatch payload includes the stored accepted `included_system_ids` from `watch.source`.
- Preserve center system and radius in the payload as provenance/explanation fields.
- Update system/radius collection/planning so, when accepted stored included IDs are supplied, those IDs are used as execution authority.
- Preserve existing direct/manual `system.radius.watch` behavior when no stored included system IDs are supplied.
- Keep recomputed topology available only for authoring/preflight or diagnostic comparison, not as Watch execution authority.
- If a Watch dispatch has missing or malformed stored included scope, do not silently recompute as authority. Surface a clear local scope-authority failure before provider work.

Preferred behavior shape:

```txt
Watch executor dispatch:
  uses stored included_system_ids
  may include excluded_system_ids as provenance/readout only unless already accepted into stored included set
  center/radius remain provenance

Direct/manual system.radius.watch:
  may continue using center/radius planner behavior
  not treated as accepted Watch scope execution
```

## Boundaries

Do not:

- call zKill, ESI, SDE download, or any provider in verification
- change schema
- change `system_watches` stored shape
- change Discovery ref identity
- create `watch_result`, `watch_result_items`, relationship tags, or relationship truth
- implement durable Watch result semantics
- change renderer UI
- activate runtime enforcement or command blocking
- create support artifacts
- reopen fourth lane / fast lane
- treat recomputed topology as Watch execution authority
- make center/radius execution authority for accepted Watch runs

## Acceptance Criteria

- System/radius Watch executor dispatch payload includes stored `included_system_ids` when schedule source has valid stored scope.
- Collector/planner uses supplied accepted system IDs as execution scope authority when present.
- Fixture proves stored scope can intentionally differ from recomputed topology and execution follows stored scope.
- Fixture proves missing/malformed stored scope in Watch execution fails/blocks before provider calls instead of recomputing.
- Direct/manual system.radius collection without stored included IDs preserves existing center/radius planning behavior.
- Returned summaries disclose scope authority source, for example `stored_watch_scope` versus `center_radius_planner`.
- Discovery refs remain possible leads / provenance, not Evidence/EVEidence.
- Evidence/EVEidence is still created only by ESI expansion when provider-backed collection actually runs outside fixture tests.
- `watch.scope_authority_conformance.preview` updates from execution `gap` to `conforms` or a clearly narrower `partial` if one parked non-execution issue remains.
- No schema, UI, enforcement, support artifact, durable result, or Discovery identity work is added.

## Verification

Run focused and adjacent checks:

```txt
node --check src\main\watchlist\watchExecutor.js
node --check src\main\workers\systemRadiusCollector.js
node --check src\main\workers\systemRadiusPlanner.js
node --check src\main\services\watchScopeAuthorityConformanceService.js
node --check scripts\verify-watch-scope-authority-conformance.js
node --check scripts\verify-system-radius-collector.js
node --check scripts\verify-watch-executor.js
npm.cmd run verify:watch-scope-authority-conformance
npm.cmd run verify:system-radius-collector
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

Adjust verifier names only if the repository uses a clearly equivalent existing script name.

## Stop Conditions

Stop and hand back if:

- the correction requires schema changes
- provider/live/private/destructive action is needed
- direct/manual system.radius behavior must be redesigned
- Discovery ref identity must change
- durable Watch result semantics become necessary
- missing/malformed stored scope handling needs Human policy beyond "do not silently recompute"
- recompute starts becoming execution authority again
- SDE source material becomes runtime lookup authority
