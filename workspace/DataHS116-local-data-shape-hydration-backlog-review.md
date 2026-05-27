# Data HS116: Local Data Shape And Hydration Backlog Review

Date: 2026-05-27
Role: Atlas Data Analyst / Data Engineer
Status: Advisory artifact only

## Request Received

Review Atlas local data shape for operator-output usefulness and hydration backlog design.

Questions:

1. Can current local data assemble useful operator output without boundary drift?
2. What should a Hydration backlog item be, if Atlas later needs one?

Explicit constraints:

- Do not implement code.
- Do not create a Dev runway.
- Do not change schema.
- Do not rename terms.
- Do not treat zKill preview as Evidence.
- Do not treat hydration as Evidence creation.
- Do not treat Assessment Memory as proof.
- Be critical / not agreeable.

## Files Reviewed

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/features/observation-lookup-model.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
- `workspace/SystemsAuditHS101-local-lookup-vs-esi-enrichment.md`
- `workspace/SystemsAuditHS102-pruning-readiness.md`
- `workspace/SystemsAuditHS107-zkill-esi-trust-boundary.md`
- `workspace/SystemsAuditHS110-external-io-storage-edge-policy-table.md`
- `src/main/db/schema.sql`
- `src/main/db/evidenceRepository.js`
- `src/main/metadata/reportHydrator.js`
- `src/main/reports/actorReport.js`
- `src/main/reports/radiusReport.js`
- `src/main/reports/corporationObservationReport.js`
- `src/main/reports/operatorReport.js`
- `src/main/reports/collectionProvenance.js`
- `src/main/services/reportResponseService.js`
- `src/main/services/mutatingActionService.js`

Requested but not found:

- `src/main/reports/corporationReport.js`

Current corporation report code appears to live at `src/main/reports/corporationObservationReport.js`.

## Executive Recommendation

Atlas can assemble useful local operator output today, but only for questions whose answer is explicitly framed as stored Evidence/EVEidence plus local lookup labels and provenance. It is not yet robust enough to present a broad "story" surface without additional boundary readout. The data can support useful actor, radius/system, corporation, queue, corpus health, and hydration-readiness outputs, but the report layer still carries wording and label-shape risks that can make weak local facts look stronger than they are.

Critical recommendation:

Do not add persistent Hydration backlog tables now. First prove a read-only derived backlog report from existing local data. The current schema already exposes enough to derive missing-label work from `activity_events`, `entities`, `type_metadata`, local SDE tables, `watchlist_entities`, `metadata_runs`, report raw IDs, and Watch/Marked context. Persisting backlog state before proving priority lanes, idempotency keys, caps, stale-label rules, provider gates, and deletion invalidation would create a second queue-shaped system with unclear authority.

The smallest worthwhile next proof, if Human/Overseer want one, is a read-only Hydration backlog preview that emits candidate items and pressure counts without provider calls, writes, schema changes, or cadence behavior. It should prove that Atlas can separate:

- missing readability labels
- stale readability labels
- view/local-record priority
- Watch/Marked priority
- corpus hygiene
- provider gate state
- local-only fallback
- deleted/pruned relationship invalidation

## Representative Operator Questions And Local Data Sources

| Operator question | Local data sources | Current answer quality |
| --- | --- | --- |
| What stored evidence do we have for this pilot/corporation/alliance? | `activity_events.entity_type`, `activity_events.entity_id`, `killmails.killmail_id`, `killmails.killmail_time`, `killmails.raw_esi_payload`, `entities`, `watchlist_entities` | Sound if reported as stored Evidence sample, not complete truth. |
| Where has this actor appeared recently? | `activity_events.solar_system_id`, `solar_systems`, `regions`, `activity_events.killmail_time` | Sound with time window and stored-evidence basis. Degrades if SDE labels missing. |
| What ships does this actor/corp use in stored evidence? | `activity_events.ship_type_id`, `activity_events.ship_type_name`, `type_metadata` | Sound for local rows. Missing type labels are degraded display, not missing evidence. |
| Is this actor repeatedly active or multi-system? | `activity_events`, report aggregation in `actorReport`, `radiusReport`, `observationMetrics` | Sound as an observation signal only. Not proof of staging, ownership, or intent. |
| Which pilots are observed as corporation members in stored killmails? | `activity_events.entity_type='character'`, `activity_events.corporation_id`, corporation report queries | Degraded. It is event-time observed membership, not current corp roster. Must say basis. |
| What Discovery refs are waiting before more acquisition? | `discovered_killmail_refs.status`, `priority`, `last_seen_at`, `source_*`, `preview_json` | Sound as Discovery/provenance only. Must not inflate Evidence counts. |
| Which queued refs failed/can be retried? | `discovered_killmail_refs.status`, `failure_count`, `last_error`, `failed_at`, `fetch_runs`, `api_request_logs`, `data_quality_warnings` | Sound as recovery/provenance. Not proof that the killmail does not exist. |
| Did zKill preview show a relevant candidate? | `discovered_killmail_refs.preview_json` | Degraded and risky. Useful for triage only; not Evidence and not Observation fact. |
| What provider work created this evidence? | `fetch_runs`, `api_request_logs`, `ingestion_audits`, `discovered_killmail_refs` | Sound for provenance if separated from observation. |
| Which labels are missing on this report? | report `raw_ids`, `activity_events.*_name IS NULL`, `entities.entity_name IS NULL`, local SDE gaps | Mostly derivable. Needs a read-only backlog preview to make it operator-useful. |
| Which labels are stale? | `entities.last_enriched_at`, `metadata_runs.finished_at`, `sde_imports.imported_at`, `sde_inventory_imports.imported_at` | Partly supported. Stale policy is not defined, so output should be advisory/degraded. |
| What Assessment Memory exists for this entity? | `assessment_artifacts.entity_type`, `entity_id`, `status`, `citation_status`, `sample_killmail_ids_json` | Sound as human-authored judgment only. Not proof. Needs stale-citation warnings after deletion. |
| Would pruning break related outputs? | `killmails`, `activity_events`, `ingestion_audits`, `data_quality_warnings`, `discovered_killmail_refs`, `assessment_artifacts`, `fetch_runs`, support artifacts | Previewable but not execution-ready. Relationship grouping is still weak. |

## Sound Local Outputs

These outputs are currently sound when they state their basis precisely:

- Actor evidence report:
  - Basis from `killmails` joined to `activity_events`.
  - Useful for role split, systems, ships, event-time corp/alliance, cadence, final blows, timeline, warnings, raw IDs.
  - Sound phrase: "stored ESI-expanded Evidence matching actor/time scope."

- Radius/system evidence report:
  - Basis from local SDE topology plus `killmails` and `activity_events`.
  - Useful for system activity, operator candidates, multi-system presence, cadence, final blows, timeline.
  - Sound phrase: "stored Evidence in this local radius/time scope."

- Corporation observation report:
  - Basis from corporation rows and member pilot rows in `activity_events`.
  - Useful for observed member pilots, ships, regions, counterpart corporations/alliances, cadence, timeline.
  - Sound only if "observed event-time corporation context" is visible.

- Corpus health/readiness:
  - Basis from table counts, warning groups, queue state, metadata freshness, SDE import state.
  - Sound as operational support/readout.
  - Not an Observation report and not evidence coverage proof.

- Queue / Discovery reports:
  - Basis from `discovered_killmail_refs`.
  - Sound as possible lead/provenance state.
  - Must keep `preview_is_evidence=false` style semantics.

- Metadata hydration summaries:
  - Basis from `metadata_runs`, `api_request_logs.run_type='metadata'`, `entities`, and patched activity labels.
  - Sound as readability repair provenance.
  - Not evidence creation.

## Degraded Or Unsupported Outputs

Degraded:

- "Current corporation membership" from local killmail rows.
  - Atlas can show event-time observed corporation fields from `activity_events`.
  - It cannot prove current membership unless a provider-backed current membership process is explicitly modeled and gated.

- "Complete activity in a system/radius."
  - Atlas can show stored local Evidence and Discovery/provenance.
  - It cannot claim completeness because acquisition caps, missed slots, pending refs, failed expansions, external I/O state, storage state, and provider waits may limit coverage.

- "Who matters most?"
  - Relevance labels such as repeated attacker or multi-system presence are Observation signals.
  - They become unsafe if presented as threat proof or intent.

- "All missing labels for an entity/corpus."
  - Existing rows can derive many candidate IDs.
  - A global "all" has dangerous fanout and should be capped/scoped.

- "Stale labels."
  - The schema has timestamps (`entities.last_enriched_at`, SDE import timestamps, metadata runs), but no accepted stale threshold or lane policy.

Unsupported:

- Evidence derived from zKill preview.
  - `preview_json` is not Evidence and should not feed observation counts.

- Assessment Memory as proof.
  - `assessment_artifacts` can cite evidence context, but remains human-authored judgment.

- Hydration as corpus acquisition.
  - Hydration can make stored IDs readable, but cannot create killmail facts.

- Safe destructive pruning execution.
  - Preview exists; execution relationship semantics are not ready.

## Boundary Drift Risks

1. Report source wording is still too loose.

   Actor/radius/corporation report text and structured responses use `zKill discovery + ESI expanded killmails` as source. That is defensible as provenance shorthand, but it is a bad long-term bridge phrase. It invites readers to treat zKill preview as part of the evidence basis. Better wording for future outputs: "stored ESI-expanded Evidence with zKill Discovery provenance."

2. zKill preview sits close to operator-visible triage.

   `discovered_killmail_refs.preview_json` contains useful values such as time, system, victim, ship, value, points, solo, NPC, awox, and attacker count. These are tempting for reports. They must stay in queue/provenance displays only unless ESI expansion writes the killmail locally.

3. Labels can masquerade as facts.

   IDs are facts. Names are metadata. `activity_events` contains both IDs and nullable label fields; `entities` can later patch labels. Any Observation surface that shows names without raw IDs or label freshness risks turning a convenience label into evidence.

4. Report labels such as `watchlisted` are semantically stale.

   `radiusReport` emits `Watchlisted`. Atlas doctrine says Marked and Watch are distinct, and `watchlist_entities` is legacy/internal attention/watch preference persistence. A future presentation layer should avoid treating this as clean active Watch proof.

5. Assessment citation status can be overread.

   `assessment_artifacts.citation_status='verified'` means citation validation at creation time, not permanent truth. If Evidence is later deleted, that status can become stale unless explicitly reviewed.

6. Hydration can mutate display fields on Evidence-derived rows.

   `reportHydrator` patches nullable display labels in `activity_events`. This is acceptable readability repair, but the output must keep raw IDs and avoid implying the raw ESI payload changed.

7. Typed actor name resolution is still a provider boundary weak spot.

   HS101 already flagged that uncached typed names can use ESI resolution through routes that may look local. This matters for backlog design because hydration must not normalize silent provider lookup as ordinary local query.

8. Corpus hygiene can drift into deletion authority.

   A hydration backlog preview may show lots of unresolved/stale rows. It must not become an implicit cleanup/pruning plan. Missing readability is not evidence noise by itself.

## Hydration Backlog Model Recommendation

Do not persist a Hydration backlog yet.

Start with a read-only derived backlog model over existing rows. Treat backlog items as calculated provider-work candidates, not durable truth. The first readout should answer:

- What local IDs are unreadable for the current view?
- What local IDs are unreadable for Watch/Marked targets?
- What labels appear stale by an explicit policy?
- What can be fixed locally from already-known `entities` or SDE tables?
- What would require ESI metadata hydration?
- What is held by external/provider/storage gates?
- What is skipped because it is too broad, deleted, unsupported, or outside cap?

Recommended conceptual item shape:

```txt
hydration_kind:
  entity_label | event_display_patch | sde_type_label | sde_system_label | report_view_ids

scope_lane:
  view_local_record | target_marked | watch | corpus_hygiene

subject:
  entity_type + entity_id
  or type_id
  or solar_system_id
  or report_type + report_scope_hash

basis:
  source_table(s), local row counts, sample killmail_ids/event_keys, report raw_ids

state:
  missing | stale | locally_patchable | provider_required | held_by_external_io | storage_blocked | capped | unsupported | invalidated

idempotency_key:
  stable lane + kind + subject + basis policy version
```

Backlog item identity should be based on the thing being made readable, not on a provider request attempt. Provider attempts belong in `metadata_runs` / `api_request_logs` or future request-control readout.

## Can The Backlog Be Derived Read-Only First?

Yes. It should be derived read-only first.

Existing data can derive enough candidate backlog:

- Missing entity labels:
  - `activity_events.entity_name IS NULL`
  - `activity_events.character_name IS NULL`
  - `activity_events.corporation_name IS NULL`
  - `activity_events.alliance_name IS NULL`
  - `entities.entity_name IS NULL`

- Locally patchable labels:
  - IDs present in `entities` with names but missing in `activity_events`.

- Missing type labels:
  - `activity_events.ship_type_id IS NOT NULL` with no `activity_events.ship_type_name` and missing `type_metadata.type_name`.

- Missing system labels:
  - `activity_events.solar_system_id` or `killmails.solar_system_id` not found in `solar_systems`.

- View/local-record candidates:
  - report model `raw_ids`
  - selected killmail ID joined to `activity_events`
  - actor/radius/corporation report scopes

- Watch/Marked candidates:
  - `watchlist_entities`
  - `system_watches`
  - Watch-derived pending refs and evidence rows

- Stale candidates:
  - `entities.last_enriched_at`
  - `metadata_runs.finished_at`
  - `sde_imports.imported_at`
  - `sde_inventory_imports.imported_at`

Read-only derivation is not only possible; it is the safer proof. Persistence should remain parked until the derived model proves stable priority, caps, and invalidation.

## Priority, Cap, And Idempotency Recommendations

Priority lanes:

1. `view_local_record`
   - Highest priority.
   - Purpose: make the record/report/Observation currently being inspected readable.
   - Cap: small and responsive. Suggested first proof cap: 50 explicit IDs or lower, using existing `hydrateExplicitEntityIds` cap as a reference.

2. `target_marked`
   - Priority for operator-attention targets.
   - Basis: Marked/interest signals and entity-specific scopes, not generic corpus sweep.
   - Risk: `watchlist_entities` is not a clean Marked model, so label as Watch/Marked-adjacent until product authority clarifies.

3. `watch`
   - Patient lane for Watch-produced records.
   - Should not block immediate view hydration.
   - Must obey Watch arming, external I/O, live gate, cadence, and storage safety when provider-backed.

4. `corpus_hygiene`
   - Lowest priority.
   - Useful for health/readiness, not operator urgency.
   - Should be capped aggressively and probably sampled by unresolved count, age, and interest context.

Missing vs stale:

- Missing means no readable label exists locally for a known ID.
- Stale means a readable label exists but exceeds an accepted freshness policy.
- Do not call stale labels wrong. Call them stale or last refreshed at.
- Stale policy must be lane-specific. Current view can tolerate different freshness than corpus hygiene.

Caps and chunks:

- Use ESI `/universe/names/` chunking no larger than existing `reportHydrator` behavior (`chunkSize` default 500), but do not let a backlog readout imply 500 is a good UI/action cap.
- Separate display cap from provider chunk size.
- Suggested preview fields:
  - `candidate_count`
  - `already_known_count`
  - `locally_patchable_count`
  - `provider_required_count`
  - `capped_count`
  - `sample_ids`
  - `estimated_chunks`
  - `gate_state`

Provider gates:

- Provider-backed hydration must sit under future `external_io`.
- It must also respect current live/API gate behavior and storage safety.
- If storage is locked or unavailable, provider-backed hydration should not spend calls it cannot persist.
- If provider returns wait/retry-after, the item should read as held/waiting, not failed.

Possible idempotency keys:

- Entity label:
  - `hydration:entity_label:{entity_type}:{entity_id}:{freshness_policy}`

- Activity-event display patch:
  - `hydration:event_patch:{entity_type}:{entity_id}:{field}:{freshness_policy}`
  - This should probably collapse by ID/field, not per event, to avoid explosive item counts.

- Type label:
  - `hydration:sde_type:{type_id}:{sde_inventory_policy}`

- System label:
  - `hydration:sde_system:{solar_system_id}:{sde_topology_policy}`

- View/local-record:
  - `hydration:view:{report_type}:{scope_hash}:{raw_ids_hash}:{freshness_policy}`

- Watch lane:
  - `hydration:watch:{watch_type}:{watch_id}:{entity_or_scope_hash}:{freshness_policy}`

Avoid keys based on provider endpoint URL alone. Endpoint identity is an attempt detail, not the local readability need.

## Deletion And Pruning Relationship Considerations

Hydration backlog design must not resurrect deleted context.

Risks:

- A persisted backlog item for an entity or killmail could survive Evidence deletion and later patch labels around rows that no longer exist.
- A corpus hygiene item could be derived from stale support artifacts or snapshots instead of active storage if its source tables are not explicit.
- Assessment Memory can cite killmails that are later deleted; hydration must not treat Assessment citations as active Evidence.
- Queue refs can share `killmail_id` with deleted Evidence. They remain Discovery/provenance, not proof that Evidence should be recreated.
- Run-level provenance (`fetch_runs`, `api_request_logs`, `data_quality_warnings`) can span many killmails. Hydration invalidation must not assume a run belongs wholly to one target.

Recommendations:

- Derived backlog items should include source table names and active-row counts.
- If persistence is later added, backlog items need invalidation by source row absence, evidence window change, deletion/pruning event, and freshness policy version.
- Do not enqueue hydration from `assessment_artifacts.sample_killmail_ids_json` unless the cited killmail still exists in active `killmails`.
- Do not enqueue hydration from `discovered_killmail_refs.preview_json`; at most show queue-preview readability separately and label it Discovery-only.
- Pruning preview should eventually include pending/stale hydration relationship counts, but hydration should not block deletion.

## Schema / Read-Model Gaps

Gaps that matter now:

- No accepted stale-label policy.
- No first-class Marked table distinct from `watchlist_entities`.
- No first-class Hydration backlog/readout surface.
- No structured report assertion yet proving actor/radius/corporation observation rows exclude `discovered_killmail_refs.preview_json`.
- No typed actor provider-resolution gate item distinct enough for all routes.
- No deletion/pruning invalidation model for future persisted hydration work.
- No explicit label-quality fields in structured report output, such as `label_source`, `label_freshness`, `label_state`, or `raw_id_required`.

Gaps that should not be solved yet:

- A schema-backed hydration queue.
- A broad provider work queue.
- A new persisted Observation read model.
- A global entity truth table beyond current `entities`.
- A destructive pruning executor.

## Smallest Next Proof Or Dev Packet, If Warranted

No immediate Dev runway is recommended from this advisory by itself.

If Human/Overseer want a bounded proof, the smallest safe packet is:

Read-only Hydration backlog preview from existing local rows.

Acceptance shape:

- No provider calls.
- No schema migration.
- No persisted backlog.
- No hydration execution.
- No Evidence/EVEidence mutation.
- No Discovery ref mutation.
- No Assessment mutation.
- Emits derived backlog candidates grouped by lane: `view_local_record`, `target_marked`, `watch`, `corpus_hygiene`.
- Distinguishes `missing`, `stale`, `locally_patchable`, `provider_required`, `held_by_external_io`, `storage_blocked`, and `capped`.
- Shows candidate counts, sample IDs, source tables, idempotency key preview, cap/chunk estimate, and gate state.
- Proves zKill preview is excluded from Evidence-derived hydration candidates.
- Proves Assessment citations are not treated as active Evidence unless cited killmails still exist.

Suggested non-live verification targets:

- Actor report raw IDs produce view-local hydration candidates without provider calls.
- Radius report raw IDs produce capped view-local candidates.
- Corporation observation produces event-time member label candidates with explicit basis.
- Known local `entities` can patch missing `activity_events` labels as locally patchable.
- Missing entity labels become provider-required only under hydration lane, not Evidence lane.
- zKill `preview_json` does not produce Evidence hydration candidates.
- Assessment citation IDs do not produce candidates when active `killmails` rows are absent.
- Watch/Marked-adjacent candidates are separated from current-view candidates.
- All preview execution is read-only.

## Items To Park

- Persistent Hydration backlog table.
- Provider-backed Hydration Recovery Clock implementation.
- Durable hydration cadence, retry, release, and catch-up policy.
- UI design beyond minimal readout needs.
- Final Marked/Watch storage semantics.
- Stale-label thresholds by lane.
- Corp membership current-state refresh.
- Global current corporation/alliance truth.
- Pruning/deletion execution.
- Snapshot/support-artifact cleanup.
- Broad provider sequencer/work queue.
- Renaming report source wording in code or bridge payloads.

## Verification / Evidence

This was an advisory review only.

Commands/evidence used:

- `git status --short --branch` reported `main...origin/main` with no local changes before artifact creation.
- Source and documentation files listed above were read from local disk.
- No tests were run because no code or runtime behavior was changed.
- No live/API/provider/private calls were run.

## Boundary Confirmation

No source code, schema, runtime behavior, provider behavior, storage behavior, Watch behavior, Evidence/EVEidence behavior, Discovery refs, hydration behavior, Assessment Memory, `workspace/current.md`, or Dev runway was changed.
