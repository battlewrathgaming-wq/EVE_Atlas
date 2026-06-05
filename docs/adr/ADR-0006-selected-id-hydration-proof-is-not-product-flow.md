# ADR-0006: Selected-ID Hydration Proof Is Not Product Flow

Status: Accepted
Date: 2026-06-05

## Context

HS276 introduced the first real provider-contact proof for selected-ID Hydration:

```text
metadata.hydration_selected_id_real_execution_proof
```

The proof deliberately crossed the provider-contact boundary once, under controlled conditions:

- trusted non-renderer command only
- controlled temp Atlas store only
- one Human-provided character ID: `92418041`
- intentionally seeded local unresolved Atlas basis
- one ESI `/universe/names` lookup
- Hydration/readability writes only in the temp store

That proof was valuable because it showed Atlas can:

- rebuild local-first request posture before contact
- rebuild pickup as a non-durable candidate
- pass External I/O, live/provider, and storage/write posture
- validate ESI name response shape
- write only readability repair rows
- preserve Evidence/EVEidence, Discovery, Watch, Marked, Assessment Memory, schema, support artifacts, UI, and runtime enforcement boundaries

The risk is that proof scaffolding can accidentally harden into product design. The test uses a fixed ID, seeded local basis, trusted flags, controlled temp storage, and a proof-only command. These are verification tools, not product workflow definitions.

## Decision

Treat HS276 selected-ID real Hydration execution as proof/test machinery only.

The following are not product behavior:

- fixed target `character:92418041`
- Human-owned test ID as product default
- controlled temp Atlas store as operator corpus behavior
- automatic seeding of local basis for Hydration
- `allowHydrationSelectedIdRealExecutionProof`
- `controlledTempAtlasStore`
- proof-only command naming or invocation shape
- verifier-created activity rows
- verifier-created killmail rows
- proof-specific `selected_id_real_hydration_execution_proof` run type as a product run type
- implicit provider contact because preflight/pickup says ready

Product selected-ID Hydration, if opened later, must be separately shaped and authorized.

It must preserve the accepted product rules:

```text
Evidence/EVEidence -> raw-ID Observation -> selective Hydration for readability -> Assessment
```

```text
Discovery outputs possible leads.
Evidence Expansion outputs Evidence/EVEidence.
Hydration outputs readability repair.
Fourth lane stays parked.
```

```text
Request posture is pickup-readable, not pickup.
Pickup is not execution.
Execution is not write until the write path succeeds under policy.
```

## Product Requirements For Later Work

A future product Hydration flow must not use HS276 proof scaffolding as authority.

Before product behavior exists, Atlas must define:

- how the operator selects an unresolved local ID
- what local basis qualifies as enough for Hydration
- how local labels short-circuit provider contact
- how External I/O, live/provider gate, storage/write posture, command authority, and confirmation compose at execution time
- which provider endpoints are allowed
- whether renderer triggering is allowed, and under what confirmation model
- how real operator corpus writes are scoped and audited
- how provider errors, unresolved IDs, retry/cooldown, and partial outcomes are represented
- how product run types differ from proof run types
- what verification proves real product behavior without broad live testing

## Consequences

HS276 can be used as evidence that the narrow provider/write boundary can work.

HS276 must not be used as a shortcut to:

- enable renderer-triggered Hydration
- hydrate arbitrary IDs
- hydrate IDs without Atlas-local basis
- seed operator corpus rows for convenience
- reuse a proof-only trust flag as product authority
- skip confirmation / command authority
- skip External I/O or live/provider gates
- skip storage/write posture
- broaden into background Hydration
- introduce Bucket/Dispatcher behavior
- reopen a fourth lane / fast lane

Future Dev packets should name whether they are:

- proof/test machinery
- read-only product posture
- trusted non-renderer operator behavior
- renderer-triggerable product behavior

If a packet changes from proof/test machinery to product behavior, it needs a new explicit runway and acceptance criteria.

## Alternatives Considered

- Treat HS276 as the first version of product Hydration: rejected because it contains proof-only scaffolding, fixed target behavior, and controlled temp-store assumptions.
- Let product behavior evolve from the proof command organically: rejected because it would blur verification artifacts with operator workflows.
- Delay documenting until product Hydration is opened: rejected because the risk is strongest now, while HS276 proof code is fresh and easy to over-inherit.

## Related Documents

- `workspace/OverseerHS276-selected-id-real-hydration-execution-proof-runway.md`
- `workspace/DevHS276-selected-id-real-hydration-execution-proof.md`
- `workspace/OverseerHS277-hs276-selected-id-real-hydration-execution-proof-review.md`
- `workspace/EngineeringSecurityHS274-selected-id-real-hydration-execution-gate-advisory.md`
- `docs/features/data-layer-boundaries.md`
- `docs/contracts/metadata-hydration-contract.md`
