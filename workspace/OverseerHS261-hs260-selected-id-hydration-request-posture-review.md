# Overseer HS261 - HS260 Selected-ID Hydration Request Posture Review

Status: accepted
Date: 2026-06-05
Reviewed handoff: `workspace/DevHS260-selected-id-hydration-request-posture-preview.md`
Runway: `workspace/OverseerHS260-selected-id-hydration-request-posture-preview-runway.md`

## Result

Accepted. No blocking issue found.

HS260 adds the intended read-only selected-ID posture command:

```text
metadata.hydration_request_posture.preview
```

The command proves:

```text
selected unresolved ID
-> explicit operator act
-> local-first lookup
-> Hydration request posture
```

without creating pickup, execution, provider movement, Hydration writes, metadata runs, entity writes, activity-event patches, queues, dispatchers, schema changes, runtime enforcement, storage/config mutation, support artifacts, or renderer UI.

## Scope Review

Accepted implementation points:

- Registered `metadata.hydration_request_posture.preview` as read-only and renderer-eligible.
- Added `src/main/services/hydrationRequestPostureService.js`.
- Added `scripts/verify-hydration-request-posture.js` and `npm.cmd run verify:hydration-request-posture`.
- Added command authority, service registry, enforcement dry-run, and passive side-effect coverage for the new read-only command.
- Kept External I/O on as a posture input only, not authorization.
- Kept local SDE/static lookup gaps out of provider-backed ESI Hydration.
- Kept live provider gate posture passive by using `actionGate`, not `enterLiveProviderAttempt`.

## Output States Accepted

Verified states:

- `not_a_request`
- `already_local`
- `local_lookup_available`
- `held`
- `blocked`
- `invalid`
- `insufficient_basis`

Important accepted behavior:

- Focus/hover-style input remains `not_a_request`.
- Local entity cache labels short-circuit to `already_local`.
- Local static/SDE labels classify as `local_lookup_available`.
- Local SDE gaps remain local lookup readiness, not provider-backed Hydration.
- Supported unresolved IDs with local basis become provider-needed posture, then held/blocked/released by gates.
- External I/O off returns held posture, not failure.
- Missing storage can block future Hydration writes without blocking local readout.
- Free-floating supported IDs without Atlas-local basis remain `insufficient_basis`.
- Unsupported ID types remain invalid.

## Verification Re-run

Overseer re-ran:

```text
node --check src\main\services\hydrationRequestPostureService.js
node --check src\main\services\serviceRegistry.js
node --check scripts\verify-hydration-request-posture.js
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

## Non-Blocking Notes

- The provider posture currently reports storage write block before External I/O hold when both are present. This is acceptable for HS260 because future write blockage is a stronger local precondition and the command remains read-only.
- The preview is not a durable request queue. If pickup/retry/persistence is opened later, it needs a fresh seam.

## Resting State

No active Dev runway is open after HS260 acceptance.

Next candidate seams remain read-only/product-shaping unless Human/Overseer deliberately opens execution:

- request-pickup shaping, still without dispatcher/persistence;
- Hydration write/execution readiness, only after deciding what pickup means;
- broader Watch/Hydration lane relationship review if needed.
