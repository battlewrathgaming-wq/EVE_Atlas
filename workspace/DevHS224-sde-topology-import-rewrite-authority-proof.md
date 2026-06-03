# DevHS224 - SDE Topology Import Rewrite Authority Proof

Status: Complete, pending Overseer review
Date: 2026-06-03
Executor: Dev

## Scope

Implemented HS224 as a fixture/offline topology import/rewrite authority and recovery proof.

Command added:

```txt
sde.topology_import_rewrite_authority.proof
```

Verifier added:

```txt
npm.cmd run verify:sde-topology-import-rewrite-authority
```

The command is not renderer eligible and requires explicit trusted fixture context before it mutates a disposable fixture DB.

## Files Changed

- `package.json`
- `src/main/services/sdeTopologyImportRewriteAuthorityProofService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-sde-topology-import-rewrite-authority.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-service-registry.js`
- `workspace/current.md`
- `workspace/DevHS224-sde-topology-import-rewrite-authority-proof.md`

## Surface Used

The proof command is classified as:

```txt
classification: metadata-only
effects: local-data-mutation, metadata-readability
renderer_allowed: false
enforcement coverage: fixture_only_non_production
External I/O dependency: none
runtime context: fixture_sde_topology_import_rewrite_authority_proof
```

The proof does not alter the existing real `sde.import.topology`, `sde.import.inventory`, or `sde.build-lookups` execution paths.

## Sample Output Summary

Focused verifier summary:

```json
{
  "status": "SDE topology import/rewrite authority proof verified",
  "command": "sde.topology_import_rewrite_authority.proof"
}
```

Representative proof shape:

```json
{
  "proof_state": "fixture_rewrite_authority_proven",
  "fixture_offline_only": true,
  "trusted_fixture_context_present": true,
  "renderer_payload_ignored": true,
  "provider_calls": 0,
  "sde_downloads": 0,
  "provider_backed_builds": 0,
  "real_operator_source_path_inspections": 0,
  "real_operator_lookup_table_writes": 0,
  "runtime_enforcement_active": false,
  "command_blocking_active": false
}
```

## Authority Cases Proven

- Renderer-supplied source path blocks when it is the only source claim.
- Renderer-supplied source path is ignored when trusted fixture source authority is present.
- Trusted local source authority requires:
  - explicit trusted fixture context
  - `basis: trusted_fixture_context`
  - `fixture_authority: true`
  - supported local source shape
- Remote source references are rejected for local topology import.
- No source path blocks topology import rewrite.
- Source path classification does not inspect the path or probe arbitrary files.

Storage/budget cases proven:

- configured valid storage plus explicit budget allows only fixture rewrite
- missing/unavailable storage blocks topology rewrite
- invalid/degraded storage blocks topology rewrite
- unconfigured budget blocks topology rewrite
- budget hard lock blocks topology rewrite
- projected source/temp/cache/staged/DB/WAL-SHM growth is represented

## Recovery Cases Proven

The fixture proof uses staged temp tables and transactional promotion.

Successful fixture rewrite proves:

- complete staged topology is promoted
- visible topology lookup readiness is true after promotion
- provenance is written only after complete promotion
- no provider-backed build is run

Failed fixture rewrite proves:

- failure before promotion is caught
- previous visible ready topology counts are preserved
- partial staged topology does not become visible ready topology
- failure provenance is not written
- staged temp material cleanup is represented
- retry/rerun posture is explicit and not automatic

## Coherence After Failure

The focused verifier checks before/after visible topology counts for:

- `regions`
- `constellations`
- `solar_systems`
- `system_adjacency`
- `sde_imports`

The failed staged rewrite preserves the previous visible topology and does not add failure provenance.

## Verification

Passed:

```txt
node --check src\main\services\sdeTopologyImportRewriteAuthorityProofService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-sde-topology-import-rewrite-authority.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:sde-topology-import-rewrite-authority
npm.cmd run verify:local-sde-source-posture
npm.cmd run verify:local-sde-readiness
npm.cmd run verify:sde-fixture
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
```

Note: an initial parallel run of `verify:local-sde-source-posture` overlapped with `verify:sde-fixture` and saw a temp SDE fixture directory removed during support-path scanning. The command passed when rerun on its own.

Protected-term warning count after workspace handoff files were added:

```txt
warning count: 470
confirmation: warning-only; no renames performed; no protected-word JSON updates performed
```

Final hygiene passed:

```txt
git diff --check
git status --short --branch
```

## Boundaries Preserved

Confirmed:

- no real SDE download
- no provider-backed `sde.build-lookups`
- no real operator source path inspection
- no real operator lookup-table mutation
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
- no inventory import behavior
- no combined topology + inventory behavior
- no runtime enforcement activation
- no command blocking
- no schema changes

## Risks / Follow-Up

This proves the fixture authority/recovery shape only. It does not select the final real operator source path policy and does not change the real topology importer to staged promotion. A later packet should decide whether the real path uses transactional promotion or shadow/staging tables before real lookup-table mutation opens.
