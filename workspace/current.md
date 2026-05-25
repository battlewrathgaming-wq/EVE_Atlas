# AURA Atlas Current Work

Status: Idle after accepted systems-design advisory
Last updated: 2026-05-26

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS78 accepted the request-control/sequencer advisory. Atlas should not build a broad provider work queue yet. The next likely Dev packet is a bounded request-control/sequencer diagnostic and Live-search guardrail slice, but no Dev packet is open until Human/Overseer selects it.

Source of intent:

- Human advisory on 2026-05-26: do not implement a broad provider work queue yet; use a small Watch / Sequencer request-control layer.
- Human advisory on 2026-05-26: Live search is immediate and narrow; Watch / Sequencer is patient and powerful.
- Human advisory on 2026-05-26: radius belongs to Watch / Sequencer, not Live search.
- Human advisory on 2026-05-26: waiting is endpoint-respectful behavior, not failure.
- Human advisory on 2026-05-26: Discovery Queue is returned zKill refs; Evidence is expanded ESI killmails.
- Human advisory on 2026-05-26: queue/request-control policy does not affect local hydration, and local cache checks should not be called hydration.
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
- `discovered_killmail_refs` should remain the returned-ref Discovery queue, not the request-control sequencer.
- Live search is direct provider-style lookup: no radius, short lookback, low caps, cooldown, abuse lockout.
- Watch / Sequencer is Atlas-engineered scoped acquisition over time: radius, longer lookbacks, paced packets, separate zKill/ESI capacity, and waiting as valid behavior.
- Waiting/capacity deferral must not mark refs failed.
- ESI failure should mark a ref failed only after an actual ESI attempt fails outside retry/capacity handling.
- Local hydration remains readability/label metadata work and is outside request-control policy.
- Stale/expired Discovery ref mutation is deferred.

## Executor

Current executor: none

Expected handoff filename:

```txt
None. No Dev packet is open.
```

## Ordered Runway

No active Dev runway.

Recommended next packet, if Human/Overseer selects it:

1. Add request fingerprint generation for live/manual/Watch scopes.
2. Add Live search cooldown/lockout check.
3. Reject radius in Live search.
4. Add Watch/Sequencer diagnostic output showing planned packets for radius/lookback.
5. Keep `discovered_killmail_refs` schema unchanged.
6. Do not implement stale/expired refs.
7. Do not run live calls in verification.

## Guardrails And Non-Goals

- No broad provider work queue framework.
- No Dev implementation until a bounded runway is explicitly opened.
- No live/private/API calls in verification.
- No stale/expired Discovery ref mutation.
- No schema migration unless explicitly opened.
- No production deletion execution.
- No retention/deletion policy changes.
- No snapshot, restore, active DB relocation, or storage-budget expansion.
- No UI redesign or renderer presentation work.
- No local hydration changes.
- No direct Live search radius.
- Do not make `discovered_killmail_refs` the sequencer.
- Do not treat queued refs as Evidence.
- Do not treat failed/partial provider results as stored Evidence.
- Do not treat waiting as failure.

## Stop Conditions

Stop and return to Overseer/Human before any implementation if:

- proposed work requires live provider access
- proposed work requires schema migration
- proposed work would blur Discovery with Evidence
- proposed work would apply request-control policy to local hydration
- proposed work would make Live search a radius or large-envelope acquisition path
- proposed work would add broad background provider orchestration
- proposed work would require new user-facing doctrine or presentation decisions
- protected-term warnings suggest a new authority decision is required

## Required Verification

No active Dev packet.

If the recommended request-control/sequencer diagnostic packet opens, likely verification includes:

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
```

If service registry, main/preload, shared command behavior, migrations, or broad verification helpers change, also run:

```powershell
npm.cmd run verify:service-registry
npm.cmd run verify:migrations
npm.cmd run verify:all
```

## Evidence

HS74 is accepted and closed.

HS76 design input captured queue stale/expiration intent.

HS77 requested systems-design review before Dev implementation.

HS78 accepted the practical systems-design advisory:

- Live search = direct provider-style lookup.
- Watch / Sequencer = Atlas-engineered scoped acquisition over time.
- Discovery Queue = returned zKill refs.
- Evidence = expanded ESI killmails.
- Broad provider work queue is rejected for the next step.
- `discovered_killmail_refs` should not be the sequencer.
- Stale/expired ref mutation is deferred.
- Local hydration is outside request-control policy.

No Dev implementation is open.

Opening verification:

- `npm.cmd run verify:protected-terms` passed with exit code 0, warning-only.
- Protected-term discovery ran in working-set mode against 3 files.
- Warning count: 110.
- Warning classes: cross-project-borrowing 13, lab-quarantine-borrowing 61, atlas-candidate 36.
- `git diff --check` passed.

## Dev Handoff

No Dev handoff is expected until a bounded runway is opened.
