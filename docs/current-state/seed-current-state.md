# Current-State

Purpose:
Document what AURA Atlas actually implements today.

This folder is authoritative for implementation-grounded reality:

- current architecture
- implemented workers/services
- active data pipelines
- current database behavior
- current reports
- current runtime/storage behavior
- current ownership boundaries

This folder is not for:

- aspirational design
- roadmap planning
- theoretical architecture
- product philosophy
- future assessment ideas

Documents here should answer:

> What currently exists?

## Current AURA Atlas Areas To Capture

Useful current-state documents include:

- `current-architecture.md`
- `current-database-and-migrations.md`
- `current-evidence-pipeline.md`
- `current-sde-imports.md`
- `current-system-radius-collector.md`
- `current-reports.md`
- `current-metadata-hydration.md`
- `current-live-gates-and-storage-paths.md`
- `current-ipc-ui-preparation.md`

## Known Implemented Building Blocks

At the time this seed was aligned, AURA Atlas includes:

- SQLite schema and migration handling
- runtime DB path handling with F: project storage rules
- SDE JSONL topology import
- SDE inventory metadata import
- local region/constellation/system/type lookup tables
- BFS radius planning
- zKill discovery client
- ESI expanded killmail client
- killmail normalization
- evidence repository/persistence layer
- system radius collector
- metadata report hydrator
- run/system/operator/radius reports
- verification scripts for fixture, idempotency, SDE, radius, planner, collector, reports, hydration, and metadata lookup
- shared scope validation/default helpers for CLI, future IPC, and future UI
- controlled disposable DB workflow verification
- explicit gated live smoke verification groups

## Current-State Vs Audit

Current-state docs describe how the system works now.

Audit docs inspect whether that current behavior aligns with tenets, contracts, and intended architecture.

If an implementation changes, update current-state docs.

If a review finds drift, write or update an audit.

## Style

Keep current-state documents:

- practical
- inspectable
- implementation-grounded
- linked to source files and scripts
- clear about what is implemented versus not implemented
