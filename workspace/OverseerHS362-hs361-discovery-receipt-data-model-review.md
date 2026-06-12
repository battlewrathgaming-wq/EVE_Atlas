# OverseerHS362 - HS361 Discovery Receipt Data Model Review

Status: accepted
Date: 2026-06-07
Role: Overseer
Milestone: Atlas Storage And Runtime Hardening

## Reviewed

- `workspace/DataEngineeringHS361-discovery-receipt-basis-projection-model.md`
- `workspace/EngineeringTraceHS359-discovery-receipt-task-packet-source-trace.md`
- `workspace/OverseerHS360-hs359-discovery-receipt-source-trace-review.md`
- `workspace/OverseerHS358-discovery-receipt-model-shaping-note.md`
- `workspace/current.md`

## Acceptance

HS361 is accepted.

The accepted model is:

```txt
Discovery-owned canonical receipt basis
caller-selectable safe projections
non-durable fixture proof before schema
```

## Accepted Decisions

### External I/O Hold

Accepted:

```txt
held_by_external_io is request-level pre-acquisition posture, not a packet outcome for the next proof.
```

If External I/O is off, Discovery should rest before acquisition. It should not manufacture packet outcomes for provider work that was deliberately not attempted.

### Packet / Task Vocabulary

Accepted for the next proof:

- attempted acquisition packets use the accepted packet outcome vocabulary
- the top-level receipt rolls up packet outcomes through counts and posture fields
- no separate task-outcome truth vocabulary is needed now

Accepted packet outcome words:

- `complete_refs_found`
- `complete_no_refs`
- `partial_deferred`
- `provider_deferred`
- `acquisition_capped`
- `failed_retryable`
- `failed_terminal`

`invalid_scope` remains pre-Discovery.

### Projection Model

Accepted:

```txt
Caller projections are views over the same canonical Discovery receipt basis.
```

Projection is performance/presentation shaping only. It does not transfer meaning ownership to Watch, Manual, Observation, or future callers.

Accepted temporary engineering projection names:

- `minimal`
- `watch_summary`
- `operator_detail`
- `debug_basis`

Projection may omit volume, not safety.

### Durability

Accepted:

```txt
Do not add schema for the next proof.
```

The next proof should be fixture-only and non-durable. Durable task/packet schema remains parked until Atlas needs runtime restart recovery, Watch schedule advancement from receipt facts, retry/defer packet handling, durable no-ref audit, durable packet-to-ref linkage, or historical receipt query.

## Smallest Next Proof

The next suitable Dev packet, if opened, is:

```txt
Discovery receipt projection fixture proof
```

Expected shape:

- input fixture Discovery pickup packets
- inject fixture provider-return outcomes per packet
- emit one canonical receipt basis
- emit one requested projection
- include actor and system/radius cases
- include refs found, no refs, provider deferred, acquisition capped, retryable failure, terminal failure, mixed rollup, and External I/O held pre-acquisition case
- prove projections preserve mandatory safety fields
- prove no provider calls, DB writes, schema, Watch mutation, Evidence/EVEidence, Hydration, Observation, UI, dispatcher, or enforcement behavior

## Boundary

Candidate refs remain possible leads, not Evidence/EVEidence and not task memory.

ESI Evidence Expansion begins after selected killmail ID/hash refs are expanded through ESI and written into the Evidence/EVEidence corpus. Receipt success must not be upgraded by later ESI success.

Discovery success means Atlas truthfully reports what happened within accepted acquisition bounds. It does not mean caller satisfaction, full coverage, or Evidence creation.

## Remaining Human / Overseer Decision

The model is coherent enough to open the fixture proof.

Before opening Dev, the only practical choice is whether to proceed now or pause at this decision point.

## No Dev Runway

No Dev runway is opened by this review.
