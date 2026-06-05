# Selected-ID Readability Repair

Status: accepted posture
Date: 2026-06-05

## Purpose

Record the accepted Atlas posture for resolving one selected unresolved local ID into a readable label.

This note defines product posture and terms. It is not a UI specification, renderer authorization, background Hydration design, queue/Dispatcher design, or provider-work expansion.

## User-Facing Act

The user-facing act is:

```text
Resolve
```

Resolve means:

```text
Repair readability for this one selected unresolved local ID.
```

Resolve does not mean:

- create Evidence / EVEidence
- complete a report
- hydrate a whole report
- start background Hydration
- bypass local-first checks
- bypass provider gates
- authorize renderer-triggered provider contact

## Internal Meaning

Internally, Resolve belongs to Hydration/readability repair.

Atlas language remains:

```text
Evidence / EVEidence -> raw-ID Observation -> selective Hydration for readability -> Assessment Memory
```

Hydration outputs readability repair. It does not create Evidence / EVEidence and does not replace numeric IDs as facts.

The preferred product command/run-type pair is:

```text
metadata.selected_id_readability_repair.execute
selected_id_readability_repair
```

The accepted preflight command is:

```text
metadata.selected_id_readability_repair.product_preflight
```

## Authority Posture

Atlas trusts deliberate operator intent.

That means a clear Resolve act may authorize the request shape. Atlas should not degrade user intent through arbitrary counters or repeated suspicion prompts.

Atlas still moderates provider movement through:

- local-first checks
- selected-ID normalization
- strong local basis requirement
- storage/write posture
- External I/O posture
- live/provider gate posture
- provider cadence and duplicate-work controls
- command authority / confirmation
- response validation
- bounded write policy

Provider restraint is not distrust of the operator. It is Atlas being a respectful network actor.

## Local Basis

First product selected-ID Resolve should require strong local basis:

- Evidence/EVEidence-derived `activity_events` appearance
- existing local `entities` row missing a label

These are parked or conditional basis only:

- Watch-only
- Discovery-only
- Assessment-only

They may inform attention, but they do not authorize first product provider-backed Resolve unless Human/Overseer deliberately changes the policy.

## Local Short-Circuit

If a readable label already exists locally, Atlas should use it automatically during report / Observation construction.

The operator should not normally face a raw ID when Atlas already has a local readable label for that entity.

If Resolve is requested and the label already exists locally:

- no provider call
- no Hydration write
- no audit row
- return a quiet already-readable result

Quiet closure is acceptable. Already-resolved work does not need to create more noise.

## Execution Posture

A future execution command must recheck trusted facts immediately before provider contact:

- selected ID type/value
- supported ID type: `character`, `corporation`, `alliance`
- strong local basis still exists
- local label still missing
- not a local SDE/static lookup case
- storage/write posture allows readability repair
- External I/O is released
- live/provider gate allows the attempt
- confirmation/command authority is satisfied

It must recheck local readability again before write. If another path resolved the label, close quietly.

## Allowed Writes For Later Execution

If product execution is opened and all gates pass, allowed writes are limited to:

- `metadata_runs`
- sanitized `api_request_logs`
- selected `entities` row
- matching `activity_events` readability label columns

## Forbidden Mutations

Resolve must not mutate:

- `killmails`
- raw ESI killmail payloads
- numeric `activity_events` facts
- `discovered_killmail_refs`
- `fetch_runs`
- `ingestion_audits`
- Evidence-related `data_quality_warnings`
- Watch rows
- Marked rows
- Assessment Memory
- storage config
- External I/O config
- schema
- Bucket / Dispatcher / worker / lease / retry / persisted queue state
- support artifacts
- renderer UI state
- runtime enforcement / command blocking state

## Failure And Held Meanings

Before provider contact:

- local label exists: quiet already-readable result
- External I/O off: held, not failure
- cooldown/lockout active: held, not failure
- storage write blocked: blocked before contact
- malformed/unsupported ID: rejected before contact
- insufficient local basis: rejected before contact

After provider contact:

- valid response: success, readability repair writes only
- unresolved provider response: partial
- category mismatch: failed
- unsafe or empty label: failed
- provider/network/HTTP error: failed or retryable under the existing provider-gate policy

## Parked

Remain parked:

- renderer-triggered Resolve
- UI confirmation behavior
- report-wide Hydration execution
- background Hydration
- Watch/background Hydration pickup
- Bucket / Dispatcher / worker / lease / retry / queue design
- schema changes
- runtime enforcement activation
- support artifacts
- fourth lane / fast lane
