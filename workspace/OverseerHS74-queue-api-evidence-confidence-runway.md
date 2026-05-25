# OverseerHS74 - Queue API Evidence Confidence Runway

Date: 2026-05-25
Role: Atlas Overseer
Milestone: Atlas Storage And Runtime Hardening

## Decision

Opened HS74 as the next bounded Dev runway.

Selected lane:

```txt
Queue -> API request -> Evidence write confidence hardening
```

## Why This Lane

This is the strongest next storage/runtime hardening step because it sits on Atlas's core trust boundary:

```txt
Discovery refs -> API/ESI expansion -> stored Evidence
```

It improves confidence before production deletion execution, broader support-artifact budgeting, or UI presentation expansion.

## Scope

HS74 asks Dev to trace and prove the existing queue-to-Evidence path with offline fixtures, especially mixed success/failure behavior.

The packet should establish:

- successful ESI-expanded killmail writes durable Evidence
- failed expansion does not write partial Evidence
- failed expansion leaves reviewable provenance/status
- retries or later success do not duplicate Evidence
- zKill Discovery anchors and ESI Evidence-confirmed anchors remain distinct
- durable SQLite/support records can reconstruct what happened after restart

## Explicit Non-Goals

- no live/private/API calls
- no deletion execution
- no snapshot cleanup, restore, active DB relocation, or storage-budget expansion
- no UI redesign
- no broad service, IPC, payload, schema, or terminology rename
- no automatic retry/background collection behavior

## Expected Dev Handoff

```txt
workspace/DevHS74-queue-api-evidence-confidence.md
```

## Notes

Existing verification already includes `verify:queue-api-evidence-write`. HS74 may refine or extend that proof, and should keep changes as narrow as the evidence requires.
