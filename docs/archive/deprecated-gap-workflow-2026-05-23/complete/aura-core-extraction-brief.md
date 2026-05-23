# Gap To-Do: Aura Core Extraction Brief

Status: Complete
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

## Extraction Brief

Standalone Aura should borrow Atlas discipline, not Atlas product shape.

Atlas is a persistent evidence-memory application. Standalone Aura should begin as a small tactical parser/compute core with its own test fixtures, no runtime DB dependency, and no watch/report assumptions until the parser proves itself.

## Clone-Ready Concepts

Use these as project doctrine:

- docs as capstones, not chat logs
- evidence / observation / assessment language separation
- IDs as facts, names as labels
- explicit live/API gates
- task status, cancellation, warnings, and progress events
- service registry as the single backend action boundary
- message taxonomy for warnings/errors/status
- fixture-first verification
- pure parser/compute modules before UI
- renderer/preload boundary if Aura becomes Electron-based later

## Utility Candidates

Copy or adapt with care:

- `src/main/services/taskRunner.js`
  - Good candidate for direct adaptation.
  - Remove Atlas-specific classification names only if Aura needs simpler categories.
- `src/main/services/messageTaxonomy.js`
  - Good pattern, but Aura should define tactical parser-specific codes.
- `src/main/api/httpClient.js`
  - Good pattern for User-Agent, timeout, retry, injectable fetch, and cancellation.
  - Only copy if standalone Aura needs external HTTP calls early.
- `src/main/normalization/checksum.js`
  - Good small utility if Aura needs stable fixture/result checksums.
- `src/main/scopes/scopeControls.js`
  - Use as a pattern only. Atlas watch/discovery scopes should not be copied directly.

## Atlas-Specific Code To Avoid

Do not clone these into standalone Aura at the start:

- SQLite schema and migrations
- evidence repository
- killmail ingestion pipeline
- zKill/ESI collection workers
- SDE importers
- watch executor and scheduler
- retention/destructive preflight model
- assessment artifact implementation
- Atlas renderer shell
- Atlas report modules

These are useful references later, but they encode evidence-memory behavior rather than tactical parser mechanics.

## Minimal Aura Bone-Shell

Recommended initial structure:

```txt
docs/
  tenets/
  statements/
  audits/
  failures/
  adr/
  schemas/
  gap/
src/
  core/
    parser/
    compute/
    fixtures/
  services/
    serviceRegistry.js
    taskRunner.js
    messageTaxonomy.js
scripts/
  verify-parser.js
  verify-compute.js
  verify-service-boundary.js
fixtures/
  parser/
  compute/
```

First useful behavior:

- parse one tactical input fixture
- compute one deterministic result
- return structured output through a service command
- record warnings with taxonomy codes
- verify with fixture scripts

## First Aura Rules

- Parser/compute must be pure and fixture-testable.
- UI must not be the authority for tactical meaning.
- Live/API work should be added only at the point of need.
- No Atlas runtime DB paths.
- No Atlas watchlist or persistent evidence assumptions until a standalone Aura need is proven.
- No automatic assessment claims from parser output.

## What To Document First In Aura

- input contract
- output contract
- parser warnings
- deterministic fixture expectations
- what counts as source data
- what is observation versus assessment

## Completion Notes

This brief is enough for a new Aura chat/project to scaffold a focused standalone core while preserving the strongest Atlas engineering lessons.

## Related Documents

- `docs/audits/audit-2026-05-22-overseer-runtime-handover-and-core-clone-readiness.md`
- `docs/tenets/tenets.md`
- `docs/gap/complete/background-worker-execution.md`
- `docs/gap/complete/ipc-service-contract.md`
- `src/main/services/taskRunner.js`
- `src/main/services/messageTaxonomy.js`
- `src/main/api/httpClient.js`
