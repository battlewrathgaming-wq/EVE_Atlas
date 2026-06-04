# Overseer HS259 - HS258 Hydration Request Posture Review

Status: accepted
Date: 2026-06-05
Reviewed artifact: `workspace/DataEngineeringHS258-hydration-request-posture-advisory.md`
Request answered: `workspace/OverseerHS258-hydration-request-posture-advisory-request.md`

## Result

Accepted. No blocking issue found.

HS258 cleanly preserves the current Atlas boundary:

```text
Focus is not request.
Request is not provider execution.
Local cache reuse is not Hydration execution.
Provider lookup for a new unresolved ID remains explicit, gated Hydration.
```

The accepted request-posture model is:

```text
selected unresolved ID
-> explicit operator act
-> local-first lookup
-> Hydration request posture
-> already_local / local_lookup_available / provider_needed / held / blocked / invalid / insufficient_basis
```

This posture is read-only pickup material. It is not queue insertion, direct lane injection, provider movement, metadata run creation, `entities` write, `activity_events` patch, or Hydration execution.

## Accepted Clarification

Use this phrasing for future packets:

```text
Request posture is pickup-readable, not pickup.
Pickup is not execution.
Execution is not write until the write path succeeds under policy.
```

Additional accepted points:

- `request_posture_id` should remain derived/read-only unless a later proof shows durable identity is needed.
- `operator_act` is true only for a deliberate request, not hover, focus, report load, keyboard navigation, or mouse navigation.
- Focus/hover/report-load should be rejected or classified as `not_a_request` in a future preview.
- Local labels short-circuit to `already_local`.
- Local SDE/type/system lookup gaps remain local readability posture, not provider-backed ESI name Hydration.
- Unsupported IDs should classify as `invalid_or_unsupported_id`.
- Missing local basis should classify as `insufficient_basis`.
- Provider-needed IDs may be held or blocked by External I/O, cadence/provider gate, storage/write posture, or policy; those states are not failure.

## Code-Shape Spot Check

The advisory is compatible with current service shape:

- `hydrationAttentionRuntimePostureService.js` already states selected attention is not provider authorization and emits zero provider calls, zero writes, no persisted queue, and no runtime enforcement.
- `hydrationExecutionPolicyPreviewService.js` already separates Hydration as readability repair from Evidence/EVEidence and keeps eligibility separate from authorization.
- `hydrationCandidatePreviewService.js` already separates provider-needed labels from local SDE lookup gaps.
- `externalIoStateService.js`, `liveApiGateService.js`, and `storageSetupGateReadoutService.js` already provide the relevant held/released/gated posture pieces.

No further verification was required for acceptance because HS258 did not change code and its advisory evidence used targeted offline checks.

## Next Candidate Seam

If continuing on this lane, the smallest coherent Dev packet is:

```text
read-only selected-ID Hydration request posture preview
```

Expected command concept:

```text
metadata.hydration_request_posture.preview
```

That packet should prove an explicit operator request can be classified local-first without creating a queue, dispatcher, provider call, metadata run, Hydration write, schema change, runtime enforcement, or UI behavior.

## Parked

- Provider-backed Hydration execution.
- Hydration writes.
- Durable request/queue persistence.
- Dispatcher, leases, retries, or worker pickup.
- Watch pickup implementation.
- UI hover/focus, terminal strip, hotkeys, or mouse context menu.
- Schema changes.
- Runtime enforcement.
- Support artifacts.
