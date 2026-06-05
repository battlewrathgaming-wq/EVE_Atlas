# Engineering / Data Engineering / Security Advisory

## HS286 User Input -> Fetch -> Selected Resolution Missing Links

Date: 2026-06-05

Role: Engineering / Data Engineering / Security advisory reviewer

Status: Advisory only. No implementation authorization.

## 1. Executive Recommendation

Atlas has a coherent backend evidence path for user-led acquisition:

Discovery refs -> selected ESI Evidence Expansion -> durable Evidence/EVEidence -> local report/Observation construction -> local readability reuse.

The selected-ID Resolve seam is also real as a trusted, non-renderer product command for one unresolved local ID, but the full operator workflow is not yet product-complete. The richest missing-link surface is the product handoff from a loaded report/corpus presentation to one selected unresolved ID, then back to local report construction after Resolve.

Recommendation: do not open broad Hydration, Bucket, Dispatcher, worker, schema, or UI behavior from this review. The next useful proof should be a read-only, local-only selected-ID Resolve candidate / report handoff surface that proves:

- which unresolved IDs are visible from local Observation/report output;
- which ID has strong local basis for one-ID Resolve;
- whether the label is already locally known;
- what report/corpus context would be refreshed after a successful Resolve;
- that report-wide or multi-ID Hydration is not being used as the product path.

Smallest safe Dev packet exists only if Overseer chooses to move: a read-only preview/proof of this report-to-one-ID Resolve handoff. It should not call providers, write metadata, add queueing, or add renderer execution.

## 2. Current Implemented Pipeline Map

### Operator Input To Discovery / Fetch Intent

Implemented product behavior:

- `manual.discovery` is a renderer-eligible service command with confirmation authority, live API effect classification, and local mutation effect for Discovery refs.
- `runManualDiscoveryService` normalizes manual discovery input, checks the live/provider gate, and calls the manual discovery worker.
- `manualDiscoveryWorker` writes discovered killmail refs as possible leads and explicitly does not perform ESI expansion.
- Renderer `actions.js` invokes `manual.discovery` through the service bridge.

Source:

- `src/main/services/serviceRegistry.js`
- `src/main/services/mutatingActionService.js`
- `src/main/workers/manualDiscoveryWorker.js`
- `src/renderer/actions.js`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/contracts/discovery-queue-contract.md`

Classification: implemented product backend and renderer command path. Live provider execution was not run in this review.

### Discovery Refs To Selected Evidence Expansion

Implemented product behavior:

- `queue.selection` is a renderer-eligible read-only preview of queued refs selected for explicit ESI expansion.
- `manual.expansion` is a renderer-eligible service command with confirmation authority and Evidence creation classification.
- Renderer `queueWatch.js` performs queue preview, live gate preflight, selected killmail extraction, confirmation, and service invocation of `manual.expansion`.
- `manualExpansionWorker` selects queued refs, calls ESI expansion through `buildEvidencePackageFromRefs`, persists successful Evidence packages, and marks refs expanded, cached, or failed.

Source:

- `src/main/services/serviceRegistry.js`
- `src/main/services/queueSelectionService.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/db/evidenceRepository.js`
- `src/renderer/queueWatch.js`
- `docs/contracts/expansion-selection-contract.md`

Classification: implemented product backend and renderer command path. The selection preview is read-only and not a reservation.

### Evidence/EVEidence Write To Raw-ID Observation / Report Construction

Implemented product behavior:

- Evidence packages are persisted transactionally to `killmails`, `activity_events`, entity updates, ingestion audits, and warnings.
- Reports build local Observation/readout from stored killmails and activity events.
- Actor and radius reports return structured evidence basis, provenance, observations, warnings, and raw IDs.
- Corporation, system, operator, queue, and corpus reports exist as local read-only presentations, though not all have the same structured response shape.

Source:

- `src/main/db/evidenceRepository.js`
- `src/main/reports/reportUtils.js`
- `src/main/reports/actorReport.js`
- `src/main/reports/radiusReport.js`
- `src/main/reports/corporationObservationReport.js`
- `src/main/reports/systemReport.js`
- `src/main/reports/operatorReport.js`
- `src/main/reports/queueReport.js`
- `src/main/services/reportResponseService.js`
- `docs/features/data-layer-boundaries.md`
- `docs/current-state/current-evidence-pipeline.md`

Classification: implemented product local reporting. Relationship/corpus presentation is report-derived Observation, not a durable relationship model.

### Raw-ID Local Readability Lookup During Report Construction

Implemented product behavior:

- Reports use local `entities`, `activity_events` label columns, SDE/type metadata, and solar-system metadata when available.
- Renderer report views expose unresolved labels as `[Resolve with ESI]` and show raw IDs.
- Local readability is part of report construction and does not itself authorize provider Hydration.

Source:

- `src/main/reports/actorReport.js`
- `src/main/reports/radiusReport.js`
- `src/main/reports/reportUtils.js`
- `src/renderer/reports.js`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/selected-id-readability-repair.md`

Classification: implemented product local lookup. The source proves local reuse, but not a complete selected-ID Resolve user workflow.

### Explicit Selected-ID Resolve To Provider-Backed Hydration / Readability Repair

Implemented product behavior:

- `metadata.selected_id_readability_repair.product_preflight` is renderer-eligible, read-only, and performs product preflight without provider calls or writes.
- `metadata.selected_id_readability_repair.execute` is trusted non-renderer only, authority-gated, and explicitly repairs one selected unresolved local ID.
- Execution validates operator act, Resolve intent, local-first preflight, External I/O/live gates, provider response shape, selected-ID match, and local label race before writing.
- Allowed writes are metadata run/audit state, selected `entities`, and matching `activity_events` readability label columns.

Source:

- `src/main/services/serviceRegistry.js`
- `src/main/services/selectedIdReadabilityRepairProductPreflightService.js`
- `src/main/services/selectedIdReadabilityRepairExecutionService.js`
- `src/main/metadata/reportHydrator.js`
- `workspace/DevHS284-selected-id-readability-repair-execution.md`
- `workspace/OverseerHS285-hs284-selected-id-readability-repair-execution-review.md`
- `docs/features/selected-id-readability-repair.md`

Classification: implemented trusted backend product command. Renderer execution and UI confirmation remain parked. Live/API execution was not proven in this review.

### Selected Resolution Result Back Into Future Local Reports

Implemented product behavior:

- `applyResolvedNames` upserts selected resolved names into `entities`.
- It also patches matching `activity_events` readability label columns where local rows exist.
- Report construction reads those local labels later.

Source:

- `src/main/metadata/reportHydrator.js`
- `src/main/services/selectedIdReadabilityRepairExecutionService.js`
- `src/main/reports/actorReport.js`
- `src/main/reports/radiusReport.js`
- `src/main/reports/reportUtils.js`

Classification: implemented local reuse from source. A full post-Resolve report refresh proof for the selected-ID product path is not proven from reviewed source.

## 3. Missing Links By Path

### 1. Operator Input To Discovery / Fetch Intent

Missing link:

- "Fetch" is not a single product lifecycle. Source proves manual Discovery and manual Evidence Expansion, but not one complete operator-facing "fetch is done enough for this report" state.

Unsafe or ambiguous assumption:

- Assuming Discovery completion means Evidence is available would violate Atlas boundaries. Discovery refs remain possible leads.

Parked item:

- Any automated catch-up, dispatcher, persisted Bucket, or broad provider queue remains parked.

### 2. Discovery Refs To Selected Evidence Expansion

Missing link:

- `queue.selection` is a read-only preview. It does not reserve rows. `manual.expansion` revalidates against current local queue state at execution time.

Unsafe or ambiguous assumption:

- UI wording like "Selected For Enrich Selected" could be mistaken for durable selection. It is only a preview until `manual.expansion` runs.

Evidence strength:

- This is still a healthy design because execution reselects and dedupes from the database. The risk is operator expectation, not source integrity.

### 3. Evidence Write To Report / Observation

Missing link:

- Actor and radius responses are structured, but corpus/relationship presentation is still report-specific rather than one unified product surface.
- Relationship transformation exists as derived reporting/Observation, not as a durable relationship identity or portable data model.

Unsafe or ambiguous assumption:

- Treating repeated co-presence, observed operator rows, or computed groupings as relationship truth would overstate the evidence. Current docs require these to remain Observation unless a human Assessment is made later.

### 4. Raw-ID Local Readability Lookup

Missing link:

- The report surface exposes raw IDs and `[Resolve with ESI]` labels, but the reviewed source does not prove a selected-ID picker that binds one unresolved ID, its local basis, and its intended Resolve request into the newer selected-ID Resolve command.

Unsafe or ambiguous assumption:

- Treating "focus" or "visible in report" as a provider request would violate the accepted Hydration boundary. Focus is not request.

### 5. Explicit Selected-ID Resolve

Missing link:

- The selected-ID execution command is not renderer eligible. That is intentional, but it means the product surface for completing the user act is not present yet.
- The older renderer `metadata.hydration` flow still exists and can hydrate report-scoped candidates. That is not the same as the selected-ID Resolve contract.

Unsafe or ambiguous assumption:

- Assuming existing broad/report-scoped Hydration is the selected-ID product path would blur current HS284/HS285 acceptance.

### 6. Resolve Result Back Into Future Reports

Missing link:

- Source proves local label writes and report lookup, but not an end-to-end accepted proof that one selected Resolve result returns to the exact report/corpus presentation that produced the unresolved ID.

Evidence expected:

- A local-only verifier or preview should demonstrate before/after report construction using seeded local data and no provider call.

## 4. Product-Ready Vs Posture-Only Vs Proof-Only Vs Parked

Product-ready from reviewed source:

- Manual Discovery command and worker path, subject to live gates.
- Manual Expansion command and worker path, subject to live gates.
- Queue selection preview as read-only preview only.
- Durable Evidence write through `persistEvidencePackage`.
- Local report construction from stored Evidence/EVEidence.
- Local readability lookup during report construction.
- Trusted non-renderer selected-ID Resolve execution command.
- Local label reuse after Resolve writes.

Posture/readout only:

- Queue/clock posture and patient packet identity readouts.
- Hydration backlog/request posture previews.
- Product selected-ID preflight, when treated as preview only.
- Live/readiness/gate readouts before a command executes.

Proof/fixture only:

- HS276-style proof flags, fixed IDs, seeded temporary stores, proof commands, and verifier-only rows.
- HS284 verification proves command behavior under controlled/injected conditions; it does not prove live provider behavior.

Parked:

- Renderer-triggered selected-ID Resolve execution.
- New UI behavior.
- Broad provider queue, Bucket, Dispatcher, worker lanes, leases, retries, persisted queues.
- Runtime enforcement or command blocking.
- Schema changes.
- Support artifacts.
- Background/report-wide Hydration as the product Resolve path.
- Durable relationship model.
- Fourth lane reopening.

## 5. Ambiguous Or Risky Terminology

`fetch`

- Risk: could mean zKill Discovery, ESI Evidence Expansion, Hydration, or full user workflow completion.
- Safer wording: `Discovery fetch`, `Evidence Expansion`, or `report-ready local sample`.

`selected`

- Risk: `selected_for_expansion` in a preview can sound like a durable reservation.
- Safer wording: `preview-selected` or `eligible for explicit expansion`.

`Resolve`

- Risk: could be confused with broad Metadata Hydration.
- Safer wording: `Resolve one selected unresolved local ID` for the user act; `Hydration/readability repair` for the internal lane.

`complete fetch`

- Risk: implies complete coverage. Atlas works from scoped, partial local samples.
- Safer wording: `expanded within the selected local scope` or `report-ready within this sample`.

`relationship transformation`

- Risk: sounds like durable relationship truth or Assessment.
- Safer wording: `derived relationship view`, `relationship-shaped Observation`, or `corpus relationship presentation`.

`Hydration`

- Risk: older report-scoped Hydration and newer selected-ID Resolve can blur.
- Safer wording: keep `Hydration` internal; use `Resolve` only for the explicit one-ID operator act.

## 6. Source-Backed Findings

1. Discovery is not Evidence.

- `manual.discovery` writes queued refs only.
- Discovery contract and current evidence pipeline docs preserve possible-lead semantics.
- Source: `src/main/workers/manualDiscoveryWorker.js`, `docs/contracts/discovery-queue-contract.md`, `docs/current-state/current-evidence-pipeline.md`.

2. Evidence Expansion is the Evidence-creating provider step.

- `manual.expansion` is classified as Evidence-creating and writes expanded killmail evidence.
- Source: `src/main/services/serviceRegistry.js`, `src/main/workers/manualExpansionWorker.js`, `src/main/workers/killmailIngestionWorker.js`.

3. Evidence persistence is durable and transactional.

- `persistEvidencePackage` wraps killmail, activity event, entity update, audit, and warning writes in a transaction.
- Source: `src/main/db/evidenceRepository.js`.

4. Reports are local read-only Observation surfaces.

- Report services are read-only and build from local stored evidence.
- Source: `src/main/services/serviceRegistry.js`, `src/main/services/reportResponseService.js`, `src/main/reports/actorReport.js`, `src/main/reports/radiusReport.js`.

5. Local readability is already part of report construction.

- Reports use local labels when present and expose raw IDs when labels are missing.
- Source: `src/main/reports/actorReport.js`, `src/main/reports/radiusReport.js`, `src/main/reports/reportUtils.js`, `src/renderer/reports.js`.

6. Selected-ID Resolve execution is real but not renderer eligible.

- `metadata.selected_id_readability_repair.execute` rejects renderer context and requires trusted non-renderer invocation.
- Source: `src/main/services/serviceRegistry.js`, `src/main/services/selectedIdReadabilityRepairExecutionService.js`.

7. A broader report-scoped Metadata Hydration path still exists.

- `metadata.hydration` remains renderer eligible and report scoped.
- Source: `src/main/services/serviceRegistry.js`, `src/main/metadata/reportHydrator.js`, `src/renderer/reports.js`.
- Risk: this should not be treated as the newer selected-ID Resolve product path.

8. Post-Resolve local reuse is source-backed, but end-to-end report refresh is not proven from reviewed source.

- Writes patch `entities` and `activity_events`; reports read those tables.
- The exact selected unresolved ID -> Resolve -> same report/corpus refresh proof is not proven from reviewed source.

## 7. Recommended Next Rich Surface To Explore

Recommended next rich surface:

Selected unresolved local ID -> Resolve candidate -> future report readability reuse.

This should be a local-only, read-only assurance surface. It should prove the handoff from report/corpus Observation into one selected Resolve candidate without calling providers or writing Hydration output.

Useful shape:

- Input: a loaded report or local report parameters.
- Output: unresolved entity IDs visible in the report, entity type, local evidence basis, current local label state, whether selected-ID Resolve preflight would be relevant, and which report/corpus surface would benefit after resolution.
- Boundary: no provider calls, no queueing, no bucket, no dispatcher, no writes, no UI command execution.

Why this is the richest next surface:

- Discovery and Evidence Expansion already have stronger source support.
- Selected-ID Resolve backend exists, but the user-facing selection handoff does not.
- Relationship/corpus presentation depends on readability but must not become broad Hydration.
- It directly protects the "focus is not request" boundary.

## 8. Smallest Safe Next Dev Packet, If One Exists

A smallest safe Dev packet exists only if Overseer chooses to move from advisory to bounded proof.

Suggested packet shape for Overseer consideration:

- Build a read-only selected-ID Resolve candidate preview from local report output or equivalent local query.
- Use seeded/local data only.
- Return candidate IDs, type, local evidence basis, local label status, and report/corpus context.
- Prove that no provider call, write, queue, dispatch, schema change, renderer execution, or Hydration output occurs.

Not recommended yet:

- Renderer Resolve execution.
- Live provider selected-ID Resolve.
- Report-wide Hydration changes.
- Bucket/Dispatcher design.
- Durable relationship storage.

If Overseer does not want a Dev packet yet, the next action can remain an advisory/current-state note only.

## 9. Items To Keep Parked

- Fourth lane.
- Broad provider-work queue.
- Hydration Bucket or Dispatcher.
- Automatic selected-ID pickup.
- Retry lanes or fast lane behavior.
- Runtime enforcement changes.
- Schema changes.
- Renderer-triggered selected-ID Resolve execution.
- Provider/API live tests.
- Corpus mutation beyond existing local label reuse.
- Durable relationship model.
- Assessment automation.
- Product terminology rename.

## 10. Verification Or Evidence Expected Before Implementation

Before any implementation that routes user-selected IDs to selected-ID Resolve:

- A local-only proof that report-visible unresolved IDs can be enumerated with type and basis.
- A local-only proof that a locally known label short-circuits provider need.
- A local-only proof that candidate selection does not imply provider request.
- A verifier that the selected-ID preview does not call providers or write.
- A verifier that post-Resolve local label writes are consumed by report construction.
- A negative proof that the older report-scoped `metadata.hydration` path is not used as the selected-ID product path.
- A review that relationship/corpus views remain Observation and not Evidence or Assessment.

Before live provider behavior:

- Revalidate storage lock/unlock, External I/O, live gate, cadence, confirmation authority, selected-ID basis, local label race, provider response selected-ID match, and allowed-write bounds immediately before provider contact.

## 11. Human / Overseer Decisions Needed

Human / Overseer should decide:

- Whether the next packet should be advisory-only, current-state note, or bounded read-only Dev proof.
- Whether the older renderer `metadata.hydration` report-scoped flow should remain available, be explicitly marked legacy/parked, or be separated from the selected-ID Resolve product path later.
- Whether "complete fetch" should be defined as a user-facing workflow state, and if so whether it means Discovery complete, Evidence Expansion complete within selected refs, or report-ready local sample.
- Whether relationship/corpus presentation should remain report-specific for now or receive a separate future data-model review.

No Dev runway is created by this artifact.

## Acceptance Check

- Advisory only: yes.
- No code/provider/live/schema/UI changes: yes.
- Current Atlas structures distinguished from proposed handoff language: yes.
- Discovery, Evidence/EVEidence, Hydration, Observation, and Assessment boundaries preserved: yes.
- Product-ready, posture-only, proof-only, and parked items classified: yes.
- Main missing-link surface identified: yes.
- Next action routed to Overseer: yes.
