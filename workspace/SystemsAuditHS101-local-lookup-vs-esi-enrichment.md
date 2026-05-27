# Systems Audit HS101: Local Lookup vs ESI Enrichment

Date: 2026-05-27
Role: Atlas Systems Auditor
Focus: Local Lookup vs ESI Enrichment Audit
Scope: Advisory audit only. No code or schema changes were made.

## Executive summary

Atlas has a mostly clear current boundary between cheap local lookup, metadata hydration, and explicit ESI evidence enrichment.

The durable direction says local records are the preferred cheap substrate. Stored expanded ESI killmails and derived `activity_events` are Evidence/EVEidence. Discovery refs are possible leads. Metadata hydration is readability-only and must not create Evidence/EVEidence. Current source mostly follows that model:

- Reports and read-only investigation views read local SQLite tables and local SDE lookup tables.
- System names resolve through local SDE topology only.
- Ship/type labels come from local `type_metadata` in normal reports.
- Metadata hydration is an explicit `metadata.hydration` service, live-gated through ESI `/universe/names/`, recorded in `metadata_runs`, and limited to labels/readability.
- Manual expansion and watch execution are the explicit ESI killmail expansion paths that create stored evidence.
- Manual discovery calls zKill only and queues possible refs without ESI expansion.

The main boundary risk is typed actor name resolution. `resolveActorIdentity` first checks local `entities` and `watchlist_entities`, but if a typed name is not cached and `AURA_ATLAS_LIVE_API=1`, it can call ESI `/universe/ids/` and upsert an entity label. That behavior is useful, records a metadata run, and is blocked when live API is disabled, but it is not represented as its own live-gate action in `liveApiGateService`. It can also be reached from `watch.create`, which is classified as metadata-only/local mutation rather than external-live-api. That is the smallest meaningful gap to close before Atlas can confidently say local lookup is never silently replaced by provider lookup.

Storage hard-lock behavior for missing or broken storage remains a broader runtime gap already captured in durable hardening direction. Current readiness can block or degrade on invalid paths, but provider/write paths are not globally proven to enforce a storage hard-lock before acquisition.

## Files reviewed

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `docs/index.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-report-products.md`
- `docs/current-state/current-manual-discovery-lane.md`
- `docs/features/observation-lookup-model.md`
- `docs/features/presentation-layer-information-index.md`
- `docs/features/ui-trigger-and-scope-map.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
- `docs/schemas/metadata-run.md`
- `src/main/db/schema.sql`
- `src/main/db/evidenceRepository.js`
- `src/main/services/appReadinessService.js`
- `src/main/services/liveApiGateService.js`
- `src/main/services/mutatingActionService.js`
- `src/main/services/reportResponseService.js`
- `src/main/services/scopeService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/resolution/actorResolver.js`
- `src/main/resolution/systemResolver.js`
- `src/main/metadata/reportHydrator.js`
- `src/main/reports/actorReport.js`
- `src/main/reports/reportUtils.js`
- `src/main/workers/manualDiscoveryWorker.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/sde/sdeLookupBuilder.js`
- `src/main/api/esiClient.js`
- `src/main/api/endpointPolicy.js`
- `src/renderer/investigation.js`
- `scripts/verify-actor-resolution.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-system-resolution.js`

## Current implementation map

### Cheap local lookup

Current local lookup sources are:

- `entities`: character, corporation, and alliance labels plus current corp/alliance label fields.
- `watchlist_entities`: watch-authored actor identity rows, also used as a local actor label source.
- `solar_systems`, `regions`, `constellations`, `system_adjacency`: local SDE topology/geography.
- `type_metadata`: local SDE inventory/type label metadata.
- `killmails` and `activity_events`: stored expanded ESI evidence and derived local observation rows.

Implemented local lookup paths:

- `systemResolver.resolveSystemIdentity` resolves system ID/name from `solar_systems` only and returns source `local_sde_topology`.
- `scopeService.validateScope` uses `resolveSystemIdentity` for system/radius names when validating scope.
- `report.actor`, `report.radius`, `report.system`, `report.corporation`, queue, run, and corpus health report paths are registered as read-only in `serviceRegistry`.
- `actorReport` joins local `solar_systems`, `type_metadata`, and `entities`, then falls back to unresolved ID labels through `reportUtils`.
- `src/renderer/investigation.js` describes lead typing and stored-context loading as passive/local, and reports that system resolution uses local SDE without zKill or ESI.

### Metadata hydration

Current metadata hydration paths are explicit and separate from evidence creation:

- `metadata.hydration` is registered as `metadata-only` with effects `EXTERNAL_LIVE_API` and `METADATA_READABILITY`.
- `liveApiGateService` defines `metadata.hydration` as live-required, provider `esi`.
- `reportHydrator` creates `metadata_runs`, counts already-known local IDs, patches known labels first, requests unresolved IDs from ESI `/universe/names/`, upserts `entities`, and patches nullable display-label fields on `activity_events`.
- `metadata_runs` records candidates, already-known IDs, requested ESI IDs, resolved/unresolved counts, entities upserted, label patches, and ESI call count.
- `api_request_logs.run_type = 'metadata'` distinguishes hydration/name-resolution calls from collection.

This is local readability repair, not Evidence/EVEidence creation. It does not replace numeric IDs and does not mutate `killmails.raw_esi_payload`.

### Explicit ESI enrichment

Current evidence enrichment paths are:

- `manual.expansion`: explicit selected queue drain through ESI killmail expansion.
- `actor.watch`: scoped zKill discovery plus capped ESI expansion during watch execution.
- `system.radius.watch`: scoped zKill discovery plus capped ESI expansion during watch execution.
- `watch.executor.arm` and `watch.executor.tick`: session-gated watch dispatch surfaces that can run evidence-creating provider work.

The actual ESI evidence boundary is `killmailIngestionWorker.buildEvidencePackageFromRefs`, which calls `EsiClient.expandKillmail`, normalizes killmails, and prepares `killmails`, `activity_events`, entity updates, audits, and warnings. Persistence is done by `EvidenceRepository.persistEvidencePackage`.

### Provider-gated gap filling

Implemented provider gates include:

- `manual.discovery`: zKill only.
- `manual.expansion`: ESI killmail expansion.
- `actor.watch` and `system.radius.watch`: zKill plus ESI.
- `metadata.hydration`: ESI names.
- `sde.build-lookups`: CCP SDE source download only when no local source path is supplied.

`endpointPolicy` classifies provider routes as discovery, ESI evidence expansion, ESI metadata hydration, or SDE source download.

### Degraded display when lookup is incomplete

Current degraded display support exists:

- `reportUtils.formatEntityLabel`, `formatTypeLabel`, and `formatSystemLabel` return unresolved ID labels when local labels are missing.
- `appReadinessService` reports `SDE_LOOKUP_MISSING`, `SDE_TOPOLOGY_NOT_READY`, and `SDE_INVENTORY_NOT_READY` warnings when local lookup tables are incomplete.
- `current-report-products.md` states reports derive observations from `killmails`, `activity_events`, and local metadata joins, not pending queue refs or zKill preview metadata.
- `metadata-hydration-contract.md` states missing labels must not block evidence reports.

### Hard-lock when storage is missing or broken

Current support is partial:

- `appReadinessService` can report blocked/degraded runtime path and readiness states.
- `prepareAppRuntimePaths` refuses invalid runtime/cache paths and creates only approved runtime/cache directories.
- There is no audited global guard proving that all provider acquisition or local write paths check storage readiness and hard-lock before acquisition when storage is missing/broken.

## Accepted direction map

Durable docs already capture the target direction:

- `docs/current-state/current-storage-runtime-hardening.md`: local records are the preferred cheap substrate; ESI enrichment is explicit/provider-gated gap filling; Atlas must not silently replace local lookup with provider calls; storage unavailable/broken should hard-lock writes/acquisition.
- `docs/current-state/current-evidence-pipeline.md`: zKill refs are Discovery; expanded ESI killmails plus derived activity events are Evidence/EVEidence; hydration is support/readability, not Evidence.
- `workspace/current.md`: future sequencing should keep Discovery Sequencer, Enrichment Sequencer, and Hydration separate.
- `docs/features/presentation-layer-information-index.md`: Discovery, Enrichment / ESI expansion, Expanded killmail, Metadata labels, SDE topology/inventory, and Metadata hydration are distinct presentation layers.
- `docs/features/ui-trigger-and-scope-map.md`: reports are read-only, manual discovery calls zKill only, manual expansion calls ESI for selected refs, and hydration is metadata-only/live-gated.
- `docs/contracts/metadata-hydration-contract.md`: hydration must not mutate raw killmail evidence, replace numeric IDs, hydrate every ID by default, or use live ESI for ship/type names when local SDE should provide them.
- `docs/contracts/expansion-selection-contract.md`: ESI expansion is the evidence-creating step, dedupes before expansion, skips cached killmails, and manual expansion must be explicit.
- `docs/contracts/discovery-queue-contract.md`: queue refs are not evidence, must not create `killmails` or `activity_events`, and queue statuses must distinguish `pending`, `expanded`, `cached`, `failed`, and `superseded`.

## Gaps / risks

1. Typed actor name resolution is provider-capable but not modeled as a first-class live-gate action.

   `resolveActorIdentity` checks local tables first. If a name is uncached and live API is enabled, it calls ESI `/universe/ids/`, upserts `entities`, and records a metadata run. This is blocked when `AURA_ATLAS_LIVE_API` is not `1`, but it bypasses `liveApiGateService` request-control classifications because it checks the environment directly.

2. `watch.create` can invoke typed actor resolution while being classified as metadata-only local mutation.

   Watch authoring is documented as no collection and no evidence creation, which remains true, but uncached actor-name watch creation can still perform ESI name resolution. That is a provider call hidden inside a service whose effects do not include `EXTERNAL_LIVE_API`.

3. Actor name resolution is adjacent to metadata hydration but does not use the `metadata.hydration` gate.

   It records `run_type = metadata` and `runType = actor_name_resolution`, but the live gate has no separate `actor.name_resolution` action and no explicit request-control fingerprint for this work.

4. Current local display fallback is good for missing labels, but freshness semantics are thin.

   `entities.last_enriched_at`, `metadata_runs`, and SDE import timestamps can support basic freshness display. There is not yet a uniform stale-label/stale-lookup state model for Observation surfaces.

5. Storage hard-lock before provider work is not proven.

   Readiness can surface invalid/missing paths, but the audit did not find a universal acquisition preflight that prevents zKill/ESI/SDE provider work when storage is missing or broken.

6. Provider abuse controls are service-memory-only.

   `liveApiGateService` request control tracks cooldown and lockout in memory. That protects a single app runtime but does not survive restart and does not apply to direct actor-name resolver provider calls.

7. Renderer copy is mostly boundary-aware, but actor-name phrasing can still sound local.

   The Investigation surface says typed actor names are resolver inputs or labels. That is accurate, but because resolver input may be provider-backed in some routes, explicit provider copy should accompany any action that can use uncached names.

## Suggested bounded next packet

Smallest safe next Dev packet:

Audit and classify typed actor name resolution as an explicit metadata/provider action, without changing product direction.

Acceptance shape:

- Add or route through a live-gate action for typed actor name resolution, likely `actor.name_resolution` or an explicit use of `metadata.hydration`, as Human/Overseer prefers.
- Ensure any service path that may resolve an uncached typed actor name through ESI advertises `EXTERNAL_LIVE_API` and requires confirmation when reached from renderer.
- Preserve existing local-first behavior: actor ID lookup and cached-name lookup must not call ESI.
- Preserve current Evidence boundary: name resolution may upsert `entities` and `metadata_runs`, but must not write `killmails`, `activity_events` as new evidence, or Discovery refs.
- Add verification that `watch.create` with an uncached actor name is either blocked without the explicit provider authority or routed through an explicit provider-gated metadata action.
- Add verification that `scope.validate`, report loading, queue selection, corpus health, and stored context loading do not call zKill or ESI.

No broader Dev packet is recommended from this audit until Human/Overseer decide the exact action name and UX copy for actor-name provider lookup.

## Verification suggestions

Relevant non-live verification commands:

```powershell
npm.cmd run verify:actor-resolution
npm.cmd run verify:system-resolution
npm.cmd run verify:service-registry
npm.cmd run verify:metadata-lookup
npm.cmd run verify:hydration
npm.cmd run verify:metadata-status
npm.cmd run verify:manual-discovery
npm.cmd run verify:queue-preflight
npm.cmd run verify:queue-report
npm.cmd run verify:report-response
npm.cmd run verify:evidence-rules
npm.cmd run verify:sde-build-lookups
npm.cmd run verify:controlled-workflow
```

Suggested targeted checks for the next packet:

- Prove actor ID resolution does not call ESI.
- Prove cached typed actor-name resolution does not call ESI.
- Prove uncached typed actor-name resolution is refused without explicit live gate/authority.
- Prove uncached typed actor-name resolution, when explicitly allowed, writes `metadata_runs` and `api_request_logs.run_type = 'metadata'` only.
- Prove `watch.create` cannot silently make an ESI `/universe/ids/` call under a local-only service classification.
- Prove report loading, stored context loading, queue preview, scope validation for systems, and corpus health do not instantiate or call provider clients.
- Prove missing SDE lookup degrades local display/readiness and does not trigger SDE download or ESI fallback.
- Prove missing/broken storage blocks provider acquisition before any zKill/ESI/SDE call once the storage hard-lock packet exists.

## Human / Overseer decisions needed

- Decide whether uncached typed actor name resolution should be its own action (`actor.name_resolution`) or be folded under `metadata.hydration`.
- Decide the user-facing wording for actor-name provider lookup so it remains separate from local lookup, Discovery, and Evidence enrichment.
- Decide whether watch authoring may ever resolve uncached names through ESI inline, or whether watch creation should require a prior explicit name-resolution step.
- Decide the stale-label presentation policy for local `entities.last_enriched_at` and SDE import timestamps.
- Confirm whether storage hard-lock enforcement should be a prerequisite before adding any new provider-capable lookup route.

## No code changed

This artifact is advisory. No source code, schema, runtime configuration, `workspace/current.md`, or Dev runway was changed.
