# AURA Atlas Current Work

Status: Active Dev packet - Watch_offline readout support
Last updated: 2026-05-25

## Active Milestone

Milestone: Watch_offline Readout Support

Source of intent:

- Human direction on 2026-05-25: proceed with the readout support first, then focus on read/write hardening.
- Human naming and architecture direction on 2026-05-25: use `Watch_offline` for this line, avoid `Watcher`, ignore UX for now, and keep aggregation off the renderer where practical.
- `workspace/OverseerHS53-runtime-record-integrity-audit.md`
- `workspace/OverseerHS54-watch-recovery-offline-readout-scope.md`
- `workspace/OverseerHS55-watch-recovery-offline-readout-audit.md`
- `docs/adr/ADR-0005-watch-offline-readout-aggregation.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Current focus: implement a bounded read-only `Watch_offline` model/service support layer that exposes post-restart/offline Watch truth for future presentation, without UI redesign, live/API calls, collection, persistence-policy changes, or renderer-owned state interpretation.

## Executor

Current executor: Dev.

Expected handoff filename:

```txt
workspace/DevHS56-watch_offline-readout-support.md
```

## Ordered Runway

1. Read the source-of-intent files above, then inspect the existing Watch schedule/executor/readiness/report/queue service paths:
   - `src/main/watchlist/watchScheduler.js`
   - `src/main/watchlist/watchExecutor.js`
   - `src/main/watchlist/watchlistRepository.js`
   - `src/main/services/serviceRegistry.js`
   - `src/main/services/taskRunner.js`
   - `src/main/services/appReadinessService.js`
   - `src/renderer/queueWatch.js`
   - existing focused verification scripts in `scripts/`
2. Design the smallest read-only `Watch_offline` support shape using existing state. Prefer a backend/main-process service or model aggregation over renderer-side interpretation. Do not rename existing commands, IPC names, payloads, schemas, or UI terms.
3. Implement derived fields only where they can be proven from existing local state. Candidate fields:
   - `session_armed`
   - `collection_active`
   - `time_eligible`
   - `eligible_if_armed`
   - `next_eligible_at`
   - `blocked_reasons`
   - `state_basis` or equivalent explanation of which existing state produced the readout
   - `local_context_available`
   - Watch-scoped local queue/evidence counts only if cheap, read-only, and clearly local
4. Preserve the core post-restart truth:

   ```txt
   Configured Watch exists.
   Session is unarmed because runtime restarted.
   No collection is active.
   Local context is still available.
   Operator can arm when ready.
   ```

5. Add or update focused offline verification for the readout shape. Include cases for:
   - configured Watch after restart with `session_armed=false`
   - no active collection
   - time-eligible Watch blocked by unarmed session
   - not-due Watch
   - backoff/error state if existing fixtures make this cheap
   - local context availability without live/API calls
6. Keep renderer changes minimal. If any renderer touch is necessary, it may only consume or expose the read-only support shape for verification; it must not redesign the interface or own Watch meaning.
7. Run required verification.
8. Create `workspace/DevHS56-watch_offline-readout-support.md` with the implementation summary, field contract, verification output, and guardrail confirmation.

## Guardrails

- No UI redesign.
- No offline pane design.
- No live/private/API calls.
- No collection on startup or passive page load.
- Do not persist `sessionArmed`.
- No schema/migration changes unless Dev proves a read-only fixture/test update cannot verify the packet without one and stops for Overseer approval first.
- No bridge, IPC, service, payload, command, or contract renames.
- No backend meaning rename.
- Do not use `Watcher` as a class, user-facing state, or service concept.
- Do not promote `Radar` into Atlas backend, bridge, service, payload, or state-model terminology.
- Preserve Atlas meanings for Watch, Marked, Evidence, Discovery, External API, Assessment Memory, provenance, and storage.
- Treat `eligible_if_armed` as a technical candidate field, not final human-facing copy.

## Stop Conditions

Stop and return to Overseer if:

- the implementation needs live/API calls
- the implementation would start collection from startup, passive load, or readout generation
- `sessionArmed` would need to be persisted
- Watch due/armed/running/blocked meanings cannot be represented without product wording decisions
- queue/evidence counts require risky joins, broad report rewrites, or performance-heavy scans
- renderer code starts becoming the authority for Watch state interpretation
- implementation requires contract/payload/service renames
- protected-term output suggests new terminology authority decisions are needed

## Required Verification

Run focused offline checks:

```powershell
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-executor
npm.cmd run verify:restart-recovery
npm.cmd run verify:background-execution
npm.cmd run verify:live-api-gate
npm.cmd run verify:renderer-shell
npm.cmd run verify:protected-terms
git status --short --branch
```

Add and run a focused readout verification command if Dev creates one, for example:

```powershell
npm.cmd run verify:watch-offline-readout
```

If Dev touches shared service registry behavior or broad renderer/service paths, also run:

```powershell
npm.cmd run verify:all
```

Do not run live smoke unless explicitly authorized by the Human.

## Evidence

Dev must update this section in the handoff, not necessarily in `current.md`:

```txt
Files changed:

Read-only readout shape:

Derived fields and basis:

Post-restart behavior:

Renderer involvement, if any:

Verification run:

Protected-term output:
```

## Dev Handoff

Create:

```txt
workspace/DevHS56-watch_offline-readout-support.md
```

Handoff must include:

- files/code paths changed
- field contract for the `Watch_offline` readout shape
- how each derived field is calculated or intentionally omitted
- confirmation `sessionArmed` remains volatile
- confirmation readout generation does not start collection
- confirmation no live/API calls were added
- confirmation no persistence/schema/contract renames were performed, or exact approved exception if Overseer authorized one
- verification commands and results
- warning-only protected-term output and any noisy classes
- recommended next packet for read/write hardening, if clear
