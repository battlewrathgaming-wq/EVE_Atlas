# Gap To-Do: Renderer Modularization Review

Status: Complete
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

## Review Result

Decision:

```txt
Keep src/renderer/app.js whole for the first Controlled Actor/Area Operation slice, with explicit limits.
```

Rationale:

- The renderer is large, but the current static boundary checks are strong and green.
- A module split now would mostly move presentation code around before the next operator proof exists.
- The next milestone needs one coherent actor/area workflow more than it needs cosmetic file reshaping.
- Premature splitting could weaken the current `verify:renderer-shell` coverage if done hastily.

Current `src/renderer/app.js` responsibilities reviewed:

- service/preload bridge access
- app initialization and view switching
- readiness/settings view
- scope validation view
- task list/detail/progress view
- queue selection and manual expansion view
- watch schedule/session executor view
- manual discovery action view
- actor report presentation
- assessment artifact presentation
- shared rendering helpers
- window controls

Separable future modules:

- `renderer/serviceClient.js`
- `renderer/views/readinessView.js`
- `renderer/views/scopeView.js`
- `renderer/views/taskView.js`
- `renderer/views/queueWatchView.js`
- `renderer/views/actionsView.js`
- `renderer/views/reportsView.js`
- `renderer/rendering/domHelpers.js`
- `renderer/rendering/tableHelpers.js`

## Explicit Limits For This Milestone

Keep `app.js` whole only while the next work stays inside the first controlled actor/area proof.

Split before adding:

- a second full structured report UI comparable to actor report
- corporation/radius assessment creation flows
- executable actor watch UI outside existing service/task patterns
- retention/compaction write UI
- any renderer-side state machine larger than the current simple state object

Do not allow:

- renderer imports from `src/main`
- renderer SQLite/repository/worker access
- renderer-side recomputation of report meaning
- passive page-load collection
- hidden live/API work from view rendering

## Verification Decision

No code split was performed in this slice, so `verify:renderer-shell` does not need structural updates yet.

Future split must preserve or strengthen existing checks:

- all renderer entry files scanned for forbidden backend imports
- service calls still go through `window.atlasServices`
- window controls still go through `window.atlasWindow`
- passive views still avoid `actor.watch` and `system.radius.watch`

## Completion Notes

This review accepts the current single-file renderer for one more narrow operator-proof slice, but treats further workflow growth as the trigger for modularization.

## Related Documents

- `docs/audits/dev_backend_UI_boundary_2026-05-22.md`
- `docs/audits/audit-2026-05-22-overseer-backend-ui-boundary-handshake.md`
- `scripts/verify-renderer-shell.js`
- `src/renderer/app.js`
