# OverseerHS230 - Real-Local SDE Topology Import Conformance Runway

Status: active Dev runway
Date: 2026-06-03
Project: AURA Atlas
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: workspace/DevHS230-real-local-sde-topology-import-conformance.md

## Background

HS224/HS225 accepted the fixture/offline topology import/rewrite authority proof.

HS226/HS228 accepted the fixture/offline inventory/type import/rewrite authority proof.

HS229 Engineering/Security reviewed the post-proof state and recommended the first real-path implementation seam:

- topology only
- local source only
- implementation conformance to HS224 authority/recovery semantics
- no provider-backed `sde.build-lookups`
- no inventory behavior
- no combined topology + inventory behavior

The important gap: current real topology import behavior writes directly into visible lookup tables by importer flow, while HS224 proved a staged/transactional promotion model. This packet should close that topology gap in the real service/import path under controlled fixture verification before any real operator import is allowed.

## Task

Harden the real-local SDE topology import/rewrite path so it conforms to the accepted HS224 authority and recovery model.

Preferred focus:

- existing `sde.import.topology` / real topology importer path
- `src/main/sde/sdeImporter.js`
- `src/main/services/mutatingActionService.js`

Add a focused verifier, preferably:

```txt
npm.cmd run verify:sde-topology-real-local-conformance
```

## Required Outcomes

The real topology path should prove:

- renderer source paths are not authority for operator mutation
- trusted local source authority is required before mutation
- remote source references are rejected for local topology import
- selected storage and explicit budget are checked before mutation
- projected source/temp/cache/staged/DB/WAL-SHM growth is represented before mutation
- topology rows are staged before promotion
- staged topology completeness is validated before promotion
- promotion is transactional
- provenance is inserted only after complete promotion
- failed import preserves previous visible topology readiness
- failed import does not write success provenance
- staged/temp material cleanup is represented
- retry/rerun is explicit and not automatic
- concurrent topology imports are excluded or explicitly impossible in the verifier scope

## Scope

Allowed:

- real topology import service/importer path hardening
- focused fixture/test DB mutation only
- fixture-safe local topology source material only
- source authority checks inside the service/import path
- storage/budget preflight composition inside the topology service/import path
- staging/shadow-table promotion for topology tables
- focused verifier and package script
- command authority / service registry / passive side-effect verification updates if needed

Preserve:

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
- no schema changes unless returned to Overseer first

## Storage Policy For This Packet

For the first real topology conformance packet, require selected storage posture in the conformance model. Do not treat app-local fallback acknowledgement as sufficient for real topology rewrite unless returned to Overseer/Human.

Strong budget warning policy is not settled. The verifier may prove hard-lock and unconfigured-budget blocks, and may leave strong-warning as a parked policy decision if the existing storage model does not define it clearly enough.

## Stop Conditions

Stop and return to Overseer if this requires:

- schema changes
- inventory import behavior changes
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

If `verify:local-sde-source-posture` races with temp fixture cleanup when run in parallel, rerun it alone and report the ordering constraint.

If command or file names differ, record actual names and why.

## Expected Handoff

Create:

```txt
workspace/DevHS230-real-local-sde-topology-import-conformance.md
```

The handoff should include:

- files changed
- whether existing `sde.import.topology` was hardened in place or a conformance-safe helper/command was added
- source authority behavior
- storage/budget behavior
- staging/promotion/recovery behavior
- verification commands and results
- boundary confirmation
- parked items
- any Human/Overseer decisions still needed
