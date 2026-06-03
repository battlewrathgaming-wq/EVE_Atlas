# OverseerHS232 - Real-Local SDE Inventory Import Conformance Runway

Status: active Dev runway
Date: 2026-06-03
Project: AURA Atlas
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: workspace/DevHS232-real-local-sde-inventory-import-conformance.md

## Background

HS224/HS225 accepted the fixture/offline topology import/rewrite authority proof.

HS226/HS228 accepted the fixture/offline inventory/type import/rewrite authority proof.

HS230/HS231 accepted the first real-local conformance implementation for topology:

- `sde.import.topology` now requires trusted local source authority.
- Renderer source paths are ignored as authority.
- Selected storage and explicit budget are required for the packet.
- Topology rows stage before promotion.
- Promotion is transactional.
- Provenance is written only after complete promotion.
- Failed import preserves previous visible topology/provenance.

The next smallest seam is inventory/type only. It should close the equivalent real-path gap for `sde.import.inventory`, using HS226 authority/recovery semantics as the basis.

## Task

Harden the real-local SDE inventory/type import/rewrite path so it conforms to the accepted HS226 authority and recovery model.

Preferred focus:

- existing `sde.import.inventory` / real inventory importer path
- `src/main/sde/sdeInventoryImporter.js`
- `src/main/services/mutatingActionService.js`

Add a focused verifier, preferably:

```txt
npm.cmd run verify:sde-inventory-real-local-conformance
```

## Required Outcomes

The real inventory path should prove:

- renderer source paths are not authority for operator mutation
- trusted local inventory source authority is required before mutation
- remote source references are rejected for local inventory import
- selected storage and explicit budget are checked before mutation
- projected source/temp/cache/staged/DB/WAL-SHM growth is represented before mutation
- inventory/type rows are staged before promotion
- staged inventory/type completeness is validated before promotion
- promotion is transactional
- provenance is inserted only after complete promotion
- failed import preserves previous visible inventory/type readiness
- failed import does not write success provenance
- staged/temp material cleanup is represented
- retry/rerun is explicit and not automatic
- concurrent inventory imports are excluded or explicitly impossible in the verifier scope

## Scope

Allowed:

- real inventory import service/importer path hardening
- focused fixture/test DB mutation only
- fixture-safe local inventory source material only
- source authority checks inside the service/import path
- storage/budget preflight composition inside the inventory service/import path
- staging/shadow-table promotion for inventory/type tables
- focused verifier and package script
- command authority / service registry / passive side-effect verification updates if needed

Preserve:

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
- no schema changes unless returned to Overseer first

## Storage Policy For This Packet

Use the same policy as HS230:

- require selected storage posture in the conformance model
- require explicit budget
- do not treat app-local fallback acknowledgement as sufficient for real inventory/type rewrite unless returned to Overseer/Human

Strong budget warning policy remains parked. The verifier may prove hard-lock and unconfigured-budget blocks, and may leave strong-warning as a parked policy decision if the existing storage model does not define it clearly enough.

## Stop Conditions

Stop and return to Overseer if this requires:

- schema changes
- topology import behavior changes
- combined topology + inventory behavior
- provider-backed SDE download/build
- real operator source path inspection
- real operator lookup-table mutation in verification
- UI/source picker work
- support artifact creation
- runtime enforcement
- command blocking
- storage movement
- destructive/private/live action

## Verification Expected

Run:

```txt
node --check src\main\sde\sdeInventoryImporter.js
node --check src\main\services\mutatingActionService.js
node --check scripts\verify-sde-inventory-real-local-conformance.js
npm.cmd run verify:sde-inventory-real-local-conformance
npm.cmd run verify:sde-inventory-import-rewrite-authority
npm.cmd run verify:local-sde-source-posture
npm.cmd run verify:local-sde-readiness
npm.cmd run verify:sde-inventory
npm.cmd run verify:sde-topology-real-local-conformance
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

For `verify:sde-inventory`, use fixture-safe local JSONL source if the default cached full SDE path is too slow or inappropriate for this packet. Do not inspect a real operator source path.

If `verify:local-sde-source-posture` races with temp fixture cleanup when run in parallel, rerun it alone and report the ordering constraint.

If command or file names differ, record actual names and why.

## Expected Handoff

Create:

```txt
workspace/DevHS232-real-local-sde-inventory-import-conformance.md
```

The handoff should include:

- files changed
- whether existing `sde.import.inventory` was hardened in place or a conformance-safe helper/command was added
- source authority behavior
- storage/budget behavior
- staging/promotion/recovery behavior
- verification commands and results
- boundary confirmation
- parked items
- any Human/Overseer decisions still needed
