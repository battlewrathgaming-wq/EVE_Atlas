# DevHS208 Runtime Hook Destination Path Authority Fact Preview

Status: complete; pending Overseer review.

## Scope

Implemented HS208 only: read-only, non-enforcing `destination_path_authority` fact sourcing for the inactive runtime enforcement hook preview.

## Files Changed

- `src/main/services/serviceRegistry.js`
- `scripts/verify-runtime-enforcement-hook.js`
- `scripts/verify-runtime-hook-telemetry.js`
- `workspace/current.md`
- `workspace/DevHS208-runtime-hook-destination-path-authority-fact-preview.md`

## Implementation

- Added `destination_path_authority` sourcing inside `sourceReadOnlyRuntimeGateFacts(...)`.
- Mapped support-artifact destination classes:
  - `runtime.db_snapshot.create` -> `runtime_snapshot_rolling`, `runtime_snapshot_retained`
  - `support.debug_trace_pack` -> `operator_debug_trace_pack`
- Commands without support-artifact destination needs now report `applies: false` / `state: not_applicable`.
- Renderer-supplied path claims are detected as ignored but are not accepted as authority and are not echoed into hook facts.
- Existing supplied `runtimeEnforcementFacts.destination_path_authority` remains preserved because sourcing still only fills missing fact classes.
- Destination authority remains separate from storage authority, budget, composed policy, support artifact creation policy, and runtime authorization.

## Fact Shape Sample

Runtime snapshot and trace-pack commands now expose compact destination/path authority posture like:

```json
{
  "fact_class": "destination_path_authority",
  "fact_source": "runtime_hook_read_only_support_artifact_path_authority_preview",
  "source_status": "sourced_mapped_artifact_classes",
  "applies": true,
  "mapped_artifact_class_ids": ["runtime_snapshot_rolling", "runtime_snapshot_retained"],
  "state": "destination_authority_required",
  "renderer_authoritative": false,
  "renderer_path_claims_ignored": true,
  "requires_storage_authority": true,
  "counts_against_storage_budget": true,
  "non_authorizing_preview": true
}
```

Class summaries are compact and omit raw paths. They include only bounded posture fields such as artifact class id, family, source/existence status, usage bytes, storage/budget relevance, cleanup stage, privacy sensitivity, provider posture, and External I/O relevance.

## Verification

Passed:

- `node --check src\main\services\serviceRegistry.js`
- `node --check scripts\verify-runtime-enforcement-hook.js`
- `node --check scripts\verify-runtime-hook-telemetry.js`
- `node --check src\main\services\runtimeEnforcementDryAdapter.js`
- `node --check src\main\services\runtimeHookTelemetryReadoutService.js`
- `node --check src\main\services\supportArtifactPathAuthorityService.js`
- `node --check scripts\verify-support-artifact-path-authority.js`
- `npm.cmd run verify:runtime-enforcement-hook`
- `npm.cmd run verify:runtime-hook-telemetry`
- `npm.cmd run verify:support-artifact-path-authority`
- `npm.cmd run verify:support-artifact-creation-policy`
- `npm.cmd run verify:runtime-snapshot`
- `npm.cmd run verify:operator-debug-trace`
- `npm.cmd run verify:support-trace-log-redaction-policy`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:enforcement-dry-run`
- `npm.cmd run verify:protected-terms`

Notes:

- `npm.cmd run verify:trace-pack-redaction` was attempted and failed because `package.json` does not define that script. The closest relevant trace-pack/redaction verifiers available in this repo were run instead: `verify:operator-debug-trace` and `verify:support-trace-log-redaction-policy`.
- `verify:protected-terms` passed with warning-only advisory output: 123 warnings across 3 changed working-set files; no renames or protected-word JSON updates performed.

Focused verifier proof included:

- `destination_path_authority_sourced: true`
- `snapshot_destination_path_authority_sourced: true`
- `trace_pack_destination_path_authority_sourced: true`
- `active_runtime_enforcement: false`
- `command_blocking: false`
- `file_writers_called_by_hook: false`
- `providers_called_by_hook: false`

## Boundary Confirmation

Preserved:

- no active runtime enforcement
- no command blocking
- no handler dispatch from the hook
- no task wrapping or task execution from the hook
- no provider calls
- no provider attempt recording
- no service-memory cooldown/lockout mutation from the hook
- no support artifact creation from the hook
- no snapshot creation from the hook
- no trace-pack creation from the hook
- no file or directory creation from the hook
- no filesystem deletion/move/copy
- no SDE download/import
- no Hydration writes
- no Evidence/EVEidence creation
- no Discovery ref mutation
- no Watch, Assessment Memory, or Marked mutation
- no schema changes
- no config writes
- no storage movement or migration
- no renderer UI work
- no pruning or deletion behavior

## Recommended Next Action

Overseer review. If accepted, either rest runtime hook fact sourcing or shape the next hardening seam around readiness for active enforcement without yet enabling command blocking.
