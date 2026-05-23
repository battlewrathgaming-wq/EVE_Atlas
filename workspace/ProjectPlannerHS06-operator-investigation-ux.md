# ProjectPlannerHS06: Operator Investigation UX Advisory

Date: 2026-05-23
Role: Project Planner
Target: Overseer consideration
Status: Advisory, non-executable
Project: AURA Atlas
Payload source: Human UI/UX scoping material seen in chat plus local Atlas terminology/workflow review

## 1. Target Project Confirmation

Target project confirmed as AURA Atlas at:

```txt
F:\Projects\AURA-Atlas
```

This handoff is written locally under `workspace/` so the Atlas Overseer can review it inside the normal project workflow.

This is not a Dev runway. It does not modify `workspace/current.md`, does not direct Dev, and does not decide product acceptance.

## 2. Files Reviewed

Project boot and workflow:

- `AGENTS.md`
- `workspace/README.md`
- `workspace/overview.md`
- `workspace/current.md`
- `workspace/00-dot-protocol.md`
- `workspace/prompts.md`
- `workspace/DevHS03-atlas-task-concurrency-cancellation.md`
- `workspace/OverseerHS04-task-concurrency-review.md`

Shared Project Planner / workspace authority:

- `F:\Projects\Docs\Aura-Agent-Coordination\roles\project-planner\README.md`
- `F:\Projects\Docs\Aura-Agent-Coordination\roles\project-planner\prompt.md`
- `F:\Projects\Docs\Aura-Agent-Coordination\workspace-structure-authority.md`

Terminology and UX-relevant project files reviewed during this planning pass:

- `docs/terms/README.md`
- `docs/terms/work-products.md`
- `docs/terms/entity-interest.md`
- `docs/terms/watchlist.md`
- `docs/terms/actor-watch.md`
- `docs/terms/system-radius-watch.md`
- `docs/terms/discovery-queue.md`
- `docs/terms/evidence.md`
- `docs/terms/evidence-report.md`
- `docs/terms/manual-discovery.md`
- `docs/terms/metadata.md`
- `docs/terms/collection-provenance.md`
- `docs/statements/attention-driven-intelligence.md`
- `docs/roadmap/operator-ui-workflow-polish.md`
- `src/renderer/index.html`

Human-provided UI/UX material reviewed from chat:

- Advisory UI/UX Vision Note: Operator Investigation Path
- Human correction that the scope is broader than vocabulary
- Human decision that `Mark` should tag an entity and `Watch` should be reserved for the watch system

## 3. Current Atlas Pipeline Understanding

Atlas is currently in the active milestone:

```txt
Aggressive Testing And Operator Bug Hunting
```

`workspace/current.md` is at sequence HS05 and assigns Dev to adversarial evidence fixtures, with expected output:

```txt
DevHS05-atlas-adversarial-evidence-fixtures.md
```

The current executable packet remains authoritative. This Project Planner handoff should enter Atlas as advisory future milestone input for Overseer review, not as current Dev work.

Current product doctrine understood from reviewed files:

- zKillboard is discovery only.
- Expanded ESI killmails are evidence.
- Discovery refs are possible evidence until expanded.
- UI presents and scopes evidence; UI is not authority.
- Reports present stored evidence and generated observations.
- Assessments are deliberate operator memory, not evidence.
- Passive views must not collect evidence.
- Live APIs require explicit gates and narrow scopes.

The current renderer is an initial service-boundary shell with readiness, scopes, tasks, queue/watch, actions, and reports. It proves service consumption and safety boundaries, but it is not yet the desired operator investigation experience.

## 4. Payload Title And Scope

Payload title:

```txt
Operator Investigation Desk UX Direction
```

Scope:

Resolve the human UI/UX vision into an Overseer-reviewable planning payload for a future Atlas milestone focused on human-factored operator investigation flow.

This includes:

- opening experience and first useful screen
- investigation entry points
- Discovery / Evidence / Observation / Assessment / Intelligence lifecycle
- Mark versus Watch vocabulary and state model
- manual discovery and enrichment flow framing
- record drawer concept
- battle timeline, relationship view, and system/radius footprint story surfaces
- live/API trust behavior
- technical detail hierarchy
- first runnable UX/UI slice options

This does not include implementation, Dev instruction, product acceptance, or `workspace/current.md` edits.

## 5. Human Intent As Understood

The human wants Atlas to feel like an operator-facing investigation desk, not a database console or backend service shell.

The central operator question is:

```txt
Who is that? What are they connected to? What happened? Is this worth remembering?
```

The intended journey is not primarily "search local storage." Stored data should support target development after operator interest exists.

Preferred centerline:

```txt
Investigation Desk
-> Discovery
-> Enrichment / Evidence creation
-> Story / Relationships
-> Assessment
-> Intelligence Record
```

The product should create understandable "oh, that is cool" moments through:

- battle timelines
- relationship reveals between pilots, corporations, alliances, IDs, and records
- system/radius footprint or blast-radius context
- known-record match reveals

The operator should be able to begin from:

- pilot name
- corporation or alliance name
- system or region of interest
- zKillboard lead
- in-game encountered entity
- threat-detection system or region interest

Known records should surface discreetly when relevant without hijacking the active investigation flow.

## 6. Actionable UI/UX Items

### 6.1 Investigation Desk Structure

Replace or reframe the opening experience so the first useful screen invites investigation rather than backend inspection.

Candidate operator-facing prompt:

```txt
Who are we going to uncover today?
```

The first useful screen should include:

- stateful Live/API availability
- primary investigation input
- existing marked systems/entities/report cards where relevant
- discreet known-record match signal if Atlas recognizes something
- clear route into discovery/enrichment

This should not foreground "search the stored database" as the main utility.

### 6.2 Full Product Lifecycle Framing

Use this lifecycle as the major product path:

```txt
Discovery -> Evidence -> Observation -> Assessment -> Intelligence
```

Planning interpretation:

- Discovery means a lead or first sighting. It is not proof.
- Evidence means authoritative expanded ESI killmail data.
- Observation means rendered interpretation from evidence.
- Assessment means human/reviewed findings based on evidence and observations.
- Intelligence means final usable stored product inside a Record, if the Human accepts that label.

### 6.3 Mark / Watch Decoupling

This is the clearest human decision captured in the planning pass.

Use:

```txt
Mark = operator interest/tagging
Watch = active watch system only
```

Recommended operator intent lifecycle:

```txt
Unmarked -> Marked -> Watched
```

Definitions:

- Mark: an operator-applied interest tag. It does not scan, collect, enrich, expand, or call live APIs.
- Marked: an entity, organization, system, or record the operator wants to keep visible.
- Watch: active/routine check behavior with scope, lookback, cadence, caps, gates, and task output.
- Watched: a marked or selected target/system with active watch configuration.

Current Atlas overlap to resolve:

- `watchlist` currently means "interesting enough to remember."
- `entity interest` currently means a committed assessment that something matters.
- `actor watch` and `system/radius watch` are actual active collection/check concepts.

Suggested direction:

- Convert user-facing "watchlist/watchlisted" language to "Mark/Marked" where it means interest.
- Preserve "Watch" for actor watch, system/radius watch, schedule, arming, due checks, and active routine collection.
- Do not make Mark imply Watch.
- Do not make Watch imply assessment, hostility, or proof.

### 6.4 Discovery And Enrichment Flow

Preserve the manual pause between discovery and evidence creation.

Suggested user-facing progression:

```txt
Found possible leads
Review before enriching
Enrich selected
Expanded into evidence
```

Planning caution:

- "Enrich" may be a better operator-facing label than "expand" for the button or step.
- The preflight/details must still be explicit that ESI expansion creates stored killmail evidence.
- Metadata hydration must remain separately described as readability-only label hydration, not evidence enrichment.

### 6.5 Story Surfaces

Prioritize story surfaces after evidence exists.

Candidate surfaces:

- Battle timeline: who died, when, and to whom.
- Entity relationship view: pilots, corporations, alliances, connected IDs, connected records.
- System / blast-radius footprint: connected systems or gate-radius context for watched systems and area interest.
- Known-record reveal: when existing intelligence exists, show a subtle match and allow opening without replacing context.

These surfaces should remain derived from stored evidence and metadata. They should not create observations as stored authority unless future doctrine explicitly accepts that.

### 6.6 Record Viewer / Drawer Concept

Introduce or investigate a persistent Record viewer concept.

Desired behavior:

- relevant match creates a subtle signal around the Record control
- opening the Record does not destroy investigation context
- Record panel can transition between matched records
- intelligence/history can be inspected while continuing current investigation

Likely UI form:

- slide-out panel or bottom panel
- not a full-page navigation takeover

Planning caution:

`Record` is not yet a clean accepted Atlas product term. Current docs use "record" generically for database/durable records. If accepted, it needs durable term definition.

### 6.7 Live/API Trust Behavior

Live/API capability should be visible as a global stateful session control.

The operator should not be forced through excessive ceremony for every step once live/API is intentionally enabled, but high-consequence actions should retain concise preflight previews:

- expected providers
- expected calls
- expected writes
- scope
- caps
- whether evidence will be created

Tone target:

- operator-facing
- concise
- confidence-building
- not overly legalistic
- still clear about evidence boundaries

### 6.8 Technical Detail Hierarchy

Primary screen should not be dominated by raw backend/service details.

Move these into drawers/details:

- raw IDs
- normalized JSON
- service counts
- task internals
- queue internals
- backend defaults
- scope validation payloads
- classifications unless translated

Keep small trust peeks where useful:

- source/freshness
- expected calls/writes
- sample status
- known IDs
- confidence/limits
- evidence effect

Controls should use operator-friendly refinements:

- sliders
- toggles
- filters
- drawers
- contextual state badges

## 7. Items Needing Human Decision

These should remain Human decision items unless already accepted explicitly:

1. Should the stored container be called `Record`?
2. Should final stored human-facing output be called `Intelligence`, `Finding`, or remain `Assessment` / `Assessment Memory`?
3. Should `Enrich selected` be the primary operator-facing label for ESI expansion, with `ESI expansion` shown in preflight detail?
4. Should pasted zKill links / killmail IDs be accepted in the first UX pass?
5. Should region be first-class immediately, or should first pass focus on current system/radius machinery?
6. Should battle timelines be strictly chronological or grouped into fight clusters?
7. Should relationship and system footprint be one combined view or separate adjacent views?
8. Should the first polished workflow optimize for a new/local-alpha operator or for expert operator speed?

The following decision is already captured from the human:

```txt
Mark = tagging/interest
Watch = active watch system only
```

Overseer should still decide how and when this enters project docs/current work.

## 8. Items To Defer

Defer unless Human/Overseer explicitly accepts:

- passive collection
- automatic enrichment
- automatic intelligence creation from observations
- evidence deletion/pruning
- region as full first-class implementation if system/radius is safer first
- broad dashboard analytics
- AI commentary
- map rendering beyond a simple footprint/story surface
- backend/internal renames for their own sake
- changing evidence doctrine to make UI state authoritative
- treating archived `docs/gap` items as active tasks

## 9. Durable-Doc Candidates

If Overseer accepts the direction, likely durable-doc candidates are:

1. `docs/roadmap/operator-investigation-desk.md`
   - milestone meaning, human intent, first runnable slice, non-goals, acceptance checks.

2. `docs/terms/mark.md`
   - define Mark/Marked as operator interest without collection.

3. Update or supersede `docs/terms/watchlist.md`
   - clarify whether watchlist remains internal/historical wording or becomes Marked Records.

4. Update `docs/terms/actor-watch.md`
   - reinforce Watch as active/routine scoped checking only.

5. Update `docs/terms/system-radius-watch.md`
   - reinforce Watch as active/routine area checking only.

6. Potential `docs/terms/record.md`
   - only if Human accepts Record as a product container.

7. Potential `docs/terms/intelligence.md`
   - only if Human accepts Intelligence as final reviewed output.

8. Potential update to `docs/roadmap/operator-ui-workflow-polish.md`
   - if Overseer treats this as a continuation rather than a new roadmap doc.

## 10. Recommended Overseer Decision Path

Recommended classification:

- active milestone input: no, not until HS05 aggressive-testing runway is accepted or redirected
- future milestone input: yes
- deferred workspace artifact: yes, keep as active advisory until Overseer accepts/defer/archive decision
- human decision item: yes, for Record, Intelligence/Finding label, Enrich label, region scope, zKill link input, timeline grouping
- durable-doc candidate: yes, after Human/Overseer acceptance
- out-of-scope item: passive collection, automatic enrichment, automatic intelligence, evidence pruning, broad dashboard analytics

Recommended Overseer path:

1. Preserve current HS05 Dev packet unless Human explicitly redirects milestone priority.
2. After HS05 Dev handoff, review this Project Planner advisory alongside the active product docs.
3. Decide whether the next milestone remains aggressive testing or pivots to Operator Investigation Desk UX.
4. If pivoting, write or update a roadmap milestone doc before Dev work.
5. Ask Human to resolve the remaining naming/scope choices before writing a broad UI runway.
6. Consider a UI/UX Specialist pass before Dev if detailed screen hierarchy, labels, and state model are needed.
7. Only then write a bounded Dev runway in `workspace/current.md`.

Recommended first milestone direction if accepted:

```txt
Operator Investigation Desk: first runnable investigation path
```

Recommended first runnable slice:

- first useful investigation screen with primary lead input and Live/API state
- Mark/Marked language for operator interest
- Watch reserved for active watch configuration/status
- discovery result state with possible leads and trace/source/freshness
- explicit enrichment/ESI expansion preflight for selected leads
- first story surface after evidence exists, likely battle timeline
- Record drawer placeholder or first read-only matched-record panel if Record is accepted
- technical detail drawers for raw IDs, queue internals, JSON, task/service detail

## 11. Suggested Dev Acceptance Checks If Overseer Accepts The Work

These are suggested acceptance checks only. They are not Dev instructions until Overseer accepts and writes a packet.

Potential UI/verification checks:

- App opens to an investigation-oriented first screen rather than a backend service shell view.
- A user can start from an actor or system lead through an offline/demo fixture path.
- Marking a target does not start collection, discovery, enrichment, hydration, or evidence mutation.
- Watch UI language appears only where active watch configuration/schedule/session execution is involved.
- Discovery results are visibly described as possible leads / not evidence.
- Enrichment/expansion preflight states expected provider, calls, writes, scope, caps, and evidence effect.
- ESI expansion remains explicit before evidence rows are created.
- Metadata hydration remains labelled as readability-only and not evidence enrichment.
- Report/story surfaces derive from stored evidence and do not infer proof language.
- Assessment save remains deliberate and requires review context.
- Known-record/Record drawer, if implemented, does not destroy investigation context.
- Raw IDs, normalized JSON, queue internals, and backend defaults are available in details/drawers rather than dominating the primary path.
- Passive page loads do not call live APIs, start watch execution, expand refs, hydrate labels, create assessments, or mutate evidence.
- Existing offline verification remains green, including `npm.cmd run verify:all`.
- Electron smoke, if UI changes are made, verifies the first investigation path and no startup evidence mutation.

## 12. Risks / Assumptions

Risks:

- `Record` and `Intelligence` could sound more authoritative than current evidence/assessment doctrine allows if introduced without precise definitions.
- `Enrich` could blur ESI evidence expansion and metadata hydration unless labels and preflights distinguish them.
- Mark/Watch decoupling may require UI copy and docs changes before schema changes; forcing backend renames too early could create churn.
- Battle timeline and relationship views can accidentally imply causality, affiliation, staging, or hostile intent unless wording remains evidence-bound.
- A more inviting investigation desk could accidentally hide important live/API effects if trust peeks become too subtle.

Assumptions:

- The current aggressive-testing HS05 packet remains active unless Human/Overseer redirects.
- The reviewed UI/UX material is human vision input, not yet accepted product doctrine.
- Atlas should continue using existing backend services where practical for the first UX pass.
- First pass should prioritize operator clarity and flow over new architecture.
- Archived deprecated gap docs remain historical context only.

## 13. Exact Prompt For Overseer To Review And Integrate This Payload

```txt
Overseer: review the Project Planner advisory at workspace/ProjectPlannerHS06-operator-investigation-ux.md.

Start from F:\Projects\AURA-Atlas.

Read AGENTS.md, workspace/README.md, workspace/overview.md, workspace/current.md, workspace/00-dot-protocol.md, workspace/prompts.md, the latest Dev/Overseer handshakes, and the Project Planner advisory.

Treat the advisory as non-executable human-facing UX planning input, not product authority and not Dev instruction.

Judge how it should enter Atlas:
- active milestone input
- future milestone input
- deferred workspace artifact
- human decision item
- durable-doc candidate
- out-of-scope item

Pay special attention to the Human decision:
Mark = tagging/operator interest.
Watch = active watch system only.

Do not rewrite workspace/current.md unless you are deliberately accepting this into the next bounded runway after current active work is reviewed or redirected.

Report:
- whether this advisory is accepted, deferred, redirected, or needs Human decision
- whether a durable roadmap/terms doc should be created or updated
- what questions must return to Human before Dev
- whether a UI/UX specialist pass is needed before Dev
- what the next safe Dev runway would be only if and when this direction is accepted
```

