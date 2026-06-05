# Data Engineering HS262 - Hydration Request Pickup Shaping Advisory

Status: advisory artifact
Role: Data Engineering / Architecture Review
Date: 2026-06-05
Request: `workspace/OverseerHS262-hydration-request-pickup-shaping-advisory-request.md`

## 1. Executive Recommendation

Atlas should define Hydration request pickup as a narrow, explicit, non-durable handoff boundary for a selected-ID request posture. It should mean:

```text
an execution-capable future command accepts a current selected-ID posture as candidate work,
then immediately re-derives local-first posture and gates before any provider execution can begin
```

Pickup should not be a queue row, background dispatcher packet, retry lease, provider call, `metadata_runs` row, `entities` write, `activity_events` label patch, or Hydration write.

For the current selected-ID surface, persistence is not needed now. Atlas can keep pickup as read-only eligibility plus a future explicit execution command because the operator can re-request the same ID and Atlas can re-check local state at the moment of action. Durable pickup/checkpoint state should remain deferred until Watch/background Hydration or worker-based execution creates a real restart/retry problem.

Do not pass HS260 posture directly into the existing `metadata.hydration` command as though that were pickup. The existing write-capable Hydration path is execution-shaped: it can create `metadata_runs`, contact ESI, upsert labels, and patch local readability. A future execution path may reuse pieces of it, but pickup needs a just-in-time revalidation boundary before that path starts.

## 2. Proposed Definition Of Pickup

Recommended definition:

```text
Pickup is the explicit acceptance of a current Hydration request posture as candidate work for a future execution command.
```

Properties:

- selected-ID pickup is initiated by an explicit operator act, not by focus, hover, navigation, report load, or local label reuse;
- pickup is derived from current local records and current gates, not from stale renderer memory;
- pickup is non-durable for now;
- pickup can only be considered when posture is `provider_needed` and released to normal gates;
- pickup must re-run local-first checks before any provider execution because another local label may have appeared since preview;
- pickup does not authorize a provider call and does not promise a write;
- pickup does not create request debt, catch-up behavior, or background work after restart.

Safer temporary wording for internal shaping:

```text
pickup candidate
pickup-readable posture
selected-ID pickup candidate
```

Avoid treating `pickup_eligible` as "queued", "scheduled", "authorized", or "will run".

## 3. Distinction Between Posture, Pickup, Execution, And Write

| Layer | Meaning | Must not do |
| --- | --- | --- |
| Focus / report load | Operator is viewing a local surface. | Must not create request posture or provider-backed work. |
| Request posture | Read-only classification of a selected ID after explicit operator act and local-first checks. | Must not create pickup, queue rows, provider calls, or writes. |
| Pickup | Future explicit acceptance of the current posture as candidate work after revalidation. | Must not execute, persist retry state, or imply authorization. |
| Execution | Provider-facing attempt under External I/O, live/cadence, storage, confirmation, and command policy gates. | Must not be assumed from eligibility or pickup. |
| Write | Successful persistence of Hydration output, such as `metadata_runs`, `entities`, and allowed label patches. | Must not happen unless execution returns usable results and write policy succeeds. |

The accepted boundary remains correct:

```text
Request posture is pickup-readable, not pickup.
Pickup is not execution.
Execution is not write until the write path succeeds under policy.
```

## 4. Minimum Facts Needed Before Pickup

Before selected-ID pickup can exist, Atlas should require at least:

- explicit operator act, still current at the time of pickup;
- supported ID type and numeric safe ID value;
- Atlas-local basis such as local Evidence/EVEidence row, raw-ID Observation/report context, activity row, Watch context, Assessment anchor, or other accepted local basis;
- source surface/context so the operator action is inspectable;
- request reason, currently safest as `operator_attention`;
- local-first lookup re-run against `activity_events`, `entities`, `watchlist_entities`, local SDE/type/system tables, and other accepted local readability sources;
- local label short-circuit, because existing labels should be used locally and must not become provider Hydration;
- provider-needed state after local-first checks;
- External I/O released to normal gates, not merely configured somewhere;
- live/provider gate and cadence posture checked without consuming attempt state during preview;
- storage/write posture ready for future Hydration write;
- confirmation requirement satisfied where the future command requires it;
- request digest or equivalent stable comparison material, recomputed by trusted main-process code.

The posture/gate summary passed from a renderer or report surface should be treated as an explanation, not authority. Future execution should rebuild the facts server-side.

## 5. Persistence Recommendation

Persistence should remain deferred.

Selected-ID pickup is meaningful without persistence because it is an immediate operator action over a visible local record. If the app restarts, Atlas should lose that non-durable pickup candidate rather than resume hidden provider work. The operator can request the unresolved ID again, and the posture can be re-derived from local records.

Durable state may become necessary later if Atlas accepts one of these behaviors:

- background Hydration workers that continue after the initiating surface disappears;
- Watch/background Hydration pickup that must survive restart;
- retry/lease semantics across provider cooldowns or crashes;
- operator-visible asynchronous tasks where the user expects continuation;
- durable fairness/caps across many pending candidates.

Until one of those exists, durable pickup rows would add more risk than value. They could create hidden work, restart catch-up pressure, stale policy decisions, or a broad provider queue by accident.

## 6. Duplicate / Hidden-Work Risk Model

Main risks:

- stale preview risk: an old `provider_needed` posture is picked up after a local label has since been resolved;
- double-click risk: repeated operator actions start duplicate provider attempts for the same ID;
- multi-surface risk: two reports expose the same unresolved ID with different basis anchors;
- restart risk: persisted pickup rows silently run later without the operator seeing the original context;
- External I/O re-enable risk: held requests all dispatch at once when provider access is re-enabled;
- storage unlock risk: previously blocked posture becomes a sudden write backlog;
- Watch/background collision risk: selected-ID attention competes with patient background Hydration under one vague bucket;
- existing-command collapse risk: routing pickup directly into `metadata.hydration` loses the distinction between pickup, execution, metadata run creation, provider calls, and writes.

Recommended controls:

- re-run `metadata.hydration_request_posture.preview` or equivalent trusted logic at pickup time;
- short-circuit to local readability if any label now exists;
- compare a trusted request digest only as freshness evidence, not as authorization;
- dedupe active execution attempts by `id_type`, `id_value`, and basis/purpose if a future task runner is involved;
- keep held/blocked posture non-eligible for pickup;
- require explicit re-entry through normal gates after restart, External I/O re-enable, storage unlock, or cadence release;
- do not persist attempt logs just to avoid duplicates unless the execution model actually needs durable retry/recovery;
- keep Watch/background Hydration under a separate policy lane even if it shares some payload fields.

This lets Atlas avoid duplicate work after restart without over-persisting attempt logs: no durable pickup means no hidden debt, and just-in-time local-first recheck prevents unnecessary provider calls when the label has become local.

## 7. How Future Execution Should Consume Pickup Material

A future selected-ID execution command should consume pickup material as input hints only, then rebuild authority from local state.

Useful input shape:

- `id_type`
- `id_value`
- `source_surface`
- `source_context`
- `basis_anchor`
- `basis_layer`
- `request_reason`
- `request_posture_id` or `request_digest`
- compact posture/gate summary for explanation
- confirmation token where required by the command authority model

Trusted execution flow should be:

```text
explicit execution request
-> normalize selected ID
-> rebuild local-first request posture
-> reject not_a_request / invalid / insufficient_basis / already_local / local_lookup_available / held / blocked
-> confirm provider_needed and released-to-normal-gates posture
-> satisfy command confirmation and active policy
-> begin provider execution
-> write only after provider result and write policy succeed
```

The future command should not trust renderer-provided gate summaries, local labels, storage posture, External I/O posture, or live/cadence posture. It should recompute them.

The existing `metadata.hydration` path can remain the write-capable Hydration command family, but selected-ID pickup should not be modeled as a blind pass-through to it. The current path is report/target shaped and creates `metadata_runs` before provider resolution. If a later packet wants selected-ID execution, it should either add a narrow execution wrapper that revalidates then calls the appropriate hydrator, or split the current hydration internals enough to preserve the pickup/execution/write boundaries.

## 8. Selected-ID Pickup Versus Watch / Background Pickup

Selected-ID pickup:

- originates from an immediate explicit operator act;
- targets one selected unresolved ID;
- should prefer current view/report/Observation basis;
- can remain non-durable for now;
- should not survive restart as hidden work;
- should outrank background Hydration when the operator is inspecting a record;
- should still obey External I/O, cadence, storage, confirmation, and policy gates.

Watch/background Hydration pickup:

- originates from durable Watch/acquisition/readability context, not the same operator act;
- may cover many IDs created by acquisition fanout;
- needs patient caps, fairness, and no catch-up flood semantics;
- may eventually need durable movement identity if workers, retries, or restart recovery are accepted;
- should not inherit selected-ID confirmation or urgency;
- must remain separate from Watch acquisition intent and ESI Evidence Expansion.

The two can share a small work-request vocabulary later, such as identity, basis, reason, source lane, gate summary, and priority. They should not share one undifferentiated provider queue or one policy meaning. Acquisition and Hydration should remain separate, and View/selected-ID Hydration should not be starved by patient Watch/background Hydration.

## 9. Smallest Next Dev Packet, If Any

No write-capable Dev packet is recommended from this advisory.

Atlas is not ready for provider-backed selected-ID Hydration execution, durable pickup persistence, dispatcher work, leases, retries, worker pickup, schema change, UI trigger behavior, or broad provider queue design from HS262 alone.

If Overseer wants one more proof before execution design, the smallest safe future Dev packet would be read-only only:

```text
selected-ID Hydration pickup eligibility / execution-input contract preview
```

It should prove:

- `pickup_eligible` never means execution or authorization;
- held/blocked/already-local/local-lookup/invalid/insufficient-basis states are not pickup candidates;
- future execution input can be built from selected-ID posture without persisting a queue;
- request digest comparison is explanatory/freshness material only;
- revalidation is required before any execution;
- no provider calls, writes, `metadata_runs`, queue persistence, dispatcher, schema, runtime enforcement, support artifacts, Watch mutation, or UI work.

This packet is optional. The model is coherent enough for Overseer shaping, but not ready for Dev execution.

## 10. Parked Items

- Provider-backed selected-ID Hydration execution.
- Any new `metadata.hydration` execution wrapper or command split.
- Hydration writes and `metadata_runs` creation beyond existing accepted paths.
- Durable Hydration request/pickup/queue tables.
- Dispatcher, leases, retries, workers, or restart recovery.
- Watch/background Hydration pickup implementation.
- Shared provider queue design.
- Freshness refresh policy for stale local labels.
- External I/O re-enable behavior changes.
- Runtime enforcement activation or command blocking.
- Schema changes.
- Renderer UI, hover/focus behavior, context menus, hotkeys, and terminal-strip behavior.
- Support artifacts.
- Assessment Memory or Marked mutation.
- Pruning/deletion.

## 11. Verification / Evidence Reviewed

Files and context reviewed:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `workspace/OverseerHS258-hydration-request-posture-advisory-request.md`
- `workspace/DataEngineeringHS258-hydration-request-posture-advisory.md`
- `workspace/OverseerHS259-hs258-hydration-request-posture-review.md`
- `workspace/OverseerHS260-selected-id-hydration-request-posture-preview-runway.md`
- `workspace/DevHS260-selected-id-hydration-request-posture-preview.md`
- `workspace/OverseerHS261-hs260-selected-id-hydration-request-posture-review.md`
- `workspace/OverseerHS262-hydration-request-pickup-shaping-advisory-request.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/data-layer-boundaries.md`
- `docs/contracts/metadata-hydration-contract.md`
- `src/main/services/hydrationRequestPostureService.js`
- `src/main/services/hydrationExecutionPolicyPreviewService.js`
- `src/main/services/hydrationAttentionRuntimePostureService.js`
- `src/main/services/mutatingActionService.js`
- `src/main/metadata/reportHydrator.js`
- `src/main/services/serviceRegistry.js`
- `src/main/db/schema.sql`

Targeted checks run:

```text
npm.cmd run verify:hydration-request-posture
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:hydration-attention-runtime
git status --short --branch
```

Results:

- `verify:hydration-request-posture` passed. It verified `not_a_request`, `already_local`, `local_lookup_available`, `local_sde_gap`, `held_by_external_io`, `blocked`, `insufficient_basis`, and `invalid` states. It reported no pickup creation, no execution, no provider calls, no Hydration writes, no `metadata_runs`, no entity writes, no activity-event label patches, no queues, no dispatcher, and no schema/runtime/UI work.
- `verify:hydration-execution-policy` passed. It preserved Hydration as readability repair, reported eligibility is not authorization, and confirmed no provider calls, writes, queues, or schema work.
- `verify:hydration-attention-runtime` passed. It confirmed selected attention is not provider authorization, missing labels are not report failure, local SDE gaps are not provider Hydration, Watch/background does not starve view/local-record posture, and no persisted Hydration queue was created.
- `git status --short --branch` showed `## main...origin/main` before this advisory artifact was added.

No live/API/provider calls were run. No implementation, schema, queue, dispatcher, Hydration execution, Hydration write, Watch mutation, support artifact, runtime enforcement, command blocking, pruning/deletion, UI work, or Dev runway was created by this advisory.

## 12. Human / Overseer Decisions Needed

Overseer decision recommended:

- accept, adjust, or reject the proposed definition of pickup as non-durable selected-ID candidate acceptance with mandatory revalidation;
- decide whether HS262 is enough shaping for now or whether a read-only pickup eligibility / execution-input contract preview is worth a future bounded packet;
- keep provider-backed execution, persistence, dispatcher/worker design, Watch/background pickup, and UI behavior parked unless deliberately opened later.

No Human product-direction decision is required to accept this artifact unless the Human wants pickup to mean durable background work. That would be a meaningful change and should be decided explicitly before any Dev packet.
