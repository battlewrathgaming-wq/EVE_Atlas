# OverseerHS368 - Watch-to-Discovery Acquisition Split Fixture Bridge Runway

Status: opened
Date: 2026-06-07
Role: Overseer
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev

## Purpose

Prove that current Watch dispatch payloads can feed a Discovery-owned acquisition boundary without entering the existing mixed Watch collector path.

This is the next seam after HS366:

```txt
Watch dispatch payload
-> Discovery-owned acquisition request
-> fixture pickup packets / fixture zKill outcomes
-> canonical Discovery receipt basis
-> watch_summary projection
```

This is a fixture/read-only bridge proof. It is not live Watch movement and not durable Discovery schema.

## Context

Accepted findings:

- Watch is a scheduler and scope-authority source.
- Discovery is the provider-facing acquisition utility.
- A due Watch emits Discovery pickup intent; it should not acquire candidates itself.
- Candidate refs are possible leads, not Evidence/EVEidence and not task memory.
- ESI Evidence Expansion creates Evidence/EVEidence and should not be treated as Discovery completion.
- HS363 proved a fixture-only canonical Discovery receipt basis and safe projections.
- HS366 accepted that the current live-capable Watch collectors still mix Watch, Discovery, ESI Evidence Expansion, Evidence writes, and run posture.

Read:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/EngineeringTraceHS366-discovery-utility-watch-split-readiness.md`
- `workspace/OverseerHS367-hs366-discovery-watch-split-readiness-review.md`
- `workspace/OverseerHS364-hs363-discovery-receipt-projection-fixture-review.md`
- `workspace/OverseerHS363-discovery-receipt-projection-fixture-proof-runway.md`
- `workspace/OverseerHS350-hs349-discovery-pickup-consumer-fixture-review.md`
- `workspace/OverseerHS348-hs347-discovery-pickup-packet-proof-review.md`
- `src/main/watchlist/watchExecutor.js`
- `src/main/services/watchDiscoveryPickupPacketProofService.js`
- `src/main/services/discoveryPickupConsumerFixtureService.js`
- `src/main/services/discoveryReceiptProjectionFixtureService.js`
- service registry / command authority / passive side-effect / enforcement dry-run patterns

## Task

Add a read-only/local-only fixture proof command that:

1. consumes or reconstructs current Watch dispatch payload shape for actor and system/radius Watch cases,
2. builds a Discovery-owned acquisition request from that payload,
3. emits pickup packets using the accepted Discovery pickup packet shape,
4. injects fixture zKill outcomes,
5. produces a canonical Discovery receipt basis and a `watch_summary` projection,
6. proves the mixed collectors are not entered.

Suggested command:

```txt
watch.discovery_acquisition_split_fixture.preview
```

Suggested verifier:

```txt
verify:watch-discovery-acquisition-split-fixture
```

## Required Fixture Cases

Cover at least:

- actor Watch dispatch payload -> one Discovery acquisition packet
- system/radius Watch dispatch payload -> one packet per stored accepted `included_system_ids`
- stored accepted system IDs remain execution authority
- center/radius remain provenance/explanation, not execution authority
- refs found
- no refs
- provider deferred
- acquisition capped
- retryable failure
- terminal failure
- request-level `held_by_external_io` before acquisition with no packet outcomes emitted

## Required Output Shape

The preview should include:

- source Watch identity and source kind
- current dispatch payload basis or equivalent fixture basis
- Discovery acquisition request
- pickup packet count and packet targets
- fixture provider outcome summary
- canonical Discovery receipt basis, or a bounded reference to the HS363-style basis
- `watch_summary` projection
- explicit proof that the mixed collectors were not invoked
- explicit boundary flags
- table mutation proof showing durable Atlas rows unchanged

## Boundary

Do not:

- call providers
- run live/API calls
- invoke `collectActorWatch(...)`
- invoke `collectSystemRadiusWatch(...)`
- invoke Watch dispatch runners as live tasks
- create or run tasks
- mutate Watch schedule/state
- write `discovered_killmail_refs`
- write Evidence/EVEidence
- run ESI Evidence Expansion
- write Hydration/metadata labels
- write API logs/warnings
- write `fetch_runs`
- create or mutate durable Discovery task/packet/receipt schema
- create queues, dispatchers, leases, or runtime provider work
- create support artifacts
- change renderer UI
- activate runtime enforcement or command blocking
- rename Atlas terms
- update protected-word JSON

## Verification

Run focused checks:

- `node --check` for new service/script and changed registry/authority files
- `npm.cmd run verify:watch-discovery-acquisition-split-fixture`
- `npm.cmd run verify:watch-discovery-pickup-packets`
- `npm.cmd run verify:discovery-pickup-consumer-fixture`
- `npm.cmd run verify:discovery-receipt-projection-fixture`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:enforcement-dry-run`
- `npm.cmd run verify:protected-terms`
- `git diff --check`
- `git status --short --branch`

## Expected Handoff

Create:

```txt
workspace/DevHS368-watch-to-discovery-acquisition-split-fixture-bridge.md
```

The handoff should include:

- command added
- verifier added
- fixture cases covered
- sample actor bridge output
- sample system/radius bridge output
- proof that mixed collectors were not invoked
- proof that no providers, DB writes, Watch mutation, Discovery refs, Evidence/EVEidence, Hydration, Observation, schema, dispatcher, enforcement, support artifacts, or UI behavior were opened
- verification commands and results

## Stop Conditions

Stop and report if the proof requires:

- provider/live calls
- entering existing mixed collectors
- Watch schedule mutation
- DB writes
- durable task/packet/receipt schema
- ESI Evidence Expansion
- Discovery ref persistence
- runtime dispatcher/queue/lease behavior
- UI changes
