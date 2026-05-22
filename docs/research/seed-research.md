# Research

Purpose:
Store investigation notes, external findings, experiments, and technical discoveries.

Research documents are exploratory and non-authoritative.

They answer:

> What have we discovered or explored?

## Intended Uses

This folder is appropriate for:

- ESI behavior observations
- zKill behavior observations
- SDE structure findings
- Electron experiments
- SQLite performance experiments
- report readability experiments
- metadata hydration experiments
- API rate-limit observations
- external references
- proof-of-concept notes

## AURA Atlas Research Examples

Useful research documents may include:

- `esi-rate-limit-notes.md`
- `zkill-pastseconds-behavior.md`
- `sde-jsonl-structure-notes.md`
- `sqlite-node-built-in-notes.md`
- `electron-runtime-storage-notes.md`
- `metadata-hydration-observations.md`
- `radius-watch-sampling-notes.md`

## Non-Authority Rule

Research should not define architecture directly.

Research may:

- be incomplete
- be speculative
- become outdated
- contradict later implementation
- include discarded ideas

When research becomes durable project intent, promote it into the appropriate artifact:

- major decision -> ADR
- stable rule -> Contract
- operational doctrine -> Statement
- implemented reality -> Current-state
- data shape -> Schema
- bug lesson -> Failure

## Style

Research should clearly separate:

- observed behavior
- assumptions
- open questions
- possible implications
- links/sources when relevant

