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
| Operator Investigation Desk | `docs/roadmap/operator-investigation-desk.md` | Closed | First-pass Investigation Desk accepted; future story/record/region work requires new milestone decisions. |
| Local Alpha Trial Readiness | `docs/audits/audit-2026-05-24-local-alpha-readiness-closure.md` | Closed | Readiness docs, fixture path, checklist, known limits, offline rehearsal, and required verification accepted. |

## Active Milestone

Milestone: Intel Console Face And Layout Refinement
Roadmap source: `workspace/OverseerHS43-human-ui-review-face-direction.md`
Current packet: `workspace/current.md`
Current sequence: HS43 Dev runway
Latest accepted coordination artifact: `workspace/UIUXHS43-intel-console-face-layout-advisory.md`

## Durable Record Index

### Current State

- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-report-products.md`
- `docs/current-state/current-manual-discovery-lane.md`
- `docs/current-state/current-terminology-and-retention.md`

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
- operator investigation desk closure: `docs/audits/audit-2026-05-24-operator-investigation-desk-closure.md`
- local alpha readiness closure: `docs/audits/audit-2026-05-24-local-alpha-readiness-closure.md`
- local alpha human UI trial: `docs/audits/audit-2026-05-24-local-alpha-human-ui-trial.md`
- operator investigation desk roadmap: `docs/roadmap/operator-investigation-desk.md`

### Historical Archives

- `docs/archive/deprecated-gap-workflow-2026-05-23/`
- `docs/audits/`
- `workspace/archive/` legacy packet archive if present
- `workspace/critical/` active critical terms/assets reference material

### Shared Coordination Authority

- `F:\Projects\Docs\Aura-Agent-Coordination\workspace-structure-authority.md`
- `F:\Projects\Docs\Aura-Agent-Coordination\roles\README.md`
- `F:\Projects\Docs\Aura-Agent-Coordination\roles\[role]\README.md`
- `F:\Projects\Docs\Aura-Agent-Coordination\roles\[role]\prompt.md`

## Open Questions

- Human HS41 UI review accepted the direction and requested face/layout refinement: search-first Discovery, no duplicated Discovery/Watch controls, compact External API state, and progressive Observation/Assessment.
- Command/effect authority hardening accepted for the current local Electron trust boundary; renderer Intel Console work continues as a bounded Dev runway.
- Presentation authority clarification: Atlas owns backend/bridge semantics; Labs or a dedicated presentation layer may later replace/finalize UI presentation after structure cleanup.
- Live smoke evidence remains optional, explicit, and gated unless a future milestone makes it an acceptance gate.
- Accepted UX requirement from the closed Operator Investigation Desk milestone: Marked means operator interest / tag / record attention; Watch means active routine check behavior; Watch implies Marked, but Marked does not imply Watch.
- Operator Investigation Desk naming decisions remain open before broad UI implementation.
