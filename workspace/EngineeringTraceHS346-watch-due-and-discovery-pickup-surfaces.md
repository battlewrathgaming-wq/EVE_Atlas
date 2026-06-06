# EngineeringTraceHS346 - Watch Due And Discovery Pickup Surfaces

Status: advisory source trace only
Date: 2026-06-06
Role: Engineering Source Trace / Architecture Boundary Reviewer

## 1. Request Restatement

Inspect source code only, separating two surfaces:

- Watch Due / Scheduler Surface: decides whether a Watch should run now, including due, held, not-due, recovery, active/running, and gate posture. This surface must not perform provider movement, Discovery ref writes, Evidence writes, Hydration, or Observation.
- Discovery Pickup Surface: after a Watch is due, turns accepted Watch scope into Discovery acquisition intent. For system/radius Watch, stored accepted `included_system_ids` are execution authority; center system and radius are provenance/explanation after acceptance. One accepted Watch scope with N included systems should fan out into N per-system pickup packets.

This artifact does not create a Dev runway and does not authorize live/provider testing.

## 2. Files Inspected

Allowed authority/context:

- `AGENTS.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `package.json`

Scheduler / Watch due:

- `src/main/watchlist/watchScheduler.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/services/watchExecutorTickDryRunService.js`
- `src/main/services/watchRuntimePacketPlanService.js`
- `src/main/services/watchPacketDryRunDispatchParityService.js`
- `src/main/services/watchAuthoredExecutionReadinessService.js`
- `src/main/services/liveApiGateService.js`
- `src/main/services/externalIoStateService.js`
- `src/main/db/schema.sql`

Pickup / acquisition / persistence:

- `src/main/services/watchTaskCreationBoundaryService.js`
- `src/main/services/watchTaskCreationFixtureProofService.js`
- `src/main/services/watchDiscoveryBusInputEnvelopeService.js`
- `src/main/services/discoveryIntakeConsumerStubCandidateService.js`
- `src/main/services/taskRunner.js`
- `src/main/services/mutatingActionService.js`
- `src/main/workers/actorWatchPlanner.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusPlanner.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/db/evidenceRepository.js`
- `src/main/api/zkillClient.js`
- `src/main/api/esiClient.js`
- `src/main/api/httpClient.js`

Verifier scripts inspected or used:

- `scripts/verify-watch-scheduler.js`
- `scripts/verify-watch-offline-readout.js`
- `scripts/verify-watch-runtime-packet-plan.js`
- `scripts/verify-watch-executor-tick-dry-run.js`
- `scripts/verify-watch-packet-dry-run-dispatch-parity.js`
- `scripts/verify-watch-task-creation-boundary.js`
- `scripts/verify-watch-discovery-bus-input-envelope.js`
- `scripts/verify-discovery-intake-consumer-stub-candidates.js`

## 3. Commands Run

Offline/local verifier commands run:

- `node scripts\verify-watch-scheduler.js` - passed, `watch scheduler verified`.
- `node scripts\verify-watch-offline-readout.js` - passed, unchanged table proof and no-provider boundary reported.
- `node scripts\verify-watch-runtime-packet-plan.js` - passed, packet plan preview reported zero dispatches, tasks, providers, writes.
- `node scripts\verify-watch-executor-tick-dry-run.js` - passed, covered disarmed, active task, live disabled, no due, invalid scope, actor/system dispatch previews.
- `node scripts\verify-watch-packet-dry-run-dispatch-parity.js` - passed, packet plan, dry-run, and `dispatchFor` payload parity matched for comparable rows.
- `node scripts\verify-watch-task-creation-boundary.js` - passed, task envelope preview only, no TaskRunner runtime methods.
- `node scripts\verify-watch-discovery-bus-input-envelope.js` - passed, bus input envelope proof remained candidate-only with no writes/provider calls.
- `node scripts\verify-discovery-intake-consumer-stub-candidates.js` - passed, stub candidates remained non-durable and provider-free.

No live/provider/API verifier was run.

## 4. Inspection A Findings - Watch Due / Scheduler Surface

The main due calculation is `buildWatchScheduleStatus` in `src/main/watchlist/watchScheduler.js`. It reads durable Watch rows from `watchlist_entities` and `system_watches`, then computes each row as `scheduler_state: "due"` or `scheduler_state: "blocked"`.

Durable fields used include:

- Actor watches: `watch_id`, `entity_type`, `entity_id`, `entity_name`, `lookback_days`, `max_killmails_per_run`, `is_active`, `poll_interval_minutes`, `last_polled_at`, `next_poll_at`, `last_success_at`, `last_error_at`, `backoff_until`, `notes`.
- System/radius watches: `watch_id`, `center_system_id`, `center_system_name`, `radius_jumps`, `included_system_ids`, `excluded_system_ids`, `lookback_hours`, `max_systems_per_run`, `max_killmails_per_run`, `is_active`, `poll_interval_minutes`, `last_polled_at`, `next_poll_at`, `last_success_at`, `last_error_at`, `backoff_until`, `notes`.

Computed due/hold facts:

- First run: no `next_poll_at` and no blocking reason means due if active, armed, live gate open, and not in backoff.
- Not due: `next_poll_at > now` produces blocked reason `not_due`.
- Inactive: `is_active` false produces blocked reason `inactive`.
- Backoff: `backoff_until > now` produces blocked reason `backoff`.
- Session held: `sessionArmed !== true` produces `session_not_armed`.
- External/provider held in this scheduler: `liveApiEnabled` false or env not enabled produces `live_api_disabled`.
- Missed run: not a primary scheduler state. `watchOfflineReadout` computes `missed_slot` from expected next run versus observed movement and can recommend `recover_missed_slot_when_capacity_allows`.
- Active/running: not represented by schedule rows alone. `WatchSessionExecutor.tick`, `buildWatchExecutorTickDryRunPreview`, task-boundary proofs, and offline readout use executor/task status such as `activeTaskId` / `collection_active`.
- Storage gate: not a direct due/scheduler field in the inspected due path. Storage setup/budget gates exist elsewhere, but `buildWatchScheduleStatus` and `WatchSessionExecutor.tick` do not directly block on storage authority.
- External I/O gate: `externalIoStateService` describes future trust-boundary/readout posture, but inspected Watch due/tick code primarily uses live provider gate posture (`AURA_ATLAS_LIVE_API`, `actionGate`, `enterLiveProviderAttempt`). The external I/O state is not yet a hard direct scheduler authority in this path.

The clearest readout meaning "ready for acquisition" is diagnostic, not authorization:

- `watchOfflineReadout` emits `next_safe_action: "ready_for_discovery"` when armed, time-eligible, and not actively collecting.
- `buildWatchExecutorTickDryRunPreview` emits `decision.status: "would_dispatch"` and a selected Watch/payload without creating a task.
- `buildWatchRuntimePacketPlanPreview` emits `packet_plan_status: "planned"` with zero dispatches, tasks, provider calls, or writes.

Provider calls or persistence:

- `buildWatchScheduleStatus` is read-only.
- `watchOfflineReadout` is read-only.
- `recordWatchRunResult` writes only schedule/readout state after a run result: `last_polled_at`, `last_success_at`, `last_error_at`, `backoff_until`, and `next_poll_at`.
- `WatchSessionExecutor.tick` is mixed: it selects a due Watch, builds dispatch, runs live gates, creates a detached `TaskRunner` task, invokes the collector runner, and records run result. This is the current runtime blur between scheduler/due and acquisition/execution.

Smallest boundary proof for this surface:

- Keep or extend the existing dry-run/offline verifier posture to prove a pure due selector: given Watch rows plus session/live/active-task gates, produce exactly one of held, idle, blocked, or selected-due without invoking `dispatchFor`, `TaskRunner`, collectors, providers, Discovery refs, Evidence, Hydration, or Observation.

## 5. Inspection B Findings - Discovery Pickup Surface

After a Watch is due, acquisition-shaped work currently appears in two forms:

- Proof/preview chain: `buildWatchRuntimePacketPlanPreview`, `buildWatchExecutorTickDryRunPreview`, `buildWatchPacketDryRunDispatchParityPreview`, `buildWatchTaskCreationBoundaryPreview`, `buildWatchDiscoveryBusInputEnvelopeProof`, and `buildDiscoveryIntakeConsumerStubCandidateProof`.
- Real runtime chain: `WatchSessionExecutor.tick` -> `dispatchFor` -> `TaskRunner.runDetachedTask` -> `collectActorWatch` or `collectSystemRadiusWatch`.

Actor Watch pickup:

- `dispatchFor` builds command `actor.watch` with actor fields, lookback, max refs, and max expansions.
- `planActorWatch` makes one planned zKill request for character/corporation/alliance.
- The preview chain preserves this as one actor discovery packet shape and later as actor bus input/candidate-only data.

System/radius Watch pickup:

- `acceptedSystemIdsForWatchSource` / related readiness code require valid stored `included_system_ids`.
- `dispatchFor` builds command `system.radius.watch` with `acceptedSystemIds`, `acceptedScopeSource: "stored_watch_scope"`, `acceptedScopeProvenance`, center/radius, lookback, max systems, max refs per system, and expansion cap.
- `buildWatchRuntimePacketPlanPreview` preserves accepted stored IDs, marks center/radius as provenance/management, sets `center_radius_used_as_authority: false`, and says it would not recompute topology from center/radius.
- `planSystemRadiusWatch` uses `acceptedSystemIds` / `includedSystemIds` when supplied. In that mode, it sets `uses_stored_included_system_ids: true`, `recomputed_topology_used_as_authority: false`, and emits one planned zKill request per accepted system. If accepted IDs are absent, it falls back to topology recompute from center/radius for direct/manual execution authority.

Where accepted IDs are preserved:

- Runtime packet plan preview.
- Executor tick dry-run.
- Packet/dry-run/dispatch parity preview.
- Task boundary preview.
- Discovery bus input envelope proof.
- Stub candidate proof, including `accepted_system_ids`, `candidate_system_id`, center/radius provenance, and `center_radius_used_as_authority: false`.
- Real executor direct path appears to preserve IDs because `WatchSessionExecutor.tick` calls `dispatch.runner(dispatch.payload, { db })` directly.

Where accepted IDs may be dropped or authority may blur:

- `runSystemRadiusWatchService` in `mutatingActionService.js` calls `normalizeSystemRadiusWatchScope(payload)` before `collectSystemRadiusWatch`. The inspected normalization path may not preserve `acceptedSystemIds` / `acceptedScopeSource`. This matters for generic service-registry command execution of `system.radius.watch`; it appears separate from the default executor's direct runner path.
- `planSystemRadiusWatch` intentionally has a fallback center/radius authority mode when no accepted IDs are supplied. That is valid for direct/manual planning, but risky if a Watch execution path accidentally loses accepted IDs before planner entry.

Current fanout:

- Real planner/collector fanout exists as `plannedZkillRequests`, one request per accepted system when accepted IDs are supplied.
- Runtime packet plan preview currently counts `zkill_discovery_packet_count` and preserves `selected_accepted_system_ids`; it does not emit N first-class pickup packet objects.
- Bus input proof emits one envelope containing the full accepted ID set; it does not emit N per-system pickup packets.
- Stub candidate proof emits local fixture candidates for only the first two accepted systems, not a full N fanout proof.

Does pickup create refs/Evidence/Hydration/Observation?

- Preview/proof pickup code does not write Discovery refs, Evidence/EVEidence, Hydration, Observation, API logs, or provider movement.
- Real collectors do cross this boundary. `collectActorWatch` and `collectSystemRadiusWatch` create fetch runs, call zKill through `ZKillDiscoveryClient`, upsert durable `discovered_killmail_refs`, select refs for expansion, call ESI through `EsiClient`, build Evidence packages, persist killmails/activity events/entities/audits/warnings, and mark refs selected/expanded/cached/failed.
- No inspected pickup proof creates Hydration or Observation.

Smallest boundary proof for this surface:

- Add/verify a pure Discovery pickup packet preview that consumes exactly one selected due Watch and emits candidate acquisition packet data only. For system/radius, it should emit N per-system packets from stored accepted IDs, not just a count or a single envelope containing the set.

## 6. Reconciliation

Recommended boundary:

`due selected Watch` -> `Discovery pickup packet plan` -> later provider collector / durable ref writer.

The boundary should sit after due selection and before task creation, collector invocation, provider calls, durable Discovery ref writes, and Evidence expansion. A due/scheduler surface may say "this Watch is due" or "this Watch would dispatch"; it should not itself call collectors or create provider-backed task execution.

Functions that belong primarily to scheduler/due:

- `buildWatchScheduleStatus`
- `scheduleRow` internals in `watchScheduler.js`
- `selectDueWatch` / `dryRunExecutorTickDecision` as selection/readout helpers
- `buildWatchOfflineReadout`
- `readoutWatch`, `recoveryDiagnosticForWatch`, `nextSafeActionForWatch`
- `recordWatchRunResult`, but only as schedule-state result recording after an execution result

Functions that belong primarily to pickup/acquisition planning:

- `dispatchFor`, when treated as a pure payload builder
- `buildWatchRuntimePacketPlanPreview`
- `buildWatchExecutorTickDryRunPreview`
- `buildWatchPacketDryRunDispatchParityPreview`
- `buildWatchTaskCreationBoundaryPreview`
- `buildWatchDiscoveryBusInputEnvelopeProof`
- `buildDiscoveryIntakeConsumerStubCandidateProof`
- `planActorWatch`
- `planSystemRadiusWatch`, but only its accepted-ID mode for Watch execution

Mixed or risky functions:

- `WatchSessionExecutor.tick`: mixes due selection, live gating, task creation, collector invocation, and schedule result recording.
- `collectActorWatch` and `collectSystemRadiusWatch`: combine Discovery acquisition, durable Discovery ref persistence, ESI Evidence expansion, Evidence persistence, API logging, warning writes, and fetch-run lifecycle.
- `runSystemRadiusWatchService`: can blur accepted stored-scope authority if normalization drops accepted IDs before collector/planner.
- `planSystemRadiusWatch`: supports both stored accepted scope and center/radius recompute authority. That dual mode is understandable but must be guarded at Watch execution entry.
- `watchScheduler` sequencer diagnostics use packet/acquisition language while staying read-only; harmless now, but terminology can blur scheduler versus pickup.

## 7. Recommended Next Dev Seam

Recommend first establishing a clearer Discovery pickup packet proof before patching the existing direct collector path.

Reason: the existing proof chain already demonstrates no-provider/no-write task and bus-input shapes, but the system/radius surface still lacks a first-class N per-system pickup packet proof. Patching collectors first would touch the mixed live path before the boundary is explicit.

Exact next seam:

- Create or extend a pure helper that converts one selected due Watch into Discovery pickup packet data.
- Actor output: one packet preserving `source_lane: "watch"`, `source_kind: "actor"`, `watch_id`, `scope_key`, entity type/id/name, lookback, max refs, max expansions, candidate-only posture, and provider target shape for zKill.
- System/radius output: N packets, one per stored accepted system ID, each preserving `source_lane: "watch"`, `source_kind: "system_radius"`, `watch_id`, `scope_key`, `candidate_system_id`, full `accepted_system_ids`, packet index/count, `accepted_scope_source: "stored_watch_scope"`, center/radius provenance, `center_radius_used_as_authority: false`, lookback, per-system ref cap, and expansion budget reference.
- This helper should not create tasks, invoke dispatch runners, call collectors, call providers, write durable Discovery refs, write Evidence, perform Hydration, or create Observation.

After that proof exists, a later Dev packet can make the runtime collector path consume the same packet shape or enforce accepted-ID preservation before `collectSystemRadiusWatch`.

## 8. Acceptance Criteria

Offline acceptance criteria for the next seam:

- Uses in-memory/local fixtures only.
- No live/provider/API calls.
- No mutation of operator data; table counts for `fetch_runs`, `api_request_logs`, `discovered_killmail_refs`, `killmails`, `activity_events`, metadata/hydration tables, warnings, and Watch rows remain unchanged.
- Disarmed, active-task, live-disabled, inactive, not-due, backoff, no-due, and invalid stored-scope cases emit zero pickup packets.
- Valid actor Watch emits exactly one Discovery pickup packet.
- Valid system/radius Watch with N stored accepted IDs emits exactly N per-system pickup packets.
- Packet `candidate_system_id` values exactly equal the stored accepted IDs, in a deterministic order chosen by the code.
- Center system and radius are present only as provenance/explanation and are not execution authority.
- Invalid, missing, malformed, or empty stored `included_system_ids` block before packet creation.
- Pickup packets are not durable Discovery refs and are not Evidence/EVEidence.
- Hydration and Observation remain untouched.
- Verifier explicitly asserts that the generic `system.radius.watch` service path either preserves accepted IDs or is not part of Watch execution authority.

## 9. Risks / Parked Items

- The real runtime path currently jumps from due selection to collectors; it does not yet stop at a pure pickup packet boundary.
- Real collectors combine Discovery ref acquisition, durable ref writes, ESI expansion, Evidence persistence, warning/API-log writes, and fetch-run lifecycle.
- Generic `system.radius.watch` service execution may drop accepted stored system IDs through scope normalization, even though the default executor direct runner path appears to preserve them.
- `planSystemRadiusWatch` has valid direct/manual center-radius recompute behavior, but that mode must not become Watch execution authority after a stored accepted Watch exists.
- Existing bus input proof is one envelope with the accepted ID set, not N per-system packets.
- Existing stub candidate proof samples two systems and should not be mistaken for complete N fanout.
- `ready_for_discovery` is a readout phrase, not authorization.
- External I/O state is not yet clearly a hard Watch due/tick gate in the inspected path.
- Storage setup/budget gate is not a direct Watch scheduler/tick authority in the inspected path.
- Do not treat candidate refs as durable refs unless `EvidenceRepository.upsertDiscoveredKillmailRefs` or equivalent writes them.
- Do not treat Hydration as Evidence creation.
- Do not treat Watch as Observation.

## 10. Human / Overseer Decisions Needed

- Decide whether the next Dev packet should establish the pure N per-system Discovery pickup packet proof before any live/provider Watch testing. Source trace recommendation: yes.
- Decide whether `external_io` and storage setup should become hard Watch scheduler/tick gates now, or remain separate readout/policy surfaces until a later authority packet.
- Decide whether generic `system.radius.watch` service execution must preserve accepted stored IDs for Watch-originated calls, or whether Watch execution should use a distinct command/payload path.
- Decide when to split collectors so zKill Discovery acquisition, durable Discovery ref writes, and ESI Evidence expansion are separate phases rather than one mixed function.
- Decide whether scheduler wording should avoid packet/acquisition terminology except through explicit pickup-preview surfaces.
