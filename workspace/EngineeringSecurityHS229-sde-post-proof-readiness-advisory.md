# Engineering Security HS229 - SDE Post-Proof Readiness Advisory

Status: advisory complete
Date: 2026-06-03
Milestone: Atlas Storage And Runtime Hardening
Role: Engineering / Security
Topic: SDE post-proof readiness before real operator import/rewrite

## Executive Recommendation

Atlas is ready to consider a bounded Dev runway for the first real operator local SDE import/rewrite implementation, but only as a topology-only conformance runway that makes the real path match the accepted HS224 recovery and authority model.

Atlas is not ready to run real operator SDE import/rewrite as-is. The existing real importers still write directly into visible lookup tables by upsert flow, while HS224 and HS226 proved a staged/transactional promotion model. That mismatch must be closed before any real operator lookup-table mutation is allowed.

No additional fixture/offline authority proof is needed before the first topology-only real-local implementation runway. The missing work is implementation conformance and focused verification, not another abstract proof.

## Real Operator Local SDE Import / Rewrite Readiness

Decision: ready to open a narrow topology-only Dev implementation runway; not ready to execute real import yet.

The accepted proofs are sufficient authority/recovery evidence for opening the next bounded implementation seam because both topology and inventory now prove:

- renderer source paths are ignored
- trusted local source authority shape is explicit
- remote source references are rejected for local import
- missing source blocks rewrite
- invalid storage and unsafe budget states block rewrite
- projected source/temp/cache/staged/DB/WAL-SHM growth is represented
- successful staged promotion writes provenance only after complete success
- failed staged rewrite preserves previous visible lookup counts
- failed staged rewrite does not write failure provenance
- cleanup and explicit retry/rerun posture are represented

But the real `SdeTopologyImporter` and `SdeInventoryImporter` do not yet implement that model. The first real Dev runway must therefore adapt one real family, not combine families or enable existing raw scripts as operator authority.

## Smallest Missing Proof

No further pre-implementation proof is required if the next packet is topology-only and implementation-conformance focused.

The smallest missing evidence before execution is a new real-path verifier proving that the real topology import path now uses the accepted authority, storage/budget, staged promotion, provenance, cleanup, and failure-preservation model against a controlled project-local fixture DB. That verifier may mutate fixture/test DB state only; it must not inspect real operator source paths or mutate the operator DB.

## Smallest Safe Dev Runway

Recommended smallest runway:

```txt
HS230 - real-local SDE topology import/rewrite conformance
```

Scope:

- topology only
- local source only
- no provider-backed `sde.build-lookups`
- no inventory behavior
- no combined topology+inventory orchestration
- no renderer UI/source picker
- no support artifact creation
- no runtime enforcement or command blocking
- no schema changes unless returned to Overseer first

Expected outcome:

- real topology import service path uses trusted operator/local source authority, not renderer payloads
- storage authority and explicit budget are checked before mutation
- projected growth is represented before mutation
- topology rows are staged and promoted transactionally
- provenance is inserted only after complete promotion
- failed import preserves previous visible topology readiness
- retry/rerun is explicit and not automatic

Inventory should follow only after topology real-local behavior is accepted.

## Required Source Path Authority

Before any real local import, Atlas needs source path authority with these properties:

- trusted main-process/operator authority only
- renderer-supplied source paths ignored for authority
- local SDE JSONL zip or directory only
- remote URL rejected for local import
- canonical resolved path, with path sensitivity in outputs
- explicit source/cache ownership: Atlas storage/cache authority or accepted operator-selected external read-only source
- no recursive arbitrary user-file probing beyond the selected source shape
- source path distinct from DB path, storage root, support artifact destinations, and temp/cache output

Environment-variable-only source selection is acceptable for developer/verifier scripts, but not as product authority for real operator mutation.

## Required Storage / Budget Authority

Recommendation: require selected storage for the first real topology rewrite.

An explicitly acknowledged app-local fallback is understandable for Atlas' portable briefcase model, but it should not be the first real SDE lookup mutation unless Human/Overseer explicitly accepts that risk. The first real import is a good place to keep the rule crisp: selected storage, valid storage, explicit budget.

Before rewrite, Atlas should require:

- valid selected storage
- explicit budget configured
- no missing/unavailable/degraded storage
- no budget hard lock
- projected source/temp/cache/staged/DB/WAL-SHM growth within budget
- strong budget warning handled by an explicit policy decision before implementation
- no silent storage movement or surprise DB creation

## Required Recovery Model

The real path should use the HS224/HS226 model:

- stage first
- validate completeness before promotion
- promote transactionally
- write provenance only after promotion succeeds
- preserve previous visible lookup state on failure
- do not write failure provenance as import success
- clean staged/temp material
- require explicit rerun after interruption
- exclude concurrent imports for the same command family

The staged/shadow-table model is preferred over direct upsert refresh for real operator import because it makes failure behavior easier to reason about and review.

## Topology / Inventory Split

Topology and inventory should remain separate.

Recommended order:

1. Real-local topology import/rewrite conformance.
2. Real-local inventory import/rewrite conformance.
3. Combined local source orchestration only after both family-specific real paths are accepted.

Combined topology+inventory behavior should not be the first real packet.

## Provider-Backed Download / Build Disposition

Provider-backed `sde.build-lookups` remains parked.

Even after topology real-local import is ready, download/build should remain separate because it adds:

- External I/O
- remote endpoint policy
- large download/cache behavior
- provider timeout/cancel/error handling
- retention/cleanup policy for downloaded source material
- no-catch-up expectations
- combined topology+inventory rewrite pressure

Local import readiness should not automatically authorize provider-backed download/build.

## Support Artifact Disposition

Support artifact creation around SDE failure should remain parked for the first real topology runway.

The first real topology import should return clear structured failure/progress/provenance posture without creating snapshots, trace packs, logs, packages, or directories beyond controlled temp/staging material. Support artifacts can be reconsidered after the real mutation path is coherent.

## Runtime Enforcement Disposition

Runtime enforcement and command blocking should remain parked.

The first topology implementation should perform its own trusted preflight and validation in the service path. Do not rely on dry-run classification or inactive runtime hook posture as authorization.

## Verification Commands / Evidence Expected

For the next topology-only Dev runway, expected verification should include:

```txt
node --check src\main\sde\sdeImporter.js
node --check src\main\services\mutatingActionService.js
node --check scripts\verify-sde-topology-import-rewrite-authority.js
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

Add a focused real-path fixture verifier, for example:

```txt
npm.cmd run verify:sde-topology-real-local-conformance
```

That verifier should prove the real topology service path now follows HS224 semantics without touching the operator DB or a real operator source path.

Do not run provider-backed `sde.build-lookups`, real SDE download, real source-path inspection, or real operator lookup-table mutation as verification for the advisory or first topology implementation.

## Parked Items

- real inventory import/rewrite implementation
- combined topology+inventory local import
- provider-backed SDE download/build
- UI/source picker
- support artifact creation around SDE failures
- source retention policy for downloaded or copied SDE zips
- real external path override policy beyond explicit selected source authority
- runtime enforcement / command blocking
- storage movement / migration
- schema changes
- pruning/deletion interactions with SDE source/cache material

## Human / Overseer Decisions Needed

1. Require selected storage for first real topology import, or allow explicitly acknowledged app-local fallback?
2. Should strong budget warning block topology import, or allow projected-safe local rewrite?
3. Must local SDE source material live under Atlas storage/cache authority, or may an operator-selected external read-only source be accepted?
4. Is staged/shadow-table promotion mandatory for real topology import? Engineering recommendation: yes.
5. Should the first real command be a new conformance-safe command/surface, or should existing `sde.import.topology` be hardened in place?
6. Should old direct-import scripts remain developer-only after the real service path is hardened?

## Evidence Reviewed

Reviewed `workspace/current.md`, HS222/HS223, HS224/HS225, HS226/HS228, HS227, the topology and inventory proof services, current real topology/inventory importers, `sdeLookupBuilder`, `mutatingActionService`, SDE schema tables, import scripts, and SDE verifier scripts.

Note: `workspace/OverseerHS229...` names `src/main/sde/sdeTopologyImporter.js`; the current repo has the topology importer in `src/main/sde/sdeImporter.js`.

This advisory did not run SDE import/download/build verifiers because the request forbids real SDE import/download, real source path inspection, and lookup-table rewrite.
