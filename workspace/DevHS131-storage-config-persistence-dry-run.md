# DevHS131 - Storage Config Persistence Dry-Run

Status: complete
Date: 2026-05-31
Role: Dev

## Summary

Implemented a fixture/offline `storage_config_dry_run` section on the existing read-only `storage.setup_gate_readout` surface.

The readout simulates the future storage authority config write target:

```text
<Atlas app/root>/config/storage-authority.json
```

No config file is written. The readout reports whether Atlas would write later, the accepted target path, why the path is allowed, a simulated payload, simulated readback, validation result, renderer-payload safety, and `not_implemented_readout_only` enforcement state.

## Files Changed

- `src/main/services/storageSetupGateReadoutService.js`
- `scripts/verify-storage-setup-gate.js`
- `workspace/current.md`
- `workspace/DevHS131-storage-config-persistence-dry-run.md`

## Service / Report Surface

Extended existing read-only service command:

```text
storage.setup_gate_readout
```

Added readout field:

```text
storage_config_dry_run
```

The command remains renderer-eligible and read-only through the existing service registry entry.

## Dry-Run Payload Shape

For a valid selected-storage fixture with explicit budget, the simulated payload includes:

```json
{
  "schema": "aura.atlas.storage_authority",
  "version": 1,
  "selected_storage_mode": "selected_storage",
  "selected_storage_root": "<fixture storage root>",
  "selected_database_path": "<fixture DB path>",
  "path_basis": "explicit_selected_storage",
  "validation_status": "valid",
  "fallback_acknowledgement": {
    "status": "not_required",
    "acknowledged": false,
    "provenance": "explicit_selected_storage_or_no_fallback",
    "invalidation_basis": null
  },
  "budget_bytes": 4096,
  "budget_source": "fixture_configured",
  "created_at": "DRY_RUN_TIMESTAMP_PLACEHOLDER",
  "updated_at": "DRY_RUN_TIMESTAMP_PLACEHOLDER",
  "dry_run": true
}
```

## Sample Preflight Output

Compact sample from `npm.cmd run verify:storage-setup-gate`:

```json
{
  "selected_storage": {
    "would_write": true,
    "target_path_basis": "<Atlas app/root>/config/storage-authority.json",
    "path_allowed": true,
    "validation_status": "would_write_valid",
    "readback_status": "would_read_back",
    "enforcement_state": "not_implemented_readout_only"
  },
  "app_local_fallback_available": {
    "would_write": false,
    "validation_status": "fallback_acknowledgement_required"
  },
  "app_local_fallback_acknowledged": {
    "would_write": true,
    "validation_status": "would_write_valid"
  },
  "acknowledgement_invalidated": {
    "would_write": false,
    "validation_status": "fallback_acknowledgement_invalidated"
  },
  "no_storage_selected": {
    "would_write": false,
    "validation_status": "storage_not_selected"
  },
  "selected_storage_missing_unavailable": {
    "would_write": false,
    "validation_status": "selected_storage_missing_unavailable"
  },
  "selected_storage_invalid_degraded": {
    "would_write": false,
    "validation_status": "selected_storage_invalid_degraded"
  },
  "budget_missing_provider_backed": {
    "would_write": false,
    "validation_status": "budget_required_for_provider_backed_work"
  }
}
```

## Path And Renderer Safety

Verified:

- target path is derived in main process from `projectRoot()/config/storage-authority.json`
- renderer payload cannot choose config target path
- renderer payload cannot choose storage DB path or storage root
- renderer payload cannot forge fallback acknowledgement
- renderer payload cannot forge budget bytes
- renderer payload cannot probe filesystem paths through this readout

## Boundary Confirmation

Confirmed:

- no real config file writes
- no persisted acknowledgement
- no storage enforcement or runtime lockout enforcement
- no DB move, copy, migration, relocation, restore, or delete behavior
- no real pruning/deletion execution
- no snapshot creation against real operator paths
- no live/provider/API/private calls
- no zKill calls
- no ESI calls
- no Evidence/EVEidence writes
- no hydration writes
- no schema migration
- no renderer redesign or UI wording work
- dry-run payload is not treated as persisted config

## Verification

Passed:

```powershell
node --check src\main\services\storageSetupGateReadoutService.js
node --check scripts\verify-storage-setup-gate.js
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
Test-Path config\storage-authority.json
```

`npm.cmd run verify:protected-terms` completed with warning-only protected-term discovery output and exit code 0.

One initial parallel run of `npm.cmd run verify:service-registry` failed while `verify:storage-authority-preflight` was deleting its temp fixture directory. Rerunning `verify:service-registry` standalone passed.

`git diff --check` passed with line-ending warnings only. `git status --short --branch` showed the expected HS131 modified/new files on `main...origin/main [ahead 8]`. `Test-Path config\storage-authority.json` returned `False`, confirming HS131 did not create the future config file.
