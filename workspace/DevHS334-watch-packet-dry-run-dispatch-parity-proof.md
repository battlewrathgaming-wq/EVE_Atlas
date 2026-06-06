# DevHS334 Watch Packet / Dry-Run / Dispatch Parity Proof

Status: complete
Date: 2026-06-06
Role: Dev

## Scope

Implemented the HS334 read-only/local-only parity proof between:

```txt
watch.runtime_packet_plan.preview
watch.executor_tick_dry_run.preview
watchExecutor.dispatchFor(...)
```

Preferred command added:

```txt
watch.packet_dry_run_dispatch_parity.preview
```

The parity proof compares future movement shape only. It does not execute Watch, call `WatchSessionExecutor.tick(...)`, arm/disarm runtime, start intervals, create tasks, call collectors/runners, call providers, mutate rows, write Evidence/EVEidence, write Hydration/metadata labels, write API logs/warnings, change schema, create support artifacts, activate enforcement, or add UI.

## Files Changed

- `package.json`
- `src/main/watchlist/watchExecutor.js`
- `src/main/services/watchRuntimePacketPlanService.js`
- `src/main/services/watchPacketDryRunDispatchParityService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-watch-packet-dry-run-dispatch-parity.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-enforcement-dry-run.js`
- `workspace/current.md`
- `workspace/DevHS334-watch-packet-dry-run-dispatch-parity-proof.md`

## Command And Helper Shape

Added service:

```txt
watch.packet_dry_run_dispatch_parity.preview
```

The service composes existing read-only/pure sources:

- `buildWatchRuntimePacketPlanPreview(...)`
- `buildWatchExecutorTickDryRunPreview(...)`
- `dispatchFor(...)`

`dispatchFor(...)` is used only as a pure payload builder. The returned runner is reported as present but is never invoked.

Adjusted existing shapes for parity:

- `watch.runtime_packet_plan.preview` system/radius `payload_preview` now includes `acceptedScopeProvenance`, matching `dispatchFor(...)`.
- `acceptedSystemIdsForWatchSource(...)` now rejects malformed stored included-system arrays instead of filtering parseable IDs into a partial execution scope.

## Sample Actor Parity

```json
{
  "watch_type": "actor",
  "comparison_status": "matches",
  "command_parity": "matches",
  "payload_parity": "matches",
  "packet_plan_command": "actor.watch",
  "dry_run_command": "actor.watch",
  "dispatch_for_command": "actor.watch",
  "packet_payload_shape": {
    "entity_type": "character",
    "entity_id": 90000001,
    "lookback_seconds": 1209600,
    "max_refs": 5,
    "max_expansions": 5
  },
  "dispatch_for": {
    "status": "available",
    "runner_invoked": false,
    "runner_present_but_not_invoked": true
  }
}
```

## Sample System/Radius Parity

```json
{
  "watch_type": "system_radius",
  "comparison_status": "matches",
  "command_parity": "matches",
  "payload_parity": "matches",
  "packet_plan_command": "system.radius.watch",
  "dry_run_command": "system.radius.watch",
  "dispatch_for_command": "system.radius.watch",
  "packet_payload_shape": {
    "center_system_id": 30003597,
    "radius_jumps": 1,
    "accepted_system_ids": [30003597, 30003599, 30003601],
    "accepted_scope_source": "stored_watch_scope",
    "lookback_seconds": 86400,
    "max_systems": 3,
    "max_refs_per_system": 2,
    "max_expansions": 6
  },
  "dispatch_for": {
    "status": "available",
    "runner_invoked": false,
    "runner_present_but_not_invoked": true
  }
}
```

## Invalid Stored Scope Parity

```json
{
  "watch_type": "system_radius",
  "comparison_status": "matches",
  "command_parity": "blocked_in_all_surfaces",
  "payload_parity": "blocked_no_payload",
  "invalid_scope_parity": "matches_blocked_before_task_creation",
  "packet_plan_command": null,
  "dry_run_command": null,
  "dispatch_for_command": null,
  "dispatch_for": {
    "status": "blocked",
    "error_code": "watch_scope_authority_invalid",
    "runner_invoked": false
  }
}
```

## Skipped / Diagnostic Treatment

For inactive, not-due, and backoff rows:

- packet plan and dry-run do not imply dispatch;
- `dispatchFor(...)` comparison is skipped as diagnostic-only;
- skipped rows do not count as parity mismatch;
- no task/provider/write shape is emitted as accepted movement.

## Mutation Boundary Proof

The focused verifier asserts:

- zero tasks created
- zero dispatches
- zero dispatch runner invocations
- zero provider/live API calls
- zero Watch mutations
- zero Discovery refs mutated
- zero Evidence/EVEidence writes
- zero Hydration/metadata writes
- zero API log/warning writes
- unchanged table counts

## Verification

Passed:

```txt
node --check src\main\watchlist\watchExecutor.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check src\main\services\watchPacketDryRunDispatchParityService.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-watch-packet-dry-run-dispatch-parity.js
npm.cmd run verify:watch-packet-dry-run-dispatch-parity
npm.cmd run verify:watch-runtime-packet-plan
npm.cmd run verify:watch-executor-tick-dry-run
npm.cmd run verify:watch-executor
npm.cmd run verify:watch-scope-authority-conformance
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Focused verifier cases passed:

- due actor command/payload parity
- due system/radius command/payload parity using stored accepted IDs
- invalid stored scope blocked across packet plan, dry-run, and `dispatchFor(...)`
- inactive/not-due/backoff rows skipped as diagnostic-only

`verify:protected-terms` exited 0 with warning-only advisory output; no renames or protected-word JSON updates were performed.

`git diff --check` passed; Git emitted CRLF normalization warnings only.

## Boundary Confirmation

No Watch execution, `WatchSessionExecutor.tick(...)` call, runtime arm/disarm, interval change, task creation, provider movement, live/API call, collector/runner invocation, Watch row mutation, Discovery ref mutation, Evidence/EVEidence write, Hydration/metadata write, API log/warning write, `watch.create` change, topology behavior change, runtime packet persistence, broad provider queue, schema change, renderer UI work, popup/modal behavior, R-Scanner redesign, runtime enforcement, command blocking, support artifact, durable Watch result identity, relationship tag, protected-word JSON update, or fourth-lane behavior was opened.
