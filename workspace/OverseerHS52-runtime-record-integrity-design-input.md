# OverseerHS52 - Runtime And Record Integrity Design Input

Date: 2026-05-25
Role: Atlas Overseer
Status: design input / audit seed

## Purpose

Capture Human design input about Atlas runtime, connection, queue, Watch, enrichment, storage, provenance, and deletion behavior.

This note is directional. It is not an implementation claim, Dev runway, schema contract, backend authority, or accepted deletion policy. Future Engineering/Overseer work must verify code and current-state docs before treating any item below as implemented.

## Working Meanings To Audit

- `Discovery`: intermittent downstream data packet/signal from ESI, zKill, or provider flow into Atlas before local evidence write.
- `Evidence`: the record Atlas writes after the gate into local memory/storage.
- `Enrich`: pipeline process that fills or validates missing information using ESI and internal ID lookup.
- Offline enrichment: possible when records/refs are already known locally; hydration can add known IDs such as system ID without live calls.
- `Provenance`: handling metadata Atlas supplies around source, timing, route, action, and transformation.
- `Assessment`: human-authored input, not programmatic evidence.
- `Watch`: scoped surveillance/routine collection behavior with cadence, lookback, and API gates; not a live feed by default.

## Design Input

- Runtime and connection hardening should become a major forward-looking Atlas lane.
- Record manipulation/storage efficacy should be audited as a trust foundation for Atlas as an evidence workstation.
- Discovery and Evidence should stay distinct: Discovery is upstream/intermittent signal; Evidence is the local record Atlas writes and handles.
- Enrichment is a pipeline, not a single UI action only. It may validate missing information with ESI and internal ID lookup.
- Records may be enriched offline when the relevant data is known locally.
- Partial API failure behavior is an open hardening question.
- Provenance is supplied by Atlas during handling; Assessment is Human-authored.
- Deletion direction is believed to be broad deletion allowed, with a footprint file containing at least `[id]` and `[interest]`, but this is not confirmed as locked policy.
- Information becomes stale over time; nothing should be assumed immutable without a policy decision.
- Watch may collect/enrich records in the background, but should be scoped by cadence/lookback and explicit gates rather than treated as a live feed.
- Queue statefulness and restart/recovery behavior need audit.

## Audit Lanes

### Record Lifecycle Audit

Trace:

```txt
Discovery packet/ref
-> gate
-> Evidence write
-> enrichment/hydration
-> provenance attachment
-> assessment linkage
-> deletion/footprint behavior
-> stale/refresh behavior
```

Questions:

- When exactly does Discovery become Evidence?
- What record is written, and what source/gate metadata travels with it?
- What does Enrich change, and how are repeated enrichments handled?
- Which enrichments can happen offline?
- How are provenance and assessment linked without blurring source meaning?
- What deletion behavior exists now, and what policy is only proposed?
- What footprint, if any, remains after deletion?

### Runtime / Queue / Watch Hardening Audit

Trace:

```txt
External API gate
-> task/queue state
-> provider call or offline hydration
-> partial failure handling
-> Watch cadence/lookback
-> restart/recovery
-> renderer/user-facing status
```

Questions:

- How stateful are queues across restart?
- What happens when an API call partially fails?
- Are task, queue, Watch, and runtime states recoverable and reviewable?
- Can Watch collect or enrich without surprising the operator?
- How are cadence, lookback, and blast radius bounded?
- Does the UI show enough basis without exposing too much machinery?

## Relationship To Current Docs

Current implemented truth remains in:

- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/critical-terms.md`

This note should inform future audit or roadmap refresh work. It should not override those files.

## Recommended Future Packet Shape

Open an Overseer/Engineering audit packet before Dev implementation.

Expected output:

- files and code paths reviewed
- implemented behavior confirmed
- proposed policy separated from current behavior
- risks and partial-failure cases
- recommended bounded Dev packet, if warranted
- verification commands

Do not open destructive deletion, live/private collection, backend schema, bridge/IPC, or persistence changes without explicit Human/Overseer authorization.
