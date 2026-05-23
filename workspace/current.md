# Current Workspace Packet

Status: Active
Updated: 2026-05-24
Owner: Overseer planning, Dev execution

## Coordination State

Active milestone: Operator Investigation Desk
Roadmap source: `docs/roadmap/operator-investigation-desk.md`
Sequence: HS26
Previous accepted handshake: `workspace/DevHS24-operator-investigation-queue-enrich-preflight.md`
Latest Overseer review: `workspace/OverseerHS25-queue-enrich-review.md`
Current executor: Dev
Current focus: assessment-memory ergonomics from loaded stored-evidence context
Expected output: DevHS26-operator-investigation-assessment-memory.md

## Purpose

Continue the Operator Investigation Desk milestone by making the deliberate Assessment Memory step clearer after a lead has stored-evidence context.

This packet should help an operator understand when they are saving reviewed assessment memory over stored evidence, what local citations support it, and why this is separate from raw evidence, discovery refs, metadata hydration, and active watches.

## Required Reading

- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/DevHS24-operator-investigation-queue-enrich-preflight.md`
- `workspace/OverseerHS25-queue-enrich-review.md`
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

1. Assessment route review:
   - inspect the Investigation stored-evidence detail, Reports / Assessment route, actor report assessment context, assessment create/list/get services, and current renderer copy
   - identify the smallest safe refinement that makes deliberate assessment memory easier to understand from a loaded actor stored-evidence context
2. Improve assessment memory context:
   - make the Reports / Assessment surface clearly show when an actor report is loaded and eligible for assessment memory
   - show citation basis, sample killmail IDs, evidence window, local verification status, and evidence/assessment boundary before save
   - keep radius/system assessment as context-only unless existing services already support it without new product decisions
3. Preserve deliberate save behavior:
   - require the existing operator-entered reason/summary and confirmation before `assessment.create`
   - do not auto-generate assessment content, scores, tags, findings, intelligence, or records
   - keep saved assessment memory separate from raw evidence, observations, discovery refs, metadata hydration, and watches
4. Route integration:
   - preserve Investigation lead validation, stored-evidence detail, Queue / Enrich context, Reports, Scopes, Actions, Readiness, and Tasks routes
   - optionally make the Investigation route to Reports / Assessment carry the current eligible actor context more clearly, but do not create new backend resolver behavior
5. Verification:
   - update renderer/static verification for assessment-memory context and boundary wording
   - update Electron smoke if the primary Investigation-to-Assessment flow changes
   - run focused affected verification, then `npm.cmd run verify:all`

## Explicitly Deferred From This Packet

- Record drawer semantics.
- Intelligence/Finding naming.
- pasted zKill links / killmail IDs.
- first-class region investigation.
- battle timeline grouping or fight clustering.
- relationship graph or footprint story implementation.
- live success smoke.
- evidence pruning/deletion.
- new backend resolver services.
- automatic assessment or AI commentary.
- automatic discovery or automatic enrichment.

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

- useful assessment ergonomics require accepting Record, Intelligence, or Finding terminology
- the implementation needs automatic assessment generation, AI commentary, or hidden scoring
- the implementation needs new backend resolver behavior, live API behavior, or passive evidence collection
- useful assessment ergonomics require first-class region support, relationship graph decisions, timeline/fight-cluster decisions, or radius/system assessment semantics beyond existing support
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
