# Audit: Manual Discovery Pipeline Trace

Date: 2026-05-22
Scope: Routine actor watch versus user-led manual discovery and explicit manual expansion.

## Current Behavior

AURA Atlas now has two collection lanes:

- Routine watches discover zKill refs and expand a capped number through ESI in the same collection run.
- Manual discovery calls zKill only, queues refs, and waits for an explicit manual expansion step.

Manual discovery uses queue scopes such as `manual_actor`, `manual_system`, and `manual_radius`. These are collection provenance tags, not evidence types.

## Pipeline / Flow

Routine actor watch:

```txt
typed actor ID/name
-> zKill actor route
-> discovered_killmail_refs
-> capped ESI expansion
-> killmails
-> activity_events
-> reports
```

Manual discovery:

```txt
user-led scope
-> zKill discovery only
-> discovered_killmail_refs with optional at-a-glance preview
-> no killmails
-> no activity_events
-> explicit manual expansion later
```

Manual expansion:

```txt
selected queued refs
-> ESI expansion
-> killmails
-> activity_events
-> reports
```

## Known Gaps

- Manual discovery is CLI/script-verifiable only.
- At-a-glance preview is intentionally minimal and non-authoritative.
- Retention policy for preview metadata is not finalized.
- Manual discovery does not yet have a richer selection UI.

## Risks

- Preview metadata could be mistaken for evidence if report language drifts.
- Manual queue scopes must remain provenance tags, not observation scopes.
- Future UI work must keep "discover first" separate from "expand as evidence."

## Verification

Verified offline with:

- `npm.cmd run verify:manual-discovery`
- `npm.cmd run verify:actor-watch`
- `npm.cmd run verify:queue-report`
- `npm.cmd run verify:reports`

The checks confirm:

- manual discovery makes zero ESI calls
- manual discovery writes no killmails or activity events
- manual expansion writes evidence only after ESI expansion
- routine actor watch behavior remains unchanged
- reports expose manual discovery as collection provenance

## Related Files

- `src/main/workers/manualDiscoveryWorker.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/reports/queueReport.js`
- `src/main/reports/collectionProvenance.js`
- `scripts/verify-manual-discovery.js`
