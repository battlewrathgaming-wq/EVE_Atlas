# Data HS117: Relationship Pivot Data Substrate Assurance

Date: 2026-05-27
Role: Atlas Data Analyst / Data Engineer
Status: Advisory state note only

## Request Received

Capture assurance that Atlas' current local data shape can support future correlation, relationship display, and slicing/pivot workflows.

This note is advisory only. It does not start a Dev runway, change schema, rename terms, alter `workspace/current.md`, or authorize implementation.

## Core Assurance

Yes: the current Atlas dataset has the foundation needed for relationship pivoting.

Atlas is not limited to reviewing preserved killmails as isolated records. The expanded ESI killmail remains the truth anchor, but Atlas already normalizes each captured event into relationship-bearing local rows that can be queried by pilot, corporation, alliance, ship/type, system, role, and time.

The product capability is not fully built yet, but the data substrate exists.

## Mental Model

Atlas captures a killmail as a moment in time.

That moment records:

- who was present
- what role they had
- where it happened
- when it happened
- what ships, corporations, and alliances were involved

Atlas then stores searchable connection points around that event. Those connection points allow future workflows to pivot outward from one killmail into an actor, corporation, system, ship, or time-window story.

## Current Data Shape

The useful substrate is:

- `killmails`
  - one row per ESI-expanded killmail
  - raw ESI payload is preserved
  - this is the Evidence/EVEidence anchor

- `activity_events`
  - normalized participant/activity rows derived from stored killmails
  - includes character, corporation, alliance, role, ship/type, system, and time fields
  - this is the main pivot/query surface

- `entities`
  - local readability labels and known metadata for characters, corporations, and alliances
  - useful for display, not proof by itself

- `type_metadata`
  - local ship/type labels

- `solar_systems`, `regions`, and related SDE tables
  - local location labels and topology context

- `discovered_killmail_refs`
  - zKill possible leads and provenance
  - useful for expanding a story, but not Evidence until ESI expansion succeeds

- `assessment_artifacts`
  - human-authored Assessment Memory
  - useful as judgment/context, not proof

## Example Pivot

Starting point:

```text
one stored ESI-expanded killmail
```

Future operator question:

```text
Where have we seen this pilot before?
```

Local answer can be assembled from stored rows:

```text
activity_events
  filtered by pilot ID
  grouped or ordered by system, time, role, ship, corporation, alliance
```

That can produce a local story:

```text
Atlas has seen this pilot in these systems, at these times,
in these roles, using these ships, with or against these groups.
```

This is an Observation over stored Evidence/EVEidence. It is not proof of current location, intent, ownership, staging, or affiliation.

## Operational "Hydrate This Story" Meaning

From the operator's point of view, it is reasonable to describe a follow-on action as hydrating or expanding the pilot's story.

Internally, Atlas should keep the boundaries clear:

- local story: assembled from stored Evidence/EVEidence
- story expansion: zKill lookback finds more possible leads
- evidence confirmation: ESI expansion turns selected refs into stored Evidence/EVEidence
- readability repair: metadata hydration fills missing names and labels for already-local IDs

The operator experience can feel like "hydrate this pilot's story," while Atlas still preserves the Discovery / Evidence / Hydration / Observation / Assessment boundaries.

## Current Capability Assessment

Existing data can support:

- pilot location history from local stored killmails
- pilot role history across attacker/victim/final-blow contexts
- corporation event-time member sightings
- corporation observed systems, ships, counterpart corporations, and counterpart alliances
- system/radius observed operators
- time-window slicing
- ship/type slicing
- raw ID fallback when labels are missing
- local-first story assembly before provider-backed expansion

Existing implementation is partial:

- reports already perform some actor, radius, system, and corporation aggregation
- the current UI/product layer is not yet a polished relationship graph or pivot workspace
- boundary readout still needs care so zKill preview, labels, and Assessment Memory are not overread

## Critical Limits

Atlas should not overclaim this capability.

- A local pivot story is only as complete as stored local Evidence/EVEidence.
- zKill preview is not Evidence.
- Discovery refs are possible leads, not observations.
- Labels are metadata; IDs are the stable facts.
- Event-time corporation/alliance fields are not proof of current membership.
- Assessment Memory is human judgment, not proof.
- Missing labels should degrade display, not block truthful local output.
- Follow-on provider work must remain gated and explicit.

## Recommendation

Treat relationship pivoting as a valid future product direction because the local data shape supports it.

Do not start by changing schema. The next safe step, when selected by Human/Overseer, should be a read-only proof or report that demonstrates one or two operator pivots from existing rows, such as:

- killmail -> pilot -> seen systems/times/roles
- corporation -> observed pilots/systems/ships
- system -> recurring actors/corporations

That proof should show the Evidence basis, label completeness, Discovery-only leads, and Assessment context separately.

## Boundary Confirmation

This artifact is advisory only.

No code, schema, runtime behavior, provider behavior, storage behavior, Watch behavior, Evidence/EVEidence behavior, Discovery refs, hydration behavior, Assessment Memory, `workspace/current.md`, or Dev runway was changed.
