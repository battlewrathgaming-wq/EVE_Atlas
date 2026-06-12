# EngineeringAuditHS354 - Discovery Outcome Derivation Feasibility

Status: advisory artifact
Role: Engineering / Data-flow Auditor
Date: 2026-06-06

## 1. Executive Summary

Atlas can derive a useful coarse Discovery outcome readout from current rows, but it cannot safely derive product-grade Discovery task/packet outcomes for live Watch completion semantics yet.

The strongest current basis is task/run-level and ref-level:

- `fetch_runs` records collection run summaries.
- `discovered_killmail_refs` records candidate-ref memory and dedupe state.
- `api_request_logs` records provider request support provenance.
- `data_quality_warnings` records warnings, especially ESI expansion/provider-capacity warnings.
- HS347/HS349 proof services show the intended Watch -> Discovery packet shape without providers or durable refs.

The weak point is packet completion, especially for system/radius Watch. Current rows can show refs found for systems that produced refs, but they do not record a row for "system packet completed with no refs", "system packet deferred", "system packet capped", or "system packet failed". That means current Atlas can support a read-only derivation proof with confidence flags, but a future `discovery_task` / `discovery_task_packet` layer or equivalent read model is likely needed before live Watch completion relies on packet outcomes.

Recommendation: start with a read-only derivation proof first. It should make current derivability and gaps visible before any durable task/packet schema is accepted.

## 2. Files / Functions / Tables Traced

Required coordination and boundary files:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/EngineeringAuditHS351-discovery-boundary-task-handling-trace.md`
- `workspace/OverseerHS352-hs351-discovery-boundary-audit-review.md`
- `workspace/OverseerHS353-discovery-outcome-model-shaping-note.md`
- `docs/features/data-layer-boundaries.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/watch-scope-authority.md`
- `docs/current-state/current-evidence-pipeline.md`

Relevant source traced:

- `src/main/db/schema.sql`
- `src/main/db/evidenceRepository.js`
- `src/main/api/httpClient.js`
- `src/main/api/zkillClient.js`
- `src/main/workers/manualDiscoveryWorker.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/queue/queuePreflight.js`
- `src/main/services/queueSelectionService.js`
- `src/main/services/watchDiscoveryPickupPacketProofService.js`
- `src/main/services/discoveryPickupConsumerFixtureService.js`
- `src/main/services/discoveryIntakeConsumerStubCandidateService.js`
- `src/main/services/watchDiscoveryBusInputEnvelopeService.js`
- `src/main/services/watchTaskOutcomeMapPreviewService.js`
- `src/main/services/watchExecutorTickDryRunService.js`
- `src/main/services/liveApiGateService.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/workers/actorWatchPlanner.js`
- `src/main/workers/systemRadiusPlanner.js`

Tables traced:

- `fetch_runs`
- `discovered_killmail_refs`
- `api_request_logs`
- `data_quality_warnings`
- `actor_watches`
- `system_watches`
- `killmails`
- `activity_events`
- `ingestion_audits`

Optional Mapvault context was not read.

## 3. Current Derivable Outcome Table

| Field / outcome | Task-level derivable | Packet-level derivable | Source rows / proofs | Confidence | Missing basis | Risk if used |
| --- | --- | --- | --- | --- | --- | --- |
| Accepted intent handoff | Partial | Partial | Watch rows, `fetch_runs.watch_type/watch_id`, HS347 `watch.discovery_pickup_packet_proof.preview` | Medium | No durable Discovery task id or accepted handoff receipt | Treating Watch schedule/run state as Discovery acceptance |
| Packet count / packet identity | Partial | Partial | HS347 proof emits actor packet and one system/radius packet per accepted system; HS349 fixture consumes packets | Medium for proof, low for runtime rows | No durable packet id, packet index, or packet outcome row | Treating proof packet shape as live runtime authority |
| `complete_refs_found` | Partial | Partial | `fetch_runs.discovered_refs`, refs with `first_seen_run_id`/`last_seen_run_id`, `source_system_id` on found refs | Medium task, low packet | No per-packet completion row; found refs only represent systems that yielded refs | Overclaiming full accepted-scope completion from positive refs |
| `complete_no_refs` | Partial | No for system/radius; partial for actor | Successful `fetch_runs` with zKill call count and zero discovered refs may imply no refs for single actor-like request | Low | No durable no-ref row per target packet/system | Silently losing "checked and found nothing" outcomes |
| `partial_deferred` | Partial | No | Collector warning strings, `fetch_runs.error_summary`, `api_request_logs` failures, `data_quality_warnings` | Low | No normalized Discovery deferral state or packet attribution | Blending provider warning text with declared Discovery outcome |
| `provider_deferred` | Partial for ESI Expansion; weak for zKill Discovery | No | ESI `provider_capacity_deferred` warnings; `api_request_logs.rate_limited/retry_count/status_code`; `httpClient` retry behavior | Low for Discovery | zKill Discovery provider defer is not normalized; ESI deferral belongs to Evidence Expansion, not Discovery | Blurring Discovery with ESI Evidence Expansion |
| `held_by_external_io` | No as Discovery outcome; yes as broader posture | No | External I/O docs/readouts and live gate posture; no Discovery task row | Low | No accepted Discovery task held row | Treating a gate/readout as an acquisition result |
| `acquisition_capped` / `capped` | Partial | No | Expansion `cap_skipped`, collector warnings, queue selection cap skip, planner/collector max refs settings | Low to medium | No durable Discovery cap basis; zKill local limit does not prove provider had more | Claiming full coverage or confusing ESI expansion cap with zKill acquisition cap |
| `failed_retryable` | Partial | No | API logs, warning strings, `fetch_runs.status='failed'`, HTTP retry status handling | Low | No durable retryable-vs-terminal classification for Discovery task/packet | Either retrying terminal failures or terminalizing wait states |
| `failed_terminal` | Partial | No | Failed `fetch_runs`, error summaries, API logs | Low | No normalized terminal classification | Same failed run can hide retryable/provider-capacity cases |
| Candidate refs written | Yes | Partial for found refs only | `discovered_killmail_refs`, `upsertDiscoveredKillmailRefs`, scoped PK/dedupe | High for refs | No no-ref/deferred packet memory | Treating candidate-ref memory as task memory |
| Duplicate candidate refs prevented from duplicate Evidence | Yes | Not packet-level | `discovered_killmail_refs` scoped PK, `killmails` existence checks, ESI expansion cache/expanded status updates | High | None for Evidence duplication; packet attribution still missing | Low if kept ref-scoped; high if used as packet completion |
| Task rollup / completion receipt | Partial | No | `fetch_runs`, `watchScheduler.recordWatchRunResult`, Watch offline readout | Medium for operational run posture | No Discovery completion stub back to Watch/source intent | Advancing Watch posture on collector completion rather than Discovery outcome |
| Every emitted accepted-system packet reached outcome | No | No, except HS347/HS349 proof-only packet lists | HS347/HS349 proof surfaces | High confidence gap | No durable per-system packet outcome row | Cannot safely support live system/radius Watch completion semantics |

## 4. Watch Actor Findings

Actor Watch is the more derivable Watch path because current collection is closer to one provider target per accepted actor run.

What is supportable today:

- `actorWatchCollector.collectActorWatch` creates a `fetch_run` with `watch_type='actor'`.
- It can drain pending local `discovered_killmail_refs` before fresh zKill movement.
- It writes candidate refs through `upsertDiscoveredKillmailRefs`.
- It selects refs for ESI Evidence Expansion under caps and marks refs expanded, cached, or failed.
- `watchExecutor.tick` records Watch run success/failure around collector completion.

Limits:

- Collector success is not a Discovery completion receipt. The collector can return with warnings.
- A run that drains pending refs may do no new zKill Discovery, so it should not be read as a fresh Discovery acquisition outcome.
- zKill provider errors are warning strings inside the collector path, not normalized `provider_deferred`, `failed_retryable`, or `failed_terminal` outcomes.
- ESI provider deferral belongs to Evidence Expansion, not actor Discovery completion.

Actor task-level derivation is feasible as read-only posture. Actor packet-level derivation is only partially supportable because the current runtime path does not persist a packet id or packet outcome.

## 5. Watch System / Radius Findings

System/radius is the path that most clearly needs packet outcome shaping before live Watch completion semantics depend on it.

What is supportable today:

- HS296 accepted stored `included_system_ids` as execution authority.
- HS347 proves a system/radius Watch can fan out one Discovery pickup packet per accepted stored system ID.
- `systemRadiusCollector.collectSystemRadiusWatch` uses planned zKill requests per system and writes discovered refs with `source_system_id`.
- Found refs can therefore be associated with the system that produced them.

Limits:

- No row is written for an accepted system packet that returns no refs.
- No row is written for an accepted system packet that is deferred, capped, held, failed, or skipped.
- Current Discovery ref identity for system/radius is still center-only at `discovered_by_id`, with `source_system_id` on found refs. That is sufficient for possible-lead memory but not for task-result semantics across multiple Watch scopes.
- A run-level `fetch_runs` summary cannot prove every accepted included-system packet reached a declared outcome.

Conclusion: system/radius can use current rows for a coarse readout, but product Watch completion needs either future task/packet persistence or a deliberately built equivalent read model.

## 6. Discovery Ref Memory Finding

`discovered_killmail_refs` is good candidate-ref memory and should remain that.

It supports:

- candidate ref dedupe by scoped primary key;
- first/last seen run provenance;
- status transitions for pending, selected, expanded, cached, failed, and superseded;
- cache skip behavior when Evidence already exists;
- retry/resume of failed or pending ESI expansion refs.

It should not be promoted into the Discovery task sequencer. It lacks rows for no-ref packets, deferred packets, held packets, acquisition caps, retry posture, accepted scope/window, and task rollup. If a future task/packet layer is added, `discovered_killmail_refs` should be linked as candidate output, not replaced or overloaded.

## 7. Provider Deferral / Held / Capped Findings

Provider deferral:

- ESI Evidence Expansion has a clearer provider-capacity deferral pattern through `killmailIngestionWorker` and `provider_capacity_deferred` warnings.
- zKill Discovery deferral is weaker. `httpClient` retries 420/429/503-like statuses, logs the request, and eventually throws. Watch collectors catch zKill errors as warning strings. That does not yet form a normalized Discovery packet outcome.

Held by External I/O:

- `held_by_external_io` is accepted as provider-backed work posture in docs and readouts.
- It is not currently a persisted Discovery task outcome. It should not be inferred as acquisition completion.

Capped / acquisition capped:

- HS353 accepts `acquisition_capped` as complete-but-limited.
- Current code has expansion cap skips (`cap_skipped`) and planned/request max-ref limits.
- The existing rows do not prove whether zKill had more available refs beyond a local max. They can show Atlas bounded the attempt; they cannot prove full provider-side coverage.
- There is a wording drift risk between HS352/current vocabulary `capped` and HS353's more precise `acquisition_capped`. The latter is safer for Discovery because it avoids confusing Discovery acquisition caps with ESI expansion caps.

## 8. Minimal Completion Stub Fields Supportable Today

A read-only derivation proof can safely emit a minimal, confidence-marked completion stub using existing data:

- source intent kind: actor Watch, system/radius Watch, manual discovery, or manual expansion, where available;
- source intent id / Watch id, where available;
- approximate scope key, with system/radius clearly marked as center-only when sourced from current refs;
- `fetch_run.run_id`, `started_at`, `finished_at`, `status`;
- zKill API call count and ESI API call count, with ESI identified as outside pure Discovery completion;
- discovered ref count;
- candidate ref ids/hashes found for the run or source scope;
- cached/expanded/failed ref counts, clearly marked as Evidence Expansion/ref lifecycle, not Discovery acquisition completion;
- warning/error summary;
- derived outcome candidate;
- confidence level;
- missing-basis flags such as `packet_outcome_not_proven`, `no_ref_not_represented`, `provider_deferred_not_normalized`, `held_by_external_io_posture_only`, and `cap_basis_summary_only`;
- optional HS347/HS349 proof packet fields when the proof surface is explicitly selected, marked proof-only.

This stub should be read-only and non-authorizing. It should not update Watch posture or create task rows.

## 9. Fields Likely Requiring Future Task / Packet Layer

The following should not be forced into current rows:

- `discovery_task_id`;
- `discovery_packet_id`;
- accepted source intent handoff id;
- accepted scope/window snapshot;
- packet target type and target id;
- packet index and packet count;
- provider request/attempt id per packet;
- packet outcome word;
- no-ref packet row;
- deferred-until / retry-after basis;
- held-by-gate basis at task or packet level;
- local cap versus provider cap distinction;
- acquisition capped basis and coverage disclosure;
- retryable versus terminal failure classification;
- task rollup outcome;
- completion receipt back to Watch/source intent;
- link from candidate refs back to producing packet.

These fields are task/workflow memory, not Evidence/EVEidence and not Hydration. They should remain out of `discovered_killmail_refs` unless Overseer later accepts a bounded migration or read-model design.

## 10. Recommendation

Recommended next step: read-only derivation proof first.

Why:

- HS352 already found coarse outcomes partially derivable and per-packet system/radius outcomes not reliably derivable.
- HS353 explicitly recommends starting with a read-only derivation proof before accepting durable Discovery task/task-packet schema.
- Current rows are strong enough to test the derivation model honestly, including confidence and missing-basis flags.
- Jumping straight to fixture task/packet schema would risk designing around assumptions not yet pressure-tested against existing row behavior.

The proof should answer:

- Which outcomes can Atlas derive today?
- Which outcomes are only task-level?
- Which are proof-only?
- Which are impossible without no-ref/defer/cap/failure packet rows?
- Which words should apply at packet level, task level, or rollup level?

No Dev runway is opened by this advisory. Overseer should decide whether to open a read-only derivation proof packet.

## 11. Parked Items

- Durable `discovery_task` / `discovery_task_packet` schema.
- Live Watch execution behavior depending on Discovery completion.
- Provider calls.
- Runtime dispatcher changes.
- Watch schedule mutation from derived Discovery outcome.
- Manual path adoption into the new outcome vocabulary.
- Evidence/EVEidence write changes.
- Hydration/readability changes.
- Observation/report presentation changes.
- UI or renderer behavior.
- External I/O enforcement or command blocking.
- Any treatment of Discovery completion as Evidence, Hydration, Observation, or Assessment completion.

## 12. Verification / Evidence Used

Evidence basis:

- Read-only review of the listed coordination docs, current-state docs, feature docs, and source files.
- Text search for outcome/cap/deferral/logging terms across `workspace`, `docs`, `src`, and `scripts`.
- Source tracing of Watch collectors, manual Discovery/Expansion workers, repository persistence methods, API logging, Watch scheduler/executor, and proof/readout services.

No code was changed outside this advisory artifact. No live/API/provider calls were run. No schema, queue, dispatcher, runtime enforcement, UI, Evidence/EVEidence, Hydration, or support-artifact behavior was changed.
