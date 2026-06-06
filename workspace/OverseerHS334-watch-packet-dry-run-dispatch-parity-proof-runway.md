# OverseerHS334 Watch Packet / Dry-Run / Dispatch Parity Proof Runway

Status: open
Date: 2026-06-06
Role: Overseer
Executor: Dev

## Human Intent

Near-term Atlas development should focus on:

```txt
How does Evidence get generated from user intent?
```

For now, continue through Watch first, then later return to Manual Discovery.

HS327 proved Watch runtime packet-plan posture. HS332 proved Watch executor tick dry-run posture before task creation. Before moving closer to real task creation or provider movement, Atlas should prove that the read-only planning surfaces and the real executor dispatch payload builder stay aligned.

## Milestone

Atlas Storage And Runtime Hardening

## Current Packet

Add a read-only/local-only parity proof between:

```txt
watch.runtime_packet_plan.preview
watch.executor_tick_dry_run.preview
watchExecutor.dispatchFor(...)
```

Preferred command:

```txt
watch.packet_dry_run_dispatch_parity.preview
```

Alternative name is acceptable if it clearly remains a read-only parity proof across packet plan, dry-run, and dispatch payload shape.

## Product Requirement

Atlas should be able to prove that the Watch surfaces which explain future Evidence generation from user intent are not drifting apart.

The proof should answer:

- does packet-plan preview produce the same command as the dry-run preview?
- does dry-run preview produce the same command as `dispatchFor(...)` would for the selected Watch?
- do actor payloads preserve the same entity, lookback, cap, and command shape?
- do system/radius payloads preserve stored accepted `included_system_ids`, center/radius provenance, lookback, cap, and command shape?
- does invalid stored scope block across all three surfaces before task creation?
- are any differences intentional, disclosed, and non-authorizing?

## Core Rule

```txt
parity proof compares future movement shape
parity proof does not move
```

## Technical Requirement

Implement a read-only service preview that composes existing local/pure sources:

- `watch.runtime_packet_plan.preview`
- `watch.executor_tick_dry_run.preview`
- `dispatchFor(...)`

The preview may use fixture/current local Watch rows and should compare command and payload shape for actor and system/radius Watches where possible.

The preview must not call `WatchSessionExecutor.tick(...)`, arm/disarm runtime, start intervals, call collectors, call providers, or create tasks.

If calling `dispatchFor(...)` is used, it must be only as a pure payload builder against already selected local schedule rows and must not invoke `runner`.

## Required Cases

Verifier fixtures should prove at least:

- due actor Watch:
  - packet plan command equals dry-run command equals `dispatchFor(...)` command;
  - payload meaning matches entity type, entity ID, entity name, lookback seconds, max refs, and max expansions.
- due system/radius Watch:
  - packet plan command equals dry-run command equals `dispatchFor(...)` command;
  - payload uses stored accepted `included_system_ids`;
  - center/radius remain provenance/management;
  - max systems, max refs per system, max expansions, and lookback seconds match.
- invalid stored system/radius Watch:
  - packet plan has no runtime packet;
  - dry-run blocks with `watch_scope_authority_invalid`;
  - `dispatchFor(...)` throws/blocks with `watch_scope_authority_invalid`;
  - no command/payload/task shape is emitted as accepted movement.
- not-due/backoff/inactive cases:
  - packet plan and dry-run do not imply dispatch;
  - any `dispatchFor(...)` comparison is either skipped or clearly diagnostic-only.
- mutation boundary:
  - zero tasks created;
  - zero provider calls;
  - zero Watch mutations;
  - zero Discovery/Evidence/Hydration/API log/warning writes;
  - unchanged table counts.

## Boundaries

Do not:

- execute a Watch
- call `WatchSessionExecutor.tick(...)`
- arm/disarm Watch runtime
- start or stop executor intervals
- create Watch executor tasks
- call zKillboard, ESI, or any provider
- perform live/API calls
- call collectors or dispatch runners
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

If names differ, explain actual verifier/command names in the handoff.

## Expected Handoff

Create:

```txt
workspace/DevHS334-watch-packet-dry-run-dispatch-parity-proof.md
```

The handoff should include:

- files changed;
- command/helper names added;
- sample actor parity result;
- sample system/radius parity result;
- invalid stored scope parity result;
- skipped/diagnostic treatment for non-selected/non-due rows;
- mutation boundary proof;
- verification commands and results;
- explicit statement that no Watch execution, task creation, provider movement, or writes were opened.

## Stop Conditions

Stop and report if:

- parity requires task creation;
- parity requires calling collectors/runners;
- parity requires provider/live calls;
- parity requires Watch row mutation;
- parity requires schema changes;
- `dispatchFor(...)` is not safe to call as a pure payload builder;
- command/payload mismatch reveals a product/authority decision rather than a mechanical fix;
- implementation would imply execution readiness or authorization.
