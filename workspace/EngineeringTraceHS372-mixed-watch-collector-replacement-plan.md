# EngineeringTraceHS372 - Mixed Watch Collector Replacement Plan

Status: advisory / planning only  
Date: 2026-06-07  
Role: Engineering / Data Engineering advisory agent  
Request: `workspace/OverseerHS372-mixed-watch-collector-replacement-planning-request.md`

## 1. Executive Recommendation

Atlas should proceed toward staged replacement of the legacy mixed Watch collector runtime paths. The source does not support treating the current collectors as the future boundary model with light wording changes. They still bundle Watch scheduling intent, zKill candidate acquisition, Discovery ref persistence, ESI-backed killmail/detail expansion, Evidence/EVEidence writes, run posture, warnings, and API/support logging into single functions.

Do not retire or redirect them immediately. The safest next step is a no-provider replacement slice that proves the future route can be expressed without invoking `collectActorWatch` or `collectSystemRadiusWatch`:

```txt
Watch accepted intent / cadence
-> Discovery zKill candidate-lead acquisition lane
-> Discovery ESI-backed killmail/detail expansion lane
-> Evidence/EVEidence writer / landed memory
-> Watch receipt / cadence posture
```

The important HS372 correction should be preserved: ESI-backed killmail/detail expansion is a Discovery-serviced provider lane for this planning frame. It should not be modeled as a separate ownership domain outside Discovery. Evidence/EVEidence begins at the landed memory/write boundary, not at provider expansion request shaping.

## 2. Current Mixed Collector Source Trace

### Runtime Watch dispatch

- `src/main/watchlist/watchExecutor.js:103` creates a detached task for due Watch execution.
- `src/main/watchlist/watchExecutor.js:115` and `src/main/watchlist/watchExecutor.js:130` record Watch run success/failure after the collector returns or throws.
- `src/main/watchlist/watchExecutor.js:286` builds runtime dispatch payloads.
- `src/main/watchlist/watchExecutor.js:300` dispatches actor Watch to `collectActorWatch`.
- `src/main/watchlist/watchExecutor.js:332` dispatches system/radius Watch to `collectSystemRadiusWatch`.

This makes the current executor a direct caller of mixed collectors. It does not yet emit intent into a Discovery-owned runtime utility.

### Direct command services

- `src/main/services/mutatingActionService.js:52` defines `runActorWatchService`.
- `src/main/services/mutatingActionService.js:61` calls `collectActorWatch`.
- `src/main/services/mutatingActionService.js:64` defines `runSystemRadiusWatchService`.
- `src/main/services/mutatingActionService.js:67` calls `collectSystemRadiusWatch`.

The direct service commands and scheduled Watch executor both enter the same mixed collector path.

### Actor mixed collector

`src/main/workers/actorWatchCollector.js` bundles:

- run creation at `actorWatchCollector.js:21`
- pending Discovery ref drain at `actorWatchCollector.js:40`
- zKill acquisition through `discoverActorRefs` at `actorWatchCollector.js:46` and `actorWatchCollector.js:178`
- Discovery ref persistence at `actorWatchCollector.js:48`
- expansion selection at `actorWatchCollector.js:57`
- selected-ref marking at `actorWatchCollector.js:58`
- ESI-backed killmail/detail expansion at `actorWatchCollector.js:59`
- Evidence/EVEidence persistence at `actorWatchCollector.js:78`
- Discovery ref expansion marking at `actorWatchCollector.js:79`
- fetch-run finalization at `actorWatchCollector.js:132` and failure finalization at `actorWatchCollector.js:145`

### System/radius mixed collector

`src/main/workers/systemRadiusCollector.js` bundles the same responsibilities:

- run creation at `systemRadiusCollector.js:17`
- pending Discovery ref drain at `systemRadiusCollector.js:37`
- zKill acquisition through `discoverRefs` at `systemRadiusCollector.js:43` and `systemRadiusCollector.js:177`
- Discovery ref persistence at `systemRadiusCollector.js:45`
- expansion selection at `systemRadiusCollector.js:52`
- selected-ref marking at `systemRadiusCollector.js:53`
- ESI-backed killmail/detail expansion at `systemRadiusCollector.js:54`
- Evidence/EVEidence persistence at `systemRadiusCollector.js:73`
- Discovery ref expansion marking at `systemRadiusCollector.js:74`
- fetch-run finalization at `systemRadiusCollector.js:131` and failure finalization at `systemRadiusCollector.js:144`

### ESI-backed expansion entry point

- `src/main/workers/killmailIngestionWorker.js:3` defines `buildEvidencePackageFromRefs`.
- `src/main/workers/killmailIngestionWorker.js:14` calls `esiClient.expandKillmail`.
- `src/main/workers/killmailIngestionWorker.js:15` normalizes provider killmail payloads.
- `src/main/workers/killmailIngestionWorker.js:33` records provider capacity deferral warnings.
- `src/main/workers/killmailIngestionWorker.js:42` records failed expansion warnings.

This is the strongest current candidate for the Discovery ESI-backed killmail/detail expansion lane, but the name and placement currently make it easy to confuse expansion, ingestion, and final Evidence writing.

### Evidence repository and candidate refs

- `src/main/db/evidenceRepository.js:136` and `src/main/db/evidenceRepository.js:148` create/finalize `fetch_runs`.
- `src/main/db/evidenceRepository.js:200` persists Evidence packages.
- `src/main/db/evidenceRepository.js:361` records API request logs.
- `src/main/db/evidenceRepository.js:380` upserts `discovered_killmail_refs`.
- `src/main/db/evidenceRepository.js:411` reads pending Discovery refs.
- `src/main/db/evidenceRepository.js:424`, `446`, `468`, and `492` mark refs selected, expanded, cached, or failed.

These are useful primitives, but the current caller decides too much boundary meaning. Candidate refs remain possible leads. Evidence/EVEidence begins at durable landed killmail/activity/audit writes.

### Command metadata

- `src/main/services/serviceRegistry.js:202` and `src/main/services/serviceRegistry.js:210` register `actor.watch` and `system.radius.watch` as provider/evidence-creating commands described as collection with scoped discovery and capped ESI expansion.
- `src/main/services/serviceRegistry.js:785` and `src/main/services/serviceRegistry.js:792` register the accepted HS368/HS370 read-only fixture proof commands.
- `src/main/services/serviceRegistry.js:1570` and `src/main/services/serviceRegistry.js:1574` still label watch runtime command kinds as `direct_actor_watch_collection` and `direct_system_radius_watch_collection`.
- `src/main/services/enforcementDryRunService.js:13` and `src/main/services/enforcementDryRunService.js:14` classify `actor.watch` and `system.radius.watch` under `esi_evidence_expansion` / `scheduled_or_direct_watch_collection`.
- `src/main/services/enforcementDryRunService.js:92` and `src/main/services/enforcementDryRunService.js:93` correctly describe the HS368/HS370 proofs as read-only and non-enforcing.

The metadata still preserves the mixed collector model for live-capable Watch commands.

## 3. Responsibility Split By Boundary

### Watch

Watch should retain:

- authoring and accepted scope authority
- stored accepted system IDs for system/radius Watch
- actor Watch target identity and cadence settings
- due/blocked/offline/cadence posture
- deciding when accepted intent is eligible to hand to Discovery
- receiving a bounded receipt/handoff summary from Discovery
- deciding later cadence, rest, retry, or defer posture from receipt facts

Watch should stop owning:

- zKill provider request shaping
- zKill provider calls
- candidate-ref dedupe/persistence decisions
- ESI-backed expansion selection and execution
- Evidence/EVEidence writes
- API call counts as a semantic completion model
- direct collector success as the definition of Watch completion

### Discovery zKill Candidate-Lead Acquisition Lane

This lane should own:

- accepted acquisition intake from Watch, Manual, and future intent sources
- provider-facing zKill request shaping
- target packet fanout, including one packet per accepted system for system/radius Watch
- zKill response validation
- candidate ref normalization: `killmail_id`, hash, provider, target, source intent, packet basis
- malformed/duplicate/capped/deferred/failed outcome language
- candidate ref dedupe before Evidence/EVEidence
- canonical receipt basis for acquisition packets
- optional durable `discovered_killmail_refs` writes when that movement is opened

It should not own:

- Watch cadence policy
- final Evidence/EVEidence truth
- Hydration labels
- Observation/report meaning
- Assessment claims

### Discovery ESI-Backed Killmail/Detail Expansion Lane

This lane should own:

- intake of selected candidate refs or handoff candidates from Discovery acquisition
- cache skip checks before provider contact
- ESI killmail/detail request shaping
- provider capacity deferral and retryable/terminal expansion failure posture
- normalization of provider killmail payload into a landing candidate package
- preserving candidate provenance into the landing candidate package
- handoff to Evidence/EVEidence writer

This lane should be modeled as Discovery-serviced provider movement. Existing HS370 wording that points to "ESI Evidence Expansion" is useful historically, but the future boundary should avoid making ESI expansion a separate owner outside Discovery.

### Evidence/EVEidence Writer / Memory

Evidence/EVEidence writer logic should retain:

- transactional final landing of killmails
- activity event writes
- ingestion audit writes
- checksum/hash/time/system conflict preservation
- final local memory identity and idempotence
- repository-level local existence checks used to protect Evidence from duplicate landing

It should not own:

- provider request shaping
- zKill candidate acquisition
- Watch cadence or source intent policy
- Discovery task completion semantics
- Hydration/readability repair

### Support Logging / Provenance

Support logging should remain shared/supporting rather than source-owner logic:

- `api_request_logs` are provider movement telemetry and redaction-sensitive support data.
- `data_quality_warnings` are support/provenance facts attached to runs or landed payloads.
- `fetch_runs` currently provide useful historical posture, but they are mixed-run records and should not become the canonical Discovery receipt model without review.
- Candidate provenance should travel with refs and landing candidates, but should not mutate final Evidence/EVEidence into a Watch result artifact.

## 4. Replacement Stages

1. Preserve HS368/HS370 as accepted read-only proofs.
   - They prove shape, not live readiness.
   - They explicitly avoid mixed collectors, providers, writes, tasks, schema, Watch mutation, enforcement, and UI.

2. Add a no-provider replacement route proof.
   - Input: due Watch selection or legacy `actor.watch` / `system.radius.watch` payload shape.
   - Output: future route map from Watch intent to Discovery acquisition, Discovery ESI-backed expansion handoff, Evidence writer boundary, and Watch receipt facts.
   - Required proof: `collectActorWatch` and `collectSystemRadiusWatch` are not invoked.

3. Add a Discovery ESI-backed expansion intake fixture proof.
   - Input: HS370-style selected handoff candidates.
   - Output: fixture expanded killmail/detail landing candidates and provider outcome posture.
   - No provider calls and no Evidence/EVEidence writes.

4. Prove Evidence writer boundary separately from provider movement.
   - Input: fixture landing candidate package.
   - Output: final writer behavior and idempotence evidence.
   - This may reuse existing repository tests, but should be phrased as final landed memory, not Discovery completion.

5. Prove compatibility redirect.
   - Old command entry points may temporarily route into boundary-owned services.
   - This should happen only after the no-provider route and ESI-lane intake are proven.

6. Revisit live Watch movement.
   - Only after Watch no longer directly enters mixed collectors.
   - Live movement should enter Discovery lanes, not collector files.

7. Retire legacy collectors.
   - Remove or quarantine old mixed collector runtime paths after replacement proofs and compatibility checks are stable.
   - Update command metadata and verifier expectations in a later authorized Dev runway.

## 5. Smallest First No-Provider Implementation Candidate

The smallest useful first implementation candidate is a read-only replacement route preview, not a live redirect.

Suggested shape for Overseer to consider later:

```txt
watch.mixed_collector_replacement_route.preview
```

Purpose:

- consume a representative actor Watch and system/radius Watch dispatch shape
- emit the intended future route across boundaries
- list which current legacy command/function names would be compatibility wrappers
- list which parts would be retired
- assert no collector invocation, no provider calls, no tasks, no writes, no Watch mutation, no schema, no enforcement, and no UI

This is smaller and safer than redirecting `actor.watch` or `system.radius.watch`, because it proves the target shape without moving live-capable command behavior.

If Overseer wants a proof closer to provider movement, the next smallest candidate is a `Discovery ESI-backed expansion intake fixture` that consumes HS370 handoff candidates and produces fixture landing candidates without writing Evidence/EVEidence.

## 6. Redirect Vs Retire Recommendation

### Temporary redirect candidates

These can be compatibility surfaces later, but only after replacement route proof exists:

- `actor.watch`
- `system.radius.watch`
- `watch.executor.arm`
- `watch.executor.tick`
- live runner scripts that currently call collectors directly
- older verification scripts that use collectors to seed report data

Redirect should mean "old entry point routes into new boundary-owned services." It should not mean "old collector remains the real model behind nicer names."

### Retire candidates

These should not shape the long-term runtime model:

- `collectActorWatch`
- `collectSystemRadiusWatch`
- `actorWatchCollector.js` as a runtime owner
- `systemRadiusCollector.js` as a runtime owner
- command/runtime wording that says `direct_*_watch_collection`
- service descriptions that make Watch "collection" the owner of zKill acquisition plus ESI-backed expansion plus Evidence write
- verifier expectations that treat mixed collectors as the primary product path

Some helper logic may be worth extracting rather than deleting, especially candidate normalization, dedupe, expansion selection, and cache checks. The risk is leaving extracted logic under names that continue to imply Watch owns acquisition.

## 7. Missing Proofs / Assurance Needs

Already proven or accepted:

- HS368 proves Watch dispatch payloads can feed a Discovery-owned acquisition fixture boundary without invoking mixed collectors.
- HS368 proves actor Watch maps to one acquisition packet and system/radius Watch maps to one packet per stored accepted included system.
- HS368 emits canonical Discovery receipt basis and Watch summary projection with no providers, writes, tasks, Watch mutation, schema, enforcement, or UI.
- HS370 proves acquisition request -> fixture zKill outcomes -> normalized candidate refs -> canonical receipt/watch summary -> selected handoff candidates.
- HS370 proves candidate refs can remain possible leads and handoff shapes can remain non-Evidence.

Still missing:

- a real, boundary-owned Discovery zKill acquisition service path that is not the Watch collector
- a no-provider proof that old Watch command payloads can be routed to the replacement model without invoking collectors
- a Discovery-owned ESI-backed expansion intake fixture proof after HS370 handoff
- proof that `buildEvidencePackageFromRefs` can be split or wrapped without preserving the old mixed "ingestion worker" ownership
- proof of the final Evidence writer boundary from Discovery ESI-backed expansion output
- Watch receipt/handoff facts sufficient to rest, retry, defer, or schedule next cadence
- command authority / enforcement metadata alignment with the replacement model
- verifier migration plan so older tests can seed data without asserting the old runtime model

## 8. Risks And Tradeoffs

- Reusing collectors too heavily would preserve the old ownership model even if command names change.
- Redirecting old commands too early could hide the fact that Watch still owns provider movement.
- Retiring collectors too early would break useful fixture/report verifiers and live-runner scripts before equivalent replacement proofs exist.
- Modeling ESI-backed expansion outside Discovery would conflict with the HS372 correction and recreate a four-owner acquisition pipeline.
- Letting `fetch_runs` become the canonical receipt model would carry mixed run semantics forward.
- Marking Discovery refs `expanded`, `cached`, or `failed` is useful today, but it mixes candidate-memory state with ESI expansion result posture. This needs careful treatment before durable Discovery task/receipt schema.
- Command metadata currently says `actor.watch` and `system.radius.watch` are evidence-creating collection commands. That is accurate for current code but risky as future architecture language.

## 9. Risky Terms / Names

Risky if carried forward unchanged:

- `collectActorWatch`
- `collectSystemRadiusWatch`
- `actorWatchCollector`
- `systemRadiusCollector`
- `direct_actor_watch_collection`
- `direct_system_radius_watch_collection`
- `scheduled_or_direct_watch_collection`
- `Run an actor/system watch collection with scoped discovery and capped ESI expansion`
- `handoff_owner: ESI Evidence Expansion` from the HS370 fixture shape
- `handoff_lane: esi_evidence_expansion` if it implies a separate owner outside Discovery
- `killmailIngestionWorker` if it continues to mean both ESI provider expansion and final Evidence landing

Safer future wording, without renaming source now:

- `Discovery zKill candidate-lead acquisition`
- `Discovery ESI-backed killmail/detail expansion`
- `Evidence/EVEidence landing`
- `Watch acquisition intent`
- `Watch receipt posture`
- `legacy Watch collector compatibility path`

## 10. Parked Items

Keep parked for this advisory:

- live provider calls
- live Watch execution
- actual redirect or retirement of collectors
- schema changes
- Discovery task/packet durable schema
- Dispatcher, leases, workers, runtime enforcement, or command blocking
- Watch result relationship tags
- UI changes
- Hydration/readability repair
- Observation/report transformation changes
- Assessment language
- protected terminology JSON updates
- broad documentation replacement

## 11. Human / Overseer Decisions Needed

Overseer should decide:

- whether the next Dev packet should be the no-provider replacement route preview or the Discovery ESI-backed expansion intake fixture proof
- whether old commands `actor.watch` and `system.radius.watch` should remain as compatibility wrappers later or be replaced by new command names after migration
- whether `fetch_runs` are acceptable as temporary support telemetry during replacement or whether a separate receipt model must be shaped before any redirect
- which legacy verifiers should remain as historical regression tests and which should be migrated to new boundary proofs

No Dev runway is opened by this artifact.

