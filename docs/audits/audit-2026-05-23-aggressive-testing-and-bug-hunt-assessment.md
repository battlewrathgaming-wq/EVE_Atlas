# Audit: Aggressive Testing And Bug Hunt Assessment

Date: 2026-05-23

Scope: Full overseer assessment of AURA Atlas after local alpha readiness and explicit SDE lookup builder work.

## Verification Performed

Offline verification:

```txt
npm.cmd run verify:all
```

Result: passed.

The suite ran 54 scripts, including core service/IPC checks, evidence-rule regressions, SDE lookup builder verification, queue/report/manual/actor/corporation paths, bulk synthetic checks, local scale smoke, controlled workflow, operator workflow, and debug trace pack verification.

Electron smoke:

```txt
npm.cmd run smoke:electron
```

Result: passed.

The smoke opened Electron through the project script and wrote artifacts under:

```txt
F:\Projects\AURA-Atlas\.tmp\electron-visual-smoke
```

## Current Assessment

Atlas has crossed the initial rigging threshold. The normal offline suite is broad, and the Electron shell has a working smoke path. The next risk is not missing basic service vocabulary. The next risk is that edge cases, bad inputs, interrupted work, partial imports, task overlap, and real operator paths reveal boundary leaks that happy-path verification does not catch.

The project should now move into an explicit testing and bug-hunting milestone.

## Accepted Strengths

- Evidence doctrine remains strongly represented in code and tests.
- zKill discovery and ESI expansion remain separated.
- Reports use stored evidence and local metadata.
- SDE zip/source material has been moved behind explicit lookup-table build behavior.
- Readiness, corpus health, snapshots, trace packs, and reports remain read-only/support surfaces.
- Live API work remains gated.
- Task classification and locking are implemented and verified.
- Renderer code is modularized and uses the preload service bridge.
- Local scale smoke confirms current report paths are fast at the existing synthetic size.

## Main Risk Areas

### 1. Happy-path bias

The verification suite is broad but mostly deterministic and expected-flow oriented. Atlas now needs adversarial fixtures:

- malformed killmails
- missing IDs
- NPC-only attackers
- duplicate attacker corporation/alliance appearances
- changed hashes
- inconsistent queue refs
- partially hydrated labels
- stale or mismatched SDE metadata

### 2. Partial failure and crash behavior

The app needs explicit tests for interrupted import, cancelled expansion, failed metadata hydration, failed zKill discovery, failed ESI expansion, and simulated mid-transaction exceptions.

The desired behavior is not always "succeed"; it is "fail visibly, preserve evidence, release locks, and leave reviewable diagnostics."

### 3. Runtime side effects

Passive surfaces must remain passive:

- readiness
- corpus health
- queue/watch preview
- report display
- debug trace pack creation
- snapshot preflight

Testing should confirm these surfaces do not create fetch runs, API logs, killmails, activity events, queue refs, or assessment artifacts except where explicitly intended.

### 4. SDE lookup builder failure modes

The successful SDE lookup builder path is verified. The next tests should focus on:

- failed download
- bad zip/source
- interrupted import
- cleanup behavior
- `AURA_ATLAS_KEEP_SDE_SOURCE=1`
- preserving existing lookup tables after failure

### 5. UI ruggedness

Electron smoke proves startup and broad surface presence. It does not yet prove a full operator click path across:

- readiness
- demo DB
- queue/watch
- manual discovery preflight
- manual expansion preflight
- report loading
- hydration preflight
- assessment save/review
- trace pack
- snapshot preflight

This should be tested with long labels, unresolved IDs, empty states, partial samples, warnings, and narrow window sizes.

### 6. Concurrency and cancellation pressure

Task locks and cancellation exist, but bug hunting should attack combinations:

- exclusive SDE build while reports run
- manual expansion while watch execution is armed
- cancellation during HTTP work
- cancellation during queued worker processing
- task failure followed by immediate rerun
- app restart after a running/failed task

### 7. Larger synthetic scale

The current local scale smoke is useful but modest. The next round should include larger synthetic DBs and explicit performance thresholds so process-isolation decisions are driven by evidence rather than intuition.

## Recommended Milestone

```txt
Aggressive Testing And Bug Hunting
```

Mission:

Attack Atlas with bad inputs, interrupted workflows, scale pressure, UI edge cases, and boundary-abuse attempts before treating the local alpha as stable.

This milestone should leave Atlas with:

- adversarial fixture coverage
- failure-mode tests around SDE, live APIs, queue, expansion, hydration, and reports
- rugged UI smoke through a seeded/demo DB
- passive-surface side-effect checks
- concurrency/cancellation stress tests
- larger synthetic scale thresholds
- reviewable bug reports or completed fixes for every failure found

## New Task Files

Added to `docs/gap/to-do`:

- `adversarial-evidence-fixture-suite.md`
- `partial-failure-and-transaction-integrity.md`
- `passive-surface-side-effect-sweep.md`
- `sde-lookup-builder-failure-modes.md`
- `electron-operator-rugged-smoke.md`
- `task-concurrency-and-cancellation-stress.md`
- `large-synthetic-scale-pressure.md`
- `live-api-refusal-and-smoke-matrix.md`
- `documentation-drift-and-test-index.md`

