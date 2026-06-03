# DevHS254 Queue / Clock No-Intent Semantics Matrix

Executor: Dev

Date: 2026-06-03

Status: Complete; pending Overseer review.

## Summary

Implemented the HS254 read-only queue/clock no-intent semantics matrix for:

```txt
runtime.queue_clock_posture.preview
```

The preview now distinguishes provider capability from current provider-backed work. The core accepted meaning is:

```txt
provider capability exists != current provider-backed work exists
```

No new product command was added.

## Implementation

Updated `src/main/services/queueClockPostureService.js` so the zKill Discovery lane no longer counts provider capability as current work when Atlas has:

- no pending/failed Discovery refs
- no explicit manual discovery scope
- no due/eligible Watch acquisition intent with valid scope

Kept existing fields while clarifying their meaning:

- `provider_backed_work` now means current provider-backed work.
- `current_provider_backed_work` is emitted explicitly with the same count.
- `provider_capability_available` shows known provider capability without implying work exists.
- `requires_explicit_scope_or_watch_intent` is true for capability-only zKill posture.
- `manual_discovery_intent` reports absent, incomplete, or present explicit manual scope.
- `watch_acquisition_intent` reports Watch acquisition intent separately from Watch/background Hydration.

Added summary fields:

- `current_provider_backed_work`
- `provider_capability_available_lanes`
- `capability_only_lanes`

Manual discovery intent is no longer inferred from the queue-clock provider gate default. It is present only when explicit discovery gate input is supplied.

## Matrix Cases Covered

Added:

```txt
npm.cmd run verify:queue-clock-no-intent
```

Verifier:

```txt
scripts/verify-queue-clock-no-intent-semantics.js
```

Covered:

1. Empty DB / no Watch / no manual discovery scope.
2. No pending refs and no explicit manual or Watch acquisition intent.
3. Explicit manual discovery scope.
4. Pending/failed Discovery refs.
5. Due/eligible Watch acquisition intent with valid scope.
6. Not-due, inactive, missing, or malformed Watch acquisition posture.
7. Watch/background Hydration demand without Watch acquisition intent.
8. Summary provider-backed current-work counts exclude capability-only posture.

## Output Semantics

zKill Discovery no-intent posture:

```json
{
  "provider_capability_available": true,
  "current_provider_backed_work": 0,
  "provider_backed_work": 0,
  "requires_explicit_scope_or_watch_intent": true,
  "manual_discovery_intent": {
    "state": "absent"
  },
  "watch_acquisition_intent": {
    "state": "absent"
  }
}
```

Explicit manual discovery scope:

```json
{
  "manual_discovery_intent": {
    "state": "present"
  },
  "current_provider_backed_work": 1,
  "requires_explicit_scope_or_watch_intent": false
}
```

Due valid Watch acquisition intent:

```json
{
  "manual_discovery_intent": {
    "state": "absent"
  },
  "watch_acquisition_intent": {
    "state": "present",
    "current_provider_backed_work": 1
  },
  "current_provider_backed_work": 1
}
```

Watch/background Hydration demand remains separate:

```json
{
  "zkill_discovery.current_provider_backed_work": 0,
  "watch_background_hydration.current_provider_backed_work": 1,
  "watch_background_hydration.provider_action": "metadata.hydration"
}
```

## Sample Verifier Output

```json
{
  "status": "queue clock no-intent semantics verified",
  "required_cases_covered": 8,
  "semantics": {
    "provider_backed_work_means": "current_provider_backed_work",
    "provider_capability_available_is_counted_as_current_work": false,
    "manual_discovery_intent_requires_explicit_scope": true,
    "watch_acquisition_intent_distinct_from_hydration": true
  }
}
```

The populated queue-clock verifier still reports:

```json
{
  "provider_backed_work": 7,
  "current_provider_backed_work": 7,
  "provider_capability_available_lanes": 4,
  "capability_only_lanes": 1,
  "pending_discovery_refs_possible_leads": 3,
  "esi_expansion_candidates_from_local_refs": 3,
  "hydration_candidates": 4,
  "preview_authorizes_execution": false
}
```

## Files Changed

- `package.json`
- `scripts/verify-queue-clock-no-intent-semantics.js`
- `src/main/services/queueClockPostureService.js`
- `workspace/current.md`
- `workspace/DevHS254-queue-clock-no-intent-semantics-matrix.md`

## Verification

Commands run:

```txt
node --check src\main\services\queueClockPostureService.js
node --check scripts\verify-queue-clock-posture-preview.js
node --check scripts\verify-queue-clock-no-intent-semantics.js
npm.cmd run verify:queue-clock-no-intent
npm.cmd run verify:queue-clock-posture
npm.cmd run verify:patient-packet-identity-sparse
git diff --check
git status --short --branch
```

Results:

- All `node --check` commands passed.
- `npm.cmd run verify:queue-clock-no-intent` passed with 8 matrix cases covered.
- `npm.cmd run verify:queue-clock-posture` passed and preserved populated queue/clock behavior.
- `npm.cmd run verify:patient-packet-identity-sparse` passed.
- `git diff --check` passed with CRLF normalization warnings only.
- `git status --short --branch` showed branch `main...origin/main` with HS254 working-tree changes.

## Boundary Confirmation

Confirmed:

- no packet table
- no persisted queue
- no active dispatcher
- no provider calls
- no zKill Discovery execution
- no ESI Evidence Expansion execution
- no Hydration execution
- no Hydration writes
- no Evidence/EVEidence writes
- no Discovery ref mutation
- no Watch mutation or arming
- no Assessment Memory mutation
- no Marked mutation
- no storage config write
- no storage movement
- no support artifact creation
- no schema changes
- no runtime enforcement activation
- no command blocking
- no pruning/deletion behavior
- no renderer UI work

The no-intent verifier checks table counts before and after preview calls to prove the preview remains passive.

## Parked

Still parked:

- packet persistence
- broad provider work queue
- schema-backed queues
- active dispatcher
- provider execution
- making `discovered_killmail_refs` the sequencer
- ESI Evidence Expansion scheduling
- provider-backed Hydration execution
- runtime enforcement activation
- command blocking
- support artifacts for packet state
- pruning/deletion execution
- renderer/UI work

## Recommended Next Action

Overseer review. If accepted, later dispatcher, enforcement, support artifact, or UI work should consume `current_provider_backed_work` and keep provider capability-only posture separate from current work.
