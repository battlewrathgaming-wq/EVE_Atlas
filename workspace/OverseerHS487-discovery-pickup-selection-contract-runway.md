# OverseerHS487 - Discovery Pickup Selection Contract Runway

Status: open
Date: 2026-06-12
Executor: Dev
Expected handoff: `workspace/DevHS487-discovery-pickup-selection-contract.md`

## Purpose

Prove the next boundary after HS485: eligible product Watch bucket readout rows can be shaped into a Discovery pickup selection contract without starting Discovery pickup.

HS485 can inspect product `watch_bucket_items` rows and classify future pickup posture. HS487 should define the selected-input shape that Discovery pickup would later consume, while keeping movement closed.

## Source Context

Read first:

- `workspace/current.md`
- `workspace/OverseerHS486-hs485-product-watch-bucket-pickup-readout-review.md`
- `workspace/DevHS485-product-watch-bucket-pickup-readout.md`
- `workspace/OverseerHS485-product-watch-bucket-pickup-readout-runway.md`
- `workspace/OverseerHS479-hs478-discovery-pickup-consumer-hold-contract-review.md`
- `workspace/DevHS478-discovery-pickup-consumer-hold-contract.md`
- `docs/adr/ADR-0007-watch-bucket-and-provenance-preserving-dedupe.md`

## Required Behavior

Add a read-only, contract-only proof that:

- reads or receives product Watch bucket pickup readout rows
- selects only `future_pickup_eligible` open system/radius rows
- maps each selected row into a Discovery pickup selection candidate shape
- preserves Watch identity, `watch_run_id`, accepted scope snapshot, window, caps, provenance, and provider posture basis
- rejects or excludes:
  - `held_by_external_io`
  - `rejected_before_pickup_consumption`
  - `not_pickup_input`
  - unsupported actor rows
  - non-open rows
  - malformed/missing accepted scope rows
- reports why each excluded row is not selected
- reports selected rows as future Discovery pickup input only
- reports zero pickup units created, zero leases, zero provider packets, zero candidate refs, zero Discovery refs, zero Evidence/EVEidence writes, zero Hydration writes, zero Watch cadence mutations, zero receipt mutations, and zero bucket status mutations

This packet should prove selection shape only. It must not claim Discovery pickup has started.

## Scope Limits

System/radius only.

The output may be named as a selection contract or preview, but it must not be a queue, lease, dispatcher, provider packet, or durable Discovery task table.

Use product `watch_bucket_items` / HS485 readout semantics as the basis. Fixture/temp DB seeding in the verifier is acceptable, but the proved shape should remain product-row based.

## Must Not Include

Do not add:

- Discovery pickup execution
- provider packets
- zKill calls
- ESI calls
- leases
- dispatcher runtime
- queue runtime
- durable Discovery task table
- candidate refs
- Discovery ref writes
- Evidence/EVEidence writes
- Hydration
- Observation/reporting behavior
- Watch cadence mutation
- Watch bucket status mutation
- receipt mutation
- UI
- actor Watch migration
- `collectActorWatch(...)` retirement
- system/radius collector redirect
- source-term rename
- protected-word JSON updates

## Acceptance Criteria

Dev handoff must show:

- eligible product bucket readout rows can become Discovery pickup selection candidates
- selection candidates preserve Watch/run/scope/window/cap/provenance basis
- held rows are not selected
- invalid/rejected rows are not selected
- actor rows are not selected
- non-open rows are not selected
- overlapping Watch scopes remain independent selected candidates when both are eligible
- no provider packet or pickup unit is created
- no bucket row is mutated
- no receipt is mutated
- no candidate ref or Discovery ref is written
- no Evidence/EVEidence, Hydration, Observation, Watch cadence, dispatcher, lease, queue, enforcement, or UI behavior is opened

## Verification Expected

Add a focused verifier, likely:

```txt
npm.cmd run verify:discovery-pickup-selection-contract
```

Also run relevant shared checks touched by command registration or service metadata:

```txt
node --check <new/changed files>
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

If no schema changes are made, say that explicitly.

## Stop Conditions

Stop and report rather than expanding scope if:

- selection cannot be represented without mutation
- selection requires a durable Discovery task table
- selection requires provider packet creation
- selection requires starting dispatcher/lease/queue behavior
- receipt settlement becomes necessary
- actor Watch migration appears necessary

