# UIUXHS36: Operator Intel Console Presentation Spec

Date: 2026-05-24
Role: UI/UX Specialist
Status: Advisory - for Human and Overseer acceptance
Milestone: Operator Intel Console Presentation Specification

## Request Received

`workspace/current.md` asks for a non-code screen-level presentation specification for the first Atlas operator path. The spec must integrate the Human local-alpha UI trial, accepted UI/UX story pass, Overseer terminology correction, current presentation-layer information index, IPC/UI current state, terminology/retention state, and Operator Investigation Desk roadmap.

The accepted presentation path is:

```txt
Lead
-> Discovery / possible leads
-> Queue review
-> Enrich selected
-> Evidence
-> Observation
-> Assessment Memory
```

This is a human-facing presentation model over existing Atlas services, not a new backend pipeline. Dev is not active in this packet.

## Intent Read

Atlas should open like an operator intel console that asks:

```txt
Who or where are we investigating?
What can Atlas safely show from local state?
What possible leads exist?
What action turns a lead into evidence?
What story can be observed from stored evidence?
What is worth deliberately remembering?
```

The current UI has the core mechanics, but still exposes too much backend shape: Readiness, Scopes, Tasks, Actions, Queue, Watches, raw IDs, normalized payloads, and service language compete with the investigation story. The presentation pass should keep the command-console feel, but lead the operator through staged intent.

## Grounded Service Map

The screen model can be grounded in existing services and contracts:

| Human stage | Existing backend/service basis | Presentation meaning |
| --- | --- | --- |
| Lead | `scope.validate`, local SDE resolution, existing lead controls | The operator's target or place of interest. |
| Discovery / possible leads | `manual.discovery`, zKill refs, `discovered_killmail_refs` | zKill-derived possible leads, not evidence. |
| Queue review | `queue.selection`, queue report/status | Reviewable staged refs before ESI spend. |
| Enrich selected | `manual.expansion`, live gate preflight, task runner | Explicit ESI expansion that creates stored killmail evidence. |
| Evidence | `killmails`, `activity_events`, report evidence basis | Stored expanded ESI killmails and derived activity events. |
| Observation | `report.actor`, `report.radius`, `report.corporation`, structured report responses | Rendered patterns from stored evidence. |
| Assessment Memory | `assessment.create/list/get` | Deliberate saved operator judgment, not evidence. |
| Watch/Radar | `watch.schedule`, `watch.executor.*`, actor/system watches | Active routine check state, separate from Marked attention. |
| Settings/Diagnostics | `app.readiness`, corpus health, tasks, snapshot, trace pack, SDE import | Support state, not the first investigation journey. |

## First Screen Layout

### 1. Console Header

Purpose: make Atlas feel ready for investigation without hiding trust state.

Show:

- product identity: `AURA Atlas`
- current workspace title: `Investigation`
- compact stage rail: `Lead -> Leads -> Enrich -> Evidence -> Observe -> Remember`
- live lookup state component
- Settings/Diagnostics access

Do not show service count, task JSON, API logs, raw readiness paths, or broad scope forms in the first viewport.

### 2. Lead Command Region

Purpose: answer "Who are we going to uncover today?"

Primary controls:

- lead input
- lead type segmented control: `Actor`, `System`, `Radius`
- actor type segmented control only when `Actor` is selected: `Pilot`, `Corp`, `Alliance`
- radius slider/stepper only when `Radius` is selected
- contextual lookback/cap controls only after the operator chooses a discovery/watch/report action

Primary actions:

- `Check lead`
- `Discover possible leads`
- `Review queue`
- `Load stored evidence`

Boundary copy:

```txt
Typing or checking a lead does not call zKill or ESI, queue refs, create evidence, refresh labels, save assessment memory, or start watches.
```

### 3. Lead State Strip

Purpose: keep the operator oriented without making them read backend payloads.

States:

- Empty: `Enter a pilot, corp, alliance, system, or radius lead.`
- Draft: `Ready to check locally.`
- Local resolved: `Resolved locally. No live calls made.`
- Needs durable ID: `Name accepted for discovery; stored reports need a durable ID.`
- Blocked: specific validation reason.
- Deferred input type: `zKill links and killmail ID paste are deferred in this slice.`

Details drawer:

- normalized scope
- durable IDs
- local SDE resolution detail
- backend validation message

### 4. Local / Stored Context Panel

Purpose: answer "Does Atlas already know anything?" without taking over the flow.

Show:

- stored evidence match state
- evidence count and activity-event count if available
- most recent observed item or a short observation preview if available
- Marked state when available
- Watch status only if an active watch exists
- assessment memory count or latest saved memory signal if available

Interaction:

- use a drawer or lower panel for full stored context
- do not replace the current lead flow when opened
- absence of context should read as neutral, not safe/clear

Boundary copy:

```txt
Stored context is read-only here. A local match is not proof of threat, ownership, affiliation, staging, intent, or current presence.
```

### 5. Next Action Rail

Purpose: make the next safe step obvious.

The rail should show one primary next action based on the current stage:

| Stage | Primary next action | Secondary route |
| --- | --- | --- |
| Empty/Draft lead | `Check lead` | Settings if blocked |
| Valid lead, no queued refs | `Discover possible leads` | Load stored evidence |
| Queued refs exist | `Review queue` | Load stored evidence |
| Selected refs | `Enrich selected` | Adjust selection |
| Evidence exists | `View evidence story` | Refresh labels, if needed |
| Observation reviewed | `Save assessment memory` | Open full report |

### 6. Story Workspace

Purpose: give the operator the "oh, that's cool" surface after evidence exists.

First story surface should be a battle timeline or observation preview from existing structured reports:

- chronological events
- who died, when, where
- visible attacker/victim/org labels where report data supports them
- evidence basis above the story
- warnings beside the affected story section

Relationship graphs, footprint maps, fight clustering, AI commentary, and final intelligence surfaces remain deferred.

### 7. Details And Drawers

Purpose: keep expert/debug data accessible without making it the primary UI.

Use details/drawers for:

- raw IDs and hashes
- normalized scope payloads
- discovered-by fields
- queue keys and skip reasons
- task/run IDs
- API request logs
- service names
- raw report response
- metadata run details
- SDE import/build detail
- snapshot/trace-pack file paths

Small "peek" displays are acceptable when they help trust: durable ID, evidence count, selected ref count, expected ESI calls, sample status, and label freshness.

## Stage Grammar

### Lead

Operator sees:

- one input
- lead type controls
- local validation state
- local/stored context status
- clear next action

Available action:

- check/validate local lead
- load stored evidence if durable enough
- route into discovery preflight

Hidden/deferred:

- full scope forms
- raw normalized payload
- service names
- task internals

Boundary copy:

```txt
Checking this lead is local validation. It does not call live providers or change stored evidence.
```

States:

- Loading: `Checking local scope...`
- Empty: `No lead entered yet.`
- Blocked: exact validation issue.
- Degraded: local resolver can use label, but durable ID is needed for some reports.
- Error: backend validation message with no evidence implication.

### Discovery / Possible Leads

Operator sees:

- discovery scope summary
- provider effect: zKill only
- lookback and cap
- expected zKill calls
- confirmation

Available action:

- `Discover possible leads`

Hidden/deferred:

- endpoint detail
- run/task JSON
- queue key construction
- at-a-glance raw JSON

Boundary copy:

```txt
Discovery calls zKill and queues possible refs only. It does not call ESI or create stored killmail evidence.
```

States:

- Loading: `Finding possible leads...`
- Empty: `No possible leads queued for this scope.`
- Blocked: live lookup off, user-agent missing, invalid scope, cap invalid.
- Degraded: partial provider failure or warnings.
- Error: task failure with trace/detail route.

### Queue Review

Operator sees:

- queued possible refs
- selected count
- pending/expanded/cached/failed/superseded counts
- compact preview fields when available
- expected ESI calls for selected refs
- selection mode and cap

Available action:

- select refs
- adjust cap
- preflight `Enrich selected`

Hidden/deferred:

- `discovered_by_type`
- `discovered_by_id`
- queue row keys
- hashes unless relevant to trust

Boundary copy:

```txt
Queued refs are possible leads. They are not evidence until Enrich selected succeeds through ESI.
```

States:

- Loading: stable busy state, no button flicker.
- Empty: `No queued possible leads for this scope.`
- Blocked: no durable queue filter or no selected refs.
- Degraded: failed refs present but selectable refs remain.
- Error: queue selection failed, no enrichment started.

### Enrich Selected

Operator sees:

- selected ref count
- expected ESI calls
- max expansions
- expected stored writes: expanded killmails and activity events
- live lookup state
- confirmation checkbox or equivalent explicit acknowledgement

Available action:

- `Enrich selected`

Hidden/deferred:

- raw ESI endpoint detail
- fetch run payload
- task JSON

Boundary copy:

```txt
Enrich selected calls ESI. Successful expansion creates stored expanded killmail evidence and derived activity events.
```

States:

- Loading: `Enriching selected refs through ESI...`
- Empty: `Select queued refs before enrichment.`
- Blocked: live lookup off, missing confirmation, invalid selection, cap zero.
- Degraded: some refs failed; successful refs remain evidence.
- Error: no hidden retry or background continuation.

### Evidence

Operator sees:

- evidence basis
- sample status
- killmail count
- activity-event count
- evidence window
- source/provenance summary
- warnings that affect trust

Available action:

- view story/observation
- open report details
- refresh labels only when label status warrants it

Hidden/deferred:

- raw ESI payload
- checksums
- full activity-event table
- ingestion audit rows

Boundary copy:

```txt
Evidence means stored expanded ESI killmails and derived activity events. It does not by itself prove intent, affiliation, ownership, staging, or current presence.
```

States:

- Loading: `Loading stored evidence...`
- Empty: `No stored ESI evidence for this scope yet.`
- Blocked: report requires durable actor/system ID.
- Degraded: missing labels, partial sample, warning groups.
- Error: report load failed; no live calls were made.

### Observation

Operator sees:

- battle timeline preview
- observed systems
- observed ships
- repeated pilots/corps/alliances where report data supports it
- activity cadence or evidence-backed counts
- warnings beside affected sections

Available action:

- filter/inspect
- open full report
- proceed to assessment memory when actor report context is eligible

Hidden/deferred:

- raw section rows
- renderer-derived inference
- relationship graph/fight clustering unless later accepted

Boundary copy:

```txt
Observations are patterns rendered from stored evidence. They are not automatic assessment or proof of motive.
```

States:

- Loading: `Rendering observations from stored evidence...`
- Empty: `No observation rows available for this evidence scope.`
- Blocked: evidence context unavailable.
- Degraded: warning badges, missing labels, sample limits.
- Error: report response unavailable.

### Assessment Memory

Operator sees:

- eligible actor evidence context
- citation basis
- cited killmail IDs
- reason/summary inputs
- optional scores
- confirmation
- saved memory list/detail

Available action:

- `Save assessment memory`

Hidden/deferred:

- `assessment_artifact` implementation label
- backend row IDs except in detail
- retention/compaction language unless explicitly in a support context

Boundary copy:

```txt
Assessment memory is deliberate saved operator judgment. It is not evidence and does not change stored killmails or activity events.
```

States:

- Loading: `Checking assessment context...`
- Empty: `Load an actor evidence report before saving assessment memory.`
- Blocked: no citation basis, no reason/summary where required, radius context only.
- Degraded: citations partially validated or warnings present.
- Error: save failed; evidence remains unchanged.

### Watch / Radar

Operator sees:

- active watch status
- due/blocked/backoff/inactive state
- last checked and next eligible check
- live lookup gate
- session armed/disarmed state
- one due dispatch limit if armed

Available action:

- author watch
- arm/disarm session
- inspect watch schedule

Hidden/deferred:

- watchlist table language
- executor tick internals
- run IDs unless opened
- task payloads

Boundary copy:

```txt
Watch means active routine checking. Watch implies Marked, but Marked does not imply Watch. Page load and refresh do not run collection.
```

States:

- Loading: `Checking watch schedule...`
- Empty: `No active watches configured.`
- Blocked: session not armed, live lookup off, backoff, task lock, invalid scope.
- Degraded: failed last run or warnings.
- Error: schedule unavailable; no watch dispatch started.

### Settings / Diagnostics

Operator sees:

- readiness
- runtime paths
- SDE topology/inventory status
- corpus health
- task history/detail
- snapshot
- trace pack
- service/API detail

Available action:

- prepare runtime paths
- refresh readiness
- create snapshot after preflight/confirmation
- generate trace pack
- import/build SDE through explicit controls

Boundary copy:

```txt
Diagnostics explain whether Atlas can operate. They are not investigation evidence or observations.
```

States:

- Loading: stable per-panel busy state.
- Empty: no local data yet.
- Blocked: setup requirement with route back to the affected setting.
- Degraded: warnings that do not block the current investigation.
- Error: diagnostic failure with support route.

## Navigation Disposition

Recommended top-level destinations:

```txt
Investigation
Watch / Radar
Reports / Observations
Settings / Diagnostics
```

Disposition of current surfaces:

- `Investigation` remains primary and becomes the guided pipeline shell.
- `Readiness` moves under `Settings / Diagnostics`.
- `Scopes` becomes contextual refinement controls and an advanced details drawer.
- `Tasks` moves under `Settings / Diagnostics`, with compact task status surfaced in context.
- `Queue / Watches` splits conceptually: queue review belongs in Investigation; Watch/Radar is active routine checking.
- `Actions` becomes action preflights reached from the stage that needs them, not a top-level first-path destination.
- `Reports` becomes `Reports / Observations` or is reached as the story surface after evidence exists.

This is a presentation/navigation disposition only. It does not require backend, IPC, database, or service renames.

## Provisional Copy Constraints

### Terms Safe In Primary Copy

- Lead
- Discovery
- possible leads
- Queue review
- Enrich selected
- Evidence
- Observation
- Assessment Memory
- Marked
- Watch
- Live lookup state
- Settings / Diagnostics

### Terms To Keep In Details Or Backend Context

- `discovered_by_type`
- `discovered_by_id`
- `discovered_killmail_refs`
- `assessment_artifact`
- metadata hydration
- raw ESI payload
- scope normalized payload
- service registry
- task classification
- fetch run
- API request log
- watchlist row

### Draft Aliases Requiring Authority Review

These may be used in the spec as draft presentation language, not accepted doctrine:

- `Refresh labels` for metadata hydration.
- `Live lookups` or `Power on live lookups` for live/API gate state.
- `Reports / Observations` as a navigation label.
- `Watch / Radar` as a watch-system navigation label.
- `View evidence story` for the first story surface.

### Avoid In Primary Copy

Avoid proof or certainty words unless a deliberate assessment explicitly supplies them:

- owns
- stages
- belongs to
- is hostile
- is affiliated
- intends
- clear system
- danger/threat level
- intelligence product

Red/yellow/green visual language is acceptable for operational state only if labels remain precise: blocked, caution/warning, ready, due, inactive, failed, degraded. It should not imply threat, safety, or hostility by itself.

## Power On Disposition

Recommendation: treat `Power on live lookups` as a provisional Human-facing concept, but specify the UI component as `Live Lookup Gate` until terminology authority settles exact copy.

Required component behavior:

- visible globally in the console header or trust strip
- states: `Local-only`, `Off`, `Blocked`, `Enabled`, `Running action`
- never starts work by itself
- never arms watches by itself
- never discovers, enriches, hydrates, assesses, or writes evidence by itself
- per-action preflight still names provider, call estimate, write effect, cap, and confirmation need

Safe working copy:

```txt
Live lookups off
Live lookups enabled
Blocked: live API not enabled
Local-only action
```

If the Human prefers the more theatrical command-console feel, the button/label can read:

```txt
Power on live lookups
```

But the underlying presentation rule should remain:

```txt
Power on is permission/status, not collection.
```

## Future Bounded Dev Packet Recommendation

If Human and Overseer accept this spec, the next Dev packet can be:

```txt
Renderer Intel Console Progressive Disclosure
```

Purpose:

Convert the existing renderer presentation into a first-pass guided Investigation console using only current services and IPC boundaries.

Bounded scope:

- renderer presentation and copy only
- no backend/service/database/IPC renames
- no new live/API behavior
- no new evidence semantics
- no new persistence semantics
- no final Record/Intelligence/Finding naming
- no relationship graph, map, fight clustering, or AI commentary

Likely Dev work:

- simplify top-level navigation to the recommended disposition, preserving access to all existing surfaces
- make Investigation the first-path pipeline shell
- move broad readiness, scopes, actions, tasks, and raw queue/watch internals behind Settings/Diagnostics, details, or contextual stage panels
- make scope controls point-of-need slicers for lead/action stages
- stabilize loading/empty/blocked/degraded/error states for queue/watch/action buttons
- add a compact live lookup gate component that does not trigger actions
- make Discovery, Queue Review, Enrich Selected, Evidence, Observation, and Assessment Memory boundaries visible in copy
- render the first battle-timeline/observation preview only from existing structured report responses

Likely verification:

```powershell
npm.cmd run verify:renderer-shell
npm.cmd run smoke:electron
```

If broad evidence/report/live-gate copy changes are made, Overseer may also require:

```powershell
npm.cmd run verify:all
```

## Acceptance Checks For Future Dev

- App opens to an investigation-first console, not readiness/settings first.
- Passive startup and navigation do not call zKill/ESI, queue refs, enrich evidence, hydrate labels, assess, arm watches, or execute watches.
- Lead typing and `Check lead` remain local validation only.
- The operator can see the current stage and one primary next action.
- Scopes appear as point-of-need refinement, not as a first-screen wall of fields.
- Discovery copy says zKill refs are possible leads, not evidence.
- Queue Review never labels queued refs as evidence.
- `Enrich selected` preflight states ESI calls, selected refs, cap, expected writes, and evidence effect.
- Live lookup gate is visible, but does not trigger collection or weaken per-action preflights.
- Evidence story surfaces show evidence basis before observations.
- Observations use observed/evidence-derived language and avoid proof claims.
- Assessment Memory remains deliberate, cited, and separate from evidence.
- Watch/Radar language appears only for active routine checking; Marked remains attention/tagging.
- Settings/Diagnostics preserves readiness, SDE, corpus health, task, snapshot, trace, raw IDs, and service detail access.
- Loading, empty, blocked, degraded, and error states are visually distinct and stable.
- Electron smoke can verify the first screen, navigation targets, passive startup copy, live gate state, and stage boundary labels.

## Risks

- `Power on` can accidentally sound like a background collection switch unless every live action still has a preflight.
- Moving Scopes out of primary view can hide caps unless the point-of-need slicers are visible before live discovery, enrichment, or watch execution.
- Red/yellow/green visual style can overclaim danger/safety if not tied to operational state labels.
- A battle timeline can imply a coherent fight or motive unless evidence basis and observation boundaries are always adjacent.
- Queue Review and Watch/Radar share current surfaces; presentation separation must not pretend the backend was renamed.
- Watch implies Marked, but Marked should not be presented as a required step before Watch authoring unless the Human accepts that workflow control.

## Human / Overseer Questions

- Should the global control label be `Live lookups` or `Power on live lookups`?
- Should the first Dev pass reduce top-level navigation immediately, or keep existing nav labels while changing visual priority first?
- Should Watch/Radar be a primary top-level surface in the first Dev pass, or remain secondary until the investigation console lands?
- Should the stored context drawer be a right-side drawer, lower sliding panel, or inline expandable strip?
- Should zKill link / killmail ID paste remain deferred, or become the first new lead input after the presentation pass?
- How tactical can the color language become before it needs explicit Human acceptance for threat semantics?

## Files Reviewed

- `AGENTS.md`
- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/current.md`
- `F:\Projects\Docs\Aura-Project-Orchestration\profiles\AURA-Atlas\ui-ux-specialist.md`
- `docs/audits/audit-2026-05-24-local-alpha-human-ui-trial.md`
- `workspace/UIUXHS34-operator-experience-story-pass.md`
- `workspace/OverseerHS35-operator-experience-advisory-review.md`
- `workspace/OverseerHS35A-terminology-authority-correction.md`
- `docs/features/presentation-layer-information-index.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-terminology-and-retention.md`
- `docs/roadmap/operator-investigation-desk.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-report-products.md`
- `docs/current-state/current-manual-discovery-lane.md`
- `docs/contracts/scope-definition-contract.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `src/renderer/index.html`
- `src/renderer/investigation.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/liveApiGateService.js`
- targeted source search across `src/renderer`, `src/main/services`, and `src/main/scopes`

## Verification

No code verification was required for this specification packet.

Required status check:

```powershell
git status --short --branch
```

Result to be recorded in `workspace/current.md` after artifact creation.
