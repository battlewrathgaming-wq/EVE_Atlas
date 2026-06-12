# OverseerHS353 - Discovery Outcome Model Shaping Note

Status: accepted shaping note
Date: 2026-06-06

Context:

- `workspace/EngineeringAuditHS351-discovery-boundary-task-handling-trace.md`
- `workspace/OverseerHS352-hs351-discovery-boundary-audit-review.md`

Purpose:

Capture settled Human / Overseer decisions from Discovery outcome-model shaping so the current restructure does not depend on chat memory.

## Settled Direction

Current gravity remains Discovery.

Observation can wait until Discovery can complete its own acquisition loops and return bounded receipts to source intent.

Discovery loop under review:

```text
accepted intent handoff
-> Discovery work bucket
-> packet fanout
-> provider movement
-> packet outcomes
-> candidate refs / no refs / deferred / capped / failed
-> task rollup
-> completion stub / receipt
```

Watch-side simplification:

```text
Watch decides due scope/window.
Watch places work.
Watch receives receipt.
Watch updates next posture.
```

Watch should not depend on Evidence Expansion, Hydration, Observation, or Assessment completion to know whether its acquisition ask reached outcome.

## Manual Path Adoption

Decision:

Manual path adoption is parked for now.

Reason:

This seam should define the language from Discovery's perspective first, because Discovery is the shared utility. Manual Discovery, Live-like lookup, and future recovery flows can later adopt or map to this language without being pulled into the current Watch-focused seam.

## Acquisition Capped Handling

Decision:

`acquisition_capped` is a complete-but-limited Discovery outcome.

Meaning:

```text
Discovery completed the acquisition attempt.
Provider/acquisition envelope limited the result.
Atlas must not imply full coverage.
Watch may rest or continue cadence normally.
Observation must disclose capped basis if it uses the result.
```

Grounding:

zKill may return a bounded FIFO slice, such as a practical 1000-result cap. Atlas can be honest that it captured the available bounded slice, but it cannot claim the uncaptured 1001st ref.

`acquisition_capped` is not:

- invalid scope
- failed task
- Evidence completion
- retry-immediately instruction
- permission to flood provider to compensate

## Remaining Questions

Still open for next shaping or audit:

- whether task and packet use the same outcome words, or packet outcomes roll up into task outcomes
- whether the next proof should be read-only derivation from existing rows or a fixture-only task/packet model
- minimal completion stub fields
- whether `discovered_killmail_refs` remain candidate-ref memory under a broader task/packet model
- whether provider deferral closes the current attempt/window with `provider_deferred`, or keeps task state open until retry

Current recommendation:

Start with a read-only derivation proof of current outcomes from existing rows before accepting durable Discovery task/task-packet schema.

## Boundary

This note does not authorize Dev work, schema, provider calls, live Watch execution, Discovery writes, Evidence/EVEidence writes, Hydration writes, Observation work, UI, runtime enforcement, or support artifacts.

