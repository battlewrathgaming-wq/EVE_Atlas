# Local Alpha Trial Runbook

Date: 2026-05-22

## Purpose

Run a small local alpha trial of AURA Atlas on one machine with explicit actions, reviewable artifacts, and no hidden live collection.

This runbook is offline-first. The live section is optional and must be gated.

## Preflight

Confirm the project is under:

```text
F:\Projects\AURA-Atlas
```

Use `.tmp` for runtime DBs, cache, snapshots, trace packs, and smoke artifacts:

```text
F:\Projects\AURA-Atlas\.tmp
```

Install dependencies if needed:

```powershell
npm.cmd install
```

Set local runtime paths for manual shell work:

```powershell
$env:AURA_ATLAS_TEST_TMP="F:\Projects\AURA-Atlas\.tmp"
$env:AURA_ATLAS_DB_PATH="F:\Projects\AURA-Atlas\.tmp\aura-atlas-alpha.sqlite"
$env:AURA_ATLAS_CACHE_DIR="F:\Projects\AURA-Atlas\.tmp\cache"
$env:AURA_ATLAS_SDE_CACHE_DIR="F:\Projects\AURA-Atlas\.tmp\sde"
```

Run verification:

```powershell
npm.cmd run verify:all
npm.cmd run smoke:electron
```

Expected:

- both pass
- no live API gate required
- no `.tmp` artifacts are committed

## Offline Fixture Path

Use the demo fixture when the operator needs a repeatable no-live walkthrough:

```powershell
npm.cmd run seed:demo-db
$env:AURA_ATLAS_DB_PATH="F:\Projects\AURA-Atlas\.tmp\aura-atlas-demo-fixture.sqlite"
npm.cmd run dev
```

The demo DB uses synthetic/fixture data and fake clients. It is not live evidence. Do not use live APIs just to populate a demo screen.

## Offline Trial Path

Start the app:

```powershell
npm.cmd run dev
```

In the Investigation view:

1. Confirm the opening view is the Operator Investigation Desk.
2. Enter an actor, system, or radius lead.
3. Read the passive live/API context before routing.
4. Use Stored Evidence Detail to inspect current stored evidence without discovery, ESI, hydration, assessment save, or watch execution.
5. Use Review Queue / Enrich to preview existing queued possible refs without running ESI.
6. Use Reports / Assessment for a loaded actor report only when saving deliberate assessment memory.

In the Readiness view:

1. Confirm runtime paths are local.
2. Confirm live API state is visible.
3. Inspect SDE topology and inventory readiness.
4. Load Evidence Corpus Health.
5. Create a Runtime DB Snapshot if you are about to run a meaningful trial.
6. Create an Operator Debug Trace Pack if anything looks unclear.

In Scopes:

1. Validate a manual discovery scope without running it.
2. Validate an actor or system/radius watch scope.
3. Confirm normalized payloads are understandable.

In Queue / Watches:

1. Preview queue selection.
2. Confirm queued refs are labelled as possible leads, not evidence or observations.
3. Confirm Enrich selected requires explicit selection, cap review, ESI call estimate, and confirmation.
4. Confirm watch authoring creates intent only and does not run collection.

In Reports:

1. Load actor or radius reports against the current local corpus.
2. Confirm the evidence footer/window/sample language is visible.
3. Confirm raw IDs and cached labels are distinguishable.
4. If an actor report has evidence, review Assessment Memory eligibility, citation basis, cited killmail IDs, evidence window, and local verification timing.
5. Create assessment memory only after entering an operator reason or summary and confirming the evidence/assessment boundary.
6. Inspect saved assessment detail for citation status and cited killmail IDs.

## Optional Live-Gated Trial

Only run live work when a respectful target/window is chosen.

Set:

```powershell
$env:AURA_ATLAS_LIVE_API="1"
```

Use a disposable DB:

```powershell
$env:AURA_ATLAS_DB_PATH="F:\Projects\AURA-Atlas\.tmp\aura-atlas-alpha-live-smoke.sqlite"
```

Discovery-only live smoke should:

- use radius `0`
- use a narrow known target
- set lookback and caps explicitly
- call zKill only
- queue refs only
- write no `killmails`
- write no `activity_events`
- make zero ESI calls

Expansion smoke should:

- start from selected queued refs
- use a tiny global expansion cap
- expand only uncached selected refs
- report ESI calls and failures
- preserve run IDs and artifacts

Stop if:

- the scope resolves unexpectedly
- the planned route is broader than intended
- live gate estimates unexpected API calls
- a script attempts ESI during discovery-only work
- the runtime DB path is not under `.tmp`

## After-Action Review

Use the feedback template in:

```text
docs/runbooks/local-alpha-known-limits-and-feedback.md
```

Capture:

- date/time
- DB path
- snapshot path, if created
- debug trace pack path, if created
- smoke artifact path, if live smoke ran
- target/scope/window/caps
- live API enabled: yes/no
- zKill calls
- ESI calls
- refs discovered
- queued refs written
- killmails written
- activity events written
- assessment artifacts created
- confusing wording or missing UI affordances

Attach or reference:

- runtime DB snapshot
- debug trace pack
- relevant smoke artifact
- current commit hash

## Boundaries

Do not prune evidence during alpha.

Do not run passive collection.

Do not automatically expand queued refs.

Do not treat zKill preview fields as evidence.

Do not treat assessment memory as observation data.
