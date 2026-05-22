# Gap To-Do: Renderer Modularization Review

Status: Open
Priority: P1
Milestone: Controlled Actor/Area Operation

## Mission Statement

Keep the renderer as an operator shell, not a second backend. Before adding more workflow UI, decide whether `src/renderer/app.js` needs small modules/components for views, service helpers, and rendering helpers.

## Items For Completion

- Review current `src/renderer/app.js` responsibilities.
- Identify separable areas: service client, readiness view, tasks view, queue/watch view, actions view, reports/assessment view, rendering helpers.
- Decide whether to split files now or defer with explicit limits.
- Preserve the existing preload/service boundary.
- Keep renderer modules presentation-only.
- Update `verify:renderer-shell` if files are split so boundary checks still cover the renderer.

## Guardrails

- Do not move backend meaning into renderer modules.
- Do not import main-process code from renderer modules.
- Do not weaken existing static boundary checks.
- Do not refactor for beauty if it delays the next operator proof; this is a scale/control review.

## Completion Signal

A short note or completed gap file states either:

- keep `app.js` whole for one more milestone with a size/responsibility limit, or
- split named renderer modules and update verification.

## Related Documents

- `docs/audits/dev_backend_UI_boundary_2026-05-22.md`
- `docs/audits/audit-2026-05-22-overseer-backend-ui-boundary-handshake.md`
- `scripts/verify-renderer-shell.js`
- `src/renderer/app.js`
