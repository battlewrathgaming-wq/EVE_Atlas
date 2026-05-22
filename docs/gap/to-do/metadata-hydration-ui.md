# Gap To-Do: Metadata Hydration UI

Status: Open
Priority: P2
Milestone: Controlled Actor/Area Operation

## Mission Statement

Expose metadata hydration as a readability action, not evidence collection.

## Items For Completion

- Choose first hydration context: actor report, corporation report, or queue/report status.
- Show what IDs would be hydrated.
- Show expected ESI name calls.
- Run through `metadata.hydration` as metadata-only task.
- Refresh the report/view after hydration.
- Clearly state that hydration patches labels/readability only.

## Guardrails

- Hydration is not evidence ingestion.
- Raw ESI killmail payloads and durable IDs remain unchanged.
- Prefer report-scoped/top-N hydration, not whole-database hydration.
- Do not hydrate static inventory type names through live ESI when local SDE should handle them.

## Completion Signal

The UI can improve labels for a report-scoped entity set, or there is a written decision to defer hydration UI until more structured reports exist.

## Related Documents

- `docs/audits/audit-2026-05-21-doc-alignment-and-pipeline-trace.md`
- `docs/schemas/metadata-run.md`
- `docs/statements/attention-driven-intelligence.md`
- `docs/gap/complete/background-worker-execution.md`
