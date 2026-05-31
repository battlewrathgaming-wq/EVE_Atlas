# DevHS137 - Enforcement Dry-Run Command-Effect Map

Status: complete
Date: 2026-05-31
Role: Dev

## Summary

Implemented a read-only enforcement dry-run command/effect map.

This is not runtime enforcement. The new readout projects `would_allow`, `would_block`, and `conditional` outcomes from existing service command metadata plus `storage.setup_gate_readout.action_class_matrix`. It does not intercept or block commands.

## Files Changed

- `src/main/services/enforcementDryRunService.js`
- `src/main/services/serviceRegistry.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS137-enforcement-dry-run-command-effect.md`

## Command / Helper Added

Added service command:

```text
storage.enforcement_dry_run.command_effect_map
```

Command posture:

- classification: `read-only`
- effects: `read-only`
- renderer eligible: `true`
- enforcement active: `false`
- enforcement state: `not_implemented_readout_only`

Added verifier:

```powershell
npm.cmd run verify:enforcement-dry-run
```

## Sample Dry-Run Output

Compact verifier samples:

```json
{
  "configured_storage_ready": {
    "local_status": "would_allow",
    "local_report": "would_allow",
    "provider_discovery": "would_allow",
    "esi_expansion": "would_allow",
    "hydration": "would_allow",
    "snapshot_support": "conditional",
    "pruning_execution": "conditional",
    "enforcement_active": false
  },
  "app_local_fallback_acknowledged": {
    "storage_state": "configured_storage_ready",
    "selected": false,
    "fallback_acknowledged": true,
    "provider_discovery": "would_allow",
    "esi_expansion": "would_allow"
  },
  "acknowledgement_invalidated": {
    "provider_discovery": "would_block",
    "esi_expansion": "would_block",
    "hydration": "would_block",
    "snapshot_support": "would_block"
  },
  "configured_storage_missing_unavailable": {
    "local_status": "conditional",
    "local_report": "conditional",
    "provider_discovery": "would_block",
    "esi_expansion": "would_block",
    "pruning_execution": "would_block"
  },
  "budget_hard_lock_full": {
    "local_status": "would_allow",
    "local_report": "would_allow",
    "provider_discovery": "would_block",
    "esi_expansion": "would_block",
    "hydration": "would_block",
    "snapshot_support": "would_block"
  }
}
```

## Allowed / Blocked / Conditional Examples

- Local status/read paths such as `app.readiness`, `storage.authority_preflight`, `storage.setup_gate_readout`, `watch.list`, and local reports remain `would_allow` or safe `conditional` depending on storage availability.
- Provider-backed acquisition and ESI expansion map from `manual.discovery` and `manual.expansion`.
- Hydration writes map from `metadata.hydration`.
- Snapshot/support artifact writes map from `runtime.db_snapshot.create` and `support.debug_trace_pack`.
- Destructive pruning/deletion execution is represented through the `pruning_deletion_execution` effect class and remains future-runway/blocked according to storage state.

## Reason Codes

The readout emits reason codes including:

- `safe_local_or_read_only_path`
- `provider_movement_required`
- `would_block_if_enforced_later`
- `conditional_if_enforced_later`
- `fallback_acknowledged_distinct_from_selected_storage`
- `fallback_acknowledgement_invalidated`
- `storage_missing_unavailable`
- `storage_invalid_degraded`
- `budget_hard_lock_blocks_writes_provider_movement`
- `hold:<matrix block/hold reason>`
- `write_posture:<matrix write posture>`
- `storage_state:<matrix storage state>`
- `budget_state:<budget state>`
- `command:<representative command>`

## Enforcement Inactive Proof

Verified:

- readout `read_only: true`
- readout `mutates_state: false`
- readout `enforcement_active: false`
- readout `enforcement_state: not_implemented_readout_only`
- every command/effect entry reports `enforcement_active: false`
- no runtime command interception or actual command blocking was added

## Boundary Confirmation

Confirmed:

- read-only dry-run proof only
- no runtime command interception
- no real storage lockout enforcement
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
- app-local/current-file fallback remains distinct from selected storage

`Test-Path config\storage-authority.json` returned `False` after verification.

## Verification

Passed:

```powershell
node --check src\main\services\enforcementDryRunService.js
node --check src\main\services\serviceRegistry.js
node --check scripts\verify-enforcement-dry-run.js
node --check scripts\verify-passive-side-effects.js
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:storage-acknowledgement-persistence
npm.cmd run verify:storage-authority-config-write
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
Test-Path config\storage-authority.json
```

`npm.cmd run verify:protected-terms` completed with warning-only discovery output and exit code 0.

Final checks to run after this handoff write:

```powershell
git diff --check
git status --short --branch
```
