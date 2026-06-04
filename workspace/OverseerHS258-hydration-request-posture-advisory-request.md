# Overseer HS258: Hydration Request Posture Advisory Request

Date: 2026-06-05
Role: Atlas Overseer
Milestone: Atlas Storage And Runtime Hardening
Requested executor: Data Engineering / Engineering Review
Expected artifact: `workspace/DataEngineeringHS258-hydration-request-posture-advisory.md`

## Purpose

Shape the read-only semantics for provider-backed Hydration request posture.

This is advisory only. Do not implement code. Do not create a Dev runway. Do not run live/API/provider calls.

## Why This Exists

HS256/HS257 accepted that local report / Observation construction can reuse cached/local labels and raw-ID fallbacks without provider-backed Hydration.

The next boundary is the explicit operator act:

```txt
selected unresolved ID
-> explicit operator request
-> local-first check
-> Hydration request posture
-> eligible / held / blocked / already local / invalid
```

This posture is a request for pickup. It is not direct injection into a queue/lane and not provider execution.

The same posture technology may later support Watch-originated readability pickup, so this advisory should keep the model reusable without designing a broad queue or dispatcher.

## Accepted North Star

```txt
Local readability is part of report construction.
Provider readability is an explicit operator act.
Focus is not request.
Request is not provider execution.
```

Accepted clarification:

```txt
Provider resolution is a one-time explicit operator act for an unresolved ID.
Once resolved and stored, that label becomes local readability cache.
Local cache reuse is not Hydration execution.
Provider lookup for a new unresolved ID remains explicit, gated Hydration.
```

## Read

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `docs/features/data-layer-boundaries.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `workspace/DataEngineeringHS256-local-readability-report-construction-audit.md`
- `workspace/OverseerHS257-hs256-local-readability-review.md`
- `src/main/metadata/reportHydrator.js`
- `src/main/services/hydrationCandidatePreviewService.js`
- `src/main/services/hydrationExecutionPolicyPreviewService.js`
- `src/main/services/hydrationAttentionRuntimePostureService.js`
- `src/main/services/externalIoStateService.js`
- `src/main/services/liveApiGateService.js`
- `src/main/services/storageSetupGateReadoutService.js`
- `src/main/db/schema.sql`
- relevant local verifier scripts only if needed

## Advisory Questions

1. What fields should define a Hydration request posture for a selected unresolved ID?
   - ID type
   - ID value
   - source surface / source context
   - Evidence / Observation / report basis anchor
   - reason such as `operator_attention`
2. What local-first checks should happen before provider-backed posture?
   - cached label in `activity_events`
   - `entities`
   - `watchlist_entities`
   - local SDE/type/system tables
   - existing Hydration candidate/readiness outputs
3. What output states should exist before execution?
   - `already_local`
   - `local_lookup_available`
   - `provider_needed`
   - `held_by_external_io`
   - `held_by_cadence`
   - `blocked_by_storage`
   - `invalid_or_unsupported_id`
   - `insufficient_basis`
4. How should the posture distinguish:
   - focus/hover/navigation
   - explicit operator request
   - request posture
   - queue/pickup eligibility
   - provider execution
   - Hydration write
5. What current services already contain reusable logic?
6. Does Atlas need a new read-only preview later, or can existing Hydration candidate/execution posture cover it?
7. What should remain parked until a later Dev runway?

## Constraints

- no implementation
- no Dev runway
- no provider/API/live calls
- no Hydration writes
- no metadata run creation
- no `entities` writes
- no `activity_events` label patches
- no queue persistence
- no dispatcher
- no leases/retry design
- no schema changes
- no runtime enforcement activation
- no command blocking
- no storage config writes
- no Watch mutation or arming
- no UI work

Do not treat focus, hover, highlight, keyboard navigation, mouse navigation, or report load as a Hydration request.

Do not treat a Hydration request as provider execution.

Do not treat local cache reuse as Hydration execution.

Do not design a broad provider work queue.

## Verification Guidance

Use existing evidence where current and relevant.

If checks are useful, keep them local and targeted. Suggested candidates:

```txt
npm.cmd run verify:hydration-candidate-preview
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:hydration-attention-runtime
npm.cmd run verify:external-io-state
npm.cmd run verify:live-api-gate
git status --short --branch
```

Do not run live/API/provider checks.

Do not run broad verification unless the audit finds shared/runtime/schema risk that genuinely needs it.

## Expected Output

Create:

```txt
workspace/DataEngineeringHS258-hydration-request-posture-advisory.md
```

Include:

1. Executive recommendation.
2. Proposed request-posture fields.
3. Proposed local-first check order.
4. Proposed output states and meanings.
5. How focus, request, pickup, execution, and write stay distinct.
6. Existing services that can be reused.
7. Whether a future read-only preview is needed.
8. Smallest next Dev packet, if any.
9. Parked items.
10. Verification evidence.
11. Human/Overseer decisions needed.

## Parked

- UI hover/focus implementation
- terminal input strip behavior
- context hotkeys
- mouse context menu
- provider-backed Hydration execution
- Hydration writes
- metadata run creation
- persistent queue or dispatcher
- Watch pickup implementation
- schema changes
- runtime enforcement
- support artifacts

