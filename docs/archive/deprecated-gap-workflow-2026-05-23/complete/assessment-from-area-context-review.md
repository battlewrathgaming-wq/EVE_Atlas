# Gap To-Do: Assessment From Area Context Review

Status: Complete
Priority: P3
Milestone: Structured Area Review And Watch Authoring

Completed: 2026-05-22

## Mission Statement

Decide how, or whether, an operator should create assessment memory from area/radius observations.

Actor-report assessment memory exists. Area reports introduce different semantics: repeated presence, multi-system presence, and local activity do not automatically identify ownership, staging, intent, or affiliation.

## Items For Completion

- Review current actor-report assessment artifact flow.
- Identify which area/radius observations may be assessment inputs.
- Define wording that separates area observation from assessment.
- Decide whether area-context assessment should create actor/corp-focused artifacts, system/area-focused artifacts, or remain deferred.
- If proceeding, define required reason/summary fields and source snapshot fields.
- Keep evidence deletion and compaction writes out of scope.

## Guardrails

- Do not turn repeated presence into proof.
- Do not create assessment artifacts automatically.
- Do not treat watchlist/disposition labels as evidence.
- Do not add UI implementation until radius structured report presentation exists.

## Completion Signal

There is either a clear no-build decision or an implementation-ready design for deliberate area-context assessment memory.

## Decision

Do not add a broad "save assessment from radius report" action in this milestone.

Area/radius reports are observation surfaces. They can show repeated presence, multi-system presence, role mix, and activity by geography, but those observations do not prove ownership, staging, affiliation, intent, or threat.

The current actor-report assessment flow remains the only full renderer assessment creation path. Radius reports should remain readable observation work products until the user selects a specific assessment target.

## Allowed Future Area-Context Assessment Paths

Future implementation may add one or both deliberate paths:

- Entity-focused assessment from an area row: the operator selects a character, corporation, or alliance observed in the radius report, then saves an `entity_interest` artifact using that selected entity as the durable target.
- Area analyst note: the operator saves an `analyst_note` with `source_report_type = radius`, source report parameters, included systems, evidence window, and sample killmail IDs. This is a note about the scoped area context, not a claim that an entity owns or stages there.

Do not create assessment artifacts automatically from repeated presence or multi-system presence.

## Area Observations That May Feed Assessment

These may be copied into a source snapshot when the operator deliberately saves an assessment:

- evidence window and sample status
- included systems, constellations, and regions
- stored killmail count and activity event count
- selected entity raw ID and cached label, if entity-focused
- selected entity role mix
- selected entity systems observed
- first observed and last observed times
- sample killmail IDs
- collection provenance run IDs when available

These values remain supporting context. They do not become evidence and they do not replace raw expanded ESI killmail records.

## Required Future UI Wording

Area-context assessment UI should use wording like:

```txt
This saves assessment memory from the loaded radius observation context.
Repeated or multi-system presence is a signal for review, not proof of staging, ownership, affiliation, or intent.
Evidence records are unchanged.
```

If an entity is selected:

```txt
Assessment target: <Name> [<entity_type>: <entity_id>]
Source: radius observation report
```

If no entity is selected:

```txt
Assessment target: analyst note over radius scope
Source: radius observation report
```

## Required Fields For Future Implementation

Any future area-context assessment action should require:

- assessment reason or summary
- explicit boundary confirmation
- source report type: `radius`
- source report parameters
- evidence window start/end
- evidence scope type: `radius`
- evidence scope snapshot
- sample killmail IDs, when present
- selected entity type/ID for `entity_interest`, when entity-focused

Score fields should continue to require a reason.

## Current Implementation State

Current renderer behavior is correct for this milestone:

- actor reports can create assessment artifacts
- radius reports show the assessment boundary but do not create artifacts
- assessment artifacts remain metadata/assessment memory, not evidence
- evidence deletion and compaction writes remain out of scope

This completes the review as a no-build decision with implementation-ready guardrails for a later UI slice.

## Related Documents

- `docs/gap/complete/assessment-report-workflow-ui.md`
- `docs/gap/complete/retention-compaction-write-decision.md`
- `docs/terms/work-products.md`
- `docs/statements/retention-and-deprecation-policy.md`
