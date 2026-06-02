# Dev HS204 - Runtime Hook Provider Live Gate Fact Preview

Status: complete
Date: 2026-06-02
Executor: Dev

## Scope

Implemented the HS204 read-only, non-enforcing `provider_live_gate` fact preview for the inactive runtime enforcement hook.

The hook now sources provider/live gate posture from existing `liveApiGateService.actionGate(...)` where a safe accepted mapping exists, without calling `enterLiveProviderAttempt(...)`, providers, task dispatch, handlers, repositories, writers, or mutating services.

## Files Changed

- `src/main/services/serviceRegistry.js`
- `scripts/verify-runtime-enforcement-hook.js`
- `scripts/verify-runtime-hook-telemetry.js`
- `workspace/current.md`
- `workspace/DevHS204-runtime-hook-provider-live-gate-fact-preview.md`

## Behavior Added

- Added `provider_live_gate` fact sourcing to the inactive runtime hook preview.
- Mapped accepted provider/live actions:
  - `manual.discovery` -> `manual.discovery`
  - `manual.expansion` -> `manual.expansion`
  - `metadata.hydration` -> `metadata.hydration`
  - `sde.build-lookups` -> `sde.build-lookups` only when no local source path is supplied
- Local-only or unmapped non-provider commands receive explicit local-only / not-applicable posture.
- Unmapped provider-capable commands receive explicit `sourced_unmapped_provider_capable` posture instead of a guessed live gate.
- Supplied `runtimeEnforcementFacts.provider_live_gate` remains preserved and is not overwritten.
- `provider_live_gate.allowed` is explicitly marked non-authorizing.

## Sample Provider Gate Output

Focused hook verifier:

```json
{
  "provider_live_gate_sourced": true,
  "provider_capable_external_io_sourced_without_authorizing": true,
  "live_radius_rejection_sourced_without_provider_call": true,
  "active_runtime_enforcement": false,
  "command_blocking": false,
  "providers_called_by_hook": false,
  "task_runners_called_by_hook": false
}
```

Runtime hook telemetry sample for a local-only command:

```json
{
  "sourced_broad_fact_classes": [
    "storage_authority",
    "budget",
    "external_io",
    "provider_live_gate"
  ],
  "broad_fact_class_statuses": {
    "provider_live_gate": {
      "status": "sourced",
      "source_status": "sourced_local_only_not_applicable",
      "fact_source": "runtime_hook_read_only_live_api_gate_mapping",
      "non_authorizing_preview": true
    },
    "destination_path_authority": {
      "status": "not_sourced"
    }
  }
}
```

Provider-capable proof:

- `manual.discovery` with renderer confirmation reaches the inactive hook.
- The hook reports `provider_live_gate.state: blocked` with `LIVE_API_DISABLED`.
- The command still stops by existing live/API gate behavior after the hook.
- Live radius rejection is visible as `LIVE_RADIUS_REJECTED` read-only provider gate posture.

## Boundary Confirmation

- Active runtime enforcement remains false.
- Runtime command blocking remains inactive.
- No target handlers, task runners, providers, repositories, file writers, config writers, or mutating services are called by the hook.
- No provider attempt recording or service-memory cooldown/lockout mutation is added.
- External I/O, storage authority, storage budget, confirmation, composed policy, destination path authority, Watch arming, and runtime authorization remain separate.
- External I/O `on` and provider/live gate `allowed: true` remain non-authorizing.
- No provider calls, SDE download/import, Hydration writes, Evidence/EVEidence writes, Discovery ref mutation, Watch mutation, Assessment Memory mutation, Marked mutation, schema changes, support artifact creation, config writes, storage movement, renderer UI work, pruning, or deletion behavior were added.

## Verification

Passed:

- `node --check src\main\services\serviceRegistry.js`
- `node --check src\main\services\runtimeEnforcementDryAdapter.js`
- `node --check src\main\services\runtimeHookTelemetryReadoutService.js`
- `node --check src\main\services\liveApiGateService.js`
- `node --check scripts\verify-runtime-enforcement-hook.js`
- `node --check scripts\verify-runtime-hook-telemetry.js`
- `node --check scripts\verify-live-api-gate.js`
- `npm.cmd run verify:runtime-enforcement-hook`
- `npm.cmd run verify:runtime-hook-telemetry`
- `npm.cmd run verify:live-api-gate`
- `npm.cmd run verify:gate-stack-readout`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:enforcement-dry-run`
- `npm.cmd run verify:protected-terms`

`npm.cmd run verify:gate-stack-readout` initially failed only when run in parallel with `verify:passive-side-effects`, because the passive-side-effect verifier removed its temporary directory while gate-stack was scanning byte usage. It passed when rerun sequentially.

`verify:protected-terms` completed with warning-only advisory output: 104 warnings across 3 changed working-set files; no renames or protected-word JSON updates were performed.

Final hygiene commands are recorded in `workspace/current.md`.
