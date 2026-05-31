# OverseerHS78 - Request Control Sequencer Advisory Review

Date: 2026-05-26
Role: Atlas Overseer
Status: advisory accepted; Dev not opened

## Decision

Accept the systems-design advisory direction.

Atlas should not build a broad provider work queue yet. That is too much architecture for the current need. The practical next direction is a small Watch / Sequencer request-control layer that protects provider endpoints, makes waiting normal, and keeps `discovered_killmail_refs` as the returned-ref Discovery queue.

## Accepted Doctrine

```txt
Live search = direct provider-style lookup.
Watch / Sequencer = Atlas-engineered scoped acquisition over time.
Discovery Queue = returned zKill refs.
Evidence = expanded ESI killmails.
```

Accepted distinctions:

- Live search is immediate and narrow.
- Watch / Sequencer is patient and powerful.
- Radius belongs to Watch / Sequencer, not Live search.
- Waiting is valid endpoint-respectful behavior, not failure.
- Local cache checks are not hydration.
- Local hydration remains readability/label metadata work and is outside queue/request-control policy.

## Accepted Live Search Shape

Live search should remain close to direct provider-style lookup:

- direct actor/system/ref lookup
- no radius
- short lookback
- low caps
- cooldown
- abuse lockout
- writes `discovered_killmail_refs` only after zKill returns refs
- never claims complete coverage beyond the small live envelope

This avoids making Live search a stealth scraper.

## Accepted Watch / Sequencer Shape

Watch / Sequencer should support Atlas-engineered scoped acquisition:

- Atlas-added radius
- longer lookbacks
- large envelopes broken into paced packets
- waiting as normal behavior
- separate respect for zKill and ESI capacity
- slow resume until complete, cancelled, capped, or terminally blocked

Watch / Sequencer should not use `discovered_killmail_refs` as its request-control state. That table starts too late because it only exists after zKill returns a `killmail_id`/hash pair.

## Accepted State Direction

Request-control/sequencer state may include:

- `scope_fingerprint`
- `mode`: `live` or `watch`
- `provider`: `zkill` or `esi`
- `step_index`
- `target_envelope`
- `current_lookback`
- `radius`
- `caps`
- `status`
- `last_attempt_at`
- `next_allowed_at`
- `failure_class`
- `lockout_until`

Potential statuses:

- `pending`
- `running`
- `waiting_for_cooldown`
- `waiting_for_zkill_capacity`
- `waiting_for_esi_capacity`
- `succeeded_no_new_refs`
- `succeeded_refs_found`
- `partial_deferred`
- `parameter_blocked`
- `provider_retryable`
- `failed_terminal`
- `cancelled`
- `complete`

These are accepted as design direction, not implemented schema.

## Explicit Rejections / Deferrals

Rejected for the next step:

- broad provider work queue framework
- making `discovered_killmail_refs` the sequencer
- stale/expired ref mutation
- direct Live search radius
- treating waiting as failure
- calling local cache checks hydration

Deferred:

- persisted sequencer schema unless the next packet proves it is needed
- stale/expired Discovery ref policy
- queue cadence/UX pacing
- full provider orchestration
- live/API verification

## Recommended Next Dev Packet

Smallest safe packet:

```txt
Request-control/sequencer diagnostic and live-search guardrails
```

Bounded goals:

- add request fingerprint generation for live/manual/Watch scopes
- add live search cooldown/lockout check
- reject radius in Live search
- add Watch/sequencer diagnostic output showing planned packets for radius/lookback
- keep `discovered_killmail_refs` schema unchanged
- do not implement stale/expired refs
- do not run live calls in verification

This can be read-only or low-mutation depending on current code fit. If mutation is needed, it should be limited to local request-control metadata and must not affect Evidence or Discovery refs.

## Verification Direction

Suggested verification:

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

Expected new proof:

- Live search rejects radius.
- Same live fingerprint enters cooldown.
- Repeated blocked attempts create lockout.
- Watch radius remains allowed.
- Sequencer plan shows packet count, caps, and wait state.
- Waiting does not mark refs failed.
- ESI retryable capacity does not create Evidence or terminal failure.

## Open Decisions

- Should the first packet persist request-control state or remain diagnostic/computed only?
- What exact cooldown and lockout defaults are acceptable for Live search?
- Should manual search use Live search constraints, Sequencer constraints, or a separate manual profile?
- Which provider responses map to `waiting_for_*` versus `provider_retryable` versus `failed_terminal`?
- What is the smallest operator-facing readout needed to explain waiting without UI overload?
