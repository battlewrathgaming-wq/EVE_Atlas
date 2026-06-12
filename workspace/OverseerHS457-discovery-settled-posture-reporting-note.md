# OverseerHS457 - Discovery Settled-Posture Reporting Note

Status: accepted shaping note
Date: 2026-06-12

## Purpose

Capture the Human/Overseer alignment on when Discovery should report back to callers.

## Accepted Shape

Discovery should be capture-rich internally, but quiet externally.

Discovery should not report every internal step to Watch or other callers. It should report when the emitted work has reached a settled posture.

Settled posture includes:

- refs found and landed
- no refs found
- capped
- provider deferred
- failed retryable
- failed terminal
- held by external I/O
- partially handled with recoverable gaps

Report-worthy does not mean success only. It means the caller can safely stop waiting on that emitted work item and make its own decision.

## Boundary

Discovery may report factual handling and provider timing posture:

- handled / not handled
- deferred
- failed
- capped
- Evidence/EVEidence landed
- warnings
- supporting basis
- retry-after or next provider eligible time

Discovery must not decide Watch cadence or next action.

Watch owns cadence interpretation from Watch state:

- last run
- current time
- configured cadence
- backoff rules
- armed state
- task status
- whether the run satisfies Watch completion

Provider timing facts may cross the boundary. Watch scheduling decisions do not.

## Recovery

Discovery recovery gaps remain Discovery work, not Watch work.

Watch should receive a settled receipt projection for the emitted scope/window/task. It should not inspect Discovery memory or consume all internal Discovery basis by default.
