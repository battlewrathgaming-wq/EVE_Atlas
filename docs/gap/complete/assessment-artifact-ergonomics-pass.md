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
Completed 2026-05-22.

Reviewed the existing actor-report assessment creation and review flow. The structure
was accepted; this pass improved clarity rather than changing the persistence model.

Renderer changes:
- retitled the creation panel as "Create Assessment From Loaded Report"
- shows source report context in the assessment basis
- shows cited killmail IDs before save
- states citation status is validated locally on save
- makes the score/reason rule visible before save
- saved status now echoes citation status and cited killmail IDs

Boundaries preserved:
- assessment creation remains explicit
- visible confirmation remains required
- assessment artifacts do not mutate evidence
- observation reports do not read assessment artifacts

Verification:
- verify:renderer-shell
- verify:assessment-review
- verify:assessment-artifacts
```
