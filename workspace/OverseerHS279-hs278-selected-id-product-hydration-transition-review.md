# Overseer HS279 - HS278 Selected-ID Product Hydration Transition Review

Status: accepted
Date: 2026-06-05
Project: AURA Atlas
Reviewed by: Atlas Overseer

## Reviewed

- Request: `workspace/OverseerHS278-selected-id-product-hydration-transition-advisory-request.md`
- Advisory artifact: `workspace/EngineeringSecurityHS278-selected-id-product-hydration-transition-advisory.md`

## Result

HS278 is accepted. No blocking issue found.

Accepted recommendation:

```txt
Selected-ID Hydration should not move directly from HS276 proof/test machinery into product behavior.
```

Atlas is ready for a bounded read-only product authority/preflight contract. Atlas is not ready for product provider-backed selected-ID Hydration execution, renderer-triggered Hydration, background Hydration, Bucket/Dispatcher, schema, runtime enforcement, or UI behavior.

## Accepted Product Transition Guardrail

HS276 remains proof evidence only.

The following must not become product authority:

- `metadata.hydration_selected_id_real_execution_proof`
- `allowHydrationSelectedIdRealExecutionProof`
- `controlledTempAtlasStore`
- fixed target `character:92418041`
- Human-owned test ID as product default
- seeded disposable-store unresolved basis
- proof-only run type `selected_id_real_hydration_execution_proof`
- proof trigger `trusted_proof`
- verifier-created rows
- temp-store path authority
- opt-in live verifier path

## Accepted Product Direction

Product selected-ID Hydration, if opened later, should be:

- an explicit operator act
- local-basis driven
- local-label short-circuit first
- storage-authority driven from actual Atlas runtime/store posture
- External I/O gated
- live/provider gate attempted through the real cadence path
- command-authority / confirmation gated
- read/write boundary limited to Hydration/readability repair
- separate from Evidence Expansion, Discovery, Watch, Assessment Memory, support artifacts, UI state

Recommended command/run type:

```txt
metadata.selected_id_readability_repair.execute
selected_id_readability_repair
```

## Accepted Next Packet

Open a read-only product authority/preflight contract packet.

It should prove product-selected-ID facts without HS276 scaffolding:

- proof flags rejected or disclosed as non-authority
- fixed HS276 ID not special
- temp-store context not product storage authority
- local Atlas basis classified
- local label short-circuit detected
- storage authority from current storage readback / trusted runtime facts
- External I/O/live gate posture rebuilt
- command authority requirements named
- expected writes and forbidden mutations disclosed

No provider calls. No Hydration writes. No product execution.

## Parked Items

Remain parked:

- product live selected-ID Hydration execution
- renderer-triggered provider-backed Hydration
- UI confirmation behavior
- background or report-wide Hydration
- Watch/background Hydration pickup
- Bucket / Dispatcher / worker / lease / retry / queue dispatch
- runtime enforcement activation
- command blocking
- schema changes
- support artifacts
- corpus pruning/deletion
- fourth lane / fast lane
- treating Watch, Assessment Memory, or Discovery refs as standalone authority for provider Hydration

## Verification

Reviewed the advisory artifact from disk. No code implementation, provider calls, Hydration writes, corpus mutation, schema work, Bucket/Dispatcher work, runtime enforcement, support artifact creation, or UI work were performed by this review.
