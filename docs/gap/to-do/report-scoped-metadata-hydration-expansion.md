# Gap To-Do: Report-Scoped Metadata Hydration Expansion

Status: Open
Priority: P2
Milestone: Structured Area Review And Watch Authoring

## Mission Statement

Extend readability-only metadata hydration beyond actor reports where it improves operator inspection.

Hydration should remain scoped to the report or selected work product, not the entire database.

## Items For Completion

- Choose the next hydration contexts after actor report: radius report and/or corporation report.
- Reuse the existing metadata-only task pattern.
- Show candidate IDs and estimated ESI name calls before hydration.
- Exclude static inventory type labels from live ESI hydration; those remain local SDE metadata.
- Refresh the current report after hydration completes.
- Record metadata runs and API logs as metadata/provenance, not evidence.
- Update verification for the chosen report context.

## Guardrails

- Hydration does not create evidence.
- Hydration does not mutate raw ESI killmail payloads.
- Hydration does not run automatically on report load.
- Whole-database hydration is out of scope for this task.

## Completion Signal

At least one non-actor report context can run explicit, report-scoped metadata hydration and become more readable without changing evidence counts.

## Related Documents

- `docs/gap/complete/metadata-hydration-ui.md`
- `docs/contracts/metadata-hydration-contract.md`
- `docs/schemas/metadata-run.md`
- `src/main/metadata/reportHydrator.js`

