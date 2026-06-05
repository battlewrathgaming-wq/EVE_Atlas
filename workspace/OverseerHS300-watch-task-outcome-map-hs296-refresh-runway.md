# OverseerHS300 Watch/Task Outcome Map HS296 Refresh Runway

Status: open
Date: 2026-06-05
Owner: Overseer
Executor: Dev
Expected handoff: `workspace/DevHS300-watch-task-outcome-map-hs296-refresh.md`

## Purpose

Refresh the read-only Watch/task outcome map preview so it reflects the accepted HS296 system/radius Watch execution posture.

Current issue:

```txt
runtime.watch_task_outcome_map.preview still describes pre-HS296 system/radius execution behavior.
```

The preview must now disclose:

```txt
Watch execution uses stored included_system_ids as execution authority.
System/radius Discovery ref identity remains center-only.
```

Both are true at the same time.

## Accepted Source Truth

HS296 accepted:

- system/radius Watch execution consumes accepted stored `included_system_ids`;
- invalid stored Watch scope blocks before task creation;
- center/radius are provenance/explanation after Watch acceptance;
- direct/manual `system.radius.watch` remains center/radius planner behavior when no accepted IDs are supplied.

HS298 accepted:

- current `system_radius` Discovery ref identity remains center-only;
- center-only identity is acceptable for the current safe phase;
- center-only identity is not enough for future durable Watch/task result semantics;
- future durable result semantics should use a separate result/readout membership layer rather than mutating Evidence/EVEidence or overloading Discovery refs.

## Task

Update the existing read-only preview and verifier:

```txt
runtime.watch_task_outcome_map.preview
```

Likely files:

- `src/main/services/watchTaskOutcomeMapPreviewService.js`
- `scripts/verify-watch-task-outcome-map-preview.js`

The preview should:

- stop claiming system/radius Watch execution recomputes topology from center/radius as the current Watch execution posture;
- stop claiming executor dispatch payload lacks stored included scope after HS296;
- distinguish accepted Watch execution authority from direct/manual collection behavior;
- keep disclosing center-only `system_radius` Discovery ref identity;
- keep disclosing that radius/watch ID is not part of Discovery ref identity;
- keep disclosing that durable `watch_result`, `watch_result_items`, relationship tags, and relationship truth do not exist;
- preserve read-only/no-mutation behavior.

Suggested wording shape:

```txt
watch_execution_scope_authority: stored_watch_scope
direct_manual_scope_authority: center_radius_planner
discovery_ref_identity_level: center_only
result_semantics_ready: false
```

Use the repo's existing style rather than these exact field names if a better local pattern already exists.

## Boundaries

Do not:

- call providers
- dispatch Watch execution
- arm Watch execution
- create tasks
- mutate Discovery refs
- mutate Evidence/EVEidence
- mutate Watch rows
- mutate Assessment Memory
- add schema
- create `watch_result` or `watch_result_items`
- write relationship tags
- change Discovery ref identity
- redesign queue identity
- add UI/renderer behavior beyond existing read-only command registration
- activate runtime enforcement
- create support artifacts
- reopen fourth lane / fast lane

## Acceptance Criteria

- `runtime.watch_task_outcome_map.preview` reflects HS296 stored-scope Watch execution authority.
- The preview still reflects HS298 center-only `system_radius` Discovery ref identity limitation.
- The preview distinguishes:
  - Watch execution authority: stored accepted included system IDs
  - direct/manual `system.radius.watch`: center/radius planner behavior
  - Discovery ref identity: center-only
- The verifier no longer asserts the stale pre-HS296 execution posture.
- Fixture coverage proves the preview can show stored Watch execution authority while still reporting center-only Discovery ref identity.
- Table mutation proof remains unchanged.
- No provider calls, task creation, writes, schema, result semantics, relationship tags, UI, enforcement, support artifacts, or fourth-lane work are added.

## Verification

Run focused and adjacent checks:

```txt
node --check src\main\services\watchTaskOutcomeMapPreviewService.js
node --check scripts\verify-watch-task-outcome-map-preview.js
npm.cmd run verify:watch-task-outcome-map
npm.cmd run verify:watch-scope-authority-conformance
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

## Stop Conditions

Stop and hand back if:

- the preview cannot be corrected without schema changes;
- Discovery ref identity redesign becomes necessary;
- durable Watch result semantics become necessary;
- provider/live/private/destructive action is needed;
- Watch execution behavior itself needs another correction;
- the work starts changing Evidence/EVEidence, Discovery refs, Watch rows, UI, enforcement, support artifacts, or fourth-lane behavior.
