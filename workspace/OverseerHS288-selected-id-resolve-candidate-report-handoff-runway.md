# Overseer HS288 - Selected-ID Resolve Candidate / Report Handoff Runway

Status: active
Date: 2026-06-05
Project: AURA Atlas
Executor: Dev
Expected handoff: `workspace/DevHS288-selected-id-resolve-candidate-report-handoff.md`

## Purpose

Add a read-only, local-only proof/readout for the missing handoff between local report/Observation output and one selected unresolved ID that may later be resolved.

This packet should prove:

```txt
selected unresolved local ID -> Resolve candidate -> future report readability reuse
```

It should not execute Resolve. It should identify candidates and explain basis.

## Context

Accepted advisory:

- `workspace/EngineeringDataHS286-user-input-fetch-selected-resolution-missing-links.md`
- `workspace/OverseerHS287-hs286-missing-links-assurance-review.md`

Accepted posture:

- `docs/features/selected-id-readability-repair.md`

Current selected-ID Resolve execution command:

```txt
metadata.selected_id_readability_repair.execute
selected_id_readability_repair
```

This packet should sit before that command. It should show what local report/corpus surface can offer as a safe one-ID Resolve candidate.

## Task

Build a read-only selected-ID Resolve candidate/report handoff preview, preferably:

```txt
metadata.selected_id_resolve_candidate.preview
```

The preview should derive from local report output or equivalent local queries.

It should return:

- report or local context identity
- unresolved visible IDs
- selected ID type and value
- whether the selected ID is a supported provider-backed Resolve type
- current local label state
- strong local basis, if present
- parked/conditional basis, if present
- whether selected-ID Resolve preflight would be relevant
- report/corpus context that would benefit after resolution
- explanation that focus/visibility is not request
- explanation that candidate is not provider execution
- explanation that report-wide or multi-ID Hydration is not being used

The preview may support a small explicit input shape such as:

```txt
report_type
report_params
selected_id_type
selected_id_value
```

Prefer existing report/local query helpers where practical. Keep the slice narrow and obvious.

## Required Boundaries

Do not:

- call providers
- run live/API verification
- execute selected-ID Resolve
- write Hydration output
- write metadata runs
- write API logs
- mutate `entities`
- patch `activity_events`
- create Evidence/EVEidence
- mutate Discovery refs
- create queues, Bucket, Dispatcher, worker, lease, retry, or persisted work
- change schema
- add renderer/UI behavior
- add runtime enforcement or command blocking
- create support artifacts
- reopen Watch/task result work
- reopen fourth lane / fast lane
- use old report-scoped `metadata.hydration` as the selected-ID product path

## Acceptance Criteria

- Preview is read-only and renderer-eligible only if consistent with existing service patterns.
- Preview can enumerate or disclose unresolved visible IDs from local report/context data.
- Preview can classify the selected ID as:
  - already local/readable
  - provider-backed Resolve candidate with strong local basis
  - unsupported/static local lookup
  - insufficient basis
  - parked/conditional basis only
- Preview discloses the local basis layer used for candidacy.
- Preview discloses which report/corpus context would benefit from later readability repair.
- Preview states that candidate/visibility/focus is not a provider request.
- Preview states that later Resolve execution must revalidate current trusted gates.
- Verifier proves no provider calls and no table writes.
- Verifier proves existing selected-ID Resolve execution is not invoked.
- Verifier proves old report-scoped `metadata.hydration` is not used as the selected-ID product path.

## Suggested Verification

Run focused checks:

```txt
node --check src\main\services\serviceRegistry.js
node --check [new service file]
node --check [new verifier file]
npm.cmd run verify:[new-selected-id-resolve-candidate-preview]
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
```

Run protected terms if emitted terms or labels change:

```txt
npm.cmd run verify:protected-terms
```

Run `git diff --check` and `git status --short --branch`.

## Stop Conditions

Stop and return to Overseer if:

- provider contact becomes necessary
- writes become necessary
- renderer/UI behavior becomes necessary
- candidate preview requires product wording that blurs focus, request, pickup, execution, or write
- report-wide or multi-ID Hydration becomes necessary
- old `metadata.hydration` must be altered to complete the packet
- Bucket/Dispatcher/queue machinery becomes necessary
- schema changes become necessary
- Watch/task result work becomes necessary
- the command would imply Evidence/EVEidence creation

## Expected Handoff

Create:

```txt
workspace/DevHS288-selected-id-resolve-candidate-report-handoff.md
```

Include:

- files changed
- command/readout added
- sample outputs
- how candidates are derived
- basis classification
- boundaries preserved
- verification commands and results
- parked items
