# Systems Audit HS107: zKill -> ESI Trust Boundary

Role: Atlas Systems Auditor
Date: 2026-05-27
Purpose: Light source/code/doc audit to prove the zKill -> ESI trust boundary

This artifact is advisory evidence only. It does not implement code, change schema, create a Dev runway, rename terms, run provider calls, or change product direction.

## Concise Finding

The claim holds.

Current Atlas treats zKill as Discovery only. zKill gives Atlas candidate refs and optional preview metadata. Atlas Evidence/EVEidence begins only after ESI returns the full killmail payload and Atlas writes the normalized result locally as `killmails`, `activity_events`, ingestion audit rows, and warnings where applicable.

The main wording risk is not code behavior. Some report response text says source is `zKill discovery + ESI expanded killmails`. That is true as provenance, but should continue to be read carefully: observations are derived from stored ESI-expanded Evidence rows, not from zKill preview rows.

## Files Reviewed

- `AGENTS.md`
- `workspace/current.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `src/main/api/zkillClient.js`
- `src/main/api/esiClient.js`
- `src/main/workers/manualDiscoveryWorker.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/normalization/killmailNormalizer.js`
- `src/main/db/schema.sql`
- `src/main/db/evidenceRepository.js`
- `src/main/services/queueSelectionService.js`
- `src/main/reports/queueReport.js`
- `src/main/services/reportResponseService.js`
- `src/main/reports/actorReport.js`
- `src/main/reports/radiusReport.js`
- `scripts/verify-manual-discovery.js`
- `scripts/verify-queue-api-evidence-write.js`
- `scripts/verify-evidence-rule-regressions.js`
- `scripts/verify-queue-report.js`
- `scripts/verify-adversarial-evidence-fixtures.js`
- `scripts/verify-idempotent-ingestion.js`
- `scripts/verify-queue-selection.js`
- `scripts/verify-passive-side-effects.js`

## zKill Data Map

`src/main/api/zkillClient.js` narrows zKill discovery responses into refs.

Stored/ref candidate fields:

- `killmail_id`
- `hash`, sourced from `row.zkb.hash`

Optional preview fields:

- `killmail_time`
- `solar_system_id`
- `victim.character_id`
- `victim.corporation_id`
- `victim.alliance_id`
- `victim.ship_type_id`
- `attacker_count`
- `zkb.totalValue`
- `zkb.points`
- `zkb.npc`
- `zkb.solo`
- `zkb.awox`

Persistence target:

- `discovered_killmail_refs`
- optional preview is stored as `preview_json`

Code handling:

- zKill rows missing `killmail_id` or `zkb.hash` are skipped before becoming refs.
- Duplicate `killmail_id:hash` candidates are deduped in discovery.
- `EvidenceRepository.upsertDiscoveredKillmailRefs()` skips malformed/duplicate candidates and writes only valid refs.

Boundary meaning:

- These fields are Discovery/provenance metadata.
- They are not Evidence/EVEidence.
- They do not create `killmails`.
- They do not create `activity_events`.

## ESI Evidence Data Map

`src/main/api/esiClient.js` expands a queued ref through:

```txt
/latest/killmails/{killmail_id}/{hash}/?datasource=tranquility
```

`src/main/workers/killmailIngestionWorker.js` calls `esiClient.expandKillmail()` and passes the full raw ESI payload to `normalizeKillmail()`.

`src/main/normalization/killmailNormalizer.js` creates:

- `killmail`
  - `killmail_id`
  - `killmail_hash`
  - `killmail_time`
  - `solar_system_id`
  - `raw_esi_payload`
  - `raw_payload_checksum`
  - `source: 'esi'`
  - `first_seen_at`
  - `last_seen_at`
  - `ingested_at`
- `activity_events`
  - victim and attacker participant-derived rows
  - entity type/id/name fields
  - role
  - ship/weapon/final-blow/damage fields
  - killmail time/system fields
  - discovery provenance fields
  - normalizer version
- `entity_updates`
- `ingestion_audit`
- `data_quality_warnings`

Persistence target:

- `killmails`
- `activity_events`
- `entities`
- `ingestion_audits`
- `data_quality_warnings`

Boundary meaning:

- ESI-expanded `killmails` rows and derived `activity_events` constitute Atlas Evidence/EVEidence.
- The raw ESI payload and checksum are preserved.
- Rediscovery does not overwrite existing raw ESI Evidence payloads.

## Current Trust Boundary

Current Atlas boundary:

```txt
zKill candidate
-> discovered_killmail_refs
-> Discovery / possible lead / provenance

ESI expanded killmail
-> killmails + activity_events + ingestion_audits
-> Evidence/EVEidence
```

Command boundary:

- `manual.discovery` queues zKill refs only.
- `queue.selection` previews selected refs and expected ESI calls only.
- `manual.expansion` is the explicit ESI expansion step.
- Watch collectors can currently do discovery and capped expansion in one run, but the Evidence/EVEidence boundary remains the ESI expansion/write step.

Storage boundary:

- `discovered_killmail_refs` stores candidate refs, status, provenance, timing, selected/expanded/failed timestamps, failure counts, and optional zKill preview.
- `killmails` stores full ESI-expanded killmail Evidence.
- `activity_events` stores normalized Evidence-derived participant/activity rows.

## zKill Preview / Summary Risk

Current code mostly contains the risk well.

Safe behaviors:

- `queue.selection` returns `evidence_boundary: 'Queued zKill refs and preview fields are discovery/provenance metadata, not killmail evidence.'`
- Queue selection rows include `preview_source: 'zkill_discovery_preview'`.
- Queue selection rows include `preview_is_evidence: false`.
- `queueReport` labels at-a-glance values as zKill discovery preview metadata only.
- Actor/radius reports build observation sections from `killmails` and `activity_events`, not `discovered_killmail_refs.preview_json`.

Wording caution:

- Native actor/radius report responses expose evidence source as `zKill discovery + ESI expanded killmails`.
- This is acceptable as provenance shorthand, but future copy could be clearer as: discovery provenance plus stored ESI-expanded Evidence.

## Malformed / Stale / Incomplete Handling

zKill candidate handling:

- Missing `killmail_id` or hash is skipped.
- Duplicate refs are skipped/deduped.
- Manual discovery reports raw refs discovered, duplicates removed, malformed refs removed, queued refs written, and zero ESI expansion.
- Malformed/duplicate candidates do not enter `discovered_killmail_refs`.

ESI expansion handling:

- `normalizeKillmail()` rejects a raw killmail without `killmail_id` before persistence.
- Incomplete but identifiable ESI killmails may be stored as raw Evidence with warnings.
- Missing victim/attacker data creates warnings rather than invented activity.
- Provider capacity deferral writes warning state, writes no Evidence, and leaves work recoverable.
- Terminal expansion failure can mark queue refs failed without writing partial Evidence.

Idempotency:

- Existing ESI Evidence is preserved on rediscovery.
- Incoming changed payloads generate conflict warnings rather than replacing raw Evidence.

## Verifier Coverage

Existing verifier coverage is strong.

- `verify:manual-discovery`
  - proves manual discovery calls zKill only
  - proves ESI is not called
  - proves no `killmails` or `activity_events` are written
  - proves queue report repeats the Evidence boundary
- `verify:queue-selection`
  - proves queue selection is read-only
  - proves preview rows are marked non-evidence
  - proves expected ESI calls are preview only
- `verify:queue-report`
  - proves queue reports include Evidence Boundary wording
- `verify:queue-api-evidence-write`
  - proves queued refs do not create Evidence before expansion
  - proves cached refs do not spend ESI
  - proves successful ESI expansion writes Evidence
  - proves failed expansion writes no partial Evidence
  - proves retry can later complete failed refs without duplicate Evidence
  - proves restart reconstruction from durable queue/API/Evidence state
- `verify:idempotent`
  - proves rediscovery does not replace raw ESI payload, killmail time, system ID, hash, or checksum
- `verify:adversarial-fixtures`
  - proves malformed ESI killmail rejects before mutation
  - proves malformed/duplicate zKill refs remain possible evidence only
  - proves preview rows stay non-evidence
  - proves reports expose uncertainty without creating assessment memory
- `verify:evidence-rules`
  - proves key evidence boundary guards are registered in verification
- `verify:passive-side-effects`
  - proves passive reports, queue selection, readiness, schedule, and related read-only surfaces do not mutate Evidence/Discovery state

Useful missing proof:

- A focused structured-response assertion that `report.actor` and `report.radius` observation rows are sourced only from `killmails` / `activity_events`, while Discovery refs appear only in provenance/queue fields.

## Implications For Discovery Clock / Recovery Clock Design

The current boundary supports the proposed two-clock model.

Discovery Clock:

- May call zKill.
- May write `discovered_killmail_refs`.
- May include preview metadata for operator selection.
- Must not claim completeness.
- Must not create Evidence/EVEidence.

Recovery Clock:

- Owns selected ESI expansion.
- Spends provider calls on selected refs.
- Writes Evidence/EVEidence only after ESI returns full killmail data.
- Keeps provider deferral and terminal failure recoverable/reviewable.

Design rule:

```txt
zKill can create possible leads.
Only ESI expansion can create Evidence/EVEidence.
```

## Recommended Smallest Next Proof Or Doc Update

No urgent code or schema change is required to prove the boundary.

Smallest useful future proof:

- Add a non-live verifier assertion for structured actor/radius report responses proving:
  - observation rows are derived from `activity_events` / `killmails`
  - `discovered_killmail_refs` and `preview_json` appear only as provenance/queue context
  - source wording does not imply zKill preview is Evidence

Smallest doc clarification, if desired:

- Clarify future report wording from `zKill discovery + ESI expanded killmails` to `Discovery provenance plus stored ESI-expanded Evidence`.

## No Files / Code / Runtime Behavior Changed

This audit artifact did not change code, schema, runtime behavior, provider behavior, product direction, or terminology. No live/API/provider calls were run.
