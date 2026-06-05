# Overseer HS291 - HS290 Watch / Task Outcome Map Assurance Review

Status: accepted
Date: 2026-06-05
Project: AURA Atlas
Reviewed by: Atlas Overseer

## Reviewed

- Request: `workspace/OverseerHS290-watch-task-outcome-map-assurance-scope-request.md`
- Advisory artifact: `workspace/EngineeringDataHS290-watch-task-outcome-map-assurance-scope.md`

## Result

HS290 is accepted as advisory/scoping input. No Dev runway is opened by this review.

Accepted recommendation:

```txt
Atlas has enough source truth to derive a read-only Watch/task origin and durable outcome map without new schema, provider calls, task dispatch, or Watch execution.
```

Not accepted for implementation yet:

- durable `watch_result`
- `watch_result_items`
- relationship tags
- durable task queues
- dispatcher/Bucket machinery
- schema changes
- Watch-derived relationship truth

## Accepted Boundaries

Preserve:

```txt
Evidence records what happened.
Provenance records how Atlas got it.
Watch/task result readouts group what a specific scope/run found.
Observation interprets/group-presents local records.
Assessment remains human judgment.
```

Accepted source-backed boundary:

- task state is volatile runtime tracking;
- `run_id` is durable collection provenance;
- Watch schedule fields are durable timing/posture metadata;
- Evidence/EVEidence remains the durable ESI-expanded corpus truth;
- Manual Discovery outputs possible leads / Discovery refs, not Evidence;
- Manual Expansion outputs Evidence/EVEidence and run provenance;
- Watch authoring outputs durable intent rows;
- Watch schedule/offline readouts output derived posture;
- Watch executor movement can create volatile task movement;
- Watch collection outputs fetch runs, Discovery refs, Evidence/EVEidence, API logs, warnings, and Watch schedule updates;
- reviewed source does not show a durable `watch_result`, relationship tag, or task result written into Evidence/EVEidence.

## Important Findings

### Radius Watch Scope

Accepted finding:

- system/radius Watch authoring stores `included_system_ids` and `excluded_system_ids`;
- scheduler exposes those stored lists;
- executor dispatch payload does not pass stored included/excluded lists;
- product collection appears to recompute topology from center/radius;
- not proven: executor-dispatched collection honors stored excluded systems.

Decision remains open:

```txt
Should system/radius Watch execution use stored snapshot, recomputed topology, or a disclosed hybrid?
```

### System/Radius Queue Identity

Accepted finding:

- system/radius collector uses `discoveredByType: system_radius`;
- it uses `discoveredById: centerSystemId`;
- radius, Watch ID, and stored included system list are not part of Discovery ref identity in that path;
- this may be sufficient for a single active radius meaning per center;
- it is not clearly sufficient for multiple radius Watches sharing one center or future outcome-map semantics.

Decision remains open:

```txt
Should system_radius Discovery ref scope remain center-only, or become center-plus-radius/watch identity before result semantics rely on it?
```

### Evidence Boundary

Accepted finding:

- current Evidence boundary is mostly sound;
- `activity_events.discovered_by_type` / `discovered_by_id` are acceptable as light provenance;
- they should not become the place where Watch results, relationship tags, or task meaning accumulate.

Do not add without a future explicit decision:

- `killmails.watch_result_id`
- `killmails.task_found_by`
- `activity_events.relationship_tag`
- `activity_events.watch_result_label`
- `activity_events.task_result_id`

## Proposed Future Read-Only Surface

If opened later, the smallest safe proof is:

```txt
Watch / Task Outcome Map Preview
```

It should disclose, without dispatching or writing:

- origin kind: Manual Discovery, Manual Expansion, Watch authoring, schedule readout, executor dispatch, collection;
- operator act or trigger;
- service command;
- whether state is volatile or durable;
- expected durable rows;
- latest matching `fetch_runs`;
- Discovery ref counts by status;
- Evidence/EVEidence counts;
- warning/error/deferral basis;
- Watch row and schedule posture if applicable;
- task volatility warning;
- system/radius authored scope versus current collector-planned scope;
- whether queue identity is center-only or center-plus-radius/watch-capable;
- explicit statement that no `watch_result` or relationship tag exists.

## Parked Items

- durable `watch_result`
- `watch_result_items`
- relationship tag writes
- durable relationship model
- Watch-derived Assessment
- durable task queue
- Bucket / Dispatcher / worker / lease / retry
- provider/API execution
- Watch dispatch from preview
- schema changes
- Evidence/EVEidence mutation
- Discovery ref mutation
- Watch row mutation
- UI/renderer work
- support artifacts
- runtime enforcement or command blocking
- fourth lane / fast lane reopening

## Human / Overseer Decision Needed

Decide whether HS290 should remain advisory only, or whether to open a bounded read-only Dev proof for a Watch/task outcome map preview.

Recommendation: open the read-only proof if the next seam should continue Watch/task clarity. Keep durable result/schema decisions parked.
