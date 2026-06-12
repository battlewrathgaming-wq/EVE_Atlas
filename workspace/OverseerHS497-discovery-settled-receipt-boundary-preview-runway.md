# OverseerHS497 - Discovery Settled Receipt Boundary Preview Runway

Status: open
Date: 2026-06-12
Role: Overseer
Executor: Dev

## Purpose

Prove the next narrow Discovery seam after HS495: a read-only settled receipt boundary preview over candidate-ref landing preview output.

Atlas has proven how accepted Watch bucket work can become pickup candidates, route packet previews, execution boundary previews, lease candidates, and candidate-ref landing posture. The next seam is the factual receipt projection that a caller such as Watch can consume once Discovery has reached a settled posture for emitted work.

This packet must not implement runtime receipt persistence or Watch scheduling behavior. It only previews the shape and classification of a future Discovery-owned receipt.

## Background

Accepted source:

```txt
workspace/OverseerHS496-hs495-discovery-candidate-ref-landing-boundary-preview-review.md
workspace/DevHS495-discovery-candidate-ref-landing-boundary-preview.md
```

Relevant principle:

```txt
Discovery may be capture-rich internally, but callers should receive bounded projections only when emitted work reaches a settled factual posture.
```

Discovery owns factual provider/acquisition posture. Watch owns cadence interpretation.

## Request

Add a read-only preview command that consumes the accepted HS495 candidate-ref landing boundary preview path and projects a future settled Discovery receipt shape.

Suggested command name:

```txt
discovery.settled_receipt_boundary.preview
```

The preview should group or project candidate-ref landing posture into caller-safe factual receipt rows without mutating runtime state.

## Required Receipt Shape

The preview should make the following distinction clear:

- canonical/internal Discovery basis may remain capture-rich
- caller receipt/projection is bounded and factual
- Watch cadence/completion decisions are not made by Discovery

The projected receipt should include enough basis to explain:

- `watch_run_id`
- `bucket_item_id`
- `watch_id`
- `watch_type`
- source kind
- accepted scope/window/caps basis
- provider route family
- affected system IDs or route packet identities
- candidate refs found/previewed
- duplicate refs suppressed or already known
- malformed refs rejected
- capped posture
- provider deferred posture
- provider failed posture
- whether the receipt is settled enough for the caller to stop waiting on this emitted work item

## Allowed Settled Postures

Use explicit factual posture names. Starting set:

```txt
refs_found
no_refs_found
capped
provider_deferred
failed_retryable
failed_terminal
partial_recoverable
```

If Dev finds a better narrow naming while preserving meaning, call it out in the handoff.

Important:

- `held_by_external_io` is pre-acquisition hold posture, not a candidate-ref landing outcome.
- `invalid_scope` is intent/bucket rejection posture, not a settled Discovery acquisition receipt.
- `capped` is not failure; it means Discovery moved and provider result may be limited.

## Boundary

Do not add:

- live provider calls
- zKill calls
- ESI calls
- provider execution
- dispatcher runtime
- durable queue rows
- durable lease rows
- lease claims
- `discovered_killmail_refs` writes
- candidate-ref writes
- Discovery ref writes
- Evidence/EVEidence writes
- Hydration writes
- Observation/report changes
- Watch cadence mutation
- bucket status mutation
- receipt mutation
- schema changes
- enforcement changes
- UI/renderer work
- actor Watch redirect
- system/radius Watch redirect
- `collectActorWatch(...)` retirement
- worker/runtime placement changes

Worker support is forecast only and must not shape this implementation.

## Acceptance Criteria

- New preview command is registered with read-only/non-enforcing metadata.
- It uses the HS495 candidate-ref landing preview path by default.
- It does not trust renderer-supplied rich basis as authoritative.
- It clearly separates internal Discovery basis from caller receipt projection.
- It projects at least one `refs_found` receipt from new or already-known candidate refs.
- It projects duplicate suppression without creating duplicate Evidence or duplicate receipt facts.
- It projects malformed/missing-hash rejection without landing refs.
- It projects capped posture as limited-but-not-failure.
- It projects provider deferred/failure posture without refs.
- It states whether the receipt is settled enough for caller consumption.
- It states that Watch scheduling/cadence/completion interpretation is not decided here.
- Verification proves zero provider calls, zKill calls, ESI calls, candidate-ref writes, Discovery-ref writes, Evidence/EVEidence writes, Hydration writes, Observation changes, Watch cadence mutation, bucket status mutation, receipt mutation, schema changes, enforcement, or UI.

## Verification Required

Run and report:

```txt
node --check <new service file>
node --check <new verifier script>
npm.cmd run verify:<new focused verifier>
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:service-registry
npm.cmd run verify:enforcement-dry-run
git diff --check
git diff -- src\main\db\schema.sql
git status --short --branch
```

If `verify:service-registry` needs a longer runtime, note that in the handoff rather than treating a timeout as a pass.

## Expected Handoff

```txt
workspace/DevHS497-discovery-settled-receipt-boundary-preview.md
```

The handoff should summarize:

- files changed
- command name
- receipt posture examples
- boundary proof
- verification evidence
- any naming concern or next seam discovered

