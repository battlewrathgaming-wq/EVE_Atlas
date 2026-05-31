# Overseer HS84 - Watch Recovery Readout Interpretation Runway

Date: 2026-05-26
Role: Atlas Overseer
Status: advisory runway opened
Milestone: Atlas Storage And Runtime Hardening

## Decision

Open a specialist interpretation pass before more backend or renderer implementation.

HS82 proved the read-only `Watch_offline` recovery diagnostic. HS84 should decide how the diagnostic should read to an operator: what is status, what is detail, what is a warning, what is next action, and what should stay hidden as support metadata.

## Executor

UIUX / Product Interpretation specialist.

This is not Dev implementation.

## Source Of Intent

- Human accepted the need to inspect how the recovery readout communicates before adding more machinery.
- `workspace/OverseerHS83-hs82-watch-recovery-review.md`
- `workspace/DevHS82-watch-recovery-diagnostic-readout.md`
- `docs/adr/ADR-0005-watch-offline-readout-aggregation.md`
- `docs/current-state/current-evidence-pipeline.md`
- `src/main/watchlist/watchOfflineReadout.js`

## Task Shape

Review the current `Watch_offline` recovery model and produce an Atlas-owned interpretation spec.

The output should answer:

- What should the operator see first?
- Which `next_safe_action` values should become simple operator states?
- Which fields should stay in diagnostic/support detail?
- Which states deserve warning language?
- Which states should imply "wait", "review", "arm", "drain local work", or "ready"?
- How should valid, missing, and malformed radius scope be described without sounding like a system error when it is merely a limitation?
- How should provider deferral be shown as waiting, not failure?
- How should missed timer slots be shown as recoverable, not panic?
- What terms should the UI avoid so it does not blur Watch, Discovery, Evidence, hydration, or sequencer meaning?

## Guardrails

- Do not implement code.
- Do not create a Dev runway.
- Do not redesign the whole Watch UI.
- Do not rename Atlas source terms or bridge fields.
- Do not treat Lab presentation language as Atlas authority.
- Do not change backend, bridge, IPC, payloads, persistence, schemas, commands, or tests.
- Do not request live/API calls.
- Preserve Evidence, Discovery, Watch, Marked, hydration, provenance, and storage boundaries.

## Expected Artifact

```txt
workspace/UIUXHS84-watch-recovery-readout-interpretation.md
```

## Acceptance Use

Overseer should use the specialist artifact to decide whether the next packet is:

- a small renderer/readout presentation packet
- a Lab display request
- more runtime evidence gathering
- no action yet

Do not pass HS84 directly to Dev until Overseer accepts a bounded implementation packet into `workspace/current.md`.
