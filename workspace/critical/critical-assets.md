# Critical Assets

Purpose: list Atlas assets that should be preserved, reviewed carefully, or treated as important domain/source material.

Expanded asset list:
`F:\Projects\Docs\Aura-Project-Orchestration\critical\AURA-Atlas\critical-assets.md`

Status:
Initial local index populated from the expanded coordination list. Treat this as project-local reference material for agents; promotion into durable project truth still requires Atlas Overseer/Human acceptance.

## Critical Assets

| Asset | Type | Why It Matters | Handling Note |
| --- | --- | --- | --- |
| `workspace/current.md` | Active packet | Defines current Atlas work, guardrails, and executor. | Active execution authority. |
| `workspace/overview.md` | Workspace authority/index | Summarizes Atlas vision, current docs, terms, contracts, schemas, and verification. | Use before interpreting project terms. |
| `workspace/critical/critical-terms.md` | Critical terms | Holds local Atlas term ownership and downstream translation cautions. | Read before copy, bridge, evidence, watch, report, or Lab handoff work. |
| `workspace/OverseerHS35A-terminology-authority-correction.md` | Authority correction | Parks prior terminology audit as unaccepted advisory material. | Do not treat parked audit tables as accepted authority. |
| `workspace/OverseerHS38A-presentation-authority-note.md` | Presentation authority note | States Atlas controls backend/bridge semantics while Lab may later present after the bridge. | Critical Lab handoff boundary. |
| `docs/current-state/current-terminology-and-retention.md` | Current terminology authority | Records accepted layer model, preserve terms, and retention/deletion state. | Primary terminology source. |
| `docs/current-state/current-evidence-pipeline.md` | Evidence pipeline | Defines storage tables, collection lanes, live boundary, and deletion block. | Critical for evidence/storage/persistence meaning. |
| `docs/current-state/current-ipc-ui-preparation.md` | Bridge/UI state | Defines service bridge, renderer surfaces, and boundaries. | Critical bridge asset. |
| `docs/contracts/discovery-queue-contract.md` | Contract | Discovery Queue stores possible refs before evidence. | Preserve queue/evidence separation. |
| `docs/contracts/expansion-selection-contract.md` | Contract | ESI expansion is the evidence-creating step. | Critical for `Enrich selected`. |
| `docs/contracts/metadata-hydration-contract.md` | Contract | Metadata hydration resolves labels and does not replace evidence. | Critical for `Refresh labels`. |
| `src/main/db/schema.sql` | Persistence schema | Encodes evidence, activity, discovery, watch, assessment, provenance tables. | Internal names are Atlas-owned. |
| `src/main/preload.js` | Electron preload bridge | Exposes renderer service bridge. | Critical bridge authority surface. |
| `src/main/services/serviceRegistry.js` | Command registry | Emits command names, classifications, descriptions, and bridge-facing actions. | Command names/effects are Atlas-owned. |
| `src/main/services/queueSelectionService.js` | Queue preview service | Emits non-evidence queue preview data. | Critical for possible-leads presentation. |
| `src/main/reports/` | Report services | Backend-owned report meaning and structured responses. | Renderer/Lab may display, not recompute meaning. |
| `src/main/watchlist/` | Watch behavior | Owns Marked/Watch behavior and active checking. | Preserve Marked vs Watch asymmetry. |
| `scripts/verify-renderer-shell.js` | Renderer/bridge verification | Asserts visible safety boundaries and renderer constraints. | Critical presentation safety net. |
| `scripts/verify-evidence-rule-regressions.js` | Evidence verification | Guards evidence boundary rules. | Critical evidence terminology safety net. |
| `scripts/verify-protected-terms.js` | Terminology discovery check | Emits warning-only evidence for Atlas-owned candidates and cross-project borrowing risks. | Review output; do not treat as authority or rename mandate. |
| `package.json` | Verification manifest | Lists active verify/smoke scripts. | Use for current verification entry points. |

## Do Not Casually Change

| Asset | Reason | Required Review |
| --- | --- | --- |
| `src/main/db/schema.sql` | Table/field names encode persistence and evidence boundaries. | Atlas Overseer / Human |
| `src/main/services/serviceRegistry.js` | Bridge command names/classifications are Atlas-owned emissions. | Atlas Overseer / Human |
| `src/main/preload.js` | Defines renderer IPC/service bridge. | Atlas Overseer / Human |
| `docs/current-state/current-terminology-and-retention.md` | Accepted terminology and retention boundary source. | Atlas Overseer / Human |
| `docs/contracts/*.md` | Active behavioral contracts. | Atlas Overseer / Human |
| Evidence schema/docs and `killmails` / `activity_events` semantics | Define what can support reports and observations. | Atlas Overseer / Human |
| Watch/Marked docs and watch scheduler code | Cross-project watch wording is collision-prone. | Atlas Overseer / Human |
| Retention/compaction docs and services | Destructive terms can imply unavailable product capability. | Human / Atlas Overseer |
| Renderer and evidence verification scripts | Lock visible safety boundaries and terminology expectations. | Atlas Overseer / Human |

## Open Questions

- Which service command names, if any, should Atlas mark preserve-exact when emitted to Lab?
- Should `External API` be preserve-exact or Lab-translatable after preserving provider authority?
- How should Lab present retention/destructive preflight data without implying active deletion capability?
