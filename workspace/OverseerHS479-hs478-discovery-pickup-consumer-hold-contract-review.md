# OverseerHS479 - HS478 Discovery Pickup Consumer Hold Contract Review

Status: accepted  
Date: 2026-06-12  
Reviewed handoff: `workspace/DevHS478-discovery-pickup-consumer-hold-contract.md`  
Expected runway: HS478 Discovery pickup consumer hold contract

## Review Result

HS478 is accepted.

The implementation proves that Discovery-side fixture consumption can classify disposable open Watch bucket rows as future pickup eligible or held by External I/O without starting Discovery pickup, leasing work, creating provider packets, writing candidate refs, or touching Evidence/EVEidence.

## Accepted Evidence

New command:

```txt
discovery.pickup_consumer_hold_contract.preview
```

Accepted behavior:

- open disposable fixture row plus External I/O on becomes `future_pickup_eligible`
- open disposable fixture row plus External I/O off becomes `held_by_external_io`
- `held_by_external_io` is provider movement hold only
- held is not Watch failure
- held is not persisted bucket status
- duplicate/idempotent persistence results do not create pickup units
- integrity conflict/error and rejected source rows do not become pickup input
- overlapping open rows from different Watches remain independent pickup candidates or holds
- provider packet count remains zero
- Discovery pickup started remains false
- lease/queue/dispatcher behavior remains false
- candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence, and product tables remain untouched

## Verification

Commands run by Overseer:

```txt
npm.cmd run verify:discovery-pickup-consumer-hold-contract
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
git diff -- src/main/db/schema.sql
```

Result:

All verification passed. `src/main/db/schema.sql` has no diff.

## Boundary Confirmation

Accepted with these boundaries:

- fixture/contract only
- no product schema
- no operator corpus mutation
- no production bucket consumption
- no Discovery pickup start
- no provider packets
- no lease/queue/dispatcher runtime
- no candidate refs
- no Evidence/EVEidence writes
- no Watch cadence mutation
- no UI

## Decision Point

The Watch bucket / Discovery pickup seam has now been proven through four non-production steps:

```txt
HS470: Watch bucket identity projection
HS472: Watch bucket pickup posture bridge
HS476: disposable Watch bucket persistence fixture
HS478: Discovery pickup consumer hold contract
```

The next step should not be another casual fixture unless it answers a specific gap. The project is now near the product-schema/runtime boundary.

Recommended next move:

```txt
Architecture/Data design pass for real Watch bucket persistence and Discovery pickup contract.
```

Purpose:

```txt
turn the proven fixture semantics into a product-safe schema/runtime design proposal, including explicit deferrals for dispatcher/lease/provider movement
```

