# TODO: UI Language Contract

Status: Drafted In Place

This file remains in `docs/gap/to-do` while the overseer reviews it.

## Actionables

- Define approved UI terms for evidence, observation, and assessment layers.
- Avoid overclaiming terms such as confirmed, resident, owner, staging, or hostile fleet.
- Use partial sample and evidence window language consistently.
- Label queue refs, previews, evidence, observations, and assessments distinctly.
- Make IDs visible in detail/audit contexts.

## Task Requirements

The UI must carry the project's evidence discipline into presentation.

Preferred terms:

- evidence report
- observation report
- assessment artifact
- observed operator
- repeated presence
- candidate signal
- partial sample
- collection provenance

Avoid unless explicitly supported:

- confirmed resident
- owns system
- staged here
- hostile fleet
- proven affiliation

## Work-Product Layers

### Evidence

Evidence is stored, expanded ESI killmail data and normalized records derived from it.

Use for:

- expanded killmail
- stored evidence
- evidence record
- activity event
- evidence window
- evidence footer
- raw expanded ESI killmail

Do not use evidence language for:

- zKill discovery refs
- queue previews
- AI commentary
- human assessment notes

Rule:

`zKill refs are possible evidence. Expanded ESI killmails are evidence.`

### Observation

Observation is a scoped presentation of stored evidence.

Use for:

- observation report
- observed operator
- observed activity
- repeated presence
- attacker appearance
- victim appearance
- multi-system presence
- recurring corporation
- counterpart corporation
- activity cadence

Observation wording should describe what the evidence shows without claiming intent, ownership, staging, affiliation, or threat status.

### Assessment

Assessment is human or AI interpretation placed on top of evidence and observation.

Use for:

- assessment
- assessment artifact
- analyst note
- commentary
- interpretation
- disposition label

Assessment must be labeled as assessment/commentary and should cite or link back to the evidence or observation scope it relies on.

## Queue And Preview Language

Discovery queue items are not evidence yet.

Use for queued refs:

- discovery ref
- queued ref
- possible evidence
- pending expansion
- expanded
- failed expansion
- skipped by cap
- already cached

Avoid:

- killmail evidence, unless expansion already succeeded
- activity, unless derived from expanded ESI evidence
- operator, unless derived from stored activity events

Preview rows may show zKill-provided context as discovery context only. If a preview lacks a display label that requires ESI expansion, show:

`[Resolve with ESI]`

This is a factual placeholder, not a button label and not an error state. It means the readable detail is unavailable until the ref is expanded through the evidence pipeline.

## Scope And Sample Language

Every evidence or observation screen should show its scope.

Required language elements:

- evidence window
- selected scope: actor, system, radius, corporation, alliance, constellation, or region
- stored killmail count
- activity event count
- partial or complete sample status
- collection provenance when relevant
- source statement

Preferred phrasing:

`Stored evidence matching this scope.`

`Collection provenance may include multiple run types.`

`Source: zKill discovery + ESI expanded killmails.`

When capped or incomplete:

`PARTIAL SAMPLE`

`Expanded sample: N stored killmails from M discovered refs.`

Avoid:

`All activity`

`Complete history`

`Known operators`

unless the evidence corpus truly supports that claim.

## IDs And Labels

IDs remain facts. Names are display labels.

Compact UI may show:

- `Rifter`
- `ZTS-4D`
- `The Initiative.`

Detail, audit, and drill-down UI should show:

- `Rifter [typeID: 587]`
- `ZTS-4D [solarSystemID: 30004660]`
- `The Initiative. [allianceID: 1900696668]`
- `Pilot Name [characterID: 123]`

Unknown names should not look like broken UI.

Use:

- `Type 587 [unresolved]`
- `Character 123 [unresolved]`
- `[Resolve with ESI]` when the label specifically requires ESI expansion rather than local metadata lookup

## Action Language

Use verbs that match the pipeline stage.

Discovery actions:

- `Discover refs`
- `Add to queue`
- `Preview queue`

Expansion actions:

- `Expand selected refs`
- `Expand with ESI`
- `Store evidence`

Observation actions:

- `Build observation report`
- `Show evidence timeline`
- `Show repeated presence`

Assessment actions:

- `Add assessment`
- `Save assessment artifact`
- `Add analyst note`

Avoid action labels that imply unsupported conclusions:

- `Confirm operator`
- `Mark resident`
- `Identify staging`
- `Prove affiliation`

## Guardrails

- UI copy must not imply certainty beyond evidence.
- AI commentary must be labeled as commentary.
- Names are labels; IDs remain facts.
- Discovery refs and preview context must not be presented as evidence.
- Disposition labels affect presentation, ranking, and alerting only; they do not mutate evidence.
- Collection provenance explains how evidence entered storage; it does not define intelligence scope.

## Warning And Status Labels

Use clear status labels:

- `Blocked`
- `Needs live API`
- `Needs local SDE import`
- `Partial sample`
- `No stored evidence in scope`
- `No queued refs`
- `Expansion cap reached`
- `Confirmation required`

For local lookup failures:

- State the missing local lookup category.
- Do not silently fall back to live API.
- Preserve the run failure so missing local files can be corrected.

For live API gates:

- State that live calls are disabled.
- State which action would use zKill or ESI.
- Do not estimate ESI call count when it is unknowable before discovery; say `unknown until discovery` or report the known cap.

## Completion Signal

Renderer text follows the work-product layers: evidence, observation, assessment.

The future renderer can use this file as the source for headings, button labels, empty states, report footers, queue preview labels, and warning language.
