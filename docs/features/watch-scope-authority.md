# Feature: Watch Scope Authority

Status: Accepted; execution conformance implemented
Updated: 2026-06-05

## Purpose

System/radius Watch setup must preserve the operator's accepted scope instead of silently changing collection scope later.

Atlas may use local topology lookup tables during authoring/preflight to help the operator resolve a center system and radius into a bounded set of included system IDs. Once accepted, that stored included system ID set is the Watch scope authority.

## Terminology

Use `SDE` for source/import provenance only.

After import, runtime topology work should refer to local topology lookup tables, local lookup tables, or local topology data.

The SDE zip/source material is not runtime lookup authority.

## Authority Model

Accepted rule:

```text
local topology lookup tables
-> authoring/preflight center + radius resolution
-> operator-accepted included system ID set
-> stored Watch scope
-> Watch execution uses stored included system IDs
```

Center system and radius remain provenance/explanation fields. They explain how the scope was formed, but they are not the execution source of truth after the Watch scope is accepted.

## Runtime Rule

Watch execution should use the stored included system ID set.

It should not recompute the execution scope from center system and radius as the authoritative source. Recomputing from local topology may be useful as a diagnostic comparison, but it must not silently replace the accepted Watch scope.

## Missing Or Changed Topology

If local topology lookup tables are missing at authoring/preflight time, Atlas cannot form or accept a system/radius Watch scope.

If local topology lookup tables change later, existing Watches continue to run against their accepted stored scope.

If the operator wants updated geometry, they should deliberately re-author or recalculate the Watch scope.

## Data Classification

Stored included system IDs are Watch intent / collection scope authority.

Center system, radius, and topology source details are provenance/explanation.

Discovery refs produced by execution remain possible leads / provenance, not Evidence/EVEidence.

Evidence/EVEidence is created only through ESI Evidence Expansion of selected refs.

## Current Implementation State

HS292 exposed that system/radius collection planning could recompute topology from center and radius, while stored included/excluded scope existed separately.

HS294/HS295 proved the conformance gap. HS296 corrected the execution path so system/radius Watch execution consumes accepted stored `included_system_ids` as execution authority.

Current parked limitation: system/radius Discovery ref identity remains center-only. That is acceptable for current possible-lead behavior, but not a foundation for durable Watch/task result semantics without a separate future result/readout membership decision.

## Must Not Do

- Do not read from compressed SDE source material at runtime to execute a Watch.
- Do not treat center/radius as execution authority after Watch scope acceptance.
- Do not silently change an existing Watch's execution scope because topology tables, caps, ordering, or exclusion handling changed.
- Do not treat Discovery refs as Evidence/EVEidence.
- Do not create durable `watch_result` semantics until Watch scope authority is mechanically coherent.
- Do not use recomputed topology as anything more than diagnostic comparison unless the operator deliberately re-authors the Watch.

## Related Documents

- `docs/adr/ADR-0003-local-sde-first.md`
- `docs/features/persistent-discovery-ref-queue.md`
- `docs/features/data-layer-boundaries.md`
- `workspace/OverseerHS293-hs292-watch-task-outcome-map-preview-review.md`
