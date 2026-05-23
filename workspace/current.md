# Current Workspace Packet

Status: Active
Updated: 2026-05-23
Owner: Overseer planning, Dev execution

## Coordination State

Active milestone: Operator Investigation Desk
Roadmap source: `docs/roadmap/operator-investigation-desk.md`
Sequence: HS22
Previous accepted handshake: `workspace/DevHS20-operator-investigation-lead-ergonomics.md`
Latest Overseer review: `workspace/OverseerHS21-lead-ergonomics-review.md`
Current executor: Dev
Current focus: stored-evidence investigation detail
Expected output: DevHS22-operator-investigation-evidence-detail.md

## Purpose

Continue the Operator Investigation Desk milestone by making a validated lead produce a useful stored-evidence detail view without turning the first screen into a broad dashboard or adding live collection behavior.

This packet should help an operator answer what Atlas already knows from stored evidence after a lead is routed. It should remain read-only unless the operator explicitly uses existing deliberate actions such as Enrich selected or assessment save.

## Required Reading

- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/DevHS20-operator-investigation-lead-ergonomics.md`
- `workspace/OverseerHS21-lead-ergonomics-review.md`
- `docs/roadmap/operator-investigation-desk.md`
- `docs/terms/marked.md`
- `docs/terms/actor-watch.md`
- `docs/terms/system-radius-watch.md`
- `docs/terms/manual-discovery.md`
- `docs/terms/discovery-queue.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-report-products.md`

## Accepted Product Requirement

Use this user-facing model:

```txt
Marked = operator interest / tag / record attention.
Watch = active routine check behavior.
Watch implies Marked.
Marked does not imply Watch.
```

Blocked/unblocked are user-facing watch status labels. They describe whether an active routine check can run now; they are not evidence conclusions.

The accepted investigation path remains:

```txt
Discovery -> Evidence -> Observation -> Assessment
```

Discovery refs are possible leads. Expanded ESI killmails are evidence. Observation surfaces render patterns from stored evidence. Assessment is deliberate operator memory.

## Ordered Dev Runway

1. Evidence-detail route review:
   - inspect the current Investigation lead routing, report services, actor reports, radius reports, and renderer report surfaces
   - identify the smallest safe route from a validated actor/system/radius lead to stored-evidence detail already supported by existing services
2. Add an Investigation evidence-detail surface:
   - add a bounded primary/secondary panel or section reachable from the Investigation screen after lead routing
   - show a concise stored-evidence summary for the current actor/system/radius lead when existing stored data supports it
   - show honest empty states when Atlas has no stored evidence for the lead
   - keep raw IDs, normalized payloads, and backend detail behind existing secondary/detail affordances where practical
3. Evidence and observation wording:
   - label stored ESI killmail data as evidence
   - label rendered counts, timelines, or summaries as observations from stored evidence
   - keep discovery refs described as possible leads until Enrich selected explicitly expands them through ESI
   - do not introduce Record, Intelligence, or Finding as accepted durable terms
4. Route integration:
   - preserve the HS20 lead validation behavior before filling detail/report state
   - preserve routes into Scopes, Actions, Queue / Enrich, Reports, Readiness, and Tasks
   - avoid passive startup mutation, automatic discovery, automatic enrichment, hydration, assessment save, or watch execution
5. Verification:
   - update renderer/static verification for the new investigation evidence-detail route and wording
   - update Electron smoke if the primary Investigation flow changes
   - run focused affected verification, then `npm.cmd run verify:all`

## Explicitly Deferred From This Packet

- Record drawer semantics.
- Intelligence/Finding naming.
- pasted zKill links / killmail IDs.
- first-class region investigation.
- battle timeline grouping or fight clustering beyond a minimal stored-evidence summary if already supported.
- relationship graph or footprint story implementation.
- live success smoke.
- evidence pruning/deletion.
- new backend resolver services.

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

- the evidence-detail route requires accepting Record, Intelligence, or Finding terminology
- the implementation needs a new backend resolver, live API behavior, or passive evidence collection
- useful detail requires zKill link / killmail ID paste support
- useful detail requires first-class region support, relationship graph decisions, or timeline/fight-cluster product decisions
- passive startup would need to mutate evidence, call live APIs, hydrate metadata, create assessments, or run watches
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
