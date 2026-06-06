# DevHS340 Watch Discovery Bus Input Envelope

Status: complete
Date: 2026-06-06
Role: Dev

## Scope

Implemented HS340 as a read-only/local-only proof that accepted Watch task shape can be expressed as a Discovery bus input envelope.

Core boundary preserved:

- Discovery bus input is acquisition intent.
- Discovery bus input is not Discovery refs.
- Discovery bus input is not Evidence/EVEidence.
- The shape is shared candidate intake, not a Watch-only bus model.

## Files Changed

- `package.json`
- `src/main/services/watchDiscoveryBusInputEnvelopeService.js`
- `src/main/services/watchPacketDryRunDispatchParityService.js`
- `scripts/verify-watch-discovery-bus-input-envelope.js`
- `workspace/current.md`
- `workspace/DevHS340-watch-discovery-bus-input-envelope.md`

## Helper / Proof Shape Added

Added `buildWatchDiscoveryBusInputEnvelopeProof(...)` in `src/main/services/watchDiscoveryBusInputEnvelopeService.js`.

Added verifier command:

```txt
npm.cmd run verify:watch-discovery-bus-input-envelope
```

The proof composes the existing fixture-only Watch task proof from HS338 and emits plain data only when a valid fixture task shape exists. It is not registered as a renderer/product service command.

The proof reports:

- `read_only: true`
- `mutates_state: false`
- `fixture_only_source: true`
- `renderer_eligible: false`
- `bus_input_envelope_emitted`
- `bus_input_envelope`
- `bus_input_status`
- `bus_input_reason`
- `invalid_stored_scope_blocks_before_bus_input`
- no-provider/no-ref/no-Evidence/no-write boundary counters
- before/after durable Atlas table counts

## Sample Actor Discovery Bus Input Envelope

```json
{
  "source_lane": "watch",
  "source_kind": "actor",
  "scope_key": "actor:character:90000001",
  "watch_id": 1,
  "task_type": "watch.executor.actor.watch",
  "task_classification": "evidence-creating",
  "candidate_only": true,
  "discovery_refs_written": false,
  "evidence_created": false,
  "provider_movement": false,
  "watch_execution": false,
  "lookback_seconds": 1209600,
  "caps": {
    "max_refs": 5,
    "max_expansions": 5
  },
  "entity_type": "character",
  "entity_id": 90000001,
  "entity_name": "Bus Input Pilot"
}
```

## Sample System/Radius Discovery Bus Input Envelope

```json
{
  "source_lane": "watch",
  "source_kind": "system_radius",
  "scope_key": "system:30003597:radius:1",
  "watch_id": 1,
  "task_type": "watch.executor.system.radius.watch",
  "task_classification": "evidence-creating",
  "candidate_only": true,
  "discovery_refs_written": false,
  "evidence_created": false,
  "provider_movement": false,
  "watch_execution": false,
  "lookback_seconds": 86400,
  "caps": {
    "max_systems": 3,
    "max_refs_per_system": 2,
    "max_expansions": 6
  },
  "accepted_system_ids": [
    30003597,
    30003599,
    30003601
  ],
  "accepted_scope_source": "stored_watch_scope",
  "center_system_id": 30003597,
  "radius_jumps": 1,
  "center_radius_role": "provenance_and_management",
  "center_radius_used_as_authority": false
}
```

## Invalid Stored Scope Result

Malformed stored system/radius scope emits no bus input envelope:

```json
{
  "bus_input_status": "blocked_no_bus_input",
  "bus_input_reason": "watch_scope_authority_invalid",
  "bus_input_envelope_emitted": false,
  "bus_input_envelope": null
}
```

The proof reports `invalid_stored_scope_blocks_before_bus_input: true`.

## Blocked / Idle State Treatment

The verifier proves no Discovery bus input envelope is emitted for:

- disarmed session
- active task
- live/provider gate disabled
- no due watches
- inactive Watch rows
- not-due Watch rows
- backoff Watch rows

These states report `blocked_no_bus_input` and preserve the underlying reason from the source task proof.

## No-Provider / No-Ref / No-Evidence Proof

The proof explicitly reports:

- `provider_movement: false`
- `watch_execution: false`
- `dispatch_runner_invoked: false`
- `collectors_called: false`
- `provider_calls: 0`
- `live_api_calls: 0`
- `zkill_calls: 0`
- `esi_calls: 0`
- `discovery_refs_written: false`
- `discovery_ref_writes: 0`
- `evidence_created: false`
- `evidence_writes: 0`
- `hydration_writes: 0`
- `metadata_writes: 0`
- `api_request_log_writes: 0`
- `data_quality_warning_writes: 0`

## Mutation Boundary Proof

Focused verification captures before/after table counts for known Atlas durable tables and proves they are unchanged for emitted, invalid, blocked, and idle cases.

Observed sample actor table proof:

```json
{
  "before": {
    "killmails": 0,
    "activity_events": 0,
    "discovered_killmail_refs": 0,
    "fetch_runs": 0,
    "api_request_logs": 0,
    "metadata_runs": 0,
    "ingestion_audits": 0,
    "data_quality_warnings": 0,
    "entities": 0,
    "watchlist_entities": 1,
    "system_watches": 0,
    "assessment_artifacts": 0
  },
  "after": {
    "killmails": 0,
    "activity_events": 0,
    "discovered_killmail_refs": 0,
    "fetch_runs": 0,
    "api_request_logs": 0,
    "metadata_runs": 0,
    "ingestion_audits": 0,
    "data_quality_warnings": 0,
    "entities": 0,
    "watchlist_entities": 1,
    "system_watches": 0,
    "assessment_artifacts": 0
  },
  "unchanged": true
}
```

## Verification

Commands run:

```txt
node --check src\main\services\watchDiscoveryBusInputEnvelopeService.js
node --check scripts\verify-watch-discovery-bus-input-envelope.js
node --check src\main\services\watchPacketDryRunDispatchParityService.js
npm.cmd run verify:watch-discovery-bus-input-envelope
npm.cmd run verify:watch-task-creation-fixture-proof
npm.cmd run verify:watch-task-creation-boundary
npm.cmd run verify:watch-packet-dry-run-dispatch-parity
npm.cmd run verify:watch-executor-tick-dry-run
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- `node --check` commands passed.
- `npm.cmd run verify:watch-discovery-bus-input-envelope` passed.
- `npm.cmd run verify:watch-task-creation-fixture-proof` passed.
- `npm.cmd run verify:watch-task-creation-boundary` passed.
- `npm.cmd run verify:watch-packet-dry-run-dispatch-parity` passed.
- `npm.cmd run verify:watch-executor-tick-dry-run` passed.
- `npm.cmd run verify:command-authority` passed.
- `npm.cmd run verify:passive-side-effects` passed.
- `npm.cmd run verify:protected-terms` passed with warning-only advisory output. The final working-set scan covered 5 changed files and reported 472 warning-only items, mostly from the long existing `workspace/current.md` record; no renames or protected-word JSON updates were performed.
- `git diff --check` passed; CRLF normalization warnings were emitted for existing modified text files.
- `git status --short --branch` showed branch `main...origin/main [ahead 11]` with HS340 working-tree changes:
  - `M package.json`
  - `M src/main/services/watchPacketDryRunDispatchParityService.js`
  - `M workspace/current.md`
  - `?? scripts/verify-watch-discovery-bus-input-envelope.js`
  - `?? src/main/services/watchDiscoveryBusInputEnvelopeService.js`
  - `?? workspace/DevHS340-watch-discovery-bus-input-envelope.md`

## Boundary Confirmation

Discovery refs, Evidence/EVEidence, provider movement, Watch execution, schema, UI, enforcement, support artifacts, durable Watch results, relationship tags, and fourth-lane behavior remain unopened.

No Watch dispatch runners, collectors, zKillboard, ESI, provider/live/API calls, Discovery ref writes, Evidence/EVEidence writes, Hydration/metadata writes, API log/warning writes, real/operator Watch mutations, real runtime packet persistence, broad provider queue, protected-word JSON updates, renderer UI, support artifact creation, runtime enforcement, or command blocking were added.

## Recommended Next Action

Overseer review HS340 and decide whether the next seam should remain pre-live with a no-provider Discovery intake consumer proof, or pause Watch runtime and shape the Manual Discovery path into the same shared candidate-intake model.
