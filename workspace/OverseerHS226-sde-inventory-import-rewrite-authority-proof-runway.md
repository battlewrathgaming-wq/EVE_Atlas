# OverseerHS226 - SDE Inventory Import/Rewrite Authority Proof Runway

Status: active Dev runway
Date: 2026-06-03
Project: AURA Atlas
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: workspace/DevHS226-sde-inventory-import-rewrite-authority-proof.md

## Background

HS222/HS223 accepted that topology and inventory should be separate proof packets before any real operator SDE import/rewrite or provider-backed SDE download/build packet.

HS224/HS225 accepted the topology import/rewrite authority fixture proof:

- renderer source paths are ignored
- trusted fixture local source authority is explicit
- remote source references are rejected for local import
- storage and explicit budget posture block unsafe rewrite
- staged/transactional fixture promotion preserves visible lookup state on failure
- provenance is written only after complete promotion
- retry/rerun is explicit and not automatic

Inventory/type metadata is the other local SDE readiness family. It repairs static type/group/category readability and must remain local SDE support, not provider-backed Hydration and not Evidence/EVEidence.

## Task

Add a fixture/offline proof for inventory/type import/rewrite authority and recovery.

Preferred command:

```txt
sde.inventory_import_rewrite_authority.proof
```

Acceptable alternative:

Add a focused verifier/service helper without renderer command exposure if the existing service architecture makes a command inappropriate. If no command is added, the verifier must still prove the same authority and recovery shape.

## Preferred Outcome

The proof should show:

- renderer source paths are ignored
- trusted local inventory source authority shape is explicit
- remote source references are rejected for local inventory import
- missing source blocks rewrite
- missing/invalid/degraded storage blocks future inventory rewrite
- unconfigured or hard-lock budget blocks future inventory rewrite
- projected source/temp/cache/staged/DB/WAL-SHM growth is represented
- inventory/type staged fixture writes can fail without corrupting visible ready inventory/type lookups
- provenance is written only after complete promotion
- failed staged rewrite preserves previous visible inventory/type lookup counts
- failed staged rewrite does not write failure provenance
- partial temp/staged material cleanup is represented
- retry/rerun posture is explicit and not automatic

## Scope

Allowed:

- fixture/offline service helper or command
- disposable fixture DB mutation only
- service registry metadata for the proof command, if a command is added
- enforcement dry-run, command authority, service registry, passive side-effect, and focused verifier coverage
- fixture-only staged/shadow table logic for `type_metadata`, `sde_inventory_categories`, `sde_inventory_groups`, and `sde_inventory_imports`

Preserve:

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
- no schema changes unless returned to Overseer first

## Stop Conditions

Stop and return to Overseer if proving recovery requires:

- schema changes
- mutating the real operator DB
- inspecting real operator source paths
- starting provider-backed SDE download/build
- changing topology import behavior
- combining topology and inventory import behavior
- UI work
- runtime enforcement
- command blocking
- support artifact creation
- destructive/private/live action
- real operator data inspection

## Verification Expected

Add and run a focused verifier, preferably:

```txt
npm.cmd run verify:sde-inventory-import-rewrite-authority
```

Also run:

```txt
node --check src\main\services\sdeInventoryImportRewriteAuthorityProofService.js
node --check scripts\verify-sde-inventory-import-rewrite-authority.js
npm.cmd run verify:sde-inventory-import-rewrite-authority
npm.cmd run verify:sde-inventory
npm.cmd run verify:local-sde-source-posture
npm.cmd run verify:local-sde-readiness
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If command names or file names differ, name the actual commands and why.

## Expected Handoff

Create:

```txt
workspace/DevHS226-sde-inventory-import-rewrite-authority-proof.md
```

The handoff should include:

- files changed
- command/helper added
- proof cases covered
- verification commands and results
- whether all boundaries were preserved
- any known test-fixture interference or verifier ordering constraints
- parked items for real operator import/rewrite and provider-backed download/build
