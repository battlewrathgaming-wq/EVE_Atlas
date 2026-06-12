# OverseerHS493 - Discovery Dispatcher Lease Boundary Preview Runway

Status: open
Date: 2026-06-12
Role: Overseer
Executor: Dev

## Human Intent

Atlas has proven the route packet preview and the pre-provider pickup execution boundary.

The next seam should define the control joint before any provider packet becomes live: how would Discovery claim, hold, pace, and release eligible route work without actually creating durable leases, queues, dispatcher runtime, provider calls, candidate refs, Discovery refs, Evidence/EVEidence, or Watch mutation?

This keeps Atlas respectful and recoverable before any live zKill movement.

## Current Accepted Basis

Read first:

```txt
workspace/current.md
workspace/overview.md
workspace/OverseerHS492-hs491-discovery-pickup-execution-boundary-preview-review.md
workspace/DevHS491-discovery-pickup-execution-boundary-preview.md
workspace/OverseerHS490-hs489-discovery-provider-route-packet-preview-review.md
workspace/DevHS489-discovery-provider-route-packet-preview.md
```

Relevant accepted chain:

- HS485/HS486: product Watch bucket pickup readout.
- HS487/HS488: Discovery pickup selection candidates.
- HS489/HS490: inert zKill provider-route packet previews.
- HS491/HS492: pre-provider pickup execution boundary preview.

## Task

Add a read-only Discovery dispatcher/lease boundary preview.

Suggested command name:

```txt
discovery.dispatcher_lease_boundary.preview
```

The preview should start from the HS491 pickup execution boundary preview output and classify how eligible boundary packets would be considered by a future dispatcher/lease layer.

Expected behavior:

- consume or internally call the HS491 pickup execution boundary preview path
- preserve route packet identity, Watch/run/bucket/scope/window/cap/provenance/source-selection basis
- classify eligible packets as lease candidates only, not leased work
- classify held/rejected/not-input rows as not lease candidates
- describe future lease facts without persisting them:
  - future lease key / identity basis
  - future lease owner requirement
  - future lease expiry requirement
  - future retry-after / provider eligibility basis
  - future provider pacing basis
  - future recovery behavior for expired/abandoned leases
- keep External I/O closed as a hold before lease candidacy
- keep one accepted included system ID traceable to one possible future lease candidate when External I/O is on
- make clear that no dispatcher loop, queue runtime, lease row, provider call, candidate-ref write, receipt mutation, or Watch mutation is created

## Required Boundary

Do not add:

- real dispatcher runtime
- provider calls
- zKill calls
- ESI calls
- executable provider packets
- Discovery pickup execution
- durable pickup units
- durable queues
- durable leases
- lease claims
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

Register it through existing service registry and command authority patterns.

This should be a preview/readout, not a dispatcher design document hidden in code. Keep the output factual and compact enough that future Dev can use it as a contract surface.

Useful field names may include:

```txt
lease_boundary_status
lease_candidate
future_lease_identity
future_lease_owner_required
future_lease_expires_at_required
future_retry_after_basis
future_provider_pacing_basis
future_expired_lease_recovery_basis
```

Names can be adjusted to fit existing code style, but avoid implying a lease exists now.

## Verification

Add a focused verifier and package script.

Run:

```txt
node --check src\main\services\[new-service].js
node --check scripts\verify-discovery-dispatcher-lease-boundary-preview.js
npm.cmd run verify:discovery-dispatcher-lease-boundary-preview
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
git diff --check
git diff -- src\main\db\schema.sql
git status --short --branch
```

The verifier should assert:

- External I/O on produces lease candidates from HS491 eligible boundary packets
- External I/O off produces no lease candidates and preserves held posture
- no dispatcher runtime starts
- no queue items are created
- no lease rows are created
- no lease is claimed
- no provider calls occur
- no zKill calls occur
- no ESI calls occur
- no candidate refs or Discovery refs are written
- no Evidence/EVEidence or Hydration writes occur
- no Watch bucket, cadence, or receipt rows mutate
- no schema changes occur

## Expected Handoff

Create:

```txt
workspace/DevHS493-discovery-dispatcher-lease-boundary-preview.md
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

- implementation requires schema changes
- implementation requires durable lease/queue rows
- implementation starts a dispatcher or worker loop
- implementation calls providers or creates executable provider packets
- implementation writes candidate refs, Discovery refs, Evidence/EVEidence, or Hydration
- implementation mutates Watch cadence, bucket status, or receipts
- implementation blurs Discovery dispatcher/lease posture with Watch scheduling
