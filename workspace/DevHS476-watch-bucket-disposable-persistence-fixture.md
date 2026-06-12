# DevHS476 - Watch Bucket Disposable Persistence Fixture

Status: ready for Overseer review  
Date: 2026-06-12  
Executor: Dev  
Runway: HS476 Watch bucket disposable persistence fixture

## Summary

Implemented a fixture-only disposable persistence proof command:

```txt
watch.bucket_disposable_persistence_fixture.preview
```

The proof uses isolated in-memory fixture state to prove Watch bucket persistence semantics: one open row per Watch, duplicate suppression/idempotency, conflict/error handling, stale collapse, overlap coexistence, and boundary table non-mutation.

This is not product schema, not durable bucket persistence, not operator corpus mutation, not Discovery pickup, not provider movement, and not Evidence/EVEidence movement.

## Files Changed

```txt
src/main/services/watchBucketDisposablePersistenceFixtureService.js
src/main/services/serviceRegistry.js
src/main/services/enforcementDryRunService.js
scripts/verify-watch-bucket-disposable-persistence-fixture.js
scripts/verify-service-registry.js
scripts/verify-command-authority.js
scripts/verify-passive-side-effects.js
scripts/verify-enforcement-dry-run.js
package.json
workspace/current.md
workspace/DevHS476-watch-bucket-disposable-persistence-fixture.md
```

## Command Shape

Registered renderer-eligible read-only command:

```txt
watch.bucket_disposable_persistence_fixture.preview
```

Input posture:

```txt
projectedBucketCandidates: HS470-style projected candidate fixture rows
rejectedSourceRows: invalid/not-due/inactive/backoff source rows
externalIoState: fixture External I/O posture
```

Output posture:

```txt
disposable_fixture_rows
persistence_results
overlapping_fixture_rows
boundary_table_check
```

All persistence language is explicitly disposable/fixture-only and does not claim accepted durable product schema.

## Behavior Proven

- insert one valid projected candidate creates one open disposable fixture row
- insert same Watch / same open identity again is idempotent and leaves one open row
- insert same Watch / different open identity reports integrity conflict and creates no second open row
- insert same `watch_run_id` with mismatched scope/provenance reports integrity error and rolls back inside disposable fixture
- stale missed intervals create one current open row and zero catch-up rows
- overlapping system scopes for different Watch IDs coexist and shared systems do not merge identity
- External I/O off does not block disposable row persistence and creates zero provider packets / no Discovery pickup
- invalid, not-due, inactive, and backoff source rows persist no disposable rows
- boundary table check shows no `fetch_runs`, `discovered_killmail_refs`, `killmails`, `activity_events`, `api_request_logs`, warnings, or Watch cadence rows mutated

## Sample Output

From `npm.cmd run verify:watch-bucket-disposable-persistence-fixture`:

```json
{
  "status": "Watch bucket disposable persistence fixture verified",
  "command": "watch.bucket_disposable_persistence_fixture.preview",
  "summary": {
    "attempted_candidate_count": 8,
    "rejected_source_row_count": 4,
    "disposable_open_row_count": 5,
    "inserted_count": 5,
    "idempotent_noop_count": 1,
    "integrity_conflict_count": 1,
    "integrity_error_count": 1,
    "rejected_before_persistence_count": 4,
    "stale_current_open_row_count": 1,
    "catch_up_rows_created": 0,
    "overlapping_open_row_pairs": 10,
    "provider_packets": 0,
    "discovery_pickup_packets_created": 0,
    "candidate_refs_written": 0,
    "evidence_eveidence_writes": 0,
    "watch_cadence_mutations": 0
  }
}
```

Boundary table sample:

```json
{
  "unchanged": true,
  "fetch_runs_mutated": false,
  "discovered_killmail_refs_mutated": false,
  "killmails_mutated": false,
  "activity_events_mutated": false,
  "api_request_logs_mutated": false,
  "data_quality_warnings_mutated": false,
  "watch_cadence_rows_mutated": false
}
```

## Verification

Syntax checks:

```txt
node --check src\main\services\watchBucketDisposablePersistenceFixtureService.js
node --check scripts\verify-watch-bucket-disposable-persistence-fixture.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
```

Results: passed.

Focused and affected verification:

```txt
npm.cmd run verify:watch-bucket-disposable-persistence-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- `verify:watch-bucket-disposable-persistence-fixture` passed
- `verify:service-registry` passed
- `verify:command-authority` passed
- `verify:passive-side-effects` passed
- `verify:enforcement-dry-run` passed with 121/121 commands covered and no gaps

Final hygiene:

```txt
git diff --check
git status --short --branch
git diff -- src/main/db/schema.sql
```

Results:

- `git diff --check` passed with CRLF normalization warnings only
- `git status --short --branch` reported branch `main...origin/main [ahead 19]` with the existing broad uncommitted/untracked milestone stack plus HS476 files
- `git diff -- src/main/db/schema.sql` returned no diff

## Boundary Confirmation

No `src/main/db/schema.sql` update, product schema, durable product bucket rows, operator corpus mutation, provider calls, Discovery pickup, candidate refs, Discovery refs, Evidence/EVEidence writes, Hydration, Observation, dispatcher, queue, lease, enforcement, UI, source-term rename, or protected-word JSON update was added.

The proof explicitly reports:

```txt
fetch_runs_as_bucket_state: false
discovered_killmail_refs_as_bucket_state: false
provider_packets: 0
discovery_pickup_packets_created: 0
candidate_refs_written: 0
evidence_writes: 0
watch_cadence_mutations: 0
fixture_schema_accepted_as_product_schema: false
```

## Risks / Notes

- The fixture proves semantics only; it does not create a product bucket table.
- Disposable row IDs and identity formatting are fixture proof values, not final production generation doctrine.
- Durable bucket persistence, pickup lease/queue behavior, and Discovery pickup remain unopened.

## Recommended Next Action

Overseer review HS476. If accepted, the next seam can decide whether to move toward a Discovery pickup consumer hold contract from disposable bucket rows or pause for architecture review before any durable schema design.
