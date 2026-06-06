# DevHS336 Watch Task-Creation Boundary Proof

Status: complete
Date: 2026-06-06
Role: Dev

## Scope

Implemented the HS336 read-only/local-only Watch task-creation boundary proof.

Preferred command added:

```txt
watch.task_creation_boundary.preview
```

The proof describes the would-task envelope as plain data only:

```txt
type: watch.executor.<dispatch command>
classification: evidence-creating
scopeKey: selected Watch scope key
```

It does not call `TaskRunner.runTask`, `TaskRunner.runDetachedTask`, `TaskRunner.prepareTask`, `TaskRunner.createTask`, `WatchSessionExecutor.tick(...)`, dispatch runners, collectors, providers, or live/API paths.

## Files Changed

- `package.json`
- `src/main/services/watchTaskCreationBoundaryService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-watch-task-creation-boundary.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-enforcement-dry-run.js`
- `workspace/current.md`
- `workspace/DevHS336-watch-task-creation-boundary-proof.md`

## Command / Helper Names

Added service:

```txt
watch.task_creation_boundary.preview
```

The service composes:

- `watch.packet_dry_run_dispatch_parity.preview`
- TaskRunner task definition semantics as plain data

TaskRunner proof fields:

- `would_create_task: false`
- `task_creation_authorized: false`
- `task_runner_untouched: true`
- `task_runner_methods_called: []`
- `tasks_created: 0`

## Sample Actor Task Envelope

```json
{
  "task_envelope_status": "would_task_envelope_available",
  "task_envelope_reason": "selected_watch_payload_parity_matches",
  "would_task_envelope": {
    "type": "watch.executor.actor.watch",
    "classification": "evidence-creating",
    "scopeKey": "actor:character:90000001",
    "selected_command": "actor.watch",
    "selected_payload_shape": {
      "entity_type": "character",
      "entity_id": 90000001,
      "lookback_seconds": 1209600,
      "max_refs": 5,
      "max_expansions": 5
    },
    "plain_data_only": true,
    "would_create_task": false,
    "task_creation_authorized": false
  },
  "task_runner_methods_called": [],
  "task_runner_untouched": true
}
```

## Sample System/Radius Task Envelope

```json
{
  "task_envelope_status": "would_task_envelope_available",
  "task_envelope_reason": "selected_watch_payload_parity_matches",
  "would_task_envelope": {
    "type": "watch.executor.system.radius.watch",
    "classification": "evidence-creating",
    "scopeKey": "system:30003597:radius:1",
    "selected_command": "system.radius.watch",
    "selected_payload_shape": {
      "center_system_id": 30003597,
      "radius_jumps": 1,
      "accepted_system_ids": [30003597, 30003599, 30003601],
      "accepted_scope_source": "stored_watch_scope",
      "lookback_seconds": 86400,
      "max_systems": 3,
      "max_refs_per_system": 2,
      "max_expansions": 6
    },
    "selected_payload_authority": {
      "uses_stored_included_system_ids": true,
      "accepted_scope_source": "stored_watch_scope",
      "center_radius_role": "provenance_and_management",
      "center_radius_used_as_authority": false
    },
    "plain_data_only": true,
    "would_create_task": false,
    "task_creation_authorized": false
  }
}
```

## Invalid Stored Scope

Invalid stored system/radius scope emits no task envelope:

```json
{
  "task_envelope_status": "blocked_no_task_envelope",
  "task_envelope_reason": "watch_scope_authority_invalid",
  "would_task_envelope": null,
  "task_runner_methods_called": [],
  "task_runner_untouched": true
}
```

## Blocked / Idle / Skipped Treatment

The verifier proves no task envelope for:

- disarmed session: `session_not_armed`
- active task: `active_task`
- live/provider gate disabled: `live_api_disabled`
- no due Watches: `no_due_watches`
- inactive, not-due, and backoff rows: skipped/blocked by parity rows and no selected task shape

## TaskRunner Non-Use Proof

The focused verifier injects a sentinel TaskRunner whose task-creation methods throw if called:

- `runTask`
- `runDetachedTask`
- `prepareTask`
- `createTask`

All cases passed with `taskRunner.calls` unchanged as `[]`.

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
node --check src\main\services\watchTaskCreationBoundaryService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-watch-task-creation-boundary.js
npm.cmd run verify:watch-task-creation-boundary
npm.cmd run verify:watch-packet-dry-run-dispatch-parity
npm.cmd run verify:watch-executor-tick-dry-run
npm.cmd run verify:watch-runtime-packet-plan
npm.cmd run verify:task-runner
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Note: first `npm.cmd run verify:service-registry` invocation timed out at 120 seconds without reporting completion; rerun with a 240 second timeout passed.

`verify:protected-terms` exited 0 with warning-only advisory output; no renames or protected-word JSON updates were performed.

`git diff --check` passed; Git emitted CRLF normalization warnings only.

## Boundary Confirmation

No task creation, TaskRunner task-creation method call, `WatchSessionExecutor.tick(...)`, Watch execution, runtime arm/disarm, interval change, dispatch runner invocation, collector call, provider movement, live/API call, Watch row mutation, Discovery ref mutation, Evidence/EVEidence write, Hydration/metadata write, API log/warning write, `watch.create` change, topology behavior change, runtime packet persistence, broad provider queue, schema change, renderer UI work, popup/modal behavior, R-Scanner redesign, runtime enforcement, command blocking, support artifact, durable Watch result identity, relationship tag, protected-word JSON update, or fourth-lane behavior was opened.
