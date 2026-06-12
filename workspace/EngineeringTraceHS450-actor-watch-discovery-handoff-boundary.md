# EngineeringTraceHS450 - Actor Watch / Discovery Handoff Boundary

Status: advisory/source-trace only  
Date: 2026-06-12  
Role: Engineering / Source Trace  

## Request Answered

HS450 asks whether actor Watch and Discovery now communicate through a clear request/receipt boundary after the direct and scheduled actor Watch redirects.

Finding: **the runtime handoff is coherent, but the contract is still implicit**.

Actor Watch now hands a bounded actor target/window/cap request into the boundary-owned actor route. Discovery-owned code performs zKill candidate acquisition, pending-ref recovery, selected-ref ESI-backed expansion, candidate status movement, and Evidence/EVEidence landing. The route returns a caller-compatible 22-field summary.

The main remaining risk is language/contract drift: the returned summary still carries compatibility terms from the old collector era. Atlas should name a small read-only request/receipt contract before trimming Watch further or retiring `collectActorWatch(...)`.

## Source Files Inspected

- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS450-actor-watch-discovery-handoff-source-trace-request.md`
- `workspace/OverseerHS449-hs448-production-like-fake-client-verifier-correction-review.md`
- `workspace/DevHS448-production-like-fake-client-verifier-post-hs446-correction.md`
- `workspace/DevHS446-scheduled-actor-watch-redirect.md`
- `src/main/watchlist/watchExecutor.js`
- `src/main/services/mutatingActionService.js`
- `src/main/discovery/actorWatchDirectBody.js`
- `src/main/discovery/actorWatchCompatibilitySummary.js`
- `src/main/workers/actorWatchPlanner.js`
- `src/main/discovery/zkillCandidateAcquisition.js`
- `src/main/discovery/candidateRefMemory.js`
- `src/main/discovery/expansionQueueSelection.js`
- `scripts/verify-watch-actor-scheduled-redirect.js`
- `scripts/verify-watch-actor-direct-redirect.js`
- `scripts/verify-watch-actor-controlled-adapter-return-path.js`
- `scripts/verify-watch-actor-production-like-fake-client-direct-proof.js`

## Current Handoff Path

Direct actor Watch path:

```txt
serviceRegistry
-> runActorWatchService(...)
-> resolve actor input
-> normalize actor Watch scope
-> assertLiveAllowed('actor.watch', ...)
-> runActorWatchDirectBody(...)
-> 22-field compatibility summary
```

Scheduled actor Watch path:

```txt
WatchSessionExecutor.tick(...)
-> dispatchFor(actor)
-> actionGate('actor.watch', payload)
-> TaskRunner detached task
-> runScheduledActorWatch(payload, dependencies)
-> runActorWatchDirectBody(payload, dependencies)
-> task result { watch, collection: 22-field summary }
-> recordWatchRunResult(...)
```

Source trace:

- `src/main/services/mutatingActionService.js:52` defines direct `runActorWatchService(...)`.
- `src/main/services/mutatingActionService.js:61` calls `runActorWatchDirectBody(...)`.
- `src/main/watchlist/watchExecutor.js:110` invokes the scheduled dispatch runner.
- `src/main/watchlist/watchExecutor.js:126` places the route output under `data.collection`.
- `src/main/watchlist/watchExecutor.js:286` defines `dispatchFor(...)`.
- `src/main/watchlist/watchExecutor.js:290-295` builds the scheduled actor payload.
- `src/main/watchlist/watchExecutor.js:300` uses `runner: runScheduledActorWatch`.
- `src/main/watchlist/watchExecutor.js:336` defines `runScheduledActorWatch(...)`.

## Watch-Owned Fields / Responsibilities

Watch-owned or caller-owned handoff inputs:

- `entityType`: accepted actor target kind.
- `entityId`: accepted actor target identity.
- `entityName`: readability/context label; not proof.
- `lookbackSeconds`: requested lookback window derived from direct input or Watch row.
- `maxRefs`: acquisition cap / candidate lead cap.
- `maxExpansions`: selected-ref ESI-backed expansion cap.

Scheduled Watch additionally owns:

- due selection
- cadence
- `watch_id`
- `scope_key`
- active task state
- task emission
- gate-before-dispatch posture
- `recordWatchRunResult(...)`
- success/backoff/next-poll update
- wrapping the route result as `data.collection`

Source trace:

- `src/main/watchlist/watchExecutor.js:97` gates scheduled work before task execution.
- `src/main/watchlist/watchExecutor.js:115` records scheduled success.
- `src/main/watchlist/watchExecutor.js:130` records scheduled failure.
- `src/main/watchlist/watchExecutor.js:293-295` derives `lookbackSeconds`, `maxRefs`, and `maxExpansions` from the Watch source row.

Important boundary note: scheduled Watch does not inspect Discovery memory to decide completion. It consumes runner success/failure through the task boundary and records Watch cadence posture.

## Discovery-Owned Fields / Responsibilities

Discovery-owned work begins inside `runActorWatchDirectBody(...)` after Watch/caller input is accepted.

Source trace:

- `src/main/discovery/actorWatchDirectBody.js:16` defines `runActorWatchDirectBody(...)`.
- `src/main/discovery/actorWatchDirectBody.js:23` plans actor Watch acquisition.
- `src/main/discovery/actorWatchDirectBody.js:46` reads pending Discovery refs.
- `src/main/discovery/actorWatchDirectBody.js:51` turns pending refs into acquisition posture.
- `src/main/discovery/actorWatchDirectBody.js:52` performs zKill candidate acquisition when pending refs are absent.
- `src/main/discovery/actorWatchDirectBody.js:55` upserts candidate refs.
- `src/main/discovery/actorWatchDirectBody.js:65` selects expansion candidates.
- `src/main/discovery/actorWatchDirectBody.js:66` marks selected refs.
- `src/main/discovery/actorWatchDirectBody.js:67` begins selected-ref ESI-backed expansion.
- `src/main/discovery/actorWatchDirectBody.js:91` lands Evidence/EVEidence through repository writer.
- `src/main/discovery/actorWatchDirectBody.js:92` marks expanded refs.
- `src/main/discovery/actorWatchDirectBody.js:96` marks cached refs.
- `src/main/discovery/actorWatchDirectBody.js:108` inserts collection warnings.
- `src/main/discovery/actorWatchDirectBody.js:115` builds the compatibility summary.
- `src/main/discovery/actorWatchDirectBody.js:126` finalizes successful fetch runs.
- `src/main/discovery/actorWatchDirectBody.js:139` finalizes failed fetch runs.

The provider-facing plan is formed by `planActorWatch(...)`:

- `src/main/workers/actorWatchPlanner.js:25` builds planned zKill requests.
- `src/main/workers/actorWatchPlanner.js:34` estimates API calls.
- `src/main/workers/actorWatchPlanner.js:39` records caps.

Discovery candidate behavior:

- `src/main/discovery/zkillCandidateAcquisition.js` owns zKill candidate ref acquisition.
- `src/main/discovery/candidateRefMemory.js` owns pending-ref rehydration posture.
- `src/main/discovery/expansionQueueSelection.js` owns selected/cached/capped/malformed/failed expansion queue posture.

Evidence/EVEidence begins only when expanded ESI killmail data is persisted. Candidate refs and selected refs are not Evidence.

## Direct Caller Return Path

Direct callers receive the 22-field compatibility summary as the top-level return value.

Relevant fields include:

- `run_id`
- `actor`
- `zkill_refs_discovered`
- `pending_refs_considered`
- `already_cached_killmails`
- `expansion_attempted`
- `new_esi_expansions`
- `failed_expansions`
- `persisted_killmails`
- `activity_events_written`
- `api_calls_zkill`
- `api_calls_esi`
- `warnings`
- `collection_plan`
- `expansion_queue`
- `expansion_queue_summary`

Source trace:

- `src/main/discovery/actorWatchCompatibilitySummary.js:1` defines the field list.
- `src/main/discovery/actorWatchCompatibilitySummary.js:26` builds the summary.
- `src/main/discovery/actorWatchCompatibilitySummary.js:78` marks `collection_plan.compatibility_only: true`.

The direct return path is caller-compatible, but it is not yet a cleanly named Discovery receipt.

## Scheduled Caller Return Path

Scheduled actor Watch receives the same 22-field summary from the route and wraps it in the task result:

```txt
{
  status: 'succeeded',
  data: {
    watch,
    collection: summary
  }
}
```

Source trace:

- `src/main/watchlist/watchExecutor.js:124-126` wraps scheduled output.
- `src/main/discovery/actorWatchCompatibilitySummary.js:104` defines `buildScheduledActorWatchCompatibilityResult(...)` with the same shape.
- `scripts/verify-watch-actor-scheduled-redirect.js` verifies the scheduled result shape and 22-field parity.

Scheduled `collection` is compatibility language only. It should not become future doctrine for Discovery receipts.

## Does The Summary Expose Or Hide The Boundary?

It does both.

It exposes useful factual basis:

- actor identity
- candidate refs discovered
- duplicates/malformed removed
- pending refs considered
- selected/expanded/cached/failed/capped posture
- persisted Evidence/EVEidence counts
- API call counts
- warnings

It hides or blurs boundary ownership:

- `collection` sounds like Watch-owned collection rather than Discovery-owned acquisition/expansion.
- `collection_plan` is marked compatibility-only but still surfaces old framing.
- `expansion_queue` exposes internal movement details rather than a stable receipt concept.
- `zkill_refs_discovered` is accurate but provider-specific and should not be the whole receipt identity.
- `zkill_discovery_skipped` describes a useful local pending-ref branch, but it is not a caller-facing doctrine term.

The current 22-field summary is acceptable as a compatibility surface. It should not be treated as the final handoff contract.

## Smallest Stable Handoff Contract Candidate

Without schema or runtime changes, the smallest stable contract to name is:

```txt
actor_watch_discovery_request
actor_watch_discovery_receipt
```

Candidate request fields:

- `source`: `direct_actor_watch` or `scheduled_actor_watch`
- `command`: `actor.watch`
- `actor`: `{ entity_type, entity_id, entity_name }`
- `window`: `{ lookback_seconds }`
- `caps`: `{ max_refs, max_expansions }`
- `basis`: `{ watch_id, scope_key }` for scheduled, or direct caller basis for direct

Candidate receipt fields:

- `run_id`
- `actor`
- `request_window`
- `caps`
- `candidate_ref_counts`
- `pending_ref_counts`
- `selection_counts`
- `evidence_landing_counts`
- `api_counts`
- `warnings`
- `outcome`: derived from current factual posture, not yet durable Discovery task outcome authority
- `compatibility_summary`: current 22-field summary, explicitly temporary

This contract can be proven as a read-only projection over existing runtime outputs. It does not require schema, queues, dispatcher work, receipt persistence, or runtime behavior changes.

## Compatibility Terms To Keep Temporary

Treat these as compatibility/debug terms, not doctrine:

- `collection`
- `collection_plan`
- `expansion_queue`
- `expansion_queue_summary`
- `zkill_refs_discovered`
- `zkill_discovery_skipped`
- `production compatibility summary`
- `direct body`
- `runScheduledActorWatch`

Terms that are safer as boundary language:

- actor Watch request
- Discovery acquisition
- candidate refs
- selected refs
- ESI-backed expansion
- Evidence/EVEidence landing
- handoff receipt
- compatibility summary

## Boundary Risks

- The route body is named under Discovery and owns real provider-facing movement, but it still imports `planActorWatch(...)` from `workers`, which may preserve old Watch/worker vocabulary in the implementation.
- The summary still exposes old collector-era fields as the main caller result.
- Scheduled Watch currently consumes success/failure rather than a named Discovery receipt, which is acceptable now but should be clarified before collector retirement.
- `collectActorWatch(...)` remains available and could confuse future traces unless its remaining callers are explicitly mapped.
- System/radius Watch remains legacy, so actor Watch conclusions must not be generalized to system/radius yet.

## Recommended Next Seam

Recommended next seam: **read-only actor Watch / Discovery handoff contract projection proof**.

Purpose:

- name the request/receipt boundary without changing runtime
- project current direct and scheduled actor Watch outputs into a stable handoff shape
- keep the 22-field summary as `compatibility_summary`
- prove Watch-owned fields and Discovery-owned fields are separable from current source
- avoid collector retirement until remaining `collectActorWatch(...)` callers are traced

This is safer than a runtime adapter adjustment because the runtime already moved in HS440/HS446. It is also safer than collector retirement because the handoff language is not yet clean enough to use as retirement authority.

After that, the next good candidate would be a `collectActorWatch(...)` remaining-caller / retirement-readiness trace.

## Verification / Evidence Used

Reviewed accepted evidence:

- HS446 scheduled redirect handoff
- HS448 stale verifier correction handoff
- HS449 acceptance review

Source evidence:

- direct actor Watch calls `runActorWatchDirectBody(...)`
- scheduled actor Watch calls `runScheduledActorWatch(...)`
- `runScheduledActorWatch(...)` delegates to `runActorWatchDirectBody(...)`
- scheduled result preserves `data.collection`
- direct and scheduled paths no longer use `collectActorWatch(...)`
- system/radius still uses `collectSystemRadiusWatch(...)`
- compatibility summary has 22 fields and marks `collection_plan` as compatibility-only

Verifier evidence reviewed:

- `scripts/verify-watch-actor-scheduled-redirect.js`
- `scripts/verify-watch-actor-direct-redirect.js`
- `scripts/verify-watch-actor-controlled-adapter-return-path.js`
- `scripts/verify-watch-actor-production-like-fake-client-direct-proof.js`

No live/provider calls were run for this trace.

## Parked Items

- `collectActorWatch(...)` retirement
- mixed collector retirement
- system/radius Watch redirect
- durable Discovery receipt/task/packet persistence
- schema changes
- dispatcher / queue / lease behavior
- live/provider verification
- Hydration writes
- Observation/report changes
- Assessment behavior
- runtime enforcement activation
- command blocking
- renderer UI
- source-term rename
- protected-word JSON updates

