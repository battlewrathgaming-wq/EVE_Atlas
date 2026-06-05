# DevHS307 System Radius Watch Authoring Acceptance Payload

Status: revised after HS308 redirect; pending Overseer review
Date: 2026-06-05
Executor: Dev

## Summary

Implemented the bounded read-only proof for turning an accepted HS304 system/radius authoring preflight into a candidate future `watch.create` mutation-contract payload without creating a Watch.

New command:

```txt
watch.system_radius_acceptance_payload.preview
```

The preview composes from `watch.system_radius_authoring_preflight.preview`, preserves the accepted `included_system_ids` as the only future stored scope authority, and keeps center/radius as provenance and explanation. After HS308, it also explicitly discloses that current `watch.create` does not yet consume accepted preflight IDs, so the payload is not directly executable by current mutation code.

## Files Changed

- `package.json`
- `src/main/services/systemRadiusAcceptancePayloadService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-system-radius-acceptance-payload.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-enforcement-dry-run.js`
- `workspace/current.md`
- `workspace/DevHS307-system-radius-watch-authoring-acceptance-payload.md`

## Command / Classification Shape

`watch.system_radius_acceptance_payload.preview` is registered as:

- classification: `read-only`
- renderer eligible: `true`
- effects: `read-only`
- enforcement dry-run class: `local_db_inspection`
- runtime context: `system_radius_acceptance_payload_readout`
- enforcement status: `read_only_non_enforcing_proof`
- External I/O dependency: `none`

The command reports:

- source preflight action/status
- whether the source preflight is acceptable for Watch authoring
- selected center system ID/name
- radius
- exact accepted `included_system_ids`
- future target command: `watch.create`
- current `watch.create` compatibility: `requires_future_mutation_contract`
- current `watch.create` consumes accepted preflight IDs: `false`
- future mutation contract required: `true`
- future payload directly executable now: `false`
- future confirmation posture: `confirm:watch.create`
- center/radius role: provenance/explanation only
- stored scope authority: accepted included IDs
- optional future operator settings
- explicit no-write/no-dispatch/no-provider posture

## Sample Output

Focused verifier sample:

```json
{
  "action": "watch.system_radius_acceptance_payload.preview",
  "source_preflight_action": "watch.system_radius_authoring_preflight.preview",
  "source_preflight_status": "acceptable",
  "payload_ready_for_future_watch_create": true,
  "payload_ready_for_future_mutation_contract": true,
  "current_watch_create_compatibility": "requires_future_mutation_contract",
  "current_watch_create_consumes_preflight_included_ids": false,
  "future_mutation_contract_required": true,
  "future_payload_directly_executable_now": false,
  "future_target_command": "watch.create",
  "center_radius_role": "provenance_and_explanation_only",
  "stored_scope_authority_role": "included_system_ids_are_future_execution_authority_after_watch_create",
  "included_system_ids": [
    30003597,
    30003601,
    30003599,
    30003598,
    30003596
  ],
  "candidate_future_watch_create_payload": {
    "type": "system_radius",
    "contract_role": "candidate_future_mutation_contract",
    "directly_executable_by_current_watch_create": false,
    "targetType": "system",
    "targetId": 30003597,
    "targetName": "Hare",
    "center_system_id": 30003597,
    "center_system_name": "Hare",
    "radius_jumps": 1,
    "included_system_ids": [
      30003597,
      30003601,
      30003599,
      30003598,
      30003596
    ],
    "stored_scope_authority": {
      "included_system_ids": [
        30003597,
        30003601,
        30003599,
        30003598,
        30003596
      ],
      "source": "accepted_preflight_included_system_ids",
      "current_watch_create_consumes_this_field": false,
      "future_mutation_contract_required": true
    },
    "provenance": {
      "center_system_id": 30003597,
      "center_system_name": "Hare",
      "radius_jumps": 1,
      "source_preflight_action": "watch.system_radius_authoring_preflight.preview"
    }
  },
  "would_write_watch_row": false,
  "watch_rows_written": 0,
  "watch_dispatches": 0,
  "provider_calls": 0
}
```

## HS308 Compatibility Revision

Current `watch.create` path disclosed by the preview:

```txt
serviceRegistry watch.create
-> mutatingActionService.runWatchCreateService
-> normalizeSystemRadiusWatchScope
-> watchlistRepository.addSystemRadiusWatch
-> TopologyService.getSystemsWithinRadius
```

The preview now proves:

- `current_watch_create_consumes_preflight_included_ids === false`
- `future_mutation_contract_required === true`
- `future_payload_directly_executable_now === false`
- the candidate payload keeps accepted preflight IDs as future stored-scope authority
- the candidate payload is not claimed as a direct current `watch.create` command payload
- no Watch row writes occur while proving the gap

## Rejection Coverage

The focused verifier proves these cases are not accepted:

- capped preflight -> `preflight_capped_not_acceptable`
- unknown system -> `preflight_unknown_system`
- invalid radius -> `preflight_invalid_radius`
- missing topology -> `preflight_missing_topology`
- forged/mismatched included IDs -> `payload_claim_rejected`

The forged case reports `included_system_ids_claim_mismatch` and keeps the future payload null.

## Boundary Confirmation

Confirmed:

- no provider calls
- no live/API verification
- no Watch row writes
- no Watch dispatch
- no task creation
- no Discovery ref mutation
- no Evidence/EVEidence writes
- no Hydration or metadata writes
- no schema changes
- no `watch.create` behavior change
- no topology traversal behavior change
- no Discovery ref identity change
- no durable `watch_result` / `watch_result_items`
- no relationship tags
- no renderer/UI behavior beyond existing read-only command registration
- no runtime enforcement or command blocking
- no support artifacts
- no fourth lane / fast lane

## Verification

Passed:

```txt
node --check src\main\services\systemRadiusAcceptancePayloadService.js
node --check scripts\verify-system-radius-acceptance-payload.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:system-radius-acceptance-payload
npm.cmd run verify:system-radius-authoring-preflight
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:watch-scope-authority-conformance
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

`verify:protected-terms` completed with warning-only advisory output: 663 warnings across 11 changed working-set files; no renames or protected-word JSON updates were performed.

`git diff --check` passed with CRLF normalization warnings only.

`git status --short --branch` showed:

```txt
## main...origin/main
 M package.json
 M scripts/verify-command-authority.js
 M scripts/verify-enforcement-dry-run.js
 M scripts/verify-passive-side-effects.js
 M scripts/verify-service-registry.js
 M src/main/services/enforcementDryRunService.js
 M src/main/services/serviceRegistry.js
 M workspace/current.md
?? scripts/verify-system-radius-acceptance-payload.js
?? src/main/services/systemRadiusAcceptancePayloadService.js
?? workspace/DevHS307-system-radius-watch-authoring-acceptance-payload.md
?? workspace/OverseerHS308-hs307-system-radius-acceptance-payload-review.md
```

## Risks / Open Decisions

- This is not Watch creation; future `watch.create` mutation contract work is still required before accepted preflight IDs can be consumed as stored-scope authority at creation time.
- The proof intentionally rejects any caller-supplied included IDs that do not match the accepted preflight set.
- Watch/task result identity remains parked.

## Recommended Next Action

Overseer should review HS307. If accepted, the next bounded step can decide whether to wire this acceptance payload into a confirmed Watch authoring path or keep resting before UI/mutation work.
