# AURA Atlas Current Work

Status: Active Dev runway opened
Last updated: 2026-05-26

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS82 opens a bounded Dev packet for Watch Recovery Diagnostic And Resumable Intent Readout. This packet should prove restart recovery from existing durable Watch intent and execution evidence before Atlas adds persisted sequencer packets or durable request-control counting.

Source of intent:

- Human storage/runtime hardening direction accepted on 2026-05-25.
- Human advisory on 2026-05-26: durable request counting may be data hungry; prefer recovery from Watch sources where possible.
- Human advisory on 2026-05-26: Watch sources know their count/scope and should work down from durable intent.
- `workspace/OverseerHS82-hs81-systems-advisory-review.md`
- `workspace/SystemsDesignerHS81-watch-recovery-resumable-intent-advisory.md`
- `workspace/OverseerHS81-watch-recovery-systems-design-request.md`
- `workspace/OverseerHS80-hs79-live-gate-review.md`
- `workspace/DevHS79-live-gate-sequencer-diagnostic.md`
- `workspace/OverseerHS79-live-gate-mechanic-acceptance.md`
- `workspace/OverseerHS78-request-control-sequencer-advisory-review.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-manual-discovery-lane.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `docs/adr/ADR-0005-watch-offline-readout-aggregation.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Accepted baseline:

- Watch config is durable intent.
- Fetch/API logs are recent execution evidence.
- Discovery refs are returned zKill work awaiting ESI/cache handling.
- Evidence is completed ESI-expanded truth.
- Watch recovery readout is derived operator state.
- Watch row is the durable payload contract.
- Timer / sequencer is a payload-agnostic conductor.
- Worker logic moves the Watch payload.
- Live search remains immediate and narrow.
- Watch / Sequencer remains the patient radius/lookback acquisition lane.
- `discovered_killmail_refs` remains the returned-ref Discovery queue, not the sequencer.
- Metadata hydration remains separate from request-control sequencing.
- Waiting is not failure.
- Watch restart remains disarmed by default.
- Live cooldown/lockout may remain volatile for alpha.

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS82-watch-recovery-diagnostic-readout.md
```

## Ordered Runway

1. Read the source of intent, current contracts/docs, and current Watch/offline readout/scheduler/executor/repository code.
2. Trace existing durable state that can reconstruct Watch recovery after restart:
   - `system_watches`
   - `watchlist_entities`
   - `fetch_runs`
   - `api_request_logs`
   - `discovered_killmail_refs`
   - Evidence/activity tables
3. Add or refine a read-only Watch recovery diagnostic/readout using existing durable tables. Do not add a broad provider queue and do not add persisted sequencer packets.
4. The readout should derive, per Watch where practical:
   - durable intent source
   - session/armed state
   - next eligible time
   - expected next run time versus observed movement
   - reconstructed planned scope
   - pending refs count
   - latest fetch/API activity
   - provider deferral/wait signal
   - orphaned run signal
   - missed-slot recoverability signal
   - next safe action
5. Use these next-safe-action values unless existing local naming strongly requires a better scoped equivalent:
   - `arm_required`
   - `wait`
   - `drain_pending_refs`
   - `ready_for_discovery`
   - `review_orphan`
   - `recover_missed_slot_when_capacity_allows`
   - `complete_enough_alpha`
6. Ensure recovery diagnostics perform no provider work, create no Evidence, mutate no Discovery ref lifecycle, and do not hydrate metadata.
7. Prefer pending Discovery refs before fresh zKill Discovery in the derived next action.
8. Surface retryable provider-capacity deferral as waiting/deferred, not failure.
9. Surface orphaned pre-restart `running` fetch runs instead of silently resuming them.
10. Treat timer firing as "this Watch should be considered," not "provider work must start now." The admission check may hold a due Watch for conflict, capacity, recent movement, or provider deferment.
11. Do not attempt exact packet replay. Recover intent and safe next action from last/expected movement and durable local state.
12. For radius recovery, use included-system scope where available; if not available, explicitly report the limitation rather than guessing.
13. Add focused offline fixture coverage for the accepted recovery states.
14. Update current-state docs only where behavior/readout meaning changes.
15. Update Evidence / Dev Handoff sections and create the expected DevHS82 handoff.

## Guardrails And Non-Goals

- No live/private/API calls in verification.
- No broad provider work queue.
- No high-volume request-attempt ledger.
- No persisted sequencer packet table.
- No schema migration unless Dev proves the read-only diagnostic cannot be built from existing durable state and stops for Overseer/Human review first.
- No stale/expired Discovery ref mutation.
- No `discovered_killmail_refs` schema change.
- Do not make `discovered_killmail_refs` the sequencer.
- Do not treat queued refs as Evidence.
- Do not treat waiting as failure.
- Do not couple metadata hydration to request-control sequencing.
- No direct Live radius.
- No production deletion execution.
- No UI redesign or renderer presentation work.
- No Watch timing/backoff mutation for provider-capacity deferral in this packet; surface it in readout first.
- Do not auto-arm Watch execution on restart.

## Stop Conditions

Stop and return to Overseer/Human before implementation if:

- implementation requires live provider access
- implementation requires schema migration
- implementation would add persisted sequencer packets
- implementation would add durable high-volume request-counting
- implementation would blur Discovery refs with Evidence
- implementation would mutate Discovery ref lifecycle or retention/deletion behavior
- implementation would apply recovery policy to local hydration
- implementation would auto-resume provider work after restart
- implementation would require new user-facing doctrine or presentation decisions
- protected-term warnings suggest a new authority decision is required

## Required Verification

Run the focused set:

```powershell
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-executor
npm.cmd run verify:restart-recovery
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-scope-isolation
npm.cmd run verify:manual-discovery
npm.cmd run verify:hydration
npm.cmd run verify:db-integrity
```

Add focused verifier expectations for:

- due Watch after restart reports `arm_required`
- Watch with pending refs reports `drain_pending_refs`
- old `running` fetch run reports `review_orphan` or an equivalent orphaned-run signal
- missed timer slot reports `recover_missed_slot_when_capacity_allows` or an equivalent recoverable-missed-slot signal
- provider-capacity warning reports waiting/deferred, not failed
- metadata hydration is unaffected
- recovery diagnostic makes no provider calls
- Discovery refs remain Discovery, not Evidence and not sequencer packets

If service registry, main/preload, shared command behavior, schema/migration files, or broad verification helpers change, also run:

```powershell
npm.cmd run verify:service-registry
npm.cmd run verify:migrations
npm.cmd run verify:all
```

Run warning-only terminology discovery if the packet touches terminology, bridge/display wording, protected terms, critical assets, or release/push readiness:

```powershell
npm.cmd run verify:protected-terms
```

Finish with:

```powershell
git status --short --branch
```

## Evidence

HS82 runway opened by Overseer.

Opening evidence:

- SystemsDesignerHS81 advisory accepted by Overseer.
- The accepted next architecture direction is recovery/resumable Watch intent, not durable request-control counting.
- No Dev implementation was performed while opening HS82.
- No live calls, schema migration, broad provider queue, persisted sequencer packets, stale/expired mutation, hydration coupling, retention/deletion change, or UI work were opened.
- Verification command name corrected from advisory text to package script: `npm.cmd run verify:restart-recovery`.
- Human timer-led refinement accepted: the Watch row carries durable payload intent, the timer/sequencer only decides whether due work may move, and the worker owns payload processing.
- HS82 should not model exact packet replay. It should derive missed-slot recovery from expected next run time versus observed Watch movement.
- `npm.cmd run verify:protected-terms` passed with exit code 0, warning-only.
- Protected-term discovery ran in working-set mode against 4 files.
- Warning count: 244.
- Warning classes: cross-project-borrowing 48, lab-quarantine-borrowing 155, atlas-candidate 41.
- `git diff --check` passed.

## Dev Handoff

Dev should create:

```txt
workspace/DevHS82-watch-recovery-diagnostic-readout.md
```
