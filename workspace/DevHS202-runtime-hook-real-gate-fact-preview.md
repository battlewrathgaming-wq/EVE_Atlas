# Dev HS202 - Runtime Hook Real Gate Fact Preview

Status: complete
Date: 2026-06-02
Executor: Dev

## Scope

Implemented the HS202 read-only, non-enforcing fact-sourcing preview for the inactive runtime enforcement hook.

The hook now sources broad gate posture from existing accepted readback surfaces:

- storage authority from `storage.authority_config.readback` / setup gate posture
- storage budget from `storage.setup_gate_readout`
- External I/O from `external_io.state_config_readback`

Explicitly supplied `runtimeEnforcementFacts` remain authoritative diagnostic input and are not overwritten when they already contain a broad fact key.

## Files Changed

- `src/main/services/serviceRegistry.js`
- `src/main/services/runtimeHookTelemetryReadoutService.js`
- `scripts/verify-runtime-enforcement-hook.js`
- `scripts/verify-runtime-hook-telemetry.js`
- `workspace/current.md`
- `workspace/DevHS202-runtime-hook-real-gate-fact-preview.md`

## Behavior Added

- `emitInactiveRuntimeEnforcementPreview(...)` now passes read-only sourced facts into the dry adapter before observer delivery.
- `runtimeEnforcementFactsFor(...)` still preserves supplied command-scoped and global diagnostic facts.
- The hook fills only absent broad fact keys:
  - `storage_authority`
  - `budget`
  - `external_io`
- Missing storage config, missing budget, and missing External I/O config are represented as posture:
  - storage authority sample: `source_status: sourced_absent_unconfigured`
  - budget sample: `source_status: sourced_absent_unconfigured`
  - External I/O sample: `source_status: sourced_missing`
- Still-unsourced classes remain visible:
  - `provider_live_gate`
  - `destination_path_authority`
  - `composed_gate_policy`

## Sample Preview Output

Focused hook verifier:

```json
{
  "broad_fact_sourcing": true,
  "storage_authority_sourced": true,
  "storage_budget_sourced": true,
  "external_io_sourced": true,
  "provider_capable_external_io_sourced_without_authorizing": true,
  "active_runtime_enforcement": false,
  "command_blocking": false,
  "providers_called_by_hook": false,
  "config_writers_called_by_hook": false
}
```

Runtime hook telemetry sample:

```json
{
  "missing_fact_classes": ["composed_gate_policy"],
  "sourced_broad_fact_classes": ["storage_authority", "budget", "external_io"],
  "broad_fact_class_statuses": {
    "storage_authority": {
      "status": "sourced",
      "source_status": "sourced_absent_unconfigured",
      "fact_source": "runtime_hook_read_only_storage_authority_readback"
    },
    "budget": {
      "status": "sourced",
      "source_status": "sourced_absent_unconfigured",
      "fact_source": "runtime_hook_read_only_storage_setup_gate_readout"
    },
    "external_io": {
      "status": "sourced",
      "source_status": "sourced_missing",
      "fact_source": "runtime_hook_read_only_external_io_config_readback"
    },
    "provider_live_gate": {
      "status": "not_sourced"
    }
  }
}
```

## Boundary Confirmation

- Active runtime enforcement remains false.
- Runtime command blocking remains inactive.
- `would_allow`, External I/O `on`, and sourced facts remain non-authorizing preview posture.
- Provider-capable commands still require the existing front-door confirmation/live/API gates before existing behavior runs.
- Renderer-ineligible and missing-confirmation commands still stop before the inactive hook.
- The hook does not call target handlers, task runners, providers, repositories, file writers, config writers, or mutating services.
- No provider calls, SDE download/import, Hydration writes, Evidence/EVEidence writes, Discovery ref mutation, Watch mutation, Assessment Memory mutation, Marked mutation, schema changes, support artifact creation, config writes, storage movement, renderer UI work, pruning, or deletion behavior were added.

## Verification

Passed:

- `node --check src\main\services\serviceRegistry.js`
- `node --check src\main\services\runtimeEnforcementDryAdapter.js`
- `node --check src\main\services\runtimeHookTelemetryReadoutService.js`
- `node --check scripts\verify-runtime-enforcement-hook.js`
- `node --check scripts\verify-runtime-hook-telemetry.js`
- `npm.cmd run verify:runtime-enforcement-hook`
- `npm.cmd run verify:runtime-hook-telemetry`
- `npm.cmd run verify:storage-authority-config-write`
- `npm.cmd run verify:external-io-state`
- `npm.cmd run verify:gate-stack-readout`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:enforcement-dry-run`
- `npm.cmd run verify:protected-terms`

`verify:protected-terms` completed with warning-only advisory output: 99 warnings across 4 changed working-set files; no renames or protected-word JSON updates were performed.

Final hygiene commands are recorded in `workspace/current.md`.

