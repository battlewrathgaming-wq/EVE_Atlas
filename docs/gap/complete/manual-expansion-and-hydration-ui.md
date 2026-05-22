# Gap To-Do: Manual Expansion And Hydration UI

Status: Complete
Priority: P1
Milestone: Operational Workflow Hardening

## Mission Statement

Complete the next controlled-action UI path after manual discovery: let the operator choose what to expand or hydrate while preserving the distinction between queue preview, evidence creation, and metadata readability.

## Items For Completion

- Add a renderer path for manual expansion from selected queue refs or queue scope.
- Show selected killmail IDs, expansion cap, expected ESI calls, and queue status before execution.
- Run manual expansion through `manual.expansion` with task wrapping.
- Keep manual expansion explicit; do not auto-expand after manual discovery.
- Add or defer a renderer path for report-scoped metadata hydration.
- If hydration is added, show that it changes labels/readability only and does not mutate raw evidence.
- Route results, warnings, and errors through task UI.

## Guardrails

- Queue refs are not evidence until ESI expansion succeeds.
- Manual expansion is evidence-creating and must be explicit.
- Metadata hydration is metadata-only and must not be described as evidence ingestion.
- Use backend scope validation and service commands; do not create renderer-only expansion rules.
- Keep live gates visible before actions that call zKill/ESI.

## Completion Signal

The renderer can run at least manual expansion through the service/task boundary, or there is a documented decision to defer it with reasons.

Verification should include:

- `verify:renderer-shell`
- `verify:mutating-services`
- relevant manual/queue verification

## Completion Notes

Implemented manual expansion in the Queue / Watches view:

- queue selection preview remains read-only
- manual expansion has an explicit preflight
- selected queued refs and expansion cap are shown before execution
- expected ESI calls are shown from queue selection/live gate state
- manual expansion requires a visible confirmation checkbox
- execution uses `manual.expansion` through the service/task boundary with `asTask` and `detachedTask`
- selected killmail IDs from the preflight are submitted explicitly
- task results, warnings, and errors route through the task UI

Metadata hydration UI is deferred from this slice. Reason: manual expansion is evidence-creating and deserved a small focused control path first. Hydration remains backend/service available as metadata-only work, but it should get its own UI wording so users do not confuse label readability with evidence ingestion.

Verification:

- `verify:renderer-shell`
- `verify:mutating-services`
- `verify:manual-discovery`
- `verify:queue-selection`

## Related Documents

- `docs/contracts/expansion-selection-contract.md`
- `docs/terms/manual-discovery.md`
- `docs/terms/discovery-queue.md`
- `docs/gap/complete/queue-expansion-selection.md`
- `docs/gap/complete/evidence-creating-ui-actions.md`
