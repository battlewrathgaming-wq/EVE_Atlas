# DevHS347 Discovery Pickup Packet Proof

Status: complete
Date: 2026-06-06
Role: Dev

## Scope

Implemented HS347 as a read-only/local-only Discovery pickup packet proof.

Core boundary preserved:

- Watch is a scheduler and scope-authority source.
- Discovery is the acquisition utility.
- A due Watch emits Discovery pickup intent; it does not acquire candidates itself.
- Stored accepted `included_system_ids` are system/radius execution authority.
- Center/radius remain provenance/explanation only after acceptance.

## Files Changed

- `package.json`
- `src/main/services/watchDiscoveryPickupPacketProofService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-watch-discovery-pickup-packets.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `workspace/current.md`
- `workspace/DevHS347-discovery-pickup-packet-proof.md`

## Command / Helper Added

Added read-only renderer-eligible service command:

```txt
watch.discovery_pickup_packet_proof.preview
```

Added helper:

```txt
buildWatchDiscoveryPickupPacketProof(...)
```

Added verifier:

```txt
npm.cmd run verify:watch-discovery-pickup-packets
```

The proof composes `watch.executor_tick_dry_run.preview` to select one due Watch without calling `WatchSessionExecutor.tick(...)`, dispatch runners, collectors, providers, TaskRunner methods, or persistence writers.

## Sample Actor Packet

```json
{
  "source_lane": "watch",
  "source_kind": "actor",
  "scope_key": "actor:character:90000001",
  "watch_id": 1,
  "selected_command": "actor.watch",
  "packet_index": 0,
  "packet_count": 1,
  "candidate_only": true,
  "pickup_intent_only": true,
  "durable_ref_written": false,
  "evidence_created": false,
  "hydration_created": false,
  "observation_created": false,
  "provider_movement": false,
  "watch_execution": false,
  "lookback_seconds": 1209600,
  "caps": {
    "max_refs": 5,
    "max_expansions": 5
  },
  "provider_target_posture": {
    "provider": "zkill",
    "target_kind": "character",
    "target_id": 90000001,
    "provider_calls": 0,
    "live_api_calls": 0,
    "acquisition_not_started": true
  },
  "entity_type": "character",
  "entity_id": 90000001,
  "entity_name": "Pickup Packet Pilot"
}
```

## Sample System/Radius Packet

System/radius fixture stored four accepted system IDs and emitted four pickup packets.

One packet sample:

```json
{
  "source_lane": "watch",
  "source_kind": "system_radius",
  "scope_key": "system:30003597:radius:1",
  "watch_id": 1,
  "selected_command": "system.radius.watch",
  "packet_index": 0,
  "packet_count": 4,
  "candidate_only": true,
  "pickup_intent_only": true,
  "durable_ref_written": false,
  "evidence_created": false,
  "hydration_created": false,
  "observation_created": false,
  "provider_movement": false,
  "watch_execution": false,
  "lookback_seconds": 86400,
  "accepted_system_ids": [
    30003597,
    30003599,
    30003601,
    30003602
  ],
  "candidate_system_id": 30003597,
  "accepted_scope_source": "stored_watch_scope",
  "center_system_id": 30003597,
  "radius_jumps": 1,
  "center_radius_role": "provenance_and_explanation",
  "center_radius_used_as_execution_authority": false,
  "provider_target_posture": {
    "provider": "zkill",
    "target_kind": "solar_system",
    "target_id": 30003597,
    "provider_calls": 0,
    "live_api_calls": 0,
    "acquisition_not_started": true
  }
}
```

System/radius `candidate_system_id` values exactly matched the stored accepted IDs in deterministic order:

```txt
[30003597, 30003599, 30003601, 30003602]
```

## Zero Packet Cases

The verifier proves zero pickup packets for:

- invalid stored system/radius scope: `watch_scope_authority_invalid`
- disarmed session: `session_not_armed`
- active task: `active_task`
- live-disabled gate: `live_api_disabled`
- no due watches: `no_due_watches`
- inactive Watch rows
- not-due Watch rows
- backoff Watch rows

## No Provider / Durable Write Proof

The proof reports:

- `provider_calls: 0`
- `live_api_calls: 0`
- `zkill_calls: 0`
- `esi_calls: 0`
- `watch_dispatches: 0`
- `dispatch_runner_invocations: 0`
- `collectors_called: false`
- `task_runner_methods_called: []`
- `tasks_created: 0`
- `discovered_killmail_refs_written: 0`
- `discovery_refs_mutated: 0`
- `evidence_writes: 0`
- `hydration_writes: 0`
- `metadata_writes: 0`
- `api_request_log_writes: 0`
- `data_quality_warning_writes: 0`
- `watch_mutations: 0`
- `schema_changes: 0`

Mutation proof captures before/after durable table counts and verifies they are unchanged.

## Verification

Commands run:

```txt
node --check src\main\services\watchDiscoveryPickupPacketProofService.js
node --check scripts\verify-watch-discovery-pickup-packets.js
node --check src\main\services\serviceRegistry.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check src\main\services\enforcementDryRunService.js
npm.cmd run verify:watch-discovery-pickup-packets
npm.cmd run verify:command-authority
npm.cmd run verify:service-registry
npm.cmd run verify:passive-side-effects
npm.cmd run verify:watch-executor-tick-dry-run
npm.cmd run verify:watch-runtime-packet-plan
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- `node --check` commands passed.
- `npm.cmd run verify:watch-discovery-pickup-packets` passed.
- `npm.cmd run verify:command-authority` passed.
- `npm.cmd run verify:service-registry` passed after creating missing local test temp directory `.tmp\passive-side-effects`.
- `npm.cmd run verify:passive-side-effects` passed.
- `npm.cmd run verify:watch-executor-tick-dry-run` passed.
- `npm.cmd run verify:watch-runtime-packet-plan` passed.
- `npm.cmd run verify:enforcement-dry-run` passed with coverage complete for 101 commands.
- `npm.cmd run verify:protected-terms` passed with warning-only advisory output: final working-set scan covered 9 files and reported 739 warning-only items; no renames or protected-word JSON updates were performed.
- `git diff --check` passed; CRLF normalization warnings were emitted for existing modified text files.
- `git status --short --branch` showed branch `main...origin/main [ahead 16]` with HS347 working-tree changes:
  - `M package.json`
  - `M scripts/verify-command-authority.js`
  - `M scripts/verify-passive-side-effects.js`
  - `M scripts/verify-service-registry.js`
  - `M src/main/services/enforcementDryRunService.js`
  - `M src/main/services/serviceRegistry.js`
  - `M workspace/current.md`
  - `?? scripts/verify-watch-discovery-pickup-packets.js`
  - `?? src/main/services/watchDiscoveryPickupPacketProofService.js`
  - `?? workspace/DevHS347-discovery-pickup-packet-proof.md`

## Boundary Confirmation

No Watch execution, Watch dispatch runner invocation, collector call, zKillboard call, ESI call, provider/live/API call, `discovered_killmail_refs` write, Evidence/EVEidence write, Hydration/metadata write, API log/warning write, real/operator Watch mutation, real runtime packet persistence, real/product task creation, broad provider queue, schema change, renderer UI work, runtime enforcement, command blocking, support artifact creation, durable Watch result identity, relationship tag, protected-word JSON update, or fourth-lane behavior was opened.

## Recommended Next Action

Overseer review HS347 and decide whether the next packet should prove a shared Manual/User-driven Discovery pickup packet shape, or continue Watch-side pre-provider architecture toward a no-provider pickup consumer fixture.
