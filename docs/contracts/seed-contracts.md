# Contracts

Purpose:
Define stable system contracts, ownership boundaries, and architectural invariants.

Contracts answer:

> What rules must remain true?

Contracts are more binding than research or current-state notes. They should change carefully and intentionally.

## What Contracts Are For

Contracts help prevent:

- duplicated ownership
- renderer-state pollution
- evidence mutation
- abstraction collapse
- inconsistent event structures
- accidental API overreach
- report scope/provenance confusion
- metadata becoming evidence

## AURA Atlas Contract Areas

Contracts should reflect actual project work products and worker/service boundaries.

Recommended contract documents:

- `evidence-pipeline-contract.md`
- `zkill-esi-interaction-contract.md`
- `system-radius-collector-contract.md`
- `metadata-hydration-contract.md`
- `report-scope-contract.md`
- `activity-event-contract.md`
- `sde-lookup-contract.md`
- `runtime-storage-contract.md`

## Existing Worker/Service Boundaries To Capture

Current implementation includes worker-like/service modules that should have contracts.

### System Radius Collector

Rules to preserve:

- consume planner output
- query zKill for discovery refs only
- dedupe refs globally by `killmail_id`
- skip cached killmails before expansion
- apply global expansion cap after cache skip
- expand only selected refs via ESI
- persist evidence packages idempotently
- report discovered/cached/attempted/skipped/failed counts

### Killmail Ingestion / Normalization

Rules to preserve:

- raw expanded ESI payload is evidence
- raw payload must not be silently replaced
- activity events are derived from expanded killmail victim/attackers
- event key is `killmail_id:role:entity_type:entity_id`
- normalization must be idempotent
- warnings should be recorded, not hidden

### Metadata Hydration

Rules to preserve:

- hydrate report-relevant entities only
- do not hydrate every ID in the database by default
- do not use live ESI for static ship/type metadata when local SDE exists
- names are labels, IDs are facts
- patched display fields are cached labels, not evidence mutation

### Reports

Rules to preserve:

- evidence reports scope by stored evidence, not collection method
- run reports explain collection provenance
- observation reports may highlight patterns but must not prove intent
- reports must show evidence window and sample size

### SDE Lookup

Rules to preserve:

- SDE zip is import material, not runtime lookup material
- runtime reports query SQLite lookup tables
- topology and type metadata are lookup metadata, not activity evidence

## Contract Document Style

Each contract should include:

- purpose
- owner/module boundary
- inputs
- outputs
- invariants
- must not do
- verification scripts
- related tenets/schemas/ADRs

