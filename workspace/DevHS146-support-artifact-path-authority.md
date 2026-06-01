# DevHS146 - Support Artifact Path Authority

Status: complete
Role: Dev
Date: 2026-06-01

## Summary

Implemented a bounded read-only support-artifact path authority inventory.

Added:

- `support.artifact_path_authority.preview`

The preview describes support artifact classes, path basis, storage/budget posture, External I/O relevance, renderer/trusted-context posture, cleanup stage, sensitivity, and read-only/non-mutating guarantees without creating, deleting, moving, restoring, packaging, uploading, or probing renderer-provided arbitrary paths.

## Files Changed

- `package.json`
- `src/main/services/supportArtifactPathAuthorityService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-support-artifact-path-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-passive-side-effects.js`
- `workspace/current.md`
- `workspace/DevHS146-support-artifact-path-authority.md`

## Command Added

```text
support.artifact_path_authority.preview
```

Registry posture:

- classification: `read-only`
- effects: `read-only`
- renderer eligible: yes, because renderer path claims are ignored and not used as filesystem authority
- enforcement coverage: `local_db_inspection`, no External I/O dependency, `covered_read_only`

## Inventory Shape

The preview currently reports 10 representative classes:

- `runtime_snapshot_rolling`
- `runtime_snapshot_retained`
- `operator_debug_trace_pack`
- `light_operational_logs`
- `readiness_preflight_reports`
- `runtime_temp_cache`
- `provider_activity_cache`
- `sde_source_import_material`
- `sde_derived_lookup_material`
- `fixture_config_write_proofs`

Each class includes:

- artifact class/name
- family: `operational_support` or `corpus_adjacent_support`
- path basis and current/candidate path where backend-known
- pre-storage allowance
- storage authority requirement
- storage/corpus budget inclusion
- local-only or provider-capable posture
- External I/O relevance
- renderer safety / trusted-context requirement
- cleanup stage
- privacy/sensitivity posture
- snapshot posture where relevant
- read-only/non-mutating flags

## Sample Output

Focused verifier sample:

```json
{
  "status": "support artifact path authority verified",
  "command": "support.artifact_path_authority.preview",
  "renderer_payload_ignored": true,
  "class_count": 10,
  "families": {
    "corpus_adjacent_support": 4,
    "operational_support": 6
  },
  "cleanup_stages": {
    "recovery_cleanup": 6,
    "ordinary_cleanup": 3,
    "fixture_only": 1
  },
  "storage_budget_included": [
    "runtime_snapshot_rolling",
    "runtime_snapshot_retained",
    "operator_debug_trace_pack",
    "provider_activity_cache",
    "sde_derived_lookup_material"
  ],
  "provider_capable": [
    "provider_activity_cache",
    "sde_source_import_material"
  ]
}
```

Cache origin sample:

```json
[
  {
    "id": "runtime_temp_cache",
    "cache_origin": "operational_runtime",
    "family": "operational_support",
    "counts_against_storage_budget": false
  },
  {
    "id": "provider_activity_cache",
    "cache_origin": "provider_activity_derived",
    "family": "corpus_adjacent_support",
    "counts_against_storage_budget": true
  },
  {
    "id": "sde_source_import_material",
    "cache_origin": "sde_source_import",
    "family": "operational_support",
    "counts_against_storage_budget": "disclose_separately"
  },
  {
    "id": "sde_derived_lookup_material",
    "cache_origin": "sde_derived_db_lookup",
    "family": "operational_support",
    "counts_against_storage_budget": true
  }
]
```

Snapshot posture sample:

```json
[
  {
    "id": "runtime_snapshot_rolling",
    "snapshot_posture": "rolling_or_overwritten_recovery_copy",
    "cleanup_stage": "recovery_cleanup",
    "counts_against_storage_budget": true
  },
  {
    "id": "runtime_snapshot_retained",
    "snapshot_posture": "retained_recovery_copy",
    "cleanup_stage": "recovery_cleanup",
    "counts_against_storage_budget": true
  }
]
```

## Side-Effect Proof

`verify:support-artifact-path-authority` proves:

- renderer-forged path payload keys are ignored
- forged renderer paths are not echoed into the preview as authority
- preview does not create the monitored fixture temp root
- preview does not create files or directories
- preview does not mutate checked DB table counts
- preview reports `provider_calls: 0`
- preview reports `storage_config_written: false`
- preview reports `enforcement_active: false`

## Boundary Confirmation

No support artifact creation was added.

No snapshot creation was added.

No trace-pack creation was added.

No cleanup, delete, prune, restore, move, copy, migration, upload, or packaging behavior was added.

No provider calls, zKill calls, ESI calls, or SDE download calls were added.

No storage config write, persisted acknowledgement, lockout enforcement, runtime interception, schema change, renderer redesign, Evidence/EVEidence write, Discovery ref mutation, Hydration write, Observation write, or Assessment Memory behavior change was added.

## Verification

```powershell
node --check src\main\services\supportArtifactPathAuthorityService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-support-artifact-path-authority.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:hydration
npm.cmd run verify:metadata-status
npm.cmd run verify:metadata-lookup
npm.cmd run verify:actor-metadata
npm.cmd run verify:corporation-metadata
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- all `node --check` commands passed
- all listed `npm.cmd run verify:*` commands passed
- `verify:protected-terms` completed with warning-only discovery output and exit code 0
- `git diff --check` passed with line-ending warnings only
- `git status --short --branch` showed `main...origin/main [ahead 23]` plus the HS146 working-tree changes
