# Audit: Evidence Pipeline

Date: 2026-05-21
Scope: Milestone 1 and early Milestone 2 evidence pipeline

## Current Behavior

AURA Atlas ingests killmail evidence through a scoped pipeline:

```txt
zKill discovery refs
-> ESI killmail expansion
-> persisted killmail evidence
-> normalized activity events
-> reports
```

zKill records are used to extract `killmail_id` and `zkb.hash`. Expanded ESI killmail payloads are stored as evidence.

## Pipeline / Flow

1. Plan collection scope.
2. Query zKill discovery endpoints.
3. Dedupe discovered refs by `killmail_id`.
4. Skip already cached killmails.
5. Apply global expansion cap to uncached refs.
6. Fetch expanded killmail payloads from ESI.
7. Persist killmail evidence.
8. Normalize victim and attacker activity events.
9. Record fetch runs, API logs, ingestion audits, and data quality warnings.

## Known Gaps

- UI is intentionally minimal.
- Actor watch collection is not yet the main focus.
- Richer graph-layer analytics are future work.
- `report:radius` has been aligned around evidence scope first: included systems plus evidence time window. Collection run data is presented as provenance.
- `report:system` and `report:operators` still need the same evidence-scope/provenance wording and query alignment pass.

## Risks

- Reports could overstate partial evidence if scope/sample details are omitted.
- Future UI could accidentally treat presentation state as authoritative.
- Hydration could be mistaken for evidence mutation if documentation is ignored.
- Intelligence reports could accidentally filter by discovery path instead of by what the stored evidence describes. Run reports should own collection-run questions; intelligence reports should own evidence-scope questions.

## Verification

Current verification includes fixture ingestion, idempotent ingestion, SDE import, radius planning, collector verification, reports, operator reports, metadata lookup, and live-gated smoke checks.

## Related Files

- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/normalization/killmailNormalizer.js`
- `src/main/db/evidenceRepository.js`
- `src/main/reports/`
