# Overseer HS287 - HS286 Missing Links Assurance Review

Status: accepted
Date: 2026-06-05
Project: AURA Atlas
Reviewed by: Atlas Overseer

## Reviewed

- Request: `workspace/OverseerHS286-user-input-fetch-selected-resolution-missing-links-assurance-request.md`
- Primary advisory: `workspace/EngineeringDataHS286-user-input-fetch-selected-resolution-missing-links.md`
- Secondary advisory: `workspace/EngineeringDataHS286-secondary-task-creation-watch-mechanics.md`

## Result

HS286 is accepted as advisory input. No Dev runway is opened by this review.

The two artifacts answer different questions and should both be preserved:

- the primary artifact maps the operator input -> fetch -> Evidence Expansion -> Observation/local readability -> selected-ID Resolve pipeline;
- the secondary artifact maps below-UI task creation and Watch mechanics, especially volatile task state versus durable run/output truth.

## Accepted Direction

Atlas should not move directly into renderer-triggered Resolve, broad Hydration, Bucket/Dispatcher, Watch result persistence, schema changes, runtime enforcement, or UI work.

The strongest next rich surface is:

```txt
selected unresolved local ID -> Resolve candidate -> future report readability reuse
```

This should be a local-only, read-only proof/readout if opened. It should show unresolved IDs visible from local report/Observation output, strong local basis, current label state, candidate Resolve relevance, and the report/corpus context that would benefit after resolution. It must not call providers, write Hydration output, create queues, dispatch work, change schema, or create renderer execution.

## Accepted Secondary Surface

The secondary Watch/task artifact identifies a separate useful seam:

```txt
Task origin and durable outcome map for Manual Search and Watch
```

This is not the same as selected-ID Resolve. It should remain parked unless Human/Overseer selects the Watch/task lane.

Accepted findings:

- current task state is volatile runtime tracking, not durable workflow truth;
- durable truth lives in local rows such as `fetch_runs`, `discovered_killmail_refs`, `killmails`, `activity_events`, `watchlist_entities`, and `system_watches`;
- Manual Discovery and Manual Expansion are better defined than Watch result meaning;
- Watch authoring creates durable intent, scheduler/executor movement is controlled runtime behavior, and Watch output is currently collection provenance plus local Evidence/EVEidence changes;
- no durable `watch_result` or relationship-tag artifact should be implied;
- system/radius Watch scope snapshot versus recomputed topology remains a design question.

## Product-Ready / Posture / Proof / Parked

Accepted product-ready areas from the advisories:

- Manual Discovery command and worker path, subject to live gates.
- Queue selection preview as read-only preview only.
- Manual Expansion command and worker path, subject to live gates.
- Durable Evidence/EVEidence write through existing repository/ingestion paths.
- Local report/Observation construction from stored Evidence/EVEidence.
- Local readability reuse from existing labels and SDE/static lookup.
- Trusted non-renderer selected-ID Resolve execution command.
- Local label reuse after Resolve writes.

Accepted posture/readout-only areas:

- Queue/clock posture and patient packet identity readouts.
- Hydration request/pickup/preflight postures.
- Watch schedule/offline/runtime readouts.
- Task list/get as volatile runtime diagnostics.

Accepted proof/fixture-only areas:

- HS276 proof flags, fixed IDs, seeded temp stores, verifier-created rows.
- HS284 fixture/injected-provider verification.

Accepted parked areas:

- renderer-triggered selected-ID Resolve execution
- UI confirmation behavior
- report-wide or background Hydration as the product Resolve path
- Bucket/Dispatcher/worker/lease/retry/persisted queue
- active runtime enforcement / command blocking
- schema changes
- provider/API live tests
- support artifacts
- durable `watch_result`
- relationship tag writes
- durable relationship model
- fourth lane reopening

## Terminology Notes

Preserve these distinctions:

- `fetch` is ambiguous; use `Discovery fetch`, `Evidence Expansion`, or `report-ready local sample`.
- `selected` in queue preview is not durable reservation.
- `Resolve` means one selected unresolved local ID readability repair.
- `complete fetch` should not imply complete coverage.
- Watch output should not be called `watch_result` unless that future artifact is explicitly accepted.
- Relationship-shaped output remains Observation unless Human/Overseer accepts a durable data-model boundary or Assessment-support meaning.

## Recommended Next Options

1. Open a narrow read-only Dev proof for selected-ID Resolve candidate/report handoff.
2. Keep HS286 as advisory only and record a current-state note instead.
3. Pivot to the separate Watch/task outcome map lane.

Recommendation: choose option 1 if the next step should continue the selected-ID Resolve pipeline. Choose option 3 only if the Human wants to return to Watch mechanics.

## Smallest Safe Dev Packet If Accepted

Potential packet:

```txt
Build a read-only selected-ID Resolve candidate preview from local report output or equivalent local query.
```

It should return:

- unresolved visible IDs
- entity type
- local evidence basis
- current local label status
- whether selected-ID Resolve preflight is relevant
- report/corpus context that would benefit after resolution

Boundaries:

- no provider calls
- no Hydration writes
- no metadata runs
- no queue or dispatcher
- no schema
- no renderer execution
- no UI behavior
- no support artifacts
- no Watch/task result persistence

## Human / Overseer Decisions

Human/Overseer should decide whether to:

- open the selected-ID candidate/report handoff proof;
- park selected-ID pipeline and explore Watch/task outputs instead;
- define `complete fetch` user wording now or leave it parked;
- leave relationship/corpus presentation report-specific for now.

## Acceptance

HS286 is accepted as assurance. It reduces uncertainty and identifies the next rich surface, but it does not authorize implementation by itself.
