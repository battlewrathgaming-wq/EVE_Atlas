# DevHS368 - Watch-to-Discovery Acquisition Split Fixture Bridge

Status: Complete
Executor: Dev
Date: 2026-06-07

## Scope

Implemented the read-only/local-only fixture proof command:

```txt
watch.discovery_acquisition_split_fixture.preview
```

Added focused verification:

```txt
verify:watch-discovery-acquisition-split-fixture
```

The command proves the bridge:

```txt
current Watch dispatch payload
-> Discovery-owned acquisition request
-> fixture pickup packets / fixture zKill outcomes
-> canonical Discovery receipt basis
-> watch_summary projection
```

It does not enter `collectActorWatch(...)`, `collectSystemRadiusWatch(...)`, `WatchSessionExecutor.tick(...)`, `TaskRunner.runDetachedTask(...)`, providers, writes, or runtime dispatch.

## Files Changed

HS368 implementation:

- `src/main/services/watchDiscoveryAcquisitionSplitFixtureService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-watch-discovery-acquisition-split-fixture.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS368-watch-to-discovery-acquisition-split-fixture-bridge.md`

Pre-existing dirty/untracked Discovery-series workspace state was preserved and not reverted.

## Command Shape

`watch.discovery_acquisition_split_fixture.preview` composes existing accepted proof surfaces:

- `watch.executor_tick_dry_run.preview`
- `watch.packet_dry_run_dispatch_parity.preview`
- `watch.discovery_pickup_packet_proof.preview`
- `discovery.pickup_consumer_fixture.preview`
- `discovery.receipt_projection_fixture.preview`

The bridge output includes:

- `source_watch`
- `source_kind`
- `current_dispatch_payload_basis`
- `discovery_acquisition_request`
- `pickup_packet_count`
- `packet_targets`
- `fixture_provider_outcome_summary`
- `canonical_discovery_receipt_basis`
- `watch_summary_projection`
- `mixed_collector_non_invocation_proof`
- `boundary_flags`
- `table_mutation_proof`

The dispatch basis proves `dispatchFor(...)` payload compatibility by using the existing parity proof. The runner can be present, but it is not invoked.

## Fixture Cases Covered

Focused verifier covers:

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
- service command invocation

## Sample Actor Bridge

Focused verifier sample demonstrated:

```json
{
  "source_kind": "watch_actor",
  "current_dispatch_payload_basis": {
    "would_be_command": "actor.watch",
    "dispatch_for_command": "actor.watch",
    "payload_parity": "matches",
    "dispatch_runner_present_but_not_invoked": true,
    "dispatch_runner_invoked": false,
    "mixed_collectors_invoked": false
  },
  "discovery_acquisition_request": {
    "owner": "Discovery",
    "source_intent_family": "watch",
    "source_dispatch_command": "actor.watch",
    "request_posture": "fixture_acquisition_ready",
    "packet_count": 1,
    "provider_calls": 0,
    "live_api_calls": 0
  },
  "fixture_provider_outcome_summary": {
    "packet_outcome_counts": {
      "complete_refs_found": 1
    }
  }
}
```

## Sample System/Radius Bridge

Focused verifier sample demonstrated:

```json
{
  "source_kind": "watch_system_radius",
  "current_dispatch_payload_basis": {
    "would_be_command": "system.radius.watch",
    "dispatch_for_command": "system.radius.watch",
    "payload_parity": "matches",
    "dispatch_runner_present_but_not_invoked": true
  },
  "discovery_acquisition_request": {
    "accepted_scope_basis": {
      "basis_kind": "stored_accepted_included_system_ids",
      "accepted_system_ids": [30003597, 30003599, 30003601, 30003602],
      "center_system_id": 30003597,
      "radius_jumps": 1,
      "center_radius_used_as_execution_authority": false
    },
    "packet_count": 4
  },
  "watch_summary_projection": {
    "packet_outcome_counts": {
      "complete_refs_found": 1,
      "complete_no_refs": 1,
      "provider_deferred": 1,
      "failed_retryable": 1
    }
  }
}
```

## Mixed Collector Proof

The bridge reports:

```json
{
  "collectActorWatch_entered": false,
  "collectSystemRadiusWatch_entered": false,
  "dispatch_runner_invoked": false,
  "dispatch_runner_invocations": 0,
  "task_runner_methods_called": [],
  "excluded_runtime_paths": [
    "collectActorWatch",
    "collectSystemRadiusWatch",
    "WatchSessionExecutor.tick",
    "TaskRunner.runDetachedTask"
  ]
}
```

## Boundaries Confirmed

No provider calls, live/API calls, mixed collector invocation, live Watch task dispatch, task creation, Watch mutation, Discovery ref writes, Evidence/EVEidence writes, ESI Evidence Expansion, Hydration/metadata writes, API log/warning writes, `fetch_runs` writes, durable task/packet/receipt schema, queue, dispatcher, lease, support artifact, UI, runtime enforcement, command blocking, source-term rename, or protected-word JSON update was added.

Candidate refs remain possible leads only. Discovery owns the acquisition request and receipt basis. Watch remains the source of scheduler intent and accepted scope.

## Verification

Passed:

```txt
node --check src\main\services\watchDiscoveryAcquisitionSplitFixtureService.js
node --check scripts\verify-watch-discovery-acquisition-split-fixture.js
node --check src\main\services\serviceRegistry.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check src\main\services\enforcementDryRunService.js
npm.cmd run verify:watch-discovery-acquisition-split-fixture
npm.cmd run verify:watch-discovery-pickup-packets
npm.cmd run verify:discovery-pickup-consumer-fixture
npm.cmd run verify:discovery-receipt-projection-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- `verify:watch-discovery-acquisition-split-fixture`: passed; printed actor, system/radius, and held bridge samples.
- `verify:watch-discovery-pickup-packets`: passed.
- `verify:discovery-pickup-consumer-fixture`: passed.
- `verify:discovery-receipt-projection-fixture`: passed.
- `verify:service-registry`: passed.
- `verify:command-authority`: passed.
- `verify:passive-side-effects`: passed.
- `verify:enforcement-dry-run`: passed with complete command coverage, `105/105`.
- `verify:protected-terms`: exit code `0`, warning-only advisory scan; no renames and no protected-word JSON updates.
- `git diff --check`: passed; only line-ending warnings.
- `git status --short --branch`: `## main...origin/main [ahead 19]` with HS368 edits plus pre-existing dirty/untracked Discovery-series files.

## Risks / Notes

- This is a fixture bridge only. It does not redirect real Watch executor movement.
- The current live-capable `actor.watch` and `system.radius.watch` commands still point at mixed collector paths.
- Durable Discovery task/packet/receipt schema remains parked.
- Watch schedule advancement from receipt remains parked.

## Recommended Next Action

Overseer review HS368 for acceptance. The next practical seam is either a further no-live split proof around the future Discovery acquisition utility boundary or a narrow design packet for how the mixed collector path will be retired/redirected without enabling provider movement.
