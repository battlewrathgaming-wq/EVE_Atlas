# OverseerHS347 - Discovery Pickup Packet Proof Runway

Status: opened
Date: 2026-06-06
Role: Overseer
Milestone: Atlas Storage And Runtime Hardening

## Human / Overseer Intent

Atlas needs a clear boundary between Watch due/scheduler behavior and Discovery acquisition behavior.

Accepted framing:

- Watch is a scheduler and scope-authority source.
- Discovery is the acquisition utility.
- A due Watch emits Discovery pickup intent; it does not acquire candidates itself.
- For system/radius Watch execution, stored accepted `included_system_ids` are execution authority.
- Center system and radius explain how the scope was formed; they are not execution authority after acceptance.

## Source Basis

Accepted advisory:

```txt
workspace/EngineeringTraceHS346-watch-due-and-discovery-pickup-surfaces.md
```

HS346 found that current proof surfaces are clean but still lack a first-class N-per-system Discovery pickup packet proof. It also found that real collectors currently combine Discovery acquisition, durable Discovery ref writes, ESI Evidence Expansion, Evidence persistence, logs/warnings, and fetch-run lifecycle.

## Task

Add a read-only/local-only Discovery pickup packet proof.

The proof should convert one selected due Watch into candidate Discovery pickup packet data only.

For actor Watch:

- emit exactly one Discovery pickup packet
- preserve Watch/source lane, Watch ID, source kind, scope key, entity type/id/name where available, lookback, caps, provider target posture, and candidate-only posture

For system/radius Watch:

- consume stored accepted `included_system_ids`
- emit exactly one Discovery pickup packet per accepted system ID
- preserve Watch/source lane, Watch ID, source kind, scope key, full accepted system ID set, packet index/count, `candidate_system_id`, lookback, caps, accepted-scope provenance, and `accepted_scope_source: stored_watch_scope`
- preserve center/radius only as provenance/explanation
- disclose that center/radius were not used as execution authority

Suggested service shape:

```txt
watch.discovery_pickup_packet_proof.preview
```

Suggested helper shape:

```txt
buildWatchDiscoveryPickupPacketProof(...)
```

Suggested verifier:

```txt
npm.cmd run verify:watch-discovery-pickup-packets
```

## Acceptance Criteria

- Uses fixture/local/in-memory inputs only.
- No live/provider/API calls.
- No mutation of operator data.
- No table count changes for `fetch_runs`, `api_request_logs`, `discovered_killmail_refs`, `killmails`, `activity_events`, metadata/Hydration tables, warnings, or Watch rows.
- Disarmed, active-task, live-disabled, inactive, not-due, backoff, no-due, and invalid stored-scope cases emit zero pickup packets.
- Valid actor Watch emits exactly one Discovery pickup packet.
- Valid system/radius Watch with N stored accepted system IDs emits exactly N per-system Discovery pickup packets.
- `candidate_system_id` values exactly equal the stored accepted system IDs in deterministic order.
- Pickup packets are not durable Discovery refs.
- Pickup packets are not Evidence/EVEidence.
- Pickup packets are not Hydration.
- Pickup packets are not Observation.
- The proof does not invoke Watch dispatch runners, collectors, zKillboard, ESI, TaskRunner runtime methods, or persistence writers.

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
workspace/DevHS347-discovery-pickup-packet-proof.md
```

The handoff should list files changed, verification commands/results, packet examples for actor and system/radius, and explicit evidence that no provider calls or durable writes occurred.
