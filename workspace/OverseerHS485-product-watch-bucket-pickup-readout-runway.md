# OverseerHS485 - Product Watch Bucket Pickup Readout Runway

Status: open
Date: 2026-06-12
Executor: Dev
Expected handoff: `workspace/DevHS485-product-watch-bucket-pickup-readout.md`

## Purpose

Add the smallest read-only product Watch bucket pickup readout over real `watch_bucket_items` rows.

HS482 created durable system/radius Watch bucket identity. This packet should prove Atlas can inspect those open rows and classify their future Discovery pickup posture without beginning Discovery pickup or provider movement.

## Source Context

Read first:

- `workspace/current.md`
- `workspace/OverseerHS484-hs482-product-watch-bucket-persistence-review.md`
- `workspace/DevHS482-product-watch-bucket-persistence.md`
- `workspace/OverseerHS481-hs480-watch-bucket-schema-runtime-design-review.md`
- `workspace/ArchitectureDataHS480-watch-bucket-schema-runtime-design.md`
- `workspace/ExternalIntegrationHS480-provider-policy-watch-bucket-discovery-pickup-design-pressure.md`
- `docs/adr/ADR-0007-watch-bucket-and-provenance-preserving-dedupe.md`
- `workspace/DevHS478-discovery-pickup-consumer-hold-contract.md`

## Required Behavior

Implement a read-only product bucket pickup readout that:

- reads existing `watch_bucket_items` rows
- focuses on open system/radius bucket rows only
- classifies rows into future pickup posture such as:
  - `future_pickup_eligible`
  - `held_by_external_io`
  - `rejected_before_pickup_consumption`
  - `not_pickup_input`
- reports per-row basis sufficient to explain the classification
- treats External I/O as a provider-movement gate, not Watch emission failure
- does not persist `held_by_external_io` as a bucket lifecycle status
- reports that Discovery pickup has not started
- reports zero provider packets, candidate refs, Discovery refs, Evidence/EVEidence writes, Hydration writes, Watch cadence mutations, and receipt mutations

This should be a readout/inspection surface over product rows, not a fixture-only projected candidate surface.

## Scope Limits

This packet is read-only.

It may use fixture/temp DB setup in the verifier to seed product `watch_bucket_items` rows, but the service behavior being proved should inspect product-shaped rows rather than disposable fixture schema.

System/radius only. Actor Watch bucket rows may be reported as unsupported/not pickup input, but actor Watch migration remains parked.

## Must Not Include

Do not add:

- Discovery pickup execution
- leases
- dispatcher runtime
- queue runtime
- provider packets
- zKill calls
- ESI calls
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

- product `watch_bucket_items` rows can be inspected without mutation
- open system/radius rows can be classified for future pickup eligibility
- External I/O off reports `held_by_external_io` as provider movement posture
- External I/O on can report `future_pickup_eligible` for valid open rows
- unsupported actor rows do not become pickup eligible
- non-open rows do not become pickup eligible
- malformed/missing scope rows are rejected before pickup consumption
- no bucket lifecycle status is changed by the readout
- `held_by_external_io` is not persisted as lifecycle status
- no Discovery pickup starts
- no provider packets are created
- no Discovery refs, candidate refs, Evidence/EVEidence, Hydration, Observation, Watch cadence, receipt, or UI side effects occur

## Verification Expected

Add a focused verifier, likely:

```txt
npm.cmd run verify:watch-bucket-product-pickup-readout
```

Also run relevant command registration and passive side-effect checks touched by the new readout, such as:

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

- classifying real product rows requires mutation
- pickup eligibility cannot be derived from current bucket rows
- row classification requires starting Discovery pickup
- row classification requires provider packet creation
- actor Watch migration appears necessary
- durable receipt/pickup/lease semantics become necessary to finish

