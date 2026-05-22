# TODO: Destructive Actions And Retention UX

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

