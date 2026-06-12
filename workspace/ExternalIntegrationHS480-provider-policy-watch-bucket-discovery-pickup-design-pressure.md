# ExternalIntegrationHS480 - Provider Policy Pressure On Watch Bucket / Discovery Pickup

Status: advisory design-pressure artifact only
Date: 2026-06-12
Role: External Integration Steward / Packet Shape Dispatch Contract Specialist
Topic: Provider-sourced cadence, retry, cache, and receipt constraints for the Watch bucket / Discovery pickup schema-runtime decision
Milestone: Atlas Storage And Runtime Hardening

## Executive Summary

The Watch bucket / Discovery pickup seam is ready for a schema/runtime design pass, but provider policy must shape that pass before Atlas turns fixture semantics into product behavior.

Core rule:

```txt
Watch emits bounded work. Discovery owns provider movement. Provider timing facts may cross the receipt boundary. Watch scheduling decisions do not.
```

Discovery pickup should become a provider-policy boundary, not just a queue consumer. The next design pass should define the minimum durable facts needed to safely resume Watch-emitted work and let Discovery enforce provider policy, while still deferring leases, dispatcher execution, provider calls, candidate-ref writes, and Evidence/EVEidence movement.

## Sources / Context Used

Local Atlas context:

- `workspace/current.md`
- `docs/adr/ADR-0007-watch-bucket-and-provenance-preserving-dedupe.md`
- `workspace/OverseerHS457-discovery-settled-posture-reporting-note.md`
- `workspace/ArchitectureDataHS474-watch-bucket-next-seam-assurance.md`
- `workspace/DevHS476-watch-bucket-disposable-persistence-fixture.md`
- `workspace/DevHS478-discovery-pickup-consumer-hold-contract.md`
- `workspace/OverseerHS479-hs478-discovery-pickup-consumer-hold-contract-review.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/current-state/current-storage-runtime-hardening.md`

Provider guidance / schema context:

- ESI best-practices text supplied by Human: User-Agent, error limit, bucket limit, cache headers.
- ESI killmail endpoint details supplied by Human: one-month cache, `killmail` rate-limit group, 3600 tokens per 15 minutes, floating window, token costs, `Retry-After`, `X-Ratelimit-*`, older 100 non-2xx/3xx-per-minute error limit, possible deep EVE server 429s.
- zKill API Killmails examples/rules: structured modifiers, polite spacing, gzip, User-Agent, local cache, max 1000 results, `pastSeconds` constraints, trailing slash, deprecated modifiers.

No provider/live calls were run for this artifact.

## Current Seam Posture

Accepted proof chain:

```txt
HS470 Watch bucket identity projection
HS472 Watch bucket pickup posture bridge
HS476 Watch bucket disposable persistence fixture
HS478 Discovery pickup consumer hold contract
```

Accepted design direction:

- Watch emission is separate from provider movement.
- External I/O does not block Watch emission.
- External I/O gates Discovery pickup / provider movement.
- Missed intervals collapse into one current eligible work item.
- Watch is not a historical catch-up generator.
- Bucket identity is Watch-run based, not system based.
- Discovery refs are not Watch bucket rows.
- `fetch_runs` are not Watch bucket rows.
- Discovery should report only settled posture to callers.

The next move should be an Architecture/Data design pass, not a Dev implementation runway.

## Provider Constraints That Must Shape Design

### ESI Killmail Expansion

The ESI killmail endpoint is the Evidence Expansion provider route:

```txt
GET /killmails/{killmail_id}/{killmail_hash}
```

Provider facts supplied:

- route returns a single expanded ESI killmail from ID and hash
- route is cached for one month
- rate-limit group: `killmail`
- rate limit: 3600 tokens per 15 minutes
- limit uses a floating/sliding window
- 2xx costs 2 tokens
- 3xx costs 1 token
- 4xx costs 5 tokens except 429
- 5xx costs 0 tokens
- 429 returns `Retry-After`

Atlas implications:

- local Evidence cache should suppress repeat expansion before provider contact
- provider cache semantics should be respected
- 304 / conditional request posture should be considered in future design where applicable
- 4xx mistakes are expensive and can contribute to older error-limit lockouts
- 5xx should not be treated as caller failure without provider-context classification

### ESI Error / Bucket Limits

ESI has both newer route bucket limits and older error limits.

Relevant facts:

- error-limit headers:
  - `X-ESI-Error-Limit-Remain`
  - `X-ESI-Error-Limit-Reset`
- bucket-limit headers:
  - `X-Ratelimit-Group`
  - `X-Ratelimit-Limit`
  - `X-Ratelimit-Remaining`
  - `X-Ratelimit-Used`
- `Retry-After` appears on 429
- some server-side limiters may return 429 without the newer limiter headers

Atlas implications:

- provider receipts should be able to carry both bucket-limit and error-limit posture
- absence of limiter headers does not mean absence of provider capacity risk
- `Retry-After` should become provider timing fact, not Watch cadence authority
- when limits are unclear, Discovery should settle as provider-deferred or failed-retryable with basis rather than keep the caller waiting silently

### ESI User-Agent And Cache

ESI best practices recommend clear application identity and cache respect.

Atlas implications:

- provider movement must carry a clear User-Agent or equivalent allowed identity mechanism
- renderer/browser direct provider calls should be avoided; if ever used, `X-User-Agent` may matter
- `Expires`, `ETag`, and `Last-Modified` should be treated as provider facts
- cache circumvention is a provider-ban risk
- the current local proof User-Agent is acceptable for proof posture, but distribution needs stronger contact identity

### zKill Scoped API

Current Atlas zKill focus should remain narrow:

```txt
input: ID type + CCP ID + accepted window
output: killmail_id + hash
```

Provider facts:

- zKill asks clients not to hammer
- zKill asks for gzip and User-Agent
- zKill encourages local caching
- max 1000 killmails per request
- `pastSeconds` max is 604800 and must be a multiple of 3600
- trailing slash required
- all IDs are CCP IDs

Atlas implications:

- do not persist arbitrary zKill URL strings as scope
- do not expose full zKill modifier grammar to callers
- structured provider route should be generated from accepted scope
- zKill preview/enriched fields are Discovery/provenance only, not Evidence
- Evidence path remains zKill ref -> ESI killmail expansion -> local Evidence/EVEidence

Rejected / avoided zKill route shapes:

- RedisQ
- arbitrary modifier combinations
- `/xml/`
- `/zkbOnly/`
- `/no-attackers/`
- `/no-items/`
- `/asc/`
- `/desc/`
- `/json/`
- comma-separated multi-entity fetching
- time-based killmail ordering
- `/limit/#/`
- `/startTime/YmdHi/`
- `/endTime/YmdHi/`
- history-like crawling through paged scoped API behavior

## Durable Facts Needed

The next design pass should identify durable or restart-recoverable facts for:

- open Watch work identity
- one-open-stub-per-Watch enforcement
- Watch source basis: watch id/type, accepted scope, window, caps, emitted-at basis
- Discovery pickup state: open, held, in-progress, settled
- provider route family: zKill scoped API vs ESI killmail expansion
- provider deferral facts:
  - `retry_after_until`
  - `next_provider_eligible_at`
  - rate-limit group
  - rate-limit remaining/used/limit when available
  - error-limit remaining/reset when available
- cache facts where provider safety depends on them:
  - `cache_expires_at`
  - `etag`
  - `last_modified`
  - local Evidence already-present skip basis
- settled receipt identity and outcome
- provenance links:
  - Watch stub -> candidate refs
  - candidate refs -> ESI expansion attempts
  - expansion attempts -> landed Evidence/EVEidence
  - overlapping Watch intents -> same killmail / Evidence row

## Facts That Should Stay Transient For Now

Avoid durable persistence unless a concrete recovery defect proves a need:

- full raw provider response bodies beyond landed Evidence payloads
- full zKill preview metadata as required contract data
- renderer-supplied posture or dry-run `would_allow` facts
- task runner progress messages
- exact internal retry loop counters
- Watch cadence decisions inside Discovery pickup rows
- unbounded provider error details
- free-text request descriptions as identity

## Receipt / Outcome Fields Needed

Discovery receipt should report settled factual posture, not internal chatter.

Needed fields or field families:

- request / bucket identity echo
- provider route used
- acquisition outcome:
  - refs found
  - no refs found
  - capped
  - held by External I/O
  - provider deferred
  - failed retryable
  - failed terminal
- expansion outcome:
  - selected
  - cached
  - expanded
  - failed
  - deferred
- Evidence landing outcome:
  - landed
  - no landing
  - partial
  - failed write
- counts:
  - candidate refs received
  - unique refs
  - malformed / duplicate / capped
  - selected refs
  - cached refs
  - ESI attempts
  - Evidence/EVEidence rows landed
- provider timing facts:
  - retry-after
  - next provider eligible
  - cache-until
  - error-limit reset
- typed warnings/errors:
  - provider
  - route family
  - status code
  - retryability
  - sanitized message
  - safe detail location/value only when useful

Compatibility summary should remain temporary/debug unless a real remaining caller depends on it.

## Flood Prevention Requirements

The product design must preserve the fixture doctrine:

- missed Watch intervals collapse to one current open work item
- External I/O re-enable does not release every held item at once
- restart does not synthesize historical catch-up packets
- provider `Retry-After` overrides local eagerness
- ESI cache expiry blocks redundant refresh before expiry
- zKill requests are spaced and locally cached
- paged scoped zKill crawling is not silently opened
- Watch emission does not imply immediate provider movement
- External I/O on does not equal provider dispatch authorization

## Boundary Requirements

Watch owns:

- due checks
- cadence
- accepted scope
- one-open-run identity
- emitted work identity
- interpretation of settled factual receipts
- whether a receipt satisfies a scheduled run
- whether cadence advances or backoff applies

Discovery owns:

- provider route handling
- External I/O hold at pickup/provider movement
- provider cache/rate/error/timing facts
- candidate refs
- pending-ref use
- selection posture
- ESI-backed expansion posture
- rich internal basis
- settled factual receipt projection

Discovery may report:

- `provider_deferred`
- `retry_after_until`
- `next_provider_eligible_at`
- `rate_limit_group`
- `rate_limit_remaining`
- `error_limit_reset_at`
- `cache_expires_at`

Discovery must not report as authority:

- next Watch cadence
- Watch should run again at a specific time
- Watch should back off
- Watch run is complete as a scheduler decision
- Watch should remain armed or disarmed

Provider timing facts may cross the boundary. Watch scheduling decisions do not.

## Risks Moving From Fixture Semantics To Real Runtime

High-risk mistakes:

- using `fetch_runs` as the Watch bucket
- using `discovered_killmail_refs` as the Watch bucket
- making `held_by_external_io` a persisted Watch failure state
- letting Discovery decide Watch cadence/backoff
- starting provider packets as soon as bucket rows exist
- losing overlapping Watch provenance when deduping killmails
- treating zKill preview fields as Evidence
- repeating ESI expansion despite local Evidence/cache facts
- making fixture status names final product schema too early
- combining first product bucket schema with lease/dispatcher/provider execution

## Explicit Avoids Before Live / Provider Movement

Avoid before a dedicated runtime/provider packet:

- live provider calls
- dispatcher or lease runtime
- provider packet creation
- candidate-ref writes from the bucket seam
- Evidence/EVEidence writes from the bucket seam
- arbitrary zKill URL/modifier persistence
- RedisQ
- SSO/app registration work
- Hydration rework
- catch-up queues
- raw provider error/body logging without redaction limits
- UI claims that External I/O on means dispatch now
- schema fields that imply Discovery owns Watch scheduling

## Design Requirements For The Next Pass

The next design pass should answer:

1. What is the minimum product-safe Watch bucket identity?
2. What facts must survive restart before Discovery pickup starts?
3. What facts are pickup eligibility only and should not become Watch state?
4. Where are provider route facts represented without creating provider packets?
5. How does the design represent External I/O off as a provider movement hold, not a Watch failure?
6. How does it prevent catch-up flooding after restart or External I/O re-enable?
7. How does it preserve overlapping Watch provenance while deduping killmails?
8. How does it keep ESI cache/rate/error facts available for later provider movement?
9. How does it prevent arbitrary zKill grammar from entering the contract?
10. What remains explicitly deferred: leases, dispatcher execution, provider calls, candidate refs, Evidence writes, Hydration, UI?

Smallest useful target:

```txt
product-safe Watch bucket + Discovery pickup contract design, explicitly deferring leases, dispatcher execution, provider packets, candidate-ref writes, and Evidence movement
```

## Recommended Next Atlas Step

Open an Architecture/Data design pass, not a Dev runway, for real Watch bucket persistence and Discovery pickup contract.

Acceptance should require the design to preserve:

- Watch emission separate from provider movement
- Discovery as the provider-policy choke
- provider timing facts crossing the boundary without Watch scheduling authority
- no catch-up flood
- cache/rate/error respect
- zKill narrow structured scope
- ESI killmail expansion as Evidence path only after local landing
- Hydration remaining parked and operator-controlled for now

