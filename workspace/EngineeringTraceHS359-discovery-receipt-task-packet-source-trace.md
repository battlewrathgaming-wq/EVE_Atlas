# EngineeringTraceHS359 - Discovery Receipt / Task-Packet Source Trace

Status: advisory / source-trace assurance
Role: Engineering / Source-Trace Auditor
Date: 2026-06-07

## 1. Executive Finding

Atlas can currently emit receipt-like Discovery facts in three different ways, but none of them is yet a product-grade per-packet Discovery receipt.

The strongest current source truth is:

- `discovery.outcome_derivation.preview` can derive coarse, read-only receipt-like posture from current rows.
- `watch.discovery_pickup_packet_proof.preview` can emit pre-provider pickup packets, including one packet per accepted system/radius included system.
- `discovery.pickup_consumer_fixture.preview` can consume those pickup packets into fixture-only provider-return-like candidate refs.

The write-capable runtime path remains mixed:

```txt
Watch due / manual input
-> zKill Discovery
-> discovered_killmail_refs
-> ESI Evidence Expansion
-> Evidence/EVEidence writes
-> fetch_run / warning / Watch posture
```

That path can return useful summaries today, but those summaries are not clean Discovery receipts because they include ESI expansion, Evidence writes, and Watch completion posture.

Practical recommendation: staged hybrid. First prove a non-durable Discovery receipt return object from fixture/pre-provider packet inputs and existing collector-like outputs, without schema. Keep HS356 read-only derivation as audit/readout. Defer durable task/packet rows until the non-durable receipt shape proves the minimum fields and packet lifecycle.

## 2. Files / Functions Traced

Coordination and accepted posture:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS358-discovery-receipt-model-shaping-note.md`
- `workspace/OverseerHS357-hs356-discovery-outcome-derivation-review.md`
- `workspace/DevHS356-discovery-outcome-derivation-proof.md`
- `workspace/EngineeringAuditHS351-discovery-boundary-task-handling-trace.md`
- `workspace/EngineeringAuditHS354-discovery-outcome-derivation-feasibility.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/current-state/current-evidence-pipeline.md`

Source traced:

- `src/main/services/discoveryOutcomeDerivationService.js`
- `src/main/services/watchDiscoveryPickupPacketProofService.js`
- `src/main/services/discoveryPickupConsumerFixtureService.js`
- `src/main/services/watchExecutorTickDryRunService.js`
- `src/main/services/watchDiscoveryBusInputEnvelopeService.js`
- `src/main/services/discoveryIntakeConsumerStubCandidateService.js`
- `src/main/services/watchTaskOutcomeMapPreviewService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/workers/manualDiscoveryWorker.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/api/zkillClient.js`
- `src/main/api/esiClient.js`
- `src/main/api/httpClient.js`
- `src/main/db/evidenceRepository.js`
- `src/main/db/schema.sql`
- `src/main/metadata/reportHydrator.js`
- relevant report/readout and queue surfaces by text search.

Relevant verify scripts traced:

- `scripts/verify-discovery-outcome-derivation.js`
- `scripts/verify-watch-discovery-pickup-packets.js`
- `scripts/verify-discovery-pickup-consumer-fixture.js`
- Watch packet/task/outcome related verifier references found through source search.

Optional Mapvault files were not read. Atlas-local source and accepted workspace artifacts were sufficient, and Mapvault is not project authority.

## 3. Current Discovery-Capable Work Creation Surfaces

Watch due / pickup proof surfaces:

- `buildWatchScheduleStatus(...)` reads `watchlist_entities` and `system_watches`, classifies due/blocked Watch rows, and provides source intent posture.
- `dryRunExecutorTickDecision(...)` selects a due Watch and computes the command/payload that would dispatch.
- `dispatchFor(...)` maps actor Watch to `actor.watch` and system/radius Watch to `system.radius.watch`.
- `buildWatchDiscoveryPickupPacketProof(...)` turns a due Watch dry-run into Discovery pickup packets. For system/radius, it fans out stored accepted `included_system_ids` into one packet per accepted system ID.
- `buildDiscoveryPickupConsumerFixtureProof(...)` consumes pickup packets into fixture candidate refs without provider movement or durable refs.

Manual surfaces:

- `manual.discovery` is registered as a live/provider-backed command in `serviceRegistry`.
- `discoverManualRefs(...)` plans actor/system/radius manual zKill Discovery, calls zKill, writes `discovered_killmail_refs`, writes warnings, and finalizes `fetch_runs`. It does not call ESI expansion.
- `manual.expansion` is separately registered and calls ESI Evidence Expansion from selected queued refs.

Live/narrow lookup surfaces:

- Direct `actor.watch` and `system.radius.watch` commands are trusted non-renderer provider/evidence commands.
- `live.gate` / `actionGate(...)` controls provider capability and cadence, but it does not create a Discovery receipt.
- Actor name resolution and metadata hydration may call ESI names/IDs; those are identity/readability support, not Discovery receipts.

Task-runner surfaces:

- `WatchSessionExecutor.tick(...)` creates a detached task through `TaskRunner.runDetachedTask(...)` when a Watch is due and gated.
- The task calls the collector runner and then `recordWatchRunResult(...)`.
- Current task state is volatile runtime memory and is not Discovery receipt memory.

## 4. Current Provider-Call Surfaces

zKillboard calls:

- `ZKillDiscoveryClient.discoverRefs(...)` calls zKill through `HttpClient.json(...)`.
- `discoverActorRefs(...)` calls `zkillClient.discoverRefs(...)` for planned actor requests.
- `discoverRefs(...)` in `systemRadiusCollector.js` calls zKill once per planned system/radius request.
- `discoverManualRefs(...)` reuses the same actor/system discovery helpers for manual Discovery.

ESI killmail expansion calls:

- `EsiClient.expandKillmail(...)` calls ESI killmail expansion.
- `buildEvidencePackageFromRefs(...)` calls `esiClient.expandKillmail(...)`.
- `manualExpansionWorker`, `actorWatchCollector`, and `systemRadiusCollector` call `buildEvidencePackageFromRefs(...)`.

ESI metadata / Hydration calls:

- `EsiClient.resolveIds(...)` and `EsiClient.resolveNames(...)` call ESI names/IDs endpoints.
- `src/main/metadata/reportHydrator.js` creates `metadata_runs`, calls `resolveNames(...)`, and writes readability labels.
- `actorResolver.js` can call `resolveIds(...)` for typed name resolution and write entity readability rows.
- These are Hydration/readability/identity surfaces, not Discovery completion.

Hidden direct calls inside Watch collectors:

- Current Watch collectors instantiate `ZKillDiscoveryClient` and `EsiClient` inside the same collector run.
- That means live Watch execution still performs both zKill Discovery and ESI Evidence Expansion inside one task, then records Watch run success/failure.

## 5. Current Durable Write Surfaces

`fetch_runs`:

- Created by `EvidenceRepository.createFetchRun(...)`.
- Finalized by `EvidenceRepository.finalizeFetchRun(...)`.
- Used by manual Discovery, manual Expansion, actor Watch collection, and system/radius Watch collection.

`api_request_logs`:

- Written by `HttpClient.log(...)` through `EvidenceRepository.insertApiRequestLog(...)`.
- Captures provider, endpoint, status, retry count, rate-limited flag, and sanitized error information.

`data_quality_warnings`:

- Written by `EvidenceRepository.insertWarning(...)`.
- Manual Discovery writes manual-discovery boundary warnings.
- Watch collectors write collection warning text.
- ESI expansion writes `provider_capacity_deferred` and `failed_expansion` warnings.

`discovered_killmail_refs`:

- Written by `EvidenceRepository.upsertDiscoveredKillmailRefs(...)`.
- Mutated by `markDiscoveryRefsSelected`, `markDiscoveryRefsExpanded`, `markDiscoveryRefsCached`, and `markDiscoveryRefsFailed`.
- This is candidate-ref memory, not task/packet memory.

`killmails` and `activity_events`:

- Written through `EvidenceRepository.persistEvidencePackage(...)` after ESI expansion succeeds.
- These rows are Evidence/EVEidence and relationship/appearance basis, not Discovery receipt state.

`metadata_runs`:

- Created/finalized by Hydration/readability flows, especially `reportHydrator`.
- Not Discovery receipt state.

Watch run/state rows:

- `recordWatchRunResult(...)` mutates `watchlist_entities` or `system_watches` timing fields.
- It records Watch schedule posture after collector success/failure, not Discovery receipt completion.

## 6. Current Receipt-Like Return / Readout Shapes

Natural return shapes that are closest to Discovery receipt:

- `discoverManualRefs(...)` returns `run_id`, scope, discovered-by identity, zKill refs discovered, duplicates/malformed counts, queued refs written, zKill/ESI call counts, queue summary, candidate queue, and warnings. This is the cleanest write-capable Discovery-like return, but it is manual-shaped and writes refs.
- `discoverActorRefs(...)` and `discoverRefs(...)` return in-memory Discovery summaries: discovered refs, duplicates, malformed count, unique refs, expansion queue, and warnings. These are close to non-durable provider packet output, but they lack accepted packet ids and normalized outcome words.
- `collectActorWatch(...)` and `collectSystemRadiusWatch(...)` return richer summaries, including Discovery, selection, ESI expansion, Evidence writes, warnings, and collection plan. They are not clean Discovery receipts because they cross into Evidence Expansion and Watch completion.
- `buildWatchDiscoveryPickupPacketProof(...)` returns pre-provider pickup packet facts: source lane/kind, Watch id, scope key, provider target posture, lookback, caps, accepted system IDs, packet index/count, and boundary flags. This is a strong pre-attempt packet basis.
- `buildDiscoveryPickupConsumerFixtureProof(...)` returns fixture candidate refs tied back to pickup packet identity. This is a useful fixture bridge, not runtime receipt.
- `buildDiscoveryOutcomeDerivationPreview(...)` returns the most receipt-like read-only product today: source intent kind/id, run id, approximate scope key, derived outcome, confidence, candidate refs, provider call counts, ESI context as non-Discovery, warnings, missing-basis flags, and packet derivability summary.

Answer to whether a current function can naturally return a Discovery receipt object without schema changes:

Yes, but only as non-durable or read-only/derived.

- `buildDiscoveryOutcomeDerivationPreview(...)` already returns a coarse read-only receipt-like readout.
- `discoverActorRefs(...)` and `discoverRefs(...)` could naturally be wrapped into a non-durable packet receipt because they already isolate zKill return/warning facts before ref persistence and ESI expansion.
- `buildWatchDiscoveryPickupPacketProof(...)` provides enough pre-provider packet identity for a fixture/non-durable receipt proof.

No current write-capable product path returns product-grade per-packet receipt state with durable completion semantics.

## 7. Watch / Discovery / Evidence Crossing Points

Current mixed collector crossing:

- `collectActorWatch(...)` and `collectSystemRadiusWatch(...)` create a `fetch_run`, call zKill, write `discovered_killmail_refs`, select refs for expansion, call ESI, persist Evidence/EVEidence, update ref statuses, write warnings, finalize `fetch_runs`, and return one mixed collection summary.

Watch completion crossing:

- `WatchSessionExecutor.tick(...)` records Watch success when the collector runner returns. This is task/collector completion, not Discovery receipt completion.

Evidence Expansion crossing:

- `buildEvidencePackageFromRefs(...)` starts ESI Evidence Expansion. Its `provider_capacity_deferred` warning is ESI context and must not become Discovery provider deferral without explicit classification.

Candidate-ref crossing:

- `discovered_killmail_refs.status='failed'` currently represents ESI expansion failure in normal expansion paths, not zKill Discovery packet failure.

System/radius packet crossing:

- `systemRadiusCollector.discoverRefs(...)` loops per planned system and can catch per-system zKill failures as warning strings, but it does not emit or persist a declared packet outcome for each accepted system.

Manual crossing:

- Manual Discovery is mostly clean Discovery.
- Manual Expansion is clean ESI Evidence Expansion.
- HS358 parks Manual/Live adoption into the new receipt vocabulary for now.

Hydration crossing:

- `metadata.hydration` and selected-ID readability repair flows write `metadata_runs` and labels. They are separate provider paths and should not be counted as Discovery receipts.

## 8. Existing Fields Usable For A Discovery Receipt

Usable now with good basis:

- `source_intent_kind`: derivable from `fetch_runs.watch_type/trigger` or proof packet source.
- `source_intent_id`: partially derivable from Watch rows, `watch_id`, `discovered_by_type/id`, or proof packets.
- `source_watch_id`: present in Watch rows, proof packets, and some `fetch_runs.watch_id` values.
- `source_run_id`: `fetch_runs.run_id`.
- `scope_key`: present in Watch schedule/proof packets; approximate from current refs/runs.
- `scope_basis`: present in proof packets and system/radius accepted-scope fields.
- `candidate_system_id` / target anchor: present in HS347 pickup packets; found refs have `source_system_id`; actor refs have actor source fields.
- `provider_path`: zKill vs ESI visible through clients/logs; Discovery receipt should use zKill for acquisition.
- `lookback_window`: present in Watch payload/proof packets; less direct in historical rows.
- `caps`: present in proof packets and collector summaries; only summary-supported in rows.
- `attempted/completed posture`: coarse from `fetch_runs.status`, provider logs, and warning text; not packet-grade.
- `refs_found`: `discovered_killmail_refs`, `fetch_runs.discovered_refs`, candidate return arrays.
- `provider defer/retry/failure`: partial from `api_request_logs`, warning text, HTTP status/retry/rate-limit fields.
- `warning/error basis`: `fetch_runs.error_summary`, `data_quality_warnings`, `api_request_logs.error_message`.
- `missing_basis_flags`: already emitted by HS356 derivation proof.

Weak or missing now:

- no-ref packet result;
- normalized per-packet outcome;
- local cap versus provider cap distinction;
- provider-deferred packet identity;
- retryable versus terminal Discovery failure class;
- completed packet count from product rows;
- accepted packet id;
- receipt id;
- receipt-to-caller handoff lifecycle;
- link from candidate refs back to packet id.

## 9. Missing Fields / Lifecycle Events For Per-Packet Completion

Product-grade per-packet Discovery completion would need at least:

- non-authorizing `receipt_id`;
- non-authorizing `packet_id`;
- task/source intent identity independent of Watch-only language;
- accepted scope/window/caps snapshot;
- packet index/count;
- provider target kind/id;
- attempted-at timestamp;
- completed-at timestamp or held/deferred timestamp;
- declared packet outcome from accepted vocabulary;
- outcome basis;
- candidate refs found for that packet;
- no-ref packet row or equivalent return event;
- provider deferral reason and retry-after/next-eligible basis where known;
- acquisition cap basis and coverage disclosure;
- failure class for retryable versus terminal;
- missing-basis flags;
- task rollup that counts accepted, attempted, completed, deferred, capped, failed, and unknown packets;
- explicit boundary flag that ESI Evidence Expansion is not Discovery completion.

Lifecycle events currently missing:

- accepted Discovery task created/accepted;
- packet emitted into Discovery-owned acquisition;
- packet provider attempt started;
- packet provider attempt ended;
- packet returned no refs;
- packet deferred/held/capped/failed with normalized reason;
- candidate refs linked to producing packet;
- Discovery task rollup returned to caller;
- caller decision recorded separately from Discovery receipt.

## 10. Recommendation: Derived, Non-Durable, Durable, Or Staged Hybrid

Recommended path: staged hybrid.

Stage 1, keep:

- HS356 derived/read-only receipt posture remains useful for row audit, support, and gap discovery.

Stage 2, next proof:

- Add a non-durable fixture receipt proof that composes HS347 pickup packets with fixture provider-return cases and emits top-level receipt plus packet receipt objects.
- It should prove packet outcomes including `complete_refs_found`, `complete_no_refs`, `provider_deferred`, `acquisition_capped`, `failed_retryable`, and `failed_terminal` without schema, providers, Watch mutation, or durable refs.
- It should not route through existing Watch collectors.

Stage 3, later:

- Decide whether the non-durable receipt is enough for immediate runtime return behavior or whether minimal durable task/packet rows are needed before live Watch depends on completion.

Why not durable rows first:

- Current source truth proves the gap but not the final lifecycle.
- A schema now would risk freezing Watch-shaped language into Discovery.
- Manual/Live adoption is parked, so the receipt should be proven as a Discovery-owned shape before persistence.

Why not derived-only:

- Derived-only cannot prove no-ref packets, provider-deferred packets, or every accepted system packet completion.
- Watch cannot safely rely on derived rows for product-grade per-packet completion.

## 11. Smallest Next Proof Or Dev Packet

Smallest useful next packet, if Overseer opens Dev later:

```txt
Discovery receipt fixture proof
```

Suggested behavior:

- consume fixture Discovery pickup packets;
- inject fixture provider-return outcomes per packet;
- emit a non-durable top-level receipt and packet receipt list;
- include source intent kind/id, scope key, scope basis, requested window, provider path, caps, accepted/attempted/completed packet counts, packet outcome counts, refs found, candidate ref handles, cap/defer/failure basis, confidence, missing-basis flags, and boundary flags;
- prove system/radius one outcome per accepted system packet;
- include actor and system/radius cases;
- include no-ref, provider-deferred, acquisition-capped, retryable failure, terminal failure, and mixed packet rollup cases;
- keep candidate refs plain fixture data, not durable Discovery refs;
- no provider calls, DB writes, schema, Watch mutation, dispatcher, UI, or Observation interpretation.

This would reduce the main uncertainty: what a Discovery-owned receipt should look like before Atlas decides whether it needs durable packet rows.

## 12. Parked Items

Keep parked:

- live provider execution changes;
- real zKill/ESI calls;
- durable `discovery_task` / `discovery_task_packet` schema;
- dispatcher, lease, retry, or broad provider queue architecture;
- Watch schedule advancement from receipt;
- Watch completion policy based on receipt;
- Manual/Live adoption of receipt vocabulary;
- UI presentation;
- Observation interpretation of receipt;
- Evidence/EVEidence write changes;
- Hydration/readability changes;
- relationship tags or Watch results;
- protected-term changes or Atlas term renames.

## 13. Verification / Source Evidence Used

Evidence used:

- Read-only review of listed workspace artifacts, accepted shaping notes, contracts, current-state docs, source files, and relevant verifier scripts.
- Source search across `src/main` and `scripts` for Discovery, Watch, ESI, Hydration, provider, row-write, and receipt-adjacent terms.
- No live/API/provider calls were run.
- No verifier was executed for this advisory; accepted verifier evidence was read from HS356/HS357 and the source/verifier scripts were inspected.
- No code, schema, DB rows, Watch state, provider state, UI, protected-word JSON, or project docs were changed beyond creating this advisory artifact.

## 14. Human / Overseer Decisions Needed

Overseer should decide:

- whether to open a fixture-only non-durable Discovery receipt proof next;
- whether receipt vocabulary applies identically to task and packet, or whether packet outcomes roll up into task receipt fields;
- whether `acquisition_capped` should remain the precise emitted word instead of generic `capped`;
- whether `held_by_external_io` belongs in packet receipt output now or remains gate posture until external I/O enforcement is closer;
- what minimum receipt fields Watch needs before it may use Discovery completion to advance schedule posture;
- when Manual and Live/narrow lookup should adopt the same Discovery-owned receipt shape.

No Dev runway is created by this source trace.
