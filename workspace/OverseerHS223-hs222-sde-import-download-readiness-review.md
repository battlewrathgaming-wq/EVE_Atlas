# Overseer HS223 - HS222 SDE Import / Download Readiness Review

Status: accepted
Date: 2026-06-03
Milestone: Atlas Storage And Runtime Hardening
Reviewed artifact: `workspace/EngineeringSecurityHS222-sde-import-download-readiness-advisory.md`

## Decision

HS222 is accepted.

The advisory gives a clear engineering/security direction:

- do not open real operator SDE import/rewrite yet
- do not open provider-backed SDE download/build yet
- next safest work is a fixture/offline import-rewrite authority proof

## Accepted Recommendation

Atlas is not ready for a real lookup-table mutation packet.

The missing proof is not SDE parsing. Existing fixture import checks already cover much of that. The missing proof is whether Atlas can safely decide that a local SDE source and storage target are authorized for lookup-table mutation, and whether a failed mutation leaves visible lookup state coherent.

## Accepted Next Direction

Open a bounded Dev packet for a fixture/offline SDE import-rewrite authority proof.

Preferred shape:

- topology first
- fixture/offline only
- no real operator source path inspection
- no real operator DB mutation
- no provider-backed download/build
- no support artifact creation
- no schema changes unless explicitly justified and returned to Overseer first

The proof should demonstrate:

- renderer source paths remain non-authoritative
- trusted local source authority shape is explicit
- storage/budget posture is projected before rewrite
- lookup-table mutation is staged or transactionally recoverable
- failed rewrite does not corrupt visible ready lookup state
- provenance is written only after complete promotion
- temp/staged material cleanup is explicit

## Accepted Parked Items

Keep parked:

- provider-backed SDE download/build
- real operator lookup-table rewrite
- renderer-supplied SDE source paths
- remote URL local import
- broad combined topology + inventory + download packet
- environment-variable-only source authority as product posture
- active runtime enforcement for SDE commands
- UI/source picker
- support artifact creation around SDE failures
- pruning/deletion interactions with SDE source/cache material

## Human / Overseer Decisions Noted

These remain policy questions for later real mutation:

1. Whether local SDE source material must live under Atlas storage/cache authority, or whether an operator-selected external read-only source path can be accepted.
2. Whether app-local fallback storage is sufficient for first real lookup rewrite, or selected storage is required.
3. Whether strong budget warning blocks SDE lookup rewrites or allows projected-safe local import.
4. Whether staged/shadow tables are required over direct upsert refresh.
5. Whether topology should be first mutation proof, with inventory separate.
6. Whether provider-backed download/build remains parked until both local topology and inventory mutation semantics are accepted.

## Verification

No commands were required for this advisory acceptance beyond readback of the artifact and workspace state.

This acceptance did not run SDE import/download/build verifiers because the advisory boundary forbids SDE import, download, and lookup-table rewrite.
