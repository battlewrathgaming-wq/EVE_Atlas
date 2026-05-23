# Gap To-Do: Report Performance Indexes

Status: Complete
Priority: P2

## Completed

- Reviewed report and queue query patterns.
- Added compound SQLite indexes for common evidence scopes:
  - actor/entity plus time
  - system plus time
  - corporation plus time
  - alliance plus time
  - killmail plus role
  - killmail system plus time
  - scoped queue selection and recent queue activity
  - API logs by run/provider/request time
  - data quality warnings by run/killmail
- Replaced the older narrow queue status/scope index with a broader scoped queue index.
- Added synthetic query-plan verification before UI-scale report reads.

## Task Requirements Addressed

Current indexes are mostly single-column. Reports commonly filter and group by combined scope/time fields.

Likely useful index areas:

- `activity_events(entity_type, entity_id, killmail_time)`
- `activity_events(solar_system_id, killmail_time)`
- `activity_events(corporation_id, killmail_time)`
- `activity_events(alliance_id, killmail_time)`
- `activity_events(killmail_id, role)`
- `killmails(solar_system_id, killmail_time)`
- queue scope/status/order fields used by selection and reports
- `api_request_logs(run_id, provider, requested_at)`
- `data_quality_warnings(run_id, killmail_id)`

Exact index choices now follow observed report query patterns and are verified with SQLite `EXPLAIN QUERY PLAN`.

## Guardrails

- Do not add indexes blindly if they slow ingestion too much.
- Use `EXPLAIN QUERY PLAN` or equivalent verification where useful.
- Keep indexes aligned with actual report/filter use.
- Large synthetic tests should stay under the project `.tmp` path.

## Verification

- `verify:report-indexes`
- `verify:all`

The verifier seeds synthetic evidence, queue refs, API logs, and warning rows in an in-memory DB and checks that core report-scope query plans use the intended indexes.

## Related Files

- `src/main/db/schema.sql`
- `src/main/reports/*`
- `scripts/verify-bulk-synthetic.js`
- `scripts/verify-controlled-workflow.js`
