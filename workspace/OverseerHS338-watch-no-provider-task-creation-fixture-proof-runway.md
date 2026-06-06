# OverseerHS338 Watch No-Provider Task-Creation Fixture Proof Runway

Status: open
Date: 2026-06-06
Role: Overseer
Executor: Dev

## Human Intent

Atlas should keep narrowing the Watch path before any live Watch execution is considered.

The current heading remains:

```txt
How does Evidence get generated from user intent?
```

HS336 proved the would-task envelope without creating a task. The next smallest confidence step is a fixture-only task-creation proof that exercises the task boundary under controlled local conditions while still stopping before Watch execution and provider movement.

## Milestone

Atlas Storage And Runtime Hardening

## Current Packet

Add a fixture-only, no-provider Watch task-creation proof.

Suggested verifier / proof name:

```txt
verify:watch-task-creation-fixture-proof
```

Suggested helper name is flexible, but the proof should clearly remain fixture/test-controlled and must not become a renderer/product execution command unless explicitly accepted later.

## Product Requirement

Atlas should prove that an accepted Watch task envelope can be handed to task machinery in a controlled fixture without crossing into live Watch execution.

The proof should answer:

- can the HS336 would-task envelope be used as the task creation input?
- does the task keep `type`, `classification`, and `scopeKey` unchanged?
- does actor Watch task creation preserve actor payload meaning?
- does system/radius Watch task creation preserve stored accepted `included_system_ids`?
- does invalid stored scope still block before task creation?
- does task creation remain local fixture behavior only?
- does the created fixture task avoid invoking Watch dispatch runners, collectors, providers, or Evidence writes?

## Core Rule

```txt
fixture task creation may prove the task boundary
fixture task creation must not execute the Watch
fixture task creation must not become product authorization
```

## Technical Requirement

Implement the smallest fixture-only proof that uses the accepted HS336 task envelope shape:

```txt
type: watch.executor.<dispatch command>
classification: evidence-creating
scopeKey: selected Watch scope key
```

The proof may use disposable fixtures, stubbed task execution, or test-only local helpers. It must not create real app runtime tasks, persist task rows in the operator corpus, or expose a renderer command that implies user-facing task creation.

The proof should report:

- `fixture_only: true`
- `provider_movement: false`
- `watch_execution: false`
- `dispatch_runner_invoked: false`
- `collectors_called: false`
- `evidence_written: false`
- `task_shape_preserved: true`
- unchanged durable Atlas table counts outside disposable fixture scope

## Required Cases

Verifier fixtures should prove at least:

- due actor Watch:
  - task type is `watch.executor.actor.watch`;
  - classification is `evidence-creating`;
  - scopeKey matches the selected actor Watch scope key;
  - actor payload meaning matches HS336.
- due system/radius Watch:
  - task type is `watch.executor.system.radius.watch`;
  - classification is `evidence-creating`;
  - scopeKey matches the selected system/radius Watch scope key;
  - payload uses stored accepted `included_system_ids`;
  - center/radius remain provenance/management.
- invalid stored system/radius Watch:
  - no fixture task is created;
  - reason is `watch_scope_authority_invalid`.
- blocked/idle states:
  - disarmed, active-task, live/provider-gated, no-due, inactive, not-due, and backoff states create no fixture task.
- no-provider boundary:
  - no zKillboard call;
  - no ESI call;
  - no provider/live/API call;
  - no collector or dispatch runner invocation;
  - no Discovery ref mutation;
  - no Evidence/EVEidence write;
  - no Hydration/metadata write;
  - no API log/warning write.

## Boundaries

Do not:

- execute a Watch
- call provider-backed collectors
- call zKillboard, ESI, or any provider
- perform live/API calls
- invoke Watch dispatch runners
- write Discovery refs
- write Evidence/EVEidence
- write Hydration/metadata labels
- write API logs or warnings
- mutate real/operator Watch rows
- arm/disarm Watch runtime
- start or stop executor intervals
- persist real runtime packet rows
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
node --check <changed task fixture/proof files>
node --check src\main\services\watchTaskCreationBoundaryService.js
npm.cmd run verify:watch-task-creation-fixture-proof
npm.cmd run verify:watch-task-creation-boundary
npm.cmd run verify:watch-packet-dry-run-dispatch-parity
npm.cmd run verify:watch-executor-tick-dry-run
npm.cmd run verify:task-runner
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If actual names differ, explain the actual commands in the handoff.

## Expected Handoff

Create:

```txt
workspace/DevHS338-watch-no-provider-task-creation-fixture-proof.md
```

The handoff should include:

- files changed;
- fixture/proof helper names added;
- sample actor fixture task shape;
- sample system/radius fixture task shape;
- invalid stored scope result;
- blocked/idle state treatment;
- no-provider/no-execution proof;
- mutation boundary proof;
- verification commands and results;
- explicit statement that live Watch execution, provider movement, Discovery refs, Evidence/EVEidence, Hydration, schema, UI, enforcement, support artifacts, durable Watch results, relationship tags, and fourth-lane behavior remain unopened.

## Stop Conditions

Stop and report if:

- proof requires provider/live calls;
- proof requires invoking real dispatch runners or collectors;
- proof requires Evidence/EVEidence writes;
- proof requires Discovery ref writes;
- proof requires real/operator runtime task persistence;
- proof requires schema changes;
- task shape mismatch reveals a product/authority decision rather than a mechanical fix;
- implementation would imply live Watch execution readiness without a separate Human/Overseer decision.
