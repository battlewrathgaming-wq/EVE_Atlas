# DevHS332 Watch Executor Tick Dry-Run Preview

Status: complete
Date: 2026-06-06
Role: Dev

## Scope

Implemented the HS332 read-only/local-only Watch executor tick dry-run preview.

Preferred command added:

```txt
watch.executor_tick_dry_run.preview
```

Pure helper added:

```txt
dryRunExecutorTickDecision(...)
```

The preview reports what the next executor tick would do before task creation, without calling `WatchSessionExecutor.tick(...)`, arming/disarming runtime, starting intervals, creating tasks, dispatching collectors, calling providers, mutating Watch rows, writing Discovery/Evidence/Hydration/metadata/API log rows, changing schema, adding UI, activating enforcement, or creating support artifacts.

## Files Changed

- `package.json`
- `src/main/watchlist/watchExecutor.js`
- `src/main/services/watchExecutorTickDryRunService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-watch-executor-tick-dry-run.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-enforcement-dry-run.js`
- `workspace/current.md`
- `workspace/DevHS332-watch-executor-tick-dry-run-preview.md`

## Decision Shape

The service output includes:

- `decision.status`: `blocked`, `idle`, or `would_dispatch`
- `decision.reason` and `decision.reason_codes`
- `selected_watch` when selection occurs
- `would_be_command` and `would_be_payload_shape`
- `would_be_payload` only when a valid would-dispatch command/payload shape is available
- `live_gate` compact read-only posture from `actionGate(...)`
- `schedule_summary` and full schedule readout
- `selected_scope_authority` and `selected_invalid_scope_diagnostic`
- explicit non-authority flags:
  - `dry_run_is_authorization: false`
  - `would_dispatch_is_execution_authority: false`
  - `task_creation_authorized: false`
- mutation boundary counters at zero and `table_mutation_proof.unchanged: true`

System/radius would-be payloads are sourced from `watch.runtime_packet_plan.preview`, so valid rows use stored accepted `included_system_ids`, center/radius remain provenance/management, and invalid stored scope blocks before any task/payload shape is emitted.

## Sample Outputs

Blocked, disarmed:

```json
{
  "decision": {
    "status": "blocked",
    "reason": "session_not_armed",
    "reason_codes": ["session_not_armed"],
    "would_select_watch": false,
    "would_dispatch_watch": false,
    "would_create_task": false
  },
  "selected_watch": null
}
```

Idle, no due Watches:

```json
{
  "decision": {
    "status": "idle",
    "reason": "no_due_watches",
    "reason_codes": ["no_due_watches"],
    "waiting_is_failure": false,
    "would_select_watch": false,
    "would_dispatch_watch": false
  },
  "schedule_summary": {
    "due_count": 0,
    "selected_count": 0
  }
}
```

System/radius would-dispatch preview:

```json
{
  "decision": {
    "status": "would_dispatch",
    "reason": "would_dispatch",
    "reason_codes": ["would_dispatch"],
    "would_select_watch": true,
    "would_dispatch_watch": true,
    "would_create_task": false,
    "provider_calls": 0,
    "writes": 0
  },
  "selected_watch": {
    "watch_type": "system_radius",
    "watch_id": 1,
    "scope_key": "system:30003597:radius:1"
  },
  "would_be_command": "system.radius.watch",
  "would_be_payload_shape": {
    "includes_accepted_system_ids": true,
    "accepted_system_count": 3,
    "accepted_scope_source": "stored_watch_scope"
  }
}
```

Invalid stored scope:

```json
{
  "decision": {
    "status": "blocked",
    "reason": "watch_scope_authority_invalid",
    "reason_codes": ["watch_scope_authority_invalid"]
  },
  "would_be_command": null,
  "would_be_payload": null,
  "selected_invalid_scope_diagnostic": {
    "diagnostic_parseable_system_ids": [30003597],
    "accepted_authority": false,
    "execution_authority": false
  }
}
```

## Renderer Eligibility

Renderer eligibility was included because the command is read-only, non-authorizing, and reports preview posture only. The service command remains classified as `read-only` with effect `read-only`; it does not expose execution authority or run target handlers.

## Verification

Passed:

```txt
node --check src\main\watchlist\watchExecutor.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-watch-executor-tick-dry-run.js
npm.cmd run verify:watch-executor-tick-dry-run
npm.cmd run verify:watch-runtime-packet-plan
npm.cmd run verify:watch-executor
npm.cmd run verify:watch-scheduler
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

- `session_not_armed`
- `active_task`
- `live_api_disabled`
- `no_due_watches`
- `watch_scope_authority_invalid`
- actor `would_dispatch`
- system/radius `would_dispatch` using stored accepted IDs
- multiple due Watches selecting one stable candidate

`verify:protected-terms` exited 0 with warning-only advisory output; no renames or protected-word JSON updates were performed.

`git diff --check` passed; Git emitted CRLF normalization warnings only.

`git status --short --branch` after implementation:

```txt
## main...origin/main [ahead 3]
 M package.json
 M scripts/verify-command-authority.js
 M scripts/verify-enforcement-dry-run.js
 M scripts/verify-passive-side-effects.js
 M scripts/verify-service-registry.js
 M src/main/services/enforcementDryRunService.js
 M src/main/services/serviceRegistry.js
 M src/main/watchlist/watchExecutor.js
 M workspace/current.md
?? scripts/verify-watch-executor-tick-dry-run.js
?? src/main/services/watchExecutorTickDryRunService.js
?? workspace/DevHS332-watch-executor-tick-dry-run-preview.md
```

## Boundary Confirmation

No Watch execution, task creation, provider movement, collector calls, live/API calls, Watch row mutation, Discovery ref mutation, Evidence/EVEidence writes, Hydration/metadata writes, API log/warning writes, schema changes, runtime enforcement, command blocking, UI work, support artifacts, durable Watch result identity, relationship tags, protected-word JSON changes, or fourth-lane behavior were opened.
