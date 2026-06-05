# OverseerHS310 Watch Create Mutation Safety Map Runway

Status: open
Date: 2026-06-05
Owner: Overseer
Executor: Dev

Expected handoff:

```txt
workspace/DevHS310-watch-create-mutation-safety-map.md
```

## Purpose

Build a read-only mutation safety map for the future system/radius `watch.create` contract before changing mutation behavior.

This packet should prove what a future accepted system/radius Watch creation mutation must touch and must not touch, and include focused terminology drift assurance around the Watch/scope/radius wording involved.

## Context

Accepted prior state:

- HS304 proved system/radius authoring preflight.
- HS305 corrected direct-neighbor semantics.
- HS306 accepted HS304.
- HS307 proved a candidate future Watch authoring acceptance payload.
- HS308 required disclosure that current `watch.create` does not consume accepted preflight `included_system_ids`.
- HS309 accepted HS307 after that correction.

Accepted authority:

- During Watch authoring/preflight, Atlas may resolve center system + radius into an included system ID set.
- Once accepted, the stored included system ID set is the Watch scope authority.
- Watch execution should use stored accepted `included_system_ids`.
- Center system and radius are provenance/explanation after acceptance.
- Current `watch.create` does not yet consume accepted preflight `included_system_ids`.

## Task

Add a read-only/local-only safety map, preferably:

```txt
watch.create_mutation_safety_map.preview
```

Use a better local naming pattern if the repo already has one.

The preview should map:

- current `watch.create` path;
- current system/radius mutation inputs;
- current system/radius stored fields;
- current recomputation point from center/radius;
- future required mutation-contract input for accepted preflight `included_system_ids`;
- future fields that may be written in a real mutation packet;
- fields/tables that must not be touched;
- how center/radius remain provenance/explanation;
- how accepted included IDs become stored-scope authority;
- how the command should reject or refuse unsafe/mismatched accepted IDs in a later mutation packet;
- whether the current code is ready for mutation behavior change, or only ready for the next implementation seam.

Include focused term drift assurance for this seam.

The assurance should inspect or report on wording around:

- Watch
- `watch.create`
- system/radius
- radius
- included systems
- direct neighbors
- stargate / topology source data
- Discovery
- Evidence/EVEidence
- Hydration
- Observation
- Assessment

It should flag collision-prone or drift-prone wording if found, but must not rename terms or update protected-term JSON.

## Required Readout

The output should make these points inspectable:

```txt
current_watch_create_consumes_preflight_included_ids: false
future_mutation_contract_required: true
future_payload_directly_executable_now: false
expected_future_mutation_target: watch.create
current_packet_allows_watch_row_write: false
```

It should also report:

- `would_write_watch_row: false`
- `watch_rows_written: 0`
- `watch_dispatches: 0`
- `provider_calls: 0`
- `discovery_refs_mutated: 0`
- `evidence_rows_written: 0`
- `hydration_writes: 0`

## Boundaries

Do not:

- change `watch.create` behavior;
- write Watch rows;
- dispatch Watch execution;
- create tasks;
- call providers;
- mutate Discovery refs;
- write Evidence/EVEidence;
- run Hydration;
- change topology traversal behavior;
- change schema;
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

- the read-only preview clearly maps current `watch.create` behavior;
- the future mutation-contract gap is explicit;
- the future write surface is bounded to Watch authoring data only;
- no runtime mutation occurs;
- focused terminology drift assurance is included for the seam;
- the next implementation seam, if any, is easier to define from the map.

Reject or redirect if:

- the preview implies accepted included IDs are already consumed by current `watch.create`;
- the packet changes mutation behavior;
- the packet opens provider movement, Watch execution, Discovery/Evidence/Hydration mutation, schema, UI, runtime enforcement, support artifacts, or result semantics;
- term drift assurance renames terms or treats warnings as doctrine changes.

## Verification

Run focused checks for the new service/verifier plus affected registry/authority/passive-side-effect coverage.

Expected shape:

```txt
node --check src\main\services\[new-service].js
node --check scripts\[new-verifier].js
npm.cmd run verify:[new-command]
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Add or adjust exact verifier names to match implementation.

## Follow-Up, Not Open Now

If HS310 is accepted, the likely next seam is:

```txt
Actual watch.create mutation contract consuming accepted preflight included_system_ids as stored-scope authority.
```

That follow-up is not authorized by HS310.
