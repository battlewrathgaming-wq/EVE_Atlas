# Data Engineering HS258 - Hydration Request Posture Advisory

Status: advisory artifact  
Role: Data Engineering / Engineering Review  
Date: 2026-06-05  
Request: `workspace/OverseerHS258-hydration-request-posture-advisory-request.md`

## 1. Executive Recommendation

Atlas should model an explicit operator "show me who that is" act as a read-only Hydration request posture, not as queue insertion and not as provider execution.

Recommended shape:

```text
selected unresolved ID
-> explicit operator act
-> local-first lookup
-> request posture row
-> already_local / local_lookup_available / provider_needed / held / blocked / invalid / insufficient_basis
```

This posture should be pickup material for a later bounded execution path. It must not create `metadata_runs`, write `entities`, patch `activity_events`, persist a queue, dispatch a lane, call ESI, or imply provider authorization.

Current Hydration previews already prove most surrounding semantics: candidates, attention posture, execution policy gates, External I/O, live gate, storage gate, and no catch-up flooding. A future read-only selected-ID request preview would be useful before implementation because the existing previews are corpus/candidate oriented, not explicit-request oriented.

## 2. Proposed Request-Posture Fields

Minimum useful posture fields:

| Field | Meaning |
| --- | --- |
| `request_posture_id` | Derived identifier for the preview row, not a persisted queue ID. Suggested shape: `hydration_request:<id_type>:<id_value>:<source_surface>:<basis_digest>`. |
| `id_type` | Supported target class: `character`, `corporation`, `alliance`; future local-only classes may include `inventory_type` or `solar_system`, but those should not become provider ESI name Hydration. |
| `id_value` | Numeric ID. IDs remain facts. |
| `label_state` | `known_local_label`, `stale_local_label`, `provider_needed`, `local_sde_gap`, `unsupported`, or `invalid`. |
| `local_label` | Current local readable label, if any. It is readability cache, not current-truth proof. |
| `local_label_basis` | Local source: `activity_events`, `entities`, `watchlist_entities`, `type_metadata`, `solar_systems`, or other local lookup table. |
| `last_resolved_at` | Best available local provenance timestamp such as `entities.last_enriched_at` or recent `metadata_runs.finished_at`; optional and not a freshness guarantee. |
| `source_surface` | The report / Observation / local readout surface where the operator acted. |
| `source_context` | Narrow context such as `actor_report`, `radius_report`, `system_report`, `corporation_observation`, `metadata_readiness`, or `explicit_id`. |
| `basis_anchor` | Evidence / Observation basis anchors: `killmail_ids`, `event_keys`, report target, Watch scope, or local row reference. |
| `basis_layer` | Should say `Evidence/EVEidence`, `raw-ID Observation`, `local_readability`, or `readiness_diagnostic`; never Discovery as evidence. |
| `request_reason` | For HS258, use `operator_attention`. This means a deliberate act, not focus. |
| `operator_act` | Boolean true only for explicit action. Focus/hover/navigation/report-load must be false. |
| `request_posture_state` | One of the output states in section 4. |
| `pickup_eligible` | True only if posture is eligible for future pickup; still not execution. |
| `provider_needed` | True only for supported entity IDs with no usable local label. |
| `provider_posture` | `not_provider_needed`, `held_by_external_io`, `held_by_cadence`, `released_to_normal_gates_only`, or `blocked`. |
| `gates` | Compact read-only summaries for local lookup, External I/O, live/provider cadence, storage/write posture, and confirmation requirement. |
| `non_authority_flags` | Explicit booleans: `provider_call_authorized: false`, `hydration_write_authorized: false`, `persisted_queue_created: false`, `creates_evidence: false`. |

Do not make `request_posture_id` durable identity yet. It should be derived/read-only unless a later proof shows restart/pickup cannot avoid duplicate work without persistence.

## 3. Proposed Local-First Check Order

1. Validate the target.
   - Numeric positive ID.
   - Supported provider Hydration class for ESI names: `character`, `corporation`, `alliance`.
   - Static type/system IDs should route to local SDE readiness, not ESI name Hydration.

2. Confirm basis.
   - Prefer an Evidence/Observation/report anchor: `killmail_id`, `event_key`, report target, or scoped local row.
   - If the ID is free-floating and not present in local records, classify as `insufficient_basis` unless future policy accepts explicit standalone ID lookup.

3. Check local event labels.
   - `activity_events.entity_name`
   - `character_name`
   - `corporation_name`
   - `alliance_name`

4. Check local entity cache.
   - `entities.entity_name`
   - `entities.last_enriched_at`
   - current corporation/alliance label fields where relevant.

5. Check operator/local attention cache.
   - `watchlist_entities.entity_name`
   - Assessment/Marked presence only as attention/basis, not as label truth.

6. Check static local lookup tables for non-entity labels.
   - `type_metadata`
   - `solar_systems`
   - `regions`
   - `constellations`
   - `system_adjacency` / topology where relevant.

7. Check existing Hydration posture outputs.
   - `metadata.hydration_candidates.preview` for dedupe key and lane context.
   - `metadata.hydration_attention_runtime.preview` for selected/deferred runtime posture.
   - `metadata.hydration_execution_policy.preview` for read-only gate classification.

8. Only then classify provider need.
   - If local label exists, state `already_local` or `local_lookup_available`.
   - If supported entity label is absent, state `provider_needed` or a held/blocked derivative.
   - If SDE/local lookup missing, state `local_lookup_available` when repair is local, or `invalid_or_unsupported_id` / `local_sde_gap` when not provider Hydration.

## 4. Proposed Output States And Meanings

| State | Meaning |
| --- | --- |
| `already_local` | The label is already available in local readability cache. Report construction may reuse it. No provider posture is needed. |
| `local_lookup_available` | The missing report label can be supplied from another local table. This is local readability repair, not provider Hydration. |
| `provider_needed` | Supported entity ID lacks a local label and could be considered for provider-backed Hydration pickup. This is not execution. |
| `held_by_external_io` | Provider-backed pickup would be held because External I/O is off. Held is not failure. |
| `held_by_cadence` | Provider-backed pickup would be held by live/provider cooldown, lockout, or timing. Waiting is not failure. |
| `blocked_by_storage` | Future Hydration write is blocked by storage/setup/budget posture. Local report readout can still show the raw ID if records are readable. |
| `blocked_by_policy` | A higher policy gate says no: unsupported action, missing confirmation, renderer ineligible path, or future enforcement design. |
| `invalid_or_unsupported_id` | Input is malformed, non-positive, or not an accepted Hydration target. |
| `insufficient_basis` | The request lacks an Atlas-local basis anchor. Do not guess or silently call a provider. |
| `deferred_by_priority` | Valid request posture exists but is lower priority than view/local-record or explicit selected attention. |

For the current Human clarification, `stale_local_label` should still be local readability, not automatic provider execution. Freshness should remain a later v2/background-worker concern unless the operator explicitly asks for freshness repair.

## 5. Keeping Focus, Request, Pickup, Execution, And Write Distinct

| Layer | What it means | What it must not do |
| --- | --- | --- |
| Focus / hover / navigation / report load | The operator is looking at a local surface. | Must not create request posture, queue rows, provider calls, or writes. |
| Explicit operator request | The operator deliberately asks to resolve a selected unresolved ID. | Must not bypass local-first checks or gates. |
| Request posture | A read-only classification row saying what would be needed next. | Must not persist a queue, inject a lane, dispatch, call ESI, or write metadata. |
| Pickup eligibility | A future worker/command could pick this up if a later runway implements pickup. | Must not be authorization. Must not create catch-up debt. |
| Provider execution | Actual ESI name lookup under External I/O, live/cadence, storage, confirmation, and policy gates. | Not opened by HS258. |
| Hydration write | Persisting `metadata_runs`, upserting `entities`, and patching `activity_events` labels. | Not opened by HS258. |

The safest phrase is:

```text
Request posture is pickup-readable, not pickup.
Pickup is not execution.
Execution is not write until the write path succeeds under policy.
```

## 6. Existing Services That Can Be Reused

Current reusable posture pieces:

- `hydrationCandidatePreviewService.js`
  - Dedupes local readability demand by candidate key.
  - Separates provider-needed entity labels from local SDE gaps.
  - Emits lane context without provider calls, writes, queue persistence, or schema changes.

- `hydrationAttentionRuntimePostureService.js`
  - Classifies selected/deferred candidates into raw visible, known local, provider-needed, and local SDE gap groups.
  - States selected attention is not provider authorization.

- `hydrationExecutionPolicyPreviewService.js`
  - Reuses backlog/candidate posture and composes storage, External I/O, live/provider, cadence, and composed policy gates.
  - Keeps eligibility separate from authorization.

- `externalIoStateService.js`
  - Provides `held_by_external_io` vs `released_to_normal_gates` semantics.
  - Preserves "on is not authorization" and no catch-up flood.

- `liveApiGateService.js`
  - Provides per-action provider/cadence posture for `metadata.hydration`.
  - Keeps request control service-memory-only and avoids cooldown consumption on read-only checks.

- `storageSetupGateReadoutService.js`
  - Classifies fast/view metadata Hydration and background Hydration write posture from storage/budget state.

- `reportHydrator.js`
  - Should be treated as the later explicit execution/write-capable path, not as request posture.
  - It currently combines metadata run creation, local known-name patching, provider lookup, entity upsert, and activity-event label patches. A request-posture preview should sit before this path.

## 7. Whether A Future Read-Only Preview Is Needed

Yes, a narrow future read-only preview is recommended before implementation if this seam continues.

Suggested command concept, for Overseer shaping only:

```text
metadata.hydration_request_posture.preview
```

Purpose:

- accept a selected ID plus local source context;
- prove focus is not request by requiring an explicit request marker;
- run local-first classification;
- emit one posture row plus gate summaries;
- return `already_local`, `provider_needed`, held, blocked, invalid, or insufficient-basis state;
- create no queue, no dispatcher, no provider call, no metadata run, and no writes.

This preview should not design a broad provider work queue. It should be a single selected-ID posture proof that can later feed either view/local-record Hydration or Watch-originated readability pickup.

Existing previews are strong enough for surrounding policy, but they are not quite the same as "operator explicitly selected this unresolved ID and asked." The new preview would close that semantic gap cleanly.

## 8. Smallest Next Dev Packet, If Any

Not ready for execution or write-capable Dev.

Smallest possible future Dev packet, only if Overseer chooses to continue, would be a read-only selected-ID Hydration request posture preview:

- no provider calls;
- no Hydration writes;
- no metadata run creation;
- no `entities` writes;
- no `activity_events` patches;
- no queue persistence;
- no dispatcher;
- no schema;
- no UI;
- no runtime enforcement;
- no support artifacts.

The packet should prove:

- focus/hover/report-load input is rejected or classified as `not_a_request`;
- explicit operator act is required;
- local labels short-circuit to `already_local`;
- local SDE/type/system gaps stay local lookup posture;
- unsupported IDs become `invalid_or_unsupported_id`;
- missing basis becomes `insufficient_basis`;
- provider-needed entity labels are held/blocked/released only to normal gates;
- no duplicate durable work is created because nothing is persisted.

## 9. Parked Items

- UI hover/focus implementation.
- Terminal input strip behavior.
- Context hotkeys.
- Mouse context menu.
- Provider-backed Hydration execution.
- Hydration writes and `metadata_runs`.
- Durable request/queue persistence.
- Dispatcher, leases, retries, or worker pickup.
- Watch pickup implementation.
- Freshness refresh policy for stale local labels.
- Schema changes.
- Runtime enforcement or command blocking.
- Support artifacts.

## 10. Verification Evidence

Files / context reviewed:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/OverseerHS258-hydration-request-posture-advisory-request.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `docs/features/data-layer-boundaries.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `workspace/DataEngineeringHS256-local-readability-report-construction-audit.md`
- `workspace/OverseerHS257-hs256-local-readability-review.md`
- `src/main/db/schema.sql`
- `src/main/metadata/reportHydrator.js`
- `src/main/services/hydrationCandidatePreviewService.js`
- `src/main/services/hydrationExecutionPolicyPreviewService.js`
- `src/main/services/hydrationAttentionRuntimePostureService.js`
- `src/main/services/externalIoStateService.js`
- `src/main/services/liveApiGateService.js`
- `src/main/services/storageSetupGateReadoutService.js`
- `scripts/verify-hydration-candidate-preview.js`
- `scripts/verify-hydration-execution-policy.js`
- `scripts/verify-external-io-state.js`
- `scripts/verify-live-api-gate.js`
- `package.json`

Checks run:

```text
npm.cmd run verify:hydration-candidate-preview
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:hydration-attention-runtime
npm.cmd run verify:external-io-state
npm.cmd run verify:live-api-gate
git status --short --branch
```

Results:

- `verify:hydration-candidate-preview` passed and reported no provider calls, no Hydration writes, no persisted queue, IDs as facts, and labels as readability.
- `verify:hydration-execution-policy` passed and reported eligibility is not authorization, no provider calls, no writes, no queue, and no catch-up flood.
- `verify:hydration-attention-runtime` passed and reported selected attention is not provider authorization, local readout remains available, and provider-needed labels are held by External I/O when off.
- `verify:external-io-state` passed. It performs fixture/offline config write proof only, reported no real project config write, no provider calls, no queue dispatch, no Evidence/EVEidence writes, and no Hydration writes.
- `verify:live-api-gate` passed and confirmed provider gate/cadence behavior, including `metadata.hydration` gate checks not consuming cooldown during read-only local checks.
- Final `git status --short --branch` showed this branch on `main...origin/main` before the HS258 artifact file was added.

No live/API/provider calls were run. No Hydration execution or Hydration writes were run. No queue, dispatcher, schema, UI, runtime enforcement, command blocking, Watch mutation, support artifact, pruning/deletion, Evidence/EVEidence write, or Discovery mutation was added by this advisory.

## 11. Human / Overseer Decisions Needed

No Human product-direction decision is required to accept this advisory.

Overseer decision needed if continuing:

- Accept or adjust the proposed posture field set and state names.
- Decide whether to open a future read-only selected-ID posture preview.
- Keep execution, writes, queue persistence, UI trigger behavior, and freshness refresh policy parked until separately scoped.

