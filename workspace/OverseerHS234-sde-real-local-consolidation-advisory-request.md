# OverseerHS234 - SDE Real-Local Consolidation Advisory Request

Status: active advisory request
Date: 2026-06-03
Project: AURA Atlas
Milestone: Atlas Storage And Runtime Hardening
Requested role: Engineering / Security
Expected artifact: workspace/EngineeringSecurityHS234-sde-real-local-consolidation-advisory.md

## Purpose

Review the state after both real-local SDE import/rewrite halves have been accepted, and advise what should happen before Atlas opens any combined local SDE import, operator source picker, provider-backed download/build, support artifact writer, or runtime enforcement work.

This is advisory only. Do not implement code.

## Read

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `workspace/EngineeringSecurityHS222-sde-import-download-readiness-advisory.md`
- `workspace/EngineeringSecurityHS229-sde-post-proof-readiness-advisory.md`
- `workspace/OverseerHS230-real-local-sde-topology-import-conformance-runway.md`
- `workspace/DevHS230-real-local-sde-topology-import-conformance.md`
- `workspace/OverseerHS231-hs230-real-local-sde-topology-conformance-review.md`
- `workspace/OverseerHS232-real-local-sde-inventory-import-conformance-runway.md`
- `workspace/DevHS232-real-local-sde-inventory-import-conformance.md`
- `workspace/OverseerHS233-hs232-real-local-sde-inventory-conformance-review.md`
- `src/main/sde/sdeImporter.js`
- `src/main/sde/sdeInventoryImporter.js`
- `src/main/sde/sdeLookupBuilder.js`
- `src/main/services/mutatingActionService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/localSdeSourcePostureService.js`
- `src/main/services/localSdeReadinessPreviewService.js`
- `src/main/services/storageSetupGateReadoutService.js`
- `src/main/services/externalIoStateService.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/db/schema.sql`
- `scripts/verify-sde-topology-real-local-conformance.js`
- `scripts/verify-sde-inventory-real-local-conformance.js`
- `scripts/verify-sde-fixture.js`
- `scripts/verify-sde-inventory.js`
- `scripts/verify-sde-build-lookups.js`
- `scripts/sde-build-lookups.js`

## Accepted Baseline

Atlas has accepted real-local conformance for:

- topology import/rewrite: HS230 accepted by HS231
- inventory/type import/rewrite: HS232 accepted by HS233

Both accepted real paths preserve:

- trusted local source authority required before mutation
- renderer source paths ignored as authority
- remote source references rejected for local import
- selected storage and explicit budget required for these packets
- staged temp material before visible promotion
- transactional visible rewrite
- provenance only after complete promotion
- failed import preserves previous visible rows/provenance
- explicit retry/rerun posture, not automatic retry
- no provider-backed `sde.build-lookups`
- no SDE download
- no real operator source picker/UI
- no support artifact creation
- no runtime enforcement activation
- no command blocking

HS233 parked a non-blocking edge:

- source-disappears-after-authority failure proof before operator-facing source selection or broader operator import orchestration

## Task

Answer what the next safe SDE direction should be now that both real-local import halves are accepted.

Specifically assess:

1. Whether local SDE import/rewrite mechanics can rest for now.
2. Whether a combined topology + inventory local import/orchestration packet is needed next, or should remain parked.
3. Whether the source-disappears-after-authority edge should be proven now, later, or only before operator source picker/UI.
4. Whether real operator source picker/UI is safe to open yet, and what authority boundaries it would need.
5. Whether provider-backed `sde.build-lookups` remains parked.
6. Whether support artifacts around SDE failures should be required before any broader operator-facing import work.
7. Whether runtime enforcement / command blocking remains parked.
8. Whether the old developer scripts and `sde.build-lookups` path need quarantine, labeling, or conformance before future use.
9. Whether current verifier coverage is enough to treat local SDE mechanics as a stable subsystem for now.
10. What the smallest next Dev packet should be, if any.

## Preserve

- no code implementation
- no Dev runway
- no real SDE import
- no SDE download
- no lookup-table rewrite
- no real operator source path inspection
- no storage movement
- no config writes
- no support artifact creation
- no provider calls
- no schema changes
- no term renames

## Expected Output

Create:

```txt
workspace/EngineeringSecurityHS234-sde-real-local-consolidation-advisory.md
```

Include:

- executive recommendation
- whether local SDE import mechanics should rest
- whether combined local import should open, defer, or be rejected for now
- operator source picker/UI readiness
- source-disappears-after-authority disposition
- provider-backed download/build disposition
- support artifact disposition
- runtime enforcement disposition
- old script / `sde.build-lookups` disposition
- current verifier sufficiency
- smallest next Dev packet, if any
- verification commands/evidence expected
- parked items
- Human/Overseer decisions needed

## Stop Conditions

Stop if the review requires live/private/destructive action, real operator source path inspection, SDE download/import, lookup-table rewrite, storage movement, schema changes, support artifact creation, or Dev implementation.
