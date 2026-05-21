# Statement: Stateful Documentation

Status: Active
Date: 2026-05-21

## Perspective

AURA Atlas now contains ingestion logic, normalization logic, aggregation logic, evidence philosophy, API orchestration behavior, and intelligence semantics.

As the project grows, the larger risk is not only that code breaks. The larger risk is that code technically works while violating the project's reasoning, philosophy, or architectural boundaries.

These documents preserve why the system behaves a certain way, not only how it currently works.

## Guidance

Stateful documentation should preserve:

- philosophical truths
- architectural invariants
- discovered failure modes
- operational constraints
- intelligence semantics
- orchestration doctrine

The documentation library acts as compressed architectural context for Codex, future contributors, future refactors, and future AI tooling.

## Non-Goals

Stateful documentation is not a commit log and should not record every small implementation change.

Create or update a durable artifact when future implementation could drift without the preserved reasoning.

## Related Tenets

- Evidence First
- UI Is Presentation, Not Authority
- Collection Provenance Is Not Intelligence Scope
- Respectful API Use

