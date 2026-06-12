# OverseerHS463 - System/Radius Watch Run Stub Projection Runway

Status: open  
Date: 2026-06-12  
Executor: Dev  
Expected handoff: `workspace/DevHS463-system-radius-watch-run-stub-projection.md`

## Purpose

Add a read-only, no-provider proof that system/radius Watch can express one due run as a bounded Watch-run stub using accepted stored scope.

This proves the Watch-side ask before buckets, dispatcher behavior, Discovery pickup, provider movement, Evidence/EVEidence writes, or cadence mutation.

## Context

Accepted stable line:

```txt
Watch scheduled work bucket
-> Discovery repeatable handling/recovery
-> settled factual receipt
-> Watch bucket/cadence interpretation
```

EngineeringSourceTraceHS462 recommends the smallest next proof:

```txt
Prove a no-provider Watch-run stub projection for system/radius Watch.
```

Current adjacent proof surfaces already exist and should be reused or referenced where appropriate:

```txt
watch.runtime_packet_plan.preview
watch.executor_tick_dry_run.preview
watch.discovery_pickup_packet_proof.preview
```

HS463 should not duplicate Discovery pickup or task creation. It should clarify the Watch-run stub as the bounded handoff intention from Watch.

## Scope

Add a read-only/local-only command, suggested:

```txt
watch.system_radius_run_stub.preview
```

The proof should:

- fixture or read a stored system/radius Watch
- prove accepted stored `included_system_ids` are the execution scope
- represent exactly one due Watch run stub
- include `watch_id`
- include a deterministic or fixture-only `watch_run_id`
- include accepted system IDs
- include center/radius as provenance/explanation, not execution authority
- include lookback/window
- include caps/limits
- include emitted/due time
- include source intent: Watch/system-radius
- include scope provenance
- state that the stub is not Evidence/EVEidence, not Discovery refs, not provider execution, and not Observation
- state that the stub is candidate input for later bucket/Discovery pickup behavior, not the bucket itself

Suggested shape:

```txt
watch_run_stub: {
  watch_id,
  watch_run_id,
  source_kind: "watch_system_radius",
  accepted_scope: {
    execution_authority: "stored_included_system_ids",
    included_system_ids,
    center_system_id,
    radius_jumps,
    center_radius_is_provenance_only: true
  },
  window: {
    lookback_seconds,
    due_at,
    emitted_at
  },
  caps,
  provenance,
  boundary_flags
}
```

Use exact field names that fit the existing code style.

## Boundaries

Do not:

- create durable bucket rows
- create real/product Watch run rows
- call `watchExecutor.tick(...)`
- dispatch Watch work
- call `TaskRunner`
- invoke old collectors
- call zKillboard, ESI, or any provider
- write `discovered_killmail_refs`
- write Evidence/EVEidence
- write Hydration/metadata
- write API logs or warnings
- mutate Watch rows or cadence state
- decide Discovery outcome
- implement receipt handling
- implement dispatcher, queue, lease, retry, or External I/O behavior
- change schema
- change system/radius runtime behavior
- retire `collectSystemRadiusWatch(...)` or `collectActorWatch(...)`
- change actor Watch behavior
- change UI, storage enforcement, source terms, or protected-word JSON

## Parked Tension

Do not resolve this question in HS463:

```txt
Should Watch emit durable bucket work while External I/O is closed,
or only mark due work as eligible until the gate opens?
```

HS463 may report the tension as parked. It must not implement either policy.

## Acceptance Criteria

- the proof exposes one bounded system/radius Watch-run stub from accepted stored scope
- accepted `included_system_ids` are the execution authority
- center/radius are provenance/explanation only after acceptance
- invalid stored scope produces no valid run stub and reports the reason
- disarmed, inactive, not-due, or blocked examples do not emit a valid run stub
- no provider calls, durable writes, Watch mutations, task creation, bucket persistence, or Discovery pickup occurs
- the proof clearly separates:
  - Watch run stub
  - future bucket work
  - future Discovery pickup
  - Evidence/EVEidence
  - Observation

## Verification

Add a focused verifier, suggested:

```txt
npm.cmd run verify:watch-system-radius-run-stub
```

Also run syntax checks for touched files.

If service registry, command authority, passive side-effect, or enforcement dry-run coverage changes, run the matching focused verifiers.

Do not run live/provider verification.

