# AURA Atlas Current Work

Status: Idle - awaiting Human selection
Last updated: 2026-05-24

## Active Milestone

No active Dev milestone.

Local Alpha Trial Readiness is closed as of `workspace/complete/milestone-local-alpha-trial-readiness/OverseerHS33-local-alpha-readiness-closure.md` and `docs/audits/audit-2026-05-24-local-alpha-readiness-closure.md`.

## Current Focus

Atlas is ready for either a Human manual local-alpha UI trial or a new selected milestone. Do not start Dev implementation until the Human chooses the next direction and Overseer writes a bounded runway.

## Source Of Intent

Accepted sources:

- Human selection of Local Alpha Trial Readiness.
- `docs/roadmap/local-alpha-trial-readiness.md`
- `workspace/complete/milestone-local-alpha-trial-readiness/OverseerHS29-local-alpha-selection.md`
- `workspace/complete/milestone-local-alpha-trial-readiness/DevHS30-local-alpha-doc-readiness.md`
- `workspace/complete/milestone-local-alpha-trial-readiness/OverseerHS31-local-alpha-doc-review.md`
- `workspace/complete/milestone-local-alpha-trial-readiness/DevHS32-local-alpha-offline-walkthrough.md`
- `workspace/complete/milestone-local-alpha-trial-readiness/OverseerHS33-local-alpha-readiness-closure.md`
- `docs/audits/audit-2026-05-24-local-alpha-readiness-closure.md`
- `docs/runbooks/local-alpha-trial.md`
- `docs/runbooks/local-alpha-known-limits-and-feedback.md`
- `docs/runbooks/local-alpha-release-tag-checklist.md`

Advisory disposition:

- `AGENTS.md` advisory/protocol clarification accepted as repo-local workflow guidance.
- No archived `docs/gap` file is active task authority.
- No shared/Lab presentation advisory has been promoted into Atlas product direction.

## Executor

Current executor: Human / Overseer selection.

Dev is not active.

Expected DevHS filename: none until a new Dev packet is written.

## Closed Readiness Evidence

HS32 and Overseer review confirmed:

- Demo fixture DB seed works through `npm.cmd run seed:demo-db`.
- Fixture-backed corpus health, actor report, radius report, snapshot, and debug trace paths work without live API use.
- README and local-alpha runbooks now use `npm.cmd run ...` for Windows PowerShell repeatability.
- `npm.cmd run verify:all` passed.
- `npm.cmd run smoke:electron` passed.

## Guardrails

- Do not run live/private/destructive actions without explicit Human authorization.
- Do not treat archived docs or handshakes as active task queues.
- Do not broaden into public release packaging.
- Do not add product features merely to keep Dev busy.
- Do not rewrite Atlas doctrine from Lab/shared presentation work without a deliberate Atlas milestone decision.

## Stop Conditions

Stop and ask the Human if:

- the next requested direction changes product scope or doctrine
- live API smoke, private data, tagging, or destructive cleanup is requested
- a fresh Dev runway would require choosing between multiple product directions
- verification fails in a way that changes readiness acceptance

## Verification Record

Latest accepted verification:

```powershell
npm.cmd run verify:all
npm.cmd run smoke:electron
```

Result:

```txt
PASS - npm.cmd run verify:all
PASS - npm.cmd run smoke:electron
```

## Evidence

Overseer acceptance:

```txt
workspace/complete/milestone-local-alpha-trial-readiness/OverseerHS33-local-alpha-readiness-closure.md
```

Closed milestone handshakes were batch-moved to:

```txt
workspace/complete/milestone-local-alpha-trial-readiness/
```

## Dev Handoff

No active Dev handoff is expected.

When the Human chooses the next direction, Overseer should write a fresh bounded packet with:

- active milestone and focus
- accepted sources of intent
- current executor
- expected DevHS filename when Dev is active
- ordered runway
- guardrails and non-goals
- stop conditions
- exact verification
- Evidence and Dev Handoff sections
