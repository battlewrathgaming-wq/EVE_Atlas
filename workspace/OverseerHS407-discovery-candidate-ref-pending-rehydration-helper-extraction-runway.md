# OverseerHS407 - Discovery Candidate Ref Pending Rehydration Helper Extraction Runway

Status: active Dev runway
Date: 2026-06-07
Executor: Dev
Expected handoff: `workspace/DevHS407-discovery-candidate-ref-pending-rehydration-helper-extraction.md`

## Purpose

Move pure pending-ref rehydration helpers out of old collector ownership and into a Discovery-owned helper module, preserving behavior exactly.

This follows the HS399 / HS403 helper-home pattern:

```txt
same behavior
better ownership
no runtime redirect
no status-policy rewrite
```

## Scope

Create a Discovery-owned helper module:

```txt
src/main/discovery/candidateRefMemory.js
```

Move/rehome these helper surfaces into that module:

- `pendingActorDiscovery(pendingRefs, plannerOutput)`
- `pendingSystemRadiusDiscovery(pendingRefs)`

Update imports/callers:

- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`

Preserve current result shapes exactly.

## Accepted Model

- `discovered_killmail_refs` is Discovery working memory.
- Candidate refs are possible leads/provenance, not Evidence/EVEidence.
- Candidate refs are not Discovery task/packet memory.
- Watch owns cadence decisions and populates Discovery work when due/missed/ready.
- Discovery does not monitor Watch cadence.
- Watch consumes a Discovery acquisition receipt/outcome, not the internal candidate-ref table.
- ESI-backed expansion remains downstream Discovery work, not Watch completion.

## Non-Goals

Do not:

- move repository methods
- create a candidate-ref status service
- change `pendingDiscoveryRefs(...)`
- change `upsertDiscoveredKillmailRefs(...)`
- change selected/expanded/cached/failed status mutation behavior
- change `selected_for_expansion_at`, `expanded_at`, `failed_at`, `failure_count`, or `last_error` behavior
- change manual discovery
- change manual expansion
- redirect `actor.watch`
- redirect `system.radius.watch`
- change `runActorWatchService(...)`
- change `watchExecutor.dispatchFor(...)`
- invoke, rewrite, or retire `collectActorWatch(...)` or `collectSystemRadiusWatch(...)`
- change provider-call behavior
- write Discovery refs differently
- write Evidence/EVEidence differently
- write Hydration/metadata
- change `fetch_runs`, API logs, warnings, Watch cadence, Watch run records, or old summary result behavior
- add schema
- add Discovery task/packet persistence
- add receipt machinery
- add dispatcher, queue, lease, worker, or sequencer behavior
- change command metadata/authority
- change runtime enforcement or command blocking
- change renderer UI
- create support artifacts
- rename source-owned terms
- update protected-word JSON

## Acceptance Criteria

Dev should prove:

- pending-ref rehydration helper definitions live under `src/main/discovery/candidateRefMemory.js`
- actor/system collectors import the helpers from the Discovery module
- old collector-local helper bodies are removed or reduced to no local ownership
- actor/system collector behavior remains unchanged
- current manual discovery/manual expansion compatibility remains unchanged
- candidate-ref status mutation behavior remains unchanged
- no runtime redirect, provider movement, schema, UI, enforcement, or durable task/packet behavior was added

## Verification

Run focused syntax checks:

```txt
node --check src\main\discovery\candidateRefMemory.js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\workers\systemRadiusCollector.js
```

Run focused source ownership check:

```txt
rg -n "pendingActorDiscovery|pendingSystemRadiusDiscovery|candidateRefMemory" src\main\workers src\main\discovery
```

Run focused behavior/coverage checks:

```txt
npm.cmd run verify:actor-watch
npm.cmd run verify:collector
npm.cmd run verify:manual-discovery
npm.cmd run verify:queue-scope-isolation
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-report
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:evidence-writer-landing-package-fixture
npm.cmd run verify:evidence-rules
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If an exact script name differs, use the closest existing verifier and state the substitution.

## Handoff Requirements

Create:

```txt
workspace/DevHS407-discovery-candidate-ref-pending-rehydration-helper-extraction.md
```

Include:

- files changed
- helper module path
- export/import summary
- behavior preservation evidence
- verification commands and outcomes
- explicit statement of untouched boundaries
