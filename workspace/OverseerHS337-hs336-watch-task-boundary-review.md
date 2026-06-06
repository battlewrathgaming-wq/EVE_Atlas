# OverseerHS337 HS336 Watch Task Boundary Review

Status: accepted
Date: 2026-06-06
Role: Overseer

## Reviewed Handoff

```txt
workspace/DevHS336-watch-task-creation-boundary-proof.md
```

## Decision

HS336 is accepted.

Atlas now has a read-only/local-only proof for the Watch task-creation boundary.

Accepted command:

```txt
watch.task_creation_boundary.preview
```

## Accepted Result

- The preview describes the would-task envelope as plain data only.
- The accepted would-task shape is:
  - `type: watch.executor.<dispatch command>`
  - `classification: evidence-creating`
  - `scopeKey: selected Watch scope key`
- Due actor Watch produces would-task type `watch.executor.actor.watch`.
- Due system/radius Watch produces would-task type `watch.executor.system.radius.watch`.
- The system/radius task envelope preserves stored accepted `included_system_ids`.
- Center/radius remain provenance/management, not execution authority.
- Invalid stored scope emits no task envelope and reports `watch_scope_authority_invalid`.
- Disarmed, active-task, live/provider-gated, no-due, inactive, not-due, and backoff states emit no task envelope.
- TaskRunner task-creation methods are not called.

## Boundary Confirmation

No task creation, `TaskRunner.runTask`, `TaskRunner.runDetachedTask`, `TaskRunner.prepareTask`, `TaskRunner.createTask`, `WatchSessionExecutor.tick(...)`, Watch execution, runtime arm/disarm, interval change, dispatch runner invocation, collector call, provider movement, live/API call, Watch row mutation, Discovery ref mutation, Evidence/EVEidence write, Hydration/metadata write, API log/warning write, `watch.create` change, topology behavior change, runtime packet persistence, broad provider queue, schema change, renderer UI work, popup/modal behavior, R-Scanner redesign, runtime enforcement, command blocking, support artifact, durable Watch result identity, relationship tag, protected-word JSON update, or fourth-lane behavior was opened.

## Verification

Overseer reran:

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
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
npm.cmd run verify:service-registry
npm.cmd run verify:passive-side-effects
```

Results:

- All verification commands passed.
- `verify:service-registry` passed with a 240 second timeout after Dev reported an initial 120 second timeout.
- `verify:protected-terms` produced warning-only advisory output and exit code 0; no renames or protected-word JSON updates were performed.
- `git diff --check` passed with CRLF normalization warnings only.

## Resting State

HS336 can rest. The Watch setup -> packet plan -> dry-run -> dispatch payload-builder -> task-envelope chain is coherent without creating tasks or moving providers.

Do not open real task creation, Watch execution, provider movement, live testing, durable Watch results, schema, UI, active enforcement, support artifacts, relationship tags, or fourth-lane behavior without a new bounded decision.

## Candidate Next Seams

1. Watch execution-adjacent readiness advisory before any real task creation.
2. A no-provider task creation fixture proof, if Human/Overseer accept task creation as the next movement seam.
3. Rest Watch runtime and return to Manual Discovery as the second path for how Evidence gets generated from user intent.

Human / Overseer should choose the next seam before Dev is reopened.
