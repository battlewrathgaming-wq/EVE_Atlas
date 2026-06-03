# DevHS226 - SDE Inventory Import/Rewrite Authority Proof

Status: complete
Date: 2026-06-03
Role: Dev
Milestone: Atlas Storage And Runtime Hardening

## Summary

Implemented a fixture/offline proof for future SDE inventory/type import and rewrite authority.

Added the non-renderer service command:

```txt
sde.inventory_import_rewrite_authority.proof
```

The proof stays fixture-only. It does not inspect real operator source paths, mutate real operator lookup tables, download SDE data, call providers, create support artifacts, activate enforcement, block commands, change schema files, or touch renderer UI.

## Files Changed

- `package.json`
- `scripts/verify-command-authority.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-sde-inventory-import-rewrite-authority.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/services/sdeInventoryImportRewriteAuthorityProofService.js`
- `src/main/services/serviceRegistry.js`
- `workspace/current.md`
- `workspace/DevHS226-sde-inventory-import-rewrite-authority-proof.md`

## Command And Classification

Command added:

```txt
sde.inventory_import_rewrite_authority.proof
```

Classification:

- service registry classification: `metadata-only`
- effects: `local-data-mutation`, `metadata-readability`
- renderer eligible: false
- enforcement status: `fixture_only_non_production`
- External I/O dependency: `none`
- runtime context: `fixture_sde_inventory_import_rewrite_authority_proof`

The local-data mutation is limited to disposable fixture DB state behind explicit trusted fixture context.

## Proof Cases Covered

Source authority:

- renderer-supplied source paths are ignored and treated as non-authoritative
- trusted local inventory source authority must come from explicit fixture context
- remote source references are rejected for local inventory import
- missing source blocks fixture rewrite
- source shape classification does not inspect arbitrary real paths

Storage and budget authority:

- configured ready storage plus sufficient budget allows fixture rewrite
- missing/unavailable storage blocks future inventory rewrite
- invalid/degraded storage blocks future inventory rewrite
- unconfigured budget blocks future inventory rewrite
- hard-lock budget blocks future inventory rewrite
- projected source/temp/cache/staged/DB/WAL-SHM growth is represented

Rewrite and recovery:

- fixture inventory/type rows are staged before promotion
- successful rewrite promotes complete staged inventory/type data
- provenance is written only after complete promotion
- interrupted staged rewrite is caught before promotion
- failed staged rewrite preserves previous visible inventory/type counts
- failed staged rewrite does not write failure provenance
- temp staged material cleanup is represented
- retry/rerun posture is explicit and not automatic

Preserved semantics:

- inventory/type metadata remains local SDE readability support
- no Evidence/EVEidence writes
- no Hydration writes
- no Discovery ref mutation
- no Watch mutation
- no Assessment Memory or Marked mutation
- no topology import behavior changes
- no combined topology + inventory behavior

## Sample Proof Output

Focused verifier result:

```json
{
  "status": "SDE inventory import/rewrite authority proof verified",
  "command": "sde.inventory_import_rewrite_authority.proof"
}
```

Representative proof fields:

```json
{
  "proof_state": "fixture_rewrite_authority_proven",
  "fixture_offline_only": true,
  "provider_calls": 0,
  "sde_downloads": 0,
  "provider_backed_builds": 0,
  "real_operator_source_path_inspections": 0,
  "real_operator_lookup_table_writes": 0,
  "runtime_enforcement_active": false,
  "command_blocking_active": false,
  "source_authority": {
    "renderer_source_path_used": false
  },
  "rewrite_result": {
    "status": "fixture_inventory_rewrite_promoted",
    "visible_inventory_ready": true,
    "provenance_written_after_complete_promotion": true
  },
  "failure_result": {
    "status": "fixture_failure_caught",
    "previous_visible_inventory_preserved": true,
    "failure_provenance_written": false
  },
  "recovery_model": {
    "automatic_retry": false,
    "retry_rerun_posture": "explicit_operator_or_test_rerun_required"
  }
}
```

## Verification

Passed:

```txt
node --check src\main\services\sdeInventoryImportRewriteAuthorityProofService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-sde-inventory-import-rewrite-authority.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:sde-inventory-import-rewrite-authority
npm.cmd run verify:local-sde-readiness
npm.cmd run verify:local-sde-source-posture
npm.cmd run verify:sde-inventory
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
```

`npm.cmd run verify:sde-inventory` note:

- Plain runs attempted against the cached full SDE zip timed out at 120s and 300s.
- The required verifier was then run with a fixture-safe local JSONL source:

```txt
$env:AURA_ATLAS_LIVE_SDE_JSONL_PATH='F:\Projects\AURA-Atlas\.tmp\hs226-inventory-jsonl'; npm.cmd run verify:sde-inventory
```

Result:

```json
{
  "status": "sde inventory verified",
  "first_import": {
    "categories": 2,
    "groups": 2,
    "types": 3,
    "typeMetadata": 2
  },
  "second_import": {
    "categories": 2,
    "groups": 2,
    "types": 3,
    "typeMetadata": 2
  },
  "sample": {
    "type_id": 587,
    "type_name": "Rifter",
    "group_name": "Frigate",
    "category_name": "Ship"
  },
  "type_metadata_count": 2
}
```

Final hygiene:

```txt
git diff --check
git status --short --branch
```

Results are recorded in `workspace/current.md`.

## Boundary Confirmation

Confirmed:

- no SDE download
- no provider-backed `sde.build-lookups`
- no real operator source path inspection
- no real operator lookup-table mutation
- no topology import behavior changes
- no combined topology + inventory behavior
- no storage movement
- no real operator config write
- no support artifact creation
- no provider calls
- no Hydration writes
- no Evidence/EVEidence writes
- no Discovery ref mutation
- no Watch mutation
- no Assessment Memory or Marked mutation
- no renderer UI work
- no pruning/deletion behavior
- no runtime enforcement activation
- no command blocking
- no schema file changes

## Known Constraints

- `verify:sde-inventory` can select the cached full SDE zip and run longer than the fixture/offline HS226 lane needs. The fixture-safe environment override passed and is the appropriate verification evidence for this packet.
- `verify:local-sde-source-posture` should be run alone, not in parallel with SDE fixture verifiers that create/remove temporary SDE fixture directories.

## Parked Items

- real operator SDE inventory import/rewrite
- real operator source path selection/inspection
- provider-backed SDE download/build
- combined topology + inventory import
- active runtime enforcement or command blocking
- renderer UI/source picker
- support artifact creation around SDE import failures
