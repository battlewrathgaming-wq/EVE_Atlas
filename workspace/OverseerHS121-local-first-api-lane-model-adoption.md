# OverseerHS121 - Local-First API Lane Model Adoption

Status: accepted as Atlas steering context
Date: 2026-05-31
Role: Overseer

## Source Material

Reviewed from Shapespace:

- `F:\Projects\Shapespace atlas\Shapespace\Atlas engineering model - local-first API lanes.md`
- `F:\Projects\Shapespace atlas\Shapespace\Northstar.md`

Shapespace remains advisory/context only. This record is the Atlas-local adoption surface.

## Request Answered

Human asked which shaping material points Atlas toward alignment and whether the material should be moved into Atlas so the project has a spine to walk on before hardening resumes.

## Decision

Accept the local-first API lane model as Atlas steering context for the Storage And Runtime Hardening milestone.

This does not open Dev work.

This does not rename Atlas source/bridge terms.

This does not replace `workspace/current.md`, `workspace/critical/`, durable docs, or accepted verification.

## Accepted Steering Model

Atlas should reason locally before provider movement:

```text
operator request or scheduled work
  -> validate scope and intent
  -> inspect local DB
  -> classify missing work
  -> route to one lane only
  -> write only the lane-owned outputs
  -> expose status and basis readout
```

Provider work should support the local corpus, not replace it.

## Local Inspection Layer

Atlas should inspect durable local state before any provider-backed action.

This inspection layer is read-only.

It may classify:

- local answer already sufficient
- missing Evidence/EVEidence
- missing labels/readability
- pending Discovery refs
- provider work candidates
- presentation/report basis

It must not:

- call providers
- write Evidence/EVEidence
- mutate Discovery refs
- mutate metadata

## Execution Lanes

### Lane 1 - zKill Discovery

Purpose: find candidate killmail refs.

Writes:

- `discovered_killmail_refs`
- `fetch_runs`
- `api_request_logs`
- `data_quality_warnings` when needed

Boundary:

- does not create Evidence/EVEidence
- does not write `killmails`
- does not write `activity_events`
- zKill preview remains Discovery/provenance only

### Lane 2 - ESI Killmail Expansion

Purpose: convert selected Discovery refs into durable Evidence/EVEidence.

Writes:

- `killmails`
- `activity_events`
- `ingestion_audits`
- `fetch_runs`
- `api_request_logs`
- `discovered_killmail_refs` status updates
- `data_quality_warnings` when needed

Boundary:

- this is the provider lane that creates Evidence/EVEidence
- dedupe before calls
- skip already-cached killmails
- do not casually overwrite raw ESI payloads
- failed expansion leaves reviewable provenance and does not become Evidence/EVEidence

### Lane 3 - Fast / View Metadata Hydration

Purpose: make the currently requested local view readable.

Writes:

- `entities`
- `metadata_runs`
- `api_request_logs` with metadata run type
- permitted display-label patches on local derived rows

Boundary:

- does not create Evidence/EVEidence
- does not mutate raw killmail payloads
- does not replace IDs as facts
- selective and responsive
- not blocked behind broad background hydration work

### Lane 4 - Background / Patient Metadata Hydration

Purpose: improve readability of locally stored records over time.

Writes:

- `entities`
- `metadata_runs`
- `api_request_logs` with metadata run type
- permitted display-label patches

Boundary:

- does not create Evidence/EVEidence
- does not perform exhaustive hydrate-all behavior
- capped, deduped, and lower priority than current-view hydration
- waiting is not failure

## Read / Report / Observation Surfaces

Observation and report surfaces consume local stored data and derived relationships.

They may read:

- `killmails`
- `activity_events`
- `entities`
- local SDE tables
- `discovered_killmail_refs` as provenance / possible leads only
- `assessment_artifacts` as human judgment only
- `fetch_runs` and `api_request_logs` as support provenance

Boundary:

- read/report surfaces do not create truth
- Observation derives from stored Evidence/EVEidence and local context
- Assessment Memory is human-authored judgment, not Evidence/EVEidence
- Discovery refs may be shown as possible leads/provenance, not observation facts

## Gate Stack

Provider-backed lanes should pass all relevant gates before movement:

- `external_io` allowed
- provider/action cadence allowed
- provider `Retry-After` respected
- storage setup/write state allowed
- scope valid
- confirmation present if required
- Watch armed if Watch-driven
- task/concurrency lock available

If a gate blocks movement, Atlas should emit status rather than silently fail.

Candidate statuses:

- `held_by_external_io`
- `storage_locked`
- `provider_wait`
- `retry_after`
- `scope_invalid`
- `already_local`
- `pending_refs_exist`
- `expansion_required`
- `labels_missing`

## North-Star Data Rule

Atlas stores provider-confirmed event evidence locally, preserves the authority of each data layer, and derives operator-facing views from scoped transforms over local records.

Layer authority:

- Evidence/EVEidence is stored provider-confirmed truth.
- Discovery is possible lead/provenance.
- Hydration is readability repair.
- Relationships are derived.
- Observation is a view over local records.
- Assessment is human judgment.

No derived layer should silently become more authoritative than the ESI-expanded killmail Evidence/EVEidence it came from.

## What This Aligns

This model aligns the next Atlas hardening work by giving every future action a question:

```text
What local state already exists?
Which lane wants to move?
Which gates apply?
What would this lane write?
What basis should the operator see?
```

That makes the next seam clearer:

```text
storage gate action matrix
```

The action matrix should classify allowed/blocked/demo-only/warning/hard-lock behavior by action class and storage posture, using this lane model as context.

## Parked / Not Decided

- Final local inspection service name.
- Exact storage config filename/location.
- Final fast/view hydration trigger list.
- Background hydration priority policy.
- Discovery-to-expansion selection policy.
- Runtime enforcement of `external_io`.
- Any schema changes.
- Any UI presentation changes.

## Verification Implication

Future packets should prove lane boundaries with existing offline verifiers or new focused verifiers.

Do not run live/provider/private/destructive actions from this adoption note.

## Disposition

Accepted into Atlas workspace as steering context.

No Dev runway opened.
