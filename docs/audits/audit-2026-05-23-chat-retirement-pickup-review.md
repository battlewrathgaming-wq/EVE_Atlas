# Audit: Chat Retirement Pickup Review

Date: 2026-05-23
Status: Active handoff note
Scope: Atlas agent operations, current milestone, and pickup risks

## Purpose

This note preserves the outgoing chat's oversight state before work moves into a new Atlas project-thread context.

It is not a new task queue. The active executable work surface remains:

```text
workspace/current.md
```

This audit exists so the next Overseer/Dev chat can recover context quickly without relying on chat memory.

## Current Milestone

Active milestone:

```text
Aggressive Testing And Operator Bug Hunting
```

Mission:

Prove Atlas is stable under real operator use, refusal paths, interrupted work, and edge cases before treating the rigging layer as dependable.

The current active packet is:

```text
workspace/current.md
```

Expected Dev handoff:

```text
DevHS01-atlas-aggressive-operator-runway.md
```

At the time of this review, no completed `DevHS01` handoff was observed, and the Evidence / Dev Handoff sections in `workspace/current.md` were still empty.

## Active Agent Operating Model

Atlas now separates durable project memory from executable agent work:

- `docs/` contains doctrine, contracts, current-state notes, audits, terms, schemas, features, and roadmap material.
- `workspace/current.md` is the only active executable work packet.
- `workspace/overview.md` tracks active milestone state.
- `workspace/00-dot-protocol.md` defines role-specific Dev / Overseer behavior.
- `workspace/complete/` is for accepted milestone handshakes.
- `docs/archive/deprecated-gap-workflow-2026-05-23/` contains the retired `docs/gap` task lifecycle.

Agents should not recreate `docs/gap` task files unless a future explicit decision changes the operating model.

## Primary Open Work

### 1. Operator Rugged Smoke

Exercise the Electron UI as an operator rather than as a developer.

Cover:

- readiness
- demo DB
- queue/watch views
- manual discovery
- manual expansion
- reports
- metadata hydration
- assessment creation/review
- runtime snapshot
- debug trace pack

The goal is to find confusing states, broken control flow, bad empty states, unsafe messages, and places where the UI implies more certainty than the evidence supports.

### 2. Live API Refusal Matrix

Verify live-capable actions refuse cleanly when live gates are closed.

Expected refusal behavior:

- no accidental zKill/ESI calls
- no evidence writes
- clear operator-facing message
- no dangling task state
- no hidden collection through passive/read-only surfaces

### 3. Narrow Live Smoke

Only run if explicitly authorized.

Expected shape:

- disposable DB under `F:\Projects\AURA-Atlas\.tmp`
- explicit `AURA_ATLAS_LIVE_API=1`
- narrow known target
- tiny caps
- preserved run IDs, DB path, artifacts, and trace pack

Discovery-only and expansion smoke must remain clearly separated.

### 4. Task Concurrency And Cancellation Pressure

Stress the task system around:

- overlapping evidence-creating tasks
- metadata-only tasks
- cancellation during worker/API paths
- failed task rerun
- lock release
- visible failure state
- evidence preservation

The aim is to verify that failed or interrupted work leaves Atlas inspectable, restartable, and evidence-safe.

### 5. Docs And Test Index Reconciliation

Only update documentation where project truth changed.

Known documentation drift:

- historical audits and archived docs still mention `docs/gap`, which is expected
- some current-state or runbook references may still imply the old `docs/gap` workflow is active

Any cleanup should reinforce that `workspace/current.md` is the active execution surface.

## Known Watch Items

- No `DevHS01` handoff was present at the time of review.
- `workspace/current.md` still needs Evidence and Dev Handoff updates after Dev execution.
- Task history is volatile/in-memory; acceptable for now, but should be tested under cancellation and failure.
- Session-armed watch execution can dispatch immediately when armed; UI and tests must make that operator implication explicit.
- Some service task scope locks may be conservative or broad; concurrency tests should confirm they block safely rather than corrupting state.
- Retention/pruning remains blocked until assessment artifact persistence and operator-safe preflight are mature enough.
- Presentation is improving, but current Atlas confidence should come from rigging and evidence safety, not polish.

## Project Invariants To Preserve

- zKill is discovery only.
- Expanded ESI killmails are evidence.
- Queue refs are not evidence.
- Activity events are observations derived from evidence.
- Assessments are deliberate memory.
- UI presents; it does not author truth.
- Reports inspect stored evidence plus local metadata.
- SDE zip/source is setup/import material, not runtime lookup data.
- Passive views must stay passive.
- Live API calls require explicit gate and visible operator intent.

## Recommended Next Chat Bootstrap

The next Atlas chat should begin by reading:

```text
docs/index.md
docs/tenets/tenets.md
workspace/README.md
workspace/00-dot-protocol.md
workspace/overview.md
workspace/current.md
```

Then it should inspect the latest git state and any new handoff files before issuing new instructions.

## Recommendation

Continue the current milestone rather than opening a new architectural lane.

The next useful output is not another planning document. It is a completed Dev handoff for the aggressive testing runway, with concrete evidence from operator smoke, refusal tests, cancellation/locking pressure, and any truth-changing documentation updates.
