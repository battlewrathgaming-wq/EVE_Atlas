# Current Workspace Packet

Status: Active
Updated: 2026-05-23
Owner: Overseer planning, Dev execution

## Coordination State

Active milestone: Operator Investigation Desk
Roadmap source: `docs/roadmap/operator-investigation-desk.md`
Sequence: HS18
Previous accepted handshake: `workspace/OverseerHS17-operator-investigation-roadmap.md`
Current executor: Dev
Current focus: first investigation-oriented opening screen
Expected output: DevHS18-operator-investigation-first-screen.md

## Purpose

Start the Operator Investigation Desk milestone with a bounded first-screen slice.

The goal is to shift the first useful experience from backend service inspection toward operator investigation, while preserving the existing safe service shell and evidence boundaries.

## Required Reading

- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/OverseerHS17-operator-investigation-roadmap.md`
- `docs/roadmap/operator-investigation-desk.md`
- `workspace/ProjectPlannerHS06-operator-investigation-ux.md`
- `docs/terms/marked.md`
- `docs/terms/watchlist.md`
- `docs/terms/actor-watch.md`
- `docs/terms/system-radius-watch.md`
- `docs/terms/discovery-queue.md`
- `docs/terms/manual-discovery.md`
- `docs/terms/work-products.md`
- `docs/current-state/current-ipc-ui-preparation.md`

## Accepted Product Requirement

Use this user-facing model:

```txt
Marked = operator interest / tag / record attention.
Watch = active routine check behavior.
Watch implies Marked.
Marked does not imply Watch.
```

Blocked/unblocked are user-facing watch status labels. They describe whether an active routine check can run now; they are not evidence conclusions.

## Ordered Dev Runway

1. Renderer structure review:
   - inspect the current Electron renderer shell, navigation, readiness startup, queue/watch, actions, and reports surfaces
   - identify the smallest safe way to add or promote an Investigation Desk opening view without breaking existing service views
2. First investigation screen:
   - make the app open to an investigation-oriented first screen rather than Readiness
   - include one primary lead input supporting actor or system/radius investigation intent
   - show live/API state as global context without enabling live APIs
   - surface Marked versus Watch distinction in user-facing wording
   - provide clear routes into existing discovery, queue/enrich, reports, and assessment surfaces
3. Boundary and detail hierarchy:
   - describe discovery as possible leads, not evidence
   - describe `Enrich selected` only with explicit ESI expansion / stored evidence detail
   - keep metadata hydration labelled readability-only
   - move raw IDs, backend payloads, queue internals, and task/service detail into secondary/detail areas where this slice touches them
   - do not introduce Record, Intelligence, or Finding as durable product terms
4. Verification:
   - update renderer/static verification for the new first screen and wording
   - update Electron smoke if startup view or primary renderer flow changes
   - prove passive startup still does not call live APIs or mutate evidence
   - run focused affected verification, then `npm.cmd run verify:all`

## Explicitly Deferred From This Packet

- Record drawer semantics.
- Intelligence/Finding naming.
- pasted zKill links / killmail IDs.
- first-class region investigation.
- battle timeline implementation.
- relationship graph or footprint story implementation.
- live success smoke.
- evidence pruning/deletion.

## Guardrails

- zKillboard is discovery only.
- Expanded ESI killmails are evidence.
- Discovery refs are possible evidence until expanded.
- Assessment artifacts are deliberate operator memory, not evidence.
- UI presents and scopes evidence; UI is not authority.
- Passive views must not collect evidence.
- Live APIs require explicit gates and narrow scopes.
- Marked is attention, not collection.
- Watch is active routine checking, not proof.
- Do not use Record, Intelligence, or Finding as accepted durable terms in this slice.

## Stop Conditions

Return to chat before continuing if:

- the first-screen implementation requires product decisions about Record, Intelligence/Finding, region, zKill link input, or battle timeline grouping
- live network/API action is needed without explicit operator authorization
- passive startup would need to mutate evidence or call live APIs
- evidence doctrine or assessment memory boundaries would need to change
- existing verification reveals architecture risk that cannot be handled within the renderer shell

## Verification Required

Run focused affected verification, then run:

```powershell
npm.cmd run verify:all
```

Run if renderer startup or primary flow changes:

```powershell
npm.cmd run smoke:electron
```

Do not run by default:

- live API smoke without explicit gate/operator approval
- real SDE network download without explicit operator approval
- destructive retention/pruning operations

## Evidence

Dev updates this before handoff.

Verification run:

```txt
Not yet run for this packet.
```

Files changed:

```txt
Not yet recorded.
```

Findings:

```txt
Not yet recorded.
```

Deferrals:

```txt
Not yet recorded.
```

## Dev Handoff

Dev fills this in when work is complete:

- completed tasks:
- tests added/updated:
- verification output:
- failures found:
- handshake created:
- remaining risk:

## Overseer Review

Overseer fills this in after Dev handoff:

- accepted / redirected:
- doctrine drift:
- architecture risk:
- state updates needed:
- next packet:
