# AURA Atlas Workspace Overview

Status: Active
Last reviewed: 2026-05-24

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
| Aggressive Testing And Operator Bug Hunting | `docs/audits/audit-2026-05-23-aggressive-testing-closure.md` | Closed | Non-live runway accepted; live success smoke remains gated future work. |
| Operator Investigation Desk | `docs/roadmap/operator-investigation-desk.md` | Active | Build an operator-facing investigation desk while preserving evidence boundaries and safe service controls. |
| Local Alpha Trial Readiness | `docs/roadmap/local-alpha-trial-readiness.md` | Planned / Related | Operator readiness remains dependent on bug-hunt confidence. |

## Active Milestone

Milestone: Operator Investigation Desk
Roadmap source: `docs/roadmap/operator-investigation-desk.md`
Current packet: `workspace/current.md`
Current sequence: HS24
Latest accepted handshake: `workspace/DevHS22-operator-investigation-evidence-detail.md`

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
- aggressive testing closure: `docs/audits/audit-2026-05-23-aggressive-testing-closure.md`
- operator investigation desk roadmap: `docs/roadmap/operator-investigation-desk.md`

### Historical Archives

- `docs/archive/deprecated-gap-workflow-2026-05-23/`
- `docs/audits/`
- `workspace/archive/` legacy packet archive if present

### Shared Coordination Authority

- `F:\Projects\Docs\Aura-Agent-Coordination\workspace-structure-authority.md`
- `F:\Projects\Docs\Aura-Agent-Coordination\roles\README.md`
- `F:\Projects\Docs\Aura-Agent-Coordination\roles\[role]\README.md`
- `F:\Projects\Docs\Aura-Agent-Coordination\roles\[role]\prompt.md`

## Open Questions

- Should live smoke evidence remain in runbooks/audits, or be represented as a milestone acceptance gate?
- Accepted future UX requirement from `workspace/ProjectPlannerHS06-operator-investigation-ux.md`: Marked means operator interest / tag / record attention; Watch means active routine check behavior; Watch implies Marked, but Marked does not imply Watch.
- Operator Investigation Desk naming decisions remain open before broad UI implementation.
