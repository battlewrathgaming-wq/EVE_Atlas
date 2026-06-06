# OverseerHS350 - HS349 Discovery Pickup Consumer Fixture Review

Status: accepted
Date: 2026-06-06
Role: Overseer
Milestone: Atlas Storage And Runtime Hardening

## Reviewed

```txt
workspace/OverseerHS349-discovery-pickup-consumer-fixture-runway.md
workspace/DevHS349-discovery-pickup-consumer-fixture.md
src/main/services/discoveryPickupConsumerFixtureService.js
scripts/verify-discovery-pickup-consumer-fixture.js
```

## Result

Accepted.

HS349 proves:

```txt
due Watch -> Discovery pickup packet -> fixture candidate refs
```

This preserves the accepted model:

- Watch is a scheduler and scope-authority source.
- Discovery is the acquisition utility.
- Watch emits Discovery pickup intent.
- Discovery consumes pickup packets.
- Candidate refs are not durable Discovery refs.
- Candidate refs are not Evidence/EVEidence.

## Accepted Implementation

- Added read-only renderer-eligible command `discovery.pickup_consumer_fixture.preview`.
- Added `buildDiscoveryPickupConsumerFixtureProof(...)`.
- Added `npm.cmd run verify:discovery-pickup-consumer-fixture`.
- The proof composes `watch.discovery_pickup_packet_proof.preview`.
- Valid actor pickup emits fixture candidate refs with stub `killmail_id` and `killmail_hash`.
- Valid system/radius pickup emits fixture candidate refs tied to pickup packet `candidate_system_id`.
- Invalid stored scope, disarmed, active-task, live-disabled, no-due, inactive, not-due, and backoff states emit zero candidate refs.
- Candidate refs remain provider-return-like fixture data only.

## Verification Re-Run

Overseer re-ran:

```txt
npm.cmd run verify:discovery-pickup-consumer-fixture
npm.cmd run verify:watch-discovery-pickup-packets
npm.cmd run verify:command-authority
npm.cmd run verify:service-registry
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
git diff --check
```

Results:

- All npm verifier commands passed.
- `git diff --check` passed; only CRLF normalization warnings were emitted.

## Boundary Confirmation

No Watch execution, Watch dispatch runner invocation, collector call, zKillboard call, ESI call, provider/live/API call, `discovered_killmail_refs` write, Evidence/EVEidence write, Hydration/metadata write, API log/warning write, real/operator Watch mutation, real runtime packet persistence, real/product task creation, broad provider queue, schema change, renderer UI work, runtime enforcement, command blocking, support artifact creation, durable Watch result identity, relationship tag, protected-word JSON update, or fourth-lane behavior was opened.

## Pause Recommendation

Pause new Dev implementation after HS349.

The Watch-side pre-provider shape is now strong enough to rest:

```txt
Watch due -> Discovery pickup intent -> fixture candidate refs
```

The next useful activity should be a boundary consolidation pass, not another Dev runway.

## Boundary Consolidation Targets

Recommended audit surfaces:

1. Intent -> Watch
2. Watch -> Discovery
3. Discovery -> Candidate Refs
4. Candidate Refs -> ESI Evidence Expansion
5. Evidence Expansion -> EVEidence corpus write
6. EVEidence -> Observation
7. Observation -> Assessment
8. Hydration / Readability

The consolidation should identify current proofs, stale documentation, code crossings, scaffolding-only surfaces, and future Dev seams without opening implementation.
