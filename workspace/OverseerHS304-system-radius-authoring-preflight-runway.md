# OverseerHS304 System Radius Authoring Preflight Runway

Status: open
Date: 2026-06-05
Owner: Overseer
Executor: Dev
Expected handoff: `workspace/DevHS304-system-radius-authoring-preflight.md`

## Purpose

Prove the local-only operator-facing preflight/readout shape for authoring a system/radius Watch scope.

This packet follows HS296, HS300, and HS302:

- accepted Watch execution uses stored `included_system_ids`;
- center/radius are provenance/explanation after acceptance;
- radius scope includes the center system;
- direct-neighbor counts exclude the center;
- user-facing radius presentation should stay simple.

This is not Watch result identity work. That remains parked until Atlas has richer sample data for multiple killmails in one report body or a clearer presentation model for exploring killmails separately.

## Accepted Direction

During authoring/preflight, Atlas may use local topology lookup tables to resolve:

```txt
selected system + radius
```

into:

```txt
included system ID set
```

The accepted preflight/readout shape should be able to say, plainly:

```txt
System Hare with a radius of 1 jump:

Included systems:
Hare (center)
Babirmoult
Heluene
Ogaria
Oruse
```

The center system should appear first and be marked `(center)`.

Counts should be labeled as included systems. Direct-neighbor counts may appear only in diagnostic/detail posture, not as the primary operator-facing count.

## Task

Add or refine a read-only local preflight/readout proof for system/radius Watch authoring.

Use existing local topology/planner patterns where possible. Do not create a provider-backed path.

The proof should expose:

- selected center system ID/name;
- requested radius;
- included systems in operator-facing order, with center first;
- included system count;
- center marker;
- direct-neighbor count, if present, as diagnostic/detail only;
- cap/guardrail posture when `maxSystems` limits the included set;
- missing topology / unknown system posture;
- malformed or invalid radius posture;
- whether the scope is acceptable for Watch authoring;
- the exact `included_system_ids` that would become accepted stored scope if the operator accepts.

Suggested command/readout shape if consistent with local patterns:

```txt
watch.system_radius_authoring_preflight.preview
```

Use a better existing naming pattern if the repo already has one.

## Boundaries

Do not:

- call providers;
- run live/API validation;
- dispatch Watch execution;
- create or mutate Watch rows;
- create tasks;
- mutate Discovery refs;
- mutate Evidence/EVEidence;
- mutate Hydration or metadata;
- add schema;
- create durable `watch_result` or `watch_result_items`;
- write relationship tags;
- change Discovery ref identity;
- change topology traversal behavior;
- rename imported `system_adjacency.connection_type = stargate`;
- add renderer/UI behavior;
- activate runtime enforcement;
- create support artifacts;
- reopen fourth lane / fast lane.

## Acceptance Criteria

- The readout proves the operator-facing shape:
  - selected system and radius;
  - `Included systems`;
  - center first and marked `(center)`.
- The readout separates included-system count from direct-neighbor count.
- The readout exposes the exact included system ID set that would become stored Watch scope if accepted.
- The readout handles capped, missing-topology, unknown-system, and invalid-radius cases without provider calls or writes.
- Existing radius/topology planner behavior remains unchanged.
- No Watch execution, result identity, Discovery ref identity, Evidence/EVEidence, Hydration, schema, UI, support artifact, enforcement, or fourth-lane work is added.

## Verification

Run focused and adjacent checks:

```txt
node --check src\main\workers\systemRadiusPlanner.js
node --check scripts\verify-system-radius-planner.js
npm.cmd run verify:planner
npm.cmd run verify:radius
npm.cmd run verify:watch-scope-authority-conformance
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If a new service/verifier is added, also run:

```txt
node --check [new service file]
node --check [new verifier file]
npm.cmd run [new verifier script]
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
```

Use the repo's clearly equivalent commands if names differ, and name them in the handoff.

## Stop Conditions

Stop and hand back if:

- accepted preflight cannot be proved without schema changes;
- topology traversal behavior appears to need changes;
- Watch execution behavior must change;
- Discovery ref identity or durable Watch result semantics become necessary;
- provider/live/private/destructive action is needed;
- imported topology connection type naming must change;
- renderer/UI work becomes necessary;
- the work starts creating tasks, Watch rows, support artifacts, or runtime enforcement.
