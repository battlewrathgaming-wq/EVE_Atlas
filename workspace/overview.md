# AURA Atlas Workspace Overview

Status: Active
Last reviewed: 2026-05-25

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

Milestone: Retention / Deletion Execution Boundary
Roadmap source: Human retention/deletion direction accepted on 2026-05-25
Current packet: `workspace/current.md`
Current sequence: HS58 retention/deletion boundary hardening accepted; Atlas idle
Latest accepted coordination artifact: `workspace/DevHS58-retention-deletion-execution-boundary.md`
Display workflow support: `workspace/display_inventory.md`, `workspace/DisplayInventoryAuditHS49-ingest-to-userdisplay.md`, `workspace/request_display.md`, `workspace/display-request-workflow-hardening-contract.md`, `workspace/RequestDisplayHS50-atlas-initial-display-requests.md`, `workspace/DisplayResponseHS51-atlas-lab-m24-response-relay.md`
Runtime/record integrity design input: `workspace/OverseerHS52-runtime-record-integrity-design-input.md`
Watch recovery/offline readout scope: `workspace/OverseerHS54-watch-recovery-offline-readout-scope.md`
Watch recovery/offline readout audit: `workspace/OverseerHS55-watch-recovery-offline-readout-audit.md`
Watch_offline aggregation ADR: `docs/adr/ADR-0005-watch-offline-readout-aggregation.md`

## Durable Record Index

### Current State

- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-report-products.md`
- `docs/current-state/current-manual-discovery-lane.md`
- `docs/current-state/current-terminology-and-retention.md`
- `docs/current-state/current-display-inventory.md`

### Roadmap And Runbooks

- `docs/roadmap/`
- `docs/runbooks/`
- `docs/runbooks/lab-display-request-workflow.md`

### Contracts And Doctrine

- `docs/adr/`
- `docs/contracts/` if present
- `docs/features/`
- `docs/features/display-boundary-principles.md`
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

- Human concept-render direction accepted the Atlas Overview Face as atmosphere, hierarchy, and interaction intent, not pixel-perfect specification or terminology authority.
- User-facing display inventory is now staged as a short-term product/workflow tool before further declutter or Lab display requests.
- HS49 completed the first advisory ingest -> transformation -> bridge -> user display extraction pass.
- Lab M24 answered Atlas HS50 display requests; HS51 closes the response relay as material-production scope, not Atlas adoption or Dev authorization.
- Runtime/connection and record manipulation/storage efficacy audit is accepted; future packets should stay bounded and selected by Human/Overseer.
- Watch recovery/offline readout audit is accepted; HS56 added bounded read-only `Watch_offline` readout support before later read/write hardening.
- HS57 accepted the first read/write hardening slice at the Queue -> API request -> Evidence write boundary; no production defect was found, and a focused offline verifier now guards the boundary.
- HS58 accepted the retention/deletion boundary: production deletion remains deferred, preflight stays read-only, and footprint is optional historical-interest metadata that must not override explicit deletion or preserve raw Evidence.
- Storage-location/file-selector authority is parked as future infrastructure for heavy Atlas records, backups, exports, snapshots, or cache paths; Sense work may inform it but does not define Atlas storage semantics.
- `Watch_offline` is the accepted working name for the post-restart/offline Watch readout line; avoid `Watcher` unless later approved as presentation-only language.
- Human HS41 UI review accepted the direction and requested face/layout refinement: search-first Discovery, no duplicated Discovery/Watch controls, compact External API state, and progressive Observation/Assessment.
- Command/effect authority hardening accepted for the current local Electron trust boundary; renderer Intel Console work continues as a bounded Dev runway.
- Presentation authority clarification: Atlas owns backend/bridge semantics; Labs or a dedicated presentation layer may later replace/finalize UI presentation after structure cleanup.
- Live smoke evidence remains optional, explicit, and gated unless a future milestone makes it an acceptance gate.
- Accepted UX requirement from the closed Operator Investigation Desk milestone: Marked means operator interest / tag / record attention; Watch means active routine check behavior; Watch implies Marked, but Marked does not imply Watch.
- Operator Investigation Desk naming decisions remain open before broad UI implementation.
