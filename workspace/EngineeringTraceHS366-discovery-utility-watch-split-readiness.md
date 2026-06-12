# EngineeringTraceHS366 - Discovery Utility / Watch Split Readiness

Status: advisory / source-trace only
Date: 2026-06-07
Role: Engineering / Data Engineering Source Trace Auditor
Milestone: Atlas Storage And Runtime Hardening

## 1. Executive Finding

Yes, the existing code can be trimmed into the accepted shape, but not by treating the current Watch collectors as the future boundary.

Current product/proof direction is coherent:

```txt
Watch intent / accepted scope
-> Discovery utility acquisition
-> Discovery candidate refs / receipt basis
-> ESI Evidence Expansion
-> Evidence/EVEidence writes
-> caller receipt/handoff
```

The current live-capable Watch path is still a combined collector path:

```txt
Watch scheduler / executor
-> collectActorWatch or collectSystemRadiusWatch
-> zKill Discovery
-> discovered_killmail_refs
-> expansion selection
-> ESI Evidence Expansion
-> Evidence/EVEidence writes
-> fetch_run / warning / Watch success posture
```

The cleanest split is to carve Discovery out of the collectors around the already-proven packet model, not to add durable receipt schema on top of mixed collectors. HS363 proves the Discovery receipt shape can exist as a non-durable fixture. The next useful proof should show current Watch dispatch can be redirected to a non-durable Discovery acquisition utility boundary that returns a receipt-like basis without invoking ESI expansion or updating Watch schedule.

Do not open durable Discovery task/packet schema yet. Do not reopen live Watch provider movement yet.

## 2. Current Path Map

### Watch Actor Runtime Path

Implemented path:

```txt
buildWatchScheduleStatus
-> WatchSessionExecutor.tick
-> dispatchFor(actor)
-> TaskRunner.runDetachedTask
-> collectActorWatch
-> discoverActorRefs / pendingActorDiscovery
-> upsertDiscoveredKillmailRefs
-> selectExpansionCandidates
-> buildEvidencePackageFromRefs
-> persistEvidencePackage
-> mark refs expanded/cached/failed
-> finalizeFetchRun
-> recordWatchRunResult(success/failure)
```

Source basis:

- `src/main/watchlist/watchScheduler.js:3` builds due/blocked Watch posture.
- `src/main/watchlist/watchExecutor.js:60` gates and dispatches a due Watch.
- `src/main/watchlist/watchExecutor.js:286` maps actor Watch to `actor.watch`.
- `src/main/workers/actorWatchCollector.js:13` runs the mixed actor collection.
- `src/main/workers/actorWatchCollector.js:178` performs zKill actor discovery.
- `src/main/workers/killmailIngestionWorker.js:3` begins ESI Evidence Expansion.
- `src/main/db/evidenceRepository.js` persists Discovery refs, Evidence rows, API logs, and warnings.
- `src/main/watchlist/watchScheduler.js:22` records Watch success/failure posture.

### Watch System/Radius Runtime Path

Implemented path:

```txt
buildWatchScheduleStatus
-> WatchSessionExecutor.tick
-> dispatchFor(system_radius)
-> acceptedSystemIdsForWatchSource
-> TaskRunner.runDetachedTask
-> collectSystemRadiusWatch
-> planSystemRadiusWatch
-> discoverRefs per planned zKill system request
-> upsertDiscoveredKillmailRefs
-> selectExpansionCandidates
-> buildEvidencePackageFromRefs
-> persistEvidencePackage
-> mark refs expanded/cached/failed
-> finalizeFetchRun
-> recordWatchRunResult(success/failure)
```

Source basis:

- `src/main/watchlist/watchExecutor.js:286` maps system/radius Watch to `system.radius.watch`.
- `src/main/watchlist/watchExecutor.js:336` blocks invalid stored `included_system_ids`.
- `src/main/workers/systemRadiusCollector.js:9` runs the mixed system/radius collection.
- `src/main/workers/systemRadiusCollector.js:177` loops zKill Discovery requests by planned system.
- `docs/features/watch-scope-authority.md` accepts stored `included_system_ids` as execution authority.

### Current Clean Proof Path

Already-proven non-live path:

```txt
watch.executor_tick_dry_run.preview
-> watch.discovery_pickup_packet_proof.preview
-> discovery.pickup_consumer_fixture.preview
-> discovery.receipt_projection_fixture.preview
```

Source basis:

- `src/main/services/watchDiscoveryPickupPacketProofService.js` emits pre-provider pickup packets and one packet per accepted system ID.
- `src/main/services/discoveryPickupConsumerFixtureService.js` consumes pickup packets into fixture candidate refs.
- `src/main/services/discoveryReceiptProjectionFixtureService.js:17` emits canonical receipt basis and projections.
- `src/main/services/discoveryReceiptProjectionFixtureService.js:6` limits attempted packet outcomes to the accepted HS362 vocabulary.

## 3. Boundary Mixing Findings

### Mixed: Watch Collectors

`collectActorWatch(...)` and `collectSystemRadiusWatch(...)` currently mix:

- Watch-triggered collection;
- zKill Discovery acquisition;
- local queue draining;
- durable Discovery ref writes;
- expansion selection;
- ESI killmail expansion;
- Evidence/EVEidence persistence;
- warning/API/fetch-run lifecycle;
- summary output used by Watch task completion.

This is the main split target.

### Mixed: Watch Executor Completion

`WatchSessionExecutor.tick(...)` records Watch success after the collector returns. That success is collector/task completion, not Discovery receipt completion and not Evidence quality. It currently cannot distinguish "Discovery completed with no refs" from "Discovery found refs and ESI later failed" with the accepted packet vocabulary.

### Mixed: Discovery Ref Status

`discovered_killmail_refs.status = failed` currently represents ESI expansion failure in normal expansion paths. It should not be reused later as zKill Discovery packet failure without a separate basis.

### Mixed: Fetch Run Counts

`fetch_runs` combines `discovered_refs`, `expanded_new`, `failed_expansions`, `api_calls_zkill`, and `api_calls_esi`. This is useful historical run posture, but not a clean Discovery receipt.

### Partially Clean: Manual

`discoverManualRefs(...)` is the cleanest current Discovery-like product path because it calls zKill and writes candidate refs without ESI expansion. `expandManualRefs(...)` is a cleaner ESI Evidence Expansion path because it consumes selected refs and writes Evidence/EVEidence. Manual path should be used as a pattern, not as the immediate runtime Watch implementation authority.

## 4. Recommended Ownership Split

Watch-owned:

- Watch authoring and accepted scope;
- scheduler due/backoff/posture;
- stored `included_system_ids` authority for system/radius;
- cadence policy;
- deciding rest/retry/defer/review from a Discovery receipt projection;
- recording Watch schedule posture after receipt handling, later.

Discovery-owned or Discovery-facing:

- accepted acquisition intake from Watch, Manual, future recovery, or future intent sources;
- pickup packet fanout;
- zKill provider request shaping;
- provider attempt basis;
- candidate ref extraction and dedupe;
- no-ref, cap, defer, retry, and failure acquisition language;
- canonical receipt basis and safe projections;
- candidate-ref write/read handoff if durable refs are used.

ESI Evidence Expansion-owned:

- selecting eligible `killmail_id` / hash pairs for ESI expansion;
- cache skip before ESI calls;
- ESI killmail provider calls;
- provider capacity deferral for ESI expansion;
- expansion warnings and failed expansion status.

Evidence/EVEidence storage-owned:

- `killmails` writes;
- `activity_events` writes;
- raw ESI payload/checksum preservation;
- ingestion audits;
- Evidence conflict warnings.

Shared utility / unclear:

- `fetch_runs` currently spans Discovery and Evidence Expansion. Future split may need either clearer run types or separate Discovery receipt/task memory.
- `api_request_logs` can remain provider-call support/provenance, but Discovery receipt should not depend on parsing log text as product outcome truth.
- `selectExpansionCandidates(...)` currently lives in `systemRadiusCollector.js`; conceptually it belongs to ESI Evidence Expansion selection, not system/radius Discovery.

Should be parked:

- durable Discovery task/packet schema;
- dispatcher/lease/worker distribution;
- Watch schedule advancement from receipt;
- Manual/Live adoption of receipt vocabulary;
- UI receipt display;
- Observation interpretation;
- Hydration/readability;
- runtime enforcement/command blocking changes.

## 5. Discovery Utility Minimum Responsibilities

Minimum Discovery utility shape before durable schema:

- accept a caller-agnostic acquisition request from a due Watch pickup packet set;
- validate request posture before acquisition, including held External I/O behavior;
- emit one actor packet or one system/radius packet per stored accepted system ID;
- shape zKill requests from packet target, lookback, and cap fields;
- call only zKill for Discovery movement when live movement is later opened;
- normalize provider return into candidate refs;
- dedupe refs within the acquisition request;
- classify packet outcome using accepted packet words:
  - `complete_refs_found`
  - `complete_no_refs`
  - `partial_deferred`
  - `provider_deferred`
  - `acquisition_capped`
  - `failed_retryable`
  - `failed_terminal`
- keep `held_by_external_io` request-level and pre-acquisition;
- produce canonical receipt basis and requested projection;
- avoid Evidence/EVEidence, Hydration, Observation, Assessment, UI, and Watch schedule mutation.

For the first non-durable runtime bridge, Discovery can return candidate refs as plain data. It does not need to write `discovered_killmail_refs` yet unless Overseer deliberately opens that follow-up.

## 6. Watch Trimming Recommendations

Watch should stop owning or stop doing these in future live-capable movement:

- direct zKill acquisition inside Watch collectors;
- direct ESI Evidence Expansion inside the same Watch task;
- treating collector success as Discovery completion;
- using center/radius as execution authority after accepted scope exists;
- deriving provider acquisition meaning from provider payloads or warning text;
- deciding full coverage when Discovery reports capped, partial, deferred, or missing basis.

Watch should keep:

- authoring/scope authority;
- due/backoff/cadence;
- selecting a due Watch;
- emitting Discovery pickup intent;
- reading a `watch_summary` projection later;
- applying its own schedule policy after receipt inspection.

## 7. Receipt / Handoff Facts Needed By Watch

Watch does not need provider payloads. It needs a bounded receipt projection with:

- source Watch id and scope key;
- accepted scope basis, including stored accepted system IDs for system/radius;
- requested window/lookback;
- accepted packet count;
- attempted packet count;
- completed packet count;
- packet outcome counts;
- ref count;
- cap basis and full-coverage-not-claimed flag;
- deferred/retryable/terminal counts;
- request-level hold posture and hold reason;
- missing basis flags and confidence;
- boundary flags that candidate refs are not Evidence/EVEidence;
- next-eligible/retry-after basis when provider gives one, if known.

From those facts, Watch can later decide rest, retry, defer, review, or next cadence. Discovery should not decide caller satisfaction.

## 8. Minimum Proof Before Durable Schema

Before durable Discovery receipt/task-packet schema is worth considering, prove a non-durable split from current runtime surfaces:

```txt
due Watch
-> dispatchFor payload
-> Discovery acquisition request / pickup packet set
-> non-durable Discovery utility result
-> canonical receipt basis / watch_summary projection
-> no Watch mutation, no ESI, no Evidence writes
```

This proof should use fixture provider outcomes or injected zKill-client fixtures. It should show:

- actor and system/radius paths;
- one system/radius packet per stored accepted system ID;
- no-ref packet result;
- provider-deferred packet result;
- capped packet result;
- retryable and terminal failure classes;
- request-level External I/O hold with no packet outcomes emitted;
- no mutation of current durable tables.

Only after that should Atlas decide whether durable schema needs task rows, packet rows, receipt rows, or a smaller read model.

## 9. Minimum Proof Before Live Watch Movement

Before live Watch provider movement is safe to revisit, prove a runtime split where:

- Watch executor dispatches to Discovery acquisition, not directly to the mixed collectors;
- Discovery can call zKill and return a receipt without ESI expansion;
- candidate refs are either returned non-durably or written only through a Discovery-owned ref persistence step;
- ESI Evidence Expansion is a separate subsequent step from selected refs;
- Watch schedule state is not updated until a receipt handoff policy exists;
- External I/O off holds before acquisition;
- provider deferral does not create catch-up flooding;
- existing `actor.watch` and `system.radius.watch` mixed commands are either kept as legacy/direct commands or explicitly redirected by a bounded Dev packet.

Live Watch movement should not proceed while `collectActorWatch(...)` and `collectSystemRadiusWatch(...)` remain the executor's direct provider/evidence path.

## 10. Existing Proofs / Verifiers To Reuse

Useful accepted proofs:

- `watch.runtime_packet_plan.preview`
- `watch.executor_tick_dry_run.preview`
- `watch.packet_dry_run_dispatch_parity.preview`
- `watch.discovery_pickup_packet_proof.preview`
- `discovery.pickup_consumer_fixture.preview`
- `discovery.outcome_derivation.preview`
- `discovery.receipt_projection_fixture.preview`

Useful verifiers:

- `verify:watch-runtime-packet-plan`
- `verify:watch-executor-tick-dry-run`
- `verify:watch-packet-dry-run-dispatch-parity`
- `verify:watch-discovery-pickup-packets`
- `verify:discovery-pickup-consumer-fixture`
- `verify:discovery-outcome-derivation`
- `verify:discovery-receipt-projection-fixture`
- `verify:watch-scope-authority-conformance`
- `verify:system-radius-collector`
- `verify:actor-watch`
- `verify:manual-discovery`
- `verify:queue-api-evidence-write`
- `verify:service-registry`
- `verify:command-authority`
- `verify:passive-side-effects`
- `verify:enforcement-dry-run`

The first seven are most relevant to the split. The collector verifiers are regression evidence for the old path, not proof that the new boundary is live-ready.

## 11. Gaps / Risks / Parked Items

Gaps:

- no real non-fixture Discovery acquisition utility exists yet;
- no runtime bridge redirects Watch dispatch to Discovery utility;
- no product-grade per-packet completion rows exist;
- no durable no-ref, provider-deferred, capped, retryable, or terminal packet state exists;
- no Watch receipt handoff policy exists;
- no split between Discovery provider deferral and ESI provider capacity deferral in durable status rows;
- no packet-to-ref durable linkage exists;
- `fetch_runs` remains mixed across Discovery and Evidence Expansion.

Risks:

- adding schema now would freeze the old collector mix into durable shape;
- letting Watch keep direct collectors will keep Discovery receipt language as a side proof rather than product behavior;
- using `discovered_killmail_refs` as task memory would erase no-ref/deferred/capped packet outcomes;
- treating ESI expansion success as Discovery success would blur the Evidence boundary;
- worker/dispatcher design before split proof could optimize the wrong unit of work.

Parked:

- live/provider calls;
- durable schema;
- dispatcher, leases, workers;
- Watch schedule advancement from receipt;
- ESI expansion routing changes;
- UI;
- Hydration/readability;
- Observation/Assessment;
- support artifacts;
- runtime enforcement;
- protected-term/source-term renames.

## 12. Suggested Next Packet Shape

Suggested next packet, if Overseer opens Dev later:

```txt
Watch-to-Discovery acquisition split fixture bridge
```

Shape:

- read-only/local-only or fixture-only;
- consume current `dispatchFor(...)` payloads for actor and system/radius Watch;
- build a Discovery-owned acquisition request from that payload;
- reuse HS347 pickup packet shape and HS363 receipt projection shape;
- inject fixture zKill outcomes;
- return a canonical Discovery receipt basis plus `watch_summary`;
- prove no ESI expansion, Evidence/EVEidence writes, Discovery ref writes, Watch mutation, schema, task creation, providers, UI, dispatcher, support artifacts, Hydration, Observation, or Assessment.

Acceptance target:

```txt
current Watch dispatch can feed Discovery-owned acquisition without entering the mixed collector path
```

This is a better next step than durable schema because it proves the boundary in motion before persistence.

## 13. Human / Overseer Decisions Needed

Overseer should decide:

- whether to open the non-durable Watch-to-Discovery acquisition split fixture bridge next;
- whether existing `actor.watch` and `system.radius.watch` should be treated as legacy mixed commands until replaced;
- whether the first split proof should return candidate refs non-durably only, or include a separate fixture-only Discovery ref persistence posture;
- whether `fetch_runs` should remain mixed historical run memory for now;
- when to revisit durable task/packet schema after the split bridge is proven;
- when Manual Discovery should be aligned to the same Discovery receipt model.

No Dev runway is created by this audit.

## Verification / Evidence Used

Read:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS365-discovery-next-seam-decision-surface.md`
- `workspace/OverseerHS364-hs363-discovery-receipt-projection-fixture-review.md`
- `workspace/OverseerHS358-discovery-receipt-model-shaping-note.md`
- `workspace/OverseerHS360-hs359-discovery-receipt-source-trace-review.md`
- `workspace/OverseerHS362-hs361-discovery-receipt-data-model-review.md`
- `workspace/EngineeringAuditHS351-discovery-boundary-task-handling-trace.md`
- `workspace/EngineeringTraceHS359-discovery-receipt-task-packet-source-trace.md`
- `F:\Projects\Mapvault_atlas\1 - Discovery.md`
- `F:\Projects\Mapvault_atlas\1.7 - task handling.md`
- `F:\Projects\Mapvault_atlas\1.8 - Discovery outcome model.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/features/watch-scope-authority.md`
- `src/main/watchlist/watchExecutor.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/manualDiscoveryWorker.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/api/zkillClient.js`
- `src/main/api/esiClient.js`
- `src/main/db/evidenceRepository.js`
- `src/main/db/schema.sql`
- `src/main/services/watchDiscoveryPickupPacketProofService.js`
- `src/main/services/discoveryPickupConsumerFixtureService.js`
- `src/main/services/discoveryReceiptProjectionFixtureService.js`
- `src/main/services/discoveryOutcomeDerivationService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/taskRunner.js`
- relevant verifier references under `scripts/`

Mapvault material was used only as optional context. Atlas-local workspace/source remains authority.

No live/API/provider calls were made. No verifiers were run. No code, schema, DB rows, Watch state, Discovery refs, Evidence/EVEidence, Hydration/metadata labels, queues, dispatchers, leases, runtime enforcement, UI, support artifacts, source terms, protected-word JSON, or project docs were changed beyond creating this advisory artifact.
