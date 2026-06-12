# OverseerHS482 - Product Watch Bucket Persistence Runway

Status: open
Date: 2026-06-12
Executor: Dev
Expected handoff: `workspace/DevHS482-product-watch-bucket-persistence.md`

## Purpose

Add the smallest product Watch bucket persistence surface needed to carry emitted Watch work identity for system/radius Watches.

This packet moves from fixture-only bucket semantics into product local persistence, but it must not start Discovery pickup or provider movement.

## Source Context

Read first:

- `workspace/current.md`
- `workspace/OverseerHS481-hs480-watch-bucket-schema-runtime-design-review.md`
- `workspace/ArchitectureDataHS480-watch-bucket-schema-runtime-design.md`
- `workspace/ExternalIntegrationHS480-provider-policy-watch-bucket-discovery-pickup-design-pressure.md`
- `docs/adr/ADR-0007-watch-bucket-and-provenance-preserving-dedupe.md`
- `workspace/DevHS476-watch-bucket-disposable-persistence-fixture.md`
- `workspace/DevHS478-discovery-pickup-consumer-hold-contract.md`

## Required Behavior

Implement minimal durable Watch bucket support for system/radius emitted work identity:

- create a product bucket table or equivalent durable storage in Atlas schema
- add repository/service behavior to create/read open Watch bucket items locally
- enforce one open item per Watch
- generate `watch_run_id` inside trusted local service logic from accepted Watch/stub basis
- store accepted system/radius scope snapshot from Watch emission basis
- store window/cap/provenance snapshot sufficient for restart recovery and later Discovery pickup
- support readout/verifier proof for restart-safe duplicate suppression
- allow bucket row creation even when External I/O is off

Accepted alpha bucket lifecycle statuses:

```txt
open
settled
cancelled
blocked_integrity
```

`held_by_external_io` must not be persisted as a bucket lifecycle status. It is provider/Discovery movement posture only.

## Scope Limits

This packet is system/radius only.

Actor Watch migration remains parked. Do not change direct/scheduled actor Watch runtime behavior.

No renderer/user-supplied bucket row should be authoritative. Bucket rows must come from trusted local Watch/stub/emission basis.

Nullable receipt/provider fields are allowed only as inert schema shape. Do not implement receipt mutation.

## Must Not Include

Do not add:

- Discovery pickup execution
- provider packets
- zKill calls
- ESI calls
- candidate refs
- Discovery ref writes
- Evidence/EVEidence writes
- Hydration
- Observation/reporting behavior
- Watch cadence mutation
- leases
- dispatcher runtime
- broad queue behavior
- UI
- `collectActorWatch(...)` retirement
- system/radius collector redirect
- source-term rename
- protected-word JSON updates

## Acceptance Criteria

Dev handoff must show:

- `fetch_runs` is not used as bucket state
- `discovered_killmail_refs` is not used as pre-acquisition Watch bucket state
- Evidence/EVEidence tables are not mutated
- a valid system/radius Watch emission basis can create one open bucket item
- re-emitting the same Watch while open is idempotent or suppressed
- same Watch with mismatched open identity produces an integrity conflict/readout
- same `watch_run_id` mismatch produces integrity error/readout
- overlapping system scopes for different Watches coexist
- stale missed intervals collapse to one current open item and do not create catch-up rows
- External I/O off does not block bucket row creation
- External I/O off creates no provider packets and no Discovery refs
- Watch cadence rows are not mutated by bucket emission
- command/service output reports provider/Discovery/Evidence side effects as zero

## Verification Expected

Add a focused verifier, likely:

```txt
npm.cmd run verify:watch-bucket-product-persistence
```

Also run relevant existing checks touched by command registration/schema/service changes, such as:

```txt
node --check <new/changed files>
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

If schema changes are made, include explicit evidence of the schema diff and migration/syntax check used.

## Stop Conditions

Stop and report rather than expanding scope if:

- durable bucket identity requires a wider migration than expected
- current Watch/source schema cannot supply accepted system/radius scope safely
- External I/O is still blocking Watch emission in the path you need
- implementing this safely requires Discovery pickup, provider packet, dispatcher, lease, or Watch cadence mutation behavior
- actor Watch changes appear necessary

