# Current Workspace Packet

Status: Active
Updated: 2026-05-24
Owner: Overseer planning, Dev execution

## Coordination State

Active milestone: Local Alpha Trial Readiness
Roadmap source: `docs/roadmap/local-alpha-trial-readiness.md`
Sequence: HS30
Previous accepted handshake: `workspace/complete/milestone-operator-investigation-desk/OverseerHS28-operator-investigation-milestone-review.md`
Latest Overseer review: `workspace/OverseerHS29-local-alpha-selection.md`
Current executor: Dev
Current focus: local alpha documentation and operator readiness refresh
Expected output: DevHS30-local-alpha-doc-readiness.md

## Purpose

Start the Local Alpha Trial Readiness milestone by making Atlas' operator-facing docs match the current closed product state.

This is not a new feature milestone. It should make the current safe paths understandable, repeatable, and reviewable for one local operator on one machine. It should not widen collection, add UI behavior, change evidence doctrine, or create public packaging work.

## Required Reading

- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/complete/milestone-operator-investigation-desk/OverseerHS28-operator-investigation-milestone-review.md`
- `docs/audits/audit-2026-05-24-operator-investigation-desk-closure.md`
- `docs/roadmap/local-alpha-trial-readiness.md`
- `docs/roadmap/operator-investigation-desk.md`
- `README.md`
- `docs/runbooks/local-alpha-trial.md`
- `docs/runbooks/local-alpha-known-limits-and-feedback.md`
- `docs/runbooks/local-alpha-release-tag-checklist.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-report-products.md`

## Accepted Product Requirement

Local alpha means:

```txt
one operator
one machine
explicit actions
reviewable artifacts
no hidden live collection
```

The current safe operator path is:

```txt
start Atlas
-> confirm readiness
-> inspect corpus health
-> create or choose a scoped question
-> run controlled discovery/expansion where appropriate
-> view a report
-> optionally save assessment memory
-> snapshot the runtime DB
-> generate a trace pack if something is unclear
```

The accepted Atlas doctrine still applies:

- zKillboard is discovery only.
- Expanded ESI killmails are evidence.
- Discovery refs are possible leads until expanded.
- Observation surfaces render patterns from stored evidence.
- Assessment memory is deliberate operator judgment, not evidence.
- Marked is operator attention; Watch is active routine checking.

## Ordered Dev Runway

1. Documentation state audit:
   - review README and local-alpha runbooks for stale milestone references, stale first-start flow, stale gap references, or wording that predates the closed Operator Investigation Desk milestone
   - compare against the closure audit and current-state docs
2. README refresh:
   - update the current work focus from the closed aggressive-testing/operator-desk history to Local Alpha Trial Readiness
   - make the first local start path point operators at the Investigation Desk plus readiness/corpus/demo fixture flow
   - remove or reframe stale `docs/gap` active-task references
3. Local alpha runbook refresh:
   - ensure the runbook supports offline fixture/demo operation first
   - keep optional live-gated operation explicitly gated, narrow, and non-default
   - include clear steps for readiness, corpus health, scoped question, discovery/enrich, report, assessment memory, snapshot, and trace pack where already supported
4. Known limits and feedback refresh:
   - ensure known limits mention deferred Record/Intelligence/Finding naming, zKill paste, region, relationship/footprint, fight clustering, live success smoke discipline, and no passive collection
   - ensure feedback capture prompts ask for evidence-bound operator friction rather than broad feature requests
5. Release/checkpoint checklist refresh:
   - ensure the checklist names exact verification commands and artifact expectations
   - keep public packaging/distribution out of scope
6. Verification:
   - run `npm.cmd run verify:all`
   - run `npm.cmd run smoke:electron`
   - do not run live API smoke or real SDE network download by default

## Explicitly Deferred From This Packet

- New renderer features.
- Product UX redesign.
- Public packaging or release distribution.
- Live API smoke unless explicitly authorized.
- Real SDE network download unless explicitly authorized.
- Evidence pruning/deletion.
- Record, Intelligence, or Finding terminology decisions.
- zKill link / killmail ID paste support.
- First-class region investigation.
- Relationship graph, footprint story, or fight-cluster timeline behavior.
- Lab/shared presentation adoption.

## Guardrails

- This packet is documentation/readiness consolidation only unless a doc-linked verification command reveals a narrow correction is required.
- Do not treat archived handshakes as active task queues.
- Do not use archived docs/gap files as active task queues.
- Do not broaden Local Alpha into public release work.
- Do not weaken live/API gates or evidence doctrine.
- Keep Atlas doctrine project-local.

## Stop Conditions

Return to chat before continuing if:

- the README/runbooks require a Human decision about live alpha scope
- the runbook cannot describe a viable offline/local path with current features
- verification fails in a way that implies product or architecture risk
- completing docs would require code changes
- live/private/destructive action appears necessary

## Verification Required

Run:

```powershell
npm.cmd run verify:all
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
