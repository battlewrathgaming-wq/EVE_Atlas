# Roadmap: Local Alpha Trial Readiness

Date: 2026-05-22
Status: Closed 2026-05-24

## Purpose

Atlas has moved beyond pipeline rigging. The app now has:

- evidence ingestion foundations
- local SDE topology/type metadata
- controlled discovery and expansion
- actor/radius/corporation reports
- assessment memory
- corpus health
- runtime snapshot safety
- bounded debug trace packs
- renderer surfaces for the safe operator paths

The next milestone should make Atlas ready for a small local alpha trial: one operator, one machine, explicit actions, reviewable artifacts, no hidden live collection.

## Mission

Prepare Atlas to be used deliberately against a small set of real questions while preserving evidence boundaries.

The goal is not to add more intelligence features. The goal is to make the current feature set understandable, repeatable, and reviewable.

## Local Alpha Trial Definition

A local alpha trial is successful when an operator can:

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

The trial should be possible without live APIs, using fixture/offline paths, and optionally repeatable with live gates enabled for a deliberately chosen target/window.

## Non-Goals

- Do not add passive background collection.
- Do not add automatic queue expansion.
- Do not add evidence pruning.
- Do not add map rendering.
- Do not add AI commentary.
- Do not package for public distribution yet.
- Do not treat assessment memory as evidence.

## Completion Criteria

- The README reflects the current app, not the early pipeline-only milestone.
- A local alpha runbook exists for offline and optional live-gated operation.
- A reproducible demo/fixture DB path exists or is explicitly deferred.
- A release/tag checklist exists for safe checkpoints.
- Known alpha blockers and accepted limitations are documented.
- `verify:all` and `smoke:electron` pass at handoff.

## Closure

Closed by `workspace/complete/milestone-local-alpha-trial-readiness/OverseerHS33-local-alpha-readiness-closure.md`.

Durable closure audit: `docs/audits/audit-2026-05-24-local-alpha-readiness-closure.md`.

Accepted evidence:

- `workspace/complete/milestone-local-alpha-trial-readiness/DevHS30-local-alpha-doc-readiness.md`
- `workspace/complete/milestone-local-alpha-trial-readiness/OverseerHS31-local-alpha-doc-review.md`
- `workspace/complete/milestone-local-alpha-trial-readiness/DevHS32-local-alpha-offline-walkthrough.md`
- `workspace/complete/milestone-local-alpha-trial-readiness/OverseerHS33-local-alpha-readiness-closure.md`

HS32 rehearsed the fixture-backed offline path and corrected Windows PowerShell command examples from `npm run ...` to `npm.cmd run ...` where needed. Overseer reran `npm.cmd run verify:all` and `npm.cmd run smoke:electron`; both passed.

Remaining work is outside this readiness milestone: the Human/operator still needs to follow the UI runbook manually to record lived operator friction, or choose the next Atlas milestone.

## Recommended Order

1. Refresh README and operator quickstart.
2. Add a local alpha runbook.
3. Add or decide on a reproducible demo DB seed.
4. Add release/tag checkpoint checklist.
5. Add alpha known-limits and feedback capture notes.

## Boundary Reminder

Alpha readiness is about making current safe paths usable. It is not permission to widen collection.
