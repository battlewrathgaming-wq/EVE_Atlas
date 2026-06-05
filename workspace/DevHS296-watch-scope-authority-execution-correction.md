# DevHS296 Watch Scope Authority Execution Correction

Status: complete pending Overseer review
Date: 2026-06-05
Executor: Dev

## Scope

Implemented the bounded Watch scope authority execution correction.

Goal:

```txt
system/radius Watch execution consumes accepted stored included_system_ids
```

Direct/manual `system.radius.watch` without accepted stored IDs remains center/radius planner behavior.

## Files Changed

- `src/main/watchlist/watchExecutor.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/systemRadiusPlanner.js`
- `src/main/services/watchScopeAuthorityConformanceService.js`
- `scripts/verify-watch-scope-authority-conformance.js`
- `scripts/verify-system-radius-collector.js`
- `scripts/verify-watch-executor.js`
- `workspace/current.md`
- `workspace/DevHS296-watch-scope-authority-execution-correction.md`

## Implementation

`watchExecutor.dispatchFor` now:

- requires valid stored `included_system_ids` for system/radius Watch execution
- passes those IDs as `acceptedSystemIds`
- marks `acceptedScopeSource: stored_watch_scope`
- preserves center/radius as provenance/explanation
- blocks missing/malformed/empty stored included scope before task creation with `watch_scope_authority_invalid`

`systemRadiusPlanner.planSystemRadiusWatch` now:

- uses supplied `acceptedSystemIds` as exact execution scope authority
- does not re-cap accepted stored systems with `maxSystems`
- does not recompute topology as authority when accepted IDs are supplied
- preserves existing center/radius planning when accepted IDs are absent

`systemRadiusCollector` now reports scope authority in result summaries:

- `stored_watch_scope`
- `center_radius_planner`
- `uses_stored_included_system_ids`
- `recomputed_topology_used_as_authority`
- `center_radius_role`

`watch.scope_authority_conformance.preview` now reports the execution seam as conforming while keeping offline readout fallback classified as partial/readout-only.

## Sample Conformance Output

Focused verifier sample:

```json
{
  "summary": {
    "status": "conforms",
    "stored_vs_recomputed_mismatch_count": 1,
    "execution_uses_stored_included_ids_now": true,
    "execution_recomputes_from_center_radius_now": false,
    "invalid_stored_scope_blocks_before_provider": true,
    "direct_manual_system_radius_preserves_center_radius_planner": true,
    "accepted_model_conformance": "conforms",
    "exact_correction_seam": null
  },
  "watch_scope_samples": [
    {
      "watch_id": 1,
      "stored_included": [30000101, 30000103],
      "recomputed": [30000101, 30000102],
      "scope_match": false,
      "execution_status": "conforms",
      "uses_stored_scope": true
    }
  ]
}
```

## Verification Highlights

- Stored Watch scope `[30000001,30000004]` drove exact collector zKill target systems in fixture verification.
- Valid system/radius Watch dispatch carried stored accepted IDs into payload.
- Malformed stored scope failed before dispatch payload and blocked Watch executor tick before task creation.
- Direct/manual center/radius collector behavior remains covered by existing collector tests.
- Conformance preview still distinguishes stored scope from recomputed diagnostic topology.

## Boundary Confirmation

Confirmed:

- no provider/live/API verification
- no schema changes
- no `system_watches` stored shape changes
- no Discovery ref identity changes
- no durable `watch_result`, `watch_result_items`, relationship tags, or relationship truth
- no durable Watch result semantics
- no renderer/UI work
- no runtime enforcement or command blocking activation
- no support artifacts
- no fourth lane / fast lane work

## Verification

Passed:

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
npm.cmd run verify:collector
npm.cmd run verify:watch-executor
npm.cmd run verify:planner
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
```

Note: the repository package alias for `scripts\verify-system-radius-collector.js` is `verify:collector`; the direct script command was also run.

`verify:protected-terms` completed with warning-only advisory output: 28 warnings across 7 changed working-set files; no renames or protected-word JSON updates were performed.

```txt
git diff --check
```

Passed with CRLF normalization warnings only.

```txt
git status --short --branch
```

Showed branch `main...origin/main` with HS296 working-tree changes.

## Risks / Open Decisions

- System/radius Discovery ref identity remains center-only by design in this packet.
- Offline readout still falls back to center local context for invalid stored scope as diagnostic/readout posture only; execution no longer treats that fallback as authority.
- Durable Watch result semantics remain unopened.

## Recommended Next Action

Overseer should review the execution correction. If accepted, Atlas can proceed with later Watch result semantics or identity decisions from a stronger stored-scope authority base.
