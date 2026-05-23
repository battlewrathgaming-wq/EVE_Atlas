# Current Workspace Packet

Status: Active
Updated: 2026-05-23
Owner: Overseer planning, Dev execution

## Coordination State

Active milestone: Operator Investigation Desk
Roadmap source: `docs/roadmap/operator-investigation-desk.md`
Sequence: HS20
Previous accepted handshake: `workspace/DevHS18-operator-investigation-first-screen.md`
Latest Overseer review: `workspace/OverseerHS19-first-screen-review.md`
Current executor: Dev
Current focus: investigation lead-input ergonomics
Expected output: DevHS20-operator-investigation-lead-ergonomics.md

## Purpose

Continue the Operator Investigation Desk milestone by making the new first-screen lead input more useful and honest while staying on existing resolver/service paths.

This is not a broad investigation workflow build. It is a refinement slice for first-screen lead handling, validation, routing, empty states, and operator-facing feedback.

## Required Reading

- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/DevHS18-operator-investigation-first-screen.md`
- `workspace/OverseerHS19-first-screen-review.md`
- `docs/roadmap/operator-investigation-desk.md`
- `docs/terms/marked.md`
- `docs/terms/actor-watch.md`
- `docs/terms/system-radius-watch.md`
- `docs/terms/manual-discovery.md`
- `docs/terms/discovery-queue.md`
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

1. Lead route review:
   - inspect the new investigation first-screen route code and existing scope validation/manual discovery/report input paths
   - identify what can be improved with existing actor/system/radius validation and local system resolution behavior
2. Lead-input ergonomics:
   - add clear empty, invalid, and unresolved lead feedback on the Investigation screen
   - improve actor/system/radius routing into existing Scopes, Actions, Queue/Enrich, and Reports surfaces without adding new live/API behavior
   - make system/radius input use existing local resolution semantics where practical
   - keep numeric IDs as facts and names as labels/resolution inputs
3. Boundary language:
   - preserve Discovery as possible leads, Enrich selected as explicit ESI expansion/stored evidence, metadata hydration as readability-only, and Assessment as deliberate memory
   - preserve Marked/Watch asymmetry in user-facing copy
   - do not introduce Record, Intelligence, or Finding as accepted durable terms
4. Verification:
   - update renderer/static verification for lead ergonomics and boundary copy
   - update Electron smoke if the primary Investigation flow changes
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

- useful lead ergonomics require accepting zKill link / killmail ID paste support
- useful lead ergonomics require a new backend resolver or live API behavior
- the implementation requires product decisions about Record, Intelligence/Finding, region, or timeline grouping
- passive startup would need to mutate evidence or call live APIs
- evidence doctrine or assessment memory boundaries would need to change

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
