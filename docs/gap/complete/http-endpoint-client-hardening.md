# HTTP Endpoint And Client Hardening

Status: Complete
Completed: 2026-05-23

## Mission

Close the remaining HTTP boundary gaps without changing Atlas architecture: renderer stays isolated, service IPC remains the action boundary, live API behavior remains explicit, and evidence creation stays controlled.

Atlas already has a solid gated zKill/ESI evidence path. The risky edge is that not every outbound-capable path uses the same guardrails.

## Task Requirements

- Add an outbound endpoint inventory covering:
  - zKill scoped discovery
  - ESI killmail expansion
  - SDE lookup/source downloads
  - diagnostics and readiness checks
  - future export/sync hooks
- Route or represent SDE lookup downloads through an explicit external-IO policy instead of treating them as ordinary local builder work.
- Ensure `sde.build-lookups` refuses, estimates, or clearly labels live network work when live APIs are disabled.
- Add timeout, cancellation, maximum byte size, allowed protocol, allowed host, and redirect validation for SDE downloads.
- Parse HTTP JSON before logging request success.
- Treat malformed JSON as a non-retryable HTTP failure and log it once as failure, not as a successful request followed by retry noise.
- Validate ESI killmail expansion inputs before URL construction:
  - positive integer `killmail_id`
  - safe killmail hash token
  - URI-encoded path segments
- Add generic service IPC envelope validation for service invocations before dispatching payloads to endpoint-capable services.
- Ensure diagnostics/reporting expose route class, status, duration, cache/live state, and refusal reason without leaking local filesystem paths or raw request internals.

## Guardrails

- Do not weaken `contextIsolation`, `nodeIntegration: false`, or preload-only API exposure.
- Do not expose raw `ipcRenderer`, `fetch`, or endpoint construction to the renderer.
- Do not add hidden live collection or passive broad ingestion.
- Do not remove immutable killmail caching, ETag behavior, request coalescing, or live gate protections.
- Do not include live tests in `verify:all`.
- Do not convert SDE lookup building into automatic startup work.

## Related Files

- `src/main/api/httpClient.js`
- `src/main/api/esiClient.js`
- `src/main/api/zkillClient.js`
- `src/main/services/liveApiGateService.js`
- `src/main/services/mutatingActionService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/sde/sdeLookupBuilder.js`
- `scripts/verify-http-timeouts.js`
- `scripts/verify-sde-lookup-builder.js`
- `docs/gap/to-do/live-api-refusal-and-smoke-matrix.md`

## Suggested Verification

Add or extend offline tests for:

```txt
npm.cmd run verify:http-boundaries
```

The verification should cover:

- invalid JSON is non-retryable
- HTTP success is recorded only after parse success for JSON routes
- killmail hash and ID validation rejects malformed values before URL construction
- SDE downloader refuses denied protocols and denied hosts
- redirects to denied hosts are refused
- oversized SDE text and ZIP responses are refused before full processing
- SDE network work is refused or explicitly surfaced when live API access is disabled
- service invocation rejects malformed payload envelopes before reaching endpoint-capable services

## Acceptance Criteria

- Every outbound-capable path has a named gate or explicit operator policy.
- No raw SDE download path bypasses timeout, cancellation, host/protocol validation, redirect validation, and byte limits.
- Malformed provider responses cannot create retry storms or misleading success diagnostics.
- Renderer-triggered service calls cannot smuggle malformed endpoint payloads into live-capable services.
- `npm.cmd run verify:all` remains offline and green.

## Completion Notes

- Added a named outbound endpoint inventory for zKill discovery, ESI killmail expansion, ESI universe-name hydration, SDE lookup downloads, local diagnostics, and future export/sync hooks.
- Routed network SDE lookup building through the live API gate when no local source path is supplied.
- Hardened SDE downloads with allowed protocol/host validation, redirect validation, timeout/cancellation, and maximum byte limits.
- Changed HTTP JSON handling so provider requests are logged as successful only after successful JSON parsing; malformed JSON is non-retryable and logged once as failure.
- Added ESI killmail ID/hash validation before endpoint construction.
- Added generic service invocation envelope validation before dispatch.
- Added `verify:http-boundaries` and included it in the core verification group.
