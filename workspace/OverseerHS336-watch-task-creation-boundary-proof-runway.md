# OverseerHS336 Watch Task-Creation Boundary Proof Runway

Status: open
Date: 2026-06-06
Role: Overseer
Executor: Dev

## Human Intent

Near-term Atlas development remains:

```txt
How does Evidence get generated from user intent?
```

HS327 proved packet-plan posture. HS332 proved executor tick dry-run posture. HS334 proved packet-plan / dry-run / `dispatchFor(...)` parity. The next smallest seam is the boundary where a selected Watch would become an evidence-creating task, without actually creating that task or touching providers.

## Milestone

Atlas Storage And Runtime Hardening

## Current Packet

Add a read-only/local-only task-creation boundary proof for Watch execution.

Preferred command:

```txt
watch.task_creation_boundary.preview
```

Alternative name is acceptable if it clearly remains a preview/proof and does not imply task creation.

## Product Requirement

Atlas should prove the exact task envelope that would be created from accepted Watch intent before task creation is allowed.

The proof should answer:

- what selected Watch would create a task, if real execution were later authorized?
- what task `type`, `classification`, and `scopeKey` would be used?
- does the task envelope match the selected command/payload from `watch.packet_dry_run_dispatch_parity.preview`?
- does actor Watch task shape preserve the same actor payload meaning?
- does system/radius Watch task shape preserve stored accepted `included_system_ids` and center/radius provenance?
- does invalid stored scope block before task shape?
- do disarmed, active-task, live/provider-gated, inactive, not-due, backoff, and no-due states avoid task shape?
- is the task runner untouched?

## Core Rule

```txt
task boundary proof may describe the task envelope
task boundary proof must not create the task
```

## Technical Requirement

Implement a read-only service preview that composes existing local/pure sources where possible:

- `watch.packet_dry_run_dispatch_parity.preview`
- `watch.executor_tick_dry_run.preview`
- `watch.runtime_packet_plan.preview`
- `TaskRunner` task definition semantics, without calling `runTask`, `runDetachedTask`, `prepareTask`, or `createTask`

The preview may compute the would-task envelope as plain data only:

```txt
type: watch.executor.<dispatch command>
classification: evidence-creating
scopeKey: selected Watch scope key
```

It should also report:

- `would_create_task: false`
- `task_creation_authorized: false`
- `task_runner_methods_called: []`
- `task_runner_untouched: true`
- `tasks_created: 0`
- unchanged table counts

## Required Cases

Verifier fixtures should prove at least:

- due actor Watch:
  - selected command is `actor.watch`;
  - would-task type is `watch.executor.actor.watch`;
  - classification is `evidence-creating`;
  - scopeKey matches the selected actor Watch scope key;
  - actor payload meaning matches the HS334 parity payload.
- due system/radius Watch:
  - selected command is `system.radius.watch`;
  - would-task type is `watch.executor.system.radius.watch`;
  - classification is `evidence-creating`;
  - scopeKey matches the selected system/radius Watch scope key;
  - payload uses stored accepted `included_system_ids`;
  - center/radius remain provenance/management.
- invalid stored system/radius Watch:
  - no would-task envelope is emitted;
  - reason is `watch_scope_authority_invalid`;
  - task runner is not touched.
- disarmed / active-task / live-provider-gated / no-due / inactive / not-due / backoff:
  - no would-task envelope is emitted;
  - state is blocked, idle, skipped, or diagnostic-only as appropriate;
  - no task runner method is called.
- mutation boundary:
  - zero tasks created;
  - zero provider calls;
  - zero Watch mutations;
  - zero Discovery/Evidence/Hydration/API log/warning writes;
  - unchanged table counts.

## Boundaries

Do not:

- create tasks
- call `TaskRunner.runTask`
- call `TaskRunner.runDetachedTask`
- call `TaskRunner.prepareTask`
- call `TaskRunner.createTask`
- call `WatchSessionExecutor.tick(...)`
- execute a Watch
- arm/disarm Watch runtime
- start or stop executor intervals
- invoke dispatch runners
- call collectors
- call zKillboard, ESI, or any provider
- perform live/API calls
- mutate Watch rows
- mutate Discovery refs
- write Evidence/EVEidence
- write Hydration/metadata labels
- write API logs or warnings
- change `watch.create`
- change topology traversal behavior
- infer execution authority from center/radius
- persist runtime packet rows
- create a broad provider queue
- change schema
- implement renderer UI
- add popup/modal behavior
- redesign R-Scanner
- activate runtime enforcement or command blocking
- create support artifacts
- add durable Watch result identity
- add relationship tags
- rename source-owned terms
- update protected-word JSON
- open fourth-lane behavior

## Verification

Run focused checks:

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

If names differ, explain actual verifier/command names in the handoff.

## Expected Handoff

Create:

```txt
workspace/DevHS336-watch-task-creation-boundary-proof.md
```

The handoff should include:

- files changed;
- command/helper names added;
- sample actor task-envelope preview;
- sample system/radius task-envelope preview;
- invalid stored scope result;
- blocked/idle/skipped state treatment;
- task-runner non-use proof;
- mutation boundary proof;
- verification commands and results;
- explicit statement that no task creation, Watch execution, provider movement, writes, schema, UI, or enforcement was opened.

## Stop Conditions

Stop and report if:

- proof requires creating a task;
- proof requires calling any TaskRunner task-creation method;
- proof requires `WatchSessionExecutor.tick(...)`;
- proof requires calling collectors/runners;
- proof requires provider/live calls;
- proof requires Watch row mutation;
- proof requires schema changes;
- task envelope mismatch reveals a product/authority decision rather than a mechanical fix;
- implementation would imply execution readiness, task authorization, or provider authorization.
