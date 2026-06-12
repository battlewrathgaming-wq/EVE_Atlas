# EngineeringTraceHS385 - Evidence/EVEidence Writer Landing Package Source Trace

## 1. Executive Finding

The current durable Evidence/EVEidence landing point is compact and reusable in principle: expanded ESI killmail payloads are normalized by `normalizeKillmail`, packaged by `killmailIngestionWorker`, and persisted by `EvidenceRepository.persistEvidencePackage`.

Atlas should open a small fixture proof before any runtime adapter, actor.watch redirect, collector retirement, live provider movement, or schema work. The writer package is suitable as the next seam only if the fixture proves the landing boundary in isolation: no zKill candidate refs as Evidence, no Hydration, no Observation/report output, no Watch cadence mutation, and no provider calls.

The main caution is that current writer behavior is still surrounded by legacy collector assumptions. Cache skip, provider expansion, queue status updates, fetch-run lifecycle, API logs, and Watch/manual provenance are outside the writer but are currently bundled in collector/manual workers. A future Discovery-owned ESI-backed expansion lane should not inherit that bundled shape blindly.

One specific edge needs proof: on duplicate `killmail_id`, the writer preserves the existing `killmails` raw row and emits conflict warnings, but the current persistence loop can still attempt to insert incoming `activity_events` from the conflicting normalized package. A fixture should prove or force a decision on whether conflicting incoming participant rows are suppressed, accepted with warning, or treated as terminal writer failure.

## 2. Current Write Path Trace

Current source path:

```text
zKill/discovery candidate refs
-> selected killmail_id/hash refs
-> ESI killmail/detail expansion
-> normalizeKillmail(rawKillmail, { killmailHash, discoveredBy })
-> evidencePackage
-> EvidenceRepository.persistEvidencePackage(evidencePackage)
-> killmails / activity_events / entities / ingestion_audits / data_quality_warnings
```

Source-backed trace:

- `src/main/workers/killmailIngestionWorker.js:3` builds an Evidence package from selected refs, skips cached killmails through `repository.hasKillmail`, calls `esiClient.expandKillmail`, normalizes raw ESI killmail payloads, and accumulates killmail, activity, entity, audit, and warning rows.
- `src/main/workers/killmailIngestionWorker.js:52` provides `evidencePackageFromExpandedKillmails`, a no-provider package builder for already-expanded killmail payloads. This is the best current source basis for a fixture-only writer proof.
- `src/main/normalization/killmailNormalizer.js:4` is the normalizer. It rejects payloads without `killmail_id`, computes raw payload checksum, creates the durable killmail row shape, creates participant activity events, creates entity updates, and creates ingestion audit/warning material.
- `src/main/db/evidenceRepository.js:200` is the current durable landing method. It wraps package persistence in `BEGIN IMMEDIATE`, writes killmails, activity events, entities, ingestion audits, and warnings, then commits or rolls back.
- `src/main/workers/manualExpansionWorker.js:10` is the clearest current expansion worker: it selects pending refs, marks them selected, builds/persists the Evidence package, then marks refs expanded/cached/failed.
- `src/main/workers/actorWatchCollector.js:13` and `src/main/workers/systemRadiusCollector.js:9` still bundle Watch collection, provider movement, Discovery ref handling, ESI expansion, Evidence writes, and run posture.

Current architecture docs align with the boundary: `docs/current-state/current-evidence-pipeline.md:10` defines `zKill discovery refs -> ESI expanded killmail -> killmails -> activity_events -> reports`, and `docs/current-state/current-evidence-pipeline.md:17` states that expanded ESI killmail is durable evidence while zKill is discovery only.

## 3. Tables And Fields Touched By Evidence/EVEidence Landing

Core writer landing tables:

- `killmails` (`src/main/db/schema.sql:9`): `killmail_id`, `killmail_hash`, `killmail_time`, `solar_system_id`, `raw_esi_payload`, `raw_payload_checksum`, `source`, `first_seen_at`, `last_seen_at`, `ingested_at`.
- `activity_events` (`src/main/db/schema.sql:22`): one normalized event per participant identity role/entity, including killmail ID, participant role, entity type/id/name, character/corporation/alliance IDs/names, ship/weapon IDs/names, final blow, damage done, system/region/time context, discovered-by fields, and normalizer version.
- `entities` (`src/main/db/schema.sql:90`): local entity readability/cache support derived from normalized participant rows.
- `ingestion_audits` (`src/main/db/schema.sql:316`): per run/killmail audit with raw checksum, normalizer version, event count, attacker count, victim-present flag, and warnings JSON.
- `data_quality_warnings` (`src/main/db/schema.sql:331`): warning rows for malformed/partial normalized content, failed expansion state supplied by workers, and duplicate/conflict detection.

Support tables that may be written around landing, but are not the writer core:

- `fetch_runs` (`src/main/db/schema.sql:233`): created/finalized by collectors or expansion workers before/after writer landing. Current `ingestion_audits.run_id` references this table, so a writer fixture needs a fixture run row or equivalent accepted run context.
- `api_request_logs` (`src/main/db/schema.sql:300`): written by `HttpClient` during real provider calls, not by the writer package itself.
- `discovered_killmail_refs` (`src/main/db/schema.sql:276`): Discovery candidate/ref queue rows and status updates. These are possible leads and handoff memory, not Evidence/EVEidence landing rows.

## 4. Current Writer Input Shape

`EvidenceRepository.persistEvidencePackage` expects an `evidencePackage` with:

- `run.run_id` available for ingestion audit and warning rows.
- `killmails[]` in normalized durable killmail row shape.
- `activity_events[]` in normalized event row shape.
- `entity_updates[]`.
- `ingestion_audits[]`.
- `warnings[]`.

The package builders currently create that shape:

- `buildEvidencePackageFromRefs` takes selected candidate refs plus `repository`, `esiClient`, run, and `discoveredBy`; it performs cache checks and provider calls before normalization.
- `evidencePackageFromExpandedKillmails` takes already-expanded raw killmail payloads plus run/discoveredBy; it normalizes without provider movement.

The writer should be treated as accepting Atlas-normalized package material, not arbitrary caller-supplied activity rows. The source of normalized participant/activity rows should remain the Atlas normalizer unless a later ADR deliberately changes that boundary.

## 5. Future Discovery-To-Writer Input Shape Recommendation

A future Discovery-owned ESI-backed killmail/detail expansion lane should supply a landing package with three layers:

1. Candidate basis, preserved from Discovery intake:
   - `killmail_id`
   - `killmail_hash`
   - candidate key or dedupe key
   - source provider/kind
   - source Watch/Manual/other intent reference where available
   - `scope_key`
   - receipt ID
   - packet ID/index
   - candidate system ID where available
   - selected/skipped/deferred posture

2. Expanded ESI payload basis:
   - raw ESI killmail payload
   - hash used for expansion
   - ESI target kind, provider, and endpoint class
   - expansion timestamp/context
   - provider outcome classification

3. Writer package:
   - fixture or run context with `run_id`
   - normalized `killmails`
   - normalized `activity_events`
   - normalized `entity_updates`
   - `ingestion_audits`
   - `data_quality_warnings`

HS379 already provides the accepted selected-intake posture: `src/main/services/discoveryEsiExpansionIntakePostureService.js:295` carries `source_candidate_basis`, and `src/main/services/discoveryEsiExpansionIntakePostureService.js:297` exposes the future provider target with `provider: 'esi'`, `target_kind: 'killmail_detail'`, `killmail_id`, and `killmail_hash`.

Recommendation: the first fixture should adapt HS379-style selected-ready intake items plus injected expanded ESI payloads into `evidencePackageFromExpandedKillmails`, then persist through `EvidenceRepository.persistEvidencePackage` against a disposable fixture DB.

## 6. Required Provenance / Basis Fields

From the original Discovery candidate ref, preserve:

- `killmail_id` and `killmail_hash`.
- Source provider and source kind.
- Source intent identity where available: Watch ID, Manual run, future recovery/caller identity.
- Scope key and candidate system ID where available.
- Receipt ID, packet ID, and packet index once those exist.
- Candidate/dedupe basis, especially `killmail_id + hash`.
- Selection reason: selected, cached, malformed, duplicate, capped, deferred, retryable failure, terminal failure.

From the ESI expanded payload, preserve:

- Full raw ESI payload in `killmails.raw_esi_payload`.
- `raw_payload_checksum`.
- `killmail_id`, `killmail_hash`, `killmail_time`, `solar_system_id`.
- Victim and attackers as raw payload basis before normalization.
- `source: 'esi'` as current writer source.
- Normalizer version and ingestion timestamp.

Normalized into participant/activity rows:

- Victim and attacker roles.
- Character/corporation/alliance IDs and any names present locally in the payload.
- Ship and weapon type IDs/names where present.
- Damage/final-blow facts.
- Killmail time and system/region context.
- `discovered_by_type` and `discovered_by_id` from the source intent basis, without letting source intent become Evidence truth.

## 7. Idempotency And Cache Behavior

Current cache/idempotency behavior is split across package builder and writer:

- Pre-provider cache skip is in `buildEvidencePackageFromRefs`: `repository.hasKillmail(ref.killmail_id)` skips expansion and increments `already_cached`.
- Local-cache posture is fixture-proven by HS379 as `local_evidence_exists_skip` in `src/main/services/discoveryEsiExpansionIntakePostureService.js:219`.
- `killmails.killmail_id` is the primary key.
- `EvidenceRepository` upserts killmails by ID and, on conflict, only updates `last_seen_at`; it does not overwrite the existing raw ESI payload/hash/time/system fields.
- `activity_events.event_key` is primary-keyed and uses `ON CONFLICT DO NOTHING`.
- `ingestion_audits` uses `INSERT OR REPLACE` by run/killmail.
- `entities` are upserted with local COALESCE-style readability preservation.

Duplicate handling:

- Discovery candidate dedupe is based on `killmail_id + hash` in the accepted handoff posture.
- Durable Evidence cache is primarily by `killmail_id`.
- If the same `killmail_id` arrives with mismatching hash, checksum, time, or system, `insertKillmailConflictWarnings` emits a `KILLMAIL_PAYLOAD_CHECKSUM_MISMATCH` warning and preserves the original killmail row.

Risk needing proof:

- The writer detects conflicts before `upsertKillmail`, but the later loop still inserts incoming `activity_events`. If a duplicate killmail ID has a conflicting payload that normalizes to different event keys, the existing raw killmail row may be preserved while new participant events from the incoming payload are added. This should not be inherited without an explicit fixture proof and Overseer decision.

## 8. Malformed / Partial / Retryable / Terminal Behavior

Partial payloads:

- `normalizeKillmail` throws when `killmail_id` is absent.
- Missing victim produces a data quality warning.
- Missing attackers produces a data quality warning.
- Attackers without character IDs produce warnings while still allowing other participant identity rows to be generated.

Malformed or incomplete required fields:

- The normalizer does not fully prevalidate every required SQL field. If required fields such as `killmail_time`, `solar_system_id`, raw payload, or checksum fail schema requirements, the writer transaction should roll back, but the current code does not expose a refined terminal writer-failure classification at the writer boundary.

Provider failures:

- `EsiClient.expandKillmail` validates killmail ID/hash before provider movement.
- `HttpClient` retries provider capacity statuses such as 420, 429, and 503.
- `buildEvidencePackageFromRefs` classifies provider capacity style errors as `provider_capacity_deferred` warnings and does not create Evidence rows.
- Other expansion errors become `failed_expansion` warnings and failed counts unless cancellation is rethrown.

Important boundary: retryable provider failure classification currently belongs to the expansion/package-building layer, not the final writer. Writer/DB errors are transactional failures, not provider retry posture.

## 9. Boundary Risks Or Mixed Collector Assumptions

Risks not to inherit blindly:

- Legacy Watch collectors currently own too much: Watch intent/cadence, zKill acquisition, Discovery ref persistence, selected ESI expansion, Evidence writes, status updates, warnings, and run finalization.
- `buildEvidencePackageFromRefs` mixes cache skip, provider calls, failure classification, normalization, and package assembly.
- `fetch_runs` are currently used as both provider/run provenance and required ingestion-audit parent rows. A fixture must respect that FK without treating fetch runs as Discovery receipt schema.
- Current `discoveredBy` values are Watch/manual-flavored and should not become the future source vocabulary by accident.
- Conflict warnings exist, but conflict suppression policy for incoming normalized activity rows is not proven.
- `api_request_logs` are provider support provenance, not writer landing proof. A no-provider fixture should not create them.
- Hydration, Observation/report construction, and Assessment Memory should remain completely outside the writer package.

Suitable current behavior to retain:

- Raw ESI payload and checksum preservation.
- Transactional writer landing.
- Idempotent killmail and activity-event persistence for same payload reruns.
- Data quality warnings for partial-but-usable payloads.
- Local cache skip before spending ESI calls.
- Clear separation between Discovery refs and durable Evidence rows in current contracts.

## 10. Smallest Next Fixture Proof Recommendation

Open a bounded, no-provider Evidence/EVEidence writer landing package fixture proof.

Suggested proof shape:

```text
HS379 selected-ready candidate intake item
-> injected expanded ESI raw killmail fixture payload
-> evidencePackageFromExpandedKillmails
-> EvidenceRepository.persistEvidencePackage
-> table-count/readback proof in a disposable DB
```

The fixture should include:

- A clean killmail payload with victim and attackers.
- A fixture `fetch_runs` parent row or accepted equivalent run context, because `ingestion_audits.run_id` depends on it.
- One idempotent rerun of the same payload.
- One local-cache-existing case.
- One duplicate `killmail_id` with conflicting hash/checksum/time/system.
- One partial-but-usable payload with missing victim or attackers.
- One malformed payload missing `killmail_id` or another required durable field, proving rollback/no partial writes.

The fixture should not include:

- zKill calls.
- ESI calls.
- live/API movement.
- Watch runtime dispatch.
- Discovery ref mutation.
- Hydration writes.
- Observation/report generation.
- Assessment Memory writes.
- schema changes.
- runtime adapter/redirect/collector retirement.

## 11. Acceptance Criteria For That Proof

The fixture proof should show:

- Expanded ESI payload fixture lands exactly one `killmails` row with raw payload and checksum preserved.
- Expected participant rows land in `activity_events`.
- Expected entity support rows land in `entities`.
- Expected `ingestion_audits` row lands and references the fixture run context.
- Expected warnings land only for partial/conflict cases.
- A same-payload rerun does not duplicate killmail or activity rows.
- Local cache skip posture is respected before provider movement would occur.
- Duplicate/conflicting killmail behavior is explicitly proven and classified.
- Malformed required-field input rolls back without partial durable landing.
- No `discovered_killmail_refs` rows are created or mutated by writer landing.
- No `api_request_logs` rows are created in the no-provider fixture.
- No Hydration, Observation, Assessment, Watch cadence, schema, dispatcher, queue, or UI state changes occur.

## 12. Verification Evidence Expected

Expected verification for a future Dev packet:

- `node --check` for any new fixture/proof script.
- A focused `npm.cmd run verify:*` script for the writer landing package fixture.
- Disposable DB before/after table counts for `killmails`, `activity_events`, `entities`, `ingestion_audits`, `data_quality_warnings`, `discovered_killmail_refs`, `api_request_logs`, Watch tables, Hydration/metadata tables, and Assessment tables.
- Readback comparison of raw ESI payload checksum.
- Readback comparison of duplicate/conflict warning behavior.
- `PRAGMA foreign_key_check` against the disposable DB.
- Explicit proof that no provider client was invoked.

No verification commands were run for this advisory artifact.

## 13. Parked Items

Park until later:

- Runtime Discovery ESI-backed provider execution.
- Actor.watch adapter redirect.
- Mixed collector retirement.
- Durable Discovery receipt/task/packet schema.
- Live provider retry scheduling, leases, dispatcher, or enforcement.
- Watch cadence mutation from Discovery/Evidence outcomes.
- Corpus presentation and report/Observation behavior.
- Hydration readability repair.
- Assessment Memory links.
- Schema redesign around run/receipt provenance.
- Product UI.

