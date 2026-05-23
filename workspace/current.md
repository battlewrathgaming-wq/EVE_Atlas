# Current Workspace Packet

Status: Active
Updated: 2026-05-24
Owner: Overseer planning, Dev execution

## Coordination State

Active milestone: Operator Investigation Desk
Roadmap source: `docs/roadmap/operator-investigation-desk.md`
Sequence: HS24
Previous accepted handshake: `workspace/DevHS22-operator-investigation-evidence-detail.md`
Latest Overseer review: `workspace/OverseerHS23-evidence-detail-review.md`
Current executor: Dev
Current focus: validated-lead Queue / Enrich preflight refinement
Expected output: DevHS24-operator-investigation-queue-enrich-preflight.md

## Purpose

Continue the Operator Investigation Desk milestone by making the path from a validated lead to Queue / Enrich clearer and safer.

This packet should help an operator understand when a lead has stored evidence, when it only has possible discovery refs, and what Enrich selected would do before any ESI expansion is run. It should use existing queue selection, manual discovery, manual expansion, and live-gate behavior rather than adding new collection machinery.

## Required Reading

- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/DevHS22-operator-investigation-evidence-detail.md`
- `workspace/OverseerHS23-evidence-detail-review.md`
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

1. Queue / Enrich route review:
   - inspect the HS20/HS22 Investigation lead state, Queue / Enrich renderer surface, queue selection service, manual discovery preflight, manual expansion preflight/run path, and live-gate copy
   - identify the smallest safe refinement that lets a validated lead explain queued refs and Enrich selected effects without starting live work automatically
2. Add validated-lead queue context:
   - from the Investigation screen, make Queue / Enrich context for a validated actor/system/radius lead clearer before navigation or prefill
   - show whether the lead can prefill a stored discovery-scope filter, needs Discover Possible Leads first, or already has queued possible refs available through existing queue selection behavior
   - keep no-ref and no-evidence states honest and non-accusatory
3. Clarify Enrich selected preflight:
   - make the preflight state provider, expected ESI calls, expected writes, selected refs, caps, and evidence effect obvious in user-facing copy
   - preserve that Enrich selected is explicit ESI expansion into stored killmail evidence
   - preserve metadata hydration as readability-only and separate from evidence enrichment
4. Route integration:
   - preserve existing validated lead handling, stored-evidence detail, Reports, Scopes, Actions, Readiness, and Tasks routes
   - do not run manual discovery, manual expansion, metadata hydration, assessment save, or watches from passive startup or from merely loading the Investigation screen
   - do not add zKill link / killmail ID paste support, new resolver services, first-class region behavior, or live success smoke
5. Verification:
   - update renderer/static verification for validated-lead Queue / Enrich context and Enrich selected evidence-effect wording
   - update Electron smoke if the primary Investigation or Queue / Enrich flow changes
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

- useful Queue / Enrich refinement requires live API execution without the existing explicit gate/confirmation behavior
- the implementation needs a new backend resolver, new collection service, or passive evidence collection
- useful Queue / Enrich refinement requires zKill link / killmail ID paste support
- the implementation requires product decisions about Record, Intelligence/Finding, region, relationship graph, timeline grouping, or fight clustering
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
