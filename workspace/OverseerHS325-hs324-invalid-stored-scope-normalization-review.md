# OverseerHS325 HS324 Invalid Stored Scope Normalization Review

Status: accepted
Date: 2026-06-05
Role: Overseer

## Reviewed

- `workspace/OverseerHS324-invalid-stored-scope-authority-normalization-runway.md`
- `workspace/DevHS324-invalid-stored-scope-authority-normalization.md`
- `src/main/services/systemRadiusSetupReadoutService.js`
- `src/main/services/watchAuthoredExecutionReadinessService.js`
- `src/main/services/systemRadiusReadoutReadinessBridgeService.js`
- `scripts/verify-system-radius-setup-readout.js`
- `scripts/verify-watch-authored-execution-readiness.js`
- `scripts/verify-system-radius-readout-readiness-bridge.js`

## Decision

HS324 is accepted.

Invalid stored System / Radius Watch scope now exposes no accepted or usable included system IDs. Partial parseable IDs from an invalid stored scope are retained only as diagnostic, non-authority information.

## Accepted Result

- Setup readout now keeps invalid stored scope out of accepted scope authority:
  - `accepted_scope_authority.included_system_ids` is `[]`.
  - `included_systems` is `[]`.
  - `included_system_count` is `0`.
- Authored execution readiness now keeps invalid stored scope out of execution input:
  - `execution_system_ids` is `[]`.
  - `stored_scope.included_system_ids` is `[]`.
  - `future_execution_payload` remains `null`.
- Invalid stored scope remains blocked with `invalid_stored_scope`.
- Parseable fragments from invalid stored scope are retained only in:
  - `invalid_scope_diagnostic.diagnostic_parseable_system_ids`
- The diagnostic object explicitly reports:
  - `operator_actionable: false`
  - `accepted_authority: false`
  - `execution_authority: false`
  - `repairs_stored_row: false`
- The HS322 setup/readiness mismatch is resolved:
  - bridge status: `all_setup_readout_and_readiness_rows_match`
  - matched rows: `7`
  - mismatched rows: `0`
  - mismatch Watch IDs: `[]`

## Boundary Check

No Watch execution, Watch runtime arm/disarm, Watch executor task creation, provider/API/live call, Watch row repair, Discovery ref mutation, Evidence/EVEidence write, Hydration/metadata write, `watch.create` behavior change, topology traversal change, center/radius fallback authority, schema change, renderer/UI work, support artifact behavior, runtime enforcement, command blocking, Watch result identity, relationship tag, protected-word JSON update, or fourth-lane behavior was opened.

## Verification

Accepted proof:

- `npm.cmd run verify:watch-authored-execution-readiness` passed.
- `npm.cmd run verify:system-radius-readout-readiness-bridge` passed.
- `npm.cmd run verify:system-radius-setup-readout` passed.
- `npm.cmd run verify:watch-create-accepted-scope-contract` passed.
- `npm.cmd run verify:service-registry` passed on sequential rerun.
- `npm.cmd run verify:command-authority` passed.
- `npm.cmd run verify:passive-side-effects` passed.
- `npm.cmd run verify:enforcement-dry-run` passed.
- `npm.cmd run verify:protected-terms` passed with warning-only advisory output and no protected-word JSON updates.

Process note:

- One parallel `verify:service-registry` run failed while `verify:passive-side-effects` was also using the `.tmp/passive-side-effects` path. Sequential rerun passed. Treat this as verifier workspace interference, not an HS324 product defect.

## Resting State

HS324 can rest.

No active Dev runway is open after this acceptance.

Recommended next motion should remain a single bounded storage/runtime seam and should not reopen UI, provider movement, Watch execution, or active enforcement without a new Human/Overseer decision.
