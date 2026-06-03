# Overseer HS241: HS240 Fixture-Only Evidence Prune Contract Review

Date: 2026-06-03
Role: Atlas Overseer
Reviewed handoff: `workspace/DevHS240-fixture-only-evidence-prune-execution-contract.md`
Runway reviewed: `workspace/OverseerHS240-fixture-only-evidence-prune-execution-contract-runway.md`

## Decision

Accepted.

HS240 proves the minimum future Evidence/EVEidence prune execution contract in fixture/disposable data only. It does not open real operator deletion.

## What Changed

Dev added an internal helper in `src/main/services/retentionActionService.js`:

```txt
buildEvidencePruneExecutionFixtureProof
```

The emitted proof action label is:

```txt
retention.evidence_prune_execution.fixture_proof
```

It is not registered in `serviceRegistry`, not renderer eligible, and not a product deletion command.

Dev also added:

- `scripts/verify-retention-prune-fixture-proof.js`
- `npm.cmd run verify:retention-prune-fixture-proof`
- a correction to the historical fixture deletion sketch in `scripts/verify-retention-deletion-boundary.js` so warning rows are deleted by selected `killmail_id`, not shared `run_id`

## Scope Review

Accepted boundaries were preserved:

- no real operator deletion
- no renderer command
- no product deletion command
- no schema changes
- no support artifact creation, deletion, or cleanup
- no provider calls
- no Hydration writes
- no Discovery ref mutation
- no Assessment Memory mutation or stale marking
- no Watch/Marked mutation
- no provenance/log mutation outside fixture setup/assertion data
- no runtime enforcement activation
- no command blocking
- no UI work
- no storage movement
- no retained deletion footprint

## Contract Proven

HS240 proves:

- fixture-only context is required
- candidate killmail IDs are recomputed from server-side `retention.preflight`
- payload/renderer-style candidate IDs are ignored as authority
- exact preview digest confirmation is required
- digest mismatch stops before deletion
- stale/changed preview stops before deletion
- empty scope stops cleanly
- deletion runs inside `BEGIN IMMEDIATE`
- injected failure rolls back fixture counts
- success deletes only selected `activity_events`, selected `ingestion_audits`, selected killmail-linked `data_quality_warnings`, and selected `killmails`
- run-level warning rows and other mixed-run killmail warning rows are retained
- Discovery refs, Assessment Memory, fetch runs, API request logs, Watch/Marked-adjacent rows, entities, metadata rows, local SDE lookup rows, storage/config/runtime/support-artifact state are retained
- `PRAGMA foreign_key_check` passes after fixture deletion
- result returns counts, support-artifact disclosure, and no-footprint posture only

## Verification Re-Run

Overseer re-ran:

```powershell
node --check src\main\services\retentionActionService.js
node --check scripts\verify-retention-deletion-boundary.js
node --check scripts\verify-retention-prune-fixture-proof.js
npm.cmd run verify:retention-prune-fixture-proof
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
```

Results:

- all commands passed
- `verify:protected-terms` emitted warning-only advisory output
- `git diff --check` emitted CRLF normalization warnings only

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

## Resting Recommendation

Rest pruning here.

Atlas now has:

1. read-only pruning intelligence preview
2. deletion prerequisites advisory
3. fixture-only deletion execution contract proof

That is enough for the current hardening seam. Real deletion remains a separate future Human/Overseer decision.
