# OverseerHS316 Watch Operator Confirmation Listen-Hook Contract Runway

Status: open
Date: 2026-06-05
Owner: Overseer
Executor: Dev
Expected handoff: `workspace/DevHS316-watch-operator-confirmation-listen-hook-contract.md`

## Human Intent

Atlas should seed the operator confirmation path for accepted Watch setup before UI design hardens the behavior.

The operator may eventually confirm accepted Watch scope through typed command, keyboard action, mouse action, light check, hold/press, or a terminal-style initialize action. The exact interaction belongs to the later UI/design phase.

For now, Atlas needs the contract boundary:

```txt
Preflight result visible is not acceptance.
Focus/hover/highlight is not acceptance.
Successful local topology lookup is not acceptance.
Only an explicit renderer/listen-hook confirming act can produce accepted scope for watch.create.
```

This should feel like a patient instrument waiting for deliberate operator intent, not popup warning whack-a-mole.

## Task

Add a read-only/local-only contract preview for the Watch operator confirmation/listen-hook path.

Preferred command name:

```txt
watch.operator_confirmation_contract.preview
```

Use a better existing naming pattern if the repo already has one.

The preview should prove the shape of the path from system/radius authoring preflight to accepted `watch.create` payload without implementing renderer behavior.

## Required Contract Shape

The preview should disclose:

- source preflight result shape from `watch.system_radius_authoring_preflight.preview`;
- visible operator payload before acceptance:
  - center system
  - radius
  - included systems
  - accepted/storable `included_system_ids`
  - cap/blocked/local topology status where relevant
- listen-hook/confirmation boundary:
  - list visible is not acceptance;
  - focus is not acceptance;
  - hover is not acceptance;
  - keyboard navigation is not acceptance;
  - successful local topology lookup is not acceptance;
  - explicit operator confirmation is required;
- accepted payload shape that may later be sent to `watch.create`;
- accepted payload preserves exact `included_system_ids`;
- center/radius are provenance/explanation/management after acceptance;
- accepted included IDs are stored-scope authority;
- confirmation/listen hook is interaction-agnostic for now.

## Expected States

Represent or prove at least these states:

- `preflight_visible_not_accepted`
- `confirmation_ready`
- `confirmation_pending_operator_intent`
- `confirmed_accepted_scope_payload`
- `blocked_not_confirmable`

Use existing local names if they are clearer, but preserve the distinction between visible/prepared and accepted/confirmed.

## Acceptance Rules

The preview must make these rules explicit:

- preflight can prepare a candidate scope;
- confirmation can accept a candidate scope;
- `watch.create` may receive accepted scope only after confirmation;
- the future accepted payload must not recompute topology from center/radius;
- the future accepted payload must not be created from renderer-forged IDs without server/local validation posture;
- UI affordance is parked and may later be typed command, keyboard action, click, hold, check, or initialize action.

## Boundaries

Do not:

- implement renderer UI;
- implement popup/modal behavior;
- implement final copy/design;
- dispatch Watch execution;
- create Watch tasks;
- call providers;
- run live/API calls;
- mutate Watch rows;
- mutate Discovery refs;
- write Evidence/EVEidence;
- write Hydration output;
- change `watch.create`;
- change topology traversal behavior;
- change schema;
- create support artifacts;
- activate runtime enforcement;
- add command blocking;
- open Watch/result identity;
- add relationship tags;
- open fourth-lane behavior;
- rename source-owned terms;
- update protected-word JSON.

## Verification Expectations

Run focused verification for the new preview plus adjacent registry/authority checks.

Expected proof should include:

```txt
node --check <new service/script files>
npm.cmd run verify:<new focused verifier>
npm.cmd run verify:watch-system-radius-authoring-preflight
npm.cmd run verify:watch-create-accepted-scope-contract
npm.cmd run verify:watch-authored-execution-readiness
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Run protected-term discovery if the packet adds or changes bridge-facing labels, UI-adjacent labels, or term-heavy readout fields. It may remain warning-only.

## Stop Conditions

Stop and report if:

- confirmation blurs with preflight visibility;
- focus/hover/highlight becomes acceptance;
- accepted scope can be produced without explicit operator confirmation;
- center/radius become execution authority after acceptance;
- renderer/client-provided IDs are trusted without local validation posture;
- the packet requires renderer UI implementation;
- the packet requires Watch execution, provider movement, schema, support artifacts, enforcement, or result semantics.
