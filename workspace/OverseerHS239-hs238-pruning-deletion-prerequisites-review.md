# Overseer HS239: HS238 Pruning / Deletion Prerequisites Review

Date: 2026-06-03
Role: Atlas Overseer
Reviewed artifact: `workspace/EngineeringSecurityDataHS238-pruning-deletion-execution-prerequisites.md`
Request reviewed: `workspace/OverseerHS238-pruning-deletion-execution-prerequisites-advisory-request.md`

## Decision

Accepted.

HS238 gives Atlas the correct next boundary: do not open real destructive pruning/deletion execution yet. If pruning continues, the next safe step is a fixture-only deletion execution contract proof, not product execution.

## Accepted Direction

Atlas is ready to specify a fixture-only active-row deletion proof that tests:

- preflight-derived candidate basis
- exact preview digest confirmation
- transaction rollback
- dependency delete ordering
- post-delete integrity
- no retained deletion footprint
- no renderer command
- no operator data
- no support artifact cleanup
- no provider calls
- no schema changes
- no runtime enforcement activation

Real operator deletion remains blocked.

## Important Nuance Preserved

The source-code trace confirmed one important edge:

`scripts/verify-retention-deletion-boundary.js` currently contains a fixture deletion sketch that deletes `data_quality_warnings` by `run_id`. That is acceptable as historical boundary proof, but too broad for any future mixed-run deletion executor.

HS238 correctly tightens the future contract:

- delete only `data_quality_warnings` rows directly linked to selected `killmail_id` values
- retain run-level warning/provenance rows where `killmail_id` is null
- do not delete warning rows merely because they share a `run_id`

This nuance should be part of any future fixture-only deletion execution proof acceptance criteria.

## Accepted Policy Shape

- `activity_events`, `ingestion_audits`, killmail-linked `data_quality_warnings`, and selected `killmails` are the only first-slice deletion candidates.
- `discovered_killmail_refs` remain untouched.
- `assessment_artifacts` remain untouched and are warning/stale-risk context only.
- `fetch_runs` and `api_request_logs` remain untouched.
- run-level `data_quality_warnings` remain untouched unless a separate provenance policy later says otherwise.
- Watch/Marked rows, entities, metadata runs, local SDE lookup rows, storage config, support artifacts, and runtime state remain untouched.

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

Pruning can rest here.

If Human/Overseer chooses to continue pruning, the next bounded Dev runway should be fixture-only:

```txt
retention.evidence_prune_execution.fixture_proof
```

It should prove the HS238 contract in disposable data only and must not expose a product deletion command.
