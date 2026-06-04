# Data Engineering HS256 - Local Readability During Report Construction Audit

Status: advisory artifact  
Role: Data Engineering / Engineering Review  
Date: 2026-06-05  
Request: `workspace/OverseerHS256-local-readability-report-construction-audit-request.md`

## 1. Executive Recommendation

Atlas can keep local readability as part of report / Observation construction. Current report builders already prefer local rows, local lookup tables, cached labels, and raw-ID fallback formatting. They do not need provider-backed Hydration before a raw-ID Observation is valid.

No Dev runway is recommended from this review. The smallest useful follow-up, if Overseer wants more proof, is documentation wording or a read-only report-readability matrix that lists local label sources and unresolved counts per report surface. Provider-backed readability should remain an explicit operator act, separately gated, and not triggered by focus, hover, report open, or request construction.

## 2. Current Local Readability Sources By Report / Surface

| Surface | Local readability sources observed | Raw-ID fallback / gap posture |
| --- | --- | --- |
| Shared report formatting | `reportUtils.formatEntityLabel`, `formatTypeLabel`, and `formatSystemLabel` format known labels plus ID; missing labels render as `[unresolved]`. | Strong. Raw IDs remain visible and usable. |
| Actor report | `activity_events` cached labels, `entities`, `watchlist_entities`, `type_metadata`, `solar_systems`, `data_quality_warnings`, local Discovery / run provenance. | Strong. Actor label resolves from input, Watch entity, or entity cache; timeline and aggregates keep IDs and unresolved markers. |
| Corporation Observation report | Reuses actor scope, then joins `activity_events`, `entities`, `type_metadata`, `solar_systems`, and local killmail scope. | Strong. Missing pilot/type/system labels remain raw IDs or `unknown` display gaps. |
| Operator report | `solar_systems` for system resolution, `activity_events`, `watchlist_entities`, `entities`, `type_metadata`, and local run/provenance tables. | Strong. Operator labels use cached/local names where present and format unresolved IDs. |
| Radius report | `TopologyService` over local SDE topology tables, `solar_systems`, `system_adjacency`, `activity_events`, `entities`, `watchlist_entities`, `type_metadata`, and local run/provenance tables. | Strong. Included systems require local topology; report rows preserve ID-bearing fallback formatting. |
| System report | `solar_systems`, `activity_events`, `entities`, `type_metadata`, `killmails`, local run/provenance tables. | Strong. Timelines can show unknown labels while preserving killmail/system/type/entity IDs. |
| Actor metadata readiness | Local diagnostic over `activity_events`, `solar_systems`, `type_metadata`, `entities`, and `watchlist_entities`. | Explicitly discloses missing systems, types, corporations, and alliances as readiness gaps. |
| Corporation metadata readiness | Local diagnostic over scoped `killmails`, `activity_events`, `solar_systems`, `type_metadata`, and `entities`. | Explicitly discloses missing systems, types, member pilots, counterpart corporations, and counterpart alliances. |
| Metadata status | Local readiness report for `sde_imports`, `sde_inventory_imports`, topology tables, `type_metadata`, `entities`, and `metadata_runs`. | Discloses topology / inventory readiness and metadata run history; not Evidence. |

Current schema supports this split cleanly:

- Evidence anchors: `killmails`, `activity_events`, `ingestion_audits`.
- Discovery provenance: `discovered_killmail_refs`, `fetch_runs`, `api_request_logs`.
- Local readability caches: cached label columns in `activity_events`, `entities`, `watchlist_entities`, `type_metadata`, `solar_systems`, `regions`, `constellations`, `system_adjacency`.
- Provider-backed Hydration provenance/write history: `metadata_runs`, `entities`, and patched `activity_events` label columns.

## 3. Whether Report Construction Mutates Labels Or Stays Read-Only

Current report construction appears read-only. The reviewed report builders prepare `SELECT` queries and format local rows; they do not create `metadata_runs`, instantiate `HttpClient` / `EsiClient`, call providers, or patch labels.

The explicit provider-backed Hydration path is separate in `src/main/metadata/reportHydrator.js`. That file:

- creates `metadata_runs`;
- can instantiate `HttpClient` and `EsiClient`;
- resolves names through ESI when dependencies permit it;
- upserts `entities`;
- patches cached label columns on `activity_events`.

That behavior is appropriate for an explicit Hydration act, but it must remain outside ordinary report construction.

## 4. Where Unresolved IDs / Gaps Are Disclosed

Report formatting already preserves the useful distinction between missing readability and missing evidence:

- entity gaps render as `characterID/corporationID/allianceID ... [unresolved]`;
- type gaps render as `typeID ... [unresolved]`;
- system gaps render as `solarSystemID ... [unresolved]`;
- unknown geography and timeline labels render as `unknown`;
- report models keep `raw_ids` for actor and radius reports;
- metadata readiness reports enumerate missing labels by local scope and appearance count;
- reports include basis and interpretation warnings that restrict claims to stored evidence.

This is aligned with the accepted correction: raw-ID Observation is valid before selective Hydration.

## 5. Whether Local Readability And Provider-Backed Hydration Are Clear

Mostly clear in implementation:

- Local report builders use cached/local data.
- Provider-backed Hydration is isolated in `reportHydrator.js` and live scripts.
- Hydration scripts refuse live provider work without explicit live API allowance.
- Metadata readiness reports state they are local lookup diagnostics, not evidence and not hydration.

The main clarity risk is wording, not current behavior. Terms like `reportHydrator`, `metadata readiness`, and "Ready for readable report" can be misread as "Observation requires Hydration first." In current code, they do not enforce that, but future docs should keep saying "readability gap" rather than "report blocker" unless a specific surface truly cannot render.

## 6. Ambiguities Or Drift Risks

1. `reportHydrator.js` naming is implementation-risky if copied into report-construction language.
   - Safer temporary wording: "explicit report-scoped provider Hydration" for that file's behavior.
   - Safer wording for report builders: "local readability lookup" or "local label resolution."

2. "Metadata readiness" can sound like a prerequisite.
   - Safer wording: "readability readiness" or "local label gap diagnostic" in future docs, while preserving current command/file names until Overseer opens terminology work.

3. "Request" can be overloaded.
   - A report request should mean "construct local report from local records."
   - A provider Hydration request should mean "operator asked Atlas to consider readability repair," still not provider execution until gates pass.

4. "Focus" / current view can accidentally become execution pressure.
   - Current posture should keep focus as local prioritization context only.
   - Focus must not create provider-backed Hydration, writes, or queue movement by itself.

5. Local SDE gaps and provider entity-label gaps need separate disclosure.
   - Static type/system labels should come from local SDE tables.
   - Entity names may use local `entities` first and only become provider Hydration under explicit operator action.

## 7. Smallest Next Proof Or Dev Packet, If Any

No Dev packet is recommended now.

Smallest optional proof, routed to Overseer only: a read-only report-readability audit output that, for each report type, emits:

- local tables consulted for readability;
- unresolved entity/type/system ID counts;
- whether any provider-capable function was reached;
- whether any `metadata_runs`, `entities`, or `activity_events` label columns changed.

This would be proof/readout only. It should not create a persisted queue, provider dispatcher, Hydration write, schema change, UI behavior, support artifact, or runtime enforcement rule.

## 8. Parked Items

- Renaming `reportHydrator.js` or command/file names.
- Provider-backed Hydration trigger design.
- UI focus/hover/current-view behavior.
- Durable Hydration queue, packet, dispatcher, leases, retry, or checkpoint state.
- Schema changes for readability provenance.
- Global hydrate-everything behavior.
- Treating Discovery refs as Evidence or Observation basis before ESI Evidence Expansion.

## 9. Verification Evidence

Files / context reviewed:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/OverseerHS256-local-readability-report-construction-audit-request.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `docs/features/data-layer-boundaries.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `src/main/db/schema.sql`
- `src/main/reports/reportUtils.js`
- `src/main/reports/actorReport.js`
- `src/main/reports/corporationObservationReport.js`
- `src/main/reports/operatorReport.js`
- `src/main/reports/radiusReport.js`
- `src/main/reports/systemReport.js`
- `src/main/reports/actorMetadataReadinessReport.js`
- `src/main/reports/corporationMetadataReadinessReport.js`
- `src/main/reports/metadataStatusReport.js`
- `src/main/metadata/reportHydrator.js`
- `scripts/verify-actor-report.js`
- `scripts/verify-radius-report.js`
- `scripts/verify-metadata-status.js`
- `package.json`

Checks run:

```text
npm.cmd run verify:actor-report
npm.cmd run verify:corporation-report
npm.cmd run verify:radius-report
npm.cmd run verify:metadata-status
npm.cmd run verify:metadata-lookup
git status --short --branch
```

Results:

- `verify:actor-report` passed: `actor evidence report verified`.
- `verify:corporation-report` passed: `corporation observation report verified`.
- `verify:radius-report` passed: `radius report verified`.
- `verify:metadata-status` passed: `metadata status verified`.
- `verify:metadata-lookup` passed: `metadata lookup hardening verified`.
- Initial `git status` before this artifact showed `## main...origin/main`.

No live/API/provider calls were run. No Hydration writes were run. No schema, UI, support artifact, dispatch, enforcement, pruning/deletion, or current-state edits were made.

## 10. Human / Overseer Decisions Needed

No Human product-direction decision is required from this advisory pass.

Overseer can safely accept this as:

- local readability during report construction is already current implementation posture;
- provider readability should remain explicit, gated Hydration;
- raw-ID Observation remains valid before Hydration;
- any next action should be documentation wording or read-only proof only, not Dev implementation.

