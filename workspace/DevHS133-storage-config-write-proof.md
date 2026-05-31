# DevHS133 - Storage Config Write Proof

Status: complete
Date: 2026-05-31
Role: Dev

## Summary

Implemented a bounded fixture/offline storage authority config write proof.

The new proof reuses the HS131 `storage_config_dry_run` payload posture, then writes only when trusted main-process/test context supplies an allowed fixture target. It stages the write through a same-directory temp file, renames it into place, reads it back, and verifies the readback payload matches.

No operator-real storage config was written.

## Files Changed

- `src/main/services/storageAuthorityConfigWriteService.js`
- `src/main/services/serviceRegistry.js`
- `scripts/verify-storage-authority-config-write.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS133-storage-config-write-proof.md`

## Command / Helper Added

Added helper:

```text
buildStorageAuthorityConfigWriteProof
```

Added service command:

```text
storage.authority_config.write_proof
```

Command posture:

- classification: `metadata-only`
- effects: `local-data-mutation`
- renderer eligible: `false`
- enforcement state: `not_implemented_readout_only`

Added verifier:

```powershell
npm.cmd run verify:storage-authority-config-write
```

## Target Path Behavior

The default production target is derived as:

```text
<Atlas app/root>/config/storage-authority.json
```

HS133 does not write that path. Actual writes require:

- trusted main-process/test context
- `allowStorageConfigWriteProof: true`
- `allowStorageConfigWriteFixtureTarget: true`
- fixture target path supplied by context, not renderer payload
- target path inside the trusted allowed fixture root

Unsafe targets outside the allowed fixture root are rejected with:

```text
target_path_outside_allowed_config_root
```

## Atomic / Staged Write Behavior

The proof writes JSON to a same-directory temp path:

```text
.<filename>.<pid>.tmp
```

Then it renames the temp file to the target path and confirms:

- write status: `written_atomically`
- temp file no longer exists after rename
- readback status: `read_back_verified`
- readback payload matches normalized payload

## Sample Write / Readback Output

Compact output from `npm.cmd run verify:storage-authority-config-write`:

```json
{
  "sample_selected_storage": {
    "would_write": true,
    "target_path_basis": "trusted_fixture_context_target",
    "path_allowed": true,
    "validation_status": "write_proof_valid",
    "issues": [],
    "write_status": "written_atomically",
    "readback_status": "read_back_verified",
    "readback_matches_payload": true,
    "enforcement_state": "not_implemented_readout_only"
  },
  "sample_acknowledged_fallback": {
    "would_write": true,
    "validation_status": "write_proof_valid",
    "write_status": "written_atomically",
    "readback_status": "read_back_verified",
    "readback_matches_payload": true
  },
  "sample_blocked_states": {
    "acknowledgement_invalidated": {
      "would_write": false,
      "validation_status": "fallback_acknowledgement_invalidated"
    },
    "budget_missing_provider_backed": {
      "would_write": false,
      "validation_status": "budget_required_for_provider_backed_work"
    }
  },
  "sample_unsafe_path": {
    "would_write": false,
    "path_allowed": false,
    "validation_status": "target_path_outside_allowed_config_root"
  },
  "real_project_config_exists": false
}
```

## Renderer Safety Evidence

Verified:

- `storage.authority_config.write_proof` is not renderer eligible.
- Renderer-origin invocation is rejected with `SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE`.
- Renderer payload cannot choose arbitrary config paths through the write proof command.
- Renderer payload cannot forge storage root/DB path, fallback acknowledgement, or budget through the write proof command.
- Renderer payload cannot probe filesystem paths through the write proof command.

## Boundary Confirmation

Confirmed:

- fixture/offline proof only
- no real project-root config write
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
node --check scripts\verify-storage-authority-config-write.js
npm.cmd run verify:storage-authority-config-write
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
Test-Path config\storage-authority.json
git diff --check
git status --short --branch
```

`npm.cmd run verify:protected-terms` completed with warning-only discovery output and exit code 0.

One parallel verification attempt reproduced the known shared temp-fixture race between storage verifiers; `npm.cmd run verify:service-registry` passed when rerun standalone.

`git diff --check` passed with line-ending warnings only. `git status --short --branch` showed the expected HS133 modified/new files on `main...origin/main [ahead 10]`.
