# Overseer HS91 - Watch_offline Alpha Observation Runway

Date: 2026-05-26
Role: Atlas Overseer
Status: Dev runway opened
Milestone: Atlas Storage And Runtime Hardening

## Decision

Open a bounded targeted alpha/runtime observation pass using the existing `Watch_offline` readout.

Purpose: decide whether the current readout is sufficient for the next renderer-only R-Scanner prototype, or whether Atlas first needs more runtime hardening such as a minimal durable Watch movement checkpoint.

## Source Of Intent

- Human accepted on 2026-05-26: sync the next bounded lane and proceed with runtime/use observation before UI.
- `workspace/DevHS88-watch-offline-runtime-evidence.md`
- `workspace/OverseerHS89-hs88-runtime-evidence-review.md`
- `workspace/OverseerHS90-keyword-housekeeping-review.md`
- `docs/adr/ADR-0005-watch-offline-readout-aggregation.md`
- `docs/current-state/current-evidence-pipeline.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/overseer.md`

## Dev Packet

Executor:

```txt
Dev
```

Expected handoff:

```txt
workspace/DevHS91-watch-offline-alpha-observation.md
```

## Ordered Runway

1. Re-read the accepted `Watch_offline` state, HS88/HS89 evidence, and HS90 keyword boundary.
2. Inspect the existing operator-facing or service/report surfaces that can currently expose `Watch_offline`, readiness, queue, debug trace, and local context without UI redesign.
3. Run the offline fixture/runtime path from disk and capture what a fresh operator can observe after restart or disarmed startup.
4. Compare observed state against the intended user questions:
   - Is Atlas disarmed or active?
   - Is local context available?
   - Are there pending local Discovery refs?
   - Is provider work deferred/waiting?
   - Is a missed slot recoverable?
   - Is an orphaned run asking for review?
   - Is radius scope valid, missing, or malformed?
   - What is the next safe action?
5. Record gaps as observation findings, not implementation decisions.
6. Do not change behavior unless a direct verifier/readout defect blocks the observation.
7. Create the expected Dev handoff with observed evidence, operator-readability gaps, and recommendation: renderer prototype next, checkpoint design next, or more runtime hardening next.

## Guardrails

- No renderer work.
- No UI redesign.
- No live/private/API calls.
- No new provider calls.
- No schema migration.
- No new sequencer packet table.
- No broad provider work queue.
- No durable movement checkpoint implementation.
- No deletion/retention work.
- No Discovery ref mutation.
- No Evidence/EVEidence writes.
- No metadata hydration coupling.
- No source/bridge terminology rename.
- No R-Scanner implementation.
- Do not treat shared keyword references as Atlas authority.

## Stop Conditions

Stop and return to Overseer/Human if:

- observation requires live provider access
- observation requires renderer/UI work
- observation requires schema or persistence changes
- the readout is insufficient and would need behavior changes rather than evidence capture
- terms blur Watch with Discovery, Evidence/EVEidence, hydration, or Lab presentation
- the work turns into a sequencer/checkpoint implementation

## Required Verification

Run:

```powershell
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-executor
npm.cmd run verify:restart-recovery
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-report
npm.cmd run verify:app-readiness
npm.cmd run verify:operator-debug-trace
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If any verifier or source file changes, also run:

```powershell
npm.cmd run verify:all
```

## Evidence Expectations

The DevHS file should include:

- files reviewed
- files changed, if any
- exact commands run and pass/fail status
- brief observed readout/state evidence
- what an operator can understand today
- what remains too hidden, too raw, too noisy, or too ambiguous
- confirmation that no live/API calls, renderer work, schema changes, Evidence writes, Discovery ref mutation, hydration coupling, or terminology rename occurred
- recommendation for the next bounded packet
