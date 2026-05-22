# Gap To-Do: Queue Report Text Export Fix

Status: Complete
Priority: P2
Milestone: Structured Area Review And Watch Authoring

## Mission Statement

Fix the queue report presentation bug where a structured queue report can render as `[object Object]` in the text export area.

This is a small correctness/polish task before adding radius report UI.

## Items For Completion

- Review `loadQueueReport()` in `src/renderer/reports.js`.
- Confirm the shape returned by `report.queue`.
- Render `report.text` when available.
- If `report.text` is absent, render a safe JSON fallback or concise structured summary.
- Keep queue refs framed as discovery/provenance metadata, not evidence.
- Update `verify:renderer-shell` or add a small renderer/report check if practical.
- Run `npm.cmd run verify:renderer-shell`.
- Run `npm.cmd run smoke:electron`.

## Guardrails

- Do not parse text to derive queue meaning.
- Do not trigger queue selection, discovery, or expansion from loading the queue report.
- Do not introduce evidence or observation wording for pending refs.
- Do not broaden this into radius report UI.

## Completion Signal

The Queue Report Text panel shows a readable report or fallback instead of `[object Object]`, with no passive collection and no evidence-boundary drift.

## Completion Notes

Completed on 2026-05-22.

`loadQueueReport()` now renders `report.text` when a structured report response provides it, preserves string reports, and falls back to formatted JSON for unexpected structured responses.

Verification:

- `npm.cmd run verify:renderer-shell`
- `npm.cmd run smoke:electron`

## Related Documents

- `docs/audits/audit-2026-05-22-overseer-complete-audit-handover.md`
- `docs/gap/complete/queue-and-watch-status-views.md`
- `docs/gap/complete/report-response-contract.md`
- `src/renderer/reports.js`
