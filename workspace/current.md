# AURA Atlas Current Work

Status: Active Dev runway opened
Last updated: 2026-05-25

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS61 should expose the accepted HS60 runtime boundary status through an existing read-only report/support response so an operator or support agent can inspect partial success, restart state, durable/volatile state, and support artifact classification without opening the full debug trace artifact. This remains a backend/support readout packet, not renderer redesign.

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
- `workspace/DevHS60-runtime-observability-readout.md`
- `workspace/DevHS59-storage-runtime-readwrite-boundary.md`
- `workspace/OverseerHS53-runtime-record-integrity-audit.md`
- `workspace/DevHS57-queue-api-evidence-write-hardening.md`
- `workspace/DevHS58-retention-deletion-execution-boundary.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Accepted HS60 baseline:

- Operator debug trace packs now include a compact `runtime_boundary` section.
- `runtime_boundary` is read-only support/readout data and is not Evidence, Observation, or Assessment Memory.
- The readout separates durable SQLite state from volatile task/session state.
- The readout includes partial failure indicators, support artifact classification, restart interpretation, and boundary reminders.
- No live API, real DB mutation, production deletion, schema/migration, storage-location, UI redesign, contract rename, raw payload exposure, or protected-word JSON update occurred.

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS61-operator-runtime-status-readout.md
```

## Ordered Runway

1. Read the accepted HS60 handoff and implementation, then inspect existing report/support response paths that could expose a compact runtime status without renderer redesign.
2. Choose the smallest existing backend/support surface for this readout. Prefer one of:
   - a support/debug service response summary
   - an existing corpus/readiness/status report model
   - a CLI/report path that already reads local runtime support state
3. Reuse the HS60 `runtime_boundary` meaning rather than inventing a second model. Refactor only if needed to avoid duplication.
4. The exposed status should include, in compact form:
   - durable state basis
   - volatile state basis
   - partial failure indicators
   - restart interpretation
   - support artifact classification
   - reminders that reports/readouts/logs/snapshots are not Evidence, Observation, or Assessment Memory
5. Keep the output read-only and local. It may summarize existing rows/artifacts but must not call zKill/ESI, mutate evidence, execute deletion, create snapshots automatically, or expose raw expanded ESI payloads/full participant payloads.
6. Update the narrowest verifier for the chosen surface. If the change affects production support/report code, run `verify:all`.
7. Update durable current-state docs only where a new implemented readout surface is confirmed.
8. Update Evidence and Dev Handoff sections in this file, then create `workspace/DevHS61-operator-runtime-status-readout.md`.

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
- No bridge, IPC, service, payload, command, CSS/test-id, or protected-term renames unless a direct existing report/support command already requires a documented response-field addition. If a new field is added, preserve existing fields and document it.
- Do not rename Atlas source-owned terms from terminology or protected-word output.
- Do not treat protected-word discovery as authority or a hard gate.
- Do not broaden into renderer-facing UX or all reporting. Stay on compact runtime status/readout exposure.

## Stop Conditions

Stop and return to Overseer/Human if:

- a fix requires live ESI/zKill/API access
- a fix requires production deletion execution
- a fix requires schema/migration/storage-location/file-selector work
- verification would need the user's real database
- a readout would need to include raw expanded ESI payloads or full participant payloads
- improving clarity requires renderer/UI design decisions
- a readout would blur Evidence, Discovery, Report, Assessment, Watch, or Marked boundaries
- queue/API/log reconstruction cannot be improved without disruptive service/contract changes
- clean body snapshot design becomes necessary
- protected-term warnings suggest a new authority decision is required

## Required Verification

Minimum required verification:

```powershell
npm.cmd run verify:operator-debug-trace
npm.cmd run verify:runtime-snapshot
npm.cmd run verify:restart-recovery
npm.cmd run verify:partial-failures
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:retention-deletion-boundary
npm.cmd run verify:evidence-rules
npm.cmd run verify:protected-terms
git status --short --branch
```

Also run the focused verifier for the chosen readout/support surface.

If production code or verifier code changes are made, also run:

```powershell
npm.cmd run verify:all
```

## Evidence

HS60 accepted by Overseer.

Accepted handoff:

```txt
workspace/DevHS60-runtime-observability-readout.md
```

Overseer verification for HS60:

```powershell
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

Result: all focused checks passed and `verify:all` passed 65 scripts. `verify:protected-terms` passed warning-only with 174 advisory warnings across four changed files. No renames or protected-word JSON updates were performed.

HS61 evidence to be completed by Dev.

Expected evidence:

- files reviewed
- files changed
- chosen readout/support surface
- exact runtime status fields exposed
- verification commands and results
- protected-term warning count, if any
- confirmation that no live API, real DB mutation, production deletion, schema/migration, storage-location, UI redesign, raw payload exposure, disruptive contract rename, or protected-word JSON update occurred

## Dev Handoff

To be completed by Dev in:

```txt
workspace/DevHS61-operator-runtime-status-readout.md
```
