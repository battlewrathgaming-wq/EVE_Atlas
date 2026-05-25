# AURA Atlas Current Work

Status: Resting after accepted Dev packet
Last updated: 2026-05-26

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS79 Live provider gate and Watch / Sequencer diagnostic is accepted. Atlas is resting from Dev work while HS81 systems design advisory is prepared for Watch restart recovery and resumable sequencer intent.

Source of intent:

- Human storage/runtime hardening direction accepted on 2026-05-25.
- Human advisory on 2026-05-26: do not implement a broad provider work queue yet; use a small Watch / Sequencer request-control layer.
- Human advisory on 2026-05-26: Live search is immediate and narrow; Watch / Sequencer is patient and powerful.
- Human advisory on 2026-05-26: radius belongs to Watch / Sequencer, not Live search.
- Human gate recommendation on 2026-05-26: cooldown is normal pacing; lockout is rare abuse protection.
- Human gate recommendation on 2026-05-26: lockout is per provider + action + scope fingerprint, not global.
- Human gate recommendation on 2026-05-26: Live search should block with next eligible time rather than wait long-running.
- Human gate recommendation on 2026-05-26: Live cooldowns must not pause Watch globally, and Watch waits must not globally lock out Live.
- `workspace/OverseerHS80-hs79-live-gate-review.md`
- `workspace/OverseerHS81-watch-recovery-systems-design-request.md`
- `workspace/DevHS79-live-gate-sequencer-diagnostic.md`
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

Accepted baseline:

- A queued ref is Discovery/provenance, not Evidence.
- `discovered_killmail_refs` remains the returned-ref Discovery queue, not the request-control sequencer.
- Live search is direct provider-style lookup: no radius, short lookback, low caps, cooldown, abuse lockout.
- Watch / Sequencer is Atlas-engineered scoped acquisition over time: radius, longer lookbacks, paced packets, separate zKill/ESI capacity, and waiting as valid behavior.
- Waiting/capacity deferral must not mark refs failed.
- ESI failure should mark a ref failed only after an actual ESI attempt fails outside retry/capacity handling.
- Local hydration remains readability/label metadata work and is outside request-control policy.
- Stale/expired Discovery ref mutation is deferred.
- Cooldown is endpoint pacing, not punishment.
- Lockout is rare and scoped per provider + action + fingerprint.

## Executor

Current executor: None

Expected handoff filename:

```txt
None until the next Dev runway is opened.
```

## Resting State

HS79 is accepted. No Dev work is currently open.

Next likely candidate lanes, for Human / Overseer selection:

1. Watch restart recovery and resumable sequencer intent.
2. Discovery Sequencer / Enrichment Sequencer architecture note and first implementation slice.
3. Watch / Sequencer paced packet implementation for radius/lookback acquisition.
4. Operator-facing waiting/cooldown/readout surface after the backend state is durable enough.
5. Queue stale/expiration policy only after request-control and sequencer identity are clearer.

## Guardrails And Non-Goals

- No broad provider work queue framework without a new accepted packet.
- No live/private/API calls in verification unless explicitly authorized.
- No stale/expired Discovery ref mutation until selected as a future packet.
- No `discovered_killmail_refs` schema change unless selected as a future packet.
- No production deletion execution.
- No retention/deletion policy changes.
- No snapshot, restore, active DB relocation, or storage-budget expansion unless selected as a future packet.
- No UI redesign or renderer presentation work from this resting state.
- No local hydration changes from request-control work.
- Do not make `discovered_killmail_refs` the sequencer.
- Do not treat queued refs as Evidence.
- Do not treat failed/partial provider results as stored Evidence.
- Do not treat waiting as failure.
- Do not apply Live cooldowns globally to Watch.
- Do not apply Watch waits globally to Live.

## Stop Conditions

Stop and return to Overseer/Human before implementation if:

- implementation requires live provider access
- implementation requires schema migration
- implementation would blur Discovery with Evidence
- implementation would apply request-control policy to local hydration
- implementation would make Live search a radius or large-envelope acquisition path
- implementation would add broad background provider orchestration
- implementation would require new user-facing doctrine or presentation decisions
- protected-term warnings suggest a new authority decision is required

## Required Verification

No active Dev packet is open.

If a new storage/runtime packet is opened, start from the relevant focused verifier set and broaden to:

```powershell
npm.cmd run verify:all
npm.cmd run verify:protected-terms
git status --short --branch
```

## Evidence

HS79 accepted by Overseer.

Files reviewed:

- `workspace/current.md`
- `workspace/DevHS79-live-gate-sequencer-diagnostic.md`
- `workspace/OverseerHS79-live-gate-mechanic-acceptance.md`
- `workspace/OverseerHS78-request-control-sequencer-advisory-review.md`
- `workspace/OverseerHS77-queue-systems-design-advisory-request.md`
- `workspace/OverseerHS76-queue-stale-expiration-design-input.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-manual-discovery-lane.md`
- focused implementation and verifier files listed in DevHS79

Accepted changes:

- Live/manual provider request-control metadata now includes provider, action, target, lookback, caps, scope fingerprint, cooldown, lockout, and next eligible timing.
- Live manual discovery rejects radius before provider work.
- Same Live fingerprint enters cooldown after an accepted provider-attempt point.
- Running duplicates block as `ALREADY_RUNNING` without immediate lockout.
- Repeated blocked attempts create per-fingerprint lockout after 3 repeats inside 10 minutes.
- Watch schedule output includes a Watch / Sequencer diagnostic for planned packets, caps, radius allowance, wait state, and `waiting_is_failure: false`.
- Retryable ESI/provider capacity deferral writes warning state, writes no Evidence, writes no activity events, and leaves selected refs pending.
- Metadata hydration remains outside request-control cooldown/lockout policy.

Deferred:

- Durable request-control counting across restart, pending HS81 systems review.
- Watch restart recovery and resumable sequencer intent, pending HS81 systems review.
- Persisted Watch / Sequencer packets.
- Broad provider work queue framework.
- Discovery ref stale/expiration mutation.
- Operator-facing waiting/cooldown presentation.

Advisory preparation:

- `workspace/OverseerHS81-watch-recovery-systems-design-request.md` bundles the next systems-design prompt.
- HS81 asks Systems to challenge whether recovery/resumable Watch intent is a better next architecture step than durable request-control counting.
- HS81 is advisory only and does not authorize implementation.

Verification:

- `npm.cmd run verify:all` passed, 65 scripts.
- `npm.cmd run verify:protected-terms` passed with exit code 0, warning-only.
- Protected-term discovery ran in working-set mode against 13 files.
- Warning count: 461.
- Warning classes: lab-quarantine-borrowing 199, atlas-candidate 233, cross-project-borrowing 29.
- `git diff --check` passed.

Guardrail confirmation:

- No live/API verification calls, stale/expired mutation, `discovered_killmail_refs` schema change, production deletion execution, retention/deletion policy change, snapshot cleanup, restore, active DB relocation, broad provider queue framework, local hydration request-control coupling, UI work, protected-word JSON update, or terminology rename occurred.

## Dev Handoff

Accepted Dev handoff:

```txt
workspace/DevHS79-live-gate-sequencer-diagnostic.md
```
