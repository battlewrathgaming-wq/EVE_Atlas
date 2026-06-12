# OverseerHS499 - HS497 Discovery Settled Receipt Boundary Preview Correction Review

Status: accepted
Date: 2026-06-12
Role: Overseer

Reviewed handoff:

```txt
workspace/DevHS497-discovery-settled-receipt-boundary-preview.md
```

Prior review:

```txt
workspace/OverseerHS498-hs497-discovery-settled-receipt-boundary-preview-review.md
```

Runway:

```txt
workspace/OverseerHS497-discovery-settled-receipt-boundary-preview-runway.md
```

## Review Result

HS497 is accepted after HS498 correction.

Atlas can now project bounded factual caller-safe Discovery receipt rows from HS495 candidate-ref landing posture without deciding Watch cadence/completion behavior and without mutating receipts, buckets, Watch rows, Discovery refs, Evidence/EVEidence, Hydration, Observation, schema, enforcement, or UI.

## Accepted Correction

HS498 identified that duplicate candidate refs were being counted as both found refs and suppressed duplicates.

The corrected implementation now separates:

- accepted new candidate refs
- already-known candidate refs
- suppressed duplicate refs
- malformed rejected refs

Accepted behavior:

- `candidate_refs_found_previewed` contains accepted new candidate-ref facts only.
- `duplicate_refs_suppressed` carries duplicate occurrences with `counted_as_found_ref: false`.
- `already_known_refs` carries already-known refs separately with `counted_as_new_found_ref: false`.
- caller projection counts distinguish accepted new refs, already-known refs, duplicate suppression, and malformed rejection.
- verifier assertions now fail if duplicate/already-known rows are counted as found refs.

## Boundary Held

HS497 remains:

- read-only
- non-provider
- non-enforcing
- non-UI
- non-schema
- non-mutating

It does not open:

- live provider calls
- zKill calls
- ESI calls
- provider execution
- dispatcher runtime
- durable queues
- durable leases
- lease claims
- candidate-ref writes
- Discovery ref writes
- `discovered_killmail_refs` writes
- Evidence/EVEidence writes
- Hydration writes
- Observation changes
- Watch cadence mutation
- bucket status mutation
- receipt mutation
- worker/runtime placement

## Verification

Passed:

```txt
node --check src\main\services\discoverySettledReceiptBoundaryPreviewService.js
node --check scripts\verify-discovery-settled-receipt-boundary-preview.js
npm.cmd run verify:discovery-settled-receipt-boundary-preview
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
git diff -- src\main\db\schema.sql
```

Evidence:

- focused verifier produced `candidate_refs_found_previewed_count: 2`
- focused verifier produced `accepted_new_candidate_ref_count: 2`
- focused verifier produced `already_known_candidate_ref_count: 1`
- focused verifier produced `duplicate_refs_suppressed_count: 2`
- focused verifier produced `malformed_refs_rejected_count: 1`
- sample receipt showed `duplicate_refs_suppressed.counted_as_found_ref: false`
- sample receipt showed `already_known_refs.counted_as_new_found_ref: false`
- focused verifier showed zero provider calls, zKill calls, ESI calls, candidate-ref writes, Discovery-ref writes, Evidence/EVEidence writes, Hydration writes, Watch cadence mutations, receipt mutations, bucket status mutations, and schema changes
- command authority passed
- passive side-effect sweep passed
- enforcement dry-run passed with 130/130 commands covered and no gaps
- service registry passed
- schema diff was empty

## Accepted State

HS497 is accepted as a read-only Discovery settled receipt boundary preview.

The next seam should be selected deliberately. Likely candidates:

- receipt persistence readiness / schema design
- Watch consumption policy for settled Discovery receipts
- candidate-ref persistence implementation readiness

Do not open live provider movement until receipt persistence/consumption and candidate-ref persistence are explicit.

