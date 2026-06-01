# Data Layer Boundaries

Status: accepted support note
Date: 2026-06-01

## Purpose

Record the Atlas data-layer language that should guide future data, schema, report, support-artifact, and presentation work.

This note is not a schema migration, Dev runway, UI specification, or provider-work authorization. It accepts the layer meanings needed before later work on patient provider packets, Hydration candidates, Watch Scope readouts, seen-before basis, support artifacts, or pruning intelligence.

## Source Inputs

- `workspace/DataAnalystHS151-data-intent-supporting-schemas.md`
- `workspace/DataAnalystHS152-current-gaps-and-milestone-slices.md`
- Human / Overseer clarification on Watch and Observation boundaries
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/observation-lookup-model.md`

## Core Ladder

```text
Discovery
-> Evidence / EVEidence
-> relationships / appearances
-> Observation
-> Assessment Memory
```

The short Observation ladder is:

```text
Evidence / EVEidence -> relationships / appearances -> Observation
```

## Discovery

Discovery is lead/provenance material.

Discovery may include zKill-derived `killmail_id` / hash pairs, queue rows, public-provider summaries, preview metadata, discovered scope, source run, and route information.

The stored lead form is a **Discovery Ref**.

A Discovery Ref is usually `killmail_id` + `killmail_hash` plus provenance. It is generated from an initial zKill request shaped from an accepted input such as pilot, corporation, system, alliance, ID, or supported resolver/name input.

Discovery must not be treated as Evidence / EVEidence.

Discovery can say:

- Atlas found a possible lead.
- Atlas saw a public-provider reference.
- A ref is pending, selected, failed, unresolved, or expanded.
- A route, scope, or run produced the lead.

Discovery must not imply:

- provider-complete killmail truth
- complete activity coverage
- local Evidence exists
- tactical meaning
- Assessment Memory

## Evidence / EVEidence

Evidence / EVEidence is the local Atlas truth anchor created from ESI-expanded killmail payloads and normalized rows derived from those payloads.

The process that creates this truth anchor is **ESI Evidence Expansion**.

ESI Evidence Expansion means:

```text
Discovery ref
-> killmail_id + killmail_hash
-> ESI killmail endpoint
-> raw ESI killmail payload
-> local Evidence / EVEidence plus normalized relationship / appearance rows
```

After this definition, `Evidence Expansion` may be used as the short form when the ESI source is already clear.

Do not call ESI Evidence Expansion `Hydration`. In Atlas, Hydration is reserved for readability repair after local facts already exist.

The stable basis is:

- raw ESI killmail payload
- killmail ID
- killmail hash
- killmail time
- system ID
- participant, corporation, alliance, ship, item, role, damage, and final-blow IDs/facts derived from the expanded payload
- checksums and ingestion provenance where present

IDs are facts. Labels are readability.

Evidence / EVEidence can support Observation and Assessment, but Observation and Assessment do not become Evidence / EVEidence.

## Relationships / Appearances

Relationships / appearances are the normalized local rows that let Atlas connect Evidence anchors into useful local stories.

They are the "block and string" layer:

- who appeared
- where they appeared
- when they appeared
- which role they had
- which corporation/alliance/ship/system context was known from the Evidence anchor
- which records share IDs, time windows, systems, or source scopes

This layer supports pivots, timelines, seen-before checks, repeated appearances, system activity, actor activity, corporation/alliance context, and Watch-derived local views.

Numeric IDs remain the factual string. Readable labels may be duplicated for convenience, but they are not the fact basis.

A **Relationship** is a computed connection between appearances or anchors. It is not automatically a stored truth table.

Today, the strongest relationship basis comes from an ESI-expanded killmail and the appearances normalized from it. Watch-derived results may later support relationship views or readouts, but that extension remains future/unknown until a dedicated runway defines it.

Relationship grouping exists to keep multiple killmails and appearances coherent in context. It should help Atlas preserve discovery and expansion context, provenance, and basis so records do not become a bottomless undifferentiated database. It must not inflate a computed grouping into new Evidence / EVEidence.

## Hydration

Hydration repairs readability. It does not create Evidence / EVEidence and does not replace IDs as facts.

Hydration can:

- resolve missing names and labels
- repair display readability
- use local SDE or local entity records first
- request provider-backed label repair only under accepted future policy and gates
- produce metadata runs, warnings, or label patches

Hydration must not imply:

- new Evidence / EVEidence
- Discovery expansion
- Assessment Memory
- tactical meaning
- that a label is more authoritative than the ID it describes

## Watch

Watch is operational acquisition intent.

Watch defines what Atlas should check, under what scope, cadence, lookback, and provider/storage gates.

Watch can establish:

- target
- scope
- radius
- cadence
- lookback
- next eligible check
- held or waiting state
- provider movement posture
- Discovery or Evidence acquisition opportunity

Watch does not own the reconstructed story.

Use Watch-related terms for traceability inside Atlas:

- Watch
- Watch Scope
- Watch Scope Readout
- Watch-derived Observation

Do not use `R-Scanner` or `R-scan` as Atlas internal/source terminology. Those are presentation-side candidates past the adapter.

## Observation

Observation is the Atlas product layer that computes and collates local records into an operator-facing story.

Observation is not Evidence / EVEidence, not Discovery, not Watch, not Hydration, and not Assessment Memory.

A future UI may present Observations, but the term does not name a required pane or surface.

Observation can:

- pivot from an accepted anchor such as killmail ID, pilot ID, corporation ID, alliance ID, system ID, or Watch Scope
- reconstruct timelines
- group by system, actor, corporation, alliance, ship, role, or time window
- show first/last observed
- show repeated appearances
- show unresolved labels or gaps
- disclose Evidence / EVEidence and Discovery basis
- include Assessment Memory references without turning them into proof

Observation must not:

- invent tactical meaning
- hide basis
- imply complete coverage
- treat Discovery refs as Evidence
- treat labels as facts
- treat Assessment Memory as Evidence

## Assessment Memory

Assessment Memory is human-authored judgment.

It can attach to known anchors and appear when those anchors are relevant, but it remains separate from Evidence / EVEidence and Observation.

Assessment Memory can be paired with an individual ID so it can be found again when that ID appears in future local records or views.

Assessment Memory can say:

- what the operator thought
- why the operator cared
- what context was present when the assessment was formed
- which Evidence or Observation basis was cited

Assessment Memory must not be silently used as provider truth, factual evidence, or automatic tactical classification.

## Marked

Marked records operator interest.

Marked can influence ordering, review priority, recall, or attention, but it is not Evidence / EVEidence and does not imply Watch.

Accepted boundary:

```text
Watch -> Marked can be valid when active attention has been gathered.
Marked -> Watch is not implied.
```

Marked should not become hidden tactical assessment unless a future explicit assessment type says so.

## Support Artifacts

Support artifacts are operational/debug/recovery material, not Evidence / EVEidence.

Examples include:

- runtime snapshots
- trace packs
- support logs
- corpus health reports
- readiness reports
- pruning previews
- queue/readout diagnostics

Support artifacts may preserve basis, provenance, or recovery context. They must not become primary truth or override deletion/pruning policy.

Future support-artifact creation should be designed only after the data intention for the artifact is clear.

## Future Movement Concepts

Patient provider packets and Hydration candidates remain future schema concepts until a dedicated runway opens them.

If accepted later, they should be treated as movement/control state, not truth.

They must not blur:

- Discovery with Evidence / EVEidence
- Hydration with Evidence / EVEidence
- Watch with Observation
- provider movement with operator authorization
- support artifacts with truth anchors

## Language Rules

Use:

- Discovery for possible leads and provenance.
- Evidence / EVEidence for ESI-expanded killmail truth anchors.
- ESI Evidence Expansion for the ESI killmail expansion process that creates Evidence / EVEidence from Discovery refs.
- Relationships / appearances for local connected ID facts derived from Evidence.
- Hydration for readability repair.
- Watch for operational acquisition intent.
- Observation for computed/collated local story.
- Assessment Memory for human-authored judgment.
- Marked for operator interest.

Avoid:

- `Watch-net story` as durable Atlas terminology.
- `R-Scanner` or `R-scan` in Atlas internal/source docs unless explicitly discussing presentation-side adaptation.
- tactical labels such as dangerous, safe, avoid, engage, or threat outside explicit Human-authored Assessment Memory or future accepted Marked/assessment rules.

## Non-Goals

- No schema change.
- No provider calls.
- No queue implementation.
- No runtime enforcement.
- No support artifact creation.
- No renderer/UI specification.
- No adoption of Lab presentation terms into Atlas internals.
