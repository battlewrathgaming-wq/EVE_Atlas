# DevHS316 Watch Operator Confirmation Listen-Hook Contract

Status: complete
Date: 2026-06-05
Executor: Dev

## Summary

Implemented a read-only/local-only contract preview:

```txt
watch.operator_confirmation_contract.preview
```

The preview proves the path from system/radius preflight visibility to explicitly confirmed accepted scope for `watch.create`, without implementing renderer UI behavior. It keeps the core rule sharp: visible/prepared is not accepted; only an explicit renderer/listen-hook confirming act can produce accepted scope.

## Files Changed

- `package.json`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/services/watchOperatorConfirmationContractService.js`
- `scripts/verify-watch-operator-confirmation-contract.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-enforcement-dry-run.js`
- `workspace/current.md`
- `workspace/DevHS316-watch-operator-confirmation-listen-hook-contract.md`

Existing workspace packet files from Overseer/current remained in the tree:

- `workspace/overview.md`
- `workspace/OverseerHS316-watch-operator-confirmation-listen-hook-contract-runway.md`

## Command Shape

Registered:

```txt
watch.operator_confirmation_contract.preview
```

Command posture:

- classification: `read-only`
- effects: `read-only`
- renderer eligible: `true`
- enforcement coverage:
  - storage/action class: `local_db_inspection`
  - External I/O dependency: `none`
  - runtime context: `watch_operator_confirmation_contract_readout`
  - enforcement status: `read_only_non_enforcing_proof`

## Contract Proof

The preview discloses the source preflight shape from:

```txt
watch.system_radius_authoring_preflight.preview
```

Visible operator payload before acceptance includes:

- center system
- radius
- included systems
- accepted/storable `included_system_ids`
- cap/blocked/local topology status

The listen-hook boundary explicitly reports:

```txt
list_visible_is_acceptance: false
focus_is_acceptance: false
hover_is_acceptance: false
highlight_is_acceptance: false
keyboard_navigation_is_acceptance: false
successful_local_topology_lookup_is_acceptance: false
explicit_operator_confirmation_required: true
```

Represented states:

```txt
preflight_visible_not_accepted
confirmation_ready
confirmation_pending_operator_intent
confirmed_accepted_scope_payload
blocked_not_confirmable
```

## Accepted Payload Shape

Only explicit confirmation produces an accepted `watch.create` payload shape:

```json
{
  "command": "watch.create",
  "watchType": "system_radius",
  "centerSystemId": 30003597,
  "centerSystemName": "Hare",
  "radiusJumps": 1,
  "included_system_ids": [
    30003597,
    30003601,
    30003599,
    30003598,
    30003596
  ],
  "accepted_preflight_action": "watch.system_radius_authoring_preflight.preview",
  "accepted_preflight_status": "acceptable",
  "accepted_scope_source": "operator_confirmation_listen_hook"
}
```

The payload preserves exact accepted `included_system_ids`. Center/radius remain provenance/explanation/management. Accepted included IDs are stored-scope authority. Renderer-provided IDs are not authoritative and may not replace locally validated preflight IDs.

## Sample Output

Focused verifier sample:

```json
{
  "visible_state": {
    "state": "preflight_visible_not_accepted",
    "accepted_payload_ready_for_watch_create": false
  },
  "confirmed_state": {
    "state": "confirmed_accepted_scope_payload",
    "accepted_payload_ready_for_watch_create": true,
    "included_system_ids": [
      30003597,
      30003601,
      30003599,
      30003598,
      30003596
    ],
    "center_radius_role": "provenance_explanation_management",
    "would_recompute_topology_from_center_radius": false
  },
  "blocked_states": {
    "capped": "blocked_not_confirmable",
    "unknown": "blocked_not_confirmable"
  }
}
```

## Boundary Confirmation

No renderer UI, popup/modal behavior, final copy/design, Watch execution, tasks, provider/live/API calls, Watch row mutation, Discovery ref mutation, Evidence/EVEidence writes, Hydration writes, schema change, support artifact, runtime enforcement, command blocking, Watch result semantics, relationship tags, source-term renames, protected-word JSON updates, or fourth-lane behavior were added.

## Verification

Passed:

```txt
node --check src\main\services\watchOperatorConfirmationContractService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-watch-operator-confirmation-contract.js
npm.cmd run verify:watch-operator-confirmation-contract
npm.cmd run verify:system-radius-authoring-preflight
npm.cmd run verify:watch-create-accepted-scope-contract
npm.cmd run verify:watch-authored-execution-readiness
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Final hygiene:

```txt
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- `npm.cmd run verify:protected-terms` passed with warning-only advisory output: 682 warnings across 10 changed working-set files; no renames or protected-word JSON updates were performed.
- `git diff --check` passed with CRLF normalization warnings only.
- `git status --short --branch` showed branch `main...origin/main` with HS316 working-tree changes.

## Risks / Next Action

This is a contract proof only. It does not choose a UI affordance and does not implement renderer behavior. The next likely seam is Overseer review, then a bounded renderer/operator confirmation implementation packet if accepted.
