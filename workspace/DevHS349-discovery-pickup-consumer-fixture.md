# DevHS349 - Discovery Pickup Consumer Fixture

Status: complete
Date: 2026-06-06
Role: Dev
Milestone: Atlas Storage And Runtime Hardening

## Summary

Implemented the read-only/local-only Discovery pickup consumer fixture proof:

```txt
discovery.pickup_consumer_fixture.preview
```

The proof composes:

```txt
watch.discovery_pickup_packet_proof.preview
```

and converts emitted pickup packets into provider-return-like fixture candidate refs. Candidate refs are plain fixture data only; they are not durable Discovery refs, Evidence/EVEidence, Hydration, or Observation.

## Files Changed

- `package.json`
- `src/main/services/discoveryPickupConsumerFixtureService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-discovery-pickup-consumer-fixture.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `workspace/current.md`
- `workspace/DevHS349-discovery-pickup-consumer-fixture.md`

## Command / Service Shape

Added service registry command:

```txt
discovery.pickup_consumer_fixture.preview
```

Command posture:

- classification: `read-only`
- renderer eligible: yes
- fixture only: yes
- provider calls: `0`
- live/API calls: `0`
- Watch dispatches: `0`
- TaskRunner methods called: none
- tasks created: `0`
- Discovery refs mutated: `0`
- `discovered_killmail_refs` written: `0`
- Evidence/EVEidence writes: `0`
- Hydration writes: `0`
- Watch mutations: `0`
- schema changes: `0`
- runtime enforcement active: false

## Sample Actor Candidate Output

Focused verifier sample:

```json
{
  "consumer_status": "emitted_fixture_candidate_refs",
  "consumer_reason": "pickup_packets_consumed",
  "pickup_packets_consumed": 1,
  "candidate_refs_emitted": 2,
  "candidate_ref_shape": {
    "killmail_id": 400349001,
    "killmail_hash": "hs349_actor_stub_hash_001",
    "provider": "zkill_fixture",
    "provider_return_like": true,
    "source_lane": "watch",
    "source_kind": "actor",
    "scope_key": "actor:character:90000001",
    "watch_id": 1,
    "candidate_only": true,
    "fixture_only": true,
    "entity_type": "character",
    "entity_id": 90000001,
    "entity_name": "Pickup Consumer Pilot",
    "provider_target_posture": {
      "provider": "zkill",
      "target_kind": "character",
      "target_id": 90000001,
      "provider_calls": 0,
      "live_api_calls": 0,
      "acquisition_not_started": true
    }
  }
}
```

## Sample System/Radius Candidate Output

Focused verifier sample:

```json
{
  "consumer_status": "emitted_fixture_candidate_refs",
  "consumer_reason": "pickup_packets_consumed",
  "pickup_packets_consumed": 4,
  "candidate_refs_emitted": 4,
  "candidate_system_ids": [30003597, 30003599, 30003601, 30003602],
  "accepted_system_ids": [30003597, 30003599, 30003601, 30003602],
  "accepted_scope_source": "stored_watch_scope",
  "center_system_id": 30003597,
  "radius_jumps": 1,
  "center_radius_role": "provenance_and_explanation",
  "center_radius_used_as_execution_authority": false,
  "topology_recomputed": false
}
```

## Blocked / Invalid / Idle Cases

The verifier proves zero candidate refs for:

- invalid stored scope: `watch_scope_authority_invalid`
- disarmed session: `session_not_armed`
- active task present: `active_task`
- live disabled: `live_api_disabled`
- no due Watch rows: `no_due_watches`
- inactive / not-due / backoff rows via the HS347 pickup proof state

In each case, the consumer preserves the upstream pickup reason and keeps `candidate_refs` empty.

## Durable Write Boundary

The proof snapshots table counts before and after each case and validates no changes to:

- `killmails`
- `activity_events`
- `discovered_killmail_refs`
- `fetch_runs`
- `api_request_logs`
- `metadata_runs`
- `ingestion_audits`
- `data_quality_warnings`
- `entities`
- `watchlist_entities`
- `system_watches`
- `assessment_artifacts`

No provider calls, durable Discovery refs, Evidence/EVEidence writes, Hydration writes, Watch mutations, schema changes, runtime enforcement, command blocking, support artifacts, durable Watch result identity, relationship tags, or fourth-lane behavior were added.

## Verification

Passed:

- `node --check src\main\services\discoveryPickupConsumerFixtureService.js`
- `node --check scripts\verify-discovery-pickup-consumer-fixture.js`
- `node --check src\main\services\serviceRegistry.js`
- `node --check scripts\verify-service-registry.js`
- `node --check scripts\verify-command-authority.js`
- `node --check scripts\verify-passive-side-effects.js`
- `node --check src\main\services\enforcementDryRunService.js`
- `npm.cmd run verify:discovery-pickup-consumer-fixture`
- `npm.cmd run verify:watch-discovery-pickup-packets`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:enforcement-dry-run`
- `npm.cmd run verify:protected-terms`
- `git diff --check`
- `git status --short --branch`

Notes:

- `npm.cmd run verify:enforcement-dry-run` passed with coverage complete for 102 commands.
- `npm.cmd run verify:protected-terms` passed with warning-only advisory output: working-set scan covered 7 files and reported 262 warning-only items; no renames or protected-word JSON updates were performed.
- `git diff --check` passed; only CRLF normalization warnings were emitted.
- `git status --short --branch` showed branch `main...origin/main [ahead 18]` with HS349 working-tree changes.

## Outcome

HS349 is complete. Atlas can now prove:

```txt
due Watch -> Discovery pickup packet -> fixture candidate refs
```

while preserving the accepted model that Watch schedules and carries scope authority, Discovery consumes pickup intent, and candidate refs remain pre-provider/pre-persistence plain data.

## Risks / Follow-Up

- This remains fixture-only and does not prove live provider acquisition.
- It does not create durable Discovery refs or product tasks.
- It intentionally does not decide how Manual/User-driven Discovery will feed the same consumer shape.

Recommended next action: Overseer review HS349 and decide whether to continue toward Manual/User-driven pickup parity, provider adapter fixture posture, or a bounded durable Discovery ref write proof.
