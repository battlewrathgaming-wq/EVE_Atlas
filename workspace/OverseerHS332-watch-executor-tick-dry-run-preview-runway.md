# OverseerHS332 Watch Executor Tick Dry-Run Preview Runway

Status: open
Date: 2026-06-06
Role: Overseer
Executor: Dev

## Human Intent

Prove that what Atlas has now works before building on top of it.

HS327 proved packet-plan shape. HS330 accepted that the next useful assurance is the real executor/tick movement boundary, inspected without movement.

## Milestone

Atlas Storage And Runtime Hardening

## Current Packet

Add a read-only/local-only Watch executor tick dry-run preview.

Preferred command:

```txt
watch.executor_tick_dry_run.preview
```

Alternative name is acceptable only if it clearly remains a dry-run preview of executor/tick movement before task creation.

## Product Requirement

Given current local Watch rows, schedule posture, executor-like state, and gate inputs, Atlas should report what a Watch executor tick would do if dispatch were allowed, without actually dispatching.

The preview should report:

- whether the tick would block, idle, select, or would-dispatch;
- reason codes for blocked/idle states;
- selected Watch, if any;
- selected Watch source and scope key;
- would-be command (`actor.watch` or `system.radius.watch`);
- would-be payload shape;
- whether selected system/radius payload uses stored accepted `included_system_ids`;
- whether invalid stored scope blocks before task creation;
- whether multiple due Watches select at most one stable candidate;
- whether waiting is not failure;
- explicit statement that this is not authorization and not dispatch.

## Core Rule

```txt
dry-run may say what would happen
dry-run must not make it happen
```

## Technical Requirement

Implement a read-only service preview that inspects the executor/tick decision boundary before task creation.

Use current executor source behavior as the target for parity where safe:

- `buildWatchScheduleStatus(...)`
- `selectDueWatch(...)`
- `dispatchFor(...)`
- `actionGate(...)`

Important:

- Do not call `WatchSessionExecutor.tick(...)` directly if doing so mutates executor state.
- Do not call `taskRunner.runDetachedTask(...)`.
- Do not call collectors.
- Do not arm/disarm the executor.
- Do not start intervals.

The dry-run should either:

1. use exported pure helpers from `watchExecutor.js`, or
2. add a small pure helper in/near `watchExecutor.js` that computes the dry-run decision without mutation, then expose it through a service command.

Prefer the least invasive approach that keeps executor decision parity easy to maintain.

## Required Cases

Verifier fixtures should prove at least:

- disarmed session blocks with `session_not_armed`;
- active task blocks without selecting a new Watch;
- live/provider gate disabled blocks before dispatch;
- no due Watches idles/waits and is not failure;
- inactive Watch does not become selected for dispatch;
- not-due Watch does not become selected for dispatch;
- backoff Watch does not become selected for dispatch;
- invalid stored system/radius scope blocks with `watch_scope_authority_invalid` and creates no would-dispatch payload;
- due actor Watch produces one would-dispatch payload for `actor.watch`;
- due system/radius Watch produces one would-dispatch payload for `system.radius.watch` using stored accepted IDs only;
- multiple due Watches select one stable candidate only;
- dry-run reports zero tasks created, zero dispatches, zero providers, zero writes, zero Watch mutations, and unchanged table counts.

## Boundaries

Do not:

- execute a Watch
- arm/disarm Watch runtime
- start or stop executor intervals
- create Watch executor tasks
- call zKillboard, ESI, or any provider
- perform live/API calls
- call collectors
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

If the verifier or service filename differs, update the handoff with actual names and why.

## Expected Handoff

Create:

```txt
workspace/DevHS332-watch-executor-tick-dry-run-preview.md
```

The handoff should include:

- files changed;
- command/helper names added;
- dry-run decision shape;
- sample blocked/idle/would-dispatch outputs;
- task/provider/write mutation boundary proof;
- whether renderer eligibility was included or intentionally withheld;
- verification commands and results;
- explicit statement that no Watch execution, task creation, provider movement, or writes were opened.

## Stop Conditions

Stop and report if:

- the dry-run requires real task creation;
- the dry-run requires calling collectors;
- the dry-run requires provider/live calls;
- the dry-run requires Watch row mutation;
- the dry-run requires schema changes;
- executor parity cannot be maintained without risky duplication;
- External I/O / live/provider gate facts are too ambiguous to represent safely;
- implementation would imply dry-run authorization or dispatch readiness.
