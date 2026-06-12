# OverseerHS422 - HS421 Actor Watch Compatibility Summary / Caller Return Path Review

Status: accepted
Date: 2026-06-11
Role: Overseer

## Reviewed

- `workspace/OverseerHS421-actor-watch-compatibility-summary-caller-return-path-request.md`
- `workspace/EngineeringTraceHS421-actor-watch-compatibility-summary-caller-return-path.md`
- `workspace/current.md`
- `workspace/overview.md`

## Result

HS421 is accepted.

The trace answers the requested return-path question clearly: Atlas can preserve the current caller-facing `actor.watch` compatibility summary shape through a boundary-owned adapter path without calling or importing `collectActorWatch(...)`, but only as a narrow proof step. It does not authorize production redirect, scheduled Watch redirect, live provider movement, or collector retirement.

## Accepted Findings

- Current direct `actor.watch` returns the summary object produced by `collectActorWatch(...)`.
- Current scheduled actor Watch wraps the runner result under `task.result.data.collection`.
- Scheduled Watch success is currently based on runner completion, not deep inspection of summary fields.
- No reviewed source proves a renderer/product UI currently depends directly on the production actor Watch summary.
- The boundary-owned fixture chain has already proven enough of the compatibility shape to justify a focused return-path proof.
- Old terms such as `collection`, `collection_plan`, and `expansion_queue` may remain compatibility/debug output only. They must not become future ownership language.

## Boundary Decision

Accepted:

- Use the current production summary fields as a compatibility projection target.
- Treat `data.collection` as temporary scheduled-wrapper compatibility.
- Centralize or extract a compatibility summary builder if needed to prevent field drift.
- Prove direct and scheduled-style return shapes without invoking production Watch execution.

Not accepted:

- production `actor.watch` redirect
- scheduled Watch redirect
- `runActorWatchService(...)` replacement
- `watchExecutor.dispatchFor(...)` replacement
- `collectActorWatch(...)` retirement
- live zKill or ESI movement
- operator DB Discovery/Evidence writes from the new path
- durable Discovery task/packet schema
- dispatcher, queue, lease, enforcement, or UI work

## Next Runway

Open HS423 as a narrow Dev packet:

`workspace/OverseerHS423-actor-watch-controlled-adapter-return-path-proof-runway.md`

Expected handoff:

`workspace/DevHS423-actor-watch-controlled-adapter-return-path-proof.md`

## Acceptance Notes For HS423

HS423 should prove the return path, not activate it.

The proof should show:

- direct caller return shape remains the summary object
- scheduled-style wrapper can preserve the summary under `data.collection`
- compatibility summary field-set parity is asserted against the production collector summary contract
- `collectActorWatch(...)` is neither imported nor invoked by the new proof path
- production `actor.watch`, `runActorWatchService(...)`, `watchExecutor.dispatchFor(...)`, and `collectActorWatch(...)` remain unchanged

## Verification

Review was documentary/source-trace only. No provider calls, code execution, schema changes, runtime redirects, or operator DB writes were performed.
