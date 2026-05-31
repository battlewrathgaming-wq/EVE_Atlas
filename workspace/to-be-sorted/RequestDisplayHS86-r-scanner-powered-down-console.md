# Atlas Request Display HS86 - R-Scanner Powered-Down Console

Date: 2026-05-26
Role: Atlas Overseer
Status: ready to submit to Aura Lab

Advisory-only display request.

Atlas owns the meaning of this surface, source terms, data, states, runtime behavior, and final adoption. Aura Lab may compare Bridge -> Interface display methods, but must preserve Atlas terms, Atlas semantics, and the scoped boundary below.

This request is limited to one bounded display problem. It does not authorize implementation, bridge/IPC/contract changes, backend changes, persistence changes, terminology renames, or Atlas adoption.

Active request count: 1

---

# request_display: Atlas - R-Scanner Powered-Down Console

Status: submitted
Project: Atlas
Source owner: Atlas
Request owner: Atlas Overseer
Date: 2026-05-26
Lab intake state: not-yet-reviewed

request_display:
  id: atlas.r-scanner.powered-down-console
  project: Atlas
  status: submitted
  request_strength: comparative
  requester_role: Overseer
  source_owner: Atlas
  product_attachment:
    product_area: Watch Recovery / Atlas Overview
    surface: R-Scanner powered-down console for Watch_offline recovery state
    user_task: Understand after restart whether Atlas is disarmed, waiting, ready, holding local refs, deferred, or needs review without implying background surveillance or active provider work.
    owning_milestone_or_packet: HS84 Watch Recovery Readout Interpretation
    priority: high
    decision_needed: Compare up to three Bridge -> Interface display methods for a powered-down scanner console that presents Watch_offline recovery state while preserving Atlas meaning.
  scope:
    boundary: One stateful scanner/recovery surface using existing Watch_offline readout fields.
    included:
      - R-Scanner as presentation surface candidate.
      - R-scan as short action candidate.
      - Powered-down / disarmed / offline scanner state.
      - Current state, armed/disarmed, R-scan availability, last read/freshness, pending local refs, muted warning/review marker, and detail affordance.
      - Valid, missing, and malformed radius scope presentation.
      - Provider deferred, missed-slot recoverable, orphan/review, pending local refs, ready, wait, and complete-enough states.
    excluded:
      - Backend, bridge, IPC, command, payload, persistence, schema, service, or test changes.
      - Renaming Atlas source/internal term Watch or bridge/readout term Watch_offline.
      - Full Atlas Overview redesign.
      - Animated radar sweep while disarmed/offline.
      - New live/API behavior, provider calls, Watch scheduler behavior, sequencer packets, or Discovery/Evidence semantics.
      - Lab making R-Scanner a source-term authority.
    max_candidate_methods: 3
    source_project_acceptance_needed: true
  surface_or_use_case: A powered-down R-Scanner console that translates Watch_offline recovery diagnostics into calm operator-facing readiness and review states.
  current_presentation: Watch_offline is currently a read-only backend/support model with recovery diagnostics and next_safe_action values; it does not yet have a dedicated operator-facing presentation.
  user_goal: See whether the scanner is safely offline/disarmed, waiting, ready, holding local work, deferred, or needing review, and understand the next safe action without reading raw scheduler or recovery fields.
  data_origin: Existing Atlas Watch_offline service/readout fields derived from Watch rows, fetch/API logs, data quality warnings, Discovery refs, Evidence/EVEidence/activity counts, executor state, and radius scope parse status.
  source_terms_to_preserve:
    - Watch
    - Watch_offline
    - Discovery
    - Evidence
    - EVEidence
    - hydration
    - provenance
    - Marked
    - storage
    - External API
  source_terms_to_avoid_or_qualify:
    - Watcher
    - live unless provider work is actually active
    - surveillance unless explicitly scoped as user-authorized Watch behavior
    - Evidence/EVEidence when referring to Discovery refs
    - scan result when referring to pending local refs
    - failure when referring to waiting or provider deferral
    - exact radius coverage when stored scope is missing or malformed
    - D-scan comparison in ordinary UI copy unless user confusion requires it
  known_fields:
    - model
    - session_armed
    - collection_active
    - live_api_enabled
    - summary
    - watches[].recovery.next_safe_action
    - watches[].recovery.expected_next_run_at
    - watches[].recovery.observed_movement_at
    - watches[].recovery.pending_refs_count
    - watches[].recovery.provider_deferral
    - watches[].recovery.orphaned_run
    - watches[].recovery.missed_slot
    - watches[].recovery.reconstructed_scope.scope_status
    - watches[].recovery.reconstructed_scope.limitation
    - watches[].local_context
    - watches[].state_basis
  gaps_or_unknowns:
    - Whether R-Scanner should appear on Atlas Overview or a dedicated recovery/status surface first.
    - Final iconography and motion grammar are not accepted.
    - Whether first-use copy is needed to establish R-Scanner without over-explaining D-scan distinction.
    - How much diagnostic detail belongs in default view versus detail drawer.
  state_cases:
    - offline / disarmed
    - waiting
    - pending local Discovery refs
    - ready to scan
    - missed slot recoverable
    - provider deferred
    - review needed / orphaned run
    - complete enough for alpha
    - valid radius scope
    - missing radius scope
    - malformed radius scope
  freshness_or_age_needs: Show last read/freshness and expected/observed movement where useful, but avoid making timestamps dominate the console.
  basis_or_source_needs: Default view should make clear that R-Scanner is based on stored Atlas state and deliberate operator action. Diagnostic detail may reveal Watch_offline, Watch source rows, Discovery refs, provider warnings, and Evidence/EVEidence basis.
  warning_or_gap_needs: Offline/disarmed is normal and safe, not broken. Waiting/provider deferred is not failure. Missing/malformed radius scope limits confidence and should not imply exact coverage. Pending local refs are Discovery, not Evidence/EVEidence.
  density_or_layout_constraints: Should feel like a central instrument, not a network configuration panel. Keep default view calm and sparse, with detail behind point-of-need affordance.
  interaction_needs: Compare how the operator sees state, detail, and action readiness. R-scan action should only look primary when allowed/ready; no animated sweep while disarmed/offline.
  candidate_display_methods_requested: Compare Powered-Down Central Console, Status Envelope With Scanner Face, and a compact alternative if Lab finds a better bounded method. Recovery Checklist Rail may be mentioned but is parked unless Lab finds a compelling low-noise version.
  lab_material_sets_relevant:
    - powered-down-console
    - availability-distinction
    - freshness-readout
    - compact-status-strip
    - warning-gap-stack
    - action-readiness
    - detail-on-demand
  verification_or_review_needs: Atlas terminology boundary review, Human/UIUX visual review, and renderer smoke only if Atlas later adopts an implementation packet. No live/API smoke is authorized by this request.
  non_goals:
    - Do not implement UI.
    - Do not rename Atlas source or bridge terms.
    - Do not imply live surveillance.
    - Do not show Discovery refs as Evidence/EVEidence.
    - Do not make waiting or provider deferral look like failure.
    - Do not add backend or service requirements.
    - Do not broaden into a full Overview redesign.
  notes: HS84 accepted R-Scanner/R-scan as future presentation candidates only. This request asks Lab to compare display methods while preserving Atlas-owned Watch_offline and recovery semantics.
