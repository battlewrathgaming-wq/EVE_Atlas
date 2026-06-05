# Overseer HS283 - Selected-ID Resolve Readability Posture Acceptance

Status: accepted
Date: 2026-06-05
Project: AURA Atlas
Milestone: Atlas Storage And Runtime Hardening

## Purpose

Capture the Human/Overseer alignment that closes the HS282 decision-surface discussion and gives Dev a bounded product execution posture.

## Accepted Posture

The user-facing act is:

```txt
Resolve
```

Resolve means:

```txt
repair readability for one selected unresolved local ID
```

Resolve is user-facing language. Internally the work remains Hydration/readability repair.

## Authority Principle

Atlas trusts deliberate operator intent.

The system should not degrade user intent by treating a clear Resolve act as suspect. The system should instead moderate the process into safe, bounded, respectful provider use.

Accepted wording:

```txt
Atlas trusts deliberate operator intent, but moderates provider movement through local-first checks, gates, and pacing.
```

## Local Readability

If Atlas already has a readable label locally, report / Observation construction should use that label automatically.

A user should not normally face a raw ID when the label is already resolved in local records.

If Resolve is requested and local readability already exists:

- no provider call
- no Hydration write
- no audit row
- quiet already-readable result

This also supports recovery: when local readability is repaired, the specific task can close quietly.

## Accepted Guardrails

- first product execution stays trusted / non-renderer
- one selected unresolved ID only
- strong local basis only:
  - Evidence/EVEidence-derived `activity_events` appearance
  - existing local `entities` row missing a label
- Watch-only, Discovery-only, and Assessment-only basis stay parked / non-authorizing
- local label short-circuit before provider contact
- local label recheck before write
- External I/O, live/provider gate, storage/write posture, command authority, and provider cadence must be re-read from trusted state
- no UI confirmation behavior in the first execution packet
- no renderer-triggered execution
- no background/report-wide Hydration
- no Bucket/Dispatcher/worker/lease/retry/queue design
- no Evidence/EVEidence mutation
- no Discovery, Watch, Marked, or Assessment Memory mutation
- no schema, support artifact, runtime enforcement, or fourth-lane work

## Durable Note

Promoted accepted posture to:

```txt
docs/features/selected-id-readability-repair.md
```

## Next Runway

Open a narrow trusted non-renderer execution packet for:

```txt
metadata.selected_id_readability_repair.execute
selected_id_readability_repair
```

Verification may use fixture/injected provider responses and controlled stores. Do not require live/API verification unless Human/Overseer explicitly asks for it.
