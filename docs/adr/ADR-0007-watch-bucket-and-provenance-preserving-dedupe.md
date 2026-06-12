# ADR-0007: Watch Bucket And Provenance-Preserving Dedupe

Status: Accepted
Date: 2026-06-12

## Context

Atlas has separated Watch, Discovery, Evidence/EVEidence, Hydration, Observation, and Assessment into clearer ownership boundaries.

The accepted Watch/Discovery line is:

```text
Watch scheduled work bucket
-> Discovery repeatable handling/recovery
-> settled factual receipt
-> Watch bucket/cadence interpretation
```

HS463 proved that system/radius Watch can express one due run as a bounded read-only Watch-run stub from accepted stored scope:

```text
accepted stored system/radius Watch
-> due posture
-> bounded Watch-run stub
-> future bucket or Discovery pickup
```

The remaining design pressure is how that stub should become recoverable work without making Watch understand provider availability, without creating catch-up floods, and without losing the fact that multiple Watch intents may discover the same killmail.

HS465 source-tested the proposed Watch bucket and dedupe model against current schema/code. It found the direction sound, but not yet implemented by current durable tables.

## Decision

Atlas will treat Watch emission as separate from provider-facing movement.

Watch owns:

- due checks
- cadence
- accepted scope
- one-open-run identity
- emitted work identity
- interpretation of settled factual receipts

External I/O does not block Watch emission. External I/O gates Discovery pickup and provider packet dispatch.

If a Watch is due and has no open emitted stub, Watch may emit one durable work stub. If a Watch already has an open stub, Watch must not emit another.

Missed intervals collapse into one current eligible run. Watch is not a historical catch-up generator.

Bucket identity is Watch-run based, not system based. The same system appearing in multiple Watch scopes is valid overlapping intent.

The dedupe rule is layered:

```text
Deduplicate the killmail; preserve the fact that multiple Watch intents found it.
```

This means:

- bucket dedupe prevents duplicate open Watch work for the same Watch
- Discovery ref dedupe prevents duplicate candidate refs for the same provider identity, usually `killmail_id + hash`
- Evidence/EVEidence dedupe prevents duplicate landed killmail truth
- provenance preserves overlapping Watch intent

Evidence/EVEidence remains singular landed killmail truth. It must not carry Watch scheduler state, Watch run completion, inbox state, Discovery retry/defer state, Observation interpretation, or Assessment judgment.

`discovered_killmail_refs` remains candidate-ref acquisition memory. It must not become the pre-acquisition Watch work bucket.

`fetch_runs` remains provider/Evidence collection run memory. It must not become the Watch work bucket.

## Consequences

This makes Watch simpler:

- Watch can decide "is this due?" without knowing whether provider movement is currently allowed.
- Watch does not generate historical catch-up floods.
- Watch does not inspect Discovery internals to decide cadence.
- Watch receives settled factual receipts and interprets them against Watch policy.

This makes Discovery clearer:

- Discovery/dispatcher owns provider movement and External I/O hold behavior.
- If External I/O is closed, Discovery rests and does not dispatch provider packets.
- Discovery may recover, defer, dedupe, cap, and retry inside its own lane.

This protects Evidence/EVEidence:

- the same killmail lands once as truth
- multiple Watch intents may point to the same candidate ref or Evidence row through provenance
- Watch state does not mutate Evidence meaning

This also creates future implementation requirements:

- a durable Watch bucket or equivalent work identity surface is still needed
- Atlas needs a one-open-stub-per-Watch rule
- Atlas needs explicit Watch-run identity if durable bucket work is implemented
- Atlas needs provenance relationships strong enough to preserve multiple Watch runs/scopes pointing to the same killmail
- External I/O gating must be moved or represented after Watch emission, at Discovery pickup/provider movement, before product behavior can match this ADR

Current schema/code does not yet provide the full durable bucket model.

## Alternatives Considered

Use `system_id` as bucket identity:

- rejected because overlapping Watch intent is valid and the same system may appear in multiple Watch scopes

Use `fetch_runs` as the Watch work bucket:

- rejected because `fetch_runs` is provider/Evidence collection lifecycle memory, not pre-acquisition Watch work

Use `discovered_killmail_refs` as the Watch work bucket:

- rejected because candidate refs exist only after provider acquisition and should remain Discovery acquisition memory

Block Watch emission while External I/O is closed:

- rejected as the target architecture because it makes Watch understand provider availability and blurs scheduling with provider movement

Emit historical catch-up runs for missed intervals:

- rejected because external provider windows/FIFO behavior make old synthetic runs low value and potentially noisy

Store Watch meaning on Evidence/EVEidence:

- rejected because Evidence/EVEidence must remain landed killmail truth, not scheduler or inbox state

## Deferred

This ADR does not implement:

- durable bucket schema
- durable Watch run schema
- dispatcher, lease, retry, or provider movement
- External I/O enforcement relocation
- Watch cadence mutation changes
- `discovered_killmail_refs` schema changes
- Evidence/EVEidence writer changes
- Observation inbox/report behavior
- UI behavior
- collector retirement

The next implementation work should prove bucket identity and provenance behavior before changing runtime provider movement.

## Related Documents

- `workspace/EngineeringSourceTraceHS462-watch-system-advisory.md`
- `workspace/DevHS463-system-radius-watch-run-stub-projection.md`
- `workspace/OverseerHS464-hs463-system-radius-watch-run-stub-review.md`
- `workspace/OverseerHS465-watch-bucket-dedupe-model-source-trace-request.md`
- `workspace/EngineeringSourceTraceHS465-watch-bucket-dedupe-model.md`
- `workspace/OverseerHS466-hs465-watch-bucket-dedupe-model-review.md`
- `docs/adr/ADR-0001-zkill-is-discovery-only.md`
- `docs/adr/ADR-0002-expanded-killmails-authoritative.md`

