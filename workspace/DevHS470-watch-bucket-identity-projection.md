# DevHS470 - Watch Bucket Identity Projection

Status: ready for Overseer review  
Date: 2026-06-12  
Executor: Dev  
Runway: HS470 Watch bucket identity projection fixture proof

## Summary

Implemented a read-only fixture/projection proof command:

```txt
watch.bucket_identity_projection.preview
```

The proof takes fixture Watch-run stubs and fixture existing-open stub state, then reports projected bucket candidates, duplicate-open suppressions, allowed overlaps, integrity conflicts, integrity errors, and boundary flags.

This is not schema, not runtime bucket behavior, not Discovery pickup, not provider movement, and not Evidence/EVEidence movement.

## Files Changed

```txt
src/main/services/watchBucketIdentityProjectionService.js
src/main/services/serviceRegistry.js
src/main/services/enforcementDryRunService.js
scripts/verify-watch-bucket-identity-projection.js
scripts/verify-service-registry.js
scripts/verify-command-authority.js
scripts/verify-passive-side-effects.js
scripts/verify-enforcement-dry-run.js
package.json
workspace/current.md
workspace/DevHS470-watch-bucket-identity-projection.md
```

## Command Shape

Registered renderer-eligible read-only command:

```txt
watch.bucket_identity_projection.preview
```

Input posture:

```txt
watchRunStubs: fixture/current Watch-run stub shapes
existingOpenStubs: fixture existing-open state only
externalIoState: fixture External I/O posture
```

Output posture:

```txt
projected_bucket_candidates
duplicate_open_suppressions
allowed_overlaps
integrity_conflicts
integrity_errors
rejected_stubs
candidate_ref_killmail_overlap_principle
```

All output uses projected/candidate/fixture language and avoids accepted schema language.

## Behavior Proven

- due valid system/radius Watch with no existing open stub emits one projected candidate
- due valid system/radius Watch with existing open stub for the same Watch emits no candidate and reports duplicate-open suppression
- stale Watch with multiple missed intervals emits one current candidate only and zero catch-up candidates
- overlapping included systems across different Watches are allowed
- same Watch with mismatched existing open scope/provenance flags an integrity conflict
- same `watch_run_id` with mismatched Watch/scope/window/provenance flags an integrity error
- External I/O closed still allows Watch bucket candidate projection while provider packets remain zero and Discovery pickup is not started
- invalid stored scope emits no candidate
- not-due, inactive, and backoff stubs emit no candidate
- candidate-ref / killmail overlap is represented as principle-only with no writes and no provenance-table claim

## Sample Output

From `npm.cmd run verify:watch-bucket-identity-projection`:

```json
{
  "status": "Watch bucket identity projection verified",
  "command": "watch.bucket_identity_projection.preview",
  "summary": {
    "input_stub_count": 12,
    "existing_open_stub_fixture_count": 3,
    "projected_bucket_candidate_count": 5,
    "duplicate_open_suppression_count": 1,
    "allowed_overlap_count": 10,
    "integrity_conflict_count": 1,
    "integrity_error_count": 2,
    "rejected_stub_count": 4,
    "provider_packets": 0,
    "discovery_pickup_packets_created": 0,
    "bucket_rows_persisted": 0,
    "writes": 0
  },
  "external_io_posture": {
    "state": "off",
    "watch_bucket_candidate_projection_blocked": false,
    "external_io_is_provider_movement_gate": true,
    "provider_packets": 0,
    "discovery_pickup_started": false,
    "posture": "external_io_pickup_hold_after_watch_projection"
  }
}
```

Candidate sample:

```json
{
  "candidate_language": "projected_candidate_fixture_only",
  "candidate_is_schema": false,
  "candidate_is_durable_row": false,
  "existing_open_state_source": "fixture_input_only",
  "bucket_identity": {
    "identity_basis": "watch_run_based",
    "system_id_identity_rejected": true
  },
  "boundary_flags": {
    "provider_packets": 0,
    "discovery_pickup_started": false,
    "discovery_refs_written": 0,
    "evidence_eveidence_written": 0,
    "bucket_row_persisted": false,
    "watch_cadence_mutated": false
  }
}
```

## Verification

Syntax checks:

```txt
node --check src\main\services\watchBucketIdentityProjectionService.js
node --check scripts\verify-watch-bucket-identity-projection.js
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
npm.cmd run verify:watch-bucket-identity-projection
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- `verify:watch-bucket-identity-projection` passed
- `verify:service-registry` passed
- `verify:command-authority` passed
- `verify:passive-side-effects` passed
- `verify:enforcement-dry-run` passed with 119/119 commands covered and no gaps

Final hygiene:

```txt
git diff --check
git status --short --branch
```

Results:

- `git diff --check` passed with CRLF normalization warnings only
- `git status --short --branch` reported branch `main...origin/main [ahead 19]` with the existing broad uncommitted/untracked milestone stack plus HS470 files

## Boundary Confirmation

No schema, durable bucket rows, Watch row/cadence mutation, `fetch_runs` as bucket state, `discovered_killmail_refs` as pre-acquisition Watch bucket state, Watch executor tick, TaskRunner, collectors, Discovery pickup, zKill, ESI, Evidence writer, Hydration, Observation, dispatcher, queue, lease, enforcement, UI, provider calls, Discovery refs, Evidence/EVEidence writes, source-term rename, or protected-word JSON update was added.

## Risks / Notes

- Existing-open state is fixture input only. The proof does not claim durable Atlas bucket state exists.
- `watch_run_id` strings are fixture identity values only and do not decide a production generation algorithm.
- Allowed overlaps prove bucket identity posture only; they do not claim durable many-Watch provenance is implemented.

## Recommended Next Action

Overseer review HS470. If accepted, the next seam can decide whether to continue with another read-only bridge toward Discovery pickup hold behavior or a disposable write fixture for bucket persistence, still without providers.
