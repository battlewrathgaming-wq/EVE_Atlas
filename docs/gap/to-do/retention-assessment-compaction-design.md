# Gap To-Do: Retention Assessment Compaction Design

Status: Open
Priority: P3

## Actionables

- Design assessment artifact persistence before executable evidence pruning.
- Define how old evidence can be summarized into committed assessment memory.
- Decide retention behavior for diagnostics, metadata runs, queue refs, stale failed refs, and runtime DB artifacts.
- Keep destructive pruning behind preflight and confirmation until assessment preservation exists.

## Task Requirements

Retention preflight exists, but actual deletion/pruning should not ship before Atlas can preserve meaningful assessment memory.

Design should cover:

- entity interest artifacts
- interest/priority/impact score fields
- evidence window summarized
- appearance counts and scope snapshot
- source report/scope metadata
- user confirmation and assessment reason
- what survives evidence pruning

## Guardrails

- Evidence must not be deleted silently.
- Assessment is not raw evidence.
- Assessment artifacts should be deliberate, not auto-created for every observed entity.
- Scores need reasons or supporting summaries.
- Pruning should remain scoped and auditable.

## Completion Signal

A design/contract exists for assessment artifacts and evidence compaction, and retention execution remains blocked until that design is implemented and verified.

## Related Documents

- `docs/statements/retention-and-deprecation-policy.md`
- `docs/features/entity-interest-artifacts.md`
- `docs/features/evidence-compaction-to-assessment.md`
- `docs/terms/entity-interest.md`
- `docs/terms/work-products.md`
