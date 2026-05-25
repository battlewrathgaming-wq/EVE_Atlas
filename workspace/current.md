# AURA Atlas Current Work

Status: Idle after accepted partial-success report readout
Last updated: 2026-05-25

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS62 is accepted. Atlas now has verified storage/runtime hardening coverage across Queue -> API -> Evidence writes, restart durable/volatile state clarity, retention/deletion preflight separation, runtime/support artifact classification, readiness/runtime boundary status, and corpus-level partial-success status. No Dev packet is open.

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
- `workspace/DevHS57-queue-api-evidence-write-hardening.md`
- `workspace/DevHS58-retention-deletion-execution-boundary.md`
- `workspace/DevHS59-storage-runtime-readwrite-boundary.md`
- `workspace/DevHS60-runtime-observability-readout.md`
- `workspace/DevHS61-operator-runtime-status-readout.md`
- `workspace/DevHS62-partial-success-report-readout.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

## Executor

Current executor: none; awaiting Human / Overseer selection for the next bounded packet.

Expected handoff filename: none until a new packet is opened.

## Accepted HS62 Understanding

HS62 added a compact `partial_success` support status to the existing `report.corpus_health` readout.

Accepted behavior:

- `report.corpus_health.health.partial_success` is read-only support status.
- It is not Evidence, Observation, or Assessment Memory.
- It uses existing local `fetch_runs`, `discovered_killmail_refs`, `api_request_logs`, and `data_quality_warnings`.
- It counts failed fetch runs, failed expansions, warning/error summaries, pending queue refs, failed queue refs, API error logs, and warning groups.
- It warns that local evidence coverage may be incomplete when partial indicators exist.
- It preserves the boundary that Discovery refs remain possible leads until `Enrich selected` performs ESI expansion and writes Evidence.
- Existing `report.corpus_health` fields and behavior were preserved; one read-only structured status field was added.

Files accepted:

```txt
src/main/reports/corpusHealthReport.js
src/main/services/reportResponseService.js
scripts/verify-corpus-health-report.js
docs/current-state/current-evidence-pipeline.md
workspace/DevHS62-partial-success-report-readout.md
```

No live API, real DB mutation, production deletion, schema/migration, storage-location, UI redesign, raw payload exposure, bridge/IPC/service command rename, or protected-word JSON update occurred.

## Storage / Runtime Hardening Coverage

Accepted coverage in this milestone sequence:

- HS57: Queue -> API -> Evidence write confidence, including partial ESI failure, retry, idempotency, API logs, queue state, and provenance.
- HS58: retention/deletion execution boundary, including read-only preflight, no production deletion execution, and footprint constraints.
- HS59: storage/runtime read-write boundary map, including persistent SQLite state, volatile runtime/session state, support artifacts, and write boundaries.
- HS60: `runtime_boundary` status in operator debug trace packs, including durable/volatile basis, partial-failure indicators, support artifact classification, and restart interpretation.
- HS61: compact `runtime_boundary` status exposed through `app.readiness`.
- HS62: compact `partial_success` status exposed through `report.corpus_health`.

The Human maturity-gap headings remain tracked as milestone context. `Clean body snapshot readiness later` remains parked and was not implemented.

## Remaining Work Options

No work is active by default.

Recommended future options, to be selected one at a time:

- clean body snapshot readiness design, still non-destructive and local-only unless explicitly expanded
- production deletion policy design for exact deletion scope, backup/restore expectations, and footprint/citation survival
- storage-location/file-selector authority for heavy Atlas records, backups, exports, snapshots, or cache paths
- one existing operator/report surface to present runtime or partial-success status, if the Human wants renderer-facing work later
- queue stale/expiration policy for old pending/failed/expanded/cached Discovery refs
- provenance/API logging sufficiency across non-fixture clients

## Guardrails

- No implementation is authorized by this idle state.
- No live/private/API calls unless explicitly authorized by the Human.
- Do not mutate the user's real local database.
- Use in-memory or disposable fixture databases for future verification unless a packet explicitly permits otherwise.
- No UI redesign unless a future packet explicitly selects UI/renderer work.
- No production deletion execution until exact deletion scope, backup/restore expectations, and footprint/citation survival policy are accepted.
- No schema/migration changes unless a future packet explicitly authorizes them.
- No bridge, IPC, service, payload, command, or contract renames unless a future packet explicitly authorizes them.
- Do not treat archived docs/gap files as active task queues.
- Do not treat protected-word discovery as authority or a hard gate.
- Do not make footprint mandatory unless a future Human decision explicitly does so.
- Do not allow footprint, Assessment Memory, provenance, reports, snapshots, trace packs, or logs to keep raw deleted Evidence or full activity events in disguise.

## Stop Conditions

Return to Human / Overseer before opening work if:

- a fix requires live ESI/zKill/API access
- a fix requires production deletion execution
- a fix requires schema/migration/storage-location/file-selector work
- verification would need the user's real database
- a readout would need to include raw expanded ESI payloads or full participant payloads
- UI presentation decisions become necessary
- a change would blur Evidence, Discovery, Report, Assessment, Watch, or Marked boundaries
- protected-term warnings suggest a new authority decision is required

## Required Verification

HS62 was accepted with:

```powershell
npm.cmd run verify:corpus-health
npm.cmd run verify:app-readiness
npm.cmd run verify:operator-debug-trace
npm.cmd run verify:partial-failures
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:evidence-rules
npm.cmd run verify:protected-terms
npm.cmd run verify:all
git status --short --branch
```

Result: all focused checks passed and `verify:all` passed 65 scripts. `verify:protected-terms` passed warning-only with 364 advisory warnings across six changed files. No renames or protected-word JSON updates were performed.

## Evidence

Accepted handoff:

```txt
workspace/DevHS62-partial-success-report-readout.md
```

Accepted implementation files:

```txt
src/main/reports/corpusHealthReport.js
src/main/services/reportResponseService.js
scripts/verify-corpus-health-report.js
docs/current-state/current-evidence-pipeline.md
```

## Dev Handoff

No Dev packet is open.

The next Dev packet should be selected by Human / Overseer and should name:

- exact storage/runtime or report/readout boundary under review
- allowed files and non-goals
- required offline verification commands
- whether `verify:all` is required
