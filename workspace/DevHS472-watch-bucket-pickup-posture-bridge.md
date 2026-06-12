# DevHS472 - Watch Bucket Pickup Posture Bridge

Status: ready for Overseer review  
Date: 2026-06-12  
Executor: Dev  
Runway: HS472 Watch bucket candidate pickup posture bridge proof

## Summary

Implemented a read-only fixture/projection proof command:

```txt
watch.bucket_pickup_posture_bridge.preview
```

The proof takes HS470-style projected Watch bucket candidate fixture rows plus fixture External I/O posture, then reports whether each row is future pickup eligible, held by External I/O, or rejected before pickup posture.

This is not durable bucket state, not Discovery pickup, not provider movement, not candidate-ref persistence, and not Evidence/EVEidence movement.

## Files Changed

```txt
src/main/services/watchBucketPickupPostureBridgeService.js
src/main/services/serviceRegistry.js
src/main/services/enforcementDryRunService.js
scripts/verify-watch-bucket-pickup-posture-bridge.js
scripts/verify-service-registry.js
scripts/verify-command-authority.js
scripts/verify-passive-side-effects.js
scripts/verify-enforcement-dry-run.js
package.json
workspace/current.md
workspace/DevHS472-watch-bucket-pickup-posture-bridge.md
```

## Command Shape

Registered renderer-eligible read-only command:

```txt
watch.bucket_pickup_posture_bridge.preview
```

Input posture:

```txt
bucketIdentityProjection: HS470-style fixture projection output
projectedBucketCandidates: optional direct fixture candidates
duplicateOpenSuppressions / integrityConflicts / integrityErrors / rejectedStubs: optional direct fixture rows
externalIoState: fixture External I/O posture, on or off
```

Output posture:

```txt
pickup_posture_rows
future_pickup_eligible_candidates
held_by_external_io_candidates
rejected_before_pickup_rows
independent_overlap_posture
```

All output uses projected/candidate/fixture posture language and avoids accepted schema language.

## Behavior Proven

- fixture projected candidate with External I/O on reports `future_pickup_eligible`, but does not start pickup
- fixture projected candidate with External I/O off reports `held_by_external_io` as provider movement hold, not Watch emission failure
- duplicate-open suppression and no-candidate rows from HS470 do not become pickup eligible
- integrity conflict and integrity error rows do not become pickup eligible
- overlapping candidates from different Watches remain independently eligible/held
- provider packet count remains zero
- Discovery pickup started remains false
- bucket rows persisted remains zero
- candidate refs, Evidence/EVEidence, Hydration, Observation, dispatcher, queue, lease, enforcement, and UI remain untouched

## Sample Output

From `npm.cmd run verify:watch-bucket-pickup-posture-bridge`:

```json
{
  "status": "Watch bucket pickup posture bridge verified",
  "command": "watch.bucket_pickup_posture_bridge.preview",
  "external_io_on_summary": {
    "projected_candidate_fixture_count": 5,
    "pickup_posture_row_count": 13,
    "future_pickup_eligible_count": 5,
    "held_by_external_io_count": 0,
    "rejected_before_pickup_count": 8,
    "provider_packets": 0,
    "discovery_pickup_packets_created": 0,
    "bucket_rows_persisted": 0,
    "writes": 0
  },
  "external_io_off_summary": {
    "projected_candidate_fixture_count": 5,
    "pickup_posture_row_count": 13,
    "future_pickup_eligible_count": 0,
    "held_by_external_io_count": 5,
    "rejected_before_pickup_count": 8,
    "provider_packets": 0,
    "discovery_pickup_packets_created": 0,
    "bucket_rows_persisted": 0,
    "writes": 0
  }
}
```

Held sample:

```json
{
  "pickup_posture": "held_by_external_io",
  "reason": "external_io_off_holds_provider_movement_after_watch_projection",
  "watch_emission_failure": false,
  "starts_discovery_pickup": false,
  "discovery_pickup_started": false,
  "provider_packets": 0,
  "candidate_refs_written": 0,
  "evidence_eveidence_written": 0,
  "bucket_row_persisted": false
}
```

## Verification

Syntax checks:

```txt
node --check src\main\services\watchBucketPickupPostureBridgeService.js
node --check scripts\verify-watch-bucket-pickup-posture-bridge.js
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
npm.cmd run verify:watch-bucket-pickup-posture-bridge
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- `verify:watch-bucket-pickup-posture-bridge` passed
- `verify:service-registry` passed
- `verify:command-authority` passed
- `verify:passive-side-effects` passed
- `verify:enforcement-dry-run` passed with 120/120 commands covered and no gaps

Final hygiene:

```txt
git diff --check
git status --short --branch
```

Results:

- `git diff --check` passed with CRLF normalization warnings only
- `git status --short --branch` reported branch `main...origin/main [ahead 19]` with the existing broad uncommitted/untracked milestone stack plus HS472 files

## Boundary Confirmation

No schema, durable bucket rows, Watch row/cadence mutation, `fetch_runs` as bucket state, `discovered_killmail_refs` as pre-acquisition Watch bucket state, Watch executor tick, TaskRunner, collectors, Discovery pickup, zKill, ESI, Evidence writer, Hydration, Observation, dispatcher, queue, lease, enforcement, UI, provider calls, candidate refs, Discovery refs, Evidence/EVEidence writes, source-term rename, or protected-word JSON update was added.

## Risks / Notes

- Projected Watch bucket candidates remain fixture input only.
- Future pickup eligible does not authorize or start Discovery pickup.
- External I/O hold is represented as future provider movement hold, not Watch emission failure.
- Durable bucket persistence and pickup lease/queue behavior remain unimplemented.

## Recommended Next Action

Overseer review HS472. If accepted, the next seam can decide whether to continue with a disposable bucket write fixture or a Discovery pickup consumer hold contract, still without provider movement.
