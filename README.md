# AURA Atlas

AURA Atlas is a local-first Electron application for scoped EVE Online killmail evidence work.

It is not a general EVE dashboard, scraper, map renderer, AI analyst, or passive collection service. Its job is narrower:

```text
collect scoped references
expand selected killmails through ESI
store immutable evidence
derive observation reports
let the operator create deliberate assessment memory
```

## Current Product State

Atlas currently has a verified local application shell and backend service boundary. It can:

- inspect readiness, runtime paths, local SDE lookup state, live API state, and User-Agent configuration
- build local SDE lookup tables through an explicit `sde:build-lookups` command
- inspect local evidence corpus health
- validate user-defined actor, system, radius, queue, and report scopes
- run controlled manual zKill discovery that queues refs only
- expand selected queued refs through ESI under explicit caps
- author actor and system/radius watches without running collection
- run session-armed watch execution only after explicit arming
- present actor, corporation, radius, system, queue, run, and corpus reports from stored evidence
- hydrate report-scoped entity labels for readability
- create and review deliberate assessment artifacts with citation status
- create runtime DB snapshots under `.tmp`
- generate bounded debug trace packs without exporting raw expanded killmail payloads by default
- run a broad offline verification suite and an Electron smoke check

Atlas currently does not perform:

- passive broad ingestion
- automatic queue expansion
- evidence pruning
- hidden SDE download during reports
- map rendering
- AI commentary
- live API work without explicit gate enablement

## Evidence Rules

- zKillboard is discovery only.
- Expanded ESI killmails are the evidence source of truth.
- Numeric IDs are facts; names are cached labels.
- Discovery queue refs are possible evidence, not evidence.
- Reports are scoped presentations of stored evidence.
- Assessments are operator-authored memory, not evidence.
- Support/debug products are diagnostics, not observation reports.
- SDE data is lookup metadata, not activity evidence.
- Reports must not download, parse, or depend on SDE zip files.

## Runtime Data Model

The normal evidence path is:

```text
zKill scoped discovery refs
-> selected ESI killmail expansion
-> killmails
-> activity_events
-> reports
-> optional assessment artifacts
```

The normal metadata path is:

```text
official SDE source zip
-> explicit local lookup build
-> SQLite lookup tables
-> runtime report labels
```

The SDE zip is source material only. The durable runtime data is the imported SQLite lookup tables.

## Storage Rule

All Atlas build, test, download, extraction, cache, temp DB, fixture, and smoke artifacts should stay under:

```text
F:\Projects\AURA-Atlas
```

Preferred scratch root:

```text
F:\Projects\AURA-Atlas\.tmp
```

Development environment:

```powershell
$env:AURA_ATLAS_TEST_TMP="F:\Projects\AURA-Atlas\.tmp"
$env:AURA_ATLAS_DB_PATH="F:\Projects\AURA-Atlas\.tmp\aura-atlas-dev.sqlite"
$env:AURA_ATLAS_CACHE_DIR="F:\Projects\AURA-Atlas\.tmp\cache"
$env:AURA_ATLAS_SDE_CACHE_DIR="F:\Projects\AURA-Atlas\.tmp\sde"
```

The Windows dev launcher sets local paths for normal development:

```powershell
npm run dev
```

## First Local Start

Install dependencies if needed:

```powershell
npm.cmd install
```

Run the offline verification suite:

```powershell
npm.cmd run verify:all
```

Build local SDE lookup tables if Readiness reports `SDE_LOOKUP_MISSING`:

```powershell
npm run sde:build-lookups
```

Run the Electron smoke check:

```powershell
npm.cmd run smoke:electron
```

Seed an offline demo DB if you want a fixture-backed walkthrough:

```powershell
npm run seed:demo-db
$env:AURA_ATLAS_DB_PATH="F:\Projects\AURA-Atlas\.tmp\aura-atlas-demo-fixture.sqlite"
```

Start the app:

```powershell
npm run dev
```

Start in the app with the Investigation Desk. A safe local-alpha walkthrough is:

1. Investigation: enter an actor, system, or radius lead and read the passive live/API context.
2. Readiness: confirm runtime paths, SDE lookup state, live API state, and User-Agent.
3. Readiness / Evidence Corpus Health: inspect local corpus counts before making claims.
4. Investigation or Scopes: create or validate a scoped question.
5. Actions: run controlled manual discovery only when intentional; it queues zKill refs only.
6. Queue / Watches: preview queued refs and use Enrich selected only with explicit ESI confirmation.
7. Reports: view actor/radius evidence reports from stored evidence.
8. Reports / Assessment: optionally save deliberate Assessment Memory from a loaded actor report.
9. Readiness: create a runtime DB snapshot and trace pack for review if needed.

## Live API Gate

Live zKill/ESI actions require explicit enablement:

```powershell
$env:AURA_ATLAS_LIVE_API="1"
```

Live work should use:

- narrow target
- explicit lookback
- explicit caps
- disposable `.tmp` DB for smoke tests
- discovery-only before expansion
- global expansion cap for ESI calls

Live scripts refuse to run unless the gate is enabled.

## Useful Commands

```powershell
npm run dev
npm.cmd run verify:all
npm.cmd run smoke:electron
npm run sde:build-lookups
npm run seed:demo-db
npm run report:corpus-health
npm run report:debug-trace
npm run snapshot:runtime-db
```

`seed:demo-db` creates an offline synthetic/fixture DB under `.tmp` for local alpha walkthroughs. It does not call live APIs.

## Current Work Focus

The current milestone is Local Alpha Trial Readiness.

Atlas has closed the first-pass Operator Investigation Desk milestone. The current work is to make the existing safe path understandable, repeatable, and reviewable for:

```text
one operator
one machine
explicit actions
reviewable artifacts
no hidden live collection
```

This is not public packaging and not a feature-widening milestone. Active docs should point operators at the current local-alpha runbooks, not the deprecated `docs/gap` workflow.

See:

- `docs/roadmap/local-alpha-trial-readiness.md`
- `docs/runbooks/local-alpha-trial.md`
- `docs/runbooks/local-alpha-known-limits-and-feedback.md`
- `docs/runbooks/local-alpha-release-tag-checklist.md`
- `docs/audits/audit-2026-05-24-operator-investigation-desk-closure.md`

## Further Reading

- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/tenets/tenets.md`
- `docs/features/README.md`
- `docs/runbooks/local-alpha-trial.md`
- `docs/runbooks/local-alpha-known-limits-and-feedback.md`
