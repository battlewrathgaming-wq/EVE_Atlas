# OverseerHS427 - HS426 Actor Watch Production-Adjacent Adapter Insertion Trace Review

Status: accepted
Date: 2026-06-11
Role: Overseer

## Reviewed

- `workspace/OverseerHS426-actor-watch-production-adjacent-adapter-insertion-trace-request.md`
- `workspace/EngineeringTraceHS426-actor-watch-production-adjacent-adapter-insertion.md`
- `workspace/current.md`
- `workspace/overview.md`

## Result

HS426 is accepted.

The trace answers the insertion-point question clearly. Atlas can open a narrow disabled actor Watch controlled adapter seam if it remains separate from production `actor.watch`, scheduled Watch dispatch, live providers, and operator corpus writes.

## Accepted Findings

- Do not insert inside production `actor.watch`.
- Do not branch `runActorWatchService(...)` by payload flag.
- Do not change `watchExecutor.dispatchFor(...)`, `WatchSessionExecutor.tick(...)`, or `TaskRunner`.
- A disabled seam should be a separate non-renderer command.
- The disabled seam should use fake/injected provider clients only.
- The seam may use internal disposable DB mutation only, with operator DB non-mutation proof.
- Return shape must preserve the HS423 direct compatibility summary and scheduled-style `data.collection` wrapper posture.
- Old terms such as `collection`, `collection_plan`, `expansion_queue`, `zkill_refs_discovered`, and `zkill_discovery_skipped` remain compatibility/debug fields only.

## Accepted Naming

Use:

```txt
watch.actor_controlled_adapter_disabled.preview
```

This name is explicit enough to avoid implying production redirect or default actor Watch behavior.

## Boundary Decision

Accepted for next Dev packet:

- create a disabled non-renderer service command
- classify it as fixture/proof-only, not production execution
- wire command authority / service registry / enforcement dry-run / passive side-effect coverage
- return the accepted direct compatibility summary shape
- expose scheduled-style wrapper posture without invoking scheduled Watch runtime

Not accepted:

- production `actor.watch` redirect
- scheduled Watch redirect
- `runActorWatchService(...)` replacement
- `watchExecutor.dispatchFor(...)` replacement
- `collectActorWatch(...)` retirement
- live zKill or ESI movement
- operator DB Discovery/Evidence writes from the new seam
- durable Discovery task/packet persistence
- dispatcher / queue / lease / enforcement runtime activation
- renderer UI

## Next Runway

Open HS428:

`workspace/OverseerHS428-actor-watch-controlled-adapter-disabled-seam-runway.md`

Expected handoff:

`workspace/DevHS428-actor-watch-controlled-adapter-disabled-seam.md`

## Verification Note

Review was documentary/source-trace only. No provider calls, code execution, schema changes, runtime redirects, or operator DB writes were performed.
