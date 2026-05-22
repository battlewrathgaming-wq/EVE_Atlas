# Partial Failure And Transaction Integrity

Status: Complete

Completed: 2026-05-23

## Mission

Prove that Atlas fails safely when collection, expansion, hydration, import, or persistence is interrupted.

Successful behavior means evidence remains valid, locks release, queue state is reviewable, and the operator can retry without hidden corruption.

## Implemented Outcome

Added:

```text
npm.cmd run verify:partial-failures
```

The verification uses fake clients, injected repositories, and local fixtures only. No live API calls are made.

## Coverage

The verifier covers:

- zKill discovery failure after one scoped system succeeds
- ESI expansion where one killmail succeeds and one selected ref fails
- retry of a failed queued ref without duplicate activity event keys
- transaction rollback when activity event persistence fails after raw killmail insertion begins
- manual expansion persistence failure leaving the queued ref reviewable and retryable
- metadata hydration failure after a partial chunked name-resolution attempt
- SDE lookup build interruption after topology import and before inventory import
- failed run/metadata-run status and error-summary visibility
- corpus health continuing to render warning/integrity state after interrupted work

## Guardrails Verified

- Simulated failures do not mutate existing raw evidence.
- Raw killmail insert plus activity event write is transactional as a unit.
- Failed ESI expansion marks the queued ref as `failed` and leaves it available for retry.
- Retry does not duplicate activity event keys.
- Metadata hydration does not apply partial ESI name results if a later chunk fails before apply.
- SDE interruption leaves topology reviewable without claiming inventory/type readiness.

## Verification

Passed:

```text
npm.cmd run verify:partial-failures
npm.cmd run verify:core
```

The new check is included in:

```text
npm.cmd run verify:all
```
