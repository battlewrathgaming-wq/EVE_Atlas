# EngineeringTraceHS376 - Actor Watch First Replacement Slice Readiness

Status: advisory / implementation-shaping only  
Date: 2026-06-07  
Role: Engineering / Architecture Assurance  
Scope: actor Watch first replacement slice; no implementation authorization

## 1. Recommended First Implementation Target

Actor Watch is the safest first replacement target.

Reason: actor Watch has one accepted actor target, one dispatch payload family, and no stored included-system fanout geometry. The current actor path still has enough real behavior to pressure-test the replacement model: zKill candidate discovery, local pending ref drain, cap/lookback handling, candidate dedupe/malformed posture, ESI-backed killmail/detail expansion, Evidence/EVEidence landing, warnings, API counts, and run finalization.

System/radius Watch should not be first. Its current path includes accepted included-system scope authority and topology-adjacent behavior. HS375 explicitly preserves the rule that Discovery must receive stored accepted system IDs and must not recompute radius topology. That geometry should be deferred until actor Watch proves the replacement split.

Recommendation: open the first Dev slice as fixture-only / no-provider. It should prove actor Watch replacement ownership and semantic parity without redirecting `actor.watch`, invoking `collectActorWatch`, writing rows, or changing runtime behavior.

## 2. Current Actor Watch Mixed Responsibilities

Current actor Watch mixed entry points:

- Scheduled Watch path: `src/main/watchlist/watchExecutor.js:286` builds dispatch payloads. Actor dispatch uses `command: 'actor.watch'` at `watchExecutor.js:298` and `runner: collectActorWatch` at `watchExecutor.js:300`.
- Runtime task path: `src/main/watchlist/watchExecutor.js:103` creates a detached task, then records Watch run success/failure at `watchExecutor.js:115` and `watchExecutor.js:130`.
- Direct command path: `src/main/services/mutatingActionService.js:52` defines `runActorWatchService`, resolves actor input at `mutatingActionService.js:53`, normalizes actor Watch scope at `mutatingActionService.js:54`, gates `actor.watch` at `mutatingActionService.js:60`, and calls `collectActorWatch` at `mutatingActionService.js:61`.

Current `collectActorWatch` bundled behavior:

- actor plan/caps/lookback basis: `src/main/workers/actorWatchCollector.js:20`
- mixed `fetch_runs` creation: `actorWatchCollector.js:21`
- local pending Discovery ref drain: `actorWatchCollector.js:40`
- zKill acquisition through `discoverActorRefs`: `actorWatchCollector.js:46` and `actorWatchCollector.js:178`
- durable Discovery ref write: `actorWatchCollector.js:48`
- expansion selection and cap/cache logic: `actorWatchCollector.js:57`
- selected-ref marking: `actorWatchCollector.js:58`
- ESI-backed expansion via `buildEvidencePackageFromRefs`: `actorWatchCollector.js:59`
- failed expansion posture mapped back to candidate queue: `actorWatchCollector.js:74`
- Evidence/EVEidence landing: `actorWatchCollector.js:78`
- ref expanded/cached marking: `actorWatchCollector.js:79` and `actorWatchCollector.js:83`
- warnings and support logging posture: `actorWatchCollector.js:97`
- returned summary and collection plan: `actorWatchCollector.js:127`
- run finalization: `actorWatchCollector.js:132` and `actorWatchCollector.js:145`

This confirms HS372: the function is a useful behavior map, but not a clean future owner.

## 3. Proposed Responsibility Split

### Watch-owned

Watch should keep:

- actor Watch authoring, actor identity, active routine check meaning, cadence, and accepted intent
- due/blocked/offline/session posture
- actor dispatch payload basis: entity type, entity ID, entity name, lookback, max refs, max expansions
- later receipt/cadence decision from Discovery facts

Watch should not own zKill request shaping, candidate ref writes, ESI expansion, Evidence landing, or Discovery outcome meaning.

### Discovery zKill Candidate-Lead Acquisition Lane

Move from `collectActorWatch`:

- zKill request planning input from actor Watch plan
- zKill provider request shape currently inside `discoverActorRefs`
- returned ref validation
- `killmail_id` / hash extraction
- malformed ref posture
- duplicate ref posture
- candidate priority ordering
- source actor provenance
- no-ref / provider-deferred / failed acquisition posture
- eventual durable candidate-ref persistence, when explicitly opened

Preserve candidate refs as possible leads, not Evidence/EVEidence.

### Discovery ESI-backed Killmail/Detail Expansion Lane

Move from current collector / ingestion worker:

- selected candidate intake
- cache skip before ESI contact
- ESI killmail/detail request shape
- provider capacity deferral posture
- retryable/terminal expansion failure posture
- killmail payload normalization into a future landing candidate package
- provenance carry-through from selected candidate refs

Source basis:

- `src/main/workers/killmailIngestionWorker.js:3` defines `buildEvidencePackageFromRefs`.
- It checks local cache at `killmailIngestionWorker.js:8`.
- It calls ESI at `killmailIngestionWorker.js:14`.
- It normalizes payloads at `killmailIngestionWorker.js:15`.
- It records provider capacity deferral at `killmailIngestionWorker.js:33`.
- It records failed expansion at `killmailIngestionWorker.js:42`.

This lane should be Discovery-serviced provider movement. It is not Hydration.

### Evidence/EVEidence Writer Boundary

Keep in the writer/repository:

- final killmail landing
- activity event writes
- entity updates produced from killmail evidence normalization
- ingestion audit writes
- warning writes attached to landed payloads or conflicts
- checksum/hash/time/system conflict preservation
- final idempotence

Source basis:

- `src/main/db/evidenceRepository.js:200` persists Evidence packages transactionally.
- `evidenceRepository.js:213` upserts killmails.
- `evidenceRepository.js:217` upserts activity events.
- `evidenceRepository.js:228` inserts ingestion audits.
- `evidenceRepository.js:232` inserts warnings.

The writer should not own provider calls or Watch cadence.

### Support / Provenance

Keep shared/supporting:

- API request logs: `src/main/db/evidenceRepository.js:361`
- `fetch_runs` as existing mixed historical support telemetry: `evidenceRepository.js:136` and `evidenceRepository.js:148`
- data quality warnings as support/provenance, not owner logic

Do not turn `fetch_runs` into canonical Discovery receipt authority in the first slice.

## 4. Smallest Safe Dev Slice

Recommended first slice:

```txt
actor Watch replacement route parity / fixture proof
```

Shape:

- consumes an actor Watch dispatch payload shape or representative actor Watch source
- does not call `collectActorWatch`
- maps today actor Watch behavior into boundary-owned stage outputs:
  - Watch accepted actor intent
  - Discovery zKill acquisition request and candidate ref posture
  - Discovery ESI-backed expansion intake candidate posture
  - Evidence/EVEidence writer landing boundary placeholder
  - Watch receipt/cadence posture placeholder
- uses fixture candidate refs and fixture outcomes only
- reports semantic parity against current actor Watch summary fields without writing rows
- carries missing-proof flags for live providers, durable ref writes, ESI expansion runtime, Evidence landing, Watch cadence mutation, compatibility redirect, and collector retirement

This should be a new proof or a narrower mode layered on HS374, not a redirect of `actor.watch`.

The first slice should explicitly not:

- modify `runActorWatchService`
- modify `watchExecutor.dispatchFor` runtime behavior
- invoke `collectActorWatch`
- write `discovered_killmail_refs`
- call zKill or ESI
- write Evidence/EVEidence
- write `fetch_runs`, API logs, or warnings
- mutate Watch cadence
- alter system/radius Watch
- add schema, queue, dispatcher, lease, worker, enforcement, UI, or protected-term changes

## 5. Required Acceptance Criteria

The first slice should prove:

- actor Watch is the only target
- system/radius Watch is untouched except as comparison text/evidence
- current actor Watch payload shape is represented semantically
- no provider movement occurs
- no DB tables mutate
- `collectActorWatch` is not invoked
- candidate refs remain possible leads
- Discovery ESI-backed expansion is represented as Discovery-serviced provider lane, not Hydration
- Evidence/EVEidence writer is represented as final landing boundary only
- current caps/lookback/provenance/error posture are either represented or explicitly marked as missing
- existing expected actor Watch behavior is not claimed retired, redirected, or replaced in runtime

Semantically equivalent behavior to preserve in future runtime replacement:

- actor target identity: entity type, ID, optional name
- lookback seconds from Watch payload / plan
- max refs and max expansions caps
- zKill request target type and ID
- candidate ref extraction from `killmail_id` + hash
- malformed and duplicate candidate posture
- pending local ref drain before fresh zKill acquisition, if this remains product behavior
- local cache skip before ESI expansion
- selected/capped/cached/failed expansion queue posture
- provider capacity deferral distinction
- ESI expansion failure distinction
- Evidence landing idempotence and conflict warnings
- run/summary fields or a declared replacement receipt for equivalent information

Not all of these need to be implemented in the first slice, but none should disappear silently.

## 6. Required Verification / Proof

Minimum verifier proof:

- invokes the actor-only replacement preview/proof
- asserts current actor entry point shape is `actor.watch`
- asserts retire candidate is `collectActorWatch`, but retirement is false
- asserts compatibility wrapper is candidate-only, not implemented
- asserts source-kind is actor and system/radius is not selected
- asserts future stage owners are Watch, Discovery zKill lane, Discovery ESI-backed lane, Evidence/EVEidence writer, Watch receipt/cadence
- asserts no collector invocation:
  - `collectActorWatch_entered: false`
  - `collectSystemRadiusWatch_entered: false`
- asserts no provider calls, DB writes, Watch mutation, tasks, schema, UI, enforcement, redirect, or retirement
- includes fixture cases:
  - refs found and selected
  - no refs
  - malformed ref
  - duplicate ref
  - acquisition capped
  - provider deferred
  - selected ref marked as ESI-backed expansion intake candidate
  - cached candidate / skip posture if local fixture basis allows it

Proof that expected behavior has not been lost:

- compare actor payload/plan fields against current `dispatchFor` actor payload basis from `src/main/watchlist/watchExecutor.js:286-300`
- compare candidate summary fields against current `collectActorWatch` summary fields from `src/main/workers/actorWatchCollector.js:101-129`
- compare cache/selection failure posture against `selectExpansionCandidates` / `markFailedExpansionCandidates` use from `actorWatchCollector.js:57` and `actorWatchCollector.js:74`
- compare ESI intake posture against `buildEvidencePackageFromRefs` behavior at `src/main/workers/killmailIngestionWorker.js:3-44`
- compare final writer boundary against `EvidenceRepository.persistEvidencePackage` at `src/main/db/evidenceRepository.js:200-236`

This does not require provider-capable behavior yet. A controlled provider-capable path would be premature before the ESI-backed expansion intake proof and Evidence writer boundary proof are separated.

## 7. Blocking Risks Before Dev Implementation

Blocking risks:

- A proposed packet redirects `actor.watch` or `watchExecutor.dispatchFor` before proving actor-only replacement parity.
- The slice invokes `collectActorWatch` to prove non-collector replacement.
- The slice calls zKill or ESI.
- Candidate refs are described as Evidence/EVEidence.
- ESI-backed killmail/detail expansion is treated as Hydration.
- Evidence writer behavior is implemented in Discovery or Watch-owned code.
- `fetch_runs` are promoted into canonical Discovery receipt authority without a separate model decision.
- Existing actor caps, lookback, source actor provenance, malformed/duplicate/capped/cache/failure posture are omitted without explicit missing-proof flags.
- The packet changes system/radius Watch behavior or recomputes radius scope.

Non-blocking but important risks:

- HS370 currently emits `handoff_lane: 'esi_evidence_expansion'` and `handoff_owner: 'ESI Evidence Expansion'` at `src/main/services/discoveryAcquisitionToEvidenceHandoffFixtureService.js:261` and `:285`. For HS376 shaping, future wording should clarify Discovery ownership without renaming source in this advisory.
- `killmailIngestionWorker` remains naming-risky because it contains ESI-backed expansion and evidence-package construction. Do not rename it in the first slice, but avoid making the name future authority.

## 8. Deferred Items

Defer:

- system/radius Watch replacement
- stored included-system fanout replacement beyond comparison
- topology/radius recomputation questions
- live zKill acquisition
- live ESI-backed expansion
- Evidence/EVEidence writer execution
- Watch cadence mutation from receipt
- compatibility wrapper implementation
- collector redirect
- collector retirement
- durable Discovery task/packet/receipt schema
- queue/dispatcher/worker/lease/enforcement/UI changes
- Hydration/readability repair
- Observation/report transformation
- protected terminology JSON updates

## 9. Human / Overseer Decisions Needed

Overseer should decide:

- whether the next Dev packet is actor-only replacement parity proof or the narrower Discovery ESI-backed expansion intake fixture proof recommended after HS375
- whether the first actor slice should be a new command or a narrowed mode of `watch.mixed_collector_replacement_route.preview`
- whether pending local ref drain remains required future actor Watch behavior or becomes a separate recovery/queue behavior
- whether `fetch_runs` remain temporary support telemetry only until a Discovery receipt model is shaped

No Dev runway is opened by this artifact.

