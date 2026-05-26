# AURA Atlas Workspace Overview

Status: Active
Last reviewed: 2026-05-26

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

Milestone: Atlas Storage And Runtime Hardening
Roadmap source: Human storage/runtime hardening direction accepted on 2026-05-25
Current packet: `workspace/current.md`
Current sequence: HS95 captured Observation lookup product direction; no implementation runway is open
Latest accepted coordination artifact: `workspace/OverseerHS95-observation-lookup-product-note.md`
Latest advisory artifact: `workspace/UIUXHS84-watch-recovery-readout-interpretation.md`
Latest advisory runway: `workspace/OverseerHS84-watch-recovery-readout-interpretation-runway.md`
Latest display request: `workspace/RequestDisplayHS86-r-scanner-powered-down-console.md`
Latest display response: `workspace/DisplayResponseHS86-atlas-r-scanner-powered-down-console.md`
Latest advisory request: `workspace/OverseerHS81-watch-recovery-systems-design-request.md`
Display workflow support: `workspace/display_inventory.md`, `workspace/DisplayInventoryAuditHS49-ingest-to-userdisplay.md`, `workspace/request_display.md`, `workspace/display-request-workflow-hardening-contract.md`, `workspace/RequestDisplayHS50-atlas-initial-display-requests.md`, `workspace/DisplayResponseHS51-atlas-lab-m24-response-relay.md`
Runtime/record integrity design input: `workspace/OverseerHS52-runtime-record-integrity-design-input.md`
Watch recovery/offline readout scope: `workspace/OverseerHS54-watch-recovery-offline-readout-scope.md`
Watch recovery/offline readout audit: `workspace/OverseerHS55-watch-recovery-offline-readout-audit.md`
Watch_offline aggregation ADR: `docs/adr/ADR-0005-watch-offline-readout-aggregation.md`
Storage/runtime hardening state: `docs/current-state/current-storage-runtime-hardening.md`
R-Scanner / Sequencer presentation: `docs/features/r-scanner-sequencer-presentation.md`
Observation lookup model: `docs/features/observation-lookup-model.md`

## Durable Record Index

### Current State

- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-report-products.md`
- `docs/current-state/current-manual-discovery-lane.md`
- `docs/current-state/current-terminology-and-retention.md`
- `docs/current-state/current-display-inventory.md`
- `docs/current-state/current-storage-runtime-hardening.md`

### Roadmap And Runbooks

- `docs/roadmap/`
- `docs/runbooks/`
- `docs/runbooks/lab-display-request-workflow.md`

### Contracts And Doctrine

- `docs/adr/`
- `docs/contracts/` if present
- `docs/features/`
- `docs/features/display-boundary-principles.md`
- `docs/features/observation-lookup-model.md`
- `docs/features/r-scanner-sequencer-presentation.md`
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
- HS59 opens the Atlas Storage And Runtime Hardening milestone with a bounded Dev packet for storage/runtime read-write boundary mapping and offline verification across queue/API request logging, Evidence persistence, restart recovery, retention preflight, and runtime snapshots.
- HS59 accepted the storage/runtime read-write boundary map; HS60 now focuses on runtime observability/readout clarity for partial success, restart state, durable/volatile state, and support artifact classification.
- HS60 accepted the runtime boundary section in operator debug trace packs; HS61 now focuses on exposing that status through an existing compact report/support response without renderer redesign or storage contract expansion.
- HS61 accepted compact `runtime_boundary` status in `app.readiness`; HS62 now focuses on partial-success status in one existing report/readout surface using existing fetch run, API log, warning, and queue records.
- HS62 accepted compact `partial_success` status in `report.corpus_health`; the storage/runtime hardening lane is resting with clean body snapshot readiness, deletion policy, storage-location authority, and queue stale/expiration policy parked for future selection.
- HS64 accepted production deletion policy design: zKill `killmail_id` is a Discovery anchor, ESI-expanded and Atlas-written `killmail_id` is the Evidence-confirmed anchor, and any future footprint must not preserve deleted Evidence in disguise.
- HS65 accepted the deletion scope and backup matrix: first production deletion should stay tightly scoped to selected Evidence-confirmed `killmail_id` records, backup/restore behavior must be accepted before execution, and no Dev deletion work is open.
- HS66 narrowed the remaining production deletion decisions: recommended first-release posture is explicit pre-delete snapshot warning, optional per-action footprint defaulting off, placeholder value labels parked, and Assessment Memory citation effects shown in preflight with explicit acknowledgement.
- HS67 accepted the deletion footprint anchor decision: if a footprint is retained, it should be `Evidence-confirmed killmail_id + pilot_id` only; custom value, rating, note, and catchment fields are rejected for deletion footprint because observations must be reproducible.
- HS68 accepted the remaining deletion policy decisions: snapshotting is acceptable for recovery with honest backup/snapshot disclosure, and Assessment Memory is mutable, disposable, quickly stale, and not Evidence.
- HS69 opens a bounded Dev runway for read-only deletion preflight refinement: encode accepted deletion policy into preflight reporting without deletion execution, schema/storage work, footprint persistence, live calls, or real DB mutation.
- HS69A corrected the deletion trust posture: retained deletion footprint is rejected; when an operator confirms deletion, Atlas should delete the selected deletable active data and only disclose snapshots/backups as separate historical support artifacts.
- HS70 accepted DevHS69: `evidence.prune_scope` preflight now reports blocked execution, no retained footprint, snapshot/backup disclosure, mutable/stale Assessment Memory context, selected Evidence row counts, and affected Assessment Memory references while remaining read-only.
- HS71 accepted Sense selector/settings hardening patterns for Atlas adaptation: main-process-owned picker, backend validation, versioned persisted settings, degraded invalid state, and no direct renderer filesystem authority.
- HS72 accepted snapshot destination and storage-budget authority before production deletion execution: operator-configured runtime snapshot/support-artifact destination and budget, visible current/projected usage, over-budget snapshot block, backend-generated filenames, degraded invalid settings, and no automatic pruning.
- HS74 accepted Queue -> API request -> Evidence write confidence hardening as verification-only: offline fixture proof now covers mixed success/failure, retry/idempotency, durable provenance/restart reconstruction, and preserved Discovery/Evidence anchors.
- HS76 design input captured Human intent for future Queue stale/expiration policy: queue refs should be treated as Watch-scheduled work items, freshness should relate to originating Watch interval/lookback, live searches should enter the priority queue instead of pulsing directly, queue policy does not affect local hydration, `ref` needs explicit definition, and uniqueness likely belongs per Watch configuration/target/time/scope.
- HS77 pauses Dev and requests systems-design review before queue stale/expiration implementation; Atlas may need a clearer provider request/work queue model before diagnostics, cadence, live-search priority, and one-active-work-item uniqueness are encoded.
- HS78 accepted the practical request-control/sequencer direction: no broad provider work queue yet; Live search stays direct/narrow with cooldown/lockout and no radius; Watch / Sequencer owns paced radius/lookback acquisition; `discovered_killmail_refs` remains returned zKill refs; waiting is not failure; local hydration is outside request-control policy.
- HS79 accepted the first-pass Live gate mechanic and opened Dev runway: per provider/action/fingerprint cooldown and rare lockout, Live radius rejection, already-running block, Watch / Sequencer planning diagnostics, no stale/expired refs, no live calls in verification, and no hydration coupling.
- HS80 accepted DevHS79: Live/manual provider request-control metadata, per-fingerprint cooldown/lockout, Live radius rejection, Watch / Sequencer diagnostics, and provider-capacity deferral are implemented; request-control state remains service-memory-only and durable restart persistence is deferred.
- HS81 bundles a systems-design advisory request to challenge whether the next architecture step should be Watch restart recovery and resumable sequencer intent instead of durable request-control counting.
- HS82 accepts the HS81 systems recommendation and opens a bounded Dev runway for read-only Watch Recovery Diagnostic And Resumable Intent Readout from existing durable state; no schema migration, broad provider queue, persisted sequencer packets, live calls, hydration coupling, or UI redesign are authorized.
- HS82 also accepts the timer-led Watch refinement: the Watch row carries durable payload intent, the timer/sequencer only decides whether due work may move or hold, and missed slots should be recoverable from expected next run time versus observed movement without exact packet replay.
- HS83 accepted DevHS82: `Watch_offline` now includes per-Watch recovery diagnostics and `next_safe_action`, distinguishing valid/missing/malformed radius scope, orphaned runs, provider deferral, missed timer slots, and pending local refs without provider calls or state mutation.
- HS84 opens a UIUX / product interpretation pass for `Watch_offline`: map recovery states and `next_safe_action` values into operator-facing status meaning before renderer implementation or more backend machinery.
- HS85 accepted UIUXHS84: future presentation may use R-Scanner as the surface and R-scan as the short action, with a powered-down central console as preferred display method; Watch and `Watch_offline` remain source/bridge terms underneath.
- HS86 created an Atlas-local Lab display request for R-Scanner powered-down console comparison; it is advisory only and does not authorize implementation or source/bridge terminology changes.
- HS87 accepted Lab's HS86 response as advisory display comparison material: Powered-Down Central Console is the preferred future method, Status Envelope With Scanner Face is the fallback, Recovery Status Rail is parked as primary, and no implementation or source/bridge terminology change is authorized.
- HS88 opens a bounded Dev packet to gather runtime evidence for existing `Watch_offline` recovery diagnostics before renderer presentation work; no live/API calls, UI work, schema migration, broad sequencer architecture, or terminology rename is authorized.
- HS89 accepted DevHS88: `verify:watch-offline-readout` now emits concrete runtime evidence JSON for unarmed restart, pending local refs, provider deferral, missed-slot recovery, orphan review, radius scope quality, and no-mutation proof; `verify:all` passed.
- HS90 documented `Watch_offline` readout keys and values as Atlas support/readout vocabulary in `workspace/critical/critical-terms.md`; shared protected-word JSON files were not edited.
- HS91 opens a bounded targeted alpha/runtime observation pass using existing `Watch_offline` readout and adjacent offline surfaces before renderer presentation work; no live/API calls, UI work, schema changes, checkpoint implementation, or terminology rename is authorized.
- HS92 accepted DevHS91: `watch.offline_readout` is the best current source model for a future renderer-only R-Scanner prototype, while queue/readiness/debug trace surfaces remain complementary support context; no implementation runway is open.
- HS93 opens a lightweight renderer-only R-Scanner prototype using `watch.offline_readout` as source model; this is not a final facelift and does not authorize backend, IPC, payload, schema, persistence, provider, scheduler, Watch semantic, Discovery ref, Evidence/EVEidence, hydration, deletion/retention, or terminology rename work.
- HS94 accepted DevHS93: the R-Scanner prototype proves the renderer display contract over `watch.offline_readout`; Atlas should answer "Do I need to do anything?", use light diagnostic rows for action-needed states, treat Sequencer/R-Scanner as patient background discovery/enrichment, keep deletion absolute with snapshot disclosure, and treat Observation as the story layer over connected records.
- HS95 captured Observation lookup product direction: Observation is a presentation/query layer that starts from anchors such as killmail ID, pilot ID, corporation ID, or system ID, then pulls connected Evidence/EVEidence, Discovery context, Assessment, hydration labels, Watch/Marked context, and provenance into an operator-facing story without creating new truth.
- HS96 consolidated workspace memory into durable docs: storage/runtime hardening state now lives in `docs/current-state/current-storage-runtime-hardening.md`, Observation lookup direction in `docs/features/observation-lookup-model.md`, and R-Scanner/Sequencer presentation direction in `docs/features/r-scanner-sequencer-presentation.md`.
- Future sequencing should keep Discovery Sequencer, Enrichment Sequencer, and Hydration separate: zKill returns Discovery refs, ESI expansion writes Evidence, and hydration repairs local readability/metadata.
- Queue batch cadence and UX pacing is parked as a future product/UX lane after evidence-write correctness; it should decide batch size, timing, throttling, External API state behavior, and operator-facing working/waiting/throttled/failed/retry states.
- Native picker/UI rigging, broader support-artifact budget coverage, active DB relocation, restore, automatic cleanup/pruning, snapshot deletion, and deletion execution remain out of scope until explicitly opened.
- Storage-location/file-selector authority remains future infrastructure for heavy Atlas records, backups, exports, snapshots, or cache paths; Sense work may inform it but does not define Atlas storage semantics.
- `Watch_offline` is the accepted working name for the post-restart/offline Watch readout line; avoid `Watcher` unless later approved as presentation-only language.
- Human HS41 UI review accepted the direction and requested face/layout refinement: search-first Discovery, no duplicated Discovery/Watch controls, compact External API state, and progressive Observation/Assessment.
- Command/effect authority hardening accepted for the current local Electron trust boundary; renderer Intel Console work continues as a bounded Dev runway.
- Presentation authority clarification: Atlas owns backend/bridge semantics; Labs or a dedicated presentation layer may later replace/finalize UI presentation after structure cleanup.
- Live smoke evidence remains optional, explicit, and gated unless a future milestone makes it an acceptance gate.
- Accepted UX requirement from the closed Operator Investigation Desk milestone: Marked means operator interest / tag / record attention; Watch means active routine check behavior; Watch implies Marked, but Marked does not imply Watch.
- Operator Investigation Desk naming decisions remain open before broad UI implementation.
