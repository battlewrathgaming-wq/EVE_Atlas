# Engineering Security HS222 - SDE Import / Download Readiness Advisory

Status: advisory complete
Date: 2026-06-03
Milestone: Atlas Storage And Runtime Hardening
Role: Engineering / Security specialist
Topic: SDE import/download and lookup-table rewrite readiness

## Executive Recommendation

Atlas should not yet open a real operator SDE import/rewrite packet and should not open a provider-backed SDE download/build packet.

HS220/HS221 established the right posture boundary: local SDE readiness is local readability/geometry support, renderer source paths are non-authoritative, local import/rewrite is separate from provider-backed download/build, and storage/budget posture can block future lookup writes without blocking preview.

The smallest next safe step is a dry, fixture-controlled import/rewrite authority proof that closes source path authority, storage/budget authority, and staged-write/rollback semantics before any real operator lookup tables are mutated.

## Local Import / Rewrite Decision

Decision: not ready for real operator lookup-table rewrite.

Atlas has existing local import code and strong fixture verification around idempotence, cleanup, invalid sources, failed download, failed refresh preservation, and service task diagnostics. That is useful engineering evidence, but it is not enough for a real write packet because the current mutation path still relies on caller-supplied paths/options and direct importer writes rather than an accepted operator source authority plus explicit storage/budget/write-recovery gate.

Atlas is ready for a narrow non-real proof packet, not a real import packet.

## Provider-Backed Download / Build Decision

Decision: not ready; keep parked.

`sde.build-lookups` can download official CCP SDE material when no local source is supplied. That makes it External I/O plus large local cache/write behavior plus lookup-table mutation. External I/O on, live.gate allowance, and confirmation metadata are not sufficient authorization by themselves. Download/build should wait until local import/rewrite semantics are proven and until provider-backed source caching, byte limits, interruption cleanup, retry/cadence behavior, provenance, and no-catch-up posture are explicitly accepted.

## Smallest Next Dev Packet If Ready

No real mutation packet is recommended yet.

The smallest safe Dev packet is a fixture/offline proof, for example:

```txt
sde.local_import_rewrite_authority.preview
```

or a similarly named read-only / fixture-only proof that does not inspect a real operator source path and does not mutate the operator DB. It should prove:

- canonical source path authority shape for local SDE material
- storage authority and budget projection before rewrite
- command-family split for topology and inventory
- transaction/staged-write behavior
- interruption recovery and explicit retry/rerun posture
- no provider calls and no support artifact creation

## Smallest Missing Proof

The missing proof is not "can the importer parse SDE?" The existing fixture checks mostly answer that.

The missing proof is "can Atlas safely decide that a real local source and real storage target are authorized for lookup-table mutation, and can it leave the DB coherent if the mutation fails halfway?"

That proof should include a fixture DB with existing ready lookup tables, an attempted refresh that fails at controlled phases, and a checked outcome that either the old lookup set remains visible or a complete staged set is atomically promoted.

## Required Source Path Authority

Before local import, Atlas needs source path authority with these properties:

- trusted/main-process or operator-config source only; renderer payloads must remain ignored for authority
- canonical resolved local path under an accepted source/cache authority, not a remote URL
- supported source shape only: SDE JSONL zip or expected JSONL directory
- no arbitrary user-file inspection during previews
- source path distinct from Atlas DB/storage target, support artifact destination, and temp/cache output path
- explicit handling of project-local default versus operator-selected external path; any external path override must be a Human/Overseer decision, not an env-var accident
- source material classified as support/corpus-adjacent operational material with path sensitivity and budget disclosure

Current concern: scripts such as `import-sde-topology.js`, `import-sde-inventory.js`, and `sde-build-lookups.js` can resolve paths from environment variables. That is acceptable for developer/verifier use, but not enough as operator source authority for real product mutation.

## Required Storage / Budget Authority

Before lookup-table rewrite, Atlas needs:

- selected storage or explicitly accepted app-local fallback posture
- valid storage read/write posture, not missing/unavailable/degraded
- explicit budget configured; suggested 5GB must not become acceptance
- current usage plus projected source/cache/temp/extraction/rewrite bytes checked before mutation
- budget hard lock blocks lookup rewrites
- strong-warning posture allows only deliberately scoped projected-safe writes if Human/Overseer accepts that policy
- lookup-table rewrite counted as Atlas-controlled storage pressure
- temp extraction/cache cleanup included in budget planning
- DB/WAL/SHM growth during transaction or staged promotion included, not just final table size

Current concern: `storage.setup_gate_readout` can describe posture, but no accepted SDE rewrite authority currently composes that posture into an execution preflight.

## Required External I/O Posture

Local source import should not require External I/O.

Provider-backed download/build requires:

- External I/O state readback is `on`
- live/provider gate allows the `sde.build-lookups` action
- User-Agent is configured
- provider cooldown/lockout/active duplicate task posture is clear
- explicit confirmation remains UX friction, not security authority
- source URL is from an accepted endpoint policy
- max byte limits and timeout/cancel behavior are enforced
- re-enable never creates immediate catch-up dispatch or implicit download debt

External I/O on must remain release to normal gates, not authorization to download or rewrite.

## Partial Failure / Recovery Requirements

If local import or provider download is interrupted:

- no partial lookup set should become the only visible ready state
- existing ready lookup tables should remain usable unless a complete staged replacement is promoted
- failed attempts should leave clear provenance/error posture without creating Evidence/EVEidence, Hydration output, Discovery refs, Watch state, Assessment Memory, support artifacts, or deletion authority
- temp extraction/download files should be removed unless explicitly kept for a trusted fixture/debug case
- retry should be explicit and idempotent; no automatic loop or catch-up behavior
- concurrent import/build commands should be excluded by task scope or command exclusivity

Before real mutation, Atlas should choose one accepted recovery model:

- single transaction covering topology/inventory rewrite and provenance insert, if feasible for real SDE size, or
- shadow/staging tables plus atomic promotion, with old tables retained until the replacement set passes completeness checks.

The staged-table model is safer for large imports and clearer for interruption recovery.

## Topology And Inventory Packet Split

Topology and inventory should be separate packets.

Topology import supports geography/radius behavior and has a smaller semantic surface. Inventory import repairs type metadata and can be larger/noisier. Keeping them separate reduces blast radius, lets recovery semantics be proven once per family, and avoids treating "SDE ready" as all-or-nothing before the first real mutation is safe.

Recommended order:

1. Topology local import staged-write proof.
2. Inventory local import staged-write proof.
3. Combined build orchestration only after both families have accepted mutation semantics.

## Existing Verifiers And New Verifier Needed

Existing verifier evidence that is useful:

- `npm.cmd run verify:local-sde-source-posture`
- `npm.cmd run verify:local-sde-readiness`
- `npm.cmd run verify:sde-fixture`
- `npm.cmd run verify:sde-inventory`
- `npm.cmd run verify:sde-build-lookups`
- `npm.cmd run verify:enforcement-dry-run`
- `npm.cmd run verify:gate-stack-readout`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:protected-terms`
- `git diff --check`

These are not enough for real operator mutation.

New verifier required before real lookup-table rewrite:

```txt
npm.cmd run verify:sde-import-rewrite-authority
```

Expected verifier evidence:

- renderer source path ignored
- trusted local source path accepted only by approved authority shape
- remote source rejected for local import
- missing/invalid/degraded storage blocks rewrite
- unconfigured budget blocks rewrite
- hard-lock budget blocks rewrite
- projected temp/cache/DB growth is represented
- topology and inventory staged writes can fail without corrupting visible ready lookups
- provenance is written only after complete promotion
- partial temp material is cleaned
- no provider calls, support artifacts, Evidence/EVEidence writes, Hydration writes, Discovery mutations, Watch mutations, Assessment Memory mutations, schema changes, runtime enforcement, or command blocking

## Rejected Or Deferred

Reject or defer for now:

- provider-backed SDE download/build
- real operator lookup-table rewrite
- renderer-supplied SDE source paths
- remote URL passed into local import
- broad combined topology+inventory+download packet
- environment-variable-only source authority as product posture
- using dry-run classification as runtime authorization
- writing support artifacts or snapshots as part of this readiness step
- schema changes
- storage movement or migration
- automatic retry/catch-up download behavior

## Parked Items

- provider-backed SDE download/cache policy
- source retention/cleanup policy for downloaded SDE zips
- operator UI/source picker
- real external path override policy
- active runtime enforcement for SDE commands
- support artifact creation around SDE failures
- pruning/deletion interactions with SDE source/cache material

## Human / Overseer Decisions Needed

1. Should local SDE source material be required to live under Atlas storage/cache authority, or may an operator-selected external path be accepted for read-only import?
2. Is app-local fallback storage sufficient for a first real lookup rewrite, or must selected storage be required?
3. Should strong budget warning block SDE lookup rewrites, or allow projected-safe local import only?
4. Should Atlas require staged/shadow tables rather than direct upsert refresh for real SDE import?
5. Should topology be the first mutation proof, with inventory separate?
6. Should provider-backed SDE download/build remain parked until after both local topology and inventory mutation semantics are accepted?

## Verification / Evidence Reviewed

Reviewed the named HS222 request, HS220/HS221 posture chain, data-layer and storage/runtime docs, `localSdeSourcePostureService.js`, `localSdeReadinessPreviewService.js`, storage/External I/O/composed/dry-run services, SDE import/build modules, and SDE verifier/import scripts.

This advisory did not run SDE import/download/build verifiers because the HS222 boundary says not to import SDE or rewrite lookup tables. Existing verifier commands above are listed as expected evidence for a later bounded Dev packet.
