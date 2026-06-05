# Engineering / Data Engineering / Security Advisory

## HS286 Secondary: Task Creation And Watch Mechanics

Date: 2026-06-05

Role: Engineering / Data Engineering / Security advisory reviewer

Status: Advisory only. No implementation authorization.

## 1. Executive Recommendation

The below-UI task system is coherent as a volatile runtime wrapper around service execution, but it should not be treated as durable workflow truth. Current durable truth lives in local tables such as `fetch_runs`, `discovered_killmail_refs`, `killmails`, `activity_events`, `watchlist_entities`, and `system_watches`.

Manual search is mechanically better defined than Watch output. Manual Discovery and Manual Expansion have clear command surfaces, caps, queue outputs, and Evidence boundaries. Watch authoring, scheduling, and execution also exist, but the final product meaning of a completed Watch run is underdefined. Source proves schedule state, task state, collection summaries, fetch run records, and local Evidence writes. Source does not prove a durable `watch_result` object or relationship-tag artifact.

Recommended next planning gravity: define the output contract for task-created work before adding more machinery. For Watch specifically, define the exact read-only result posture first:

```txt
a Watch definition creates durable intent.
a Watch executor tick may create one volatile task.
a Watch collection creates fetch_runs, Discovery refs, and Evidence/EVEidence.
a Watch result, if accepted later, should be a derived Observation/readout from those records, not a new Evidence source.
a relationship tag, if accepted later, must be explicitly named as derived Observation or Assessment-support, not provider truth.
```

## 2. Files / Context Reviewed

- `workspace/current.md`
- `workspace/EngineeringDataHS286-user-input-fetch-selected-resolution-missing-links.md`
- `docs/current-state/current-manual-discovery-lane.md`
- `docs/contracts/scope-definition-contract.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/features/data-layer-boundaries.md`
- `docs/features/r-scanner-sequencer-presentation.md`
- `src/main/services/serviceRegistry.js`
- `src/main/services/mutatingActionService.js`
- `src/main/services/taskRunner.js`
- `src/main/scopes/scopeControls.js`
- `src/main/sde/topologyService.js`
- `src/main/watchlist/watchlistRepository.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/workers/manualDiscoveryWorker.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/workers/actorWatchPlanner.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusPlanner.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/db/schema.sql`
- `src/main/db/evidenceRepository.js`
- `src/main/reports/runReport.js`

No tests, live/API calls, or provider calls were run.

## 3. Current Task Creation Read

Current task creation is service-envelope driven:

- `service.invoke` can execute a command directly.
- If invoked with `asTask`, `serviceRegistry` wraps the command in `defaultTaskRunner`.
- If invoked with `detachedTask`, the task starts asynchronously and the caller receives task state.
- `TaskRunner` stores task state in memory only.
- Task records include `task_id`, `type`, `classification`, `scope_key`, status, progress, warnings, result, and error.
- Locks are derived from classification and `scope_key`.

Source:

- `src/main/services/serviceRegistry.js`
- `src/main/services/taskRunner.js`

Classification:

- Implemented product runtime helper.
- Volatile, not durable workflow state.
- Not a sequencer, persisted queue, dispatcher, lease model, or restart recovery system.

Important boundary:

- A task proves a command was accepted into the current process runtime. It does not prove durable completion by itself. Durable completion must be read from command-owned outputs such as `fetch_runs`, queue refs, Evidence rows, Watch schedule fields, and reports.

## 4. Manual Search Surfaces And Expected Output

### Manual Discovery Start Surface

Command:

```txt
manual.discovery
```

Input scope:

- actor: typed character/corporation/alliance identity, lookback, max refs.
- system: center system, lookback, max refs, radius 0.
- radius: center system, radius jumps, lookback, max systems, max refs per system.

Source:

- `src/main/services/serviceRegistry.js`
- `src/main/services/mutatingActionService.js`
- `src/main/scopes/scopeControls.js`
- `src/main/workers/manualDiscoveryWorker.js`
- `docs/current-state/current-manual-discovery-lane.md`
- `docs/contracts/scope-definition-contract.md`

Expected output:

- zKill Discovery refs only.
- `discovered_killmail_refs` rows.
- provenance/scope counts.
- warnings/failures.
- no `killmails`.
- no `activity_events`.
- no Evidence/EVEidence.
- no Observation.

Classification:

- Implemented product behavior.

Gap:

- "Manual search" should not be used as a single term for both Discovery and Evidence Expansion. Source proves two surfaces.

### Queue Preview / Selection Surface

Command:

```txt
queue.selection
```

Expected output:

- read-only preview of pending/failed/cached/expanded Discovery refs.
- selected-for-expansion preview count.
- expected ESI call count.
- Evidence boundary text.

Source:

- `src/main/services/queueSelectionService.js`
- `docs/contracts/expansion-selection-contract.md`

Classification:

- Implemented product readout.
- Not a reservation.
- Not durable task state.

Gap:

- The word `selected` in preview can imply durable selection. Execution revalidates current refs later.

### Manual Expansion Start Surface

Command:

```txt
manual.expansion
```

Input scope:

- selected killmail IDs, or
- discovery scope by `discoveredByType` / `discoveredById`, plus cap.

Expected output:

- selected queued refs consumed.
- cached records skipped.
- ESI killmail expansion attempted for selected uncached refs.
- `killmails`, `activity_events`, entity updates, ingestion audits, warnings.
- Discovery ref status updates.
- `fetch_runs` completion summary.

Source:

- `src/main/services/serviceRegistry.js`
- `src/main/services/mutatingActionService.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/db/evidenceRepository.js`

Classification:

- Implemented product behavior.

Gap:

- If Atlas needs a "complete fetch" user posture, it needs a definition that distinguishes:
  - Discovery completed.
  - selected Evidence Expansion completed.
  - report-ready local sample exists.
  - partial/capped/failure states remain inspectable.

## 5. Watch Meaning And Current Mechanics

### Durable Watch Definition

Actor Watch source:

- `watchlist_entities`
- authored by `watch.create`
- unique by actor type and ID.

System/radius Watch source:

- `system_watches`
- authored by `watch.create`
- stores center system, radius, included/excluded system IDs, lookback/caps, activity state, poll interval, and last/next/backoff fields.

Source:

- `src/main/db/schema.sql`
- `src/main/watchlist/watchlistRepository.js`
- `src/main/services/serviceRegistry.js`
- `docs/contracts/scope-definition-contract.md`

Classification:

- Implemented durable intent metadata.

Boundary:

- Watch authoring writes local intent only. It does not run collection.

### Radius System Selection

Implemented basis:

- `TopologyService.getSystemsWithinRadius` uses local SDE `system_adjacency`.
- It walks stargate connections breadth-first from center system to radius depth.
- It applies `maxRadius`, `maxSystems`, and excluded IDs.
- `addSystemRadiusWatch` stores calculated `included_system_ids`.
- `planSystemRadiusWatch` also calculates the radius plan and planned zKill requests.

Source:

- `src/main/sde/topologyService.js`
- `src/main/watchlist/watchlistRepository.js`
- `src/main/workers/systemRadiusPlanner.js`
- `docs/contracts/scope-definition-contract.md`

Classification:

- Implemented local topology planning.

Gap:

- The source does not prove one canonical radius snapshot across authoring, scheduling, and execution. Watch authoring stores `included_system_ids`, but `watchExecutor.dispatchFor` builds execution payload from center/radius/caps and does not pass the stored included/excluded system set. `systemRadiusCollector` then replans from current topology unless a dependency injects planner output.

Risk:

- If SDE topology changes, or if excluded IDs were stored, scheduled execution may not exactly match the originally authored Watch scope.

### Watch Scheduling

Implemented basis:

- `watch.schedule` reads actor and system/radius watches.
- It classifies watches as due or blocked by inactive, session not armed, live API disabled, backoff, or not due.
- It returns sequencer diagnostics and source details.
- `recordWatchRunResult` updates `last_polled_at`, `last_success_at`, `last_error_at`, `backoff_until`, and `next_poll_at`.

Source:

- `src/main/watchlist/watchScheduler.js`
- `src/main/services/serviceRegistry.js`
- `docs/contracts/session-armed-watch-executor-contract.md`

Classification:

- Implemented read-only schedule posture and durable schedule update.

Gap:

- Schedule state is not a work queue. It does not prove a persistent task packet or durable work identity.

### Watch Execution

Implemented basis:

- `watch.executor.arm` sets volatile session armed state and immediately ticks.
- `watch.executor.tick` dispatches at most one due Watch.
- Executor blocks if unarmed, live API disabled, active task exists, or no due watch exists.
- Due selection follows stable ordering: next poll, last success, watch type, watch ID.
- Actor Watch dispatch calls `collectActorWatch`.
- System/radius Watch dispatch calls `collectSystemRadiusWatch`.
- Execution is wrapped in `TaskRunner` as evidence-creating detached work.
- Success/failure updates Watch schedule state.

Source:

- `src/main/watchlist/watchExecutor.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/services/taskRunner.js`
- `docs/contracts/session-armed-watch-executor-contract.md`

Classification:

- Implemented runtime behavior.
- Session state and task state are volatile.

Gap:

- There is no durable task recovery model. Restart loses task memory; durable review must use fetch runs, queue refs, API logs, and evidence rows.

### Watch Collection Output

Actor Watch output:

- `fetch_runs` with `watch_type = actor`.
- zKill refs discovered or pending refs drained.
- selected refs expanded through ESI under cap.
- Evidence persisted to local corpus.
- queue status updates.
- summary object returned to task.

System/radius Watch output:

- `fetch_runs` with `watch_type = system_radius`.
- local radius plan / zKill system requests.
- zKill refs discovered or pending refs drained.
- selected refs expanded through ESI under cap.
- Evidence persisted to local corpus.
- queue status updates.
- summary object returned to task.

Source:

- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/db/evidenceRepository.js`
- `src/main/reports/runReport.js`

Classification:

- Implemented evidence-creating collection behavior.

Gap:

- The returned task summary is not durable product state except insofar as its source rows are durable.

## 6. Poorly Defined Or Missing Mechanical Links

### A. Task Acceptance Versus Durable Work

Finding:

- `TaskRunner` is in-memory. `task.list` and `task.get` are useful diagnostics, not durable history.

Risk:

- Treating task history as durable truth would create restart confusion.

Safer framing:

- `task_id` is current-session runtime tracking.
- `run_id` is durable collection provenance.

### B. Manual Search "Complete" Meaning

Finding:

- Manual Discovery completion and Manual Expansion completion are separate.

Risk:

- "Search complete" could imply Evidence exists when only Discovery refs exist.

Safer output posture:

- `Discovery complete: refs queued`
- `Expansion complete: selected refs expanded/cached/failed under cap`
- `Report-ready: local Evidence sample exists`

### C. System/radius Watch Scope Snapshot

Finding:

- Watch authoring stores `included_system_ids` and `excluded_system_ids`.
- Executor dispatch does not pass those stored lists into the collector.
- Collector replans radius from center/radius unless supplied injected planner output.

Risk:

- Authored Watch scope and executed Watch scope can drift.
- Excluded systems may not be honored by the executor path.

Recommended posture:

- Before product reliance, define whether a Watch uses:
  - stored radius snapshot, or
  - recomputed topology per run.

### D. System/radius Queue Identity

Finding:

- `systemRadiusCollector` uses queue scope `discoveredByType: system_radius` and `discoveredById: input.centerSystemId`.
- Radius value is not part of the queue identity used for pending refs.
- `fetch_runs.watch_id` can include `system:<center>:radius:<radius>`, but Discovery refs are scoped by center ID only in this collector path.

Risk:

- Multiple radius Watches for the same center could share pending refs unintentionally.
- A later "relationship tag" could inherit ambiguous scope basis.

Recommended posture:

- Define whether `system_radius` Discovery ref identity is center-only or center-plus-radius before depending on Watch result meaning.

### E. Watch Result

Finding:

- Source proves `fetch_runs`, task result summaries, Watch schedule updates, queue refs, and Evidence rows.
- Source does not prove a durable `watch_result` table/object.

Risk:

- Saying "Watch produces watch_result" would overstate current architecture.

Safer posture:

- "Watch execution produces collection provenance and local Evidence changes; a future Watch Result may be derived from those rows."

### F. Relationship Tag

Finding:

- No reviewed source proves a durable relationship tag emitted from Watch completion.
- Existing relationship-shaped outputs are reports/Observation, not provider truth.

Risk:

- A "relationship tag" can blur Observation, Assessment, and Evidence.

Safer posture:

- "relationship-shaped Observation tag" or "watch-derived local context tag" until Overseer accepts a data-model boundary.

### G. Direct Watch Commands Versus Executor

Finding:

- `actor.watch` and `system.radius.watch` are non-renderer evidence-creating commands.
- The renderer-eligible path is `watch.executor.arm`, which may dispatch a due Watch.

Risk:

- Treating Watch authoring as direct execution would blur intent and acquisition.

Safer posture:

- `watch.create` = durable intent.
- `watch.schedule` = due/blocked readout.
- `watch.executor.arm/tick` = controlled runtime dispatch.
- `actor.watch` / `system.radius.watch` = evidence-creating collector commands.

## 7. Product-Ready / Posture-Only / Proof-Only / Parked

Product-ready from reviewed source:

- Manual Discovery backend and task wrapping.
- Manual Expansion backend and task wrapping.
- Queue selection preview.
- Actor/system/radius scope normalization.
- Local SDE topology radius planning.
- Watch authoring rows.
- Watch schedule readout.
- Session-armed Watch executor runtime.
- Actor/system-radius Watch collection.
- Durable `fetch_runs`, Discovery refs, Evidence rows, API logs, warnings.
- Run report from durable fetch run state.

Posture/readout only:

- `watch.offline_readout`.
- Watch schedule state as due/blocked/readiness.
- Runtime boundary task/watch snapshots.
- R-Scanner presentation mapping.

Proof/fixture only:

- Any verifier-only task/run rows or injected planner/provider behavior.
- Any source path that depends on injected dependencies rather than product invocation.

Parked:

- Durable task queue.
- Dispatcher/Bucket/leases/retries.
- Restart recovery for volatile task state.
- Durable `watch_result`.
- Relationship tag writes.
- Watch-derived Assessment.
- Broad relationship graph.
- Fourth lane reopening.
- Provider behavior changes.

## 8. Recommended Next Rich Surface

Recommended next rich surface:

```txt
Task origin and durable outcome map for Manual Search and Watch.
```

This should be a read-only advisory/proof surface first. It should answer:

- What user/operator act creates this work?
- What service command is invoked?
- Is the task volatile or durable?
- What durable rows prove acceptance/completion?
- What output is allowed for Discovery, Evidence Expansion, Watch schedule, and Watch collection?
- What output is not yet accepted, especially `watch_result` and relationship tags?

For Watch system/radius specifically, include:

- authored center/radius/caps;
- stored included/excluded system lists;
- scheduled source details;
- executor dispatch payload;
- collector-planned systems;
- whether those match;
- whether Discovery ref queue identity includes enough scope.

## 9. Smallest Safe Next Dev Packet, If Overseer Chooses

Only if Overseer chooses to move, the smallest safe Dev packet would be read-only and local-only:

```txt
Build a Watch/Task Outcome Preview that compares authored Watch scope, schedule state, executor dispatch payload, and expected durable outputs without dispatching work.
```

Acceptance boundaries:

- no provider/API calls;
- no Watch execution;
- no task dispatch;
- no schema changes;
- no queue/dispatcher;
- no relationship tag writes;
- no `watch_result` persistence;
- no UI requirement;
- no changes to current terms.

Useful checks:

- actor Watch: command identity, durable watch row, expected queue scope, expected run identity.
- system/radius Watch: stored included/excluded systems versus collector plan.
- manual Discovery: expected Discovery output only.
- manual Expansion: expected Evidence output only.
- task state: clearly marked volatile.
- run state: clearly marked durable.

If Overseer does not want a Dev packet, the next action should remain a current-state note or ADR candidate about Watch result semantics.

## 10. Human / Overseer Decisions Needed

1. Should Watch system/radius execution use the stored topology snapshot or recompute topology every run?
2. Should `system_radius` Discovery refs be scoped by center only, or center plus radius/watch identity?
3. Is `watch_result` a future durable artifact, a derived read-only report, or not needed?
4. If relationship tags are desired, are they Observation support, Assessment support, or presentation-only labels?
5. Should manual "complete fetch" be defined as Discovery completion, Evidence Expansion completion, or report-ready local sample?
6. Should task history remain volatile by policy, with `fetch_runs` as durable truth?

## 11. Acceptance Check

- Advisory only: yes.
- No implementation, provider calls, schema changes, queue/dispatcher, UI, or Dev runway: yes.
- Below-UI mechanics reviewed: yes.
- Manual search start surfaces and expected outputs identified: yes.
- Watch meaning, radius planning, scheduling, completion, and output gaps reviewed: yes.
- Code gaps identified from source: yes.
- Output posture leads the recommendation: yes.
- Next action routed to Overseer: yes.

## Appendix A - Human-Shaped Insight For Future Watch / Task Result Work

Status: Human conceptual flattening

Authority: advisory context only. This does not authorize implementation, does not override HS287, does not define schema, and does not reopen the Watch/task lane by itself.

The current Evidence/EVEidence boundary appears mostly sound. Atlas should keep ESI-expanded killmails and normalized activity events as shared corpus truth, not as containers for Watch/task meaning.

Emerging principle:

```txt
Evidence records what happened.
Provenance records how Atlas got it.
Watch/task results group what a specific scope/run found.
Observation interprets/group-presents local records.
Assessment remains human judgment.
```

The likely future need is not to tag Evidence directly. The likely future need is a separate searchable result/readout layer for task outcomes, especially Watch outcomes.

Preferred future direction:

```txt
watch_result
watch_result_items
```

A future result artifact should be able to answer:

- What did this Watch/task find in this window?
- Which killmails were related?
- Was the run complete, partial, capped, failed, or deferred?
- What scope and provider path produced it?

This should point to existing `killmail_id`, `run_id`, Watch scope, and provenance rows. It should not mutate the killmail's meaning.

Current code does not appear to have crossed the line into durable relationship tagging. The mild pressure point is that `activity_events` already carry `discovered_by_type` / `discovered_by_id`, which is acceptable as light provenance but should not become the place where Watch results, relationship tags, or task meaning accumulate.

Smallest useful future decision:

```txt
Treat Watch/task result as a separate derived artifact/read model, not an Evidence-field extension.
```

Parked future decisions:

- whether `watch_result` becomes durable schema;
- whether relationship tags are Observation support or Assessment support;
- whether Watch result identity is per run, per Watch window, or per generated report.
