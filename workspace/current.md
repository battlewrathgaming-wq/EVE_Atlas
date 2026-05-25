# AURA Atlas Current Work

Status: Active Dev runway opened
Last updated: 2026-05-25

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS62 should make partial-success status clearer in one existing report response using existing fetch run, API log, warning, and queue status records. This is a narrow read-only report/status hardening packet. It must not add storage, call live APIs, redesign renderer UI, or change Evidence/Discovery/Report/Assessment meaning.

Source of intent:

- Human direction on 2026-05-25: continue the Atlas storage/runtime hardening milestone.
- Human advisory maturity headings on 2026-05-25:
  - Storage/runtime hardening.
  - Queue -> API -> Evidence write confidence.
  - Restart recovery and durable/volatile state clarity.
  - Evidence, Discovery, Report, Assessment, Watch, Marked boundaries.
  - Retention/deletion preflight clarity.
  - Support artifact classification: snapshots, trace packs, logs.
  - Provider/API partial failure reconstruction.
  - Clean body snapshot readiness later.
- `workspace/DevHS61-operator-runtime-status-readout.md`
- `workspace/DevHS60-runtime-observability-readout.md`
- `workspace/DevHS59-storage-runtime-readwrite-boundary.md`
- `workspace/DevHS57-queue-api-evidence-write-hardening.md`
- `workspace/DevHS58-retention-deletion-execution-boundary.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Accepted HS61 baseline:

- `app.readiness` now exposes compact `runtime_boundary` support status.
- Operator debug trace packs and `app.readiness` reuse the same source-owned runtime boundary model from `src/main/support/runtimeBoundaryStatus.js`.
- The status separates durable SQLite state from volatile task/session state and summarizes partial-failure indicators.
- Existing readiness fields were preserved; a new read-only field was added.
- No live API, real DB mutation, production deletion, schema/migration, storage-location, UI redesign, raw payload exposure, disruptive contract rename, or protected-word JSON update occurred.

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS62-partial-success-report-readout.md
```

## Ordered Runway

1. Read the accepted HS61 handoff and implementation, then inspect existing report/readout surfaces that already summarize local evidence, queue, provider, or corpus state.
2. Choose exactly one existing read-only report/support response where partial-success context belongs most naturally. Recommended candidates:
   - corpus health report
   - run report
   - queue report
   - report response wrapper if it can add generic status without disrupting report contracts
3. Define the smallest useful partial-success status for that one surface using existing data only:
   - failed fetch runs
   - failed expansions
   - fetch runs with warning/error summaries
   - pending/failed queue refs
   - API errors
   - warning groups
   - clear wording that partial success is not complete coverage
4. Implement only the chosen readout addition. Preserve existing fields and behavior. Do not add a new service command unless the chosen existing surface already has an accepted extension point.
5. Keep report meaning precise:
   - Reports/readouts are not Evidence.
   - Discovery refs remain possible leads/provenance until ESI expansion writes Evidence.
   - Assessment Memory remains deliberate operator judgment.
   - Watch remains active routine checking, distinct from Marked.
   - partial success must not be rendered as complete evidence coverage.
6. Update the focused verifier for the chosen surface. If production report/support code changes, run `verify:all`.
7. Update durable current-state docs only where the implemented report/status behavior is confirmed.
8. Update Evidence and Dev Handoff sections in this file, then create `workspace/DevHS62-partial-success-report-readout.md`.

## Guardrails And Non-Goals

- No live/private/API calls.
- Do not mutate the user's real local database.
- Use in-memory or disposable fixture databases only.
- No UI redesign, renderer layout work, Lab display adoption, or presentation animation.
- No production deletion execution.
- No new footprint storage/table/file format.
- No storage-location/file-selector work.
- No clean body snapshot implementation in this packet; keep it parked as later readiness.
- No schema or migration changes unless a verified blocker makes them unavoidable; stop before implementing them.
- No bridge, IPC, service, payload, command, CSS/test-id, or protected-term renames unless the chosen existing report/readout already allows a documented response-field addition. If a field is added, preserve existing fields and document it.
- Do not rename Atlas source-owned terms from terminology or protected-word output.
- Do not treat protected-word discovery as authority or a hard gate.
- Do not broaden into all reporting. Choose one surface.

## Stop Conditions

Stop and return to Overseer/Human if:

- a fix requires live ESI/zKill/API access
- a fix requires production deletion execution
- a fix requires schema/migration/storage-location/file-selector work
- verification would need the user's real database
- a readout would need to include raw expanded ESI payloads or full participant payloads
- improving clarity requires renderer/UI design decisions
- a readout would blur Evidence, Discovery, Report, Assessment, Watch, or Marked boundaries
- partial success cannot be represented without new storage or disruptive service/contract changes
- clean body snapshot design becomes necessary
- protected-term warnings suggest a new authority decision is required

## Required Verification

Minimum required verification:

```powershell
npm.cmd run verify:app-readiness
npm.cmd run verify:operator-debug-trace
npm.cmd run verify:partial-failures
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:evidence-rules
npm.cmd run verify:protected-terms
git status --short --branch
```

Also run the focused verifier for the chosen report/readout surface.

If production report/support code or verifier code changes are made, also run:

```powershell
npm.cmd run verify:all
```

## Evidence

HS61 accepted by Overseer.

Accepted handoff:

```txt
workspace/DevHS61-operator-runtime-status-readout.md
```

Overseer verification for HS61:

```powershell
npm.cmd run verify:app-readiness
npm.cmd run verify:operator-debug-trace
npm.cmd run verify:runtime-snapshot
npm.cmd run verify:restart-recovery
npm.cmd run verify:partial-failures
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:retention-deletion-boundary
npm.cmd run verify:evidence-rules
npm.cmd run verify:protected-terms
npm.cmd run verify:all
```

Result: all focused checks passed and `verify:all` passed 65 scripts. `verify:protected-terms` passed warning-only with 280 advisory warnings across seven changed files. No renames or protected-word JSON updates were performed.

HS62 evidence to be completed by Dev.

Expected evidence:

- files reviewed
- files changed
- chosen report/readout surface
- exact partial-success fields or indicators exposed
- verification commands and results
- protected-term warning count, if any
- confirmation that no live API, real DB mutation, production deletion, schema/migration, storage-location, UI redesign, raw payload exposure, disruptive contract rename, or protected-word JSON update occurred

## Dev Handoff

To be completed by Dev in:

```txt
workspace/DevHS62-partial-success-report-readout.md
```
