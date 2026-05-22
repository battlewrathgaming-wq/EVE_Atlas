# Complete: Destructive Actions And Retention UX

Status: Complete For IPC Shell Preparation

## Actionables

- Define destructive actions before exposing them in UI.
- Require confirmation for evidence deletion/pruning.
- Offer assessment/snapshot preservation before pruning useful old evidence.
- Keep diagnostics pruning separate from evidence pruning.
- Show exactly what will be deleted or compacted.

## Task Requirements

Retention policy exists, but UI workflows need explicit destructive-action rules.

Potential actions:

- prune API logs
- prune metadata run logs
- expire old queue refs
- delete disposable runtime DB
- prune old evidence by scope/time
- compact evidence into assessment artifact

## Guardrails

- Evidence should not be deleted silently.
- Assessment artifacts should survive evidence pruning.
- Queue preview metadata can expire more freely than expanded evidence.
- Diagnostics are prunable; evidence is deliberate.

## Completion Signal

Any destructive UI action has confirmation, scope summary, and appropriate preservation/compaction path.

## Current Implementation

- `retention.actions` lists known destructive/retention action definitions.
- `retention.preflight` previews impact, confirmation requirements, and preservation policy.
- Evidence pruning preflight recommends assessment preservation before deletion.
- Diagnostics, metadata, queue, runtime, evidence, and assessment-compaction action types are defined.
- Preflight is read-only and performs no pruning/deletion.
- Verified by `verify:retention-preflight` and `verify:service-registry`.

## Remaining Follow-On Work

- Actual pruning/deletion commands are not implemented yet.
- Renderer confirmation flows still need to consume the preflight shape.
- Assessment artifact persistence must exist before evidence pruning is exposed as an executable action.
