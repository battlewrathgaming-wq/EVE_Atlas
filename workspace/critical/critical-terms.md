# Critical Terms

Purpose: list Atlas-owned terms, emitted meanings, preserve-exact terms, and downstream translation cautions.

Accepted policy:
`F:\Projects\Docs\Aura-Project-Orchestration\terminology\TerminologyAuthorityRuleset-2026-05-24.md`

Expanded lists:

- Atlas expanded coordination list: `F:\Projects\Docs\Aura-Project-Orchestration\critical\AURA-Atlas\critical-terms.md`
- Cross-project synthesis: `F:\Projects\Docs\Aura-Project-Orchestration\terminology\terminology-critical-cross-project-synthesis-2026-05-24.md`
- Frequency synthesis: `F:\Projects\Docs\Aura-Project-Orchestration\terminology\terminology-frequency-synthesis-2026-05-24.md`

Lab may use its own product-agnostic presentation vocabulary after the bridge, but Atlas owns Atlas terms, emitted meanings, command effects, and Project -> Bridge language.

## Preserve Exactly

| Term | Meaning | Why Preserve | Downstream Note |
| --- | --- | --- | --- |
| `Evidence` | Expanded ESI killmail data and Atlas-owned derived activity events. | Atlas durable evidence boundary. | Do not use for zKill refs, Lab readouts, Sense samples, smoke reports, or generic support logs. |
| `Discovery` | Possible leads before ESI expansion. | Pre-evidence staging boundary. | Discovery refs are not durable evidence until the accepted evidence-creation step succeeds. |
| `Observation` | Rendered pattern or report-layer meaning derived from stored Atlas evidence. | Prevents observations from becoming unsupported proof. | Qualify if used outside Atlas. |
| `Assessment Memory` | Deliberate saved operator judgment with citation context. | Separates human judgment from raw evidence. | Not evidence, not automatic intelligence, and not proof. |
| `Marked` | Attention, interest, or selection state. | Distinct from active checking. | Marked does not imply Watch. |
| `Watch` | Active routine check configuration or behavior. | Implies collection/checking behavior and gates. | Watch may imply Marked if Atlas defines it; Marked must not imply Watch. |
| `Enrich selected` | Explicit ESI expansion into stored evidence. | Evidence-creation action. | Pair with provider/call/write/evidence-effect wording. |
| `Refresh labels` | Readability-only metadata hydration. | Prevents metadata refresh from sounding like evidence creation. | Do not call evidence enrichment. |
| `Expanded ESI killmail` | Full killmail record retrieved from ESI after zKill gives ID/hash. | Primary Atlas evidence source. | Preserve evidence role exactly. |
| `External API` | Current Atlas label for zKill/ESI/live provider availability and kill-switch state. | Active current-pass provider authority wording. | Long-term preserve-exact status still needs Human/Overseer decision. |
| `external_io` | Future Atlas provider trust-boundary family for whether Atlas may contact external/downstream providers. | Prevents `watch.executor.arm` or `live.gate` from becoming overloaded global disconnect semantics. | Not implemented yet; do not rename existing commands without an explicit packet. |

## Atlas-Owned Terms

| Term | Meaning | Notes |
| --- | --- | --- |
| `Discovery -> Evidence -> Observation -> Assessment` | Atlas layer model from possible leads through durable evidence, rendered patterns, and deliberate judgment. | Project-owned doctrine, not shared Aura doctrine by default. |
| `possible leads` / `Discovery Queue` | User-facing staging language for queued zKill refs before ESI expansion. | Not evidence. |
| `Queue Review` | Review stage for selected possible refs. | Should remain read-only unless paired with accepted action. |
| `manual.discovery` | User-led zKill discovery service command. | Queues refs; does not create killmail evidence. |
| `manual.expansion` | ESI expansion service command. | Interface phrase is `Enrich selected`; evidence-creating. |
| `metadata.hydration` | Metadata/readability label refresh. | Interface phrase is `Refresh labels`; not evidence creation. |
| `assessment_artifact` | Backend persistence row for Assessment Memory. | UI should prefer `Assessment Memory` unless inspecting raw detail. |
| `watchlist_entities` | Legacy/internal attention and watch preference persistence. | User copy should prefer `Marked` when meaning is attention. |
| `actor.watch` / `system.radius.watch` | Watch-management commands. | Active routine checking, not passive startup collection. |
| `watch.executor.arm` | Existing session-level switch for scheduled Watch execution. | Watch-specific arming only; not the global provider trust boundary. |
| `live.gate` | Existing per-action/provider/cadence gate for live/manual provider actions. | Does not replace storage authority or future `external_io`. |
| `fetch_runs` / `api_request_logs` | Provider/run provenance and provider call history. | Support/provenance, not evidence itself. |
| `Runtime snapshot` | Local DB support artifact. | Not Sense lane snapshot and not retention/pruning policy. |
| `Record`, `Intelligence`, `Finding` | Unresolved final naming candidates. | Do not standardize or export as Lab defaults. |

## Watch_offline Readout State Terms

These terms are Atlas support/readout vocabulary. They may be emitted by Atlas for diagnostics, bridge-facing support state, or future renderer consumption, but they are not Lab presentation defaults and they do not rename backend source concepts.

| Term | Meaning | Notes |
| --- | --- | --- |
| `Watch_offline` | Read-only post-restart/offline Watch support model. | Does not arm collection, call providers, hydrate metadata, create Evidence, or mutate Discovery refs. |
| `session_armed` | Volatile executor/session state indicating whether Watch execution is armed. | Restart should be unarmed by default. |
| `collection_active` | Derived readout flag indicating whether collection work is currently active. | Must not imply background provider work when false. |
| `eligible_if_armed` | Due-time Watch could move if the session were armed and no higher-priority block applies. | This is not authorization to call a provider by itself. |
| `recovery` | Per-Watch derived recovery diagnostic block. | Support/readout layer only; not persisted recovery state. |
| `next_safe_action` | Derived operator/system-safe next action label. | Presentation may translate later, but source meaning stays Atlas-owned. |
| `provider_deferral` | Provider/capacity wait signal surfaced as availability state. | Waiting is not failure and does not mark refs failed. |
| `missed_slot` | Expected Watch timing moved past observed movement and may be recoverable. | Does not replay exact sequencer packets. |
| `orphaned_run` | Previously running fetch/run state needs review after restart. | Should request review, not auto-resume. |
| `reconstructed_scope` | Readout of recoverable Watch scope basis from durable local state. | Must expose limitation rather than guess exact coverage. |
| `scope_status` | Scope quality classification for reconstructed scope. | Accepted values include `valid`, `not_stored`, and `malformed`. |

Accepted `next_safe_action` values:

| Value | Meaning |
| --- | --- |
| `arm_required` | Work may need deliberate arming before provider movement. |
| `wait` | Capacity, timing, or availability means waiting is the safe action. |
| `drain_pending_refs` | Existing local Discovery refs should be handled before fresh Discovery. |
| `ready_for_discovery` | Readout has no safer local step blocking future Discovery when otherwise allowed. |
| `review_orphan` | A prior running state needs operator/diagnostic review. |
| `recover_missed_slot_when_capacity_allows` | Missed timing is recoverable when capacity and gates allow movement. |
| `complete_enough_alpha` | Readout is sufficient for alpha-level posture while known limitations remain visible. |

## Translation Caution

| Atlas Term | Possible Interface Term | Risk | Decision |
| --- | --- | --- | --- |
| `discovered_killmail_refs` | possible leads / queued possible refs | Calling refs evidence breaks Atlas evidence doctrine. | Translate in primary UI; keep source/evidence boundary visible. |
| `queue.selection` | Queue Review / queue preview | Can sound executable or evidence-bearing. | State read-only preview/no ESI call/no evidence creation. |
| `manual.expansion` | Enrich selected | Enrich can blur evidence creation and label refresh. | Use only with ESI/call/write/evidence-effect context. |
| `metadata.hydration` | Refresh labels | Hydration/enrichment wording can overclaim. | State readability-only and no raw evidence mutation. |
| `assessment_artifact` | Assessment Memory | Artifact is backend-shaped; Memory can sound automatic. | Present as saved operator judgment, not proof. |
| `watchlist_entities` | Marked | Watchlist can imply active watching. | Translate attention state to Marked; reserve Watch for active checks. |
| `actor.watch` / `system.radius.watch` | Watch / active routine check | Collides with Sense watcher/listening language. | Preserve Atlas active-check meaning with gates/cadence/caps. |
| `blocked` / `ready` | blocked / ready | Can sound tactical or truth-bearing. | Use as operational action/watch state only. |
| `source` | evidence basis / collection provenance / source metadata | Collides with Lab display source and Sense provider source. | Qualify the source layer. |
| `report` | evidence report / observation report / corpus health | Report can imply more authority than the layer supports. | Use the lowest precise layer and disclose basis. |
| `runtime.db_snapshot.*` | Runtime snapshot | Collides with Sense lane snapshots. | Present as local DB support artifact. |
| `External API` | Live lookups / provider access | Alternate labels may imply background collection. | Preserve or translate only with gate/permission meaning visible. |

## Open Questions

- Which Atlas labels should be preserve-exact in Lab-fed interfaces?
- Should `External API` remain the durable interface phrase or be Lab-translatable?
- Should `Evidence` be treated as Atlas-reserved across all projects except explicitly qualified reviewer/audit uses?
- Should `Record`, `Intelligence`, and `Finding` remain visibly unresolved in downstream docs and UI?
