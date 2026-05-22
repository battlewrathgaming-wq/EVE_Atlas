# Audit Handover Dev: Runtime Process Isolation Review

Date: 2026-05-22
Source Review: `docs/audits/audit-2026-05-22-runtime-process-isolation-review.md`
Purpose: concise developer handover concerns for overseer review.

## Handover Summary

The current tracked dev checklist is complete. `docs/gap/to-do` now contains only its README, and the completed items have moved to `docs/gap/complete`.

Current verification signal:

```txt
npm.cmd run verify:all
scripts: 44
result: passed

npm.cmd run smoke:electron
result: passed
```

The project is ready for overseer review before choosing the next milestone slice.

## Concerns To Carry Forward

### Evidence Pruning Remains Blocked

Assessment artifact persistence now exists, but executable evidence compaction/pruning is still intentionally blocked.

Before deletion work exists, Atlas still needs:

- compaction preflight
- preservation preview
- destructive confirmation
- deletion verification
- proof that evidence is never pruned silently

### Runtime Isolation Is Deferred, Not Solved Forever

The review recommends keeping the current main-process service model with detached tasks for the next milestone.

First future isolation target if measured pressure appears:

```txt
SDE import / future SDE sync-compare
```

Second likely candidate:

```txt
large report generation or evidence compaction over large local corp/radius scopes
```

### Session-Armed Watch Execution Needs Cautious Live Exercise

Offline verification proves:

- startup is disarmed
- passive views do not dispatch
- live disabled blocks dispatch
- one due watch dispatches per tick
- success/failure updates watch schedule state

Future live/manual testing should still inspect real API failure behavior, timing, and user ergonomics.

### UI Is An Operational Shell

The Electron shell proves:

- service boundary use
- task visibility
- readiness/status presentation
- queue/watch status
- actor report presentation
- explicit manual discovery
- session arm/disarm execution

It is not yet the final product surface. A UI audit should happen before broad user-facing operation.

### Assessment Artifacts Are Backend-Ready, Not Workflow-Complete

Storage and services exist for deliberate assessment memory:

- `assessment.create`
- `assessment.list`
- `assessment.get`

The renderer does not yet provide a full "save this assessment from report context" workflow.

### Doctrine Boundary Must Stay Visible

The highest drift risk remains conceptual, not mechanical:

- zKill refs are discovery/provenance, not evidence
- queue preview is not evidence
- expanded ESI killmails remain the evidence source
- observations are derived from stored evidence
- assessment is deliberate memory, not evidence
- names are labels; IDs are durable facts
- passive views must not trigger live/API work

## Recommended Overseer Focus

- Review whether the current presentation-validation milestone is accepted.
- Decide whether the next milestone is UI workflow expansion, report presentation polish, or live operational smoke.
- Keep retention/deletion work out of scope until compaction preflight and preservation behavior are specified.
- Treat process isolation as a measured scaling decision, not an immediate refactor.

## Related Files

- `docs/audits/audit-2026-05-22-runtime-process-isolation-review.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/gap/complete/session-armed-watch-executor-implementation.md`
- `docs/gap/complete/assessment-artifact-persistence.md`
- `docs/gap/complete/runtime-process-isolation-review.md`
- `docs/contracts/assessment-compaction-contract.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
