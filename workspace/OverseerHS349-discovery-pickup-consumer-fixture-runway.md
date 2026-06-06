# OverseerHS349 - Discovery Pickup Consumer Fixture Runway

Status: opened
Date: 2026-06-06
Role: Overseer
Milestone: Atlas Storage And Runtime Hardening

## Human / Overseer Intent

Atlas has now proven:

```txt
due Watch -> Discovery pickup packets
```

The next seam should prove that Discovery can consume those pickup packets and produce provider-return-like candidate refs as fixture/plain data, without provider movement and without durable writes.

This keeps the accepted boundary:

- Watch is a scheduler and scope-authority source.
- Discovery is the acquisition utility.
- A due Watch emits Discovery pickup intent; it does not acquire candidates itself.
- Discovery pickup packets are not durable Discovery refs.
- Candidate refs are not Evidence/EVEidence.

## Source Basis

Accepted:

```txt
workspace/OverseerHS348-hs347-discovery-pickup-packet-proof-review.md
workspace/DevHS347-discovery-pickup-packet-proof.md
```

Prior related proof:

```txt
workspace/OverseerHS343-hs342-discovery-stub-candidates-review.md
workspace/DevHS342-discovery-intake-consumer-stub-candidates.md
```

HS342 proved stub candidates from the older Discovery bus input envelope. HS349 should now prove candidate output from the newer HS347 pickup packet shape.

## Task

Add a read-only/local-only Discovery pickup consumer fixture proof.

The proof should compose:

```txt
watch.discovery_pickup_packet_proof.preview
```

and convert emitted pickup packets into provider-return-like stub candidate refs.

Suggested command:

```txt
discovery.pickup_consumer_fixture.preview
```

Suggested helper:

```txt
buildDiscoveryPickupConsumerFixtureProof(...)
```

Suggested verifier:

```txt
npm.cmd run verify:discovery-pickup-consumer-fixture
```

## Requirements

For actor pickup packets:

- consume one actor pickup packet
- emit one or more stub candidate refs
- preserve source lane/kind, Watch ID, scope key, entity type/id/name, lookback/caps, provider target posture, candidate-only posture, and provenance
- include stub `killmail_id` and `killmail_hash`

For system/radius pickup packets:

- consume N system/radius pickup packets from stored accepted system IDs
- emit candidate refs tied to pickup packet `candidate_system_id`
- preserve full accepted system ID set, packet index/count, accepted-scope provenance, `accepted_scope_source: stored_watch_scope`, center/radius provenance/explanation, lookback/caps, candidate-only posture, and provenance
- do not recompute topology
- do not use center/radius as execution authority

For blocked/invalid/idle pickup proof states:

- emit zero candidate refs
- preserve the pickup reason such as `watch_scope_authority_invalid`, `session_not_armed`, `active_task`, `live_api_disabled`, `no_due_watches`, `inactive`, `not_due`, or `backoff` as applicable

## Acceptance Criteria

- Uses fixture/local/in-memory inputs only.
- No live/provider/API calls.
- No mutation of operator data.
- No table count changes for `fetch_runs`, `api_request_logs`, `discovered_killmail_refs`, `killmails`, `activity_events`, metadata/Hydration tables, warnings, or Watch rows.
- Valid actor Watch pickup emits stub candidate refs.
- Valid system/radius Watch with N accepted stored systems emits candidate refs whose `candidate_system_id` values come from the emitted pickup packets.
- Candidate refs are plain fixture data.
- Candidate refs are not durable Discovery refs.
- Candidate refs are not Evidence/EVEidence.
- Candidate refs are not Hydration.
- Candidate refs are not Observation.
- The proof does not invoke Watch dispatch runners, collectors, zKillboard, ESI, TaskRunner runtime methods, or persistence writers.
- The proof remains reusable Discovery machinery, not Watch-only acquisition logic.

## Boundaries

Do not:

- execute a Watch
- invoke Watch dispatch runners
- call collectors
- call zKillboard, ESI, or any provider
- perform live/API calls
- write `discovered_killmail_refs`
- write Evidence/EVEidence
- write Hydration/metadata labels
- write API logs or warnings
- mutate real/operator Watch rows
- persist real runtime packet rows
- create real/product tasks
- create a broad provider queue
- change schema
- implement renderer UI
- activate runtime enforcement or command blocking
- create support artifacts
- add durable Watch result identity
- add relationship tags
- rename source-owned terms
- update protected-word JSON
- open fourth-lane behavior

## Stop Conditions

Stop if this proof requires provider/live calls, durable Discovery ref writes, Evidence/EVEidence writes, real dispatch/collector invocation, schema changes, or Watch-only Discovery machinery that cannot later be reused by Manual/User-driven Discovery.

## Expected Dev Handoff

```txt
workspace/DevHS349-discovery-pickup-consumer-fixture.md
```

The handoff should list files changed, verification commands/results, sample actor candidate output, sample system/radius candidate output, blocked/invalid cases, and explicit evidence that no provider calls or durable writes occurred.
