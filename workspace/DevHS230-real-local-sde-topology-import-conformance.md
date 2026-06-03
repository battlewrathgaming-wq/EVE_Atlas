# DevHS230 - Real-Local SDE Topology Import Conformance

Status: complete
Date: 2026-06-03
Role: Dev
Milestone: Atlas Storage And Runtime Hardening

## Summary

Hardened the real-local `sde.import.topology` path to conform to the accepted HS224 authority and recovery model.

The existing real topology importer was hardened in place. The service command now requires trusted local source authority plus selected valid storage and explicit budget before mutation. The importer now stages topology rows into temp tables, validates completeness, promotes in one transaction, and writes provenance only after complete promotion.

## Files Changed

- `package.json`
- `scripts/verify-sde-fixture.js`
- `scripts/verify-sde-topology-real-local-conformance.js`
- `src/main/sde/sdeImporter.js`
- `src/main/services/mutatingActionService.js`
- `src/main/services/serviceRegistry.js`
- `workspace/current.md`
- `workspace/DevHS230-real-local-sde-topology-import-conformance.md`

## Existing Path Hardened

Hardened in place:

```txt
sde.import.topology
src/main/sde/sdeImporter.js
src/main/services/mutatingActionService.js
```

No new renderer command was added. `sde.import.topology` remains non-renderer and `exclusive`.

## Source Authority

The service path now requires trusted local source authority from trusted context before mutation.

Covered behavior:

- renderer/payload source paths are ignored as mutation authority
- renderer-only source claims block with `renderer_source_path_non_authoritative`
- trusted local source authority is required before import
- remote source references block with `remote_source_rejected_for_local_topology_import`
- accepted trusted source basis is explicit
- no provider-backed SDE download path is opened

## Storage And Budget

Before mutation, the service composes storage setup posture and projected topology growth.

Covered behavior:

- selected storage is required for real topology rewrite
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

- creates temp staging tables for regions, constellations, solar systems, and adjacency
- reads source rows into staging/scratch material first
- validates staged topology completeness before promotion
- deletes and rewrites visible topology tables only inside a transaction
- inserts `sde_imports` provenance only after complete promotion
- drops staged temp tables in cleanup
- attaches cleanup posture to failure errors

The focused verifier proves:

- failure after stage but before promotion preserves previous visible topology and provenance
- failure after promotion but before provenance rolls back visible topology and provenance
- failed imports do not write success provenance
- staged temp material is cleaned up
- retry/rerun is explicit and not automatic
- concurrent service topology imports are excluded by the service path

## Sample Output

Focused verifier:

```json
{
  "status": "SDE topology real-local conformance verified",
  "command": "sde.import.topology"
}
```

Representative successful service result fields:

```json
{
  "systems": 4,
  "constellations": 1,
  "regions": 1,
  "adjacency": 8,
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
node --check src\main\sde\sdeImporter.js
node --check src\main\services\mutatingActionService.js
node --check scripts\verify-sde-topology-real-local-conformance.js
npm.cmd run verify:sde-topology-real-local-conformance
npm.cmd run verify:sde-topology-import-rewrite-authority
npm.cmd run verify:local-sde-source-posture
npm.cmd run verify:local-sde-readiness
npm.cmd run verify:sde-fixture
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

`verify:protected-terms` passed warning-only with 292 warnings across 7 changed working-set files; no renames or protected-word JSON updates were performed.

`git diff --check` passed with CRLF normalization warnings only.

## Boundary Confirmation

Confirmed:

- no inventory import behavior changes
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

- inventory import conformance
- combined topology + inventory orchestration
- provider-backed `sde.build-lookups`
- SDE download
- real operator source picker/UI
- support artifact creation around SDE failures
- active runtime enforcement or command blocking
- strong-warning budget policy for real SDE rewrite
