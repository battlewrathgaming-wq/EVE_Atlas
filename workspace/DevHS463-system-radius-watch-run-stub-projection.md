# DevHS463 - System/Radius Watch-Run Stub Projection

Status: ready for Overseer review  
Date: 2026-06-12  
Executor: Dev  
Runway: `workspace/OverseerHS463-system-radius-watch-run-stub-projection-runway.md`

## Summary

Implemented a read-only/local-only system/radius Watch-run stub preview:

```txt
watch.system_radius_run_stub.preview
```

The preview expresses exactly one eligible due system/radius Watch as a bounded `watch_run_stub` from accepted stored `included_system_ids`.

It does not create buckets, Watch run rows, Discovery pickup packets, Discovery refs, Evidence/EVEidence, Hydration, Observation, tasks, API logs, warnings, schema, UI, enforcement, or cadence mutation.

## Files Changed

```txt
src/main/services/watchSystemRadiusRunStubService.js
src/main/services/serviceRegistry.js
src/main/services/enforcementDryRunService.js
scripts/verify-watch-system-radius-run-stub.js
scripts/verify-service-registry.js
scripts/verify-command-authority.js
scripts/verify-passive-side-effects.js
scripts/verify-enforcement-dry-run.js
package.json
workspace/current.md
workspace/DevHS463-system-radius-watch-run-stub-projection.md
```

## Command Shape

Registered read-only renderer-eligible command:

```txt
watch.system_radius_run_stub.preview
```

Stub shape proven:

```txt
watch_run_stub: {
  watch_id,
  watch_run_id,
  source_kind: "watch_system_radius",
  accepted_scope: {
    execution_authority: "stored_included_system_ids",
    included_system_ids,
    center_system_id,
    center_system_name,
    radius_jumps,
    center_radius_is_provenance_only: true,
    center_radius_used_as_execution_authority: false
  },
  window: {
    lookback_seconds,
    due_at,
    emitted_at
  },
  caps,
  provenance,
  boundary_flags
}
```

## Behavior Proven

- accepted stored `included_system_ids` are the execution scope authority
- center/radius are carried as provenance and explanation only
- one eligible due system/radius Watch emits one fixture/deterministic stub
- invalid stored scope emits no stub
- parseable IDs inside invalid scope remain diagnostic-only
- disarmed, inactive, not-due, backoff, and live-gate-waiting rows emit no valid stub
- the stub is candidate input for later bucket or Discovery pickup behavior
- the stub is not a bucket, not Discovery pickup, not Discovery refs, not Evidence/EVEidence, and not Observation
- the parked External I/O bucket eligibility tension is reported but not resolved

## Sample Output

From `npm.cmd run verify:watch-system-radius-run-stub`:

```json
{
  "summary": {
    "system_radius_watch_count": 5,
    "due_system_radius_watch_count": 2,
    "valid_stub_count": 1,
    "emitted_stub_count": 1,
    "blocked_or_waiting_count": 4,
    "invalid_stored_scope_count": 1,
    "provider_calls": 0,
    "live_api_calls": 0,
    "writes": 0,
    "bucket_rows_created": 0,
    "discovery_pickup_packets_created": 0,
    "watch_mutations": 0,
    "parked_tension_resolved": false
  },
  "watch_run_stub": {
    "watch_id": 1,
    "watch_run_id": "fixture-watch-run:system-radius:1:20260612T120000000Z",
    "source_kind": "watch_system_radius",
    "accepted_scope": {
      "execution_authority": "stored_included_system_ids",
      "included_system_ids": [
        30003597,
        30003599,
        30003601
      ],
      "center_system_id": 30003597,
      "center_system_name": "Hare",
      "radius_jumps": 1,
      "center_radius_is_provenance_only": true,
      "center_radius_used_as_execution_authority": false
    },
    "window": {
      "lookback_seconds": 86400,
      "due_at": "2026-06-12T12:00:00.000Z",
      "emitted_at": "2026-06-12T12:00:00.000Z"
    },
    "caps": {
      "max_systems": 3,
      "max_refs_per_system": 2,
      "max_expansions": 6
    }
  }
}
```

## Verification

Syntax checks:

```txt
node --check src\main\services\watchSystemRadiusRunStubService.js
node --check scripts\verify-watch-system-radius-run-stub.js
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
npm.cmd run verify:watch-system-radius-run-stub
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- `verify:watch-system-radius-run-stub` passed
- `verify:service-registry` passed
- `verify:command-authority` passed
- `verify:passive-side-effects` passed
- `verify:enforcement-dry-run` passed with 118/118 commands covered and no gaps

Final hygiene:

```txt
git diff --check
git status --short --branch
```

Results:

- `git diff --check` passed with CRLF normalization warnings only
- `git status --short --branch` reported branch `main...origin/main [ahead 19]` with the existing broad uncommitted/untracked milestone stack plus HS463 files

## Boundary Confirmation

No provider calls, live/API calls, durable bucket rows, product Watch run rows, `WatchSessionExecutor.tick(...)`, Watch dispatch, `TaskRunner`, old collectors, zKillboard, ESI, `discovered_killmail_refs` writes, Evidence/EVEidence writes, Hydration/metadata writes, API logs, warnings, Watch row/cadence mutation, Discovery outcome decision, receipt handling, dispatcher/queue/lease/retry/External I/O policy, schema, system/radius runtime behavior, collector retirement, actor Watch behavior, UI, storage enforcement, source terms, or protected-word JSON changes were added.

## Risks / Notes

- The preview uses scheduler posture to identify due rows; it intentionally does not decide the parked External I/O bucket policy.
- The new command is a proof/readout surface only. Later bucket or Discovery pickup work still needs an explicit runway.
- The repository remains on a broad uncommitted milestone stack; HS463 changes were kept narrowly scoped within that state.

## Recommended Next Action

Overseer review HS463. If accepted, the next coherent seam is a separate runway deciding how the system/radius Watch-run stub should become either durable bucket work or gated eligibility without provider movement.
