# OverseerHS488 - HS487 Discovery Pickup Selection Contract Review

Status: accepted
Date: 2026-06-12
Role: Overseer
Reviewed handoff: `workspace/DevHS487-discovery-pickup-selection-contract.md`
Runway: `workspace/OverseerHS487-discovery-pickup-selection-contract-runway.md`

## Review Result

HS487 is accepted.

Atlas now has a read-only Discovery pickup selection contract over eligible product Watch bucket readout rows.

The implementation preserves the intended boundary:

- selects only `future_pickup_eligible` open system/radius rows
- preserves Watch ID, `watch_run_id`, accepted scope, scope posture, window, caps, provenance, and provider posture basis
- excludes held, rejected, not-input, actor, non-open, and malformed/missing-scope rows
- keeps overlapping Watch scopes as independent selection candidates
- treats selected rows as future Discovery pickup input only
- ignores renderer-supplied forged readout rows as authority
- does not create pickup units, provider packets, leases, queues, durable Discovery task rows, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, schema changes, enforcement, or UI

## Verification

Ran:

```txt
node --check src\main\services\discoveryPickupSelectionContractService.js
node --check scripts\verify-discovery-pickup-selection-contract.js
npm.cmd run verify:discovery-pickup-selection-contract
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
npm.cmd run verify:service-registry
git diff --check
git diff -- src\main\db\schema.sql
```

Results:

- All listed verification commands passed.
- `verify:enforcement-dry-run` reports 125/125 command coverage with no gaps.
- `verify:service-registry` required the longer timeout but passed.
- `git diff --check` returned exit code 0 with CRLF normalization warnings only.
- `git diff -- src\main\db\schema.sql` returned no diff.

## Accepted State

HS487 proves selection shape only.

It does not prove or open:

- Discovery pickup execution
- pickup units
- leases
- dispatcher runtime
- queue runtime
- durable Discovery task table
- provider dispatch
- zKill / ESI calls
- candidate ref writes
- Discovery ref writes
- Evidence/EVEidence writes
- Hydration
- Observation
- Watch cadence mutation
- bucket status mutation
- receipt mutation
- actor Watch migration
- UI

## Recommended Next Seam

Next coherent seam is likely a no-provider Discovery pickup unit / provider-route packet preview over selected candidates.

Keep it preview-only first. Do not start dispatcher runtime, leases, live provider movement, candidate ref writes, or receipt settlement until explicitly opened.

