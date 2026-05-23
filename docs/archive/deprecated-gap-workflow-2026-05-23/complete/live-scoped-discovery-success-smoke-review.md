# Live Scoped Discovery Success Smoke Review

Milestone: Operator Evidence Operations Readiness

## Mission

Prove the successful live scoped zKill discovery path under explicit operator control, then preserve a reviewable artifact trail.

This is not an expansion test. It should remain discovery-only.

## Actionables

- Run the scoped zKill live smoke only with `AURA_ATLAS_LIVE_API=1`.
- Use a disposable or clearly named runtime DB under `F:\Projects\AURA-Atlas\.tmp`.
- Use a conservative system/radius/window.
- Confirm local SDE topology is available before the run.
- Confirm the route is scoped to `/systemID/{id}/pastSeconds/{seconds}/`.
- Confirm no ESI killmail expansion calls occur.
- Confirm no `killmails` or `activity_events` rows are written.
- Confirm queued refs are written only as possible evidence/discovery provenance.
- Review the generated `.tmp/live-scoped-zkill-smoke` artifact.
- Add an audit note summarizing the live run, counts, route, window, artifact path, and evidence boundary.

## Acceptance Checks

- Refusal path still works without `AURA_ATLAS_LIVE_API=1`.
- Success artifact exists and includes route, counts, queued refs summary, API counts, and boundary wording.
- The live run does not create evidence records.
- Any zKill empty or partial response is reported as discovery outcome, not evidence absence.

## Dev Notes

Use this space if the live run fails or the artifact is unclear:

```txt

```
