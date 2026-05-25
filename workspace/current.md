# AURA Atlas Current Work

Status: Idle after accepted retention/deletion boundary hardening
Last updated: 2026-05-25

## Active Milestone

Milestone: Retention / Deletion Execution Boundary

Source of intent:

- Human direction on 2026-05-25: focus next on retention/deletion.
- Human policy clarification on 2026-05-25: footprint is an edge case and does not override user selection for deletion.
- Human footprint clarification on 2026-05-25: retained metadata, if any, should be a unique appearance trace in the system that can survive the retention period, not retained raw Evidence.
- `workspace/OverseerHS53-runtime-record-integrity-audit.md`
- `workspace/DevHS57-queue-api-evidence-write-hardening.md`
- `workspace/DevHS58-retention-deletion-execution-boundary.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Current focus: HS58 is accepted. Atlas still does not have production deletion execution. It now has explicit current-state policy and fixture verification proving the retention/deletion boundary, non-destructive preflight, and footprint constraints.

## Executor

Current executor: none; awaiting Human / Overseer selection for the next bounded packet.

Expected handoff filename: none until a new packet is opened.

## Accepted HS58 Understanding

Current implemented behavior:

- `retention.actions` and `retention.preflight` are the only retention service commands.
- `retention.preflight` is read-only destructive preview and non-renderer.
- `evidence.prune_scope` exists only as action metadata/preflight impact, not as executable service command.
- `assessment.compact_from_evidence` exists only as preflight/preview plus explicit Assessment Memory input creation.
- `runtime.db_snapshot.preflight` is read-only.
- `runtime.db_snapshot.create` writes a support artifact but does not prune or delete Evidence.

Accepted policy:

- User-selected deletion must mean deletion of selected deletable records if implemented later.
- Footprint is optional historical-interest metadata only.
- Footprint does not override deletion.
- Footprint must not preserve raw Evidence, full activity events, or hidden copies.
- Assessment Memory may be offered or recommended, but must not silently block or reverse explicit deletion.

HS58 added:

```txt
scripts/verify-retention-deletion-boundary.js
npm.cmd run verify:retention-deletion-boundary
```

HS58 updated durable current-state docs:

```txt
docs/current-state/current-evidence-pipeline.md
docs/current-state/current-terminology-and-retention.md
```

No production deletion execution, service command, schema, migration, IPC, renderer exposure, payload, or contract was added or renamed.

## Accepted Coverage

The new verifier proves:

- `evidence.prune_scope` remains action metadata/preflight only.
- `retention.preflight` and `retention.actions` are read-only service commands.
- There is no executable `evidence.prune_scope` or `assessment.compact_from_evidence` command.
- Confirmation requirements are explicit.
- Matching confirmation allows preflight calculation only, not deletion.
- Evidence prune impact counts affected killmails, activity events, ingestion audits, and data quality warnings.
- Compaction preview is read-only and does not delete Evidence.
- Explicit Assessment Memory creation from preview does not delete Evidence.
- Fixture deletion simulation removes selected killmail Evidence, full activity events, ingestion audit, and related warning.
- Surviving Assessment Memory does not hide `raw_esi_payload`, raw payload checksums, raw attacker arrays, or full activity event rows.

Accepted caveat:

- Assessment Memory may retain minimal historical-interest context, including counts, observed system/region/ship summaries, source run IDs, and sample killmail IDs for citation validation. Whether sample killmail IDs should survive production deletion remains a future policy detail before executable Evidence deletion ships.

## Remaining Work Options

No work is active by default.

Recommended future options, to be selected one at a time:

- policy/design packet defining exact production deletion scope and backup/restore expectations
- narrow fixture-only implementation packet for a simpler destructive action, such as diagnostics/API log pruning
- provenance/API logging sufficiency across non-fixture clients
- Watch authoring/write-boundary consistency
- metadata hydration/label refresh write boundaries
- storage location / file selector authority for heavy local records, backups, exports, snapshots, or cache paths

Do not implement raw Evidence deletion until exact deletion scope, backup/restore expectations, and footprint/citation survival policy are accepted.

## Guardrails

- No implementation is authorized by this idle state.
- No live/private/API calls unless explicitly authorized by the Human.
- Do not mutate the user's real local database.
- Use in-memory or disposable fixture databases only for future verification.
- No UI redesign.
- No schema/migration changes unless a future packet explicitly authorizes them.
- No bridge, IPC, service, payload, command, or contract renames unless a future packet explicitly authorizes them.
- Do not treat archived docs/gap files as active task queues.
- Do not make footprint mandatory unless a future Human decision explicitly does so.
- Do not allow footprint, Assessment Memory, or provenance to keep raw deleted Evidence or full activity events in disguise.
- Do not broaden into storage-location/file-selector work without explicit selection.

## Stop Conditions

Return to Human / Overseer before opening work if:

- deletion execution requires schema/migration work
- footprint requires a new table, file format, or durable storage location
- deletion scope cannot be represented without user-facing policy decisions
- implementation would touch the user's real database
- retention spans multiple unrelated domains in one packet
- Assessment Memory preservation appears to conflict with explicit deletion
- backup/restore behavior becomes necessary
- a fix requires service/command/payload renames
- protected-term output suggests new terminology authority decisions are needed

## Required Verification

HS58 was accepted with:

```powershell
npm.cmd run verify:retention-deletion-boundary
npm.cmd run verify:retention-preflight
npm.cmd run verify:runtime-snapshot
npm.cmd run verify:assessment-artifacts
npm.cmd run verify:evidence-rules
npm.cmd run verify:protected-terms
npm.cmd run verify:all
git status --short --branch
```

Local Overseer verification result: all focused checks passed, and `verify:all` passed 65 scripts including `verify:retention-deletion-boundary`. `verify:protected-terms` passed warning-only with expected advisory warnings across changed verifier/handoff/current-state files.

## Evidence

Accepted handoff:

```txt
workspace/DevHS58-retention-deletion-execution-boundary.md
```

Accepted implementation files:

```txt
scripts/verify-retention-deletion-boundary.js
scripts/verify-group.js
package.json
docs/current-state/current-evidence-pipeline.md
docs/current-state/current-terminology-and-retention.md
```

## Dev Handoff

No Dev packet is open.

The next Dev packet should be selected by Human / Overseer and should name:

- exact destructive/write boundary under review
- allowed files and non-goals
- expected failure/recovery cases
- required offline verification commands
- whether `verify:all` is required
