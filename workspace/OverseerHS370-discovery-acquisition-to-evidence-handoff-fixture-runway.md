# OverseerHS370 - Discovery Acquisition To Evidence Handoff Fixture Runway

Status: open
Date: 2026-06-07
Role: Overseer
Executor: Dev

## Purpose

Prove that Discovery can act as the shared provider-facing acquisition utility far enough to replace the useful shape currently trapped inside mixed Watch collectors, without retiring or redirecting those collectors yet.

This is a proof-first packet. Retirement, redirect, dispatcher work, durable task schema, live provider movement, and Evidence/EVEidence writes remain parked.

## Context

Accepted boundary:

```txt
Watch is a scheduler and scope-authority source.
Discovery is the acquisition utility.
A due Watch emits Discovery pickup intent; it does not acquire candidates itself.
```

HS368 proved:

```txt
Watch dispatch payload
-> Discovery-owned acquisition request
-> fixture pickup packets / fixture provider outcomes
-> canonical Discovery receipt basis
-> watch_summary projection
```

The next question is not collector retirement yet. The next question is:

```txt
Can Discovery carry the useful provider-facing shape up to the Evidence handoff boundary?
```

## Task

Add a read-only/local-only fixture proof command that shows Discovery receiving an acquisition request, producing provider-facing packet shapes, consuming fixture zKill-style outcomes, normalizing candidate refs, deriving a bounded receipt, and emitting an ESI Evidence Expansion handoff shape for selected candidate refs.

Suggested command:

```txt
discovery.acquisition_to_evidence_handoff_fixture.preview
```

Suggested verifier:

```txt
verify:discovery-acquisition-to-evidence-handoff-fixture
```

## Required Shape

The command should prove, using fixtures only:

- accepted Discovery acquisition request in
- one or more provider-facing Discovery packets
- fixture zKill-style response normalized into candidate refs
- candidate ref basis with `killmail_id`, `killmail_hash`, provider/source basis, and caller/correlation basis where available
- candidate dedupe or duplicate-disclosure posture
- Discovery receipt basis using accepted outcome language
- safe caller projection, at minimum `watch_summary`
- selected candidate refs emitted as ESI Evidence Expansion handoff candidates
- Evidence handoff candidates are handoff shapes only, not Evidence/EVEidence writes
- Watch/source intent receives a receipt/projection without owning acquisition

## Fixture Cases

Cover at least:

- actor-style acquisition request
- system/radius-style acquisition request with multiple packets
- refs found
- no refs
- duplicate refs across packets or fixture rows
- provider deferred
- acquisition capped
- retryable failure
- terminal failure
- request-level `held_by_external_io` before acquisition, with no packet outcomes
- candidate refs selected for ESI Evidence Expansion handoff
- candidate refs not selected for handoff with a disclosed reason

## Reuse / Mirror Check

Report which useful shapes from current mixed collector behavior are represented in the fixture proof, such as:

- zKill request basis
- candidate ref extraction basis
- candidate provenance basis
- dedupe basis
- provider outcome basis
- ESI Evidence Expansion handoff basis
- receipt basis

Do not call mixed Watch collectors to prove this.

## Boundaries

This packet is read-only/local-only.

Do not:

- call providers or perform live/API calls
- invoke `collectActorWatch(...)`
- invoke `collectSystemRadiusWatch(...)`
- invoke `WatchSessionExecutor.tick(...)`
- invoke `TaskRunner.runDetachedTask(...)`
- run live Watch dispatch
- create tasks
- mutate Watch rows
- write Discovery refs
- write Evidence/EVEidence
- perform ESI Evidence Expansion
- write Hydration/metadata
- write API logs or warnings
- write `fetch_runs`
- add durable Discovery task/packet/receipt schema
- add queues, dispatcher, leases, or runtime provider work
- create support artifacts
- change renderer/UI
- activate runtime enforcement or command blocking
- rename source-owned terms
- update protected-word JSON
- retire or redirect mixed collectors

## Acceptance Criteria

Dev handoff should show:

1. The command and verifier names.
2. The fixture input acquisition requests.
3. The emitted provider-facing packet shapes.
4. The normalized candidate refs.
5. Duplicate/cap/defer/failure handling.
6. The canonical Discovery receipt basis and `watch_summary` projection.
7. The ESI Evidence Expansion handoff candidate shape.
8. Explicit proof that no Evidence/EVEidence was written.
9. Explicit proof that mixed Watch collectors were not invoked.
10. A short note on which old collector responsibilities are now mirrored by Discovery fixture shape and which remain unproven/parked.

## Verification

Run focused checks:

```txt
node --check src\main\services\[new-service].js
node --check scripts\verify-discovery-acquisition-to-evidence-handoff-fixture.js
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:discovery-receipt-projection-fixture
npm.cmd run verify:watch-discovery-acquisition-split-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Adjust the service syntax-check path to match the implementation.

## Expected Handoff

```txt
workspace/DevHS370-discovery-acquisition-to-evidence-handoff-fixture.md
```

