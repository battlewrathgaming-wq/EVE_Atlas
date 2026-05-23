# AURA Atlas Workspace Overview

Status: Active
Last reviewed: 2026-05-23

## Vision Statement

AURA Atlas is a local-first EVE Online evidence workstation.

It stores expanded ESI killmails as evidence, keeps zKillboard as discovery only, supports scoped operator workflows, and preserves reviewable evidence/assessment boundaries without hidden live collection.

## Coordination Model

- `workspace/current.md` is the only active executable work packet.
- Roadmap and current-state docs define durable product meaning.
- Handshake files in `workspace/` are active-milestone transaction notes.
- Completed milestone handshakes move in batch to `workspace/complete/milestone-XX/`.
- Former `docs/gap` task files are archived historical context only.

## Milestone Plan

| Milestone | Roadmap Source | Status | Notes |
| --- | --- | --- | --- |
| Aggressive Testing And Operator Bug Hunting | `docs/audits/audit-2026-05-23-aggressive-testing-and-bug-hunt-assessment.md` | Active | Attack bad inputs, operator paths, concurrency, live gates, and scale pressure before local alpha stability claims. |
| Local Alpha Trial Readiness | `docs/roadmap/local-alpha-trial-readiness.md` | Planned / Related | Operator readiness remains dependent on bug-hunt confidence. |

## Active Milestone

Milestone: Aggressive Testing And Operator Bug Hunting
Roadmap source: `docs/audits/audit-2026-05-23-aggressive-testing-and-bug-hunt-assessment.md`
Current packet: `workspace/current.md`
Current sequence: HS01
Latest accepted handshake: None under the new workspace handshake sequence

## Durable Record Index

### Current State

- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-report-products.md`
- `docs/current-state/current-manual-discovery-lane.md`

### Roadmap And Runbooks

- `docs/roadmap/`
- `docs/runbooks/`

### Contracts And Doctrine

- `docs/adr/`
- `docs/contracts/` if present
- `docs/features/`
- `docs/statements/`
- `docs/terms/`
- `docs/schemas/`

### Verification

- `package.json`
- aggressive testing assessment: `docs/audits/audit-2026-05-23-aggressive-testing-and-bug-hunt-assessment.md`

### Historical Archives

- `docs/archive/deprecated-gap-workflow-2026-05-23/`
- `docs/audits/`
- `workspace/archive/` legacy packet archive if present

### Shared Coordination Authority

- `F:\Projects\Docs\Aura-Agent-Coordination\workspace-structure-authority.md`
- `F:\Projects\Docs\Aura-Agent-Coordination\relay\role-prompts.md`

## Open Questions

- Which aggressive testing slice should be completed before local alpha can resume?
- Should live smoke evidence remain in runbooks/audits, or be represented as a milestone acceptance gate?
