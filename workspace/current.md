# AURA Atlas Current Work

Status: Resting after accepted Dev packet
Last updated: 2026-05-26

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS82 Watch Recovery Diagnostic And Resumable Intent Readout is accepted. Atlas is resting until the Human / Overseer selects the next bounded packet.

Source of intent:

- Human storage/runtime hardening direction accepted on 2026-05-25.
- Human advisory on 2026-05-26: durable request counting may be data hungry; prefer recovery from Watch sources where possible.
- Human advisory on 2026-05-26: Watch sources know their count/scope and should work down from durable intent.
- `workspace/OverseerHS83-hs82-watch-recovery-review.md`
- `workspace/DevHS82-watch-recovery-diagnostic-readout.md`
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

Current executor: None

Expected handoff filename:

```txt
None until the next Dev runway is opened.
```

## Resting State

HS82 is accepted. No Dev work is currently open.

Next likely candidate lanes, for Human / Overseer selection:

1. Operator-facing readout clarity for Watch recovery state.
2. Runtime evidence from alpha use of `Watch_offline` recovery diagnostics.
3. Minimal durable Watch movement checkpoint only if real runtime evidence shows derived movement is insufficient.
4. Discovery Sequencer / Enrichment Sequencer architecture note and first implementation slice.
5. Watch / Sequencer paced packet implementation for radius/lookback acquisition.
6. Queue stale/expiration policy only after request-control and sequencer identity are clearer.

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

No active Dev packet is open.

HS82 acceptance verification included:

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
npm.cmd run verify:service-registry
npm.cmd run verify:migrations
npm.cmd run verify:all
npm.cmd run verify:protected-terms
git diff --check
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

Dev implementation completed for HS82.

Files reviewed:

- `workspace/current.md`
- `workspace/OverseerHS82-hs81-systems-advisory-review.md`
- `workspace/SystemsDesignerHS81-watch-recovery-resumable-intent-advisory.md`
- `workspace/OverseerHS81-watch-recovery-systems-design-request.md`
- `workspace/OverseerHS80-hs79-live-gate-review.md`
- `workspace/DevHS79-live-gate-sequencer-diagnostic.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-manual-discovery-lane.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `docs/adr/ADR-0005-watch-offline-readout-aggregation.md`
- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/watchlist/watchlistRepository.js`
- `src/main/db/schema.sql`
- `scripts/verify-watch-offline-readout.js`

Files changed:

- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/watchlist/watchScheduler.js`
- `scripts/verify-watch-offline-readout.js`
- `docs/adr/ADR-0005-watch-offline-readout-aggregation.md`
- `docs/current-state/current-evidence-pipeline.md`
- `workspace/current.md`
- `workspace/DevHS82-watch-recovery-diagnostic-readout.md`

Implemented read-only recovery diagnostic:

- `Watch_offline.watches[]` now includes `recovery` and `next_safe_action`.
- Recovery derives from existing durable Watch rows, fetch/API logs, provider warnings, Discovery refs, and Evidence/activity counts.
- Per-Watch readout includes durable intent source, session/armed state, expected next run time, observed movement, reconstructed scope, pending ref count, latest fetch/API activity, provider deferral, orphaned run signal, missed-slot signal, and next safe action.
- Next safe action values implemented: `arm_required`, `wait`, `drain_pending_refs`, `ready_for_discovery`, `review_orphan`, `recover_missed_slot_when_capacity_allows`, `complete_enough_alpha`.

Radius recovery scope:

- `watch.schedule` exposes stored `included_system_ids` and `excluded_system_ids` for system/radius watches.
- Recovery distinguishes valid stored scope, no stored included-system scope, and malformed/unparseable stored scope.
- Valid included-system scope is used for system/radius local queue/evidence counts.
- Missing or malformed stored scope reports limitation rather than guessing exact radius membership.

Offline fixture coverage added:

- due Watch after restart reports `arm_required`
- Watch with pending refs reports `drain_pending_refs`
- old `running` fetch run reports `review_orphan`
- missed timer slot reports `recover_missed_slot_when_capacity_allows`
- provider-capacity warning reports waiting/deferred, not failed
- valid/missing/malformed radius scope states are distinguished
- readout mutation check confirms persisted table counts are unchanged
- service readout remains read-only and renderer eligible

Boundary confirmation:

- No provider calls, Evidence creation, Discovery ref mutation, Watch row mutation, metadata hydration, Watch arming, sequencer persistence, stale/expired mutation, schema migration, UI work, retention/deletion change, broad provider queue, high-volume request ledger, or exact packet replay was added.

Verification:

- `npm.cmd run verify:watch-offline-readout` passed.
- `npm.cmd run verify:watch-scheduler` passed.
- `npm.cmd run verify:watch-executor` passed.
- `npm.cmd run verify:restart-recovery` passed.
- `npm.cmd run verify:queue-api-evidence-write` passed.
- `npm.cmd run verify:queue-selection` passed.
- `npm.cmd run verify:queue-scope-isolation` passed.
- `npm.cmd run verify:manual-discovery` passed.
- `npm.cmd run verify:hydration` passed.
- `npm.cmd run verify:db-integrity` passed.
- `npm.cmd run verify:service-registry` passed.
- `npm.cmd run verify:migrations` passed.
- `npm.cmd run verify:all` passed, 65 scripts.
- `npm.cmd run verify:protected-terms` passed with exit code 0, warning-only.
- Protected-term discovery ran in working-set mode against 9 files.
- Warning count: 594.
- Warning classes: cross-project-borrowing 90, lab-quarantine-borrowing 325, atlas-candidate 179.
- `git status --short --branch` reported `main...origin/main` with expected HS82 modified/untracked files.

## Dev Handoff

Dev created:

```txt
workspace/DevHS82-watch-recovery-diagnostic-readout.md
```
