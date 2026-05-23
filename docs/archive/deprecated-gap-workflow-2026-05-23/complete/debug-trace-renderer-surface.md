# Debug Trace Renderer Surface

Milestone: Operator UI Workflow Polish

## Mission

Expose the existing operator debug trace pack as an explicit renderer action.

The backend/CLI trace pack exists. The app should let an operator generate the same support artifact from the shell without treating it as evidence, observation, or assessment.

## Actionables

- Add a renderer-visible trace pack action, likely in Readiness or Tasks/Support.
- Call the backend trace-pack service or add a service wrapper if needed.
- Require an explicit button click.
- Show:
  - generated file path
  - generated timestamp
  - included summary areas
  - excluded raw evidence payloads
  - no-live/no-evidence boundary wording
- Keep output under `.tmp` by default.
- Add renderer/static verification.
- Add fixture/service verification if a new service command is introduced.

## Acceptance Checks

- The UI action does not run on app load.
- The action does not call zKill or ESI.
- The action does not create killmails, activity events, or assessment artifacts.
- The visible wording says trace packs are support/debug artifacts.
- Raw expanded ESI payloads remain excluded by default.

## Dev Notes

```txt
Completed 2026-05-22.

Added support.debug_trace_pack service command and a Readiness view action that writes
the bounded local operator debug trace pack under .tmp by explicit button click.

The renderer displays output path, generated timestamp, included summary areas, excluded
raw evidence payloads, and no-live/no-evidence/no-assessment boundary wording.

Added/extended verification:
- verify:operator-debug-trace covers the service command and no-mutation behavior
- verify:renderer-shell covers the visible renderer action and boundary wording
- verify:service-registry covers command registration indirectly through existing registry checks
```
