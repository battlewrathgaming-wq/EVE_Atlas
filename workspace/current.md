# Current Workspace Packet

Status: Active
Updated: 2026-05-24
Owner: Overseer planning, Dev execution

## Coordination State

Active milestone: Local Alpha Trial Readiness
Roadmap source: `docs/roadmap/local-alpha-trial-readiness.md`
Sequence: HS32
Previous accepted handshake: `workspace/DevHS30-local-alpha-doc-readiness.md`
Latest Overseer review: `workspace/OverseerHS31-local-alpha-doc-review.md`
Current executor: Dev
Current focus: offline local-alpha walkthrough rehearsal
Expected output: DevHS32-local-alpha-offline-walkthrough.md

## Purpose

Exercise the refreshed local-alpha documentation as a one-operator offline rehearsal and record any friction before a real alpha trial.

This packet should prove that the current README/runbook path is usable with fixture/demo data and no live API work. It is not a feature implementation packet and not a public packaging packet.

## Required Reading

- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/DevHS30-local-alpha-doc-readiness.md`
- `workspace/OverseerHS31-local-alpha-doc-review.md`
- `docs/roadmap/local-alpha-trial-readiness.md`
- `README.md`
- `docs/runbooks/local-alpha-trial.md`
- `docs/runbooks/local-alpha-known-limits-and-feedback.md`
- `docs/runbooks/local-alpha-release-tag-checklist.md`

## Accepted Product Requirement

Local alpha means:

```txt
one operator
one machine
explicit actions
reviewable artifacts
no hidden live collection
```

The rehearsal must stay offline/fixture-first. Live API smoke remains optional future work and must not run in this packet.

## Ordered Dev Runway

1. Walkthrough setup:
   - read the refreshed README and local-alpha runbook as if following them fresh
   - seed the offline demo DB using the documented command
   - set `AURA_ATLAS_DB_PATH` to the demo fixture DB for any command-line checks that need it
2. Offline path rehearsal:
   - run the documented verification commands that prove the local app is healthy
   - run or inspect fixture-backed paths that correspond to readiness, corpus health, scoped question, report, assessment memory, snapshot, and trace pack where supported by existing commands
   - do not run live API smoke, real SDE network download, or destructive operations
3. Documentation friction notes:
   - if a documented step is unclear, stale, missing a command, or names the wrong artifact path, update only the relevant docs
   - keep edits narrowly limited to README/runbook/checklist/known-limits wording unless a real blocker appears
4. Evidence capture:
   - record the exact commands run and key artifact paths
   - record whether the demo DB path, Electron smoke artifact path, runtime snapshot path, and trace pack path were produced or intentionally skipped
5. Verification:
   - run `npm.cmd run verify:all`
   - run `npm.cmd run smoke:electron`
   - run `git status --short --branch`

## Explicitly Deferred From This Packet

- New renderer features.
- Code changes unless a documentation-linked verification blocker requires returning to chat.
- Public packaging or release distribution.
- Live API smoke.
- Real SDE network download.
- Evidence pruning/deletion.
- Record, Intelligence, or Finding terminology decisions.
- zKill link / killmail ID paste support.
- First-class region investigation.
- Relationship graph, footprint story, or fight-cluster timeline behavior.
- Lab/shared presentation adoption.

## Guardrails

- Offline fixture/demo operation is the primary path.
- Do not create live evidence.
- Do not broaden Local Alpha into public release work.
- Do not weaken live/API gates or evidence doctrine.
- Keep Atlas doctrine project-local.
- If a runbook step would require live/private/destructive action, mark it skipped and explain why.

## Stop Conditions

Return to chat before continuing if:

- the runbook cannot produce a viable offline rehearsal with current features
- verification fails in a way that implies product or architecture risk
- completing the rehearsal requires code changes
- live/private/destructive action appears necessary
- the docs require a Human decision about alpha scope

## Verification Required

Run:

```powershell
npm.cmd run verify:all
npm.cmd run smoke:electron
git status --short --branch
```

Do not run:

- live API smoke
- real SDE network download
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
- tests/docs updated:
- verification output:
- artifacts produced:
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
