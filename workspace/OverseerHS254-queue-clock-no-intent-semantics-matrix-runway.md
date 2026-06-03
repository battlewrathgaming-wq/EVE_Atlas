# Overseer HS254: Queue / Clock No-Intent Semantics Matrix Runway

Date: 2026-06-03
Role: Atlas Overseer
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS254-queue-clock-no-intent-semantics-matrix.md`

## Purpose

Prove and, if needed, narrowly correct `runtime.queue_clock_posture.preview` so it distinguishes current work from provider capability.

The immediate target is the zKill Discovery lane: it must not imply current provider-backed work when Atlas has no pending Discovery refs, no explicit manual discovery scope, and no due/eligible Watch acquisition intent.

## Background

HS252 accepted Data Engineering guidance:

```txt
provider capability exists != Atlas currently has provider-backed work to do
```

The existing preview is safe and read-only, but its counts/wording can be misleading before future dispatcher, enforcement, support artifact, or UI work.

## Scope

Implement a fixture-only no-intent semantics matrix for `runtime.queue_clock_posture.preview`.

Add a new verifier, or extend the existing queue-clock verifier if that is cleaner, covering at least:

1. Empty DB, no Watch rows, no manual discovery scope.
2. No pending Discovery refs and no explicit manual/Watch acquisition intent.
3. Explicit manual discovery scope supplied.
4. Pending/failed Discovery refs present.
5. Due/eligible Watch acquisition intent with valid scope.
6. Not-due, inactive, or held Watch acquisition posture.
7. Missing or malformed Watch acquisition scope.
8. Watch/background Hydration demand present but no Watch acquisition intent.
9. Summary provider-backed current-work counts exclude capability-only posture.

If the verifier proves the current ambiguity, make the smallest readout/count correction needed.

Preferred disclosure fields may include, if useful:

```txt
current_provider_backed_work
provider_capability_available
requires_explicit_scope_or_watch_intent
manual_discovery_intent
watch_acquisition_intent
```

Do not remove existing fields unless absolutely necessary. If existing fields remain, make their meaning coherent and covered by tests.

## Required Boundaries

Do not add:

- live/API/provider calls
- zKill Discovery execution
- ESI Evidence Expansion execution
- Hydration execution
- provider-backed writes
- Evidence/EVEidence writes
- Hydration writes
- Discovery ref mutation
- Watch mutation or arming
- Assessment Memory or Marked mutation
- persisted packets
- schema-backed queues
- broad provider work queue
- active dispatcher
- runtime enforcement activation
- command blocking
- support artifact creation
- renderer/UI work
- storage config writes or movement

Do not treat External I/O on, storage unlock, Watch arming, or provider capability as authorization.

Do not make `discovered_killmail_refs` the sequencer.

## Acceptance Criteria

- `runtime.queue_clock_posture.preview` remains read-only.
- No-intent fixture case reports no current zKill provider-backed work.
- Provider capability can be visible without being counted as current work.
- Explicit manual discovery intent is distinct from absent manual intent.
- Watch acquisition intent is distinct from manual discovery intent.
- Watch acquisition intent is distinct from Watch/background Hydration demand.
- Pending local Discovery refs are still preferred before fresh zKill Discovery.
- Summary current-work counts do not include capability-only posture.
- Restart/unlock/External I/O re-enable still do not create catch-up flood or request debt.
- Existing populated queue-clock posture behavior remains covered.

## Verification

Run:

```txt
node --check src\main\services\queueClockPostureService.js
node --check scripts\verify-queue-clock-posture-preview.js
npm.cmd run verify:queue-clock-posture
```

Also run the new or extended no-intent verifier. If a new script is added, add a package script and run it, for example:

```txt
node --check scripts\verify-queue-clock-no-intent-semantics.js
npm.cmd run verify:queue-clock-no-intent
```

Supporting checks:

```txt
npm.cmd run verify:patient-packet-identity-sparse
git status --short --branch
```

## Stop Conditions

Stop and report if:

- the fix requires schema/persistence
- the fix requires dispatcher or provider execution design
- the fix requires runtime enforcement activation
- Watch acquisition intent cannot be derived safely from existing durable Watch rows
- correcting the count would break existing downstream expectations in a way that needs Human/Overseer decision

## Expected Handoff

Create:

```txt
workspace/DevHS254-queue-clock-no-intent-semantics-matrix.md
```

Include:

1. Summary of implementation.
2. Matrix cases covered.
3. Exact output semantics for current work vs provider capability.
4. Files changed.
5. Verification commands and results.
6. Boundary confirmation.
7. Any parked items or needed Overseer decision.

