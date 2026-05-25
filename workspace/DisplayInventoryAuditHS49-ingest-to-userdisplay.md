# DisplayInventoryAuditHS49: Ingest To User Display

Status: Advisory audit
Date: 2026-05-25
Role: Product development systems auditor

## Purpose

Map currently user-facing Atlas information from ingest through transformation, bridge, and display so Atlas can decide what should remain visible, collapse, move, hide, or become a scoped `request_display` candidate.

This audit is not a Dev runway, Lab request batch, terminology rename, bridge contract, payload schema, implementation approval, or UI copy change.

## Files Reviewed

- `AGENTS.md`
- `workspace/current.md`
- `workspace/display_inventory.md`
- `workspace/request_display.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-terminology-and-retention.md`
- `docs/current-state/current-evidence-pipeline.md`
- `src/renderer/index.html`
- `src/renderer/app.js`
- `src/renderer/investigation.js`
- `src/renderer/readiness.js`
- `src/renderer/queueWatch.js`
- `src/renderer/reports.js`
- `src/renderer/actions.js`
- `src/renderer/scopes.js`
- `src/renderer/tasks.js`
- `src/main/preload.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/queueSelectionService.js`
- `src/main/services/reportResponseService.js`
- `src/main/services/appReadinessService.js`
- `src/main/reports/actorReport.js`
- `src/main/reports/radiusReport.js`
- `src/main/reports/queueReport.js`

## Audit Table

| Surface / Use Case | Ingest | Transformation | Bridge | User Display | Source Terms | Display Role | Visibility Decision | Risks / Notes | Candidate request_display? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Atlas Overview lead entry | Operator input | `scope.validate`, local SDE resolution | `scope.validate`, renderer state | Current lead, Lead Type, Check Lead | Discovery, External API, Watch | operator-intent | operator-facing | Good first-face fit; durable ID/name distinction still exposed | yes: lead disambiguation |
| Overview right rail | Readiness, reports, queue, watch, assessment list | Counts summarized in renderer | `app.readiness`, `report.*`, `queue.selection`, `watch.schedule`, `assessment.list` | Stored Evidence, Possible Leads, Watch Status, Assessment Memory | Evidence, Discovery, Watch, Assessment Memory | mixed summary | operator-facing, with detail point-of-need | Four different meaning layers share same visual weight | yes: summary stack method |
| Stored context detail | `killmails`, `activity_events` | Actor/radius report models | `report.actor`, `report.radius` | Evidence Summary, Observation Preview, Stored Context | Evidence, Observation | evidence-fact | operator-facing summary; provenance-detail | Mostly healthy; `Top 5 relevant records` says ranking is not implemented | parked: relevance display later |
| Possible Leads / queue preview | `discovered_killmail_refs` | `queue.selection` annotates refs, status, selected refs | `queue.selection`, `report.queue` | Queue Review, Queued References, Text Export | Discovery, possible leads, Enrich selected | discovery-candidate | operator-facing summary; detail point-of-need | Raw `discovered_by_type/id`, killmail hash/status/cached/expanded leak into primary queue view | yes: queue candidate display |
| Enrich selected preflight | Queue refs | `scope.validate`, `live.gate`, expected writes/calls | `manual.expansion` as task | Preflight Enrich Selected, expected ESI calls/writes | Enrich selected, Evidence | action-control | point-of-need | Necessary, but command/effect metadata is dense | yes: action preflight pattern |
| Manual Discovery actions | Operator scope input | `scope.validate`, `live.gate` | `manual.discovery` as task | Controlled Actions, normalized JSON | Discovery, External API | action-control | point-of-need | JSON normalized payload is diagnostic-like in action surface | yes: live action consent display |
| Reports / Observation | Stored evidence tables | Actor/radius report models, observation sections | `report.actor`, `report.radius` | Evidence Basis, Provenance, Observations, Warnings, Raw IDs | Evidence, Observation, provenance | evidence-fact/provenance | operator-facing plus provenance-detail | Raw IDs displayed beside warnings; should stay secondary | yes: report layering |
| Assessment Memory | Loaded actor report, operator text/scores | Citation payload, local validation on save | `assessment.create/list/get` | Create Assessment, saved artifacts/detail | Assessment Memory | assessment-judgment | operator-facing after context | Backend term `artifact` leaks in list/detail labels | yes: assessment memory display |
| Watch surface | `watchlist_entities`, actor/system watches | Scheduler/executor state | `watch.schedule`, `watch.executor.*`, `watch.create` | Watch Gates, Summary, Executor, Authoring, Schedule | Watch, Marked | runtime-state/action-control | operator-facing summary; detail point-of-need | Scheduler/runtime fields dominate; active-check implication needs careful display | yes: Watch state model |
| Readiness / Diagnostics | DB, env, SDE imports, paths | `app.readiness`, corpus health, snapshot preflight | `app.readiness`, `report.corpus_health`, `runtime.db_snapshot.*` | App Readiness, paths, SDE, API, corpus health | External API, Runtime snapshot | runtime-state/diagnostic-support | diagnostic-only, compact trust summary elsewhere | Backend configuration still visibly heavy | yes: readiness trust strip |
| Task History | Task runner memory | Task list/detail/progress/output | `task.list`, `task.get`, `task.cancel` | Task ID, type, classification, raw JSON output | task IDs, classification | diagnostic-support | diagnostic-only unless active action | Raw task payloads and classifications leak strongly | no: keep Atlas diagnostic |
| Metadata Hydration | Report raw IDs | Candidate ID extraction, live gate | `metadata.hydration` as task | Candidate IDs, expected ESI calls, normalized JSON | Refresh labels, metadata hydration | action-control/provenance | point-of-need | `Hydrate` and raw IDs are technical; boundary copy is good | parked: label-refresh display |

## Qualitative Report

Atlas now has a strong underlying boundary model, and the current renderer often states that model explicitly. The issue is no longer that the UI forgets the boundaries. The issue is that it repeats many boundary, provenance, runtime, and diagnostic facts at the same visual level as operator intent. This makes the interface feel safer but also heavier than the task requires.

The Atlas Overview is the healthiest current direction because it starts from the operator's question: who or where are we investigating? That surface should remain the primary operator-intent layer. The lead input, local-first source strip, and action routing are useful because they preserve the distinction between typing, checking local scope, discovering possible leads, enriching evidence, observing stored evidence, and saving assessment memory.

The right rail is valuable but overloaded. Stored Evidence, Possible Leads, Watch Status, and Assessment Memory are not the same kind of information. They are evidence summary, discovery staging, runtime/action state, and judgment state. They can sit together as a navigation/status stack, but they should not all be equally verbose or equally urgent. The current rail is a good candidate for Lab comparison because it needs a display method, not a source-term change.

The strongest source/display boundary is Evidence versus Discovery. Atlas preserves it in copy and service behavior, but the queue surfaces still expose backend-shaped queue details that make possible leads feel technical rather than investigable. The safest future display improvement is to keep queued refs as possible leads while reducing raw fields like `discovered_by_type`, `discovered_by_id`, hashes, cached/expanded statuses, and normalized JSON to detail/provenance layers.

The Watch surface has a similar problem. Atlas correctly preserves Watch as active routine checking and Marked as attention only, but the visible scheduler/executor fields make the surface read like a runtime console. Watch probably needs a compact operator state model: configured, blocked, due, armed, running, last checked, and why blocked. Executor internals, active task IDs, poll milliseconds, and last tick details should remain available for diagnostics.

Readiness is valid and important, but it should mostly be a trust/status support layer rather than a destination that dominates early experience. Local DB paths, SDE import details, lookup counts, API user-agent, runtime snapshot paths, WAL/SHM state, and debug trace pack details are excellent diagnostic facts. They are poor first-story facts. The overview should get a compact readiness/trust affordance; the full readiness view can remain diagnostic.

Reports are comparatively well structured because Evidence Basis, Collection Provenance, Observations, Warnings, and Raw IDs are separated. The remaining display risk is visual parity: Raw IDs and warnings appear beside interpretive sections, which can make support/provenance data feel equally important. A future display pass should keep Evidence Basis and Observation readable first, then disclose provenance and raw IDs when the operator needs auditability or disambiguation.

Assessment Memory is conceptually strong. It clearly remains deliberate saved operator judgment, not evidence. The main leak is the backend term `artifact` in list/detail surfaces. This is not a contract problem by itself; it is a display-language issue. Atlas should preserve `assessment_artifact` internally while using Assessment Memory at the primary interface layer.

Task History should remain Atlas-owned diagnostics, not a Lab display priority. It is intentionally close to runtime reality: task IDs, classifications, progress events, raw result/error JSON, and cancellation state. This is useful for support and verification. It should not become part of the primary investigation story unless a task is actively blocking an operator action.

## Top 5 Display Overload Causes

1. Runtime/service metadata appears as primary UI content: task IDs, classifications, raw JSON, path state, command names.
2. Evidence, Discovery, Watch, Assessment, provenance, and diagnostics share the same panel/card visual hierarchy.
3. Raw IDs and backend keys are useful but too prominent outside disambiguation/provenance contexts.
4. Readiness and SDE/API diagnostics are product-critical but currently read like backend setup.
5. Queue/watch surfaces mix candidate review, live action preflight, scheduler state, and support diagnostics.

## Top 5 Safest Lab Display Candidates

1. Atlas Overview right-rail summary stack.
2. Possible Leads / Queue Review display.
3. External API / local-first trust affordance.
4. Watch state display: Marked versus Watch, armed/due/blocked.
5. Evidence report layering: basis, observation, provenance, raw IDs.

## Source-Owned Terms To Preserve

- `Evidence`
- `Discovery`
- `Observation`
- `Assessment Memory`
- `Marked`
- `Watch`
- `Enrich selected`
- `Refresh labels`
- `Expanded ESI killmail`
- `External API`
- `Discovery -> Evidence -> Observation -> Assessment`

## Surfaces That Should Stay Atlas / Source-Project Owned

- Bridge/service command names, effect classifications, and confirmation authority.
- IPC contract and renderer eligibility.
- Evidence, Discovery, Watch, Marked, Observation, Assessment Memory meanings.
- Report model semantics and structured response meanings.
- Queue selection meaning and evidence-boundary status.
- Live/API gate meaning and refusal behavior.
- Task authority and cancellation behavior.
- Persistence/schema terms and internal table names.
- Runtime snapshot and support/debug trace pack semantics.

## Parked Or Unknown Items

- Whether `Atlas Overview` becomes the durable primary navigation label or remains prototype presentation.
- Whether `External API` remains preserve-exact or later becomes Lab-translatable after preserving gate meaning.
- Final naming for `Record`, `Intelligence`, and `Finding`.
- zKill paste support display, because current safe support would require new backend/service parsing behavior.
- `Top 5 relevant records`, because relevance ranking is not implemented in the current renderer slice.
- Area-context Assessment Memory for radius/system reports.
- Long-term shape for retention/destructive preflight display, because deletion remains blocked and not an active product capability.

