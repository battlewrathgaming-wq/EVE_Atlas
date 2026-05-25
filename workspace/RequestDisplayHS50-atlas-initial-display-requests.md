# Atlas Request Display HS50 - Initial Display Requests

Date: 2026-05-25
Role: Atlas Overseer
Status: ready to submit to Aura Lab

This batch is advisory-only display intake for Aura Lab.

Atlas owns the meaning of these surfaces, source terms, data, states, runtime behavior, and final adoption. Aura Lab may compare Bridge -> Interface display methods, but must preserve Atlas terms, Atlas semantics, and the scoped boundaries below.

These requests do not authorize implementation, bridge/IPC/contract changes, backend changes, persistence changes, terminology renames, or Atlas adoption.

Active request count: 3

Parked for later request batches:
- Atlas Overview current-lead/search center.
- Stored Evidence / Provenance Drawer detail layering.
- Runtime, queue timing, SQLite/memory load, and IO hardening diagnostics.
- Point-of-need copy collapse and progressive disclosure system.

---

# request_display: Atlas - Overview Right Rail Status Stack

Status: submitted
Project: Atlas
Source owner: Atlas
Request owner: Atlas Overseer
Date: 2026-05-25
Lab intake state: not-yet-reviewed

request_display:
  id: atlas.overview.right-rail-status-stack
  project: Atlas
  status: submitted
  request_strength: pressure-test
  requester_role: Overseer
  source_owner: Atlas
  product_attachment:
    product_area: Atlas Overview
    surface: Right-side status stack
    user_task: Scan stored evidence, possible leads, watch status, and assessment memory without confusing their meanings.
    owning_milestone_or_packet: HS47 Overview Face / HS49 Display Inventory
    priority: high
    decision_needed: Compare up to three display methods for a compact right rail that preserves Atlas meaning while reducing overload.
  scope:
    boundary: One status-card family on the Atlas Overview face.
    included:
      - Stored Evidence card.
      - Possible Leads card.
      - Watch Status card.
      - Assessment Memory card.
      - Card hierarchy, route affordances, compact state wording, empty/unavailable states, and narrow/stacked behavior.
    excluded:
      - New data sources, new counts, or backend report changes.
      - New Watch, Marked, or Assessment behavior.
      - Full page redesign.
      - Contract, bridge, IPC, payload, persistence, or schema changes.
    max_candidate_methods: 3
    source_project_acceptance_needed: true
  surface_or_use_case: Atlas Overview right rail showing high-value investigation memory/status summaries.
  current_presentation: Four right-rail status cards with explanatory labels and route-like affordances.
  user_goal: Understand what exists, what is pending, what is actively watched, and what deliberate operator memory exists.
  data_origin: Atlas renderer state, stored evidence/report context, discovery queue preview state, watch schedule state, assessment artifact/report state.
  source_terms_to_preserve:
    - Stored Evidence
    - Possible Leads
    - Watch
    - Marked
    - Assessment Memory
    - Discovery
    - Evidence
    - provenance
  source_terms_to_avoid_or_qualify:
    - Watcher
    - evidence when referring to Possible Leads
    - intelligence unless basis and ownership are clear
    - finding unless it is a presentation-only label for a scoped source record
    - report unless it opens an Atlas-owned report surface
  known_fields:
    - Stored evidence count or availability.
    - Possible lead count or availability.
    - Watch loaded/due/blocked/active state.
    - Assessment artifact count or availability.
    - Empty, unavailable, stale, and not-loaded states.
  gaps_or_unknowns:
    - Whether counts are available before a surface is loaded.
    - Whether each card should expand inline, open a drawer, or route to a surface.
    - Final icon/light grammar is not fixed.
  state_cases:
    - No data loaded.
    - Local corpus available.
    - Stored context loaded.
    - Possible leads queued.
    - No possible leads.
    - Watch available.
    - Watch blocked or unavailable.
    - Assessment memory available.
    - Assessment memory empty.
  freshness_or_age_needs: Show loaded, stale, not loaded, or unavailable states where Atlas exposes that basis.
  basis_or_source_needs: Each card should reveal whether it is based on stored Atlas data, discovery queue preview, Watch schedule, or assessment artifacts.
  warning_or_gap_needs: Possible Leads are Discovery output, not Evidence. Assessment Memory is deliberate operator memory, not proof.
  density_or_layout_constraints: Must stay readable in the Electron shell and collapse or stack without becoming a dense network-configuration panel.
  interaction_needs: Route, expand/collapse, or drawer affordances may be compared. Detail should appear at point of need.
  candidate_display_methods_requested: Compare compact scan cards, expandable detail cards, and route-first cards.
  lab_material_sets_relevant:
    - status-card-family
    - availability-distinction
    - source-basis-chip
    - compact-warning
  verification_or_review_needs: Human/UIUX visual review, Atlas terminology boundary review, and Atlas renderer smoke only if adopted into implementation.
  non_goals:
    - Do not merge Evidence and Discovery.
    - Do not imply Marked runs Watch.
    - Do not add backend endpoints or counts.
    - Do not make Lab wording authoritative for Atlas internals.
  notes: HS49 identified this rail as a high-value place to turn backend metadata into calmer operator-facing status.

---

# request_display: Atlas - Possible Leads / Queue Review

Status: submitted
Project: Atlas
Source owner: Atlas
Request owner: Atlas Overseer
Date: 2026-05-25
Lab intake state: not-yet-reviewed

request_display:
  id: atlas.discovery.queue-review-possible-leads
  project: Atlas
  status: submitted
  request_strength: pressure-test
  requester_role: Overseer
  source_owner: Atlas
  product_attachment:
    product_area: Discovery / Queue Review
    surface: Possible Leads and Queue Review display
    user_task: Inspect queued zKill refs as investigable Possible Leads without treating them as Evidence.
    owning_milestone_or_packet: HS47 Overview Face / HS49 Display Inventory
    priority: high
    decision_needed: Compare up to three display methods for queued Discovery refs, selected refs, and Enrich handoff.
  scope:
    boundary: One flow slice: Possible Leads display into Queue Review and Enrich Selected preflight.
    included:
      - Queued refs.
      - Selected refs.
      - Status, cached, and expanded indicators.
      - Enrich Selected preflight handoff.
      - Evidence boundary copy.
    excluded:
      - Backend queue selection logic.
      - ESI calls or live API behavior.
      - Schema or persistence changes.
      - zKill paste parsing or new discovery sources.
      - Expansion semantics.
    max_candidate_methods: 3
    source_project_acceptance_needed: true
  surface_or_use_case: Display Discovery queue candidates as Possible Leads and help the operator choose what to enrich.
  current_presentation: Queue Review exposes raw refs, discovered-by metadata, killmail hash/status/cached/expanded fields, text export, and boundary copy.
  user_goal: See what can be investigated next, understand why it is not Evidence yet, and choose whether to run Enrich Selected.
  data_origin: discovered_killmail_refs, queue selection preview, discovery queue report, and manual expansion preflight.
  source_terms_to_preserve:
    - Discovery
    - Possible Leads
    - Queue Review
    - Enrich Selected
    - Evidence
    - External API
    - provenance
  source_terms_to_avoid_or_qualify:
    - evidence when referring to queued refs.
    - observation unless the record is stored as an Atlas observation.
    - proof unless the source basis justifies it.
    - intelligence unless source ownership and basis are clear.
    - report unless it opens an Atlas-owned report surface.
  known_fields:
    - discovered_by_type
    - discovered_by_id
    - killmail_id
    - hash
    - status
    - cached
    - expanded
    - candidates_considered
    - selected_for_expansion
    - expected_esi_calls
    - evidence_effect
  gaps_or_unknowns:
    - Best presentation for raw hashes and refs.
    - Whether text export should stay diagnostic-only.
    - No accepted relevance ranking exists yet.
  state_cases:
    - Empty queue.
    - Candidate refs available.
    - Refs selected for Enrich Selected.
    - Ref already expanded.
    - Ref cached.
    - Ref failed or unavailable.
    - External API disabled.
    - Preflight blocked.
  freshness_or_age_needs: Show queue preview read/load state if available; otherwise state that this is the current local preview.
  basis_or_source_needs: zKill refs are Discovery/provenance metadata until ESI expansion stores evidence.
  warning_or_gap_needs: Queued refs are not Evidence. Enrich Selected may create stored Evidence only after explicit gated action.
  density_or_layout_constraints: Reduce raw-field overload while preserving enough detail for operator trust and auditability.
  interaction_needs: Select refs, compare refs, expand detail, and route to Enrich Selected preflight at point of need.
  candidate_display_methods_requested: Compare lead cards, grouped lanes, and table-with-detail-drawer.
  lab_material_sets_relevant:
    - detail-long-basis
    - availability-distinction
    - warning-gap-stack
    - action-readiness
  verification_or_review_needs: Atlas terminology boundary review, Human/UIUX visual review, and Atlas renderer smoke only if adopted into implementation.
  non_goals:
    - Do not auto-enrich.
    - Do not change discovery services.
    - Do not relabel Discovery refs as Evidence.
    - Do not add live/private/destructive behavior.
  notes: This is the main bleed point where programmatic discovery metadata can visually feel like user-ready evidence.

---

# request_display: Atlas - Watch State Display

Status: submitted
Project: Atlas
Source owner: Atlas
Request owner: Atlas Overseer
Date: 2026-05-25
Lab intake state: not-yet-reviewed

request_display:
  id: atlas.watch.state-display
  project: Atlas
  status: submitted
  request_strength: formative
  requester_role: Overseer
  source_owner: Atlas
  product_attachment:
    product_area: Watch / Queue
    surface: Watch status and state display
    user_task: Understand configured, blocked, due, armed, running, last checked, and next eligible Watch states without confusing Watch and Marked.
    owning_milestone_or_packet: HS47 Overview Face / HS49 Display Inventory
    priority: high
    decision_needed: Compare up to three display methods for an operator-readable Watch state model.
  scope:
    boundary: One Watch state family and its Overview/Watch-surface display.
    included:
      - Watch summary.
      - Due, blocked, ready, armed, running, last checked, and next eligible states.
      - Why blocked.
      - Diagnostic detail reveal pattern.
    excluded:
      - Scheduler algorithm changes.
      - Executor behavior changes.
      - Polling or live collection changes.
      - Backend Watch semantics.
      - Marked implementation changes.
    max_candidate_methods: 3
    source_project_acceptance_needed: true
  surface_or_use_case: Display Watch state as active routine check behavior, separate from Marked interest/attention.
  current_presentation: Watch Gates, Summary, Executor, Authoring, and Schedule surfaces expose scheduler/runtime fields directly.
  user_goal: Know whether Watch is configured, blocked, eligible, actively running, or waiting, and why.
  data_origin: watchlist entities, actor/system watches, watch schedule, watch executor, watch create flow, and task state.
  source_terms_to_preserve:
    - Watch
    - Marked
    - External API
    - blocked
    - ready
    - last checked
    - next eligible
  source_terms_to_avoid_or_qualify:
    - Watcher unless Human explicitly blesses it as presentation-only.
    - monitoring unless scoped as Watch behavior.
    - live unless External API/live behavior is actually enabled.
    - tactical.
    - intelligence unless source ownership and basis are clear.
  known_fields:
    - session_armed
    - due_count
    - blocked_count
    - total_watches
    - watch_type
    - watch_id
    - last_checked
    - next_eligible
    - block_reason
    - executor_state
    - task_id
  gaps_or_unknowns:
    - Final operator-facing state labels are not accepted yet.
    - Whether Marked appears on this surface or only as related context.
    - How much executor detail belongs in default view versus diagnostics.
  state_cases:
    - No watches.
    - Watch configured.
    - Watch due.
    - Watch blocked.
    - Watch ready.
    - Watch armed.
    - Watch disarmed.
    - Watch running.
    - Watch failed.
    - Watch complete.
    - Watch stale or unavailable.
  freshness_or_age_needs: Last checked and next eligible should be visible where known; stale or unavailable schedules should be explicit.
  basis_or_source_needs: Watch display is based on active routine check configuration/schedule, not passive attention.
  warning_or_gap_needs: Marked does not imply Watch. Watch should not imply collection unless armed and explicit gates permit it.
  density_or_layout_constraints: Default view should be compact and operator-readable; executor internals should move into diagnostics or detail reveal.
  interaction_needs: Expand detail, route to diagnostics, and expose arm/disarm or blocked-state action only at point of need.
  candidate_display_methods_requested: Compare state ladder, compact status band, and split Marked/Watch panel.
  lab_material_sets_relevant:
    - availability-distinction
    - freshness-readout
    - compact-status-strip
    - action-readiness
    - warning-gap-stack
  verification_or_review_needs: Atlas terminology boundary review, Human/UIUX visual review, and Atlas renderer smoke only if adopted into implementation. No live smoke unless explicitly authorized.
  non_goals:
    - Do not change Watch scheduler behavior.
    - Do not start live collection.
    - Do not rewrite Marked.
    - Do not add backend, bridge, persistence, or contract changes.
  notes: This request protects the accepted asymmetric model: Watch can imply Marked interest, but Marked does not imply Watch.
