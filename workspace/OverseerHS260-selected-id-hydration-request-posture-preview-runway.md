# Overseer HS260 - Selected-ID Hydration Request Posture Preview Runway

Status: open
Date: 2026-06-05
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS260-selected-id-hydration-request-posture-preview.md`

## Purpose

Add the smallest read-only proof that an explicit operator request for one unresolved ID can be classified as Hydration request posture without creating pickup, execution, provider movement, or writes.

This packet implements the HS258/HS259 accepted seam:

```text
selected unresolved ID
-> explicit operator act
-> local-first lookup
-> Hydration request posture
-> already_local / local_lookup_available / provider_needed / held / blocked / invalid / insufficient_basis
```

## Accepted Boundary

Preserve:

```text
Focus is not request.
Request posture is pickup-readable, not pickup.
Pickup is not execution.
Execution is not write until the write path succeeds under policy.
```

## Scope

Add a read-only service command concept:

```text
metadata.hydration_request_posture.preview
```

The preview should accept a selected ID and local source context, then return a single posture row plus compact gate/readability summaries.

Expected input shape may be adjusted to fit existing service patterns, but should include:

- `id_type`
- `id_value`
- explicit operator request marker, such as `operator_act: true`
- `source_surface` or `source_context`
- optional basis anchor such as report target, `killmail_id`, `event_key`, or local row basis

## Required Behavior

Prove:

- focus, hover, navigation, and report-load inputs do not become provider-backed requests; reject them or classify them as `not_a_request`
- explicit operator act is required
- local labels short-circuit to `already_local`
- locally available static labels or local lookup repair classify as `local_lookup_available`
- supported entity IDs with no local label classify as `provider_needed`, or as held/blocked derivatives when gates apply
- unsupported or malformed IDs classify as `invalid_or_unsupported_id`
- missing Atlas-local basis classifies as `insufficient_basis`
- External I/O off can hold provider-backed posture without marking failure
- storage/write posture can block future Hydration writes without blocking local readout
- provider-needed labels remain readability work, not Evidence/EVEidence work

## Implementation Notes

Prefer reusing existing posture pieces before creating new abstractions:

- `hydrationCandidatePreviewService.js`
- `hydrationAttentionRuntimePostureService.js`
- `hydrationExecutionPolicyPreviewService.js`
- `externalIoStateService.js`
- `liveApiGateService.js`
- `storageSetupGateReadoutService.js`
- `serviceRegistry.js` read-only command metadata pattern

The preview may be a new small service file if that is cleaner.

If added to renderer-eligible command metadata, keep it read-only and explicit that renderer access is readout only.

## Do Not

- do not call ESI, zKill, or any provider
- do not run live/API/provider checks
- do not create `metadata_runs`
- do not write `entities`
- do not patch `activity_events`
- do not create Evidence/EVEidence
- do not mutate Discovery refs
- do not persist a queue or request row
- do not add a dispatcher, lease, retry, or pickup worker
- do not change schema
- do not activate runtime enforcement or command blocking
- do not change storage config or External I/O config
- do not mutate Watch, Marked, Assessment Memory, or pruning/deletion state
- do not add renderer UI
- do not create support artifacts

## Verification

Add a focused verifier if implementation adds the new preview command:

```text
npm.cmd run verify:hydration-request-posture
```

If adding that script is too much naming churn, use a direct script command and explain why in the handoff.

Expected proof should cover at least:

- command is listed as read-only and renderer-eligible readout, if registered
- focus/hover/report-load is `not_a_request` or rejected
- explicit operator request is accepted as posture input
- already-local label returns `already_local`
- provider-needed supported ID returns provider-needed or held/blocked posture under gates
- External I/O off returns held posture, not failure
- storage blocked returns future-write blocked posture, not local readout failure
- unsupported ID returns invalid/unsupported
- missing basis returns insufficient basis
- zero provider calls
- zero Hydration writes
- zero metadata run writes
- zero entity writes
- zero activity event patches
- no persisted queue

Also run:

```text
node --check src\main\services\serviceRegistry.js
node --check <new-or-touched-service-file>
node --check <new-or-touched-verifier-script>
git status --short --branch
```

Run broader checks only if touched files require it.

## Handoff Requirements

Create:

```text
workspace/DevHS260-selected-id-hydration-request-posture-preview.md
```

Include:

1. What changed.
2. Exact command/service shape added.
3. Output states proven.
4. Boundary confirmation.
5. Verification commands and results.
6. Any gaps or follow-up seams.
