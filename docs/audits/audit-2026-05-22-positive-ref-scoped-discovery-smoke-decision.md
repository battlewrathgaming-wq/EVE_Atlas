# Positive-Ref Scoped Discovery Smoke Decision

Date: 2026-05-22

## Decision

Defer the second live scoped discovery-only smoke for now.

## Reason

The accepted live scoped discovery smoke already proved the important safety boundary:

- local system resolution before route construction
- explicit live gate
- scoped zKill route planning
- discovery-only execution
- zero ESI expansion
- zero `killmails` written
- zero `activity_events` written
- reviewable smoke artifact output

The only missing signal is a non-empty queued-ref result from live zKill. That would be useful for artifact-shape confidence, but it is not necessary enough to justify another live API call without a known respectful target/window.

## Boundary

This is a deferral, not a rejection.

When a suitable low/moderate activity target is known, Atlas can run a positive-ref scoped discovery-only smoke with:

- disposable `.tmp` DB
- `AURA_ATLAS_LIVE_API=1`
- conservative lookback/caps
- zKill discovery only
- no ESI expansion
- queued refs only
- no evidence writes

## Current Confidence

Fixture and offline checks already cover non-empty queue behavior. The live smoke covers live gate and no-evidence behavior. Together, they are enough for the current Operator Workflow Closure And Debuggability milestone.
