# Overseer HS265 - HS264 Hydration Pickup Contract Review

Status: accepted
Date: 2026-06-05
Reviewed handoff: `workspace/DevHS264-hydration-pickup-eligibility-contract-preview.md`
Runway: `workspace/OverseerHS264-hydration-pickup-eligibility-contract-preview-runway.md`

## Result

Accepted. No blocking issue found.

HS264 adds the intended read-only selected-ID pickup eligibility / execution-input contract preview:

```text
metadata.hydration_pickup_contract.preview
```

The command proves that a future execution command can receive explanation/hint material while still being required to rebuild trusted local-first posture before any provider movement.

## Scope Review

Accepted implementation points:

- Registered `metadata.hydration_pickup_contract.preview` as read-only and renderer-eligible.
- Added `src/main/services/hydrationPickupContractService.js`.
- Added `scripts/verify-hydration-pickup-contract.js` and `npm.cmd run verify:hydration-pickup-contract`.
- Added service registry, command authority, enforcement dry-run, and passive side-effect coverage.
- Reuses `buildHydrationRequestPosturePreview` instead of trusting renderer posture.
- Marks future execution input as hints/explanation only.
- Marks renderer-supplied local labels, gate summaries, storage posture, External I/O posture, live/cadence posture, and pickup eligibility as non-authority.

## States Proven

Rejected as pickup candidates:

- `not_a_request`
- `invalid`
- `insufficient_basis`
- `already_local`
- `local_lookup_available`
- `held`
- `blocked`

Accepted as a non-durable pickup candidate only:

```text
request_posture_state=provider_needed
provider_posture=released_to_normal_gates_only
```

This still does not authorize execution, provider calls, Hydration writes, persistence, dispatcher work, or worker work.

## Execution Input Contract

Accepted hint fields:

- `id_type`
- `id_value`
- `source_surface`
- `source_context`
- `basis_anchor`
- `basis_layer`
- `request_reason`
- `request_posture_id`
- `request_digest`
- `posture_gate_summary`

Accepted boundary:

```text
execution input is hints only
request digest is freshness evidence only
future execution must rebuild local-first posture from trusted local state
future execution must short-circuit to local readability if a label has become local
```

## Verification Re-run

Overseer re-ran:

```text
node --check src\main\services\serviceRegistry.js
node --check src\main\services\hydrationPickupContractService.js
node --check scripts\verify-hydration-pickup-contract.js
npm.cmd run verify:hydration-pickup-contract
npm.cmd run verify:hydration-request-posture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
```

Results: passed.

Protected-term check produced warning-only advisory output from the working set and performed no renames or protected-word JSON updates.

`git diff --check` produced only CRLF normalization warnings.

## Resting State

No active Dev runway is open after HS264 acceptance.

Provider-backed selected-ID Hydration execution remains unopened. Pickup/request persistence, dispatcher/worker behavior, Watch/background Hydration pickup, schema changes, runtime enforcement, support artifacts, and renderer UI behavior remain parked.
