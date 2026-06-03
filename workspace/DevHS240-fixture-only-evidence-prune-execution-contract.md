# DevHS240: Fixture-Only Evidence Prune Execution Contract

Date: 2026-06-03
Role: Atlas Dev
Milestone: Atlas Storage And Runtime Hardening
Runway: `workspace/OverseerHS240-fixture-only-evidence-prune-execution-contract-runway.md`

## Summary

Implemented a fixture-only Evidence/EVEidence prune execution contract proof.

This is not real operator deletion and is not exposed through the service registry or renderer. The proof lives as an internal retention-service helper exercised by a focused disposable/in-memory verifier.

## Files Changed

- `src/main/services/retentionActionService.js`
- `scripts/verify-retention-prune-fixture-proof.js`
- `scripts/verify-retention-deletion-boundary.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS240-fixture-only-evidence-prune-execution-contract.md`

## Proof Shape

Added internal helper:

```txt
buildEvidencePruneExecutionFixtureProof(...)
```

The proof action name emitted in the returned result is:

```txt
retention.evidence_prune_execution.fixture_proof
```

It is not registered as a service command and is not renderer eligible.

## Contract Proven

The fixture proof verifies:

- fixture-only context is required
- candidates are computed from server-side `retention.preflight`
- payload/renderer-style candidate IDs are ignored as authority
- exact preview digest confirmation is required
- digest mismatch stops before deletion
- stale/changed preview digest stops before deletion
- empty scope stops cleanly
- deletion runs inside `BEGIN IMMEDIATE` transaction
- injected failure rolls back all fixture counts
- success deletes only:
  - selected `activity_events`
  - selected `ingestion_audits`
  - selected killmail-linked `data_quality_warnings`
  - selected `killmails`
- success retains:
  - run-level `data_quality_warnings`
  - other mixed-run killmail warning rows
  - `discovered_killmail_refs`
  - `assessment_artifacts`
  - `fetch_runs`
  - `api_request_logs`
  - Watch/Marked-adjacent rows
  - `entities`
  - metadata/SDE lookup rows
- post-delete integrity reports no selected dependent rows and passes `PRAGMA foreign_key_check`
- returned result includes deleted/retained counts, support-artifact disclosure, and no-footprint posture only
- no retained deletion footprint, raw Evidence payload, full participant array, hidden copy, support artifact cleanup, or stale Assessment mutation is created

## Verification Added

Added:

```txt
npm.cmd run verify:retention-prune-fixture-proof
```

The verifier seeds a mixed-run in-memory fixture corpus with two killmails, killmail-linked warnings, one run-level warning, Discovery refs, Assessment Memory, Watch/Marked-adjacent rows, provenance/log rows, entity rows, and lookup rows.

It proves success removes only selected Evidence/EVEidence dependency rows while preserving the rest.

## Additional Boundary Refresh

Updated `scripts/verify-retention-deletion-boundary.js` so its historical fixture deletion sketch deletes warning rows by selected `killmail_id`, not by shared `run_id`.

## Verification Results

Passed:

- `node --check src\main\services\retentionActionService.js`
- `node --check scripts\verify-retention-deletion-boundary.js`
- `node --check scripts\verify-retention-prune-fixture-proof.js`
- `npm.cmd run verify:retention-prune-fixture-proof`
- `npm.cmd run verify:retention-preflight`
- `npm.cmd run verify:retention-deletion-boundary`
- `npm.cmd run verify:assessment-artifacts`
- `npm.cmd run verify:queue-report`
- `npm.cmd run verify:db-integrity`
- `npm.cmd run verify:evidence-rules`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:protected-terms`
- `git diff --check`
- `git status --short --branch`

Notes:

- `verify:protected-terms` passed with warning-only advisory output; no terminology authority or protected-word JSON files were changed.
- `git diff --check` passed with CRLF normalization warnings only.

## Boundaries Preserved

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
- no provenance/log mutation outside fixture setup/assertion data
- no runtime enforcement activation
- no command blocking
- no UI work
- no storage movement
- no retained deletion footprint

## Risks / Parked

- This proof is executable only against fixture/disposable data via internal test helper.
- Real operator active-row deletion remains blocked.
- Discovery ref pruning, Assessment Memory stale marking, no-interest/Marked pruning policy, provenance/log redaction or recompute, support artifact cleanup, runtime enforcement, and UI deletion flow remain parked.

## Recommended Next Action

Overseer should review HS240 for acceptance. If accepted, pruning can rest again unless Human/Overseer chooses a separate policy/design runway for Discovery ref pruning, no-interest/Marked pruning, Assessment stale handling, or real operator deletion prerequisites.
