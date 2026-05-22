# AURA Atlas

Evidence-based capsuleer intelligence.

AURA Atlas is a local-first Electron proof of concept for EVE Online evidence memory. It helps an operator collect, store, inspect, and explain scoped killmail evidence without turning discovery previews, UI summaries, or assessments into source data.

## Evidence Doctrine

- zKillboard is discovery only.
- Expanded ESI killmails are the evidence source of truth.
- Numeric IDs are facts; names are cached labels.
- Reports are scoped presentations of stored evidence.
- Assessments are deliberate operator memory, not evidence.
- Queue refs are possible evidence until explicitly expanded through ESI.
- Support/debug products are diagnostics, not observation reports.

Atlas does not perform passive broad ingestion, automatic queue expansion, evidence pruning, map rendering, or AI commentary.

## Current Capabilities

The current local app can:

- show app readiness, runtime paths, local SDE topology, inventory metadata, and live API state
- inspect local evidence corpus health
- validate user-defined scopes before actions run
- run controlled manual zKill discovery that queues refs only
- expand selected queued refs through ESI under explicit caps
- author actor and system/radius watches without running collection
- run session-armed watch execution only when explicitly armed
- present actor and radius reports from stored evidence
- hydrate report-scoped entity labels for readability
- create and review assessment artifacts with citation status
- create runtime DB snapshots
- generate bounded operator debug trace packs

## Storage Rule

All AURA Atlas build, test, download, extraction, cache, temp DB, fixture, and smoke artifacts should stay under:

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

The Windows dev launcher sets the local paths for normal development:

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

Run the Electron smoke check:

```powershell
npm.cmd run smoke:electron
```

Start the app:

```powershell
npm run dev
```

In the app, begin with:

1. Readiness
2. Evidence Corpus Health
3. Scopes
4. Queue / Watches
5. Reports

## Main Safe Paths

### Readiness

Use Readiness to confirm local DB, runtime paths, SDE topology, inventory metadata, live API state, and User-Agent configuration.

Readiness is local inspection. It does not collect evidence.

### Corpus Health

Use Evidence Corpus Health to inspect local table counts, integrity checks, warning groups, and freshness.

It reads local SQLite only. It does not call zKill or ESI.

CLI:

```powershell
npm run report:corpus-health
```

### Scoped Discovery

Manual discovery calls zKill for scoped refs only and queues possible evidence.

It does not call ESI. It does not write killmails or activity events.

### Manual Expansion

Manual expansion takes selected queued refs and expands them through ESI under explicit caps.

Only expanded ESI killmails become evidence.

### Actor And Radius Reports

Reports read stored killmails and normalized activity events for a selected scope and time window.

Reports are observations over evidence. They do not run collection and they do not use assessment artifacts as input.

### Assessment Artifacts

Assessment memory is an operator-authored record over a loaded report context.

Assessment artifacts show citation status and cited killmail IDs, but they are not evidence.

### Runtime Snapshot

Snapshots create local SQLite copies under `.tmp`.

They do not restore, prune, compact, delete evidence, or call live APIs.

CLI:

```powershell
npm run snapshot:runtime-db
```

### Debug Trace Pack

Trace packs summarize recent run/API/task/warning/queue/corpus/readiness state for support handoff.

They exclude raw expanded ESI payloads by default.

CLI:

```powershell
npm run report:debug-trace
```

## Live API Gate

Live zKill/ESI actions require explicit enablement:

```powershell
$env:AURA_ATLAS_LIVE_API="1"
```

Use live calls only with a narrow target, explicit lookback, explicit caps, and a disposable `.tmp` DB for smoke tests.

Discovery-only live work should call zKill only and queue refs. ESI expansion should happen later, explicitly, with a global expansion cap.

## Useful Scripts

```powershell
npm run dev
npm.cmd run verify:all
npm.cmd run smoke:electron
npm run report:corpus-health
npm run snapshot:runtime-db
npm run report:debug-trace
npm run seed:demo-db
```

`seed:demo-db` creates an offline synthetic/fixture DB under `.tmp` for local alpha walkthroughs. It does not call live APIs.

Live scripts refuse to run unless `AURA_ATLAS_LIVE_API=1` is set.

## Further Reading

- `docs/tenets`
- `docs/statements/live-target-discipline.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/roadmap/local-alpha-trial-readiness.md`
- `docs/runbooks/local-alpha-trial.md`
- `docs/runbooks/local-alpha-known-limits-and-feedback.md`
- `docs/gap/to-do`
