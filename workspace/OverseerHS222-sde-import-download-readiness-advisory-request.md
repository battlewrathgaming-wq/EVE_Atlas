# Overseer HS222 - SDE Import / Download Readiness Advisory Request

Status: active advisory runway
Date: 2026-06-03
Milestone: Atlas Storage And Runtime Hardening
Executor: Engineering / Security specialist
Expected artifact: `workspace/EngineeringSecurityHS222-sde-import-download-readiness-advisory.md`

## Purpose

Review whether Atlas is ready to open a real SDE import/download or lookup-table rewrite Dev packet, or whether another dry proof is needed first.

This is advisory only. Do not implement code.

## Context

Recent accepted proofs:

- HS218/HS219 accepted `metadata.hydration_attention_runtime.preview`.
- HS220/HS221 accepted `metadata.local_sde_source_posture.preview`.

Atlas now distinguishes:

- local SDE readiness as local readability/geometry support
- local source import/rewrite from provider-backed SDE download/build
- renderer-supplied source paths as non-authoritative and not inspected
- External I/O off as a hold for provider-backed download/build
- storage/budget posture as a future lookup-table rewrite gate

The unresolved question is whether the next packet can safely be a real write/import path, or whether the project still needs a smaller proof around source path authority, storage location, budget accounting, support/corpus material, or rollback/recovery.

## Read First

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `workspace/OverseerHS220-local-sde-source-import-posture-runway.md`
- `workspace/DevHS220-local-sde-source-import-posture.md`
- `workspace/OverseerHS221-hs220-local-sde-source-import-posture-review.md`
- `docs/features/data-layer-boundaries.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `src/main/services/localSdeSourcePostureService.js`
- `src/main/services/localSdeReadinessPreviewService.js`
- `src/main/services/storageSetupGateReadoutService.js`
- `src/main/services/externalIoStateService.js`
- `src/main/services/composedGatePolicyService.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/sde/`
- `scripts/verify-sde-build-lookups.js`
- `scripts/verify-sde-fixture.js`
- `scripts/verify-sde-inventory.js`
- `scripts/import-sde-topology.js`
- `scripts/import-sde-inventory.js`

## Review Questions

Answer practically:

1. Is Atlas ready for a real SDE import/rewrite Dev packet?
2. Is Atlas ready for a provider-backed SDE download/build Dev packet?
3. If not, what is the smallest missing proof?
4. What source path authority must exist before local import?
5. What storage authority and budget checks must exist before lookup-table rewrite?
6. What External I/O checks must exist before provider-backed download/build?
7. What should happen if import/download is interrupted or partially completes?
8. What rollback, backup, staged write, or recovery behavior is required before mutating lookup tables?
9. Should topology and inventory import be separate packets?
10. Should download/build remain parked even if local import is ready?
11. What existing verifiers are enough, and what new verifier would be required?
12. What should be rejected or deferred?

## Required Advisory Output

Return a concise engineering/security advisory with:

- executive recommendation
- ready / not-ready decision for local import/rewrite
- ready / not-ready decision for provider-backed download/build
- smallest next Dev packet if ready
- smallest missing proof if not ready
- required source path authority
- required storage/budget authority
- required External I/O posture
- partial failure / recovery requirements
- verification commands expected
- parked items
- Human/Overseer decisions needed

## Boundaries

- Do not implement code.
- Do not edit files other than the expected advisory artifact.
- Do not open a Dev runway.
- Do not download SDE.
- Do not import SDE.
- Do not rewrite lookup tables.
- Do not inspect arbitrary user files.
- Do not move storage.
- Do not write config.
- Do not create support artifacts.
- Do not call providers.
- Do not change schema.
- Do not rename terms.

## Stop Conditions

Stop and return to Overseer if the review requires live/private/destructive action, real operator source path inspection, SDE download/import, lookup-table rewrite, storage movement, schema changes, or Dev implementation.
