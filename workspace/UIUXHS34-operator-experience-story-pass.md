# UIUXHS34: Operator Experience Story Pass

Date: 2026-05-24
Role: UI/UX Specialist
Status: Advisory - for Human and Overseer acceptance
Milestone: Operator Experience Story Pass

## Request Received

`workspace/current.md` asks for a specialist planning pass that converts the Human local-alpha UI trial friction into concrete operator stories, presentation priorities, and one bounded Dev-ready recommendation. This pass must not implement code, authorize live/API behavior changes, redefine product doctrine, or make Readiness/Scopes/backend internals the primary operator journey.

Update after Human correction and follow-up grounding:

```txt
The first Dev-shaped recommendation in this advisory was withdrawn after Human correction.
The recommendation below is reissued only after a follow-up grounding pass through Atlas documentation, source code, existing renderer surfaces, zKillboard review, and the Human's historical intel-console references.
It remains advisory for Human/Overseer acceptance.
```

Expected handoff:

```txt
workspace/UIUXHS34-operator-experience-story-pass.md
```

## Intent Read

Atlas should feel less like a network configuration console and more like an operator investigation desk.

The first experience should answer:

```txt
Who or where is the lead?
What can Atlas safely show from stored information?
What possible leads exist?
What becomes evidence only after explicit action?
What story can be read from stored evidence?
What is worth deliberately remembering?
```

The current backend/service shell is strong enough for local alpha. The next presentation risk is not missing capability; it is showing too much technical structure too early, using abstract labels, and making the operator feel they are configuring the machine instead of following a discovery path.

## Grounded Recommendation

Adopt an **Intel Console Guided Pipeline** presentation model.

Atlas should keep the command-console feel the Human showed in historical mockups, but the interaction model should follow the real Atlas data pipeline:

```txt
Lead
-> Discovery
-> Queue Review
-> Enrich
-> Evidence
-> Observation
-> Assessment
```

This is not a new backend pipeline. It is a human-facing map over the existing services:

```txt
scope.validate
-> live.gate
-> manual.discovery / watch execution
-> discovered_killmail_refs
-> queue.selection
-> manual.expansion
-> killmails + activity_events
-> report.* responses
-> metadata.hydration where needed
-> assessment.create after review
```

The UI should make those stages feel intentional and satisfying without exposing every scope field, task field, run ID, or backend payload up front.

## Recommended Interface Shape

### 1. Investigation Console As The Primary Surface

The opening experience should be an intel console centered on a lead:

- one command/lead input
- lead type selector
- compact local match / stored evidence signal
- compact live/API trust state
- current stage indicator
- clear next action

This screen should not behave like a settings dashboard or service registry.

### 2. Point-Of-Need Slicers

Replace broad always-visible scope forms with contextual slicers tied to real existing controls:

- lookback window
- radius jumps
- max systems
- max refs / refs per system
- max expansions
- queue selection mode
- report evidence window
- watch poll interval
- watch session armed/disarmed
- live lookup enabled/blocked

Recommended controls:

- sliders or steppers for radius, lookback, caps, and max expansions
- segmented controls for actor/system/radius and character/corporation/alliance
- toggles for live lookup permission, session armed, include failed refs, and active watch state
- chips for selected lead, selected scope, selected queued refs, and active filters
- drawers for normalized payloads, raw IDs, API logs, task JSON, and backend defaults

Slicers should appear at the moment they affect a decision, not as a large generic Scopes page at startup.

### 3. Settings And Diagnostics Out Of The Main Flow

Move these toward Settings / Diagnostics:

- Readiness
- runtime paths
- SDE import state
- corpus health
- snapshots
- debug trace packs
- service counts
- task payloads
- raw IDs and normalized JSON
- API request logs
- run IDs
- backend defaults

If a setting blocks the current action, show a compact blocker in the current context with a route to Settings. Do not make the operator start in Settings.

### 4. Discovery And Queue As A Review Tray

Discovery should produce a reviewable tray, not an evidence-looking report.

UI language:

```txt
Possible leads found.
Not evidence yet.
Select refs to enrich.
```

The queue tray should show:

- source/scope
- pending / failed / cached / expanded / superseded counts
- selected refs
- expected ESI calls
- expansion cap
- preview fields where available
- clear evidence boundary

### 5. Enrich As A Trust Checkpoint

`Enrich selected` should be the explicit moment where possible refs can become stored evidence.

The preflight should show:

- selected ref count
- expected ESI calls
- expected writes
- cap
- live gate state
- warning/error state
- confirmation

It must remain separate from metadata hydration.

### 6. Evidence And Observation As Story Panels

Reports should be rendered as story panels over backend-owned structured responses:

- evidence basis strip
- sample status
- recent timeline
- observed systems
- observed ships
- event-time corporations/alliances
- activity cadence
- final blows
- multi-system presence for radius reports
- warnings and data quality state

The renderer must not infer new conclusions from the rows. It should present what the backend report already returns.

### 7. Watch As Sector Radar, Mark As Attention

Use the Human's watchlist mockup as the visual direction for Watch/Radar surfaces:

- rows or tiles for actor/system watches
- due / blocked / backoff / inactive state
- last checked
- next eligible check
- live/API gate
- ships/refs/evidence counts only when grounded
- red/yellow/green-style scan grammar only for operational state unless a human assessment supplies threat meaning

Keep the accepted semantic split:

```txt
Marked = attention / tag / keep visible
Watch = active routine checking
Watch implies Marked
Marked does not imply Watch
```

Do not present automated `danger`, `threat`, or `doctrine` claims unless a later accepted model or assessment layer explicitly supports them.

### 8. Assessment Memory As Deliberate Capture

Assessment memory belongs after reviewed actor evidence context.

It should feel like saving an operator memory, not creating evidence:

- reason / summary
- optional scores
- citation basis
- cited killmail IDs
- confirmation
- saved memory list/detail

Radius/area-context assessment remains deferred unless separately accepted.

## Recommended Navigation Model

Use fewer primary destinations:

```txt
Investigation
Watch / Radar
Reports / Observations
Settings / Diagnostics
```

Implementation detail:

- Existing `Scopes` becomes contextual slicers and an advanced drawer.
- Existing `Actions` becomes action preflights reached from Investigation.
- Existing `Queue / Watches` splits conceptually into Queue Review and Watch/Radar, even if the first implementation keeps the same underlying services.
- Existing `Readiness`, corpus health, snapshots, trace packs, and task detail move under Settings / Diagnostics.

This is a presentation/navigation recommendation only. It does not require backend renames.

## Recommended First Accepted Work Boundary

Do not go straight to broad Dev implementation.

Recommended next accepted work is a short Overseer/UI-UX integration packet:

```txt
Operator Intel Console Presentation Specification
```

Purpose:

- turn this recommendation into screen-level guidance
- define first-screen layout
- define stage grammar
- define slicer controls and when they appear
- define drawer/detail rules
- define copy rules for each pipeline stage
- define loading/empty/error states
- define what can be verified in Electron smoke

If Human and Overseer decide to proceed directly to Dev after that specification, the first implementation should be renderer-presentation-only and should not change service behavior, evidence semantics, live/API gates, or persistence.

## Operator Stories

### 1. Start From A Lead, Not A Control Panel

Operator intent:
I saw a pilot, corporation, alliance, system, or area of interest and want Atlas to help me start.

Plain-language UI promise:
Enter the thing you want to uncover. Atlas will tell you what it can safely check next.

Primary information shown:

- lead input
- lead type in human terms
- short validation result
- one clear next action
- compact live/API state

Secondary/detail information hidden or deferred:

- normalized scope payloads
- backend defaults
- raw IDs unless useful as a small peek
- service names and task internals

Safety/evidence boundary:
Typing or validating a lead must not call live APIs, queue discovery, create evidence, mark, watch, or save assessment memory.

Acceptance check:
On app start, the first path reads as an investigation start. The operator can enter a lead and see a safe next step without first understanding Readiness, Scopes, Queue, or service counts.

### 2. Show What Atlas Already Knows Without Taking Over The Flow

Operator intent:
Before I spend live/API calls or expand anything, tell me whether this lead already has useful local context.

Plain-language UI promise:
Atlas can show stored evidence and prior assessment context if it exists, without disrupting the current investigation.

Primary information shown:

- discreet known/local match state
- evidence count or "no stored evidence yet"
- most relevant recent/local observation preview when available
- link or drawer affordance for more

Secondary/detail information hidden or deferred:

- full report text
- raw killmail IDs
- citation lists
- warning groups
- assessment artifact internals

Safety/evidence boundary:
Stored context is read-only in this step. A known match is not proof of threat, affiliation, staging, or intent.

Acceptance check:
When a lead has local stored evidence, the UI signals it in place and allows a drawer/detail reveal without clearing the current lead flow. When no context exists, the empty state is plain and non-alarming.

### 3. Power Live Lookup Clearly, But Keep Action Gates Explicit

Operator intent:
I need to know whether Atlas is allowed to use zKill/ESI right now and what will happen if I ask it to.

Plain-language UI promise:
One global live lookup affordance tells you whether live discovery/enrichment can be used. Specific actions still show their own preflight before calls or writes.

Primary information shown:

- single compact "Power on live lookups" state/control or equivalent copy
- enabled/disabled/refused state
- short reason when blocked
- per-action preflight at the moment of discovery or enrichment

Secondary/detail information hidden or deferred:

- provider names unless relevant to the action
- environment variables
- endpoint logs
- caps and call estimates until an action needs them
- task/run IDs

Safety/evidence boundary:
"Power on" must not start discovery, enrichment, hydration, watch execution, or assessment creation. It is an affordance/status for permission and trust, not a collection action.

Acceptance check:
The operator can tell at a glance whether live lookup is available, but every live action still requires an explicit action with provider/call/write/evidence-effect copy.

### 4. Review Possible Leads Before Evidence Creation

Operator intent:
After Atlas discovers possible killmail refs, I want to choose what is worth enriching.

Plain-language UI promise:
These are possible leads. Select what to enrich; enrichment calls ESI and creates stored evidence.

Primary information shown:

- possible lead list
- source/scope summary
- selected count
- expected ESI calls and evidence write effect
- stable loading/busy state

Secondary/detail information hidden or deferred:

- queue keys
- hashes
- discovered_by internals
- skip reasons unless needed
- full preview JSON

Safety/evidence boundary:
Possible leads are not evidence. zKill preview fields are discovery/provenance metadata only. Evidence begins when selected refs are expanded through ESI.

Acceptance check:
Queue/preview surfaces never label pending refs as evidence. `Preview queue` and related actions use stable busy/empty/error states without flicker or label churn.

### 5. Tell The Combat Story From Stored Evidence

Operator intent:
Once evidence exists, show me what happened in a way I can scan and understand.

Plain-language UI promise:
Atlas can turn stored killmail evidence into an evidence-bounded combat story.

Primary information shown:

- evidence basis
- chronological battle timeline preview
- who died, when, where, and visible actor/org roles
- warnings that affect trust

Secondary/detail information hidden or deferred:

- raw ESI payloads
- full participant tables
- all event rows
- report export text
- relationship graph/fight clustering

Safety/evidence boundary:
The story is an observation derived from stored evidence. It must not imply intent, formal affiliation, ownership, staging, or current presence without deliberate assessment.

Acceptance check:
After evidence exists, the primary report surface leads with an observation/story preview before raw report structure, while keeping evidence basis and warnings visible.

### 6. Save Deliberate Memory Only After Review

Operator intent:
After reviewing evidence and observations, I may want Atlas to remember my assessment.

Plain-language UI promise:
Assessment memory is a deliberate saved judgment with cited context.

Primary information shown:

- summary/reason fields
- citation basis
- confidence/citation status
- confirmation requirement

Secondary/detail information hidden or deferred:

- artifact row names
- source run IDs
- backend validation payloads
- full citation internals unless expanded

Safety/evidence boundary:
Assessment memory is not raw evidence and does not replace evidence. It cannot justify deletion, compaction, live action, or broader intelligence claims by itself.

Acceptance check:
The operator cannot accidentally create assessment memory from discovery-only context. Save copy makes clear that this is remembered judgment, not evidence.

## Progressive Flow Recommendation

### First Operator Path

Recommended primary journey:

```txt
Lead
-> Local/stored context check
-> Possible leads / discovery review
-> Enrich selected preflight
-> Evidence-backed story / observation
-> Assessment memory
```

This should be the default mental model even if some steps are unavailable for a given lead or offline fixture state.

### Diagnostics / Settings

These should remain accessible but should not dominate the first path:

- Readiness
- runtime paths
- SDE/import details
- corpus health
- provider gate details
- snapshots
- trace packs
- service inventory
- task history
- API request logs

Readiness should answer "Can Atlas operate locally?" rather than "What are we investigating?"

### After A Lead Or Action Exists

These should appear only when the operator has a reason to care:

- scope refinement
- queue filters
- watch configuration/status
- selected refs
- provider call estimates
- report raw IDs
- hydration/label refresh
- detailed warnings
- backend provenance

Scopes are useful, but they should feel like refinement and confirmation, not the opening burden.

## Power On Recommendation

Accept the "Power on" idea as one global operator-facing live/API affordance, with strict boundaries.

Recommended meaning:

```txt
Power on live lookups = live provider access is allowed for explicit operator actions in this session/context.
```

It should be a presentation and copy unification first. It must not become a hidden action runner.

Recommended copy posture:

- Primary label: `Power on live lookups`
- Off/refused state: `Live lookups off`
- Action preflight example: `Enrich selected will call ESI and create stored killmail evidence.`
- Detail drawer terms: zKill, ESI, caps, expected calls, refusal reason, environment gates

Do not use "Power on" to collapse discovery, enrichment, hydration, or watch execution into one action. Those remain distinct.

## Accepted Presentation Direction

- Investigation should open as a discovery/story journey.
- Readiness should move toward diagnostics/settings framing.
- Scopes should become progressive refinement after a lead/action, not a first-screen wall of choices.
- Queue and Watch controls need stable feedback states and less abstract labels.
- Live/API state should be one compact operator-facing affordance plus action-specific preflight details.
- Story surfaces should start with a chronological evidence-backed combat timeline, not graph/map/fight clustering.
- Raw IDs, JSON, queue internals, service counts, and task payloads should remain available through details/drawers.

## Rejected Or Deferred Ideas

- No code implementation in this packet.
- No live/API behavior change.
- No automatic discovery, enrichment, hydration, watch execution, or assessment creation.
- No final decision on `Record`, `Intelligence`, `Finding`, or final assessment naming.
- No broad relationship graph, map surface, fight clustering, AI commentary, or public release work.
- No shared/Lab presentation doctrine adoption unless promoted by a later Atlas milestone.
- No evidence deletion, pruning, or compaction behavior.

## Withdrawn Dev Packet Recommendation

Withdrawn after Human correction.

The following packet title and scope are preserved only as a record of the earlier specialist proposal. They should not be treated as a current recommendation, accepted runway, or Dev instruction.

Earlier proposed packet:

```txt
Operator Investigation Presentation Simplification
```

Scope:

- Make the opening renderer experience read as the lead-driven Investigation path.
- Demote Readiness into diagnostics/settings presentation without removing existing capabilities.
- Reduce Scopes front-loading; surface scope detail after a lead or action needs refinement.
- Add or rename one global live/API affordance around "Power on live lookups" as a copy/state presentation layer only.
- Stabilize `Refresh watches` and `Preview queue` feedback so loading, empty, success, blocked, and error states do not flicker or ambiguously relabel.
- Reframe possible leads, queue review, and enrichment copy so Discovery and Evidence remain visibly distinct.
- Add the first small story surface from existing structured report responses: evidence basis plus chronological combat timeline/observation preview.
- Keep raw IDs, normalized payloads, task JSON, queue internals, provider details, and service diagnostics in detail areas.

Non-goals:

- no backend provider behavior changes
- no new live execution path
- no relationship graph or fight clustering
- no final Record/Intelligence/Finding semantics
- no destructive or retention behavior

Likely verification:

```powershell
npm.cmd run verify:renderer-shell
npm.cmd run smoke:electron
```

If the Dev packet touches evidence copy, report rendering, or live-gate copy broadly, Overseer may also require:

```powershell
npm.cmd run verify:all
```

## Acceptance Checks For Dev Packet

- App start presents an investigation-first path rather than a readiness-first console.
- The operator can enter a lead and see a safe next step without opening Scopes first.
- Readiness remains available and truthful as diagnostics/settings.
- Scopes are accessible as refinement/detail, not primary first-screen content.
- One compact live/API affordance is visible and understandable.
- "Power on" does not trigger live calls, writes, queue mutation, watch execution, or assessment creation.
- Discovery/pending queue refs are labelled as possible leads, not evidence.
- Enrichment preflight clearly states ESI calls and stored evidence effect.
- Story/observation copy uses evidence-bounded language.
- Assessment memory remains deliberate and cited.
- Loading, empty, blocked, degraded, and error states are visually distinct and stable.
- Raw technical detail remains available through drawers/details.
- Electron smoke can verify the visible presentation changes.

## Risks

- "Power on" could accidentally imply broad background collection unless copy and preflight boundaries stay explicit.
- Demoting Readiness too aggressively could hide genuine setup failures from less technical operators.
- A battle timeline can overclaim if it is not paired with evidence basis and observation language.
- Reducing Scopes front-load must not remove the operator's ability to understand caps, radius, or provider effect before live/API work.
- Flicker fixes may reveal that some actions need clearer task-state modeling; keep any implementation packet bounded.

## Questions For Human Or Overseer

- Is `Power on live lookups` acceptable wording, or should it be shorter such as `Live lookup power`?
- Should the first story surface be a compact timeline embedded in Investigation, or a guided jump into Reports after enrichment?
- Should known local context be a drawer from the Investigation screen, or a persistent lower panel as the Human previously suggested?
- Should zKill links/killmail IDs be accepted in the next UI pass, or remain deferred behind current actor/system/radius inputs?
- What warning threshold makes a data-quality issue primary rather than detail-only?

## Files Reviewed

- `AGENTS.md`
- `workspace/overview.md`
- `workspace/current.md`
- `workspace/00-dot-protocol.md`
- `F:\Projects\Docs\Aura-Agent-Coordination\roles\ui-ux\README.md`
- `docs/audits/audit-2026-05-24-local-alpha-human-ui-trial.md`
- `docs/audits/audit-2026-05-24-local-alpha-readiness-closure.md`
- `docs/roadmap/operator-investigation-desk.md`
- `docs/features/presentation-layer-information-index.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-report-products.md`
- `docs/current-state/current-manual-discovery-lane.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/complete/milestone-local-alpha-trial-readiness/OverseerHS33-local-alpha-readiness-closure.md`

## Verification

No code verification was required for this specialist planning packet.

Required status check run:

```powershell
git status --short --branch
```

Observed before artifact creation:

```txt
## main...origin/main
?? workspace/terminology-bridge-audit-2026-05-24.md
```

The untracked terminology bridge audit was pre-existing to this pass and was not modified.
