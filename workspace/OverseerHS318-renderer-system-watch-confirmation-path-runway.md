# OverseerHS318 Renderer System Watch Confirmation Path Runway

Status: open
Date: 2026-06-05
Owner: Overseer
Executor: Dev
Expected handoff: `workspace/DevHS318-renderer-system-watch-confirmation-path.md`

## Human Intent

Atlas should now wire the accepted Watch setup confirmation path lightly into the existing renderer.

The behavior should remain deliberately bounded:

```txt
resolve local system/radius preflight
show included systems
wait for explicit operator confirmation
then create the Watch using the accepted included_system_ids
```

The final UI feel is still design-phase work. This packet should add a small practical path, not a redesign.

## Task

Implement a bounded renderer/operator confirmation path for existing System / Radius Watch authoring.

Use the existing Watch authoring panel in:

```txt
src/renderer/index.html
src/renderer/queueWatch.js
src/renderer/app.js
src/renderer/styles.css
```

Current direct path to harden:

```txt
src/renderer/queueWatch.js saveSystemWatch()
```

Today that path validates scope and calls `watch.create` directly. Change it so system/radius Watch authoring uses the accepted preflight/confirmation path.

## Required Flow

1. Operator enters system/radius Watch inputs.
2. Renderer can run local preflight:

```txt
watch.system_radius_authoring_preflight.preview
```

3. Renderer displays the included system list and status.
4. Renderer calls or reflects:

```txt
watch.operator_confirmation_contract.preview
```

5. Passive visibility/focus/hover/highlight must not create a Watch.
6. Only explicit operator confirmation may call `watch.create`.
7. The `watch.create` payload must use the confirmed accepted payload shape, preserving exact `included_system_ids`.
8. After `watch.create`, existing schedule/status refresh may continue.

## UI Shape

Keep it light.

Preferred minimal additions near the System / Radius Watch authoring panel:

- a secondary action such as `Preview System Watch Scope`;
- a small readout showing:
  - center system
  - radius
  - included systems
  - whether the candidate is confirmable
  - explicit reminder that visible scope is not accepted scope;
- a deliberate confirmation control/action such as `Initialize System Watch` or a small confirm checkbox plus save action.

Do not add popup/modal warning behavior.
Do not redesign the Watch page.
Do not implement final Atlas/R-Scanner visual design.

If the existing `Save System Watch` button is reused, it must first require a fresh accepted confirmation payload from the current preflight.

## Acceptance Rules

The renderer implementation must preserve:

- preflight result visible is not acceptance;
- focus/hover/highlight/keyboard navigation is not acceptance;
- successful local topology lookup is not acceptance;
- explicit operator confirmation is required;
- accepted payload preserves exact `included_system_ids`;
- center/radius remain provenance/explanation/management after acceptance;
- renderer-provided IDs are not authority;
- blocked/capped/unknown preflight cannot be confirmed;
- actor Watch authoring remains unchanged unless a tiny compatibility edit is unavoidable.

## Allowed Mutation

This packet may allow the existing local Watch-authoring mutation:

```txt
watch.create
```

Only for the explicitly confirmed system/radius Watch authoring path.

This is still metadata/Watch setup only. It must not run Watch execution or provider movement.

## Boundaries

Do not:

- implement final UI design;
- implement popup/modal warning behavior;
- implement R-Scanner visual redesign;
- change actor Watch behavior beyond unavoidable compatibility wiring;
- dispatch Watch execution;
- create Watch executor tasks;
- call providers;
- run live/API calls;
- mutate Discovery refs;
- write Evidence/EVEidence;
- write Hydration output;
- change `watch.create` backend behavior;
- change topology traversal behavior;
- change schema;
- create support artifacts;
- activate runtime enforcement;
- add command blocking;
- open Watch/result identity;
- add relationship tags;
- rename source-owned terms;
- update protected-word JSON;
- open fourth-lane behavior.

## Verification Expectations

Run focused renderer and adjacent Watch verification.

Expected proof:

```txt
node --check src/renderer/app.js
node --check src/renderer/queueWatch.js
npm.cmd run verify:watch-operator-confirmation-contract
npm.cmd run verify:system-radius-authoring-preflight
npm.cmd run verify:watch-create-accepted-scope-contract
npm.cmd run verify:watch-authored-execution-readiness
npm.cmd run verify:renderer-shell
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Run protected-term discovery if any labels or UI-adjacent terms are added.

Visual smoke is optional for this packet unless Dev changes layout enough to need it.

## Stop Conditions

Stop and report if:

- the only practical path requires a wider Watch page redesign;
- confirmation becomes equivalent to visibility/focus/hover;
- `watch.create` can be called without a confirmed accepted payload;
- the renderer can forge or alter included IDs after local preflight;
- blocked/capped/unknown preflight can still save a Watch;
- the work requires backend `watch.create` changes;
- the work requires Watch execution, providers, schema, support artifacts, enforcement, result identity, relationship tags, or fourth-lane behavior.
