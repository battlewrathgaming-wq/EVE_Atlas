# Current Workspace Packet

Status: Active
Updated: 2026-05-24
Owner: Overseer planning and milestone review

## Coordination State

Active milestone: Operator Investigation Desk
Roadmap source: `docs/roadmap/operator-investigation-desk.md`
Sequence: HS28
Previous accepted handshake: `workspace/DevHS26-operator-investigation-assessment-memory.md`
Latest Overseer review: `workspace/OverseerHS27-assessment-memory-review.md`
Current executor: Overseer
Current focus: Operator Investigation Desk milestone review and closure decision
Expected output: OverseerHS28-operator-investigation-milestone-review.md

## Purpose

Review whether the first-pass Operator Investigation Desk milestone is complete enough to close or whether one more bounded Dev packet is required.

This is a review packet, not a Dev implementation runway. Do not add product scope by momentum. Decide from evidence, roadmap acceptance checks, current-state docs, handshakes, and verification.

## Required Reading

- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/DevHS18-operator-investigation-first-screen.md`
- `workspace/OverseerHS19-first-screen-review.md`
- `workspace/DevHS20-operator-investigation-lead-ergonomics.md`
- `workspace/OverseerHS21-lead-ergonomics-review.md`
- `workspace/DevHS22-operator-investigation-evidence-detail.md`
- `workspace/OverseerHS23-evidence-detail-review.md`
- `workspace/DevHS24-operator-investigation-queue-enrich-preflight.md`
- `workspace/OverseerHS25-queue-enrich-review.md`
- `workspace/DevHS26-operator-investigation-assessment-memory.md`
- `workspace/OverseerHS27-assessment-memory-review.md`
- `docs/roadmap/operator-investigation-desk.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-report-products.md`
- `docs/features/presentation-layer-information-index.md`

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

## Ordered Overseer Runway

1. Milestone evidence review:
   - confirm the handoff sequence from HS18 through HS27 is present and coherent
   - confirm `workspace/current.md`, `workspace/overview.md`, and current-state docs agree on status
   - separate repo-verified facts from advisory heading/alignment artifacts
2. Acceptance-check review:
   - compare implemented behavior against `docs/roadmap/operator-investigation-desk.md`
   - verify the first-pass path covers investigation entry, passive startup, Marked/Watch language, discovery/evidence/observation/assessment boundaries, Enrich selected preflight, stored-evidence detail, and deliberate assessment memory
3. Risk and deferral review:
   - list open Human decisions that must remain deferred
   - identify whether any blocker requires another Dev packet before milestone closure
   - ensure Lab/shared presentation alignment remains advisory and does not alter Atlas doctrine
4. Closure decision:
   - if complete, create a milestone closure record and update `workspace/overview.md`
   - batch-move active milestone handshakes into `workspace/complete/milestone-operator-investigation-desk/`
   - rewrite `workspace/current.md` for the next milestone or idle/awaiting-human state
   - if not complete, write exactly one bounded Dev packet with expected DevHS filename
5. Verification and git:
   - do not run live/private/destructive actions
   - run `git status --short --branch`
   - if files are changed, commit and push after review artifacts are complete

## Explicitly Deferred From This Review

- Implementing code.
- Running live API smoke.
- Accepting Record, Intelligence, or Finding terminology.
- Adding pasted zKill link / killmail ID support.
- Adding first-class region investigation.
- Adding relationship graph, footprint story, or fight-cluster timeline behavior.
- Creating Lab adapter tasks or importing Lab doctrine.
- Evidence pruning/deletion.

## Guardrails

- `workspace/current.md` remains the active packet.
- Handshakes are transaction records, not task queues.
- Roadmap/current-state docs define meaning, not hidden task lists.
- Advisory artifacts are not authority until accepted.
- Do not use archived docs as active queues.
- Atlas doctrine stays Atlas-local unless Human explicitly accepts shared promotion.

## Stop Conditions

Return to chat before continuing if:

- milestone closure depends on a Human product decision
- git state contains unrelated changes that cannot be safely separated
- verification evidence conflicts with handoff claims
- closure would require live/private/destructive action
- closing the milestone would obscure an unresolved doctrine or architecture risk

## Verification Required

At minimum run:

```powershell
git status --short --branch
```

If any code or verification logic changes during review, run:

```powershell
npm.cmd run verify:all
npm.cmd run smoke:electron
```

Do not run by default:

- live API smoke without explicit gate/operator approval
- real SDE network download without explicit operator approval
- destructive retention/pruning operations

## Evidence

Overseer updates this before handoff.

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

## Review Handoff

Overseer fills this in when work is complete:

- completed review:
- closure decision:
- files changed:
- verification output:
- handshakes moved:
- next state:
- remaining risk:

## Overseer Review

Overseer fills this in after the next review handoff if needed:

- accepted / redirected:
- doctrine drift:
- architecture risk:
- state updates needed:
- next packet:
