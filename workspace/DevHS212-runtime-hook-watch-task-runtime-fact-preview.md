# DevHS212 Runtime Hook Watch/Task Runtime Fact Preview

Status: complete; pending Overseer review.

## Scope

Implemented HS212 only: compact, read-only `watch_runtime` fact sourcing for the inactive runtime enforcement hook preview.

## Files Changed

- `src/main/services/serviceRegistry.js`
- `src/main/services/runtimeEnforcementDryAdapter.js`
- `src/main/services/runtimeEnforcementEvaluator.js`
- `src/main/services/runtimeHookTelemetryReadoutService.js`
- `scripts/verify-runtime-enforcement-hook.js`
- `scripts/verify-runtime-hook-telemetry.js`
- `workspace/current.md`
- `workspace/DevHS212-runtime-hook-watch-task-runtime-fact-preview.md`

## Fact Shape Added

The inactive hook now sources `watch_runtime` facts for:

- `actor.watch`
- `system.radius.watch`
- `watch.executor.arm`
- `watch.executor.tick`

Compact fact shape includes:

```json
{
  "fact_class": "watch_runtime",
  "fact_source": "runtime_hook_read_only_watch_task_runtime_snapshot",
  "source_status": "sourced_watch_task_runtime_snapshot",
  "applies": true,
  "state": "watch_executor_arm_pre_handler_intent",
  "watch_command_kind": "watch_executor_arm",
  "provider_backed_watch_command": true,
  "pre_handler_snapshot": true,
  "session_arm_is_provider_permission": false,
  "may_run_now_authorization": false,
  "renderer_authoritative": false,
  "non_authorizing_preview": true
}
```

The fact reads only volatile executor fields and task-runner list posture. It does not call `watch.executor.status`, because that status helper can clear stale active task IDs. Missing/stale/malformed task posture is reported as posture instead of guessed.

## Commands Covered

- `actor.watch` reports `direct_actor_watch_collection`.
- `system.radius.watch` reports `direct_system_radius_watch_collection`.
- `watch.executor.arm` reports `watch_executor_arm` and keeps arming distinct from provider movement permission.
- `watch.executor.tick` reports `watch_executor_tick`.
- Non-Watch commands report `applies: false` / `state: not_applicable`.

Renderer payload claims such as `watch_runtime`, `sessionArmed`, and `activeTaskId` are ignored and not echoed in hook facts.

## Limitations

- `watch_runtime` is a volatile runtime/task-memory snapshot, not durable recovery state.
- Active task state is sourced from in-memory task listings only.
- The preview does not answer "may run now" and does not become runtime authorization.

## Verification

Passed:

- `node --check src\main\services\serviceRegistry.js`
- `node --check src\main\services\runtimeEnforcementDryAdapter.js`
- `node --check src\main\services\runtimeEnforcementEvaluator.js`
- `node --check src\main\services\runtimeHookTelemetryReadoutService.js`
- `node --check scripts\verify-runtime-enforcement-hook.js`
- `node --check scripts\verify-runtime-hook-telemetry.js`
- `npm.cmd run verify:runtime-enforcement-hook`
- `npm.cmd run verify:runtime-hook-telemetry`
- `npm.cmd run verify:runtime-enforcement-adapter`
- `npm.cmd run verify:enforcement-dry-run`
- `npm.cmd run verify:gate-stack-readout`
- `npm.cmd run verify:watch-executor`
- `npm.cmd run verify:watch-offline-readout`
- `npm.cmd run verify:task-runner`
- `npm.cmd run verify:task-concurrency`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:protected-terms`

Focused proof included:

- `watch_runtime_sourced: true`
- `actor_watch_runtime_sourced: true`
- `system_radius_watch_runtime_sourced: true`
- `watch_executor_runtime_sourced: true`
- `malformed_watch_runtime_reported_as_posture: true`
- `active_runtime_enforcement: false`
- `command_blocking: false`
- `target_handlers_called_by_hook: false`
- `task_runners_called_by_hook: false`
- `providers_called_by_hook: false`

`verify:protected-terms` passed with warning-only advisory output: 152 warnings across 6 changed working-set files; no renames or protected-word JSON updates performed.

## Boundary Confirmation

Preserved:

- no active runtime enforcement
- no command blocking
- no handler dispatch from the hook
- no task wrapping or task execution from the hook
- no provider calls
- no provider attempt recording
- no service-memory cooldown/lockout mutation from the hook
- no Watch arming/disarming/tick execution from the hook
- no Watch mutation from the hook
- no DB writes from the hook
- no config writes
- no support artifact creation
- no snapshot or trace-pack creation
- no storage movement or migration
- no Hydration writes
- no Evidence/EVEidence creation
- no Discovery ref mutation
- no Assessment Memory or Marked mutation
- no schema changes
- no renderer UI work
- no pruning or deletion behavior
- no terminology renames

## Recommended Next Action

Overseer review. If accepted, the runtime hook fact spine has the Watch/task runtime gap closed for inactive proofing; active enforcement semantics should still remain unopened until explicitly scoped.
