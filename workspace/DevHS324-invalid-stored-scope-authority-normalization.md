# DevHS324 Invalid Stored Scope Authority Normalization

Status: complete
Date: 2026-06-05
Role: Dev

## Scope

Executed HS324 only: normalize invalid stored System / Radius Watch scope handling so partial parsed IDs remain diagnostic-only and never become accepted scope, usable execution scope, or operator-actionable included systems.

## Files Changed

- `src/main/services/systemRadiusSetupReadoutService.js`
- `src/main/services/watchAuthoredExecutionReadinessService.js`
- `src/main/services/systemRadiusReadoutReadinessBridgeService.js`
- `scripts/verify-system-radius-setup-readout.js`
- `scripts/verify-watch-authored-execution-readiness.js`
- `scripts/verify-system-radius-readout-readiness-bridge.js`
- `workspace/current.md`
- `workspace/DevHS324-invalid-stored-scope-authority-normalization.md`

## Before / After

Before:

- Invalid stored scope such as `[30003597,"bad"]` was blocked by readiness but still exposed the parseable subset `[30003597]` through `stored_scope.included_system_ids`.
- Setup readout exposed no accepted IDs for the same invalid row.
- The bridge correctly reported a setup/readiness mismatch for that row.

After:

- Invalid stored scope exposes no accepted included IDs.
- Invalid stored scope exposes no execution IDs.
- Invalid stored scope remains not ready and blocked by `invalid_stored_scope`.
- Center/radius remain provenance/management only and are not used as fallback authority.
- The parseable numeric subset is retained only in `invalid_scope_diagnostic.diagnostic_parseable_system_ids`.
- The diagnostic object explicitly marks `operator_actionable`, `accepted_authority`, `execution_authority`, and `repairs_stored_row` as `false`.
- The bridge now reports setup/readiness as matched for the invalid fixture row.
- The bridge also compares `invalid_scope_diagnostic.diagnostic_parseable_system_ids` as a non-authority conformance field.

## Diagnostic Subset

Retained:

```json
{
  "invalid_scope_diagnostic": {
    "diagnostic_parseable_system_ids": [30003597],
    "operator_actionable": false,
    "accepted_authority": false,
    "execution_authority": false,
    "repairs_stored_row": false
  }
}
```

Not retained as `included_system_ids`, `execution_system_ids`, accepted scope, future execution payload, or operator-actionable included systems.

## Sample Proof

Focused bridge verifier sample for invalid row:

```json
{
  "watch_id": 5,
  "conformance_status": "matched",
  "stored_scope_status": {
    "setup": "invalid",
    "readiness": "invalid"
  },
  "stored_included_system_ids": {
    "setup": [],
    "readiness": []
  },
  "invalid_scope_diagnostic": {
    "setup": {
      "diagnostic_parseable_system_ids": [30003597],
      "operator_actionable": false,
      "accepted_authority": false,
      "execution_authority": false,
      "repairs_stored_row": false
    },
    "readiness": {
      "diagnostic_parseable_system_ids": [30003597],
      "operator_actionable": false,
      "accepted_authority": false,
      "execution_authority": false,
      "repairs_stored_row": false
    }
  },
  "included_system_count": {
    "setup": 0,
    "readiness": 0
  },
  "readiness_for_future_execution_input": {
    "setup": false,
    "readiness": false
  },
  "blocked_reasons": {
    "setup": ["invalid_stored_scope"],
    "readiness": ["invalid_stored_scope"]
  },
  "mismatch_fields": []
}
```

Bridge summary:

```json
{
  "status": "all_setup_readout_and_readiness_rows_match",
  "bridge_row_count": 7,
  "matched_row_count": 7,
  "mismatched_row_count": 0,
  "mismatch_watch_ids": []
}
```

## Mutation Boundary

Confirmed no Watch execution, runtime arm/disarm, task creation, provider/live/API calls, Watch row mutation or repair, Discovery ref mutation, Evidence/EVEidence writes, Hydration/metadata writes, `watch.create` changes, topology traversal changes, center/radius fallback authority, schema changes, renderer/UI work, support artifacts, runtime enforcement or command blocking, Watch result identity, relationship tags, protected-word JSON updates, or fourth-lane behavior.

## Verification

Passed:

- `node --check src\main\services\watchAuthoredExecutionReadinessService.js`
- `node --check src\main\services\systemRadiusReadoutReadinessBridgeService.js`
- `node --check scripts\verify-watch-authored-execution-readiness.js`
- `node --check scripts\verify-system-radius-readout-readiness-bridge.js`
- `npm.cmd run verify:watch-authored-execution-readiness`
- `npm.cmd run verify:system-radius-readout-readiness-bridge`
- `npm.cmd run verify:system-radius-setup-readout`
- `npm.cmd run verify:watch-create-accepted-scope-contract`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:enforcement-dry-run`
- `npm.cmd run verify:protected-terms`
- `git diff --check`
- `git status --short --branch`

Notes:

- `verify:protected-terms` passed with warning-only advisory output: 53 warnings across 6 changed working-set files; no renames or protected-word JSON updates performed.
- `verify:watch-create-accepted-scope-contract` used its existing fixture-only Watch creation proof and reported only expected fixture `system_watches` changes.
- `git diff --check` passed with CRLF normalization warnings only.
- `git status --short --branch` showed branch `main...origin/main` with HS324 working-tree changes.
