# OverseerHS473 - HS472 Watch Bucket Pickup Posture Bridge Review

Status: accepted  
Date: 2026-06-12  
Reviewed handoff: `workspace/DevHS472-watch-bucket-pickup-posture-bridge.md`  
Expected runway: HS472 Watch bucket candidate pickup posture bridge proof

## Review Result

HS472 is accepted.

The implementation proves the intended bridge from projected Watch bucket candidates to future Discovery pickup posture without creating bucket rows, starting Discovery pickup, creating provider packets, writing candidate refs, or touching Evidence/EVEidence.

## Accepted Evidence

New command:

```txt
watch.bucket_pickup_posture_bridge.preview
```

Accepted behavior:

- projected candidates become `future_pickup_eligible` when External I/O is on
- projected candidates become `held_by_external_io` when External I/O is off
- External I/O hold is provider movement posture, not Watch emission failure
- duplicate-open suppressions do not become pickup eligible
- integrity conflicts/errors do not become pickup eligible
- invalid/not-due/inactive/backoff rows do not become pickup eligible
- overlapping candidates from different Watches remain independent
- provider packets remain zero
- Discovery pickup remains stopped
- bucket rows persisted remains zero

## Verification

Commands run by Overseer:

```txt
npm.cmd run verify:watch-bucket-pickup-posture-bridge
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Result:

All passed.

## Boundary Confirmation

Accepted with these boundaries:

- projected Watch bucket candidates remain fixture input only
- future pickup eligible does not authorize or start Discovery pickup
- External I/O hold remains a Discovery/provider movement hold after Watch projection
- no schema
- no durable bucket rows
- no Watch cadence mutation
- no `fetch_runs` as bucket state
- no `discovered_killmail_refs` as pre-acquisition Watch bucket state
- no Discovery refs, candidate refs, Evidence/EVEidence, Hydration, Observation, dispatcher, queue, lease, enforcement, or UI

## Decision Point

The Watch emission side now has two useful read-only proofs:

```txt
HS470: candidate identity and one-open-stub posture
HS472: pickup eligibility / External I/O hold posture
```

The next seam should be chosen deliberately.

Recommended options:

1. Disposable bucket persistence fixture.
   Prove the write shape in an internal disposable DB only, still no providers and no operator corpus mutation.

2. Discovery pickup consumer hold contract.
   Prove how Discovery would consume eligible/held bucket candidates as fixture input, still without durable bucket persistence.

3. Pause and run a short Architecture/Data assurance pass.
   Confirm whether the next proof should persist bucket rows first or prove pickup consumption first.

Overseer leaning:

```txt
Option 3 if caution is desired; otherwise Option 1.
```

Reason:

Atlas has enough read-only shape now that the next meaningful risk is probably durable bucket persistence semantics. A tiny assurance pass could prevent writing the wrong disposable fixture first.

