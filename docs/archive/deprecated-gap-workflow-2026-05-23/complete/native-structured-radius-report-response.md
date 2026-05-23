# Gap To-Do: Native Structured Radius Report Response

Status: Complete
Priority: P1
Milestone: Structured Area Review And Watch Authoring

## Mission Statement

Expose radius report meaning as native structured backend data before rendering it in the UI.

The renderer should receive evidence basis, observations, provenance, warnings, labels, and raw IDs as structured fields. It should not parse CLI text or reconstruct radius meaning.

## Items For Completion

- Review the current radius report builder and identify the report sections needed by UI.
- Add or extend backend report response support for `report.radius`.
- Include structured evidence scope: center system, radius, included systems, evidence window, and sample status.
- Include structured observation sections: per-system activity, repeated actors, multi-system presence, timeline rows, warnings, and provenance.
- Include raw IDs and display labels together where auditability matters.
- Preserve existing CLI/text radius report output.
- Add verification to `verify:report-response` or a dedicated report response check.
- Confirm `report.radius` remains read-only.

## Guardrails

- Do not use pending queue refs as evidence.
- Do not imply staging, ownership, affiliation, or intent.
- Do not make renderer code compute repeated/multi-system presence.
- Keep local SDE lookup use in backend/report layer.

## Completion Signal

`report.radius` returns native structured sections suitable for UI rendering, and the existing text report still works as an export/readout.

## Completion Notes

Completed on 2026-05-22.

`report.radius` now returns a native structured response with scope, evidence basis, included systems, radius observations, collection provenance, warnings, raw IDs, interpretation warning, and retained text output.

Verification:

- `npm.cmd run verify:report-response`
- `npm.cmd run verify:radius-report`

## Related Documents

- `docs/gap/complete/structured-report-expansion.md`
- `docs/gap/complete/controlled-area-operation-workflow.md`
- `docs/contracts/report-scope-contract.md`
- `src/main/services/reportResponseService.js`
- `src/main/reports/radiusReport.js`
