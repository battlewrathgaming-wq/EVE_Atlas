# OverseerHS491 - Discovery Pickup Execution Boundary Preview Runway

Status: open
Date: 2026-06-12
Role: Overseer
Executor: Dev

## Human Intent

Atlas has proven the path from product Watch bucket rows to selected Discovery pickup candidates, then to inert zKill provider-route packet previews.

The next seam should prove the boundary immediately before real provider movement: can Atlas describe how Discovery would pick up those route packet previews for execution without actually executing, leasing, dispatching, calling providers, writing refs, or mutating Watch state?

This should keep Atlas building the machinery before opening live motion.

## Current Accepted Basis

Read first:

```txt
workspace/current.md
workspace/overview.md
workspace/OverseerHS490-hs489-discovery-provider-route-packet-preview-review.md
workspace/DevHS489-discovery-provider-route-packet-preview.md
```

Relevant accepted chain:

- HS482/HS484: product `watch_bucket_items` persistence exists for system/radius emitted work identity.
- HS485/HS486: product Watch bucket pickup readout can classify future pickup posture.
- HS487/HS488: eligible product bucket readout rows can become Discovery pickup selection candidates.
- HS489/HS490: selected candidates can become inert zKill provider-route packet previews.

## Task

Add a read-only Discovery pickup execution boundary preview.

The preview should start from the accepted HS489 provider-route packet preview output and classify what would be needed before provider execution, without performing any execution.

Suggested command name:

```txt
discovery.pickup_execution_boundary.preview
```

Expected behavior:

- consume or internally call the HS489 provider-route packet preview path
- preserve route packet identity, Watch/run/bucket/scope/window/cap/provenance/source selection basis
- keep one accepted included system ID mapped to one zKill route packet preview
- classify each packet as not executed yet
- state whether the packet would require:
  - External I/O open
  - future dispatcher ownership
  - future lease/claim semantics
  - future provider pacing
  - future zKill candidate-ref write handling
- keep held-by-External-I/O rows out of executable packet posture
- keep malformed/rejected/not-input rows out of executable packet posture
- make it clear that this is a boundary preview, not a dispatcher, queue, lease, or provider worker

## Required Boundary

Do not add:

- provider calls
- zKill calls
- ESI calls
- executable provider packets
- Discovery pickup execution
- dispatcher runtime
- leases
- queues
- candidate refs
- Discovery ref writes
- Evidence/EVEidence writes
- Hydration
- Observation/reporting behavior
- Watch cadence mutation
- Watch bucket status mutation
- receipt mutation
- schema changes
- runtime enforcement
- command blocking
- UI
- actor Watch migration
- `collectActorWatch(...)` retirement
- system/radius collector redirect
- source-term rename
- protected-word JSON update

## Implementation Notes

Prefer a small service under:

```txt
src/main/services/
```

Register it through the existing service registry/command authority patterns.

Add a focused verifier and package script. The verifier should assert:

- provider calls remain zero
- zKill calls remain zero
- ESI calls remain zero
- no pickup units are created
- no leases are created
- no queues are created
- no candidate refs are written
- no Discovery refs are written
- no Evidence/EVEidence rows are written
- no Hydration rows are written
- no Watch bucket rows are mutated
- no Watch cadence rows are mutated
- no receipt rows are mutated
- no schema changes occur
- selected/route packet counts remain traceable back to HS489 basis

## Verification

Run:

```txt
node --check src\main\services\[new-service].js
node --check scripts\verify-discovery-pickup-execution-boundary-preview.js
npm.cmd run verify:discovery-pickup-execution-boundary-preview
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
git diff --check
git diff -- src\main\db\schema.sql
git status --short --branch
```

## Expected Handoff

Create:

```txt
workspace/DevHS491-discovery-pickup-execution-boundary-preview.md
```

The handoff should include:

- files changed
- command name
- summary of preview output
- side-effect boundary evidence
- verification commands and results
- any unexpected coupling or stale terminology discovered

## Stop Conditions

Stop and report if:

- implementing this requires provider calls or simulated provider responses beyond inert preview data
- implementing this requires schema changes
- implementing this requires durable pickup/lease/queue rows
- implementing this requires candidate-ref or Discovery-ref writes
- implementing this requires Watch cadence/bucket/receipt mutation
- implementing this blurs Discovery pickup execution with Watch scheduling
- implementing this turns HS489 route previews into executable provider packets
