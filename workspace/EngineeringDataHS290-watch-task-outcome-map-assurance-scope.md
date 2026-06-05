# Engineering / Data Engineering / Security Advisory

## HS290 Watch / Task Outcome Map Assurance And Scope

Date: 2026-06-05

Role: Engineering / Data Engineering / Security advisory reviewer

Status: Advisory only. No Dev runway opened.

## 1. Executive Recommendation

Atlas has enough source truth to derive a read-only Watch/task origin and durable outcome map without new schema, provider calls, task dispatch, or Watch execution.

Atlas is not ready to create durable `watch_result`, `watch_result_items`, relationship tags, durable task queues, or Watch-derived relationship truth. Current source supports a read-only map that explains where work originated, what command would or did move it, which state is volatile, and which durable rows prove Discovery, Evidence Expansion, Watch schedule movement, collection completion, partial completion, failure, or deferral.

Recommended disposition:

- safe to keep HS290 as an advisory/current-state assurance artifact;
- safe to translate later into a bounded read-only Dev proof if Overseer chooses;
- not ready for schema, `watch_result`, relationship tags, dispatcher/Bucket, or durable task persistence.

The guiding boundary remains:

```txt
Evidence records what happened.
Provenance records how Atlas got it.
Watch/task result readouts group what a specific scope/run found.
Observation interprets/group-presents local records.
Assessment remains human judgment.
```

## 2. Current Source-Backed Origin / Outcome Map

| Work Kind | Operator Act | Service Command | Runtime Task? | Durable Outcome |
| --- | --- | --- | --- | --- |
| Manual Discovery | user asks Atlas to discover possible leads for actor/system/radius | `manual.discovery` | yes when invoked with `asTask` / `detachedTask` | `fetch_runs`, `discovered_killmail_refs`, `api_request_logs`, `data_quality_warnings` |
| Queue Preview | user reviews possible leads before ESI spend | `queue.selection` | no required task | read-only result only; no durable mutation |
| Manual Expansion | user confirms selected refs for ESI expansion | `manual.expansion` | yes when invoked with `asTask` / `detachedTask` | `fetch_runs`, `killmails`, `activity_events`, `ingestion_audits`, `data_quality_warnings`, ref status updates |
| Watch Authoring | user creates/updates active routine check intent | `watch.create` / `watch.update` | no required task | `watchlist_entities` or `system_watches` |
| Watch Schedule Readout | user/system checks due/blocked/backoff state | `watch.schedule` | no | read-only derived schedule state from Watch rows and gates |
| Watch Executor Arm/Tick | user arms session or trusted tick occurs | `watch.executor.arm` / `watch.executor.tick` | yes, detached evidence-creating task when due Watch dispatches | volatile task state plus durable collection rows if dispatch happens |
| Actor Watch Collection | due Watch dispatches actor collection | `actor.watch` via executor dispatch | yes in executor path | `fetch_runs`, Discovery refs, Evidence rows, warnings, Watch schedule update |
| System/Radius Watch Collection | due Watch dispatches radius collection | `system.radius.watch` via executor dispatch | yes in executor path | `fetch_runs`, Discovery refs, Evidence rows, warnings, Watch schedule update |

Source basis:

- `src/main/services/serviceRegistry.js`
- `src/main/services/mutatingActionService.js`
- `src/main/services/taskRunner.js`
- `src/main/watchlist/watchlistRepository.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/workers/manualDiscoveryWorker.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/db/schema.sql`
- `src/main/db/evidenceRepository.js`

## 3. Durable Versus Volatile State

Durable state:

- `fetch_runs`
- `discovered_killmail_refs`
- `killmails`
- `activity_events`
- `ingestion_audits`
- `api_request_logs`
- `data_quality_warnings`
- `watchlist_entities`
- `system_watches`
- `entities` and local label/readability rows when relevant

Volatile state:

- `TaskRunner.tasks`
- `TaskRunner.activeLocks`
- `TaskRunner.abortControllers`
- `WatchSessionExecutor.sessionArmed`
- `WatchSessionExecutor.activeTaskId`
- executor interval/tick/dispatch memory

Current meaning:

- `task_id` is current-session runtime tracking.
- `run_id` is durable collection provenance.
- Watch schedule fields are durable Watch timing/posture metadata.
- Evidence/EVEidence remains the durable ESI-expanded corpus truth.

Risk:

- Treating current in-memory task state as durable recovery truth would create restart ambiguity. Current source already says runtime snapshots and Watch runtime facts are volatile/read-only posture, not persisted work identity.

## 4. Manual Discovery Output Boundary

Manual Discovery starts at:

```txt
manual.discovery
```

It may be wrapped as a task through service invocation.

It outputs:

- zKill Discovery refs;
- source/provenance scope;
- `fetch_runs` collection row;
- `api_request_logs`;
- warnings;
- queue status.

It must not imply:

- Evidence/EVEidence exists;
- ESI expansion has occurred;
- local Observation exists;
- a Watch result exists;
- complete activity coverage.

Source:

- `docs/current-state/current-manual-discovery-lane.md`
- `docs/contracts/scope-definition-contract.md`
- `docs/contracts/discovery-queue-contract.md`
- `src/main/workers/manualDiscoveryWorker.js`

## 5. Manual Expansion Output Boundary

Manual Expansion starts at:

```txt
manual.expansion
```

It consumes:

- selected killmail IDs, or
- a Discovery queue scope plus cap.

It outputs:

- selected/cached/failed ref state;
- ESI-expanded killmail payloads;
- `killmails`;
- `activity_events`;
- `ingestion_audits`;
- `data_quality_warnings`;
- `fetch_runs` completion counts.

It must not imply:

- Discovery refs were Evidence before expansion;
- every discovered ref was expanded;
- missing or failed refs are failed Evidence;
- a result grouping has been accepted beyond collection provenance.

Source:

- `docs/contracts/expansion-selection-contract.md`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/db/evidenceRepository.js`

## 6. Watch Authoring / Schedule / Executor / Collection Boundaries

### Watch Authoring

Watch authoring starts at:

```txt
watch.create
watch.update
```

It outputs durable intent rows:

- `watchlist_entities` for actor Watches;
- `system_watches` for system/radius Watches.

It does not start provider collection by itself.

### Watch Schedule

Watch schedule readout starts at:

```txt
watch.schedule
watch.offline_readout
```

It outputs derived state:

- due;
- blocked;
- backoff;
- not due;
- session-gate posture;
- local recovery/readout facts.

It does not create work or call providers.

### Watch Executor

Watch executor movement starts at:

```txt
watch.executor.arm
watch.executor.tick
```

It can create one volatile evidence-creating task when a due Watch dispatches and gates pass.

It does not create durable task identity. Its durable effects come from the collector it dispatches.

### Watch Collection

Watch collection runs through:

```txt
actor.watch
system.radius.watch
```

It outputs:

- `fetch_runs`;
- Discovery refs;
- ESI-expanded Evidence/EVEidence where selected expansion succeeds;
- API logs;
- warnings;
- Watch schedule success/failure timing updates.

It does not output a durable `watch_result` from reviewed source.

## 7. Radius Watch Scope Snapshot Finding

Finding:

- `watchlistRepository.addSystemRadiusWatch` computes and stores `included_system_ids` and `excluded_system_ids` from local SDE topology.
- `watchScheduler.scheduleRow` exposes stored included/excluded system lists in schedule source.
- `watchExecutor.dispatchFor` builds the system/radius collection payload from center system, radius, lookback, max systems, and caps.
- `watchExecutor.dispatchFor` does not pass the stored `included_system_ids` or `excluded_system_ids`.
- `systemRadiusCollector` calls `planSystemRadiusWatch` unless injected planner output is supplied, so product execution recomputes topology from center/radius.

Conclusion:

- Current system/radius Watch execution appears to recompute scope rather than preserve the authored topology snapshot.
- Not proven from reviewed source: that stored excluded systems are honored by executor-dispatched collection.

Risk:

- Authored Watch scope and executed Watch scope can drift if topology/import state changes or exclusions matter.

Decision needed:

- Should system/radius Watch execution use stored snapshot, recomputed topology, or a disclosed hybrid?

## 8. System/Radius Queue Identity Finding

Finding:

- `systemRadiusCollector` uses `discoveredByType: system_radius`.
- It uses `discoveredById: input.centerSystemId`.
- Radius, Watch ID, and stored included system list are not part of Discovery ref identity in that collector path.
- `fetch_runs.watch_id` can include `system:<center>:radius:<radius>`, but `discovered_killmail_refs` identity is center-only for system/radius Watch collection.

Conclusion:

- Current `system_radius` Discovery ref identity is probably sufficient for a single active radius meaning per center.
- It is not clearly sufficient for multiple radius Watches sharing one center, or for future outcome maps that must distinguish center+radius+Watch identity.

Risk:

- Pending refs could be shared or interpreted across different radius Watches for the same center.
- A future result/readout could inherit ambiguous scope basis.

Decision needed:

- Should system/radius Discovery ref scope remain center-only, or become center-plus-radius/watch identity before outcome result semantics rely on it?

## 9. Watch / Result Meaning Accumulating In Evidence Rows

Current state:

- `killmails` stores ESI truth and source as `esi`.
- `activity_events` stores normalized appearance rows and includes `discovered_by_type` / `discovered_by_id`.
- `ingestion_audits` links killmails to `run_id`.
- `fetch_runs` links run provenance to `watch_type` and `watch_id`.
- `discovered_killmail_refs` stores Discovery/source scope before expansion.

Conclusion:

- Source does not show a durable `watch_result`, relationship tag, or task result being written into Evidence/EVEidence.
- The current Evidence boundary is mostly sound.
- The mild pressure point is `activity_events.discovered_by_type` / `discovered_by_id`: acceptable as light provenance, but not a safe place to accumulate Watch results, relationship tags, or task meaning.

Do not add later without a decision:

- `killmails.watch_result_id`
- `killmails.task_found_by`
- `activity_events.relationship_tag`
- `activity_events.watch_result_label`
- `activity_events.task_result_id`

Preferred future shape if accepted later:

```txt
watch_result / outcome artifact
-> watch_result_items / outcome items
-> killmail_id / run_id references
```

That future layer should point at Evidence, not mutate Evidence meaning.

## 10. Proposed Smallest Read-Only Outcome Map Surface

A future read-only outcome map is justified from existing local source truth.

Smallest useful surface:

```txt
Watch / Task Outcome Map Preview
```

It should disclose, without dispatching or writing:

- origin kind: Manual Discovery, Manual Expansion, Watch authoring, schedule readout, executor dispatch, collection;
- operator act or trigger;
- service command;
- whether state is volatile or durable;
- expected durable rows;
- latest matching `fetch_runs`;
- Discovery ref counts by status;
- Evidence/EVEidence counts;
- warning/error/deferral basis;
- Watch row and schedule posture if applicable;
- task volatility warning;
- system/radius authored scope versus current collector-planned scope;
- whether queue identity is center-only or center-plus-radius/watch-capable;
- explicit statement that no `watch_result` or relationship tag exists.

This can be read-only and local-only. It does not require schema.

## 11. Items To Keep Parked

- durable `watch_result`;
- `watch_result_items`;
- relationship tag writes;
- durable relationship model;
- Watch-derived Assessment;
- durable task queue;
- Bucket / Dispatcher / worker / lease / retry;
- provider/API execution;
- Watch dispatch from the preview;
- schema changes;
- Evidence/EVEidence mutation;
- Discovery ref mutation;
- Watch row mutation;
- UI/renderer work;
- support artifacts;
- runtime enforcement or command blocking;
- fourth lane / fast lane reopening.

## 12. Verification / Evidence Expected Before Dev

Before any read-only Dev proof:

- prove preview does not call providers;
- prove preview does not create task rows or dispatch work;
- prove preview does not mutate Watch rows, Discovery refs, Evidence, Assessment, metadata, or support artifacts;
- verify Manual Discovery maps to refs only;
- verify Manual Expansion maps to Evidence/EVEidence and run provenance;
- verify task state is marked volatile;
- verify run state is marked durable;
- verify system/radius Watch authored scope is compared to collector-planned scope;
- verify center-only queue identity is disclosed;
- verify no `watch_result` or relationship tag is implied.

Before any durable result/schema work:

- decide result identity;
- decide whether result is per run, per Watch window, or per generated report;
- decide whether relationship tags are Observation support, Assessment support, or presentation-only labels;
- decide whether system/radius queue identity needs migration;
- decide whether Watch execution uses stored topology snapshot or recomputed topology.

## 13. Human / Overseer Decisions Needed

1. Should HS290 remain advisory only, or become a bounded read-only Dev proof later?
2. Should the outcome map be named as Watch/task output posture, outcome map, or another Atlas-local term?
3. Should system/radius Watch execution preserve stored topology snapshot or recompute each run?
4. Should `system_radius` Discovery ref identity include radius/watch identity before result semantics rely on it?
5. Should future `watch_result` be durable schema, derived report/readout, or deferred entirely?
6. If future relationship tags are desired, are they Observation support, Assessment support, or presentation-only?
7. Should task history remain explicitly volatile by policy, with `fetch_runs` as durable truth?

## 14. Smallest Safe Next Dev Packet, If Any

A smallest safe Dev packet exists only as a read-only local proof. It is not necessary for correctness right now, but it is justified if Overseer wants to reduce uncertainty before returning to Watch/result work.

Suggested bounded packet:

```txt
Build a read-only Watch/task outcome map preview from existing local rows.
```

Must not:

- call providers;
- dispatch tasks;
- arm Watch execution;
- write schema;
- create `watch_result`;
- write relationship tags;
- mutate Evidence/EVEidence;
- mutate Discovery refs;
- mutate Watch rows;
- create UI behavior.

Not ready:

- durable `watch_result`;
- relationship-tag persistence;
- broad work queue;
- dispatcher/Bucket machinery;
- live Watch execution changes.

## Acceptance Check

- Advisory only: yes.
- No implementation or Dev runway: yes.
- Manual Discovery and Manual Expansion boundaries mapped: yes.
- Watch authoring, schedule, executor volatility, and collection outputs mapped: yes.
- Radius scope snapshot finding stated: yes.
- System/radius queue identity finding stated: yes.
- Evidence/result boundary preserved: yes.
- Future read-only outcome map justified without schema: yes.
- Parked items preserved: yes.
- Decisions routed to Human/Overseer: yes.
