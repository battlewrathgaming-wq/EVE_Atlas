# Assessment Artifact Ergonomics Pass

Milestone: Operator UI Workflow Polish

## Mission

Make assessment artifact creation and review easier to use while preserving the layer boundary.

Assessment artifacts are deliberate memory. They should be useful to create from report context, but must not become evidence or observation input.

## Actionables

- Review the current actor-report assessment creation flow in the renderer.
- Improve wording and layout around:
  - reason/summary
  - score fields
  - cited killmail IDs
  - citation status
  - evidence window
  - source report context
- Consider a clearer "create assessment from loaded report" surface.
- Keep score fields tied to explicit reason/summary.
- Keep artifact detail review distinct from observation report sections.
- Add/extend renderer verification for any UI changes.

## Acceptance Checks

- Assessment creation remains explicit.
- Assessment save still requires visible confirmation.
- Assessment artifacts do not mutate evidence.
- Observation reports do not read from assessment artifacts.
- Cited evidence IDs remain visible in review details.
- The UI does not imply assessment is proof, fact, or raw evidence.

## Dev Notes

```txt

```
