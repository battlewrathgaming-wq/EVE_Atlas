# AURA Atlas Current Work

Status: Active Dev packet - Retention/deletion execution boundary
Last updated: 2026-05-25

## Active Milestone

Milestone: Retention / Deletion Execution Boundary

Source of intent:

- Human direction on 2026-05-25: focus next on retention/deletion.
- Human policy clarification on 2026-05-25: footprint is an edge case and does not override user selection for deletion.
- `workspace/OverseerHS53-runtime-record-integrity-audit.md`
- `workspace/DevHS57-queue-api-evidence-write-hardening.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `src/main/services/retentionActionService.js`
- `scripts/verify-retention-preflight.js`

Current focus: harden the retention/deletion boundary. Atlas currently has read-only retention preflight, compaction preview, deliberate Assessment Memory creation, and runtime snapshots. Executable evidence deletion/pruning is not implemented. This packet should decide and verify the next smallest safe step without making footprint/preservation override explicit deletion.

## Executor

Current executor: Dev.

Expected handoff filename:

```txt
workspace/DevHS58-retention-deletion-execution-boundary.md
```

## Ordered Runway

1. Read the source-of-intent files above, then trace current retention/deletion paths:
   - `retention.actions`
   - `retention.preflight`
   - `assessment.compact_from_evidence`
   - `evidence.prune_scope`
   - runtime snapshot boundary
   - Assessment Memory creation from compaction preview
   - current verification around non-destructive preflight
2. Record the current truth before changing code:
   - what is implemented
   - what is preflight-only
   - what is not implemented
   - what records are counted in impact
   - what would be deleted if execution existed
   - what currently survives as Assessment Memory or provenance
3. Apply the Human policy clarification:
   - user-selected deletion must mean deletion of the selected deletable records
   - footprint is optional/edge metadata, not a retention override
   - footprint must not preserve raw Evidence, activity events, or hidden copies of deleted records
   - assessment preservation may be offered or recommended, but must not silently block or reverse explicit deletion unless a future Human policy says so
4. Add or strengthen fixture-only verification for the destructive boundary. Cover:
   - `retention.preflight` remains read-only and does not delete
   - confirmation requirements are explicit
   - evidence prune impact lists the records that would be affected
   - compaction preview and Assessment Memory creation do not delete Evidence
   - any future execution path, if implemented, deletes selected records in fixtures and does not leave hidden raw Evidence behind
   - footprint behavior, if touched, is clearly optional/minimal and does not override deletion
5. Implement only the smallest local hardening justified by the trace and tests.
   - Documentation/current-state updates are allowed.
   - Verification additions are encouraged.
   - Production deletion execution is allowed only if it stays fixture-proven, explicit, local, scoped, non-live, and does not require schema or product-policy expansion.
6. Stop rather than implement if deletion execution requires:
   - schema/migration changes
   - a new footprint table/file
   - user-facing policy decisions
   - backup/restore policy
   - cross-domain deletion spanning Evidence, Assessment Memory, runtime DB files, metadata logs, and queue refs in one packet
7. Run required verification.
8. Create `workspace/DevHS58-retention-deletion-execution-boundary.md` with trace, accepted policy, verification, changes, and deferred decisions.

## Acceptance Criteria

HS58 is acceptable if the handoff and verification prove:

- Dev clearly traces current retention/deletion behavior before implementation.
- The Human clarification is preserved: footprint does not override user-selected deletion.
- Read-only preflight remains read-only unless an explicit, tested execution path is added.
- Assessment Memory / compaction preview does not delete Evidence.
- If no production deletion is implemented, the handoff explains exactly why and identifies the next required policy/schema/UX decision.
- If production deletion is implemented, fixture tests prove scoped deletion, confirmation, no live/API calls, no real user DB mutation, no hidden raw Evidence copy, and no unexpected Assessment Memory mutation.
- Discovery, Evidence, Observation, Assessment Memory, provenance, storage, and `Enrich selected` meanings remain intact.
- No schema/migration/service/command/payload renames occurred unless explicitly approved.

## Guardrails

- No live/private/API calls.
- Do not mutate the user's real local database.
- Use in-memory or disposable fixture databases only.
- No UI redesign.
- No renderer exposure changes unless strictly needed for existing read-only service verification.
- No schema/migration changes unless Dev stops and gets Overseer approval first.
- No bridge, IPC, service, payload, command, or contract renames.
- Do not treat archived docs/gap files as active task queues.
- Do not make footprint mandatory unless a future Human decision explicitly does so.
- Do not allow footprint, Assessment Memory, or provenance to keep raw deleted Evidence in disguise.
- Do not broaden into storage-location/file-selector work.

## Stop Conditions

Stop and return to Overseer if:

- deletion execution requires schema/migration work
- footprint requires a new table, file format, or durable storage location
- deletion scope cannot be represented without user-facing policy decisions
- implementation would touch the user's real database
- retention spans multiple unrelated domains in one packet
- Assessment Memory preservation appears to conflict with explicit deletion
- a fix requires service/command/payload renames
- backup/restore behavior becomes necessary
- protected-term output suggests new terminology authority decisions are needed

## Required Verification

Run focused offline checks:

```powershell
npm.cmd run verify:retention-preflight
npm.cmd run verify:runtime-snapshot
npm.cmd run verify:assessment-artifacts
npm.cmd run verify:evidence-rules
npm.cmd run verify:protected-terms
git status --short --branch
```

Add and run a focused verifier if Dev creates one, for example:

```powershell
npm.cmd run verify:retention-deletion-boundary
```

If Dev touches shared persistence, assessment, service registry, runtime snapshot, or any production deletion path, also run:

```powershell
npm.cmd run verify:all
```

Do not run live smoke unless explicitly authorized by the Human.

## Evidence

Dev must update this section in the handoff, not necessarily in `current.md`:

```txt
Current retention/deletion trace:

Human policy preserved:

Files/functions changed:

Verification cases:

Deletion execution status:

Footprint behavior:

Assessment Memory / preservation behavior:

Verification run:

Protected-term output:

Deferred decisions:
```

## Dev Handoff

Create:

```txt
workspace/DevHS58-retention-deletion-execution-boundary.md
```

Handoff must include:

- trace of current retention/deletion behavior
- exact policy interpretation used
- files/code paths changed
- verification cases added or strengthened
- whether production deletion execution was implemented or deferred
- confirmation no live/API calls were run
- confirmation no user real database was mutated
- confirmation footprint does not override deletion
- confirmation no hidden raw Evidence is preserved by footprint/preservation behavior
- confirmation no schema/migration/contract/command/payload renames were performed, or exact approved exception if Overseer authorized one
- verification commands and results
- warning-only protected-term output and noisy classes
- recommended next packet, if clear
