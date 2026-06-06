# EngineeringTraceHS344 - User Intent To Discovery Bus Source Trace

Role: Engineering / Source Trace Auditor
Project: AURA Atlas
Date: 2026-06-06
Status: Advisory source-code inspection only

## Boundary

This report is source-code-only advisory work. It does not authorize implementation, live/provider testing, term renames, database mutation, or workflow changes.

The inspection deliberately did not read `workspace/current.md`, `workspace/overview.md`, recent handoffs, Overseer/Dev HS artifacts, chat summaries, or external shaping/map files.

No live/API/provider verifier was run.

## Source Files Inspected

- `AGENTS.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `package.json`
- `src/main/db/schema.sql`
- `src/main/db/evidenceRepository.js`
- `src/main/scopes/scopeControls.js`
- `src/main/watchlist/watchlistRepository.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/workers/actorWatchPlanner.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusPlanner.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/manualDiscoveryWorker.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/mutatingActionService.js`
- `src/main/services/liveApiGateService.js`
- `src/main/services/taskRunner.js`
- `src/main/services/systemRadiusAuthoringPreflightService.js`
- `src/main/services/systemRadiusAcceptancePayloadService.js`
- `src/main/services/watchAuthoredExecutionReadinessService.js`
- `src/main/services/watchRuntimePacketPlanService.js`
- `src/main/services/watchExecutorTickDryRunService.js`
- `src/main/services/watchPacketDryRunDispatchParityService.js`
- `src/main/services/watchTaskCreationBoundaryService.js`
- `src/main/services/watchTaskCreationFixtureProofService.js`
- `src/main/services/watchDiscoveryBusInputEnvelopeService.js`
- `src/main/services/discoveryIntakeConsumerStubCandidateService.js`
- `src/main/api/zkillClient.js`
- `src/main/api/esiClient.js`
- `src/main/api/httpClient.js`

## Verifier Scripts Inspected Or Run

Inspected and run:

```powershell
node scripts\verify-watch-task-creation-boundary.js
node scripts\verify-watch-discovery-bus-input-envelope.js
node scripts\verify-discovery-intake-consumer-stub-candidates.js
node scripts\verify-watch-create-accepted-scope-contract.js
node scripts\verify-watch-authored-execution-readiness.js
node scripts\verify-watch-executor-tick-dry-run.js
```

All passed. These are offline/in-memory verifier scripts. They do not run live provider checks.

## Current Chain Found From Code

1. User/operator intent enters through service commands and scope normalizers:
   `scope.validate`, `watch.create`, `watch.update`, `watch.list`, `watch.schedule`, `watch.offline_readout`, `watch.executor.*`, plus read-only preview commands.
2. Durable Watch intent is stored in:
   `watchlist_entities` for actor Watches and `system_watches` for system/radius Watches.
3. Actor Watch intent carries:
   `entity_type`, `entity_id`, `entity_name`, `lookback_days`, `max_killmails_per_run`, active flag, cadence, backoff, and poll state.
4. System/radius Watch intent carries:
   `center_system_id`, `center_system_name`, `radius_jumps`, stored `included_system_ids`, `excluded_system_ids`, caps, active flag, cadence, backoff, and poll state.
5. Accepted system/radius scope authority is the stored `included_system_ids`. Center/radius survive as provenance/management, not execution authority, once accepted IDs are present.
6. `watchScheduler.buildWatchScheduleStatus` classifies rows as `due` or `blocked` from active flag, session arm, live API gate input, backoff, and `next_poll_at`.
7. `watchExecutor.tick` adds runtime conditions: unarmed session blocks, active task blocks, live API disabled blocks, no due Watches idles, invalid stored scope blocks, live gate can block, otherwise one stable selected Watch dispatches.
8. Implemented live execution currently dispatches directly to collectors:
   `watch.executor.tick` -> `dispatchFor` -> `actor.watch` or `system.radius.watch` -> `collectActorWatch` / `collectSystemRadiusWatch`.
9. The newer task/bus/intake chain is read-only proof shape:
   schedule/dry-run -> would-task envelope -> fixture task shape -> Discovery bus input envelope -> stub candidate refs.
   It does not create real tasks, provider movement, durable Discovery refs, or Evidence.

## Answers To Trace Questions

### 1. What source-code surfaces represent user/operator intent?

Primary surfaces:

- `scopeControls.js` normalizes manual discovery, manual expansion, actor Watch, and system/radius Watch scope inputs.
- `serviceRegistry.js` exposes command surfaces, classifications, effects, renderer eligibility, and confirmation requirements.
- `mutatingActionService.js` handles command execution for `watch.create`, `watch.update`, direct Watch collection commands, and executor commands.
- `watchlistRepository.js` writes durable actor and system/radius Watch definitions.
- `schema.sql` encodes durable intent tables: `watchlist_entities`, `system_watches`, `discovered_killmail_refs`, `fetch_runs`, and evidence tables.
- Renderer-facing proof/readout services expose intent shape without mutating state.

### 2. How does Watch authoring or accepted scope represent system/radius and actor intent?

Actor Watch authoring writes `watchlist_entities`: actor type/id/name, lookback, max killmails per run, active flag, cadence, timing/backoff fields, and notes.

System/radius Watch authoring writes `system_watches`: center system id/name, radius jumps, included/excluded system ID JSON, lookback, max systems, max killmails, active flag, cadence, timing/backoff fields, and notes.

When accepted included system IDs are supplied, `watchlistRepository.addSystemRadiusWatch` stores those exact IDs and reports `scope_authority.source = accepted_preflight_included_system_ids`. Center/radius are retained as provenance and management fields.

Legacy center/radius authoring remains available and recomputes topology for storage when accepted included IDs are not supplied.

### 3. Where is scope authority enforced, especially stored included system IDs versus center/radius provenance?

Authoring enforcement:

- `systemRadiusAuthoringPreflightService.js` computes included IDs from local topology and marks whether the scope is acceptable.
- `watchOperatorConfirmationContractService.js` models explicit confirmation and requires accepted preflight included IDs.
- `mutatingActionService.acceptedSystemRadiusScopeFromPayload` extracts accepted IDs and accepted preflight metadata from payloads.
- `watchlistRepository.normalizeAcceptedSystemRadiusScope` requires non-empty accepted IDs, center inclusion, acceptable preflight/payload status, no duplicates, valid positive integers, and equality with current local topology for center/radius.

Execution/readout enforcement:

- `watchExecutor.acceptedSystemIdsForWatchSource` requires stored included IDs to parse as valid and non-empty before dispatch shape can exist.
- `watchAuthoredExecutionReadinessService` blocks missing, malformed, empty, invalid, and inactive rows before provider movement.
- `watchRuntimePacketPlanService`, `watchExecutorTickDryRunService`, and `watchPacketDryRunDispatchParityService` all treat stored included IDs as execution authority and center/radius as provenance/management.

### 4. How does runtime decide whether a Watch would be due, blocked, held, or idle?

`watchScheduler.buildWatchScheduleStatus` creates schedule rows for actor and system/radius Watches. A Watch is `due` only when no blocked reasons are present. Reasons include:

- `inactive`
- `session_not_armed`
- `live_api_disabled`
- `backoff`
- `not_due`

`WatchSessionExecutor.tick` then applies runtime gates:

- not armed -> blocked `session_not_armed`
- active task present -> blocked `active_task`
- live API disabled -> blocked `live_api_disabled`
- no due rows -> idle `no_due_watches`
- invalid stored scope -> blocked `watch_scope_authority_invalid`
- live gate refusal -> blocked by live gate reason
- otherwise one due Watch is selected and dispatched

`watchOfflineReadout.js` adds read-only posture terms such as `eligible_if_armed`, `collection_active`, `next_safe_action`, `drain_pending_refs`, `wait`, `arm_required`, and `ready_for_discovery`. It does not arm, dispatch, call providers, or mutate persistence.

### 5. How does Watch intent become task-shaped work, if at all?

There are two distinct paths.

Implemented runtime path:

- `WatchSessionExecutor.tick` uses `TaskRunner.runDetachedTask` to create a real detached task with type `watch.executor.<dispatch command>`, classification `evidence-creating`, and `scopeKey` from the selected Watch.
- The task handler invokes the selected collector and records Watch run result.

Read-only proof path:

- `watchTaskCreationBoundaryService` creates a would-task envelope only as plain data.
- `watchTaskCreationFixtureProofService` creates a disposable fixture task with a disposable `TaskRunner.createTask`.
- It does not call `runTask`, `runDetachedTask`, `prepareTask`, dispatch runners, collectors, providers, or persistence.

### 6. How does task-shaped Watch intent become Discovery bus/input-shaped data, if at all?

Only in the read-only proof path.

`watchDiscoveryBusInputEnvelopeService` consumes the fixture task proof and emits a `bus_input_envelope` when the would-task shape is preserved. The envelope is acquisition intent only:

- `source_lane: watch`
- `source_kind: actor` or `system_radius`
- Watch ID/scope key/task type/task classification
- actor entity fields or system accepted IDs
- lookback and caps
- provenance
- `candidate_only: true`
- `discovery_refs_written: false`
- `evidence_created: false`
- `provider_movement: false`

This is not durable Discovery refs and not Evidence.

### 7. How does Discovery bus/input-shaped data become candidate refs, if at all?

Only in the read-only stub proof path.

`discoveryIntakeConsumerStubCandidateService` converts a bus input envelope into local fixture candidate refs:

- actor candidates use `provider: zkill_stub`
- system/radius candidates use accepted system IDs from the envelope
- candidates are marked `candidate_only`, `stub_only`, `durable_ref_written: false`, `evidence_created: false`, and `provider_movement: false`

No durable `discovered_killmail_refs` writes occur in this stub path.

### 8. Where does current code stop before External I/O / provider movement?

For the preview/proof chain, code stops at fixture/stub candidate refs in `discoveryIntakeConsumerStubCandidateService`. No provider calls, API logs, Discovery ref writes, Evidence writes, or Watch mutations occur.

For actual Watch execution, code stops before I/O at `mutatingActionService.assertLiveAllowed` / `liveApiGateService.enterLiveProviderAttempt`. If the gate allows, execution proceeds into provider clients and is no longer pre-I/O.

### 9. What code would likely be responsible for real zKill/ESI movement later?

The provider movement code already exists:

- `ZKillDiscoveryClient.discoverRefs` builds zKill refs from zKill responses.
- `EsiClient.expandKillmail` expands killmail refs through ESI.
- `HttpClient.json` performs fetches, retries/timeouts, cancellation, and API request logging.
- `collectActorWatch` and `collectSystemRadiusWatch` orchestrate zKill discovery, queue writes, ESI expansion, and evidence persistence.
- `buildEvidencePackageFromRefs` normalizes ESI killmails into Evidence package shape.
- `EvidenceRepository.persistEvidencePackage` writes killmails, activity events, entities, audits, and warnings.

### 10. What current gaps, mismatches, or unclear boundaries exist before live Watch execution?

- Two models currently coexist: implemented direct live collector execution and newer read-only task/bus/intake proof surfaces.
- The bridge from proof bus/intake shape to a real non-provider Discovery intake consumer is not implemented.
- `watch.create` accepts and stores accepted included system IDs, but legacy direct center/radius authoring still exists and recomputes topology for storage.
- The sharpest seam is preservation of `acceptedSystemIds` through the real execution path. `watchExecutor.dispatchFor` builds a payload with accepted IDs, but `runSystemRadiusWatchService` normalizes through `normalizeSystemRadiusWatchScope`, which does not include accepted IDs in its returned object. This should be proven before live provider testing.
- `watch.executor.arm` can immediately tick and dispatch if gates allow. It is not only a passive arm flag.
- Direct live Watch collectors currently can both queue Discovery refs and expand ESI Evidence in one run, depending on pending refs and caps. Reports should distinguish queue writes from Evidence creation.

### 11. What terms or meanings appear at risk of blur?

- `Discovery`: safe in contracts/proofs, but at risk when stub candidates or queued refs are described as results. Discovery refs are possible leads, not Evidence.
- `Evidence` / `EVEidence`: protected. Only expanded ESI killmail data and Atlas-owned derived activity events qualify.
- `Observation`: not part of this Watch-to-bus path. Risk appears if schedule/readiness/queue summaries are presented as pattern findings.
- `Hydration`: separate readability/metadata path. It is not Evidence creation.
- `Watch`: active routine check/configuration/behavior. Do not use for passive Marked attention.
- `Marked`: attention/interest/selection state. Marked must not imply Watch.
- `Assessment`: deliberate operator memory/judgment, not automatic proof.

### 12. What is the smallest next seam to inspect or prove before live/provider testing?

Prove the real system/radius execution input path without live providers:

`watchExecutor.dispatchFor` -> `runSystemRadiusWatchService` or direct collector dependency injection -> `collectSystemRadiusWatch` -> `planSystemRadiusWatch`

The proof should assert:

- `acceptedSystemIds` survive into `planSystemRadiusWatch`
- `acceptedScopeSource` remains `stored_watch_scope`
- topology is not recomputed as execution authority
- invalid stored scope blocks before task/provider movement
- injected fake zKill/ESI clients prevent live provider calls
- no durable refs or Evidence are written unless the specific test intentionally exercises local fixture writes

## Where Atlas Stops Before I/O

Current pre-I/O proof chain:

`watch.schedule` / dry-run inputs -> runtime packet plan -> executor tick dry-run -> packet/dry-run/dispatch parity -> task creation boundary -> fixture task proof -> Discovery bus input envelope -> Discovery intake stub candidates.

This chain stops at stub candidate refs. It does not create durable Discovery refs.

Current implemented live chain:

`watch.executor.tick` -> real task -> collector -> zKill client -> ESI client -> persistence.

This chain stops before provider movement only at live-gate assertion. Once allowed, provider movement proceeds.

## Boundary Confidence

High confidence for source-only conclusions about current code shape, offline proofs, and read-only bus/stub boundaries.

Medium confidence for live execution readiness because no live/provider checks were run and the real system/radius accepted-ID propagation path needs a targeted source/test proof.

## Gaps Or Risks

- The proof bus/intake path is not yet the implemented runtime provider path.
- Direct Watch collectors can cross Discovery and Evidence steps in a single run.
- Accepted stored system IDs are strongly represented in authoring/readiness/proof services, but should be proven through the real executor-to-collector path before live testing.
- Legacy center/radius authoring remains active and should stay visibly distinct from accepted-scope authority.
- Readout labels such as `ready_for_discovery` and task classification `evidence-creating` need careful presentation so they do not imply refs are Evidence.

## Recommended Next Seam And Follow-Up Directions

Recommended next seam:

Create or inspect an offline injected-provider proof for real system/radius Watch execution shape, centered on accepted stored IDs moving from `system_watches.included_system_ids` through `dispatchFor` into `planSystemRadiusWatch`.

Follow-up directions:

- Keep the proof offline and in-memory.
- Use fake zKill/ESI clients or planner dependency injection.
- Assert no live provider calls.
- Assert accepted IDs are preserved exactly.
- Assert center/radius are provenance/management after acceptance.
- Assert invalid/malformed stored scope blocks before task/provider movement.
- Decide separately whether the Discovery bus/intake envelope should become the required runtime architecture before live/provider testing.

## Human/Overseer Decision Needed

Decide whether live Watch execution should continue hardening the existing direct collector path, or whether the newer Discovery bus/intake envelope should become the required architecture before provider testing.

That decision determines whether the next implementation runway should:

- harden executor-to-collector accepted-scope propagation, or
- implement a real Discovery intake consumer between Watch task intent and provider-backed candidate acquisition.
