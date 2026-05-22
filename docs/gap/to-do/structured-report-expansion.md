# Gap To-Do: Structured Report Expansion

Status: Open
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

## Related Documents

- `docs/gap/complete/structured-report-responses.md`
- `docs/gap/complete/report-presentation-actor-first.md`
- `docs/current-state/current-report-products.md`
- `docs/gap/complete/ui-language-contract.md`
