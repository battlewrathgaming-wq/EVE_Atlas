# AURA Atlas Documentation

This folder preserves AURA Atlas project memory.

These documents are not commit logs. They are capstones of development: durable reasoning artifacts that protect the project from drift as chats, contributors, and implementation details change.

The codebase should not be the only place where system intent exists.

## Documentation Purpose

AURA Atlas is an evidence-driven intelligence system. Its most important risks are not only code defects, but architectural drift:

- treating zKill summaries as truth
- letting UI state become authoritative
- confusing collection provenance with intelligence scope
- implying certainty beyond the evidence
- widening API collection beyond respectful bounds
- turning derived analytics into unrebuildable facts

The documentation library exists to preserve why the system behaves a certain way, not only how it currently works.

## Folder Map

| Folder | Purpose | Change Frequency |
| --- | --- | --- |
| `tenets/` | Foundational truths and architectural invariants | Rare |
| `statements/` | Operational doctrine and emerging philosophy | Occasional |
| `audits/` | Current-state technical understanding | As implementation changes |
| `failures/` | Preserved lessons from bugs/regressions | When lessons are learned |
| `adr/` | Architecture Decision Records | Major decisions |
| `schemas/` | Canonical data structures and interface contracts | When contracts change |
| `features/` | Product feature concepts and committed assessment artifacts | As features are shaped |
| `roadmap/` | Future-facing architecture and product direction | As strategy evolves |
| `terms/` | Plain-language explanations of project concepts | When terminology needs shared understanding |
| `templates/` | Templates for durable documentation artifacts | Rare |

## Artifact Rules

When significant architectural learning occurs, create or update a durable artifact.

- Bug fixed -> add a failure record.
- Major design choice -> add an ADR.
- New operational philosophy -> add a statement.
- New stable truth -> update tenets.
- Current implementation understanding -> update an audit.
- Stable data/interface shape -> update a schema document.
- Future direction -> update roadmap.

Good threshold:

> Would future Codex, a contributor, or a refactor risk making the wrong architectural choice without this context?

If yes, document it.

## Current Seed Documents

The original seed notes remain at the root of `docs/` as historical snapshots:

- `Tenets_revision_0.txt`
- `Statement_Statefuldocs.txt`
- `Statement_Passive feeds.txt`

New durable artifacts should use the structured folders and templates.

## Naming Conventions

Recommended patterns:

- ADR: `ADR-0001-short-title.md`
- Failure: `failure-0001-short-title.md`
- Audit: `audit-YYYY-MM-DD-short-title.md`
- Schema: `schema-name.md`
- Statement: `short-doctrine-name.md`

Use dates for audits because they describe implementation state at a point in time.

## Core Project Memory

The following concepts should remain preserved across implementation:

- zKill is discovery only.
- Expanded ESI killmails are authoritative evidence.
- IDs are facts; names are labels.
- UI presents and slices evidence; UI is not authority.
- Derived intelligence must be rebuildable.
- Collection provenance is not intelligence scope.
- Reports must carry scope, sample size, and uncertainty.
- Disposition filters do not delete evidence.
- AI is commentary, not evidence.
- SDE topology and type data are lookup metadata, not activity evidence.
- Respectful API use is a product requirement, not a nice-to-have.
