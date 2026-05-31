# AtlasLabAdoptionHS45: Presentation Pattern Review

Date: 2026-05-24
Role: Atlas Overseer
Status: Atlas-local adoption record, advisory until promoted into a Dev runway

## Decision

Accepted with limits.

Atlas may adapt selected Lab presentation patterns that improve renderer clarity, but Lab remains advisory only. Atlas owns Evidence, Discovery, Watch, Marked, storage, provenance, report meaning, and renderer command semantics.

The first bounded prototype should remain:

```txt
Evidence Stack + Provenance Drawer
```

Prototype scope:

- renderer-only
- one primary evidence/discovery-adjacent stack surface
- one demoted provenance/detail drawer
- no backend, persistence, contract, payload, service, IPC, schema, or command renames

## Current Executor Check

`workspace/current.md` currently names Dev as executor for HS43 Intel Console Face And Layout Refinement.

This adoption record is appropriate as Overseer advisory work because it does not implement code, alter the current Dev runway, or instruct Dev directly beyond future adoption guidance. No active Atlas packet conflict was found.

## Lab Source Consulted

- `F:\Projects\AURA- Lab\workspace\LabRemoteConsumerConformanceHS66.md`
- `F:\Projects\AURA- Lab\workspace\archive\cross-project-relay\AtlasImportAdvisoryHS64-lab-presentation-adoption.md`

Lab source status:

- Lab is presentation-pattern input only.
- Lab is not Atlas source-project authority.
- Lab does not own Atlas terms, contracts, storage, provenance, evidence, watch, or renderer semantics.

## Atlas Source Consulted

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-report-products.md`
- `docs/current-state/current-manual-discovery-lane.md`
- `docs/current-state/current-terminology-and-retention.md`
- `src/renderer/index.html`
- `src/renderer/investigation.js`
- `src/renderer/styles.css`
- `scripts/verify-renderer-shell.js`

## Current Atlas Presentation-State Understanding

Atlas already has the backend and bridge pieces needed for a renderer-only presentation prototype:

- zKill discovery refs are possible leads.
- ESI expanded killmails are durable Evidence.
- `killmails` and `activity_events` support reports and observations.
- Observation is report-layer meaning derived from stored Atlas Evidence.
- Assessment Memory is deliberate saved operator judgment and is not evidence.
- Watch is active routine checking.
- Marked is attention/interest and does not imply active checking.
- Collection provenance lives in provider/run logs, queue metadata, evidence basis, and report responses.

The renderer currently exposes many of these distinctions, but still needs clearer hierarchy and less diagnostic crowding. HS43 is already handling the immediate face/layout pass. Lab adoption should therefore target a future focused evidence/readability prototype, not interrupt HS43.

## Lab Patterns Accepted For Atlas Adaptation

Accepted as presentation patterns:

- compact readout hierarchy
- visual density strategy
- detail drawer structure
- source/freshness/basis/gaps/warnings visibility, translated into Atlas-owned meaning
- diagnostic demotion while preserving traceability
- responsive/narrow text containment discipline
- status light grammar where labels remain precise and non-tactical
- visual smoke containment expectations, implemented with Atlas-owned smoke scripts
- warning-only terminology discovery as a sniff pattern, not a gate

Accepted concept names as working prototype labels only:

- Evidence Stack
- Provenance Drawer

These labels describe the prototype shape. They do not rename Atlas backend contracts, schema, payloads, services, IPC channels, commands, or persisted entities.

## Lab Patterns Rejected Or Parked

Rejected by default:

- Lab as source-project authority
- Lab fixture family names
- Lab neutral sample meanings
- Lab state labels as Atlas enums
- Lab bridge assumptions
- Lab internal compatibility names
- Lab workspace process artifacts
- Lab-specific smoke matrix

Parked for later Atlas review:

- Actor Activity Strip
- Evidence Delta View
- Watch / Marked Split Panel
- Lab copy tone and readout labels
- animation/motion patterns
- broader Labs final presentation wiring

Reason: these may be useful, but they are not the smallest safe next prototype and could broaden HS43 or blur Atlas meaning if rushed.

## Atlas Meanings Preserved

Must preserve:

- `Discovery`: possible leads before ESI expansion.
- `Evidence`: expanded ESI killmail data and Atlas-owned derived activity events.
- `Observation`: rendered/report-layer meaning derived from stored Atlas Evidence.
- `Assessment Memory`: deliberate saved operator judgment with citation context.
- `Watch`: active routine check configuration or behavior.
- `Marked`: attention, interest, or selection state.
- `Enrich selected`: explicit ESI expansion into stored Evidence.
- `Refresh labels`: readability-only metadata hydration.
- `Collection Provenance`: why an item is present, where it came from, and what provider/run/queue/report basis supports it.

Non-negotiable boundaries:

- Discovery refs must not look like Evidence.
- Observation must not appear from zKill Discovery alone.
- Assessment Memory must not become automatic proof.
- Marked must not imply Watch.
- Watch may imply Marked only if Atlas explicitly defines that relationship in the relevant surface.
- Provenance must not become generic Lab source detail if Atlas evidence semantics are stronger.

## Smallest Safe Prototype

Recommended first prototype:

```txt
Atlas Evidence Stack + Provenance Drawer
```

Goal:

Make the operator able to see, without opening a debug surface:

- what is Atlas Evidence
- what is only a Discovery lead
- why each item is present
- where it came from
- how fresh it is
- what gaps or warnings remain
- what action, if any, is available next

Renderer-only prototype shape:

- Primary stack surface shows Discovery leads and Evidence entries in visibly distinct lanes/states.
- Evidence entries show evidence basis, sample/window/freshness, and observation availability.
- Discovery entries show queue/provenance context and the explicit next step: Queue Review -> Enrich selected.
- Provenance Drawer opens from a selected stack item and shows source layer, provider/run context, queue scope, evidence basis, freshness, gaps, and warnings.
- Drawer remains detail/traceability; it must not dominate the first workflow.

## Proposed Information Hierarchy

Evidence Stack item levels:

1. Identity: Pilot/System/Corp/Alliance or durable ID label.
2. Layer: Discovery lead / Evidence / Observation available / Assessment Memory available.
3. Basis: zKill queued ref, expanded ESI killmail, stored report response, assessment citation context.
4. Freshness: discovered/expanded/report time when available.
5. Gaps/warnings: unresolved labels, missing local context, unavailable report rows, API gate/refusal, sample limits.
6. Next action: Check Lead, Queue Review, Enrich selected, Load Stored Context, Open Observation, Open Assessment Memory.

Provenance Drawer sections:

- Why this is here
- Source layer
- Provider/run or queue scope
- Evidence basis
- Freshness
- Gaps/warnings
- Boundary note
- Available next action

## Field-To-Display Mapping Assumptions

Existing Atlas sources likely sufficient for a renderer prototype:

- `discovered_killmail_refs` -> Discovery lead / queue provenance
- `queue.selection` response -> selectable queued refs, expected ESI calls, selection status
- `report.actor` / `report.radius` structured responses -> Evidence basis, observations, report windows, timeline rows
- `evidence_basis` -> counts, sample status, evidence window
- `Collection Provenance` report data -> provider/run/read basis where available
- `data_quality_warnings` / report warnings -> gaps/warnings
- `metadata.hydration` status -> label freshness/readability gaps only
- `assessment_artifacts` -> Assessment Memory availability, not evidence
- `watchlist_entities`, `actor.watch`, `system.radius.watch` -> Marked/Watch context only if the chosen surface includes it later

If a field is missing, UI must say unavailable/unknown/deferred rather than inventing relevance, certainty, freshness, or source authority.

## State, Freshness, Basis, Gaps, Warnings Treatment

State labels must be Atlas-scoped:

- Discovery lead
- Evidence stored
- Observation available
- Assessment Memory available
- Queue review available
- Enrich selected required
- Labels unresolved
- Provider gated
- Local only

Avoid tactical or truth-bearing labels unless Atlas evidence/report data supports them.

Freshness should name the relevant layer:

- discovered at
- expanded at
- report window
- latest stored event
- label refresh status

Basis should name the layer:

- zKill discovery queue
- expanded ESI killmail
- stored report response
- assessment citation context
- local metadata/readability label

Gaps/warnings should be visible but secondary:

- unresolved labels
- unavailable structured rows
- no stored evidence
- queued refs only
- provider gate disabled
- sample/window limits

## Narrow/Layout Behavior

Prototype must prioritize containment:

- no narrow right-column word shredding
- detail drawer content wraps as rows or stacked groups
- stack items keep stable dimensions
- status chips may wrap, but must not resize controls unpredictably
- raw IDs and debug text stay in drawer/detail, not first viewport
- static and smoke checks should assert the main surfaces exist and boundary copy remains visible

## Verification And Smoke Expectations

Advisory packet:

- no runtime verification required

Future Dev prototype:

```powershell
npm.cmd run verify:renderer-shell
npm.cmd run verify:command-authority
npm.cmd run smoke:electron
npm.cmd run verify:protected-terms -- --max-warnings 20
git status --short --branch
```

Run `npm.cmd run verify:all` if Dev touches broad evidence/report/live-gate copy or shared service-facing assumptions.

Do not run live/private/destructive actions unless the Human explicitly authorizes them.

## Stop Conditions

Stop before implementation if:

- Evidence vs Discovery blurs.
- Watch vs Marked blurs.
- Lab terms become Atlas authority.
- scope expands into full renderer redesign.
- implementation requires contract, payload, service, IPC, database, schema, command, or persistence renames.
- provenance presentation cannot stay layer-qualified.
- zKill refs would be presented as observations or evidence before ESI expansion.
- Assessment Memory would appear as proof or automatic intelligence.
- UI needs new backend fields that do not already exist.
- live/private/destructive/GUI actions become required.

## Recommended Next Use

Do not interrupt HS43 for this.

After HS43 is complete and reviewed, Atlas Overseer may write a bounded Dev packet for:

```txt
Evidence Stack + Provenance Drawer renderer prototype
```

That packet should reuse this adoption record as source-of-intent, then specify exact renderer surfaces, fields, labels, and verification checks.
