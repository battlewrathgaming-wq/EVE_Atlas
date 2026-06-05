# OverseerHS299 HS298 System/Radius Discovery Ref Identity Advisory Review

Status: accepted
Date: 2026-06-05
Owner: Overseer
Reviewed request: `workspace/OverseerHS298-system-radius-discovery-ref-identity-advisory-request.md`
Reviewed artifact: `workspace/EngineeringDataHS298-system-radius-discovery-ref-identity-advisory.md`

## Decision

Accepted.

HS298 is accepted as advisory/source-trace input. It opens no schema, no Discovery ref mutation, no durable Watch result semantics, and no implementation by itself.

## Accepted Finding

Current durable `system_radius` Discovery ref identity is center-only:

```txt
killmail_id + killmail_hash + discovered_by_type + discovered_by_id
system_radius discovered_by_id = center_system_id
```

HS296 changed Watch execution authority, not Discovery ref identity.

Accepted current posture:

- center-only `system_radius` identity is acceptable for the current safe phase;
- Discovery refs remain possible leads / provenance;
- Evidence/EVEidence remains ESI-expanded killmail truth;
- center-level queue dedupe/drain can remain current behavior while durable Watch/task results are parked;
- current identity must be disclosed as a limitation in read-only outcome/conformance surfaces.

Accepted future risk:

- center-only identity is not sufficient as the foundation for future durable Watch/task result semantics when multiple system/radius Watches share a center but differ by radius, exclusions, accepted included system set, run, or Watch row;
- `fetch_runs` and `last_seen_run_id` preserve useful provenance but do not preserve full many-to-many membership history;
- future result semantics should not accumulate in Evidence/EVEidence or `activity_events` relationship tags.

## Preferred Future Shape

If durable Watch/task result semantics are opened later, prefer a separate result/readout membership layer:

```txt
discovered_killmail_refs
  remains possible-lead queue/dedupe/provenance identity

watch_result or outcome_readout
  identifies Watch/task/run/window/scope snapshot

watch_result_items or outcome_items
  links result identity to killmail_id/hash and/or run_id/ref basis
```

Do not mutate Evidence/EVEidence meaning to carry Watch result identity.

## Immediate Follow-Up

During review, Overseer found one local consistency issue:

```txt
runtime.watch_task_outcome_map.preview still describes the pre-HS296 system/radius execution posture.
```

Specifically, the preview/verifier still says:

- executor dispatch payload does not use stored included/excluded lists;
- collector planning recomputes topology from center/radius as the current execution posture;
- stored snapshot versus recomputed topology policy is unresolved.

That was true before HS296. It is stale now.

This does not invalidate HS298, but it should be corrected before the outcome map preview is used as a current instrument.

## Accepted Next Seam

Open a bounded Dev refresh packet:

```txt
Update runtime.watch_task_outcome_map.preview to reflect HS296 stored-scope execution authority while preserving the HS298 center-only Discovery ref identity limitation.
```

This is read-only preview/conformance maintenance, not Watch result schema or identity redesign.

## Parked

Do not open without a new bounded decision:

- Discovery ref identity redesign
- schema migration
- durable `watch_result`
- durable `watch_result_items`
- relationship tags
- relationship truth
- provider movement or live testing
- Watch execution redesign
- queue/dispatcher/Bucket machinery
- Evidence/EVEidence mutation
- UI/renderer work beyond read-only service metadata already present
- runtime enforcement or command blocking
- support artifacts
- fourth lane / fast lane
