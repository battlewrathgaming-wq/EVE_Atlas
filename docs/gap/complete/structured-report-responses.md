# Complete: Native Structured Report Responses

Status: Complete For First Major Report
Priority: P2

## Actionables

- Replace text-parsed report responses with native structured report data.
- Keep text report output as a rendering/export layer, not the source of structured UI data.
- Define stable section shapes for evidence basis, observations, provenance, warnings, labels, and raw IDs.
- Migrate report response verification away from fragile text parsing where practical.

## Task Requirements

The service report response bridge previously called CLI/text report builders, then parsed headings and labels back out of text.

That is acceptable as a bridge, but the renderer should consume structured rows and sections directly from backend report modules.

## Current Implementation

The actor report now has a model/render split:

```txt
buildActorReportModel
-> native structured evidence/observation/provenance sections
-> renderActorReport for CLI/export text
```

`report.actor` / actor `buildReportResponse` now returns:

- `response_mode: native-structured`
- native evidence basis lines
- native observation section rows with rendered values and raw row data
- native collection provenance lines
- warnings
- raw IDs
- retained text output for CLI/export compatibility

Other report types still use the text bridge and should be migrated incrementally.

## Guardrails

- UI components must not re-derive evidence meaning.
- Text wording changes should not break the actor structured response contract.
- Reports must preserve evidence window, sample size, provenance, warnings, and ID-first labels.
- Evidence/observation/assessment terminology must remain explicit.

## Verification

- `verify:report-response`
- `verify:actor-report`
- `verify:reports`
- `verify:service-registry`

## Completion Signal

At least one major report type returns native structured sections without parsing its own text output. Existing CLI text output still works as a renderer/export of the same structured result.

## Remaining Follow-On Work

- Migrate system report to native structured sections.
- Migrate radius report to native structured sections.
- Migrate corporation report to native structured sections.
- Migrate queue and run diagnostics reports where useful.

## Related Files

- `src/main/services/reportResponseService.js`
- `src/main/reports/actorReport.js`
- `docs/contracts/report-scope-contract.md`
- `docs/gap/complete/report-response-contract.md`
- `docs/gap/complete/ui-language-contract.md`
