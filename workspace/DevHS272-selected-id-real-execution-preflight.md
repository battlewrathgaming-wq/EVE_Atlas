# DevHS272 Selected-ID Real Execution Preflight

Status: complete for Overseer review

## Summary

Implemented the read-only selected-ID real Hydration execution preflight:

```txt
metadata.hydration_selected_id_real_execution_preflight.preview
```

This is a preview/readout only. It composes current local-first request posture, non-durable pickup contract, External I/O posture, live/provider gate posture, storage write posture, supported selected-ID type, expected future write path, and execution/write revalidation checklists.

It does not call providers, write Hydration output, create real operator Hydration execution, persist Bucket state, create a Dispatcher, change schema, activate enforcement, or change UI.

## Files Changed

- `package.json`
- `src/main/services/hydrationSelectedIdRealExecutionPreflightService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-hydration-selected-id-real-execution-preflight.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-service-registry.js`
- `workspace/current.md`
- `workspace/DevHS272-selected-id-real-execution-preflight.md`

## Command / Service Shape

`metadata.hydration_selected_id_real_execution_preflight.preview`:

- classification: `read-only`
- renderer eligible: true, preview/readout only
- storage/action class coverage: `hydration_readability_repair`
- runtime context: `selected_id_hydration_real_execution_preflight_readout`
- enforcement status: `covered_read_only`
- External I/O dependency in dry-run coverage: `none`, because the command itself calls no provider

The service returns:

- selected ID support/readability status
- preflight state and next safe action
- local-first request posture summary
- pickup contract summary
- External I/O, live/provider gate, and storage write posture
- command-authority posture showing confirmation is still future-required
- expected write path for future real execution only
- execution revalidation checklist
- post-provider write checklist
- before/after table mutation proof

## Preflight States Covered

Focused verifier covers:

```txt
not_a_request
invalid
insufficient_basis
already_local
local_lookup_available
held
blocked
provider_needed_but_not_live_ready
provider_needed_live_preflight_ready
```

## Sample Output

Ready sample:

```json
{
  "preflight_state": "provider_needed_live_preflight_ready",
  "request_posture_state": "provider_needed",
  "provider_posture": "released_to_normal_gates_only",
  "external_io_held": false,
  "live_gate_allowed": true,
  "storage_writes_blocked": false,
  "next_safe_action": "future_explicit_execution_command_must_revalidate_before_provider_contact",
  "table_mutation_unchanged": true
}
```

Live-gate-not-ready sample:

```json
{
  "preflight_state": "provider_needed_but_not_live_ready",
  "request_posture_state": "blocked",
  "provider_posture": "blocked",
  "external_io_held": false,
  "live_gate_allowed": false,
  "storage_writes_blocked": false,
  "next_safe_action": "do_not_call_provider_recheck_live_gate_and_command_authority",
  "table_mutation_unchanged": true
}
```

Renderer anti-forgery sample:

```json
{
  "source": "renderer",
  "renderer_payload_authoritative": false,
  "forged_authority_keys_ignored": [
    "localLabel",
    "storagePosture",
    "externalIoState",
    "liveGate",
    "providerPosture"
  ]
}
```

## Table Mutation / Passive Side-Effect Proof

The focused verifier checks unchanged before/after counts for:

- `killmails`
- `activity_events`
- `discovered_killmail_refs`
- `fetch_runs`
- `api_request_logs`
- `metadata_runs`
- `entities`
- `watchlist_entities`
- `system_watches`
- `assessment_artifacts`

The preflight reports zero:

- provider calls
- Hydration writes
- `metadata_runs` writes
- `api_request_logs` writes
- entity writes/upserts
- `activity_events` patches
- Evidence/EVEidence writes
- Discovery ref mutations
- Watch, Marked, or Assessment Memory mutations
- Bucket persistence
- Dispatcher/worker/lease/retry/queue dispatch
- schema changes
- runtime enforcement or command blocking
- UI work

`npm.cmd run verify:passive-side-effects` also includes the new command in seeded and empty DB passive sweeps.

## Verification

Commands run and results:

```txt
node --check src\main\services\serviceRegistry.js
passed

node --check src\main\services\hydrationSelectedIdRealExecutionPreflightService.js
passed

node --check scripts\verify-hydration-selected-id-real-execution-preflight.js
passed

npm.cmd run verify:hydration-selected-id-real-execution-preflight
passed

npm.cmd run verify:hydration-selected-id-execution-fixture
passed

npm.cmd run verify:hydration-pickup-contract
passed

npm.cmd run verify:hydration-request-posture
passed

npm.cmd run verify:service-registry
passed

npm.cmd run verify:command-authority
passed

npm.cmd run verify:enforcement-dry-run
passed

npm.cmd run verify:passive-side-effects
passed

git diff --check
passed with CRLF normalization warnings only

git status --short --branch
branch main...origin/main with HS272 working-tree changes
```

No live/API/provider verification was run.

## Parked Items

Still parked:

- real provider-backed selected-ID Hydration execution
- provider calls
- Hydration writes
- `metadata_runs` writes
- `api_request_logs` writes
- entity writes
- `activity_events` readability patches
- Evidence Expansion changes
- Discovery changes
- Watch/background Hydration pickup
- durable Bucket/pickup/request persistence
- Dispatcher, worker, lease, retry, queue, or background Hydration machinery
- runtime enforcement or command blocking
- renderer UI
- schema changes
- fourth lane / fast lane

## Recommended Next Action

Overseer review HS272. If accepted, the next decision should remain explicit: either continue with another read-only gate/authority proof or open a tightly bounded real execution runway only after Human/Overseer acceptance of provider contact.
