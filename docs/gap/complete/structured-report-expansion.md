# Gap To-Do: Structured Report Expansion

Status: Complete - Deferred By Decision
Priority: P2
Milestone: Controlled Actor/Area Operation

## Mission Statement

Extend structured report presentation beyond the actor report without forcing the renderer to parse text or recompute evidence meaning.

## Items For Completion

- Choose the next report target: corporation, radius, system, queue, or run diagnostics.
- Confirm backend response includes structured sections suitable for UI rendering.
- Add renderer presentation for that report type.
- Keep evidence basis, observations, provenance, warnings, raw IDs, and text export separated.
- Add/update renderer-shell verification for the selected report UI.

## Guardrails

- Do not parse CLI text in the renderer when structured data exists or can be added.
- Do not derive report meaning in the renderer.
- Do not imply assessment from observations.
- Keep IDs visible in audit/detail contexts.

## Completion Signal

At least one additional report type has a structured UI path comparable to the actor report, or the chosen report is documented as not ready for structured presentation.

## Decision

Do not add a second full structured report UI in this milestone.

Chosen next report target:

```txt
radius report
```

Reason:

- Radius reports are the next most product-defining report after actor reports.
- They prove the "Atlas" area-watch concept: included systems, repeated presence, multi-system presence, and evidence scope.
- They are more useful for the next UI step than queue/run diagnostics alone.

## Why Deferred

The renderer modularization review set an explicit trigger:

```txt
Split before adding a second full structured report UI comparable to actor report.
```

Adding radius report presentation now would push more workflow and report rendering into `src/renderer/app.js` after we already accepted it only for one narrow operator-proof slice.

The current non-actor `report.build` path also still relies partly on text-derived sections. The renderer should not parse CLI text or infer report meaning. Before adding radius report UI, the backend should expose a native structured radius response comparable to the actor report response.

## Required Before Implementation

Before radius report UI is added:

- split or modularize renderer report/view helpers
- add a native structured radius report response model
- preserve text export for audit/export
- expose evidence basis, collection provenance, observations, warnings, raw IDs, and labels as structured fields
- update `verify:report-response`
- update `verify:renderer-shell` to scan all renderer modules

## Current Acceptable State

The app already has:

- actor report structured UI
- queue selection structured UI
- text export/report scripts for radius/system/corporation/run reports
- radius report CLI verification
- controlled area workflow documentation

This is enough for the Controlled Actor/Area Operation milestone without violating the renderer growth limit.

## Related Documents

- `docs/gap/complete/structured-report-responses.md`
- `docs/gap/complete/report-presentation-actor-first.md`
- `docs/current-state/current-report-products.md`
- `docs/gap/complete/ui-language-contract.md`
