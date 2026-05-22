# Corpus Health Renderer Surface

Milestone: Operator Evidence Operations Readiness

## Mission

Expose the read-only corpus health report in the Electron renderer so an operator can inspect local DB health without running live work.

This is an operational readiness surface, not an intelligence report.

## Actionables

- Decide where corpus health belongs in the current shell:
  - Readiness view
  - Reports view
  - a future Support/Diagnostics view
- Prefer the smallest useful renderer addition.
- Invoke `report.corpus_health` through the service bridge.
- Show:
  - classification boundary
  - core row counts
  - integrity checks
  - warning groups
  - operational freshness
- Make clear that corpus health is not observation and not assessment.
- Keep the surface read-only.
- Do not trigger live APIs.
- Do not parse report text in the renderer if structured data is available.
- Add renderer shell verification for the new surface.

## Acceptance Checks

- `verify:renderer-shell` covers the new controls/text.
- `verify:all` still passes.
- Loading corpus health does not call zKill or ESI.
- Loading corpus health does not create evidence, observations, or assessments.
- The UI wording distinguishes corpus health from evidence reports.

## Dev Notes

```txt

```
