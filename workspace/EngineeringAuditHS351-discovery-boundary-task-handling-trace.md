# EngineeringAuditHS351 Discovery Boundary Task Handling Trace

Status: advisory / read-only assurance
Date: 2026-06-06
Role: Engineering / Data-flow Auditor

## 1. Executive Summary

Atlas docs and recent proof surfaces align with the emerging Discovery boundary model, but the implemented live-capable collector path still mixes several stages that the target model wants to separate.

The clean target model is already present in recent read-only proofs:

```text
Watch due -> Discovery pickup intent -> Discovery pickup packet -> fixture candidate refs
```

Those proof surfaces keep Watch as scheduler/scope authority and Discovery as acquisition utility. They do not create durable Discovery refs, Evidence/EVEidence, Hydration, Observation, tasks, providers, schema, or UI.

The current implemented provider path is different:

```text
Watch / Manual intent
-> zKill Discovery
-> discovered_killmail_refs
-> selection/caps/cache skip
-> ESI Evidence Expansion
-> killmails/activity_events
-> fetch_run / warning / Watch run posture
```

For Manual Discovery, the boundary is mostly clean: it calls zKill and writes Discovery refs only. For Manual Expansion, the boundary is also mostly clean: it selects queued refs and performs ESI Evidence Expansion. For current Watch collectors, Discovery acquisition, durable Discovery ref writes, ESI expansion, Evidence writes, run summaries, warnings, and Watch completion posture are still combined in one collector run.

Answer to the main data-flow question: Discovery task outcomes are only partially derivable today. Aggregate run posture can be inferred from `fetch_runs`, `api_request_logs`, `data_quality_warnings`, and `discovered_killmail_refs`, but Atlas cannot currently prove that every emitted system/radius accepted-scope packet reached one declared Discovery outcome. A future `discovery_task` / `discovery_task_packet` layer is not needed for this advisory moment, but it is likely needed later before live Watch execution should rely on Discovery task completion semantics.

## 2. Files / Functions Traced

Authority and boundary docs:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `docs/features/data-layer-boundaries.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/watch-scope-authority.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/features/persistent-discovery-ref-queue.md`

Watch / scheduler / proof services:

- `src/main/watchlist/watchExecutor.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/services/watchExecutorTickDryRunService.js`
- `src/main/services/watchDiscoveryPickupPacketProofService.js`
- `src/main/services/discoveryPickupConsumerFixtureService.js`
- `src/main/services/watchDiscoveryBusInputEnvelopeService.js`
- `src/main/services/discoveryIntakeConsumerStubCandidateService.js`
- `src/main/services/watchTaskOutcomeMapPreviewService.js`

Intent, gate, provider, queue, persistence:

- `src/main/services/serviceRegistry.js`
- `src/main/services/mutatingActionService.js`
- `src/main/services/liveApiGateService.js`
- `src/main/scopes/scopeControls.js`
- `src/main/services/scopeService.js`
- `src/main/workers/manualDiscoveryWorker.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/actorWatchPlanner.js`
- `src/main/workers/systemRadiusPlanner.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/api/zkillClient.js`
- `src/main/api/esiClient.js`
- `src/main/api/httpClient.js`
- `src/main/db/evidenceRepository.js`
- `src/main/db/schema.sql`
- `src/main/queue/queuePreflight.js`
- `src/main/services/queueSelectionService.js`
- `src/main/resolution/actorResolver.js`
- `src/main/resolution/systemResolver.js`

Optional Mapvault material was not read. Atlas-local docs/source were sufficient, and Mapvault is not project authority.

## 3. Current Pipeline As Implemented

Manual Discovery:

```text
manual.discovery
-> normalize manual scope
-> live/provider gate
-> plan actor/system/radius request
-> zKill discoverRefs
-> dedupe/malformed filtering
-> mark cached candidates
-> upsert discovered_killmail_refs
-> finalize fetch_run
```

Manual Discovery writes Discovery refs only. It does not call ESI or write Evidence/EVEidence.

Manual Expansion:

```text
manual.expansion
-> normalize selected queue scope
-> live/provider gate
-> read pending/failed discovered_killmail_refs
-> mark selected
-> ESI expandKillmail
-> normalize killmail
-> persist Evidence/EVEidence rows
-> mark refs expanded/cached/failed
-> finalize fetch_run
```

Manual Expansion is where ESI Evidence Expansion begins for explicit manual work.

Current Watch runtime path:

```text
watch.create / watch.update
-> watch rows
-> watch.schedule
-> watch.executor.arm / tick
-> dispatchFor
-> TaskRunner.runDetachedTask
-> collectActorWatch / collectSystemRadiusWatch
-> zKill Discovery
-> discovered_killmail_refs
-> ESI Evidence Expansion
-> killmails/activity_events
-> recordWatchRunResult
```

This path is functional but mixed. A single Watch collector can acquire candidate refs, persist Discovery refs, select refs, expand ESI, write Evidence/EVEidence, write warnings/API logs, finalize `fetch_runs`, and then let the executor update Watch run state.

Current proof path:

```text
watch.executor_tick_dry_run.preview
-> watch.discovery_pickup_packet_proof.preview
-> discovery.pickup_consumer_fixture.preview
```

This path is cleaner and pre-provider. It proves Watch can emit Discovery pickup intent and Discovery can consume it into provider-return-like candidate refs, but only as read-only fixture/plain data.

## 4. Alignment With Target Model

Aligned:

- `docs/features/data-layer-boundaries.md` defines Discovery as possible leads/provenance and Evidence/EVEidence as ESI-expanded killmail truth.
- `docs/features/acquisition-and-hydration-clocks.md` separates Discovery, Evidence Expansion, and Hydration.
- `docs/features/watch-scope-authority.md` makes stored accepted `included_system_ids` the system/radius Watch execution authority.
- `manual.discovery` queues zKill refs without ESI expansion.
- `manual.expansion` explicitly expands selected queued refs through ESI.
- `ZKillDiscoveryClient.discoverRefs(...)` returns `killmail_id` / hash candidate refs, not Evidence.
- `EsiClient.expandKillmail(...)` is the ESI killmail expansion boundary.
- `EvidenceRepository.persistEvidencePackage(...)` is the Evidence/EVEidence write boundary.
- `watch.discovery_pickup_packet_proof.preview` emits one actor packet or one system/radius packet per accepted stored system ID, without provider movement.
- `discovery.pickup_consumer_fixture.preview` consumes pickup packets into fixture candidate refs and explicitly keeps them non-durable and non-evidence.
- Duplicate candidate refs cannot become duplicate Evidence through normal persistence because `killmails.killmail_id` is primary-keyed and expansion code checks local cache before ESI/persistence.

Partially aligned:

- `discovered_killmail_refs` already acts as durable workflow memory for candidate refs, statuses, retry/failure posture, cache state, provenance, and selection.
- `fetch_runs` and `api_request_logs` provide coarse workflow memory for provider movement.
- `data_quality_warnings` records deferrals and failed expansions, but not as a normalized Discovery task outcome model.
- Watch completion currently records task success/failure and Watch timing, but not a bounded Discovery-task completion summary.

Not aligned yet:

- Current live Watch collectors still own both zKill Discovery and ESI Evidence Expansion.
- Current system/radius Watch collection does not have a durable per-packet outcome row for each accepted system ID/window.
- Current Watch completion is collector/task completion, not Discovery completion.

## 5. Mixed Or Risky Crossings

Primary mixed crossing:

- `collectActorWatch(...)` and `collectSystemRadiusWatch(...)` combine Discovery acquisition, durable Discovery ref writes, selection/caps/cache skip, ESI Evidence Expansion, Evidence persistence, API logs/warnings, and fetch-run lifecycle.

Watch completion crossing:

- `WatchSessionExecutor.tick(...)` records Watch success when the collector task returns. A collector can return success with warnings, partial zKill failures, cap skips, cached refs, or no refs. That is not the same as a normalized Discovery task outcome.

Status vocabulary crossing:

- `discovered_killmail_refs.status = failed` is currently tied to ESI expansion failure in several paths. Under the target model, Discovery provider failure and ESI expansion failure should not be blurred.

System/radius identity crossing:

- `discovered_killmail_refs` identity for system/radius remains center-oriented through `discovered_by_type = system_radius` and `discovered_by_id = centerSystemId`, with `source_system_id` on found refs. This is useful for provenance, but it cannot represent "this accepted included-system packet returned no refs" or "this accepted included-system packet was provider-deferred."

Provider deferral crossing:

- ESI provider capacity deferrals are warning rows from Evidence Expansion. zKill request errors are warnings from Discovery acquisition. The current rows can disclose both, but they are not normalized into first accepted Discovery outcome words.

Manual radius / live-like crossing:

- `liveApiGateService` rejects live manual radius discovery. That is aligned with the patient Watch model. Direct/manual `system.radius.watch` still has center/radius planner behavior when no accepted stored IDs are supplied; this must stay separate from accepted Watch execution authority.

External I/O crossing:

- Docs define future `external_io` as provider trust boundary. Current live provider gating still primarily uses `AURA_ATLAS_LIVE_API`, `live.gate`, and service-memory cooldown/lockout. `held_by_external_io` is accepted language, but not a durable Discovery task outcome today.

## 6. Missing Boundary Pieces

Missing pieces before Discovery can own the target boundary cleanly:

- A real non-fixture Discovery pickup consumer that owns provider-facing zKill movement without immediately performing ESI expansion.
- A normalized Discovery outcome model for accepted work units.
- A way to represent per-system/radius pickup packet completion, including no-refs and provider-deferred packets.
- A completion summary back to source intent, especially Watch, that says what Discovery did without claiming Evidence completion.
- Separate failure/deferral language for zKill Discovery versus ESI Evidence Expansion.
- A clear handoff from Discovery candidate refs to ESI Evidence Expansion that preserves candidate provenance without making Discovery own Evidence truth.
- A decision on whether current `discovered_killmail_refs` remains sufficient workflow memory or whether `discovery_task` / `discovery_task_packet` is needed before live Watch completion depends on declared packet outcomes.

## 7. Whether Task Outcomes Are Derivable Today

Only partially.

Derivable today at coarse run/ref level:

- refs found and persisted: `fetch_runs.discovered_refs`, `discovered_killmail_refs`, `first_seen_run_id`, `last_seen_run_id`;
- cached Evidence skip: `discovered_killmail_refs.status = cached`, `fetch_runs.already_cached`, `repository.hasKillmail(...)`;
- ESI expansion success: `discovered_killmail_refs.status = expanded`, `killmails`, `activity_events`, `ingestion_audits`;
- ESI expansion failure: `discovered_killmail_refs.status = failed`, `failed_at`, `failure_count`, `last_error`, `data_quality_warnings`;
- cap skip: collector `expansion_queue_summary.cap_skipped` and warning text in returned summaries;
- provider call counts: `api_request_logs`, `fetch_runs.api_calls_zkill`, `fetch_runs.api_calls_esi`;
- Watch posture after run: Watch row `last_success_at`, `last_error_at`, `backoff_until`, `next_poll_at`.

Not reliably derivable today:

- `complete_refs_found` per accepted Discovery packet;
- `complete_no_refs` per accepted Discovery packet;
- `partial_deferred` as a normalized Discovery outcome;
- `provider_deferred` specifically for zKill Discovery packets;
- `held_by_external_io` as a concrete Discovery outcome;
- `capped` as a durable packet outcome, rather than summary/warning posture;
- `failed_retryable` versus `failed_terminal` for Discovery acquisition;
- "every emitted packet for this accepted scope/window reached an outcome."

For system/radius Watch, the current durable tables can show refs that were found for a `source_system_id`, but they cannot show that an accepted system produced no refs, was deferred, was capped, or failed before returning refs. That makes packet-complete Watch acquisition outcome not proven from current rows.

## 8. Discovery Task / Task-Packet Schema Need

Recommendation: later, likely before product live Watch completion semantics; not now as an immediate implementation step.

Why not now:

- The current request is boundary consolidation and assurance only.
- Recent HS347/HS349 proof surfaces are still read-only and fixture-only.
- A schema decision before agreeing the outcome model would risk freezing the wrong abstraction.

Why likely later:

- The target system/radius rule requires one outcome per emitted accepted-scope/window packet.
- `fetch_runs` is run-level, not packet-level.
- `discovered_killmail_refs` only exists when a candidate ref exists, so it cannot represent no-ref completion.
- Warning rows are free-form and run-linked, not packet identity.
- `watch.recordRun` updates Watch schedule state, not Discovery task completion state.

Smallest future durable shape, if later accepted, would likely need to distinguish:

- source intent identity: Watch/manual/recovery;
- accepted scope/window/caps;
- emitted Discovery packet identity;
- provider target;
- outcome word;
- candidate refs found/written;
- deferral/retry/failure basis;
- completion summary returned to source intent.

This advisory does not create that schema or authorize implementation.

## 9. Specific Notes For Watch, Manual, And Live-Like Paths

Watch:

- Watch intent is accepted in `watch.create` / `watch.update` and stored in `watchlist_entities` or `system_watches`.
- System/radius accepted scope is stored as `included_system_ids`; invalid stored scope blocks in the dry-run/proof chain and in `dispatchFor(...)`.
- Current product execution still routes through collectors that combine Discovery and Evidence Expansion.
- Watch currently decides "done" through task success/failure and `recordWatchRunResult(...)`, not through Discovery packet outcomes.
- `watchOfflineReadout` can derive useful posture from rows, but it is a readout, not a Discovery completion stub.

Manual:

- Manual Discovery is the cleanest current Discovery implementation: it calls zKill, writes Discovery refs, finalizes a fetch run, and explicitly does not expand ESI.
- Manual Expansion is the cleanest current ESI Evidence Expansion implementation: it consumes selected pending/failed refs and writes Evidence/EVEidence only after ESI expansion succeeds.
- Manual Discovery radius is blocked by the live gate; patient radius acquisition belongs to Watch/Sequencer direction.

Live-like:

- `live.gate` / `actionGate(...)` provides read-only and mutating gate posture for live provider actions.
- Direct `actor.watch` and `system.radius.watch` are trusted live provider commands, not renderer manual discovery surfaces.
- Typed actor name resolution can call ESI names and write `entities`/`metadata_runs`; this is identity/readability support, not Discovery and not Evidence Expansion.
- Live smoke/check paths are intentionally gated and were not run for this audit.

## 10. Recommended Next Non-Implementation Step

Recommended next step: Overseer should run a naming and outcome-model decision pass for Discovery task outcomes before opening any Dev work.

That pass should decide:

- whether the first outcome words are accepted as Atlas-owned emitted states;
- whether outcome words apply to Discovery task, Discovery packet, or both;
- whether `provider_deferred`, `held_by_external_io`, and `failed_retryable` are provider-movement outcomes rather than Watch outcomes;
- whether Watch completion should mean "Discovery task completed" or "Watch scheduled run advanced after accepted Discovery summary";
- whether Manual Discovery should eventually use the same Discovery task/outcome language or keep its current `fetch_runs`/refs-only posture for now.

No Dev runway is recommended directly from this audit. The strongest next proof after a decision pass would be read-only derivation of current coarse Discovery outcomes from existing rows, explicitly showing where packet outcomes are not proven.

## 11. Parked Items

Keep parked:

- live/provider calls;
- real Watch execution changes;
- provider dispatcher;
- schema creation;
- `discovery_task` / `discovery_task_packet` implementation;
- durable Watch result identity;
- relationship tags;
- UI work;
- renaming Atlas terms;
- treating Discovery completion as Evidence completion;
- treating Hydration labels as proof;
- treating Mapvault language as authority;
- pruning/deletion;
- support artifacts;
- runtime enforcement activation.

## 12. Verification / Evidence Used

Evidence used:

- Source and docs listed in section 2.
- Current accepted state from `workspace/current.md`, especially HS347/HS349 acceptance.
- Source inspection of service registry command boundaries, scope normalization, live gates, workers, provider clients, repository writes, scheduler/executor, and recent proof services.

No live/API/provider calls were run.

No verifier scripts were executed for this advisory. Existing verifier evidence was read from accepted workspace/current material and reviewed source where relevant.

No code, schema, UI, provider movement, task handling, or project docs were changed other than creating this requested advisory artifact.

## Acceptance Check

- Read-only assurance: yes.
- Atlas-local authority preserved: yes.
- Mapvault not treated as authority: yes; not read.
- Discovery separated from Evidence/EVEidence, Hydration, Observation, and Assessment: yes.
- Watch completion not treated as Evidence completion: yes.
- Current implementation crossings identified: yes.
- Task outcome derivability answered: yes, partially and not per packet.
- Durable Discovery task/task-packet need classified: later likely, not now.
- No Dev runway created: yes.
