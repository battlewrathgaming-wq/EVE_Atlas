# OverseerHS489 - Discovery Provider Route Packet Preview Runway

Status: open
Date: 2026-06-12
Executor: Dev
Expected handoff: `workspace/DevHS489-discovery-provider-route-packet-preview.md`

## Purpose

Prove that Discovery pickup selection candidates can be transformed into no-provider provider-route packet previews.

HS487 proved selection shape over eligible product bucket readout rows. HS489 should define the next inert shape: what provider-route packets would be produced for zKill candidate acquisition, without creating runtime pickup units, leases, queues, dispatch, provider calls, candidate refs, receipts, or Evidence/EVEidence.

## Source Context

Read first:

- `workspace/current.md`
- `workspace/OverseerHS488-hs487-discovery-pickup-selection-contract-review.md`
- `workspace/DevHS487-discovery-pickup-selection-contract.md`
- `workspace/OverseerHS487-discovery-pickup-selection-contract-runway.md`
- `workspace/OverseerHS486-hs485-product-watch-bucket-pickup-readout-review.md`
- `workspace/DevHS485-product-watch-bucket-pickup-readout.md`
- `docs/adr/ADR-0007-watch-bucket-and-provenance-preserving-dedupe.md`

## Required Behavior

Add a read-only provider-route packet preview that:

- starts from HS487 selected Discovery pickup candidates
- fans each selected system/radius Watch candidate into one inert zKill route packet per accepted included system ID
- preserves Watch ID, `watch_run_id`, bucket item ID, accepted scope, system ID, window, caps, provenance, and source selection basis
- keeps center/radius as provenance/explanation only, not execution authority
- reports packet count per selected candidate
- reports exclusions or non-selected candidates without creating packets
- reports all packets as preview-only / non-executing
- reports zero provider calls, zero zKill calls, zero ESI calls, zero candidate refs, zero Discovery refs, zero Evidence/EVEidence writes, zero Hydration writes, zero Observation, zero Watch cadence mutations, zero bucket status mutations, zero receipt mutations, zero leases, zero queues, zero dispatcher runtime, and zero schema changes

The route packet preview should be explicit that packet shape is for later zKill candidate acquisition only. It is not Evidence expansion and not Hydration.

## Scope Limits

System/radius only.

Provider route packet preview means inert data shape. It must not be durable Discovery task persistence, lease/queue state, dispatcher work, or live provider movement.

Use product bucket/readout/selection semantics as the basis. Fixture/temp DB seeding in the verifier is acceptable, but the proved shape should remain product-row based.

## Must Not Include

Do not add:

- Discovery pickup execution
- leases
- dispatcher runtime
- queue runtime
- durable Discovery task table
- provider calls
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

- eligible selected candidates can produce inert zKill provider-route packet previews
- one accepted included system ID yields one preview route packet
- Watch/run/bucket/scope/window/cap/provenance basis is preserved
- center/radius remains provenance only
- held/rejected/not-input rows do not produce route packets
- overlapping Watch scopes remain independent route packet previews
- packet previews do not create pickup units, leases, queues, dispatcher runtime, provider calls, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, or schema changes
- command/service output clearly says preview-only and non-executing

## Verification Expected

Add a focused verifier, likely:

```txt
npm.cmd run verify:discovery-provider-route-packet-preview
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

- route packets cannot be represented without mutation
- route packets require durable Discovery task schema
- route packets require leases, queue, or dispatcher runtime
- route packets require provider calls
- candidate refs or receipts become necessary
- actor Watch migration appears necessary

