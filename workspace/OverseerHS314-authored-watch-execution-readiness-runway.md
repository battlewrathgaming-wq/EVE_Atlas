# OverseerHS314 Authored Watch Execution Readiness Runway

Status: open
Date: 2026-06-05
Owner: Overseer
Executor: Dev

Expected handoff:

```txt
workspace/DevHS314-authored-watch-execution-readiness.md
```

## Purpose

Prove read-only execution readiness for an authored system/radius Watch after HS312.

This packet should show that Atlas can read a real authored Watch row and derive the safe execution input from stored accepted `included_system_ids`, without running the Watch.

Plain intent:

```txt
watch.create stores the accepted system list.
execution readiness reads that stored list.
no provider movement starts yet.
```

## Context

Accepted prior state:

- HS304 proved system/radius authoring preflight.
- HS307 proved the accepted-payload bridge.
- HS310 proved the mutation safety map.
- HS312 implemented `watch.create` accepted-scope storage.
- HS313 accepted HS312.

Accepted authority:

- Stored `system_watches.included_system_ids` is the execution scope authority for accepted system/radius Watches.
- Center system and radius are provenance/explanation/management fields after acceptance.
- Authoring-time local topology validation may check accepted scope, but must not replace or reorder the accepted list.
- Watch execution remains parked unless explicitly opened.

## Task

Add a read-only/local-only authored-Watch execution readiness preview, preferably:

```txt
watch.authored_execution_readiness.preview
```

Use a better local naming pattern if the repo already has one.

The preview should:

- read existing authored Watch rows;
- identify system/radius Watches with stored `included_system_ids`;
- derive the would-use execution system list from stored `included_system_ids`;
- disclose center/radius as management/provenance fields only;
- report whether the Watch is ready for future execution input;
- report invalid/missing/malformed stored-scope cases as blocked before provider movement;
- report whether execution would use stored scope rather than recomputed topology;
- report what future command/path would consume the readiness result;
- prove no Watch execution, dispatch, provider calls, tasks, Discovery refs, Evidence/EVEidence, Hydration, schema, UI, support artifacts, or runtime enforcement are opened.

## Required Readout

Include fields equivalent to:

```txt
execution_ready_from_stored_scope: true/false
execution_scope_source: stored_included_system_ids
execution_system_ids: [...]
center_radius_role: provenance_and_management
would_recompute_from_center_radius: false
would_dispatch_watch: false
watch_dispatches: 0
tasks_created: 0
provider_calls: 0
discovery_refs_mutated: 0
evidence_rows_written: 0
hydration_writes: 0
```

For blocked rows, report reason codes such as:

```txt
missing_stored_scope
malformed_stored_scope
empty_stored_scope
invalid_stored_scope
inactive_watch
```

Use repo naming if different.

## Boundary

This is read-only readiness only.

Do not:

- dispatch Watch execution;
- create runtime tasks;
- call providers;
- create or mutate Discovery refs;
- write Evidence/EVEidence;
- run or write Hydration;
- mutate Watch rows;
- change `watch.create`;
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

- authored Watch rows can be inspected without mutation;
- valid stored accepted-scope rows produce future execution input from stored IDs;
- center/radius are disclosed as provenance/management only;
- invalid/missing/malformed stored-scope rows are blocked before provider movement;
- no execution, task, provider, Discovery/Evidence/Hydration, schema, UI, support artifact, runtime enforcement, result identity, relationship tag, or fourth-lane behavior is opened;
- verification proves no table mutation.

Reject or redirect if:

- readiness recomputes scope from center/radius for accepted Watches;
- readiness treats center/radius as execution authority for accepted Watches;
- readiness dispatches or creates tasks;
- provider movement or Discovery/Evidence/Hydration mutation appears;
- Watch result identity or UI confirmation behavior is opened in this packet.

## Verification

Run focused checks for the new preview plus affected registry/authority/passive-side-effect coverage.

Expected proof shape:

```txt
node --check src\main\services\[new-service].js
node --check scripts\[new-verifier].js
npm.cmd run verify:[new-authored-watch-readiness-check]
npm.cmd run verify:watch-create-accepted-scope-contract
npm.cmd run verify:watch-scope-authority-conformance
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Use exact repo verifier names if different.

## Follow-Up, Not Open Now

If HS314 is accepted, the intended next seam is:

```txt
renderer/operator confirmation path for accepted Watch setup
```

Other possible future seams:

- Watch execution smoke using a real authored Watch;
- Watch/task result identity;
- support artifact or runtime enforcement follow-up only if newly relevant.

None of those are authorized by HS314.
