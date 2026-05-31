# DevHS135 - Acknowledgement Persistence Proof

Status: complete
Date: 2026-05-31
Role: Dev

## Summary

Implemented a bounded fixture/offline proof that app-local/current-file fallback acknowledgement can be persisted and read back as storage-authority memory while staying distinct from selected storage.

The proof writes only to trusted fixture targets, reads the fixture config back, rebuilds storage setup posture from the persisted acknowledgement memory, and proves invalidation and missing-budget behavior without enforcement.

## Files Changed

- `src/main/services/storageAuthorityConfigWriteService.js`
- `src/main/services/serviceRegistry.js`
- `scripts/verify-storage-acknowledgement-persistence.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS135-acknowledgement-persistence-proof.md`

## Command / Helper Added

Added service command:

```text
storage.authority_config.acknowledgement_persistence_proof
```

Command posture:

- classification: `metadata-only`
- effects: `local-data-mutation`
- renderer eligible: `false`
- enforcement state: `not_implemented_readout_only`

Added verifier:

```powershell
npm.cmd run verify:storage-acknowledgement-persistence
```

## Sample Persisted Acknowledgement Payload

Compact verifier sample:

```json
{
  "selected_storage_mode": "app_local_fallback_acknowledged",
  "selected_storage_root": "F:\\Projects\\AURA-Atlas\\.tmp\\storage-acknowledgement-persistence-fixture\\app-local-fallback",
  "selected_database_path": "F:\\Projects\\AURA-Atlas\\.tmp\\storage-acknowledgement-persistence-fixture\\app-local-fallback\\atlas.sqlite",
  "path_basis": "app_local_current_file_fallback",
  "acknowledgement_status": "acknowledged",
  "acknowledgement_provenance": "fixture operator accepted app-local fallback",
  "budget_bytes": 4096,
  "budget_source": "fixture_configured"
}
```

## Readback Posture Evidence

Readback through storage setup posture shows:

```json
{
  "storage_authority_mode": "app_local_fallback_acknowledged",
  "selected": false,
  "fallback_acknowledged": true,
  "storage_state": "configured_ready",
  "setup_gate": "ready",
  "dry_run_status": "would_write_valid"
}
```

This proves acknowledged fallback is accepted storage posture while remaining distinct from selected storage.

## Invalidation Evidence

Changing the fallback/app path basis produces:

```json
{
  "status": "invalidated",
  "path_changed": true,
  "storage_authority_mode": "acknowledgement_invalidated",
  "acknowledgement_status": "invalidated",
  "acknowledgement_invalid_reason": "fallback_path_basis_changed",
  "storage_state": "fallback_ack_required",
  "setup_gate": "operator_ack_required",
  "dry_run_status": "fallback_acknowledgement_invalidated"
}
```

## Missing-Budget Evidence

Persisted acknowledgement without budget remains distinct from budget authority:

```json
{
  "status": "budget_required_for_provider_backed_work",
  "provider_backed_write_posture": "blocked_budget_required",
  "provider_backed_config_write_allowed": false,
  "budget_state": "budget_unconfigured",
  "dry_run_would_write": false
}
```

## Renderer Safety Evidence

Verified:

- `storage.authority_config.acknowledgement_persistence_proof` is not renderer eligible.
- Renderer-origin invocation is rejected with `SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE`.
- Renderer payload cannot forge acknowledgement, storage root/path, or budget through this command.
- Renderer payload cannot choose arbitrary config paths or probe filesystem paths through this command.

## Boundary Confirmation

Confirmed:

- fixture/offline proof only
- no real project-root config write
- no broad enforcement
- no runtime storage lockout enforcement
- no provider-backed movement
- no zKill calls
- no ESI calls
- no Evidence/EVEidence writes
- no hydration writes
- no DB movement, copy, migration, relocation, restore, or deletion
- no pruning/deletion execution
- no snapshot creation against real operator paths
- no schema migration
- no renderer redesign or UI presentation/copy finalization

`Test-Path config\storage-authority.json` returned `False` after verification.

## Verification

Passed:

```powershell
node --check src\main\services\storageAuthorityConfigWriteService.js
node --check src\main\services\serviceRegistry.js
node --check scripts\verify-storage-acknowledgement-persistence.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-storage-authority-config-write.js
npm.cmd run verify:storage-acknowledgement-persistence
npm.cmd run verify:storage-authority-config-write
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

`npm.cmd run verify:protected-terms` completed with warning-only discovery output and exit code 0.

`git diff --check` passed with line-ending warnings only. `git status --short --branch` showed the expected HS135 modified/new files on `main...origin/main [ahead 12]`.
