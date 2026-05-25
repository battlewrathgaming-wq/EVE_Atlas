# AURA Atlas Current Work

Status: Idle pending systems-design advisory
Last updated: 2026-05-25

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS74 Queue -> API request -> Evidence write confidence is accepted. HS76 queue stale/expiration design input and the Human-provided audit indicate Atlas should pause before Dev implementation and get a systems-design pass on queue/work-request architecture.

Source of intent:

- Human direction on 2026-05-25: consider a better systems design before implementing queue stale/expiration.
- Human HS76 design input: queue refs should be treated as Watch-scheduled work items, not a generic inbox.
- Human HS76 design input: freshness should relate to the originating Watch interval/lookback where possible.
- Human HS76 design input: live searches should enter the priority queue instead of pulsing live search directly.
- Human HS76 design input: queue policy does not affect local hydration.
- Human-provided queue/schema audit on 2026-05-25: current storage does not reliably preserve Watch configuration ID, request time window, exact lookback, or one-active-work-item identity across all queue lanes.
- `workspace/OverseerHS76-queue-stale-expiration-design-input.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-manual-discovery-lane.md`
- `workspace/OverseerHS75-hs74-queue-evidence-confidence-review.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Accepted baseline:

- A queued ref is Discovery/provenance, not Evidence.
- Today a killmail queued ref is a row in `discovered_killmail_refs` keyed by `killmail_id`, `killmail_hash`, `discovered_by_type`, and `discovered_by_id`.
- Current durable statuses include `pending`, `expanded`, `cached`, `failed`, and `superseded`; stale/expired are not accepted implemented states.
- Queue policy should govern provider request/discovery/expansion work, not local metadata hydration.
- Live/private/provider calls remain gated and are not required for the systems-design advisory.
- The audit found current Watch linkage is uneven: actor Watch inference is stronger; routine system/radius Watch linkage is weaker because queued refs do not store a durable Watch row ID or full radius/lookback/time-window identity.

## Executor

Current executor: none

Expected handoff filename:

```txt
None. No Dev packet is open.
```

## Ordered Runway

No active Dev runway.

Recommended next specialist step:

1. Systems Designer reviews whether Atlas needs a separate provider request/work queue ahead of `discovered_killmail_refs`.
2. Systems Designer distinguishes:
   - Watch schedule/work requests
   - live search priority requests
   - provider discovery refs
   - ESI expansion refs
   - local hydration jobs
3. Systems Designer proposes a smallest safe architecture path:
   - computed diagnostic only
   - schema/work-queue migration
   - staged hybrid path
4. Overseer reviews the advisory and opens a bounded Dev packet only after architecture direction is accepted.

## Guardrails And Non-Goals

- No Dev implementation until the systems-design advisory is reviewed.
- No live/private/API calls.
- No stale/expired mutation.
- No schema migration.
- No production deletion execution.
- No retention/deletion policy changes.
- No snapshot, restore, active DB relocation, or storage-budget expansion.
- No UI redesign or renderer presentation work.
- No local hydration changes.
- No direct live-search routing implementation.
- Do not treat queued refs as Evidence.
- Do not treat failed/partial provider results as stored Evidence.
- Do not hide partial failure by reporting complete evidence coverage.

## Stop Conditions

Stop and return to Overseer/Human before any implementation if:

- proposed work requires live provider access
- proposed work requires schema migration
- proposed work would blur Discovery with Evidence
- proposed work would apply queue policy to local hydration
- proposed work would add direct live-search dispatch, automatic retry loops, or background collection changes
- proposed work would require new user-facing doctrine or presentation decisions
- protected-term warnings suggest a new authority decision is required

## Required Verification

No active Dev packet.

Systems-design advisory is read-only. If a future Dev packet opens near queue identity/freshness, likely verification includes:

```powershell
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-scope-isolation
npm.cmd run verify:queue-report
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-executor
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:manual-discovery
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

HS76 design input captured:

- queue refs should be treated as Watch-scheduled work items
- freshness should relate to Watch interval/lookback where possible
- live searches should enter the priority queue instead of pulsing directly
- queue policy does not affect local hydration
- `ref` needs explicit definition
- uniqueness likely belongs per Watch configuration/target/time/scope, but must be verified

Human-provided queue/schema audit found:

- current queued killmail refs are rows in `discovered_killmail_refs`
- current ref identity is `killmail_id`, `killmail_hash`, `discovered_by_type`, and `discovered_by_id`
- current storage does not reliably preserve originating Watch configuration ID, exact lookback, request time window, or one-active-work-item identity
- local hydration is separate from queue policy
- smallest useful next step may be diagnostic, but Human/Overseer now want systems-design review before Dev implementation

No Dev implementation is open.

Opening verification:

- `npm.cmd run verify:protected-terms` passed with exit code 0, warning-only.
- Protected-term discovery ran in working-set mode against 3 files.
- Warning count: 86.
- Warning classes: cross-project-borrowing 12, lab-quarantine-borrowing 58, atlas-candidate 16.
- `git diff --check` passed.

## Dev Handoff

No Dev handoff is expected until the systems-design advisory is reviewed and accepted.
