# Overseer HS262 - Hydration Request Pickup Shaping Advisory Request

Status: open
Date: 2026-06-05
Milestone: Atlas Storage And Runtime Hardening
Requested executor: Data Engineering / Architecture Review
Expected artifact: `workspace/DataEngineeringHS262-hydration-request-pickup-shaping-advisory.md`

## Purpose

Shape what "pickup" means after `metadata.hydration_request_posture.preview`, without implementing pickup, persistence, dispatcher behavior, provider execution, or Hydration writes.

HS260 proved:

```text
selected unresolved ID
-> explicit operator act
-> local-first lookup
-> Hydration request posture
```

The next question is not "execute it." The next question is how Atlas should define the narrow pickup boundary so future work does not accidentally turn request posture into a hidden queue or provider run.

## Accepted Boundary

Preserve:

```text
Focus is not request.
Request posture is pickup-readable, not pickup.
Pickup is not execution.
Execution is not write until the write path succeeds under policy.
```

This request is advisory only.

## Read

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS258-hydration-request-posture-advisory-request.md`
- `workspace/DataEngineeringHS258-hydration-request-posture-advisory.md`
- `workspace/OverseerHS259-hs258-hydration-request-posture-review.md`
- `workspace/OverseerHS260-selected-id-hydration-request-posture-preview-runway.md`
- `workspace/DevHS260-selected-id-hydration-request-posture-preview.md`
- `workspace/OverseerHS261-hs260-selected-id-hydration-request-posture-review.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/data-layer-boundaries.md`
- `docs/contracts/metadata-hydration-contract.md`
- `src/main/services/hydrationRequestPostureService.js`
- `src/main/services/hydrationExecutionPolicyPreviewService.js`
- `src/main/services/hydrationAttentionRuntimePostureService.js`
- `src/main/services/mutatingActionService.js`
- `src/main/metadata/reportHydrator.js`
- `src/main/services/serviceRegistry.js`
- `src/main/db/schema.sql`

## Advisory Questions

1. What should "pickup" mean in Atlas for Hydration request posture?
   - Is it a future command input?
   - A non-durable selected action?
   - A derived candidate passed to existing `metadata.hydration`?
   - Something that must wait for a durable model?

2. What must remain true before pickup can exist?
   - explicit operator act
   - Atlas-local basis
   - local-first short-circuit
   - External I/O release to normal gates
   - storage/write posture ready
   - confirmation where appropriate

3. What should not become pickup?
   - focus / hover / navigation
   - report load
   - local label reuse
   - local SDE/static lookup repair
   - provider-needed posture while held or blocked
   - Watch/background backlog without separate policy

4. Can pickup be modeled as read-only eligibility plus a future explicit execution command, or does it need persistence before it is meaningful?

5. If persistence is deferred, how should Atlas prevent duplicate or hidden work?

6. What shape should future execution consume?
   - `id_type` / `id_value`
   - source surface/context
   - basis anchor
   - reason
   - posture/gate summary
   - confirmation token
   - request digest

7. How should selected-ID pickup differ from Watch/background Hydration pickup?

8. What should remain parked until a later Dev runway?

## Constraints

- no implementation
- no Dev runway
- no provider/API/live calls
- no Hydration execution
- no Hydration writes
- no metadata run creation
- no entity writes
- no activity-event label patches
- no queue persistence
- no dispatcher
- no leases/retries/workers
- no schema changes
- no runtime enforcement activation
- no command blocking
- no storage config or External I/O config writes
- no Watch mutation or arming
- no Assessment Memory or Marked mutation
- no support artifacts
- no renderer UI work

Do not treat pickup as execution.

Do not treat eligibility as authorization.

Do not design a broad provider queue.

## Expected Output

Create:

```text
workspace/DataEngineeringHS262-hydration-request-pickup-shaping-advisory.md
```

Include:

1. Executive recommendation.
2. Proposed definition of pickup.
3. Distinction between posture, pickup, execution, and write.
4. Minimum facts needed before pickup.
5. Whether persistence is needed now or should remain deferred.
6. Duplicate/hidden-work risk model.
7. How future execution should consume pickup material.
8. Difference between selected-ID pickup and Watch/background pickup.
9. Smallest next Dev packet, if any.
10. Parked items.
11. Verification/evidence reviewed.
12. Human/Overseer decisions needed.
