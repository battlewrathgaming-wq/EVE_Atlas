# DevHS105 - Storage Authority Preflight

Date: 2026-05-27
Role: Atlas Dev
Status: Complete

## Summary

Implemented a read-only storage authority preflight service:

- Service command: `storage.authority_preflight`
- Classification: `read-only`
- Renderer eligible: yes
- Writes: none

The preflight reports current DB/storage/support-artifact posture before any lockout, migration, pruning, or storage authority policy is implemented.

## Files Changed

- `src/main/services/storageAuthorityPreflightService.js`
- `src/main/services/serviceRegistry.js`
- `scripts/verify-storage-authority-preflight.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-passive-side-effects.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS105-storage-authority-preflight.md`

## Service Added

`storage.authority_preflight` reports:

- DB path, source, primary mode, and mode flags
- DB parent path, DB existence, DB byte size, WAL/SHM existence and byte size
- snapshot settings path, existence, validation, destination status, and destination bytes
- trace-pack default/configured output path, status, and bytes
- temp/cache/SDE paths, posture tags, existence, and bytes
- window/settings path when exposed by existing helper paths
- known Atlas-controlled byte usage where practical

## Sample Preflight Output

Focused fixture verification printed:

```json
{
  "status": "storage authority preflight verified",
  "path_modes": {
    "configured": "configured",
    "fallback": "fallback",
    "missing": "missing"
  },
  "sample_byte_usage": {
    "configured_database_bytes": 25,
    "support_known_controlled_locations_bytes": 265,
    "trace_pack_usage_bytes": 11,
    "snapshot_destination_usage_bytes": 14
  },
  "sample_paths": {
    "database_path": "F:\\Projects\\AURA-Atlas\\.tmp\\storage-authority-preflight-fixture\\configured\\atlas-configured.sqlite",
    "snapshot_settings_path": "F:\\Projects\\AURA-Atlas\\.tmp\\storage-authority-preflight-fixture\\support-fixture\\snapshot-settings.json",
    "trace_pack_output_path": "F:\\Projects\\AURA-Atlas\\.tmp\\storage-authority-preflight-fixture\\support-fixture\\trace-packs",
    "sde_cache_dir": "F:\\Projects\\AURA-Atlas\\.tmp\\storage-authority-preflight-fixture\\support-fixture\\tmp\\sde"
  },
  "boundary": [
    "Read-only inventory only; it does not write storage config.",
    "It does not move, copy, relocate, create, or delete the active DB.",
    "It does not enforce lockout, prune, call live providers, change schema, redesign renderer UI, or perform storage migration."
  ]
}
```

## Path Modes Demonstrated

- Configured path: `database.mode=configured`
- Fallback path: `database.mode=fallback`
- Missing path: `database.mode=missing`
- Demo/fixture and outside-policy posture are exposed as mode flags when determinable.

## Byte Usage Demonstrated

- DB + WAL + SHM total bytes
- snapshot destination bytes
- trace-pack output bytes
- temp/cache/SDE controlled-location bytes
- aggregate known controlled-location bytes

## Boundary Confirmation

- No storage config was written.
- No real active DB was moved, copied, deleted, created, relocated, or migrated.
- No lockout, pruning, live/API/provider behavior, schema migration, renderer redesign, or storage migration behavior was added.
- No provider, Watch, Sequencer, Discovery refs, Evidence/EVEidence, hydration, or Assessment Memory behavior was changed.

## Verification

- `git pull` - passed, already up to date.
- `npm.cmd run verify:storage-authority-preflight` - passed.
- `npm.cmd run verify:app-readiness` - passed.
- `npm.cmd run verify:runtime-snapshot` - passed.
- `npm.cmd run verify:operator-debug-trace` - passed.
- `npm.cmd run verify:sde-build-lookups` - passed.
- `npm.cmd run verify:sde-fixture` - passed.
- `npm.cmd run verify:service-registry` - passed.
- `npm.cmd run verify:command-authority` - passed.
- `npm.cmd run verify:task-concurrency` - passed.
- `npm.cmd run verify:db-integrity` - passed.
- `npm.cmd run verify:protected-terms` - passed with exit code 0, warning-only; 6 files scanned, 448 warnings.
- `git diff --check` - passed with LF-to-CRLF working-copy warnings only.
- `git status --short --branch` - reported expected HS105 changes on `main...origin/main`.

Electron startup and renderer readiness were not touched, so the optional Electron/renderer smoke set was not run.

## Recommended Next Action

Overseer review should confirm whether this preflight shape is sufficient before opening any storage authority policy, lockout, or operator setup packet.
