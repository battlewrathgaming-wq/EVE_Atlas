# Systems Proposal HS104: Two-Clock Recovery Sequencer

Role: Atlas Systems Auditor
Date: 2026-05-27
Status: Advisory proposal based on current implementation knowledge

This proposal does not implement code, change schema, create a Dev runway, rename terms, or change product authority.

## Overseer Revision Note 2026-05-27

Human/Overseer follow-up accepted the useful separation in this proposal, but refined the clock names and provider-pressure model.

Durable terms now preferred:

```txt
Acquisition Clock = builds the local evidence corpus.
Hydration Recovery Clock = makes local facts readable.
```

The earlier "grandfather fanout clock" and "spinning wheel clock" language should be treated as Human discussion metaphor, not source terminology.

Accepted correction:

- Acquisition Clock includes a zKill Discovery lane and an ESI Evidence expansion lane.
- Hydration Recovery Clock includes a Watch hydration lane and a view/local-record hydration lane.
- Hydration fanout from unresolved IDs is likely the larger provider-pressure bottleneck.
- Future provider work should sit under an `external_io` family as the operator trust boundary.
- Existing `watch.executor.arm` remains Watch/session arming only and should not become the global provider gate.

This proposal remains useful as advisory design input, but future packets should follow `docs/features/acquisition-and-hydration-clocks.md` for the accepted model.

## Executive Summary

Atlas should separate provider-driven acquisition into two clocks:

1. **Acquisition Clock**: a patient acquisition clock that asks provider questions and records local facts through zKill Discovery and ESI Evidence expansion lanes.
2. **Hydration Recovery Clock**: a recovery/readability clock that slowly repairs missing labels and metadata for Watch-originated or view/local-record needs.

The key rule:

```txt
Acquisition creates local facts.
Hydration Recovery makes local facts readable.
```

This preserves Atlas boundaries: zKill remains Discovery, ESI expansion creates Evidence/EVEidence, hydration repairs readability, and provider calls remain explicit and controlled.

The current Live/manual search path likely needs rewiring so that its first provider response can stay immediate and narrow, while any fanout enrichment routes through Recovery Sequencer selection rather than being executed directly by the search path.

## Current System Basis

Atlas already has useful foundations:

- `manual.discovery` calls zKill only and writes `discovered_killmail_refs`.
- `manual.expansion` explicitly expands selected queued refs through ESI.
- `actor.watch` and `system.radius.watch` can drain pending local refs before fresh zKill discovery.
- Watch intent and cadence live in `watchlist_entities` and `system_watches`.
- `watchExecutor` is session-armed, volatile, and dispatches at most one due Watch per tick.
- `liveApiGateService` enforces live enablement, User-Agent, cooldown/lockout, duplicate active request, and manual radius rejection.
- `Watch_offline` can report pending refs, provider deferral, missed slots, orphaned runs, reconstructed scope, and `next_safe_action`.
- Retryable provider/capacity waits leave refs pending and write no Evidence/EVEidence.

Current limitations:

- Watch collectors still combine zKill discovery and capped ESI expansion in one run.
- There is no separate Recovery Sequencer runtime.
- `discovered_killmail_refs` is a Discovery/provenance queue, not a provider-work scheduler.
- Request-control state is service-memory-only.
- Provider capacity deferral is warning/readout state, not a durable retry schedule.
- Hydration is separate but not paced by the same request-control accounting.

## Proposed Model

### Clock 1: Grandfather Fanout Clock

Purpose:

- Ask whether a scoped target/window has new candidate work.
- Run from Watch schedule, Spawn job schedule, or immediate narrow Live search.
- Return and store candidate refs or missing-context candidates.
- Stop before draining downstream fanout.

Inputs:

- target or Watch configuration
- scope
- time window/lookback
- provider lane
- cap/batch size
- last run / next run timing

Outputs:

- Discovery refs in `discovered_killmail_refs`
- run/provenance rows in `fetch_runs` and `api_request_logs`
- missing/readability candidate signals where applicable
- readout state, not completion claims

It should not:

- execute the full ESI fanout
- imply completeness
- mark Discovery refs as Evidence/EVEidence
- silently hydrate names or labels
- bypass Live gate/request-control

### Clock 2: Spinning Wheel Recovery Clock

Purpose:

- Release selected enrichment/recovery work slowly.
- Control ESI expansion and readability hydration.
- Treat failures as recoverable local state.
- Prioritize useful work over exhaustive completion.

Inputs:

- selected Discovery refs
- failed refs selected for retry
- provider-deferred refs whose wait has cleared
- missing names/labels selected for readability recovery
- Marked/Watch/operator-priority signals

Outputs:

- expanded ESI killmail Evidence/EVEidence
- readability metadata updates through hydration
- retryable wait state
- terminal failure state
- ignored/deferred state
- operator-facing recovery progress

It should not:

- make every possible candidate a required request
- hide partial success
- turn hydration into Evidence enrichment
- run unbounded provider fanout
- make Live search completion dependent on full enrichment

## Recovery Sequencer Target Types

Recovery Sequencer should control two different recovery target types under one operator/readout surface:

### Evidence Recovery

Meaning:

- Expand selected zKill refs through ESI.
- Successful result writes `killmails`, `activity_events`, `ingestion_audits`, and Evidence/EVEidence provenance.

Current source:

- `discovered_killmail_refs`
- `queue.selection`
- `manual.expansion`
- Watch collector pending-ref drain behavior

Candidate states:

- `pending`
- `selected_for_recovery`
- `leased`
- `expanded`
- `cached`
- `retryable_wait`
- `failed_terminal`
- `ignored`

### Readability Recovery

Meaning:

- Hydrate missing names/labels for already-known local records.
- Successful result updates `entities`, label fields, local metadata tables, and `metadata_runs`.

Current source:

- `metadata.hydration`
- `metadata_runs`
- report-scoped unresolved labels
- local SDE lookup gaps

Candidate states:

- `missing`
- `selected_for_recovery`
- `hydrating`
- `resolved`
- `retryable_wait`
- `failed_terminal`
- `ignored`

## Live Search Rewire

Current desired behavior:

```txt
Live search
-> immediate narrow discovery
-> returned candidates
-> optional selected enrichment
```

Recommended rewire:

```txt
Live search / manual discovery
-> first provider call only
-> write Discovery refs and/or missing-context candidates
-> show local/degraded result immediately
-> offer selected recovery/enrichment
-> Recovery Sequencer controls downstream ESI/hydration fanout
```

This means:

- Live search may stay immediate for the first narrow provider response.
- Live search should not automatically drain 50, 100, or 1000 downstream requests.
- Manual radius should remain rejected for direct Live search unless Human/Overseer changes direction.
- Any fanout caused by a Live search should become selected Recovery Sequencer work.
- `Enrich selected` becomes a Recovery Sequencer release action rather than a separate one-off direct drain path over time.

Smallest behavioral transition:

- keep `manual.discovery` as the immediate first-clock path
- preserve `manual.expansion` as the explicit second-clock action for now
- introduce Recovery Sequencer readout/selection language around `manual.expansion`
- later replace direct manual expansion execution with a paced recovery dispatcher

## Watch / Radius Rewire

Current Watch collectors do this:

```txt
due Watch
-> drain pending refs if present
-> otherwise zKill discovery
-> select refs
-> ESI expansion under cap
-> write Evidence/EVEidence
```

Recommended future direction:

```txt
due Watch / Spawn job
-> first-clock zKill discovery packet
-> write/refresh Discovery refs
-> finish acquisition run
-> Recovery Sequencer picks selected refs later
-> paced ESI expansion writes Evidence/EVEidence
```

This keeps Watch/radius patient and lets radius searches produce many possible leads without requiring immediate downstream ESI fanout.

The current pending-ref drain behavior is valuable, but it should eventually move under the Recovery Sequencer rather than live inside each acquisition collector.

## Durable Shape Options

### Option A: Computed Recovery View First

Use existing tables to compute recovery candidates:

- `discovered_killmail_refs` for Evidence recovery
- `metadata_runs`, reports, and unresolved labels for readability recovery
- `data_quality_warnings` for provider deferral/failure groups
- `fetch_runs` and `api_request_logs` for provenance
- `Watch_offline` for operator-safe next action

Pros:

- smallest schema impact
- aligns with current guardrails
- proves operator value before a queue table

Cons:

- weak leasing/claiming
- weak retry policy
- limited restart-durable pacing

### Option B: Recovery Item Ledger

Add a separate recovery-work table later, not by changing `discovered_killmail_refs` into the Sequencer.

Possible fields:

```txt
recovery_items
- recovery_item_id
- recovery_type: evidence_expansion | readability_hydration
- source_table
- source_key
- parent_run_id
- watch_type
- watch_id
- provider
- target_type
- target_id
- scope_key
- status
- priority
- attempts
- next_eligible_at
- lease_owner
- lease_expires_at
- last_error
- created_at
- updated_at
```

Pros:

- clear pacing, leasing, restart recovery, and retry policy
- one Recovery Sequencer can serve Live search and Watch/radius
- avoids overloading Discovery refs as provider-work scheduler

Cons:

- schema migration
- requires careful boundary language
- needs Human/Overseer decision on durable retry policy

## Release Control Policy

Recovery Sequencer should release work with three brakes:

- **Concurrency cap**: very small number of in-flight provider calls.
- **Provider spacing**: minimum interval or token bucket per provider/action.
- **Eligibility time**: retry-after, cooldown, or local `next_eligible_at` before a candidate can be leased again.

Completion should not be a goal. Recoverability should be the goal.

Example operator posture:

```txt
Found 1000 possible leads.
Selected 25 for recovery.
Expanded 12.
8 waiting on provider.
5 failed and can be retried.
975 remain possible leads, not evidence.
```

## Boundaries To Preserve

- Discovery refs are possible leads/provenance, not Evidence/EVEidence.
- Expanded ESI killmails are Evidence/EVEidence.
- Hydration repairs readability and metadata only.
- Live search may discover immediately; downstream fanout must go through recovery control.
- Watch/radius may acquire patiently; downstream fanout must still go through recovery control.
- Waiting is not failure.
- Provider deferral is not terminal failure.
- Partial success must be visible.
- Completeness must never be implied.
- R-Scanner / R-scan remains presentation language, not backend/source authority.

## Suggested Bounded Next Packet

Recommended next packet should be advisory/design or readout-only before implementation.

Smallest safe packet:

**Recovery Sequencer Readout And Search Rewire Design**

Goal:

- design the bridge between current Live search/manual discovery and a future Recovery Sequencer
- define how selected Evidence recovery and readability recovery appear from existing data
- identify the smallest source changes needed later to stop Live/Watch paths from draining their own fanout

Non-goals:

- no schema migration
- no provider calls
- no new broad provider queue
- no persisted Sequencer packet table yet
- no stale/expired ref mutation
- no hydration/Evidence terminology merge
- no immediate behavior change unless explicitly opened later

Expected outputs:

- current flow diagram for `manual.discovery`, `manual.expansion`, `actor.watch`, and `system.radius.watch`
- proposed two-clock flow diagram
- list of exact function boundaries to rewire
- readout model for Recovery candidates from existing tables
- decision point on computed view versus `recovery_items` ledger

## Verification Suggestions For A Future Packet

Relevant non-live commands:

```powershell
npm.cmd run verify:manual-discovery
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:queue-scope-isolation
npm.cmd run verify:live-api-gate
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-executor
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:partial-failures
npm.cmd run verify:hydration
npm.cmd run verify:metadata-status
npm.cmd run verify:service-registry
npm.cmd run verify:passive-side-effects
npm.cmd run verify:db-integrity
git diff --check
git status --short --branch
```

Future implementation proof should show:

- Live/manual discovery writes candidates but does not run downstream ESI fanout.
- Live/manual search can return degraded local results while recovery remains pending.
- Selected Evidence recovery writes Evidence/EVEidence only after explicit release.
- Selected readability recovery writes metadata/readability only.
- Provider deferral leaves work recoverable and does not mark Evidence failure.
- Restart can recover pending/leased/retryable work without duplicating Evidence.
- Watch/radius acquisition can complete without immediate ESI drain.
- `discovered_killmail_refs` remains Discovery/provenance, not the Sequencer table.

## Human / Overseer Decisions Needed

- Should the first Recovery Sequencer implementation be computed readout only or a durable `recovery_items` ledger?
- Should `manual.expansion` become an adapter over Recovery Sequencer release?
- Should Watch collectors stop automatic ESI expansion in the first Sequencer rewire, or should that be phased later?
- How should ignored/deferred recovery candidates be represented?
- Should hydration get separate cadence protection or share only the operator-facing Recovery Sequencer surface?
- What is the minimum operator selection unit: ref, report gap, Watch scope, target entity, or priority group?

## No Code Changed

This proposal added only an advisory workspace artifact. It did not change source code, schema, runtime behavior, docs authority, product direction, or provider behavior.
