# Audit Handover: Evidence-Safe Assessment And Discovery UX

Date: 2026-05-22

## Status

Complete.

This handover closes the Evidence-Safe Assessment And Discovery UX milestone. The milestone tightened assessment citation integrity, preserved the discovery/evidence boundary, and exposed scoped zKill discovery through controlled UI/service paths without adding hidden collection or evidence deletion.

## Completed Work

- Assessment artifacts now validate cited sample killmail IDs against local stored evidence.
- Entity-focused assessment citations now require the cited killmails to contain matching local activity events.
- Assessment artifacts store creation-time citation status and citation details.
- Retention/compaction preflight remains read-only, but can now produce an explicit `assessment.create` payload for validated evidence compaction memory.
- Scoped system/radius zKill discovery is exposed through the existing Actions pane and `manual.discovery` service path.
- User-entered system names resolve locally through SDE-backed lookup before scoped zKill route planning.
- Manual scoped discovery remains discover-refs-only: queued refs and preview values are not observations until ESI expansion succeeds.
- Live scoped zKill smoke now writes structured refusal/failure/success artifacts under `.tmp/live-scoped-zkill-smoke`.
- Evidence-rule regression checks are registered in `verify:all`.

## Verification

Latest local verification for this milestone:

- `npm.cmd run verify:evidence-rules`
- `npm.cmd run verify:hydration`
- `npm.cmd run verify:all`

`verify:all` now runs 48 offline scripts. The evidence-rule guard checks that the suite protects:

- immutable raw killmail persistence
- manual discovery as queue-only possible evidence
- queue preview non-evidence wording
- assessment citation validation
- metadata hydration without evidence ID or raw payload mutation
- non-destructive retention/compaction preflight

## Boundaries Preserved

- zKill discovery refs remain possible evidence and provenance, not observations.
- Expanded ESI killmails remain the evidence source.
- Reports remain observations over stored evidence.
- Assessment artifacts remain deliberate memory, not evidence.
- Metadata hydration remains readability-only.
- Static type labels remain local SDE metadata.
- Live smoke remains explicit and gated by `AURA_ATLAS_LIVE_API=1`.

## Remaining Considerations

- No executable evidence deletion or compaction pruning is enabled.
- No auto-assessment creation is enabled from reports or queue refs.
- Live smoke success artifacts should be produced only during explicit live-gated review.
- Future UI work should continue using the service bridge and task runner rather than renderer-side backend imports.
