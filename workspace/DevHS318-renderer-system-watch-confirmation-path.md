# DevHS318 Renderer System Watch Confirmation Path

Status: complete
Date: 2026-06-05
Executor: Dev

## Scope

Implemented the bounded renderer/operator confirmation path for existing System / Radius Watch authoring.

The renderer now:

1. lets the operator preview the current system/radius scope;
2. calls `watch.system_radius_authoring_preflight.preview`;
3. renders the included systems/status;
4. calls `watch.operator_confirmation_contract.preview`;
5. requires explicit confirmation before save;
6. reruns a fresh confirmed contract at save time;
7. calls local `watch.create` only with the confirmed accepted payload shape.

## Files Changed

- `src/renderer/index.html`
- `src/renderer/app.js`
- `src/renderer/queueWatch.js`
- `src/renderer/styles.css`
- `scripts/verify-renderer-shell.js`
- `workspace/current.md`
- `workspace/DevHS318-renderer-system-watch-confirmation-path.md`

## Renderer Shape

Added light controls near the existing System / Radius Watch authoring panel:

- `Preview System Watch Scope`
- `Confirm current included systems for local Watch setup`
- `system-watch-scope-preview`

No popup/modal behavior or Watch page redesign was added.

## Confirmation Behavior

`saveSystemWatch()` no longer takes the old direct `scope.validate` to `watch.create` path.

The new path requires:

- explicit confirmation checkbox;
- prior preview for the current exact authoring inputs;
- `watch.system_radius_authoring_preflight.preview`;
- `watch.operator_confirmation_contract.preview`;
- `explicitConfirmation: true` on the save-time contract call;
- `accepted_payload_ready_for_watch_create`;
- `accepted_payload_shape`.

If inputs change after preview, the renderer clears confirmation and requires a fresh preview.

## Accepted Payload Handling

The `watch.create` payload is built from the confirmed `accepted_payload_shape` and preserves exact accepted `included_system_ids`.

Center system and radius remain provenance/explanation/management fields. Renderer-provided IDs are not accepted as authority.

## Operator Feedback

The preview renders:

- state;
- center;
- radius;
- included system count;
- included system names;
- confirmable status;
- visible scope accepted: `no`;
- explicit-confirmation reminder;
- whether an accepted payload is ready.

The readout states:

```txt
Visible preflight, focus, hover, keyboard navigation, and local topology lookup are not acceptance. Save uses a fresh explicit confirmation payload.
```

## Sample Flow

Expected operator path:

```txt
enter system/radius inputs
click Preview System Watch Scope
review included systems/status
check Confirm current included systems for local Watch setup
click Save System Watch
renderer reruns confirmed contract
watch.create receives accepted_payload_shape with exact included_system_ids
```

Blocked/capped/unknown or otherwise non-confirmable preflight states do not produce an accepted payload and cannot save through this path.

## Verification

Passed:

```txt
node --check src/renderer/app.js
node --check src/renderer/queueWatch.js
node --check scripts/verify-renderer-shell.js
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
git status --short --branch
```

Notable verification output:

- `verify:watch-operator-confirmation-contract` confirmed visible preflight is not acceptance and explicit confirmation produces `confirmed_accepted_scope_payload`.
- `verify:system-radius-authoring-preflight` confirmed Hare radius 1 includes 5 systems with 4 direct neighbors and capped scope is not acceptable.
- `verify:watch-create-accepted-scope-contract` confirmed exact accepted IDs are stored and center/radius remain provenance/management. This verifier intentionally creates fixture `system_watches` rows and reported only those fixture rows changed.
- `verify:renderer-shell` confirmed the new renderer controls, preview contract calls, explicit confirmation input, accepted payload usage, passive-signal boundary copy, and CSS hooks.
- `verify:protected-terms` passed with warning-only advisory output: 554 warnings across 6 changed working-set files; no renames or protected-word JSON updates performed.
- `git diff --check` passed with CRLF normalization warnings only.
- `git status --short --branch` reported `## main...origin/main` with HS318 working-tree changes.

## Boundary Confirmation

No final UI design, popup/modal behavior, R-Scanner redesign, Watch execution, Watch executor tasks, provider calls, live/API calls, Discovery ref mutation, Evidence/EVEidence writes, Hydration writes, backend `watch.create` behavior changes, topology traversal changes, schema changes, support artifacts, runtime enforcement, command blocking, Watch/result identity, relationship tags, source-term renames, protected-word JSON updates, or fourth-lane work were added.

## Recommended Next Action

Overseer review HS318 for acceptance, with attention on whether the lightweight checkbox/save shape is enough for the current implementation milestone before any future design-phase UI work.
