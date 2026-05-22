# Gap To-Do: Report Performance Indexes

Status: Open
Priority: P2

## Actionables

- Review report query patterns and add compound SQLite indexes for common evidence scopes.
- Verify report performance on synthetic larger datasets.
- Add a performance-oriented verification script or benchmark fixture before UI-scale use.

## Task Requirements

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

Exact index choices should follow observed query plans and batch tests.

## Guardrails

- Do not add indexes blindly if they slow ingestion too much.
- Use `EXPLAIN QUERY PLAN` or equivalent verification where useful.
- Keep indexes aligned with actual report/filter use.
- Large synthetic tests should stay under the project `.tmp` path.

## Completion Signal

A batch fixture demonstrates report queries remain responsive at a larger evidence volume, and query plans use intended indexes for main report scopes.

## Related Files

- `src/main/db/schema.sql`
- `src/main/reports/*`
- `scripts/verify-bulk-synthetic.js`
- `scripts/verify-controlled-workflow.js`
