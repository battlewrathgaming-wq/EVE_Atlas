# Gap To-Do: Aura Core Extraction Brief

Status: Open
Priority: P2
Milestone: Operational Workflow Hardening

## Mission Statement

Prepare a small, disciplined handoff for standalone Aura: clone Atlas principles and selected utilities, not the whole Atlas app.

## Items For Completion

- List clone-ready Atlas concepts and files.
- Separate utility candidates from Atlas-specific evidence/watch/report code.
- Define a minimal standalone Aura bone-shell:
  - docs structure
  - service registry pattern
  - task runner pattern
  - message taxonomy
  - pure parser/compute module
  - fixture-driven tests
- Explicitly state what not to clone yet.
- Identify any utility code that should be copied, adapted, or rewritten.
- Keep Aura parser/compute work independent from Atlas SQLite persistence until needed.

## Guardrails

- Do not copy Atlas wholesale.
- Do not import Atlas evidence storage assumptions into a tactical parser too early.
- Do not make Aura depend on Atlas runtime DB paths.
- Keep parser/compute mechanics testable in isolation.
- Borrow doctrine and rigging, not accidental app shape.

## Completion Signal

There is a concise brief that a new Aura project/chat can use to scaffold a standalone core without dragging in Atlas persistence, UI, or watch semantics.

## Related Documents

- `docs/audits/audit-2026-05-22-overseer-runtime-handover-and-core-clone-readiness.md`
- `docs/tenets/tenets.md`
- `docs/gap/complete/background-worker-execution.md`
- `docs/gap/complete/ipc-service-contract.md`
- `src/main/services/taskRunner.js`
- `src/main/services/messageTaxonomy.js`
- `src/main/api/httpClient.js`
