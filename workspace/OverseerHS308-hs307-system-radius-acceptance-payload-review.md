# OverseerHS308 HS307 System Radius Acceptance Payload Review

Status: redirect
Date: 2026-06-05
Owner: Overseer

Reviewed runway: `workspace/OverseerHS307-system-radius-watch-authoring-acceptance-payload-runway.md`
Reviewed handoff: `workspace/DevHS307-system-radius-watch-authoring-acceptance-payload.md`

## Decision

HS307 is not accepted yet.

The implementation preserves the read-only/local-only boundary, but the payload bridge needs one compatibility correction before it can rest.

## Blocking Finding

The new preview presents a future `watch.create` payload that includes accepted preflight `included_system_ids`.

However, current `watch.create` system/radius handling does not consume those accepted IDs as stored-scope authority.

Current path:

```txt
serviceRegistry watch.create
-> mutatingActionService.runWatchCreateService
-> normalizeSystemRadiusWatchScope(...)
-> addSystemRadiusWatch(...)
-> TopologyService.getSystemsWithinRadius(centerSystemId, radiusJumps, ...)
```

That means if the preview payload were treated as a direct future `watch.create` input today, Atlas would still recompute included systems from center/radius instead of using the accepted HS304 preflight IDs as the stored scope source of truth.

This conflicts with the HS307 acceptance criterion:

```txt
The payload uses the preflight's accepted included_system_ids as the only stored-scope source.
```

## Required Revision

Revise the preview so it does one of the following clearly:

Option A, preferred if small:

- produce a payload/readout shape that explicitly matches the next required `watch.create` mutation contract;
- disclose that current `watch.create` does not yet consume accepted preflight `included_system_ids`;
- expose `current_watch_create_compatibility: requires_future_mutation_contract` or equivalent;
- keep the future payload as a candidate payload, not as a direct current command payload.

Option B, only if already supported without mutation changes:

- prove that current `watch.create` would consume accepted preflight included IDs as stored scope authority.

Do not implement the mutation change in HS307. This packet remains read-only.

## Required Proof

Add verifier coverage proving:

- the preview does not claim the payload is directly executable by current `watch.create` unless current code actually consumes accepted IDs;
- accepted preflight IDs remain the future stored-scope authority;
- center/radius remain provenance/explanation;
- current direct mutation contract gap is disclosed rather than hidden;
- no Watch row writes occur.

Suggested assertion shape:

```txt
current_watch_create_consumes_preflight_included_ids === false
future_mutation_contract_required === true
future_payload_directly_executable_now === false
```

Use repo naming style if different fields are cleaner.

## Accepted Shape To Preserve

Preserve these positives:

- read-only command registration;
- no provider calls;
- no Watch row writes;
- no Watch dispatch;
- no tasks;
- no Discovery/Evidence/Hydration mutation;
- no schema;
- no UI;
- forged/mismatched included IDs rejected;
- capped/unknown/invalid/missing topology cases rejected.

## Verification Needed After Revision

Rerun:

```txt
node --check src\main\services\systemRadiusAcceptancePayloadService.js
node --check scripts\verify-system-radius-acceptance-payload.js
npm.cmd run verify:system-radius-acceptance-payload
npm.cmd run verify:system-radius-authoring-preflight
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:watch-scope-authority-conformance
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

## Parked

Keep parked:

- actual `watch.create` mutation contract change;
- Watch row writes;
- Watch execution;
- provider/live testing;
- UI;
- schema;
- durable Watch/task result identity;
- relationship tags;
- support artifacts;
- active enforcement;
- fourth lane / fast lane.
