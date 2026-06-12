# OverseerHS498 - HS497 Discovery Settled Receipt Boundary Preview Review

Status: returned for correction
Date: 2026-06-12
Role: Overseer

Reviewed handoff:

```txt
workspace/DevHS497-discovery-settled-receipt-boundary-preview.md
```

Runway:

```txt
workspace/OverseerHS497-discovery-settled-receipt-boundary-preview-runway.md
```

## Review Result

HS497 is not accepted yet.

The implementation holds the broad safety boundary, but the caller receipt projection currently double-counts duplicate candidate refs as both found refs and suppressed duplicates.

This is a narrow correction, not a broad redirect.

## Finding

### Duplicate refs are included in `candidate_refs_found_previewed`

Severity: blocking for acceptance

In:

```txt
src/main/services/discoverySettledReceiptBoundaryPreviewService.js
```

The receipt builder derives found refs with:

```txt
valid refs except malformed
```

That includes rows whose `candidate_ref_kind` is:

```txt
duplicate_within_provider_result
duplicate_across_preview_candidates
already_known_in_fixture_discovery_memory
```

As a result, sample output shows `candidate_refs_found_previewed` containing a duplicate candidate ref while also reporting the same identity under `duplicate_refs_suppressed`.

That blurs the HS497 acceptance rule:

```txt
It projects duplicate suppression without creating duplicate Evidence or duplicate receipt facts.
```

The caller-safe receipt should not make a caller count suppressed duplicates as additional found refs.

## Expected Correction

Keep the internal Discovery basis capture-rich, but tighten the bounded caller receipt projection:

- `candidate_refs_found_previewed` should represent accepted/usable unique candidate-ref facts for caller consumption.
- suppressed duplicate refs should live under `duplicate_refs_suppressed`, not also under found refs.
- already-known refs may be represented separately as `already_known_refs`; if they also count as found for caller posture, expose that as a separate count/posture rather than duplicating the candidate ref in the found list.
- verifier expectations should assert that duplicate identities do not appear in both the caller found list and duplicate suppression list as counted found refs.
- summary counts should distinguish accepted new candidate refs, already-known candidate refs, suppressed duplicate refs, and malformed rejected refs.

Do not widen the packet.

## Boundary Still Held

The following checks passed during review:

```txt
node --check src\main\services\discoverySettledReceiptBoundaryPreviewService.js
node --check scripts\verify-discovery-settled-receipt-boundary-preview.js
npm.cmd run verify:discovery-settled-receipt-boundary-preview
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:service-registry
npm.cmd run verify:enforcement-dry-run
git diff -- src\main\db\schema.sql
```

Evidence:

- focused verifier passed
- command authority passed
- passive side-effect sweep passed
- service registry passed
- enforcement dry-run passed with 130/130 commands covered and no gaps
- schema diff was empty

These checks prove the implementation stayed read-only and non-provider, but they also codified the duplicate-counting issue. The focused verifier must be corrected with the implementation.

## Correction Scope

Expected corrected handoff:

```txt
workspace/DevHS497-discovery-settled-receipt-boundary-preview.md
```

Required correction:

```txt
Tighten duplicate handling in the settled receipt caller projection and verifier.
```

Do not add:

- live providers
- candidate-ref writes
- Discovery ref writes
- Evidence/EVEidence
- Hydration
- Observation
- Watch cadence/completion behavior
- bucket status mutation
- receipt persistence
- schema changes
- enforcement
- UI
- worker/runtime placement

