# Dev HS206 - Runtime Hook Composed Policy Fact Preview

Status: complete
Date: 2026-06-02
Executor: Dev

## Scope

Implemented the HS206 read-only, non-enforcing `composed_policy` fact preview for the inactive runtime enforcement hook.

The hook now sources a compact current-command composed policy fact from `storage.composed_gate_policy.preview` / `buildComposedGatePolicyPreview(...)`. It does not dump full composed policy rows into the hook preview.

## Files Changed

- `src/main/services/serviceRegistry.js`
- `src/main/services/runtimeHookTelemetryReadoutService.js`
- `scripts/verify-runtime-enforcement-hook.js`
- `scripts/verify-runtime-hook-telemetry.js`
- `workspace/current.md`
- `workspace/DevHS206-runtime-hook-composed-policy-fact-preview.md`

## Behavior Added

- Added `composed_policy` fact sourcing to the inactive runtime hook preview.
- Mapped commands receive a compact row-based fact:
  - `matched_row_id`
  - `state`
  - `reason_codes`
  - compact `gate_summary`
  - inactive enforcement/runtime authorization flags
  - `would_allow_is_authorization: false`
  - `answers_may_run_now: false`
- Unmapped commands receive explicit `sourced_unmapped` posture instead of guessed authorization.
- Supplied `runtimeEnforcementFacts.composed_policy` remains preserved and is not overwritten.
- Runtime hook telemetry now includes `composed_policy` in sourced broad fact status while still reporting `destination_path_authority` as separate/unsourced when absent.

## Sample Output

Focused hook verifier:

```json
{
  "composed_policy_sourced": true,
  "mapped_local_composed_policy_sourced": true,
  "provider_capable_external_io_sourced_without_authorizing": true,
  "active_runtime_enforcement": false,
  "command_blocking": false,
  "providers_called_by_hook": false,
  "task_runners_called_by_hook": false
}
```

Runtime hook telemetry sample:

```json
{
  "missing_fact_classes": [],
  "sourced_broad_fact_classes": [
    "storage_authority",
    "budget",
    "external_io",
    "provider_live_gate",
    "composed_policy"
  ],
  "broad_fact_class_statuses": {
    "composed_policy": {
      "status": "sourced",
      "source_status": "sourced_unmapped",
      "fact_source": "runtime_hook_read_only_composed_gate_policy_preview",
      "non_authorizing_preview": true
    },
    "destination_path_authority": {
      "status": "not_sourced"
    }
  }
}
```

Mapped proof:

- `runtime.enforcement_boundary.preview` maps to composed row `runtime_enforcement_boundary_readout`.
- `manual.discovery` maps to composed row `zkill_discovery` after renderer confirmation is satisfied.
- Compact facts contain no `rows` dump.
- `state`, `pass`, `conditional`, `hold`, `block`, and `would_allow` remain preview posture only.

## Boundary Confirmation

- Active runtime enforcement remains false.
- Runtime command blocking remains inactive.
- No target handlers, task runners, providers, repositories, file writers, config writers, or mutating services are called by the hook.
- No provider attempt recording or service-memory cooldown/lockout mutation is added.
- Composed policy remains separate from External I/O, provider/live gate, storage authority, storage budget, confirmation, destination path authority, Watch arming, and runtime authorization.
- `would_allow`, `pass`, and External I/O `on` remain non-authorizing.
- No provider calls, SDE download/import, Hydration writes, Evidence/EVEidence writes, Discovery ref mutation, Watch mutation, Assessment Memory mutation, Marked mutation, schema changes, support artifact creation, config writes, storage movement, renderer UI work, pruning, or deletion behavior were added.

## Verification

Passed:

- `node --check src\main\services\serviceRegistry.js`
- `node --check src\main\services\runtimeEnforcementDryAdapter.js`
- `node --check src\main\services\runtimeHookTelemetryReadoutService.js`
- `node --check src\main\services\composedGatePolicyService.js`
- `node --check scripts\verify-runtime-enforcement-hook.js`
- `node --check scripts\verify-runtime-hook-telemetry.js`
- `node --check scripts\verify-composed-gate-policy.js`
- `npm.cmd run verify:runtime-enforcement-hook`
- `npm.cmd run verify:runtime-hook-telemetry`
- `npm.cmd run verify:composed-gate-policy`
- `npm.cmd run verify:gate-stack-readout`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:enforcement-dry-run`
- `npm.cmd run verify:protected-terms`

`verify:protected-terms` completed with warning-only advisory output: 113 warnings across 4 changed working-set files; no renames or protected-word JSON updates were performed.

Final hygiene commands are recorded in `workspace/current.md`.
