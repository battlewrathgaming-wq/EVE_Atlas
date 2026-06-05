# OverseerHS319 HS318 Renderer System Watch Confirmation Path Review

Status: accepted
Date: 2026-06-05
Role: Overseer

## Reviewed

- `workspace/OverseerHS318-renderer-system-watch-confirmation-path-runway.md`
- `workspace/DevHS318-renderer-system-watch-confirmation-path.md`
- `src/renderer/index.html`
- `src/renderer/app.js`
- `src/renderer/queueWatch.js`
- `src/renderer/styles.css`
- `scripts/verify-renderer-shell.js`
- `workspace/current.md`

## Decision

HS318 is accepted.

The renderer system/radius Watch authoring path now requires an explicit operator confirmation before calling the existing local `watch.create` mutation. Preflight visibility, focus, hover, keyboard navigation, local topology lookup, and included-system display do not create accepted Watch scope.

## Accepted Result

- The existing direct `scope.validate` -> `watch.create` path in `saveSystemWatch()` has been replaced for system/radius authoring.
- The renderer now supports a light preview path:
  - `watch.system_radius_authoring_preflight.preview`
  - included-system/status readout
  - `watch.operator_confirmation_contract.preview`
- The save path requires:
  - explicit confirmation checkbox
  - matching current authoring input
  - fresh save-time confirmation contract
  - `accepted_payload_ready_for_watch_create`
  - accepted payload carrying exact `included_system_ids`
- `watch.create` is called only after explicit confirmation and only with the confirmed accepted scope payload.
- Center system and radius remain provenance/management fields after acceptance.
- Stored included system IDs remain the execution authority for accepted system/radius Watches.
- Actor Watch authoring behavior was not materially changed.
- The renderer work remains intentionally light and is not final UI design.

## Boundary Confirmation

No Watch execution, Watch executor task creation, provider calls, live/API calls, Discovery ref mutation, Evidence/EVEidence writes, Hydration writes, backend `watch.create` behavior changes, topology traversal behavior changes, schema changes, support artifacts, runtime enforcement, command blocking, Watch/result identity, relationship tags, source-term renames, protected-word JSON updates, popup/modal behavior, R-Scanner redesign, or fourth-lane work were opened.

## Verification

Passed:

```txt
node --check src\renderer\app.js
node --check src\renderer\queueWatch.js
node --check scripts\verify-renderer-shell.js
npm.cmd run verify:watch-operator-confirmation-contract
npm.cmd run verify:system-radius-authoring-preflight
npm.cmd run verify:watch-create-accepted-scope-contract
npm.cmd run verify:watch-authored-execution-readiness
npm.cmd run verify:renderer-shell
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
```

Notes:

- `verify:watch-create-accepted-scope-contract` intentionally creates fixture `system_watches` rows and reported only fixture `system_watches` changes.
- `verify:protected-terms` passed with warning-only advisory output: 554 warnings across 6 changed working-set files; no renames or protected-word JSON updates were performed.
- `git diff --check` passed with CRLF normalization warnings only.

## Naming Breadcrumb

`accepted_payload_shape` remains acceptable as contract output for HS316/HS318. For future renderer-local or handoff naming, prefer a `user_confirmed_*` family when the value exists only after explicit operator intent.

Suggested future convention:

```txt
user_confirmed_watch_create_payload
user_confirmed_system_radius_watch_create_payload
```

Meaning:

- created only after explicit operator confirmation
- not created by preflight visibility
- not created by focus, hover, highlight, or keyboard navigation
- not created by successful local topology lookup

This is a naming/readability breadcrumb only. It is not a redirect and does not require Dev churn for HS318.

## Resting State

HS318 can rest. No active Dev runway is open after this acceptance.

Recommended next posture:

- keep enforcement inactive
- keep provider movement closed
- choose the next system hardening seam deliberately after Human/Overseer orientation
