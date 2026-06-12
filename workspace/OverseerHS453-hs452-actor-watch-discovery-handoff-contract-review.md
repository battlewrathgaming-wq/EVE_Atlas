# OverseerHS453 - HS452 Actor Watch / Discovery Handoff Contract Review

Status: accepted
Date: 2026-06-12
Reviewed handoff: `workspace/DevHS452-actor-watch-discovery-handoff-contract-projection.md`
Reviewed runway: `workspace/OverseerHS452-actor-watch-discovery-handoff-contract-projection-runway.md`

## Review Result

HS452 is accepted.

The implementation provides a read-only / fixture-only projection proof for the actor Watch / Discovery handoff contract:

```txt
actor_watch_discovery_request
actor_watch_discovery_receipt
```

The proof projects both direct and scheduled actor Watch outputs into the same request/receipt language while preserving the current 22-field compatibility summary under `receipt.compatibility_summary`.

## Accepted Meaning

This is a shaping/proof surface, not runtime doctrine by itself.

Accepted:

- `actor_watch_discovery_request` is a useful request-shape candidate for actor Watch -> Discovery handoff.
- `actor_watch_discovery_receipt` is a useful receipt-shape candidate for Discovery -> actor Watch/caller handoff.
- The old 22-field summary remains compatibility/debug output and is not the future contract.
- Direct and scheduled actor Watch can share the same projected request/receipt shape.

Not accepted by this packet:

- durable receipt/task/packet persistence
- runtime caller return-path change
- collector retirement
- system/radius generalization
- live/provider readiness

## Scope Check

The command added was:

```txt
watch.actor_discovery_handoff_contract.preview
```

It is registered as read-only and renderer eligible. It uses fixture/fake-client proof basis internally and proves the caller/operator DB is unchanged.

This should be understood as read-only to the operator corpus, not as a claim that no internal disposable fixture state exists.

No runtime behavior change, live/provider calls, operator corpus writes, Discovery ref writes, Evidence/EVEidence writes, Hydration writes, Watch execution, Watch dispatch, task creation, Watch mutation, schema change, dispatcher/queue/lease behavior, runtime enforcement, command blocking, renderer UI, source-term rename, or protected-word JSON update was introduced.

## Verification

Run locally by Overseer:

```powershell
node --check src\main\services\watchActorDiscoveryHandoffContractService.js
node --check scripts\verify-watch-actor-discovery-handoff-contract.js
npm.cmd run verify:watch-actor-discovery-handoff-contract
npm.cmd run verify:watch-actor-scheduled-redirect
npm.cmd run verify:watch-actor-direct-redirect
npm.cmd run verify:watch-actor-production-like-fake-client-direct-proof
npm.cmd run verify:watch-executor
npm.cmd run verify:command-authority
npm.cmd run verify:service-registry
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
git diff --check
git status --short --branch
```

Results:

- all verifier commands passed
- `npm.cmd run verify:service-registry` passed with a longer timeout
- `npm.cmd run verify:enforcement-dry-run` reports 117 commands covered, 0 gaps
- `git diff --check` reports only existing LF-to-CRLF working-copy warnings
- tree remains `main...origin/main [ahead 19]` with the expected large milestone stack

## Recommended Next Step

Before any Watch trimming or collector retirement, route this projected request/receipt shape through packet-shape acceptance pressure.

Question for that specialist:

```txt
Is `actor_watch_discovery_request` / `actor_watch_discovery_receipt` sufficient, precise, and reusable enough to become the handoff language between intent sources and Discovery, without smuggling Watch-specific meaning into Discovery?
```

If accepted, the next implementation seam can be chosen from:

- caller return-path projection naming
- remaining `collectActorWatch(...)` caller / retirement readiness trace
- applying the request/receipt handoff shape to the next narrow actor Watch runtime surface

No new Dev runway is opened by this review.
