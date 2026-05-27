# AURA Atlas Documentation

This folder exists to keep Atlas aligned with its evidence rules while the codebase changes.

The authoritative implementation truth lives in `docs/current-state`. Audits record reviews at a point in time and should not be rewritten during normal documentation cleanup.

## Product Summary

AURA Atlas is a local-first EVE Online evidence workstation.

It stores expanded ESI killmails, derives activity events, and presents scoped evidence/observation reports. It also lets the operator create deliberate assessment artifacts from reviewed evidence.

Atlas is not:

- AURA-Sense
- a tactical HUD
- a passive broad scraper
- an AI analysis engine
- a map renderer
- a source of hidden live collection

## Documentation Roles

| Folder | Role |
| --- | --- |
| `current-state/` | What the implementation currently does. |
| `audits/` | Reviews, handovers, and dated assessments. Do not rewrite as product copy. |
| `tenets/` | Stable rules and invariants. |
| `contracts/` | Interface, scope, and behavior contracts. |
| `features/` | Product capability definitions and boundaries. |
| `terms/` | Plain-language vocabulary for non-technical understanding. |
| `schemas/` | Data shapes and persistence semantics. |
| `adr/` | Accepted architecture decisions. |
| `failures/` | Bugs and failure classes worth preserving. |
| `roadmap/` | Future-facing milestone direction. |
| `archive/deprecated-gap-workflow-2026-05-23/` | Historical archive of the former gap task-file workflow. Not active execution. |
| `runbooks/` | Operator and release procedures. |
| `research/` | Non-authoritative investigation notes. |
| `statements/` | Operational doctrine that is broader than one implementation slice. |
| `templates/` | Reusable document templates. |

## Core Rules To Preserve

- zKillboard is discovery only.
- Expanded ESI killmails are evidence.
- IDs are facts; names are labels.
- Discovery refs are possible evidence until expanded.
- UI presents and slices evidence; UI is not authority.
- Reports must state scope, sample basis, and uncertainty.
- Assessments are deliberate operator memory, not evidence.
- SDE source files are import material; SQLite lookup tables are runtime metadata.
- Live APIs require explicit gates and narrow scopes.
- Passive views must not collect evidence.

## When To Update Docs

Update docs when the meaning changes:

- new evidence rule
- new scope/contract
- new feature boundary
- new data shape
- new failure lesson
- new milestone direction
- current-state implementation drift

Do not create docs just because normal implementation changed. For normal code slices, tests and final handoff are enough unless the change alters doctrine, contracts, or product meaning.

## Current Navigation

Start here:

- `README.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-display-inventory.md`
- `docs/features/observation-lookup-model.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/r-scanner-sequencer-presentation.md`
- `docs/tenets/tenets.md`
- `workspace/overview.md`

For local alpha:

- `docs/runbooks/local-alpha-trial.md`
- `docs/runbooks/local-alpha-known-limits-and-feedback.md`

For current testing work, use `workspace/current.md` as the executable packet. Milestone context lives in:

- `docs/audits/audit-2026-05-23-aggressive-testing-and-bug-hunt-assessment.md`
- `workspace/overview.md`

## Deprecated Gap Workflow

The former docs/gap/to-do and docs/gap/complete task files were moved to docs/archive/deprecated-gap-workflow-2026-05-23/. Treat them as historical context only unless workspace/current.md explicitly references an archived file.

