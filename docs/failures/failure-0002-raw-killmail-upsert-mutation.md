# Failure: Raw Killmail Upsert Mutation Risk

Date: 2026-05-21
Status: Fixed

## Summary

The evidence repository originally used an upsert that replaced raw killmail evidence fields when the same `killmail_id` was persisted again.

This conflicted with the AURA Atlas evidence tenet:

> Store expanded ESI killmails once. Recompute everything else from them.

## Impact

If a later rediscovery or reprocessing pass produced a different payload for an existing `killmail_id`, the repository could silently replace:

- `killmail_hash`
- `killmail_time`
- `solar_system_id`
- `raw_esi_payload`
- `raw_payload_checksum`

That would weaken auditability because the original evidence record would no longer be stable.

## Root Cause

The SQLite `ON CONFLICT(killmail_id) DO UPDATE` clause updated evidence fields directly instead of treating the conflict as a rediscovery touch.

## Fix

The repository now preserves original killmail evidence on conflict and updates only `last_seen_at`.

If an incoming rediscovery differs from the stored evidence, AURA Atlas records a warning:

```txt
KILLMAIL_PAYLOAD_CHECKSUM_MISMATCH
```

The warning records that the existing evidence was preserved and lists the mismatch fields.

## Verification

`verify:idempotent` now performs a changed rediscovery of the same killmail ID and asserts:

- original hash is preserved
- original killmail time is preserved
- original system ID is preserved
- original raw payload is preserved
- original checksum is preserved
- mismatch warning is written
- activity events remain idempotent

## Related Files

- `src/main/db/evidenceRepository.js`
- `scripts/verify-idempotent-ingestion.js`
- `docs/tenets/tenets.md`
- `docs/audits/audit-2026-05-21-doc-alignment-and-pipeline-trace.md`
