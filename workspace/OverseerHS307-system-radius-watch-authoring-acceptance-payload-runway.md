# OverseerHS307 System Radius Watch Authoring Acceptance Payload Runway

Status: open
Date: 2026-06-05
Owner: Overseer
Executor: Dev
Expected handoff: `workspace/DevHS307-system-radius-watch-authoring-acceptance-payload.md`

## Purpose

Prove how an accepted HS304 system/radius authoring preflight becomes a Watch authoring payload, without writing the Watch row yet.

This is the bridge from:

```txt
watch.system_radius_authoring_preflight.preview
```

to a future confirmed:

```txt
watch.create
```

The goal is to make the accept path coherent before mutation.

## Source Truth

Accepted HS304:

- `watch.system_radius_authoring_preflight.preview` is local-only and read-only;
- it resolves selected system + radius into operator-facing included systems;
- it exposes exact `included_system_ids_for_acceptance` / `would_store_included_system_ids` only when acceptable;
- capped partial scope is not acceptable without operator adjustment;
- `direct_neighbor_count` is diagnostic/detail only and means immediate adjacent systems excluding center.

Existing `watch.create` posture:

- `watch.create` is metadata-only local mutation;
- it writes local Watch intent metadata;
- for system/radius Watch, accepted stored `included_system_ids` become Watch execution authority after creation;
- creating a Watch does not dispatch provider work by itself.

## Task

Add or refine a read-only proof that composes a Watch authoring acceptance payload from an acceptable HS304 preflight result.

Preferred command/readout shape if consistent with local patterns:

```txt
watch.system_radius_acceptance_payload.preview
```

Use a better existing naming pattern if the repo already has one.

The proof should expose:

- source preflight action/name;
- source preflight status;
- whether the preflight is acceptable for Watch authoring;
- selected center system ID/name;
- radius;
- exact `included_system_ids` that would be supplied to/stored by future Watch creation;
- center/radius as provenance/explanation;
- optional operator settings that would flow into future `watch.create`, such as lookback, max systems, max refs/killmails, poll interval, active state, and notes;
- confirmation/authority posture for the future write;
- future target command, probably `watch.create`;
- explicit `would_write_watch_row: false`;
- explicit `watch_rows_written: 0`;
- explicit no-dispatch/no-provider/no-task posture.

It should reject or mark not acceptable:

- capped preflight;
- unknown system;
- missing topology;
- invalid radius;
- preflight without accepted included IDs;
- mismatched or forged payload claims that try to replace the preflight's accepted IDs.

## Boundary

Do not:

- call providers;
- run live/API validation;
- create or mutate Watch rows;
- dispatch Watch execution;
- create tasks;
- mutate Discovery refs;
- mutate Evidence/EVEidence;
- mutate Hydration or metadata;
- add schema;
- change `watch.create` behavior;
- change topology traversal behavior;
- change Discovery ref identity;
- create durable `watch_result` or `watch_result_items`;
- write relationship tags;
- add renderer/UI behavior;
- activate runtime enforcement;
- create support artifacts;
- reopen fourth lane / fast lane.

## Acceptance Criteria

- The readout proves an acceptable HS304 preflight can become a future `watch.create` payload without writing.
- The payload uses the preflight's accepted `included_system_ids` as the only stored-scope source.
- Center/radius remain provenance/explanation.
- Capped, invalid, missing, unknown, or forged/mismatched payload cases are not acceptable.
- The proof distinguishes:
  - preflight acceptance;
  - payload readiness;
  - future write authority;
  - actual Watch creation.
- No provider movement, Watch row write, Watch dispatch, task creation, schema, UI, support artifact, active enforcement, or fourth-lane work is added.

## Verification

Run focused and adjacent checks:

```txt
node --check src\main\services\systemRadiusAuthoringPreflightService.js
node --check [new/changed service file]
node --check scripts\verify-system-radius-authoring-preflight.js
node --check [new verifier file]
npm.cmd run verify:system-radius-authoring-preflight
npm.cmd run [new verifier script]
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:watch-scope-authority-conformance
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Use the repo's clearly equivalent commands if names differ, and name them in the handoff.

## Stop Conditions

Stop and hand back if:

- the accept path requires actual Watch row mutation;
- `watch.create` behavior must change;
- accepted preflight output is insufficient to form a safe payload;
- topology traversal behavior needs changes;
- provider/live/private/destructive action is needed;
- schema or durable result semantics become necessary;
- renderer/UI work becomes necessary;
- the work starts creating Watch rows, tasks, support artifacts, or enforcement.
