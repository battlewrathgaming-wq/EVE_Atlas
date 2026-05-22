# Passive Surface Side Effect Sweep

Status: Complete

Completed: 2026-05-23

## Mission

Prove that passive/support surfaces remain passive as Atlas presentation grows.

Readiness, reports, queue/watch previews, corpus health, trace packs, and snapshot preflight must not collect evidence, expand refs, hydrate metadata, create assessment memory, or alter watch execution state unless explicitly designed to do so.

## Implemented Outcome

Added:

```text
npm.cmd run verify:passive-side-effects
```

The verification runs against:

- a seeded fixture DB with evidence, queue refs, watches, metadata, run provenance, and an assessment artifact
- an empty DB

It compares before/after counts for:

- `killmails`
- `activity_events`
- `discovered_killmail_refs`
- `fetch_runs`
- `api_request_logs`
- `metadata_runs`
- `assessment_artifacts`
- `watchlist_entities`
- `system_watches`

## Surfaces Covered

- `app.readiness`
- `report.corpus_health`
- `queue.selection`
- `watch.schedule`
- `report.actor`
- `report.radius`
- `report.queue`
- `report.run`
- `report.system`
- `report.corporation`
- `report.build`
- metadata status/readiness reports
- `runtime.db_snapshot.preflight`
- `task.list`
- `assessment.list`
- `assessment.get`
- `support.debug_trace_pack`

## Guardrail

`support.debug_trace_pack` is allowed to write exactly one support artifact file, but it must not mutate evidence, queue, run, metadata, assessment, or watch tables.

## Verification

The new check is included in:

```text
npm.cmd run verify:core
npm.cmd run verify:all
```

## Completion Signal

Passive UI/support surfaces now have a fixture guard against hidden collection, expansion, hydration, assessment creation, or watch mutation.
