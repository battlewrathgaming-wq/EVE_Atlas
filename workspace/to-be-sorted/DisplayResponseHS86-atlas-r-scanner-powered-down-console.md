# DisplayResponseHS86 - Atlas R-Scanner Powered-Down Console

Date: 2026-05-26
Project: Aura Lab
Role: Aura Lab Display Advisory / UIUX
Status: Advisory response

## Advisory Boundary

This is a Lab Bridge -> Interface display advisory response for an Atlas request.

This response does not authorize implementation, Atlas adoption, backend changes, bridge changes, IPC changes, schema changes, service changes, payload changes, persistence changes, test changes, source-term renames, target adapters, live/API behavior, or Dev work.

Atlas owns source meaning, runtime behavior, bridge/readout terms, data semantics, final adoption, and any implementation packet.

Lab may compare presentation methods only after preserving Atlas meaning.

## Source Request Reviewed

Reviewed Atlas source request:

- `F:\Projects\AURA-Atlas\workspace\RequestDisplayHS86-r-scanner-powered-down-console.md`
- `F:\Projects\AURA-Atlas\workspace\UIUXHS84-watch-recovery-readout-interpretation.md`
- `F:\Projects\AURA-Atlas\workspace\OverseerHS86-r-scanner-display-request-review.md`

Reviewed Lab cooperation sources:

- `F:\Projects\AURA- Lab\workspace\request_display.md`
- `F:\Projects\AURA- Lab\workspace\display-request-cooperation-contract.md`

## Request Readback

Request ID:

```txt
atlas.r-scanner.powered-down-console
```

Source project / owner:

```txt
Atlas
```

Scope:

One stateful scanner/recovery surface using existing `Watch_offline` readout fields.

The requested surface should help a user understand whether Atlas is disarmed, waiting, ready, holding local refs, deferred, or needs review after restart. It should feel calm, safe, and waiting for deliberate operator intent.

Lab should compare up to three display methods:

1. Powered-Down Central Console
2. Status Envelope With Scanner Face
3. one compact alternative if useful

## Terms Preserved

Atlas-owned terms and meanings to preserve:

- `Watch`
- `Watch_offline`
- `Discovery`
- `Evidence`
- `EVEidence`
- `hydration`
- `provenance`
- `Marked`
- `storage`
- `External API`

Presentation candidates only:

- `R-Scanner`
- `R-scan`

`R-Scanner` and `R-scan` should not rename Atlas source/internal terms, bridge/readout models, backend concepts, services, commands, IPC channels, payload fields, schemas, test IDs, or docs.

## Terms Avoided Or Qualified

Avoid or qualify:

- `Watcher`
- `live`, unless provider work is actually active
- `surveillance`, unless explicitly scoped as user-authorized Watch behavior
- `Evidence` / `EVEidence` when referring to Discovery refs
- `scan result` when referring to pending local refs
- `failure` when referring to waiting or provider deferral
- exact radius coverage when stored scope is missing or malformed
- D-scan comparison in ordinary UI copy unless user confusion requires it

## Candidate Display Methods

### Method 1 - Powered-Down Central Console

**Summary**

A central scanner/radar-style face sits dim, static, and visibly disarmed. It is framed by a compact status rail showing recovery state, readiness, local refs, provider deferral, freshness, radius scope quality, and review markers.

**Visual hierarchy**

1. Surface title: `R-Scanner`
2. Primary state: offline / disarmed / waiting / ready
3. Scanner face: static powered-down visual, no sweep
4. Compact status rail: freshness, local refs, provider state, radius scope
5. Warning / review marker
6. Detail reveal
7. Diagnostics secondary

**State treatment**

- Offline/disarmed is neutral and intentional.
- Waiting is standby, not failure.
- Ready brightens the panel slightly and enables R-scan affordance if Atlas allows it.
- Pending local refs appear as local work / Discovery refs, not scan results.
- Provider deferred appears as availability reason, not error.
- Review needed uses muted warning edge and detail path.

**At-a-glance fields**

- `R-Scanner`
- state label
- armed/disarmed status
- R-scan availability
- last read / freshness
- pending local refs count
- provider deferred marker, if present
- radius scope state: valid, missing, malformed, or limited
- review-needed marker

**Diagnostic / detail reveal**

Detail should show:

- `Watch_offline` source/readout model
- `Watch` source rows where useful
- Discovery refs boundary
- Evidence / EVEidence boundary
- hydration status
- provider deferred reason
- missed slot recovery note
- orphan/review reason
- radius scope parse status and limitation
- raw refs/IDs only as diagnostics

**Action / readiness behavior**

The R-scan action should look primary only when the readout indicates it is ready/allowed. Offline/disarmed should not show a live scan animation. Ready state can show a calm activation affordance, but no provider call or scheduler behavior is implied by Lab.

**Risks**

- A scanner/radar face can imply active surveillance if animated.
- Central visual can become a full-screen redesign if not bounded.
- Red warning styling can make offline/waiting feel broken.
- Radius rings can imply exact coverage even when scope is missing or malformed.

**Mitigations**

- No animated sweep while disarmed/offline.
- Use dim static rings for powered-down mode.
- Use neutral state color for offline/disarmed.
- Use muted warning edge only for recoverable/review states.
- Label radius as stored scope, limited scope, missing scope, or malformed scope where applicable.

**Parked**

- animated radar sweep
- live/provider activity visualization
- route/map expansion
- full Overview redesign
- scheduler controls
- backend/service changes

**Meaning preservation**

Strong, if detail rows preserve `Watch`, `Watch_offline`, Discovery, Evidence/EVEidence, and hydration as Atlas-owned terms. This method gives the clearest user-facing separation between presentation metaphor and source meaning.

### Method 2 - Status Envelope With Scanner Face

**Summary**

A compact status panel/envelope carries most of the meaning, with a smaller static scanner face as visual support. The surface reads more like an Instrument Readout Panel than a dedicated central console.

**Visual hierarchy**

1. State band: disarmed / waiting / ready / review needed
2. Small scanner face, static and dim
3. Availability reason line
4. Freshness / last read
5. Pending refs and provider deferral markers
6. Detail reveal
7. Diagnostics secondary

**State treatment**

- Offline/disarmed is treated as a normal availability state.
- Waiting is a calm status envelope with no failure styling.
- Provider deferred uses an availability reason.
- Missed slot recoverable and review needed use muted warning/gap edge.
- Radius scope quality appears as a small status row or detail cue, not a visual radius claim.

**At-a-glance fields**

- state label
- disarmed/armed status
- R-scan readiness
- last read / freshness
- pending local refs count
- provider deferred / review marker
- detail affordance

**Diagnostic / detail reveal**

Detail should contain the same diagnostic rows as Method 1, but the default panel stays even calmer and more compact.

**Action / readiness behavior**

The primary action can sit below or beside the state band. When unavailable, show the reason rather than an error. When ready, the action becomes available without implying that scan work is already running.

**Risks**

- Less distinctive than a central console.
- Scanner metaphor may feel decorative if too small.
- Could collapse into a generic status card and lose the powered-down read.

**Mitigations**

- Keep the scanner face visible but secondary.
- Preserve `R-Scanner` title.
- Use a strong state band and clear availability reason.
- Keep detail reveal point-of-need.

**Parked**

- full-screen scanner console
- animated scan treatment
- complex radius visualization
- multi-card recovery dashboard

**Meaning preservation**

Strong. This is the safest low-noise method because the status envelope carries precise Atlas-safe language and the scanner face supplies mood without taking over semantics.

### Method 3 - Recovery Status Rail

**Summary**

A compact horizontal or vertical rail lists recovery/readiness facets: disarmed, waiting, local refs, provider deferred, radius scope, review needed, ready. It can sit beside an existing Atlas surface without becoming a new central console.

**Visual hierarchy**

1. `R-Scanner` label
2. primary state chip
3. rail facets: armed state, local refs, provider, radius, review
4. R-scan readiness
5. detail reveal

**State treatment**

- Each recovery state becomes a rail facet rather than a large visual scene.
- Waiting/provider deferred stay as status facets, not failure steps.
- Review needed appears as muted attention.
- Radius scope appears as valid/missing/malformed facet.

**At-a-glance fields**

- state chip
- R-scan availability
- pending refs count
- provider deferred marker
- radius scope facet
- review-needed marker

**Diagnostic / detail reveal**

Detail opens from the rail to show full `Watch_offline` basis, Discovery/EVEidence boundary, hydration, provider reason, missed slot, orphan/review, and radius limitation.

**Action / readiness behavior**

The action should remain separate from the rail. The rail says what is true; it should not become a stepper or hidden workflow.

**Risks**

- Can look like a checklist of failures.
- Can make waiting/provider deferred feel like an incomplete process.
- Less atmospheric than the scanner console.
- May under-sell the powered-down instrument concept.

**Mitigations**

- Avoid numbered steps.
- Use facets, not progress states.
- Use neutral language for waiting/deferred.
- Keep R-scan action separate.

**Parked**

- step-by-step recovery checklist
- progress bar
- process timeline
- scheduler detail in default view

**Meaning preservation**

Good if the rail is explicitly a status/readout facet rail and not a lifecycle/progress ladder. It is useful as a compact fallback but weaker as the main presentation concept.

## Recommended Method

Recommend Method 1:

```txt
Powered-Down Central Console
```

Why:

- Best matches Human intent for a powered-down scanner/radar metaphor.
- Makes offline/disarmed feel deliberate and safe.
- Creates a clear separation between user-facing presentation (`R-Scanner`) and Atlas source meaning (`Watch`, `Watch_offline`).
- Gives enough visual weight to the recovery/readout surface without requiring a full Atlas Overview redesign.
- Supports compact status rail, warning/gap edge, and detail reveal from existing Lab presentation patterns.

Fallback:

```txt
Status Envelope With Scanner Face
```

Use the fallback if Atlas wants a lower-risk or smaller first implementation surface.

Park:

```txt
Recovery Status Rail as primary surface
```

The rail is useful as a subcomponent, but it is too process-like as the main presentation method.

## State-By-State Treatment

| State | Primary treatment | Detail / diagnostic treatment | Avoid |
| --- | --- | --- | --- |
| offline / disarmed | Dim static scanner face, neutral state chip, no sweep. | Show `Watch_offline` basis and disarmed status if opened. | Broken/error styling; live language. |
| waiting | Soft standby state, low-contrast rail, no spinner unless actual work is happening. | Expected next run / observed movement if useful. | Treating waiting as failure. |
| pending local Discovery refs | Local refs marker/count; label as Discovery/local pending. | Ref basis, provenance, hydration state. | Calling refs Evidence/EVEidence or scan results. |
| ready to scan | Slightly brighter scanner face; R-scan action may become primary if Atlas allows. | Show why ready and what basis supports readiness. | Implied background scan before user action. |
| missed slot recoverable | Muted warning/gap edge with recoverable language. | Expected/observed timing and next safe action. | Hard failure styling. |
| provider deferred | Availability reason line with provider deferred copy. | Provider reason and next safe action. | Provider deferred as failure or broken state. |
| review needed / orphaned run | Muted attention marker plus detail affordance. | Orphan/review reason, local context, relevant refs. | Creating Evidence/EVEidence implication. |
| complete enough for alpha | Calm completion/readiness line with known limitations visible. | Detail lists what is known and what remains limited. | Overclaiming complete coverage. |
| valid radius scope | Scope facet can show valid stored scope. | Radius basis and source-owned stored scope details. | Treating stored scope as live precision. |
| missing radius scope | Scope facet says missing/limited. | Explain stored scope missing and what that limits. | Drawing exact radius. |
| malformed radius scope | Scope facet says malformed/limited. | Parse limitation and safe fallback wording. | Drawing exact radius or treating as provider failure. |

## Information Hierarchy

Visible at a glance:

- `R-Scanner`
- current state
- armed/disarmed
- R-scan availability
- last read / freshness
- pending local refs count
- provider deferred marker
- radius scope quality
- review-needed marker
- detail affordance

Tucked into detail / diagnostics:

- `Watch`
- `Watch_offline`
- `Discovery` refs
- `Evidence` / `EVEidence` boundary
- hydration
- provenance
- provider deferral reason
- missed slot timing
- orphaned run explanation
- raw refs/IDs
- scheduler/service details
- radius parse limitation

## Action / Readiness Behavior

The R-scan action should follow readiness, not create it.

Rules:

- If offline/disarmed, action is unavailable or deliberately disabled with a reason.
- If waiting, action should not imply failure.
- If pending local refs exist, show they are local/Discovery and not scan results.
- If provider deferred, show reason and next safe action.
- If ready, action may become prominent.
- If review needed, action should not hide the review marker.
- No method should imply live/background provider work while disarmed/offline.

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| R-Scanner confused with EVE D-scan | Establish meaning once in first-use/detail copy; avoid heavy "not D-scan" UI copy. |
| Scanner face implies active surveillance | Use no sweep, no pulse, and no live wording while disarmed/offline. |
| Discovery refs look like Evidence/EVEidence | Label pending refs as Discovery/local refs; keep Evidence/EVEidence only in detail when source meaning supports it. |
| Waiting/provider deferred looks broken | Use neutral availability treatment and avoid red/error styling. |
| Missing/malformed radius appears exact | Do not draw exact radius; use limited/missing/malformed scope labels. |
| Recovery rail becomes a failure checklist | Use rail facets, not steps or progress bars. |
| Lab presentation terms become Atlas source terms | Keep R-Scanner/R-scan presentation-only and preserve `Watch` / `Watch_offline` underneath. |

## Parked Items

Park:

- full Atlas Overview redesign
- backend/service/readout changes
- bridge/IPC/schema/payload/test changes
- renaming `Watch` or `Watch_offline`
- animated radar sweep while disarmed/offline
- live/API smoke
- new provider calls
- scheduler behavior changes
- map/radius expansion
- exact radius rendering for missing/malformed scope
- Discovery -> Evidence/EVEidence promotion
- route/navigation doctrine
- adoption into Atlas without Atlas-local review

## Lab Display Materials / Patterns Relevant

Relevant Lab presentation patterns:

- Instrument Readout Panel: composed panel structure, state, basis, freshness, availability, gaps/warnings, and detail reveal.
- Availability Reason Treatment: waiting, provider deferred, blocked/unavailable-like limitations without alarm.
- Warning / Gap Edge: missed slot recoverable, review needed, malformed scope limitation.
- Long Text Detail Block: provider reason, radius limitation, Discovery/EVEidence boundary, hydration/provenance detail.
- Status / state band behavior: top readout state and primary availability.

These are presentation references only. They do not define Atlas data contracts.

## Clear Advisory Disposition

Lab recommends:

```txt
Powered-Down Central Console
```

Lab fallback:

```txt
Status Envelope With Scanner Face
```

Lab parks:

```txt
Recovery Status Rail as primary method
```

Atlas should review the recommendation under Atlas authority before any implementation. If Atlas adopts a method later, Atlas should create its own local implementation packet and preserve source terms, runtime behavior, bridge/readout models, and data semantics.

This Lab response is advisory only and is not Atlas adoption, implementation permission, Dev authorization, or a contract.
