# OverseerHS312 Watch Create Accepted Scope Mutation Contract Runway

Status: open
Date: 2026-06-05
Owner: Overseer
Executor: Dev

Expected handoff:

```txt
workspace/DevHS312-watch-create-accepted-scope-mutation-contract.md
```

## Purpose

Implement the first actual `watch.create` mutation contract for accepted system/radius Watch setup.

This packet should let Atlas create a system/radius Watch row from an accepted preflight/acceptance payload by storing the accepted `included_system_ids` as the Watch scope authority.

Plain intent:

```txt
Preflight shows the operator a concrete included-system list.
The operator accepts that exact list.
watch.create stores that exact list.
Later execution reads that stored list.
```

## Context

Accepted prior state:

- HS304 proved system/radius authoring preflight.
- HS305 corrected direct-neighbor semantics.
- HS306 accepted HS304.
- HS307 proved a candidate future Watch authoring acceptance payload.
- HS308 required disclosure that current `watch.create` does not consume accepted preflight `included_system_ids`.
- HS309 accepted HS307 after that correction.
- HS310 mapped the mutation safety surface and focused term drift posture.
- HS311 accepted HS310.

Accepted authority:

- Runtime geometry uses local topology lookup tables; SDE is import/source provenance.
- During Watch authoring/preflight, Atlas may resolve center system + radius into an included system ID set.
- Once accepted, the stored included system ID set is the Watch scope authority.
- Watch execution should use stored accepted `included_system_ids`.
- Center system and radius are provenance/explanation and long-term management fields after acceptance.
- Center/radius must not be the execution source of truth for an accepted system/radius Watch.

## Task

Update `watch.create` system/radius handling so it can consume an accepted preflight/acceptance payload containing accepted `included_system_ids`.

The mutation should:

- require accepted `included_system_ids` for the accepted-preflight system/radius path;
- store those exact accepted IDs in `system_watches.included_system_ids`;
- preserve center system ID/name and radius as provenance/explanation/management fields;
- preserve existing operator settings such as lookback, caps, active flag, poll interval, notes, and excluded IDs if already supported;
- reject missing, empty, malformed, capped, unknown, invalid, or mismatched accepted included-ID payloads;
- avoid silent recomputation from center/radius when accepted IDs are supplied;
- keep any legacy/direct center-radius authoring behavior explicitly separate if it must remain for compatibility.

## Boundary

This is Watch authoring persistence only.

Do not:

- dispatch Watch execution;
- create runtime tasks;
- call providers;
- create or mutate Discovery refs;
- write Evidence/EVEidence;
- run or write Hydration;
- change topology traversal behavior;
- change schema unless an unavoidable existing-schema gap is proven first;
- add renderer/UI behavior;
- activate runtime enforcement;
- create support artifacts;
- open durable Watch/task result identity;
- add relationship tags;
- open fourth-lane / fast-lane work;
- rename source-owned terms;
- update protected-word JSON.

## Acceptance Criteria

Accept if:

- an accepted system/radius payload can create a `system_watches` row;
- the created row stores the exact accepted `included_system_ids`;
- center/radius are stored only as provenance/explanation/management fields;
- accepted IDs are not recomputed or replaced during creation;
- missing/empty/mismatched/unsafe accepted IDs are rejected;
- no Watch execution, provider movement, Discovery/Evidence/Hydration mutation, schema, UI, support artifact, runtime enforcement, result identity, relationship tag, or fourth-lane behavior is opened;
- verification proves table mutation is limited to the intended Watch-authoring row.

Reject or redirect if:

- `watch.create` still recomputes accepted scope from center/radius for the accepted-preflight path;
- accepted IDs are treated as advisory instead of authoritative;
- Watch creation dispatches or schedules execution as part of this packet;
- the packet mutates Discovery, Evidence/EVEidence, Hydration, result identity, relationship tags, or support artifacts;
- term drift appears around Watch, Discovery, Evidence/EVEidence, Hydration, Observation, or Assessment.

## Verification

Run focused checks for the changed mutation path plus affected registry/authority/passive-side-effect coverage.

Expected proof shape:

```txt
node --check [changed service/repository files]
node --check scripts/[new-or-updated-verifier].js
npm.cmd run verify:[new-or-updated-watch-create-contract-check]
npm.cmd run verify:watch-create-mutation-safety-map
npm.cmd run verify:watch-scope-authority-conformance
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Use the repo's exact verifier names if different.

The focused verifier should prove at minimum:

- accepted IDs stored exactly;
- center/radius stored as management/provenance fields;
- accepted IDs are not recomputed from topology during accepted-payload creation;
- missing/empty/mismatched accepted IDs fail;
- no provider calls;
- no Watch dispatch/tasks;
- no Discovery/Evidence/Hydration writes;
- no unexpected table mutations.

## Follow-Up, Not Open Now

After this packet, possible future seams may include:

- renderer/operator confirmation path for accepted Watch setup;
- Watch execution using the stored accepted IDs in a real authored Watch;
- Watch/task result identity;
- support artifact or runtime enforcement follow-up if newly relevant.

None of those are authorized by HS312.
