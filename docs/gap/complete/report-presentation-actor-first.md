# Gap To-Do: Report Presentation Actor First

Status: Complete
Priority: P1

## Completed

- Built the first report UI around the native structured actor report response.
- Renders evidence basis, observations, collection provenance, warnings, raw IDs, and retained text/export output.
- Uses UI language from the completed UI language contract.
- Treats text-bridged report types as transitional until they gain native structured models.

## Task Requirements

The actor report is the first major report with native structured response data. It should be the first report presentation surface because it exercises the desired UI contract without relying entirely on text parsing.

The view should show:

- evidence basis and sample status
- actor identity with ID label
- role split
- systems/regions observed
- ships observed
- timelines/cadence/final blow rows where available
- collection provenance
- warnings

## Guardrails

- Do not imply staging, ownership, residency, affiliation, or intent.
- Keep IDs visible in detail contexts.
- Do not derive extra report meaning in the renderer.
- Report UI should present backend sections, not recompute evidence.

## Completion Signal

An actor report can be requested and rendered from `report.actor`/`report.build` structured data, with evidence/observation/provenance sections clearly separated.

## Verification

- `verify:renderer-shell`
- `verify:report-response`
- `verify:all`

## Related Documents

- `docs/gap/complete/structured-report-responses.md`
- `docs/contracts/report-scope-contract.md`
- `docs/gap/complete/ui-language-contract.md`
- `docs/current-state/current-report-products.md`
