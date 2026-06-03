# DevHS232 - Real-Local SDE Inventory Import Conformance

Status: complete
Date: 2026-06-03
Role: Dev
Milestone: Atlas Storage And Runtime Hardening

## Summary

Hardened the real-local `sde.import.inventory` path to conform to the accepted HS226 authority and recovery model.

The existing real inventory importer was hardened in place. The service command now requires trusted local inventory source authority plus selected valid storage and explicit budget before mutation. The importer now stages category, group, and type metadata rows into temp tables, validates staged completeness, promotes in one transaction, and writes provenance only after complete promotion.

## Files Changed

- `package.json`
- `scripts/verify-sde-inventory-real-local-conformance.js`
- `src/main/sde/sdeInventoryImporter.js`
- `src/main/services/mutatingActionService.js`
- `src/main/services/serviceRegistry.js`
- `workspace/current.md`
- `workspace/DevHS232-real-local-sde-inventory-import-conformance.md`

## Existing Path Hardened

Hardened in place:

```txt
sde.import.inventory
src/main/sde/sdeInventoryImporter.js
src/main/services/mutatingActionService.js
```

No new renderer command was added. `sde.import.inventory` remains non-renderer and `exclusive`.

## Source Authority

The service path now requires trusted local inventory source authority from trusted context before mutation.

Covered behavior:

- renderer/payload source paths are ignored as mutation authority
- renderer-only source claims block with `renderer_source_path_non_authoritative`
- trusted local inventory source authority is required before import
- remote source references block with `remote_source_rejected_for_local_inventory_import`
- accepted trusted source basis is explicit
- no provider-backed SDE download path is opened

## Storage And Budget

Before mutation, the service composes storage setup posture and projected inventory growth.

Covered behavior:

- selected storage is required for real inventory/type rewrite
- app-local fallback acknowledgement is not sufficient in this packet
- missing/unavailable storage blocks
- invalid/degraded storage blocks
- unconfigured budget blocks
- hard-lock budget blocks
- projected source/temp/cache/staged/DB/WAL-SHM growth is represented before mutation
- projected growth exceeding available budget blocks

Strong-warning policy remains parked as a policy decision.

## Staging, Promotion, And Recovery

The importer now:

- creates temp staging tables for inventory categories, groups, and type metadata
- reads source rows into staging first
- resolves type/group/category labels from staged category/group rows
- validates staged inventory/type completeness before promotion
- deletes and rewrites visible inventory/type tables only inside a transaction
- inserts `sde_inventory_imports` provenance only after complete promotion
- drops staged temp tables in cleanup
- attaches cleanup posture to failure errors

The focused verifier proves:

- failure after stage but before promotion preserves previous visible inventory/type rows and provenance
- failure after promotion but before provenance rolls back visible inventory/type rows and provenance
- failed imports do not write success provenance
- staged temp material is cleaned up
- retry/rerun is explicit and not automatic
- concurrent service inventory imports are excluded by the service path

## Sample Output

Focused verifier:

```json
{
  "status": "SDE inventory real-local conformance verified",
  "command": "sde.import.inventory"
}
```

Representative successful service result fields:

```json
{
  "categories": 2,
  "groups": 2,
  "types": 3,
  "typeMetadata": 2,
  "staged": true,
  "promotion": {
    "transactional": true,
    "provenance_written_after_complete_promotion": true,
    "staged_completeness_validated": true
  },
  "provider_calls": 0,
  "sde_downloads": 0,
  "provider_backed_builds": 0,
  "renderer_source_path_used": false
}
```

## Verification

Passed:

```txt
node --check src\main\sde\sdeInventoryImporter.js
node --check src\main\services\mutatingActionService.js
node --check scripts\verify-sde-inventory-real-local-conformance.js
npm.cmd run verify:sde-inventory-real-local-conformance
npm.cmd run verify:sde-inventory-import-rewrite-authority
npm.cmd run verify:local-sde-source-posture
npm.cmd run verify:local-sde-readiness
$env:AURA_ATLAS_LIVE_SDE_JSONL_PATH='F:\Projects\AURA-Atlas\.tmp\hs232-inventory-jsonl'; npm.cmd run verify:sde-inventory
npm.cmd run verify:sde-topology-real-local-conformance
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

`verify:sde-inventory` was run with fixture-safe local JSONL source under `.tmp` to avoid the cached full SDE path.

`verify:protected-terms` passed warning-only with 294 warnings across 6 changed working-set files; no renames or protected-word JSON updates were performed.

`git diff --check` passed with CRLF normalization warnings only.

## Boundary Confirmation

Confirmed:

- no topology import behavior changes
- no combined topology + inventory orchestration
- no provider-backed `sde.build-lookups`
- no SDE download
- no real operator source path inspection in verification
- no real operator lookup-table mutation in verification
- no storage movement
- no real operator config write
- no support artifact creation
- no provider calls
- no Hydration writes
- no Evidence/EVEidence writes
- no Discovery ref mutation
- no Watch mutation
- no Assessment Memory or Marked mutation
- no renderer UI/source picker work
- no pruning/deletion behavior
- no runtime enforcement activation
- no command blocking
- no schema changes

## Parked Items

- combined topology + inventory orchestration
- provider-backed `sde.build-lookups`
- SDE download
- real operator source picker/UI
- support artifact creation around SDE failures
- active runtime enforcement or command blocking
- strong-warning budget policy for real SDE rewrite
