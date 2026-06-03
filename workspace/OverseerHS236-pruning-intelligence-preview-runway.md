# Overseer HS236: Pruning Intelligence Preview Runway

Date: 2026-06-03
Role: Atlas Overseer
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS236-pruning-intelligence-preview.md`

## Purpose

Harden Atlas' existing read-only pruning/deletion preflight into a richer pruning intelligence preview.

Atlas is not ready for destructive pruning or deletion execution. The useful next step is to show what a future prune would affect across local records, provenance, Assessment Memory, Discovery refs, and support-artifact disclosure before any deletion authority exists.

## Source Basis

Read before implementation:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/current-state/current-terminology-and-retention.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/features/data-layer-boundaries.md`
- `workspace/SystemsAuditHS102-pruning-readiness.md`
- `workspace/DataAnalystHS152-current-gaps-and-milestone-slices.md`
- `src/main/services/retentionActionService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/db/schema.sql`
- relevant assessment, queue, report, and evidence repository files as needed

## Task

Extend the existing `retention.preflight` read-only output for `evidence.prune_scope` so it reports relationship/context groups useful for operator review.

Preferred focus:

- `src/main/services/retentionActionService.js`
- `scripts/verify-retention-preflight.js`
- `scripts/verify-retention-deletion-boundary.js`
- package verification wiring only if a new focused verifier is useful

## Required Outcome

For `evidence.prune_scope`, the preflight should remain read-only and include richer relationship/context preview groups where determinable from existing tables:

- selected Evidence/EVEidence rows
- derived `activity_events`
- ingestion audits
- data quality warnings
- Discovery refs sharing selected killmail IDs, with statuses separated where practical
- affected Assessment Memory references
- Watch/Marked-adjacent rows where determinable without inventing meaning
- provenance/log summaries where determinable without rewriting run history
- snapshot/support-artifact disclosure that active-record deletion would not clean historical support artifacts
- explicit no-footprint deletion policy already accepted by Atlas

The preview should distinguish counts from relationship/context warnings. It should not treat computed relationships as durable truth unless backed by disclosed basis.

## Preserve

- no destructive pruning execution
- no new delete/prune/expire command
- no mutation of Evidence/EVEidence
- no mutation of Discovery refs
- no Assessment Memory creation, mutation, or deletion
- no Marked or Watch mutation
- no provider calls
- no Hydration writes
- no support artifact creation, deletion, cleanup, or inspection of real operator files
- no storage movement
- no schema changes unless returned to Overseer first
- no runtime enforcement activation
- no command blocking
- no renderer UI work
- no new retained deletion footprint
- no automatic Assessment Memory stale marking
- no treating Discovery refs as Evidence

## Stop Conditions

Stop and return to Overseer if this requires:

- destructive deletion/pruning behavior
- schema migration
- defining a first-class Marked/no-interest model
- support artifact cleanup behavior
- snapshot restore/delete behavior
- provenance redaction/rewrite/recompute policy
- live/private/provider calls
- runtime command blocking
- UI/product decisions not already accepted

## Verification

Expected local-only proof:

```powershell
node --check src\main\services\retentionActionService.js
node --check scripts\verify-retention-preflight.js
npm.cmd run verify:retention-preflight
npm.cmd run verify:retention-deletion-boundary
npm.cmd run verify:assessment-artifacts
npm.cmd run verify:queue-report
npm.cmd run verify:db-integrity
npm.cmd run verify:evidence-rules
npm.cmd run verify:service-registry
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If a new focused verifier is added, include it in the handoff and explain why existing retention verification was not enough.

## Acceptance Criteria

- `retention.preflight` stays read-only.
- Evidence deletion execution remains blocked.
- Preview by selected killmail ID reports affected Evidence/EVEidence, activity, audit/warning, Discovery ref, Assessment Memory, provenance/log, and support-artifact disclosure groups where existing data supports them.
- Preview by actor/entity ID and time window reports distinct affected killmails and relationship/context groups without using Discovery refs as observations.
- Discovery refs are identified as possible leads/provenance, not Evidence.
- Assessment Memory is shown as affected/stale-risk context, not a deletion blocker.
- Support artifacts are disclosed as separate historical/recovery material, not automatically cleaned.
- No retained deletion footprint appears or is suggested.
- Verification proves no table mutation for preflight paths.

## Parked

- destructive pruning/deletion execution
- no-interest/Marked pruning policy
- support artifact cleanup or snapshot deletion
- provenance redaction/recompute policy
- automatic stale Assessment Memory marking
- UI pruning/deletion workflow
- runtime enforcement of deletion commands
