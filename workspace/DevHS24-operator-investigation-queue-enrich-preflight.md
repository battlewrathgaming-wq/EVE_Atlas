# DevHS24: Operator Investigation Queue / Enrich Preflight

Status: Complete
Date: 2026-05-24
Role: Dev
Milestone: Operator Investigation Desk

## Scope

Executed the HS24 runway in `workspace/current.md`: validated-lead Queue / Enrich context and Enrich selected preflight clarity.

This packet stayed on existing renderer/service paths. It did not add live collection machinery, backend resolver services, automatic discovery, automatic enrichment, metadata hydration from startup, assessment creation from Investigation load, watch execution, zKill link / killmail ID paste support, first-class region behavior, relationship graph, timeline grouping, live success smoke, or evidence pruning.

## Changes

- Added a Queue / Enrich Context panel to the Investigation screen.
- Routed `Review Queue / Enrich` through existing `scope.validate` and read-only `queue.selection` before opening Queue / Watches.
- Prefilled stored discovery-scope queue filters for durable actor/system/radius leads.
- Showed whether the validated lead has queued possible refs, selected refs for Enrich selected, expected ESI calls, already stored/cached refs, or needs Discover Possible Leads first.
- Kept no-ref states explicit: no queued refs is not a stored-evidence conclusion.
- Clarified Queue / Enrich copy to use `Enrich selected` for the operator action while preserving the existing `manual.expansion` service path.
- Expanded manual expansion preflight rows for provider, selected refs, cap, expected ESI calls, expected writes, discovery boundary, evidence effect, and metadata hydration separation.
- Updated Electron rugged smoke to cover the Investigation actor lead to Queue / Enrich route.
- Updated renderer static verification and current-state UI documentation.

## Evidence Covered

- Discovery refs remain possible leads, not evidence or observations.
- `queue.selection` remains read-only and creates no evidence.
- Enrich selected is explicit ESI killmail expansion into stored killmail evidence and normalized activity events.
- Metadata hydration remains readability-only and separate from evidence enrichment.
- Passive startup and passive Investigation loading still do not call zKill, call ESI, mutate evidence, hydrate metadata, save assessments, or run watches.
- Marked/Watch semantics remain unchanged.

## Verification

```txt
npm.cmd run verify:renderer-shell
Result: passed
```

```txt
npm.cmd run smoke:electron
Result: passed
Artifact: .tmp/electron-visual-smoke/visual-smoke-result.json
Notable check: investigation_queue_context_loaded=true.
```

```txt
npm.cmd run verify:all
Result: passed
All verification group passed with 61 scripts.
```

No live API smoke, real SDE network download, destructive retention/pruning operation, or private runtime DB export was run.

## Files Changed

```txt
src/renderer/index.html
src/renderer/app.js
src/renderer/investigation.js
src/renderer/queueWatch.js
src/main/main.js
scripts/verify-renderer-shell.js
docs/current-state/current-ipc-ui-preparation.md
workspace/current.md
workspace/DevHS24-operator-investigation-queue-enrich-preflight.md
```

## Deferred

- Record drawer semantics.
- Intelligence/Finding naming.
- Pasted zKill links / killmail IDs.
- First-class region investigation.
- Battle timeline grouping or fight clustering.
- Relationship graph or footprint story implementation.
- Live success smoke.
- Evidence pruning/deletion.
- New backend resolver services.
- Automatic discovery or automatic enrichment.

## Recommended Next Packet

Proceed with Overseer review. A sensible next bounded slice is either assessment-memory ergonomics from a loaded stored-evidence context or another narrow Investigation Desk operator-flow refinement chosen by Overseer.
