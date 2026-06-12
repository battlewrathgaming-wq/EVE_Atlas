# OverseerHS445 - HS444 Scheduled Actor Watch Redirect Readiness Review

Status: accepted
Date: 2026-06-12
Role: Overseer

## Reviewed Artifact

```txt
workspace/EngineeringTraceHS444-scheduled-actor-watch-redirect-readiness.md
```

## Result

HS444 is accepted.

Scheduled actor Watch is ready for a narrow Dev runway that redirects only the actor scheduled runner path to the boundary-owned actor Watch route.

This does not authorize collector retirement, system/radius movement, provider/live verification, Watch cadence redesign, Discovery task persistence, dispatcher work, schema, UI, or enforcement.

## Accepted Findings

Current scheduled actor Watch path:

```txt
WatchSessionExecutor.tick(...)
-> buildWatchScheduleStatus(...)
-> selectDueWatch(...)
-> dispatchFor(watch)
-> actionGate(dispatch.command, dispatch.payload)
-> taskRunner.runDetachedTask(...)
-> dispatch.runner(dispatch.payload, { ...dependencies, db, signal })
-> recordWatchRunResult(...)
-> task result { status: 'succeeded', data: { watch, collection } }
```

Direct actor Watch path after HS440:

```txt
serviceRegistry
-> runActorWatchService(...)
-> runActorWatchDirectBody(...)
```

Accepted distinction:

- direct service path owns input resolution and direct service gate checks
- scheduled Watch path owns due selection, task creation, active-task lock behavior, task signal, result wrapping, and Watch cadence/result recording
- scheduled redirect should not route through `runActorWatchService(...)`
- scheduled redirect should swap the actor runner target only, either directly to `runActorWatchDirectBody(...)` or through a thin scheduled actor runner wrapper

## Required Preservation

Future Dev work must preserve:

- `WatchSessionExecutor.tick(...)` behavior
- `TaskRunner` behavior
- `recordWatchRunResult(...)` behavior
- task classification as `evidence-creating`
- `data.watch` and `data.collection` result wrapping
- 22-field actor Watch compatibility summary
- task signal propagation into provider-facing body
- direct `actor.watch` path from HS440
- system/radius Watch legacy path
- `collectActorWatch(...)` availability until explicit retirement

## Main Risk

The trace found that a simple `runner: runActorWatchDirectBody` is mechanically plausible, but the actual risk is scheduler-level: task/cadence/result wrapping belongs to `WatchSessionExecutor`, not to the direct body.

The next packet must therefore prove scheduled executor behavior directly.

## Next Runway

Open:

```txt
workspace/OverseerHS446-scheduled-actor-watch-redirect-runway.md
```

Expected Dev handoff:

```txt
workspace/DevHS446-scheduled-actor-watch-redirect.md
```

Purpose:

Redirect only scheduled actor Watch to the boundary-owned actor Watch route while preserving scheduler/task/cadence/result semantics.
