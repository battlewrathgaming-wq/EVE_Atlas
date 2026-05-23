# Gap To-Do: Radius Report Presentation UI

Status: Complete
Priority: P1
Milestone: Structured Area Review And Watch Authoring

## Mission Statement

Render the radius evidence report as an operator-facing area review without making the renderer an intelligence engine.

This is the first area-focused Atlas presentation surface.

## Items For Completion

- Start only after renderer modularization and native structured radius response are complete.
- Add UI controls for center system, radius, and evidence window/lookback.
- Call `report.radius` through the service bridge.
- Render evidence basis, included systems, observations, warnings, provenance, and text export separately.
- Show partial-sample language when evidence is capped or incomplete.
- Use evidence/observation terminology, not assessment/proof wording.
- Include raw IDs in detail/audit contexts.
- Update `verify:renderer-shell` and, if useful, `smoke:electron` screenshot expectations.

## Guardrails

- Do not run collection from loading a radius report.
- Do not parse report text.
- Do not derive repeated presence or multi-system presence in renderer code.
- Do not hide evidence warnings behind polished UI.

## Completion Signal

The renderer can load and inspect a radius report through structured backend data, with no passive collection and no renderer-side intelligence derivation.

## Completion Notes

Completed on 2026-05-22.

The Reports pane now includes radius report controls for center system, radius jumps, optional lookback, and max systems guard. It calls `report.radius` through the service bridge and renders backend-owned evidence basis, included systems/scope, observation sections, warnings, raw IDs, provenance, and retained text export.

Verification:

- `npm.cmd run verify:renderer-shell`
- `npm.cmd run smoke:electron`

## Related Documents

- `docs/gap/to-do/native-structured-radius-report-response.md`
- `docs/gap/complete/report-presentation-actor-first.md`
- `docs/gap/complete/ui-language-contract.md`
- `docs/terms/work-products.md`
