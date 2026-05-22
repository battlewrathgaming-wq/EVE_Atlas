# Passive Surface Side Effect Sweep

## Mission

Prove that passive/support surfaces remain passive as Atlas presentation grows.

Readiness, reports, queue/watch previews, corpus health, trace packs, and snapshot preflight must not collect evidence, expand refs, hydrate metadata, create assessment memory, or alter watch execution state unless explicitly designed to do so.

## Task Requirements

Build a before/after side-effect sweep for passive services and renderer-like calls:

- `app.readiness`
- `report.corpus_health`
- `queue.selection`
- `watch.schedule`
- report build/load commands
- metadata readiness reports
- debug trace pack generation
- runtime snapshot preflight
- task list/get
- assessment list/get

For each call, compare core table counts before and after:

- `killmails`
- `activity_events`
- `discovered_killmail_refs`
- `fetch_runs`
- `api_request_logs`
- `metadata_runs`
- `assessment_artifacts`
- `actor_watches`
- `system_watches`

## Suggested Verification

Add a script such as:

```txt
npm.cmd run verify:passive-side-effects
```

It should run on a seeded fixture DB and on an empty DB.

## Acceptance Criteria

- Passive surfaces do not create evidence or live/API records.
- Any intentional support artifact writes, such as trace pack files, are explicitly asserted and documented.
- The test is included in `verify:all`.

