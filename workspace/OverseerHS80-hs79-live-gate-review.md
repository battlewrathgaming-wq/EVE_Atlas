# Overseer HS80 - HS79 Live Gate Review

Date: 2026-05-26
Role: Atlas Overseer
Status: accepted

## Decision

HS79 is accepted.

The Dev packet implemented the first-pass Live provider gate and Watch / Sequencer diagnostic without broad provider-queue architecture, schema changes, stale/expired ref mutation, live verification calls, UI work, or hydration coupling.

## Accepted Behavior

- Live/manual provider attempts now produce request-control metadata: provider, action, target, lookback, caps, scope fingerprint, cooldown/lockout state, and next eligible timing.
- Live manual discovery rejects radius before provider work.
- Same Live fingerprint enters cooldown after an accepted provider-attempt point.
- Running duplicate attempts block as `ALREADY_RUNNING` without immediate lockout.
- Repeated blocked attempts create per-fingerprint lockout after 3 repeats inside 10 minutes.
- Watch scheduling includes a Watch / Sequencer diagnostic for planned packets, caps, radius allowance, wait state, and `waiting_is_failure: false`.
- Retryable ESI/provider capacity deferral writes warning state, writes no Evidence, writes no activity events, and leaves selected refs pending.
- Metadata hydration remains outside request-control cooldown/lockout policy.

## Preserved Boundaries

- Live search remains immediate and narrow.
- Watch / Sequencer remains the patient radius/lookback acquisition lane.
- Discovery queue refs remain returned zKill refs, not request-control sequencer rows.
- Evidence remains ESI-expanded killmail storage.
- Waiting is not failure.
- Cooldown is endpoint pacing, not punishment.
- Lockout is rare and scoped by provider + action + fingerprint.

## Deferred Work

- Durable request-control state across restart.
- Persisted Watch / Sequencer packet state.
- Operator-facing waiting/cooldown/readout presentation.
- Queue stale/expiration mutation.
- Broad provider work queue design, if ever needed.

## Forward Design Input

Atlas should keep the future sequencing model split:

- Discovery Sequencer: paced zKill acquisition that returns Discovery refs.
- Enrichment Sequencer: paced ESI expansion of known refs into Evidence.
- Hydration: readability/metadata repair and label work, separate from request-control sequencing.

zKill batch capacity is useful future packet-sizing input, not a current permission to expand Live search or bypass pacing.

## Verification

- `npm.cmd run verify:all` passed, 65 scripts.
- `npm.cmd run verify:protected-terms` passed with exit code 0, warning-only.
- Protected-term discovery scanned 13 working-set files.
- Warning count: 461.
- Warning classes: lab-quarantine-borrowing 199, atlas-candidate 233, cross-project-borrowing 29.
- `git diff --check` passed.

## Files Reviewed

- `workspace/current.md`
- `workspace/DevHS79-live-gate-sequencer-diagnostic.md`
- `workspace/OverseerHS79-live-gate-mechanic-acceptance.md`
- `workspace/OverseerHS78-request-control-sequencer-advisory-review.md`
- `workspace/OverseerHS77-queue-systems-design-advisory-request.md`
- `workspace/OverseerHS76-queue-stale-expiration-design-input.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-manual-discovery-lane.md`
- implementation and verifier files listed in `workspace/DevHS79-live-gate-sequencer-diagnostic.md`

## Current State

`workspace/current.md` is refreshed to a resting state. No Dev runway is open.
