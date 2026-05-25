# DevHS79 - Live Gate Sequencer Diagnostic

Date: 2026-05-26
Executor: Dev
Milestone: HS79 Live Provider Gate And Watch / Sequencer Diagnostic

## Scope

Implemented first-pass request-control guardrails for Live/manual provider work and added Watch / Sequencer diagnostic readout.

No broad provider work queue, live/API verification calls, stale/expired Discovery ref mutation, `discovered_killmail_refs` schema change, deletion execution, retention policy change, snapshot cleanup, restore, active DB relocation, local hydration request-control coupling, renderer UI redesign, or terminology rename was added.

## Files Reviewed

- `workspace/current.md`
- `workspace/OverseerHS79-live-gate-mechanic-acceptance.md`
- `workspace/OverseerHS78-request-control-sequencer-advisory-review.md`
- `workspace/OverseerHS77-queue-systems-design-advisory-request.md`
- `workspace/OverseerHS76-queue-stale-expiration-design-input.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-manual-discovery-lane.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `src/main/services/liveApiGateService.js`
- `src/main/services/mutatingActionService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/scopeService.js`
- `src/main/scopes/scopeControls.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/workers/manualDiscoveryWorker.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- focused verification scripts for live gate, Watch, queue, hydration, and DB integrity

## Files Changed

- `src/main/services/liveApiGateService.js`
- `src/main/services/mutatingActionService.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/workers/killmailIngestionWorker.js`
- `scripts/verify-live-api-gate.js`
- `scripts/verify-watch-scheduler.js`
- `scripts/verify-partial-failures.js`
- `docs/current-state/current-manual-discovery-lane.md`
- `docs/current-state/current-evidence-pipeline.md`
- `workspace/current.md`
- `workspace/DevHS79-live-gate-sequencer-diagnostic.md`

## Request Fingerprint Model

Live gate responses now include `request_control` metadata:

- `provider`
- `action`
- `target_type`
- `target_id`
- `lookback_seconds`
- `cap_summary`
- `scope_fingerprint`
- cooldown/lockout state and next eligible timing

Fingerprints are scoped per provider + action + target + lookback + caps. Examples include manual zKill discovery actor/system scopes, manual ESI expansion killmail scopes, actor Watch scopes, and system/radius Watch scopes.

## Live Gate Behavior

Implemented:

- Live manual discovery radius rejection before provider work.
- Existing live API/User-Agent gate behavior preserved.
- Per-fingerprint cooldown checks.
- Per-fingerprint lockout after 3 blocked repeats inside 10 minutes.
- 15 minute lockout duration.
- zKill cooldown default: 2 minutes.
- ESI expansion cooldown default: 5 minutes.
- Provider Retry-After support path: accepted helper uses provider value with a 2 minute minimum.
- Running duplicate detection reports `ALREADY_RUNNING` without immediately causing lockout.
- Blocked cooldown/lockout responses include `next_eligible_at`, `remaining_seconds`, and `scope_fingerprint`.

State is service-memory-only in this packet. Persistence across restart remains deferred.

## Watch / Sequencer Diagnostic

`watch.schedule` rows now include `sequencer_diagnostic`:

- mode
- status
- wait state
- radius allowance
- planned packet count
- packet shape
- caps
- `waiting_is_failure: false`

System/radius Watch remains allowed and diagnostic-only waiting does not mark refs failed.

## Waiting / Capacity Behavior

Retryable ESI/provider capacity errors are no longer terminal failed expansions. They now:

- write no Evidence
- write no activity events
- create `provider_capacity_deferred` warning provenance
- leave the queued ref pending
- do not mark the ref failed

Failed ESI expansion outside retry/capacity behavior still marks the ref failed.

## Hydration Boundary

Metadata hydration remains outside request-control cooldown/lockout policy. It still uses the existing live gate for live ESI name resolution, but does not consume Live search/Watch request-control state.

## Persistence

Gate/cooldown/lockout state is implemented as service-memory-only state for HS79. This proves behavior and diagnostics without schema migration or a broad provider work queue. Durable request-control state remains the main deferred risk.

## Verification

Commands run:

```powershell
npm.cmd run verify:live-api-gate
npm.cmd run verify:scope-controls
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-executor
npm.cmd run verify:manual-discovery
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-scope-isolation
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:hydration
npm.cmd run verify:db-integrity
npm.cmd run verify:service-registry
npm.cmd run verify:migrations
npm.cmd run verify:all
npm.cmd run verify:protected-terms
git status --short --branch
```

Results:

- `verify:live-api-gate`: passed.
- `verify:scope-controls`: passed.
- `verify:watch-scheduler`: passed.
- `verify:watch-executor`: passed.
- `verify:manual-discovery`: passed.
- `verify:queue-selection`: passed.
- `verify:queue-scope-isolation`: passed.
- `verify:queue-api-evidence-write`: passed.
- `verify:hydration`: passed.
- `verify:db-integrity`: passed.
- `verify:service-registry`: passed.
- `verify:migrations`: passed.
- `verify:all`: passed, 65 scripts.
- `verify:protected-terms`: passed warning-only.
- Protected-term discovery scanned 11 working-set files.
- Warning count: 439.
- Warning classes: lab-quarantine-borrowing 177, atlas-candidate 243, cross-project-borrowing 19.
- `git status --short --branch`: `main...origin/main` with expected HS79 modified/untracked files.

## Risks / Deferred

- Request-control state is not durable across restart yet.
- No broad provider work queue exists.
- Watch / Sequencer output is diagnostic; it does not persist request-control packets.
- Direct Live radius remains rejected; radius acquisition remains a Watch / Sequencer path.
- Queue stale/expiration policy remains deferred.

## Recommended Next Action

Overseer review HS79. If accepted, choose whether to add durable request-control state or keep polishing diagnostic/readout behavior before a schema-backed sequencer packet.
