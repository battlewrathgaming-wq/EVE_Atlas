# OverseerHS294 Watch Scope Authority Conformance Runway

Status: open
Date: 2026-06-05
Owner: Overseer
Executor: Dev
Expected handoff: `workspace/DevHS294-watch-scope-authority-conformance.md`

## Purpose

Prove how current Atlas code conforms, or fails to conform, to the accepted Watch scope authority model before any execution correction, durable Watch result semantics, schema, UI, or provider movement is opened.

Accepted model:

```txt
local topology lookup tables
-> authoring/preflight center + radius resolution
-> operator-accepted included system ID set
-> stored Watch scope
-> Watch execution uses stored included system IDs
```

SDE is import/source provenance only. Runtime geometry should use local topology lookup tables. Center system and radius are provenance/explanation after Watch scope acceptance.

## Task

Add a read-only/local-only Watch scope authority conformance preview, preferably:

```txt
watch.scope_authority_conformance.preview
```

The preview should explain current source/runtime posture for:

- Watch authoring/preflight use of local topology lookup tables.
- Whether authoring can form an included system ID set only when topology is present.
- Whether stored `system_watches.included_system_ids` and `excluded_system_ids` are read, parsed, and status-reported.
- Whether schedule/offline/readout surfaces use stored included/excluded scope as readout posture.
- Whether Watch execution / system-radius collection currently consumes stored included system IDs or recomputes from center/radius.
- Whether recomputed topology is only diagnostic under the accepted model.
- Whether system/radius Discovery ref identity remains center-only and therefore separate from Watch scope authority.
- The exact code seams that would need correction if execution still recomputes from center/radius.

## Required Proof Shape

Use fixture/local-only proof. The verifier should include at least:

- a system/radius Watch with valid stored `included_system_ids` and `excluded_system_ids`
- a system/radius Watch with missing stored scope
- a system/radius Watch with malformed stored scope
- a fixture where stored included scope and recomputed topology can be distinguished
- proof that the preview itself performs no provider calls, no Watch dispatch, no task creation, no writes, and no schema changes

The proof should be allowed to report a current mismatch. This packet is not expected to fix the mismatch.

## Acceptance Criteria

- The preview is registered as read-only and renderer-eligible only if consistent with existing readout patterns.
- It reports `SDE` as import/source provenance, not runtime lookup authority.
- It reports local topology lookup tables as the runtime authoring/preflight geometry substrate.
- It reports stored included system IDs as accepted Watch scope authority under the accepted model.
- It reports center/radius as provenance/explanation after Watch acceptance.
- It explicitly states whether current execution uses stored included IDs or recomputes from center/radius.
- It treats recompute as diagnostic comparison only under the accepted model.
- It identifies conformance states, for example:
  - `conforms`
  - `partial`
  - `gap`
  - `not_applicable`
- It identifies correction seams without implementing them.
- It preserves Discovery refs as possible leads and Evidence/EVEidence as ESI-expanded killmail records.

## Boundaries

Do not:

- call zKill, ESI, SDE download, or any provider
- dispatch Watch execution
- arm or tick Watch executor
- create tasks
- write rows
- mutate `system_watches`, Discovery refs, Evidence/EVEidence, Hydration, Assessment Memory, or support artifacts
- add schema
- create `watch_result`, `watch_result_items`, relationship tags, or relationship truth
- correct execution behavior in this packet
- change renderer UI
- activate runtime enforcement or command blocking
- reopen the fourth lane / fast lane

## Verification

Run focused and adjacent checks:

```txt
node --check src\main\services\watchScopeAuthorityConformanceService.js
node --check scripts\verify-watch-scope-authority-conformance.js
npm.cmd run verify:watch-scope-authority-conformance
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Adjust file names only if the implementation chooses a clearly equivalent local pattern.

## Stop Conditions

Stop and hand back if:

- proving conformance requires provider calls or live/private data
- proving conformance requires dispatching Watch execution
- proving conformance requires schema changes
- the packet starts fixing execution behavior instead of reporting it
- center/radius starts being treated as execution authority after Watch acceptance
- recomputed topology starts being treated as authority rather than diagnostic comparison
- Discovery refs blur with Evidence/EVEidence
- SDE source material becomes runtime lookup authority
