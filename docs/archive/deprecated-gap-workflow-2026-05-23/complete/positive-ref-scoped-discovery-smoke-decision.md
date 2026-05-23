# Positive-Ref Scoped Discovery Smoke Decision

Milestone: Operator Workflow Closure And Debuggability

## Mission

Decide whether to run a second live scoped discovery-only smoke that returns queued refs.

The accepted success smoke proved live gating and no-evidence behavior, but it returned zero refs. A positive-ref smoke would prove artifact shape and queue behavior under a non-empty zKill response.

## Actionables

- Decide whether the value justifies another live API call.
- Prefer deferral unless a respectful target/window is already known.
- If running it:
  - use `AURA_ATLAS_LIVE_API=1`
  - use a disposable or clearly named `.tmp` DB
  - keep radius/window/caps conservative
  - make zKill discovery calls only
  - make zero ESI calls
  - write queued refs only
  - write no `killmails`
  - write no `activity_events`
  - preserve the generated smoke artifact
- If deferring it:
  - add a short audit note explaining why the zero-ref smoke is enough for now.

## Acceptance Checks

- Positive-ref success, if run, records queued refs and still writes no evidence.
- Artifact includes route, lookback, counts, queued ref sample, and boundary wording.
- No expansion is performed.
- Audit trail records the decision.

## Dev Notes

```txt
Completed 2026-05-22.

Decision: defer a second live positive-ref scoped discovery-only smoke until a known
respectful target/window is available.

Rationale: the accepted zero-ref live smoke already proved local resolution, live gate,
scoped zKill route construction, discovery-only execution, zero ESI expansion, zero
killmail/activity event writes, and reviewable artifact output. Fixture/offline checks
already cover non-empty queue behavior.

Audit note:
docs/audits/audit-2026-05-22-positive-ref-scoped-discovery-smoke-decision.md
```
