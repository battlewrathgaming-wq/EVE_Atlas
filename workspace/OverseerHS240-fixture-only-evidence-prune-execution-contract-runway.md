# Overseer HS240: Fixture-Only Evidence Prune Execution Contract Runway

Date: 2026-06-03
Role: Atlas Overseer
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS240-fixture-only-evidence-prune-execution-contract.md`

## Purpose

Prove the smallest deletion execution contract in fixture/disposable data only.

This is not real operator deletion. It is a contract proof for what a future destructive Evidence/EVEidence prune executor would have to do safely before Atlas ever considers product execution.

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
- `workspace/EngineeringSecurityDataHS238-pruning-deletion-execution-prerequisites.md`
- `workspace/OverseerHS239-hs238-pruning-deletion-prerequisites-review.md`
- `src/main/services/retentionActionService.js`
- `scripts/verify-retention-deletion-boundary.js`
- `src/main/db/schema.sql`

## Task

Add a fixture-only deletion execution contract proof for Evidence/EVEidence pruning.

Preferred shape:

```txt
retention.evidence_prune_execution.fixture_proof
```

This may be a non-renderer service proof, script verifier helper, or a small internal proof module, as long as it is fixture/disposable only and cannot be mistaken for product deletion execution.

## Required Outcome

The proof must show:

- candidate killmail IDs are computed from server-side `retention.preflight`, not renderer-supplied as authority
- exact preview digest confirmation is required
- digest mismatch stops before deletion
- stale/changed preview stops before deletion
- empty scope stops cleanly
- deletion runs inside a transaction
- rollback on injected failure leaves all fixture counts unchanged
- success deletes only:
  - selected `activity_events`
  - selected `ingestion_audits`
  - `data_quality_warnings` directly linked to selected `killmail_id` values
  - selected `killmails`
- success does not delete run-level `data_quality_warnings` where `killmail_id` is null
- success does not mutate:
  - `discovered_killmail_refs`
  - `assessment_artifacts`
  - `fetch_runs`
  - `api_request_logs`
  - Watch/Marked-adjacent rows
  - `entities`
  - metadata/SDE lookup rows
  - storage config
  - support artifacts
- post-delete integrity has no orphan selected dependent rows
- returned result includes counts, support-artifact disclosure, and no-footprint posture only
- no retained deletion footprint is created

## Preserve

- no real operator deletion
- no renderer command
- no product deletion command
- no schema changes
- no support artifact creation/deletion/cleanup
- no provider calls
- no Hydration writes
- no Discovery ref mutation
- no Assessment Memory mutation or stale marking
- no Watch/Marked mutation
- no provenance/log mutation except fixture-local assertions if needed for proof setup
- no runtime enforcement activation
- no command blocking
- no UI work
- no storage movement
- no retained deletion footprint

## Stop Conditions

Stop and return to Overseer if this requires:

- touching real operator data
- exposing product deletion execution
- renderer eligibility
- schema migration
- deleting by `run_id` instead of selected `killmail_id` for warning rows
- support artifact cleanup
- Assessment Memory stale marking
- Discovery ref pruning
- provenance/log redaction or recompute
- runtime enforcement or command blocking
- policy decisions not already accepted by HS238/HS239

## Verification

Expected local-only proof:

```powershell
node --check src\main\services\retentionActionService.js
node --check scripts\verify-retention-deletion-boundary.js
npm.cmd run verify:retention-preflight
npm.cmd run verify:retention-deletion-boundary
npm.cmd run verify:assessment-artifacts
npm.cmd run verify:queue-report
npm.cmd run verify:db-integrity
npm.cmd run verify:evidence-rules
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If a new verifier or package script is added, include it in the handoff.

## Acceptance Criteria

- The proof is clearly fixture-only/disposable.
- No renderer or product deletion command is exposed.
- The proof uses `retention.preflight` as review basis.
- Exact digest confirmation is required and mismatch stops before deletion.
- Injected failure rolls back all fixture changes.
- Successful fixture deletion deletes only selected Evidence/EVEidence dependency rows and selected `killmails`.
- Killmail-linked warning rows are deleted only by selected `killmail_id`.
- Run-level and mixed-run warning/provenance rows remain.
- Discovery refs, Assessment Memory, Watch/Marked rows, provenance/log rows, support artifacts, storage config, schema, runtime enforcement, provider movement, and UI remain untouched.
- No retained deletion footprint appears in result or persisted fixture rows.

## Parked

- real operator active-row deletion
- renderer/UI deletion flow
- Discovery ref pruning
- no-interest/Marked pruning policy
- Assessment Memory stale marking
- provenance/log redaction, recompute, stale marking, or pruning
- support artifact cleanup and snapshot deletion
- schema changes or cascade policy
- runtime enforcement activation
