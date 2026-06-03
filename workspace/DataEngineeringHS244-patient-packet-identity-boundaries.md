# Data Engineering HS244 - Patient Packet Identity Boundaries

Status: advisory artifact
Date: 2026-06-03
Role: Data Engineering / Data Analyst
Milestone: Atlas Storage And Runtime Hardening

## 1. Executive Recommendation

Do not create a broad provider work queue yet.

Atlas currently has enough durable state and read-only posture surfaces to derive most patient work posture without new schema:

- Watch rows carry durable acquisition intent.
- `discovered_killmail_refs` carries durable Discovery ref identity and expansion staging.
- `killmails`, `activity_events`, `fetch_runs`, `api_request_logs`, `ingestion_audits`, and `data_quality_warnings` carry evidence/provenance/recovery state.
- `metadata.hydration_candidates.preview`, `metadata.hydration_backlog.preview`, and Hydration runtime/policy previews already derive stable readability demand without a persisted Hydration queue.
- `runtime.queue_clock_posture.preview` composes this into inspectable posture, but it is evidence/readout only, not architecture authority and not execution authority.

The smallest future durable unit, if Atlas later needs one, should be lane-specific:

```text
Acquisition movement intent/checkpoint:
  Watch/scope/cadence identity for zKill Discovery
  Discovery ref identity for ESI Evidence Expansion

Hydration movement intent/checkpoint:
  Hydration candidate key + lane + basis policy
```

These should not be collapsed into one generic provider packet unless a later proof shows shared persistence is necessary.

## 2. Current Model Summary From Atlas Docs / Schema / Code

Current accepted model:

```text
Discovery -> Evidence/EVEidence -> relationships/appearances -> Observation -> Assessment Memory
```

Current clock split:

```text
Acquisition Clock:
  zKill Discovery lane
  ESI Evidence Expansion lane

Hydration Recovery Clock:
  Watch/background Hydration lane
  view/local-record Hydration lane
```

Important current structures:

- `watchlist_entities` and `system_watches` store Watch acquisition intent, scope, cadence, caps, and schedule timestamps.
- `discovered_killmail_refs` stores possible leads/provenance and ESI expansion staging.
- `killmails` stores ESI-expanded Evidence/EVEidence.
- `activity_events` stores normalized relationship/appearance rows derived from Evidence/EVEidence.
- `fetch_runs`, `api_request_logs`, `ingestion_audits`, and `data_quality_warnings` store provider/provenance/recovery context.
- `metadata_runs`, `entities`, `type_metadata`, `solar_systems`, and related local SDE tables support readability repair and local metadata.

HS242 adds `runtime.queue_clock_posture.preview`, which composes current posture without dispatching or persisting packet state.

## 3. Recommended Future Unit-Of-Work Model

Use the smallest durable identity that matches the lane.

Recommended model:

```text
1. zKill Discovery movement intent
   durable basis: Watch config or explicit manual scope
   identity: clock + source + target/scope + lookback + cadence/cap policy version

2. ESI Evidence Expansion candidate
   durable basis: Discovery ref
   identity: killmail_id + killmail_hash + discovered_by_type + discovered_by_id

3. view/local-record Hydration candidate
   durable basis: current view/report/local record demand
   identity: hydration candidate key + lane + source anchors + freshness/basis policy

4. Watch/background Hydration candidate
   durable basis: local Evidence-derived IDs plus Watch/interest context
   identity: hydration candidate key + lane + Watch/attention basis + freshness/basis policy
```

Do not use one shared durable packet table yet. The lanes share gates, not meaning.

## 4. What Should Stay Derived / Read-Only For Now

These can remain derived from existing state:

- Queue/clock posture.
- Watch offline/restart posture.
- Due/held/waiting state.
- Existing pending Discovery refs that should be handled before fresh zKill Discovery.
- ESI expansion candidates computable from `discovered_killmail_refs`.
- Hydration candidates and backlog demand.
- View/local-record Hydration priority.
- Watch/background Hydration priority.
- Local SDE lookup gaps.
- External I/O hold posture.
- Storage/setup and budget posture.
- Provider cadence/cooldown posture where service-memory/state readout is enough for current proof level.

Derived posture is sufficient while there is no dispatcher and no provider-backed background execution.

## 5. What Might Need Durable Persistence Later

Future persistence may be justified only if Atlas needs behavior that cannot be safely reconstructed after restart.

Possible future durable state:

- A small movement checkpoint for a long-running active provider batch.
- A lease/claim record if more than one worker/process can move the same work.
- A durable retry/backoff checkpoint when provider `Retry-After` or capacity waits need to survive restart.
- A bounded packet/run correlation record if operator review needs "this planned packet became these refs/runs/warnings."
- A Hydration execution checkpoint only after provider-backed Hydration exists and if deduped derived candidates are not enough.

Do not persist high-volume attempt logs as a substitute for this. Attempt history belongs in existing `fetch_runs`, `api_request_logs`, `metadata_runs`, and warning rows unless a specific recovery defect proves otherwise.

## 6. Acquisition Packet Identity Recommendation

Acquisition should not have one universal packet identity.

### zKill Discovery Identity

Use Watch or explicit scope as durable intent.

Stable identity should include:

```text
clock: acquisition
lane: zkill_discovery
source_type: watch | manual | future_scoped_source
watch_type / watch_id when Watch-driven
target type and target ID
scope/radius basis when system/radius
lookback
cadence policy version
cap policy version
provider/action fingerprint
```

This identity describes "what Atlas is allowed to ask zKill next," not Evidence.

### ESI Evidence Expansion Identity

Use the Discovery ref as the smallest unit:

```text
killmail_id
killmail_hash
discovered_by_type
discovered_by_id
status
priority
selected_for_expansion_at when explicit selection exists
```

This avoids making `discovered_killmail_refs` the sequencer. The row is staging/provenance. The future expansion executor can select from it under caps and gates, but the row itself is not a sequencer packet.

## 7. Hydration Packet Identity Recommendation

Hydration identity should be candidate-based, not provider-attempt-based.

Use:

```text
clock: hydration_recovery
lane: view_local_record | target_report_scoped | watch_background | corpus_hygiene_low_priority | local_sde_lookup
candidate_kind: entity_label | local_sde_lookup | event_display_patch
dedupe_key: entity:type:id or local_sde:type:id
source_anchors: killmail IDs / report target / Watch basis / local lookup table
freshness_policy_version
basis_policy_version
```

Provider endpoint, chunk number, and request URL are attempt details. They should not define the local readability need.

View/local-record Hydration should remain ahead of background Hydration. Watch/background and corpus hygiene may wait.

## 8. Restart Recovery And Duplicate-Work Prevention Model

Atlas can avoid duplicate work after restart primarily by recomputing from durable local facts:

- zKill Discovery: Watch rows expose scope, cadence, caps, next poll, backoff, and last movement.
- ESI Expansion: `discovered_killmail_refs` status plus `killmails` cache state prevents duplicate Evidence writes.
- Hydration: candidate dedupe keys, `entities`, activity-event label columns, local SDE tables, and `metadata_runs` context prevent repeated unreadability work from being mistaken for new facts.
- Running/partial work: `fetch_runs`, `api_request_logs`, warnings, and `metadata_runs` provide recovery context.

Do not persist every attempted request. Persist enough accepted movement/provenance to reconstruct the operator review state and retry safely.

Duplicate prevention should prefer idempotency and cache checks:

```text
Discovery:
  same scope may refresh refs, but refs dedupe by killmail/hash/scope identity.

Expansion:
  skip already-cached killmails before provider call.
  do not overwrite existing raw ESI Evidence casually.

Hydration:
  dedupe by local candidate key.
  skip known local labels unless freshness policy says stale.
  local SDE gaps stay local lookup posture, not ESI Hydration.
```

## 9. No-Catch-Up-Flood Model

After restart, storage unlock, or External I/O re-enable, Atlas should recompute posture and re-enter normal gates.

Rules:

- Missed slots do not create request debt.
- External I/O re-enable is not authorization.
- Storage unlock is not authorization.
- Watch session arming remains distinct from provider permission.
- Provider work must still pass External I/O, storage, cadence/live gate, Watch/session gate where relevant, active task/duplicate checks, caps, and confirmation.
- Dispatch, if implemented later, should remain bounded: at most one small unit per tick or explicit selected batch until separately proven.

The safe next step after any release event is:

```text
recompute local posture
prefer existing local refs/work
apply normal gates
move only bounded eligible work
```

## 10. Relationship To `discovered_killmail_refs`

`discovered_killmail_refs` should remain:

- possible leads
- provenance
- queue/staging for ESI Evidence Expansion
- local dedupe/checkpoint material

It must not become:

- Evidence/EVEidence
- an Observation fact source
- a sequencer packet table
- a provider attempt ledger
- proof of complete local coverage

Pending Discovery refs should normally hold fresh zKill Discovery for the same scope because Atlas already has local possible leads to review or expand. This hold should not block the separate ESI Evidence Expansion lane from selecting eligible refs under its own gates.

## 11. Relationship To `metadata_runs` And Hydration Candidates

`metadata_runs` should remain Hydration provenance and recent context. It should not become the Hydration queue.

Hydration candidates can remain derived for now from:

- `activity_events`
- `entities`
- `metadata_runs`
- Watch/Marked/Assessment-adjacent local context
- local SDE lookup tables

If provider-backed Hydration later needs persistence, persist candidate intent/checkpoint by local readability need, not provider attempt.

Recommended priority remains:

```text
view/local-record first
target/report-scoped next
Watch/background patient
corpus hygiene deferred
local SDE lookup gaps handled as local readiness/import posture
```

## 12. Risks, Ambiguities, And False Simplifications To Avoid

Avoid these simplifications:

- "A packet is a provider request." Too low-level and attempt-shaped.
- "A packet is a Discovery ref." This turns `discovered_killmail_refs` into a sequencer.
- "Acquisition and Hydration are the same queue." They have different truth effects.
- "Hydration is expansion." Hydration repairs readability; ESI Evidence Expansion creates Evidence/EVEidence.
- "External I/O on means go." It only releases work to normal gates.
- "Restart should catch up." Restart should recompute posture, not replay debt.
- "Failed provider movement means failed Evidence." Retryable waits and capacity holds are not terminal Evidence failures.
- "Local SDE gaps are provider Hydration." Static type/geography lookup is local readiness/import posture.
- "View Hydration can wait behind background Hydration." It should not unless a shared gate truly applies.

Ambiguities still needing future decision:

- Exact policy versioning for Hydration freshness.
- Exact priority/cap rules for selected ESI expansion after pending refs accumulate.
- Whether future Watch/background Hydration should ever persist a durable checkpoint.
- Whether multi-process workers or Link-like external coordination will require leases/claims.
- How long service-memory provider cooldowns should remain non-durable.

## 13. Smallest Next Dev Packet Recommendation, If Any

Recommended only if Overseer/Human wants another bounded proof:

```text
Read-only patient packet identity conformance preview.
```

Purpose:

Map current derived posture into proposed lane-specific identity shapes without creating tables, queues, dispatcher behavior, provider calls, writes, or runtime enforcement.

This should not implement a packet store. It should answer: "If Atlas needed a future durable unit, what identity would each current candidate have, and can it be derived now?"

If Human/Overseer does not want another proof, this advisory is enough design context to keep patient packet persistence parked.

## 14. Acceptance Criteria For That Future Packet

If opened, a future read-only proof should:

- emit candidate identity rows for zKill Discovery, ESI Evidence Expansion, view/local-record Hydration, and Watch/background Hydration
- keep Acquisition and Hydration as separate shapes
- mark every identity as derived/read-only and not persisted
- use Discovery refs only as possible leads/provenance
- use ESI expansion identity from `killmail_id` + hash + scope/ref context
- use Hydration identity from dedupe candidate key + lane + source anchors + policy version
- show duplicate-prevention basis for each identity
- show no-catch-up policy for restart/unlock/External I/O re-enable
- expose unknown/uncomputable facts instead of guessing
- run without provider calls, writes, schema changes, dispatcher, enforcement, support artifacts, or UI

## 15. Verification Evidence Expected

Expected verification for a future read-only proof:

```text
node --check src/main/services/<new-preview-service>.js
node --check scripts/<new-verifier>.js
npm.cmd run verify:<new-preview>
npm.cmd run verify:queue-clock-posture
npm.cmd run verify:queue-selection
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:hydration-candidate-preview
npm.cmd run verify:hydration-backlog-preview
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:external-io-state
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Verifier fixtures should prove:

- no table counts change
- no provider calls occur
- no Discovery refs mutate
- no Evidence/EVEidence writes occur
- no Hydration writes occur
- no Watch/session state mutates
- no support artifacts are created
- view/local-record Hydration is not starved behind Watch/background Hydration
- pending Discovery refs are treated as local work before fresh zKill Discovery
- External I/O off holds provider-backed movement as non-failure
- External I/O on does not authorize immediate dispatch or catch-up flood

## 16. Human / Overseer Decisions Needed

Decisions before any persistence or dispatcher:

- Whether the next step should be another read-only identity conformance proof or whether patient packet identity should remain parked design context.
- Whether future durable state should be allowed at all before active dispatcher need is proven.
- Whether provider cooldown/Retry-After state must become durable or can remain service-memory until a concrete restart defect appears.
- Whether Hydration freshness policy needs a durable policy version before provider-backed Hydration execution.
- Whether Watch/background Hydration ever deserves durable checkpointing, or whether it should remain derived from local candidates and normal gates.
- Whether multi-worker or cloud/peer coordination is in scope; if so, durable lease/claim state may become necessary, but that is a different seam.

## Boundary Confirmation

This advisory does not implement code, write schema, create a Dev runway, authorize provider calls, dispatch work, activate runtime enforcement, block commands, create support artifacts, prune/delete records, mutate Discovery refs, write Evidence/EVEidence, write Hydration labels, mutate Watch/Marked/Assessment state, or define UI.

## Evidence Used

Read from local disk:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `workspace/OverseerHS244-patient-packet-identity-data-engineering-request.md`
- `workspace/OverseerHS243-hs242-queue-clock-posture-review.md`
- `workspace/DevHS242-queue-clock-runtime-posture-preview.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/data-layer-boundaries.md`
- `docs/features/persistent-discovery-ref-queue.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `src/main/services/queueClockPostureService.js`
- `src/main/services/hydrationCandidatePreviewService.js`
- `src/main/services/hydrationBacklogPreviewService.js`
- `src/main/services/hydrationExecutionPolicyPreviewService.js`
- `src/main/services/hydrationAttentionRuntimePostureService.js`
- `src/main/services/queueSelectionService.js`
- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/services/liveApiGateService.js`
- `src/main/db/schema.sql`
- `scripts/verify-queue-clock-posture-preview.js`

No tests were run because this was advisory-only and no runtime behavior changed.

