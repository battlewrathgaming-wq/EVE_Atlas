# AURA Atlas Current Work

Status: Active Dev runway opened
Last updated: 2026-05-25

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS59 should establish a verified, source-owned map of Atlas read/write boundaries after Queue/API/Evidence and retention/deletion hardening. The goal is to make restart, partial failure, queue state, provenance, retention preflight, and support artifacts reviewable without opening live IO, production deletion, storage-location work, or UI redesign.

Source of intent:

- Human direction on 2026-05-25: kick off the Atlas storage/runtime hardening milestone.
- Human direction on 2026-05-25: runtime and connection hardening are important, especially timing, task queue/API-to-ESI behavior, SQLite/local memory runtime behavior, and IO hardening for a connected app.
- Human policy clarification on 2026-05-25: deletion/retention remains focused; footprint is an edge case, does not override user deletion, and is only a historical-interest trace if accepted later.
- `workspace/OverseerHS52-runtime-record-integrity-design-input.md`
- `workspace/OverseerHS53-runtime-record-integrity-audit.md`
- `workspace/DevHS57-queue-api-evidence-write-hardening.md`
- `workspace/DevHS58-retention-deletion-execution-boundary.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Accepted prior baseline:

- HS57 verified Queue -> API -> Evidence write behavior with fixture-backed partial failure, retry, idempotency, queue state, API logs, and provenance.
- HS58 verified retention/deletion remains preflight-only; no production deletion execution exists; footprint must not retain raw Evidence, full activity events, or hidden copies.
- HS53 found persistent queue/watch/evidence/provenance state is split from volatile executor/task/session state after restart. That split is acceptable only if it stays visible and verifiable.

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS59-storage-runtime-readwrite-boundary.md
```

## Ordered Runway

1. Read the accepted authority and current-state inputs listed above, plus the implementation files needed to trace queue state, task/run state, retention preflight, runtime snapshots, API logs, and evidence persistence.
2. Produce a concise current-state map for the HS59 boundary:
   - persistent state: SQLite rows/artifacts that survive restart
   - volatile state: in-memory task/session/executor state that does not survive restart
   - support artifacts: runtime snapshots, logs, reports, or diagnostics that are not Evidence
   - write boundaries: commands that write local state, what they write, and what they must not write
3. Add or refine one focused offline verifier for the storage/runtime read-write boundary if a verifier gap exists. Prefer fixture/in-memory databases. The verifier should prove at least:
   - Discovery refs remain queue/provenance until ESI expansion writes Evidence.
   - partial ESI/API failure remains reconstructable through queue state, fetch runs, API logs, warnings, and successful Evidence writes.
   - restart-style recovery preserves durable queue/watch/evidence/provenance state while volatile task/session state is not treated as durable.
   - retention preflight and runtime snapshot behavior stay distinct from Evidence deletion/pruning.
4. If no new verifier is needed, document why existing verifiers already cover the boundary and add only documentation/handoff evidence. Do not add duplicate test scripts for coverage that already exists.
5. Update durable current-state docs only where HS59 confirms an implemented behavior or accepted limitation. Keep proposed policy separate from implemented behavior.
6. Update the Evidence and Dev Handoff sections in this file with exact files changed, verification commands, warning counts, and remaining risks.
7. Create `workspace/DevHS59-storage-runtime-readwrite-boundary.md` with the boundary map, current behavior, verification evidence, risks, and recommended next bounded packet.

## Guardrails And Non-Goals

- No live/private/API calls.
- Do not mutate the user's real local database.
- Use in-memory or disposable fixture databases only.
- No UI redesign, renderer layout work, or Lab display adoption.
- No production deletion execution.
- No new footprint storage/table/file format.
- No storage-location/file-selector work.
- No schema or migration changes unless a verified blocker makes them unavoidable; stop before implementing them.
- No bridge, IPC, service, payload, command, or CSS/test-id renames.
- Do not rename Atlas source-owned terms from terminology or protected-word output.
- Do not treat protected-word discovery as authority or a hard gate.
- Do not broaden into all record manipulation. Stay on the storage/runtime read-write boundary that connects queue, API request logging, evidence persistence, retention preflight, runtime snapshots, and restart recovery.

## Stop Conditions

Stop and return to Overseer/Human if:

- a fix requires production deletion execution
- a fix requires schema/migration/storage-location/file-selector work
- verification would need live ESI/zKill/API access
- verification would need the user's real database
- queue/API/log state cannot be proven without altering bridge/IPC/service contracts
- the boundary map exposes a policy choice rather than an implementation defect
- footprint/citation survival policy blocks the work
- UI presentation decisions become necessary
- protected-term warnings suggest a new authority decision is required

## Required Verification

Minimum required verification:

```powershell
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:partial-failures
npm.cmd run verify:restart-recovery
npm.cmd run verify:retention-deletion-boundary
npm.cmd run verify:runtime-snapshot
npm.cmd run verify:db-integrity
npm.cmd run verify:evidence-rules
npm.cmd run verify:protected-terms
git status --short --branch
```

If Dev adds a focused verifier, add it to `package.json` and `scripts/verify-group.js`, then also run:

```powershell
npm.cmd run verify:all
```

If no focused verifier is added, Dev must explain why existing verification is sufficient and still run the minimum required verification above.

## Evidence

To be completed by Dev.

Expected evidence:

- files reviewed
- files changed
- storage/runtime boundary map
- current persistent vs volatile state summary
- current write-boundary summary
- verification commands and results
- protected-term warning count, if any
- confirmation that no live API, real DB mutation, production deletion, schema/migration, storage-location, bridge/IPC/service/payload/command rename, UI redesign, or protected-word JSON update occurred

## Dev Handoff

To be completed by Dev in:

```txt
workspace/DevHS59-storage-runtime-readwrite-boundary.md
```
