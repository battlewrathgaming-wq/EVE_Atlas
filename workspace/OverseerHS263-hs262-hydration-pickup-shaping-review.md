# Overseer HS263 - HS262 Hydration Pickup Shaping Review

Status: accepted
Date: 2026-06-05
Reviewed artifact: `workspace/DataEngineeringHS262-hydration-request-pickup-shaping-advisory.md`
Request answered: `workspace/OverseerHS262-hydration-request-pickup-shaping-advisory-request.md`

## Result

Accepted. No blocking issue found.

HS262 correctly keeps Atlas at the shaping boundary. It does not open provider-backed selected-ID Hydration execution, persistence, dispatcher behavior, worker pickup, schema changes, runtime enforcement, support artifacts, or UI work.

## Accepted Definition

For selected-ID Hydration, pickup means:

```text
explicit acceptance of a current Hydration request posture as candidate work for a future execution command
```

Accepted constraints:

- pickup is non-durable for now;
- pickup is not a queue row;
- pickup is not a background dispatcher packet;
- pickup is not a retry lease;
- pickup is not provider execution;
- pickup is not a `metadata_runs` row;
- pickup is not an `entities` write;
- pickup is not an `activity_events` label patch;
- pickup does not authorize a provider call;
- pickup does not promise a write.

Future execution must rebuild the selected-ID posture from trusted local state before provider movement. Renderer-provided posture/gate summaries are explanation only, not authority.

## Accepted Boundary

Preserve this as the current Atlas ladder:

```text
Request posture is pickup-readable, not pickup.
Pickup is not execution.
Execution is not write until the write path succeeds under policy.
```

Accepted future execution sketch:

```text
explicit execution request
-> normalize selected ID
-> rebuild local-first request posture
-> reject not_a_request / invalid / insufficient_basis / already_local / local_lookup_available / held / blocked
-> confirm provider_needed and released-to-normal-gates posture
-> satisfy command confirmation and active policy
-> begin provider execution
-> write only after provider result and write policy succeed
```

## Persistence Decision

Accepted for now: persistence remains deferred.

Reason: selected-ID pickup is an immediate operator action over a visible local record. Losing the non-durable candidate on restart is safer than creating hidden provider work or catch-up debt. Durable pickup identity should be revisited only if Atlas accepts worker-based Hydration, Watch/background Hydration recovery, retry/lease semantics, or asynchronous operator-visible tasks.

## Watch / Background Distinction

Selected-ID pickup and Watch/background Hydration pickup must remain distinct:

- selected-ID pickup is point-of-need operator attention over one selected unresolved ID;
- Watch/background Hydration comes from durable Watch/acquisition/readability context and may require patient caps, fairness, restart policy, and no catch-up flood semantics.

They may share vocabulary later, but should not collapse into one broad provider queue.

## Verification Re-run

Overseer re-ran:

```text
npm.cmd run verify:hydration-request-posture
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:hydration-attention-runtime
git status --short --branch
```

Results: passed. No live/API/provider calls were run.

## Next State

No active Dev runway is open.

The next optional seam, if continuing, is still read-only:

```text
selected-ID Hydration pickup eligibility / execution-input contract preview
```

This is optional, not required immediately. Provider-backed execution, persistence, dispatcher/worker design, Watch/background pickup, and UI behavior remain parked until deliberately opened.
