# Gap To-Do: Report Presentation Polish

Status: Complete
Priority: P2
Milestone: Operational Workflow Hardening

## Mission Statement

Make Atlas reports more useful to an operator without changing their meaning: improve presentation, navigation, and terminology while preserving the backend as report authority.

## Items For Completion

- Review the Electron screenshots from `smoke:electron`.
- Identify text overflow, cramped sections, unclear labels, missing empty states, and poor scan order.
- Improve actor report presentation first because it has native structured response data.
- Decide which report type should get structured UI next: corporation, radius, system, queue, or run diagnostics.
- Keep evidence basis, observations, provenance, warnings, and raw IDs visually distinct.
- Keep text export available for audit/export.
- Avoid renderer-side recomputation of report meaning.

## Guardrails

- Do not imply staging, ownership, affiliation, or intent without assessment.
- Do not hide IDs in detail/audit contexts.
- Do not treat queue preview as evidence.
- Do not allow display polish to change report scope.
- Keep UI language aligned with `docs/gap/complete/ui-language-contract.md`.

## Completion Signal

At least one report view is materially easier to inspect, with screenshots or notes showing before/after behavior, while renderer-shell verification remains green.

Completed:

- Reviewed the `smoke:electron` reports screenshot from `F:\Projects\AURA-Atlas\.tmp\electron-visual-smoke\reports.png`.
- Added a report status / empty-state callout so blank report panels are not ambiguous.
- Actor report load now summarizes sample status, actor, evidence window, killmail count, and activity event count at the top of the Reports view.
- Observation section headings now show row counts for faster scanning.
- Evidence basis, observations, collection provenance, warnings, raw IDs, assessment memory, and text export remain visually distinct.
- Text export remains available for audit/export.
- Renderer still consumes backend report sections and does not recompute report meaning.

Next structured report UI candidate:

- Queue is already partly structured in Queue / Watches.
- Corporation or radius should be the next native structured report surface when the workflow needs a second full report view.

## Related Documents

- `docs/gap/complete/report-presentation-actor-first.md`
- `docs/gap/complete/structured-report-responses.md`
- `docs/gap/complete/ui-language-contract.md`
- `docs/current-state/current-report-products.md`
