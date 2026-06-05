# Overseer HS292 - Watch / Task Outcome Map Preview Runway

Status: active
Date: 2026-06-05
Project: AURA Atlas
Executor: Dev
Expected handoff: `workspace/DevHS292-watch-task-outcome-map-preview.md`

## Purpose

Add a read-only, local-only Watch/task origin and durable outcome map preview.

This packet should prove Atlas can explain what work originated where, which state is volatile, and which local rows prove durable outcomes without creating `watch_result`, dispatching work, changing schema, or mutating Evidence/EVEidence.

Preferred command:

```txt
runtime.watch_task_outcome_map.preview
```

## Context

Accepted advisory and review:

- `workspace/EngineeringDataHS290-watch-task-outcome-map-assurance-scope.md`
- `workspace/OverseerHS291-hs290-watch-task-outcome-map-assurance-review.md`

Accepted boundary:

```txt
Evidence records what happened.
Provenance records how Atlas got it.
Watch/task result readouts group what a specific scope/run found.
Observation interprets/group-presents local records.
Assessment remains human judgment.
```

This packet is a read-only preview only. It is not durable result/schema work.

## Task

Build a read-only Watch/task outcome map preview from existing local rows.

The preview should disclose, without dispatching or writing:

- origin kind:
  - Manual Discovery
  - Manual Expansion
  - Watch authoring
  - Watch schedule readout
  - Watch executor dispatch
  - Actor Watch collection
  - System/radius Watch collection
- operator act or trigger;
- service command;
- whether state is volatile or durable;
- expected durable rows;
- latest matching `fetch_runs`, where computable;
- Discovery ref counts by status;
- Evidence/EVEidence counts;
- warning/error/deferral basis;
- Watch row and schedule posture if applicable;
- task volatility warning;
- system/radius authored scope versus current collector-planned scope, if computable from existing local state;
- whether queue identity is center-only or center-plus-radius/watch-capable;
- explicit statement that no `watch_result` or relationship tag exists.

Prefer a narrow deterministic preview over a broad report. It may expose representative sections rather than every possible historical row.

## Required Boundaries

Do not:

- call providers
- run live/API verification
- dispatch Watch execution
- arm Watch execution
- create task runs
- create queues, Bucket, Dispatcher, worker, lease, retry, or persisted work
- add schema
- create `watch_result` or `watch_result_items`
- write relationship tags
- mutate Evidence/EVEidence
- mutate Discovery refs
- mutate Watch rows
- mutate Assessment Memory
- add renderer/UI behavior
- activate runtime enforcement or command blocking
- create support artifacts
- reopen fourth lane / fast lane
- rename Atlas terms

## Acceptance Criteria

- Preview is read-only and renderer-eligible only if consistent with existing service patterns.
- Preview clearly marks task state as volatile.
- Preview clearly marks `fetch_runs` / durable local rows as durable provenance or outcome evidence.
- Manual Discovery maps to Discovery refs only and does not imply Evidence.
- Manual Expansion maps to Evidence/EVEidence and run provenance.
- Watch authoring maps to durable intent rows only.
- Watch schedule/offline state maps to derived posture only.
- Watch executor dispatch maps to volatile task movement and durable collector outputs only if dispatch has occurred.
- Watch collection maps to `fetch_runs`, Discovery refs, Evidence/EVEidence, API logs, warnings, and Watch schedule updates.
- System/radius section compares authored stored included/excluded scope against current collector-planned scope where computable.
- System/radius queue identity posture discloses center-only versus center-plus-radius/watch capability.
- Preview explicitly states no durable `watch_result`, `watch_result_items`, relationship tag, or relationship truth exists.
- Verifier proves no provider calls, no task dispatch, and no table writes.

## Suggested Verification

Run focused checks:

```txt
node --check src\main\services\serviceRegistry.js
node --check [new service file]
node --check [new verifier file]
npm.cmd run verify:[new-watch-task-outcome-map-preview]
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
```

Run protected terms if emitted terms or labels change:

```txt
npm.cmd run verify:protected-terms
```

Run `git diff --check` and `git status --short --branch`.

## Stop Conditions

Stop and return to Overseer if:

- provider contact becomes necessary
- Watch execution or task dispatch becomes necessary
- writes become necessary
- schema changes become necessary
- `watch_result` / `watch_result_items` creation becomes necessary
- relationship tags become necessary
- durable task persistence becomes necessary
- Bucket/Dispatcher/queue machinery becomes necessary
- renderer/UI behavior becomes necessary
- the implementation would mutate Evidence/EVEidence, Discovery refs, Watch rows, or Assessment Memory
- terminology blurs Evidence, Provenance, Watch/task result readout, Observation, or Assessment

## Expected Handoff

Create:

```txt
workspace/DevHS292-watch-task-outcome-map-preview.md
```

Include:

- files changed
- command/readout added
- sample output
- how origin/outcome sections are derived
- durable versus volatile classification
- radius scope comparison behavior
- queue identity disclosure
- boundaries preserved
- verification commands and results
- parked items
