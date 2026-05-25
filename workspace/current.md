# AURA Atlas Current Work

Status: Active Dev runway opened
Last updated: 2026-05-25

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS60 should improve Atlas runtime observability around partial success, restart state, durable/volatile state clarity, and support artifact classification. This is a read-only/status-surface hardening packet using existing storage and support paths. It must not become UI redesign, live IO, production deletion, storage-location work, or schema/contract expansion.

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
- `workspace/DevHS59-storage-runtime-readwrite-boundary.md`
- `workspace/OverseerHS53-runtime-record-integrity-audit.md`
- `workspace/DevHS57-queue-api-evidence-write-hardening.md`
- `workspace/DevHS58-retention-deletion-execution-boundary.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Accepted HS59 baseline:

- Persistent SQLite state includes Evidence rows, Discovery queue refs, Watch definitions and schedule timestamps, provider/run provenance, API request logs, ingestion audits, warnings, metadata runs, entities, local SDE lookups, and Assessment Memory.
- Volatile runtime state includes task history, locks, cancellation controllers, Watch executor armed state, active task ID, interval timer, last tick, last dispatch, and last blocked reason.
- Support artifacts such as runtime DB snapshots and operator debug trace packs are diagnostics. They are not Evidence, Observation, or Assessment Memory.
- Existing verification already covers the HS59 storage/runtime boundary; no duplicate verifier was needed.

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS60-runtime-observability-readout.md
```

## Ordered Runway

1. Read the accepted authority and current-state inputs listed above, then inspect the existing readout/support paths relevant to runtime observability:
   - `src/main/support/operatorDebugTracePack.js`
   - runtime snapshot service and verifier
   - task runner/task history services
   - Watch executor/scheduler status paths
   - queue selection/report paths
   - partial failure verification paths
2. Audit what the operator/support readouts already expose for:
   - durable state after restart
   - volatile state after restart
   - partial provider/API failure reconstruction
   - retention preflight versus deletion execution
   - support artifact classification for snapshots, trace packs, logs, and reports
3. Implement the smallest read-only improvement if a gap is found. Preferred shape:
   - add a compact runtime boundary/status section to an existing support artifact or read-only report path
   - show durable state basis separately from volatile task/session state
   - show partial-success/failure indicators without claiming completeness
   - classify support artifacts as support/diagnostic rather than Evidence, Observation, or Assessment Memory
4. If existing readouts are already sufficient, do not add redundant fields. Document sufficiency in the handoff and update only current-state docs.
5. Preserve existing terms and boundaries:
   - Discovery refs remain possible leads/provenance until ESI expansion writes Evidence.
   - Reports/readouts are not Evidence.
   - Assessment Memory remains deliberate operator judgment.
   - Watch remains active routine checking, distinct from Marked.
   - retention preflight remains read-only and distinct from deletion.
6. Update focused verification for any changed readout/support path. If code changes are made, update or add the narrowest relevant verifier and run `verify:all`.
7. Update Evidence and Dev Handoff sections in this file, then create `workspace/DevHS60-runtime-observability-readout.md`.

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
- No bridge, IPC, service, payload, command, CSS/test-id, or protected-term renames.
- Do not rename Atlas source-owned terms from terminology or protected-word output.
- Do not treat protected-word discovery as authority or a hard gate.
- Do not broaden into all reporting. Stay on runtime observability and support/readout clarity.

## Stop Conditions

Stop and return to Overseer/Human if:

- a fix requires live ESI/zKill/API access
- a fix requires production deletion execution
- a fix requires schema/migration/storage-location/file-selector work
- verification would need the user's real database
- a support artifact would need to include raw expanded ESI payloads or full participant payloads
- improving clarity requires renderer/UI design decisions
- a readout would blur Evidence, Discovery, Report, Assessment, Watch, or Marked boundaries
- queue/API/log reconstruction cannot be improved without service/contract changes
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

If production code or verifier code changes are made, also run:

```powershell
npm.cmd run verify:all
```

If no code changes are made, Dev must explain why existing readouts are sufficient and still run the minimum required verification.

## Evidence

HS59 accepted by Overseer.

Accepted handoff:

```txt
workspace/DevHS59-storage-runtime-readwrite-boundary.md
```

Overseer verification for HS59:

```powershell
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:partial-failures
npm.cmd run verify:restart-recovery
npm.cmd run verify:retention-deletion-boundary
npm.cmd run verify:runtime-snapshot
npm.cmd run verify:db-integrity
npm.cmd run verify:evidence-rules
npm.cmd run verify:protected-terms
```

Result: all focused checks passed. `verify:protected-terms` passed warning-only with 160 advisory warnings across three changed files. No renames or protected-word JSON updates were performed.

HS60 evidence to be completed by Dev.

Expected evidence:

- files reviewed
- files changed
- readout/support paths audited
- exact runtime observability improvement or sufficiency rationale
- verification commands and results
- protected-term warning count, if any
- confirmation that no live API, real DB mutation, production deletion, schema/migration, storage-location, UI redesign, contract rename, raw payload exposure, or protected-word JSON update occurred

## Dev Handoff

To be completed by Dev in:

```txt
workspace/DevHS60-runtime-observability-readout.md
```
