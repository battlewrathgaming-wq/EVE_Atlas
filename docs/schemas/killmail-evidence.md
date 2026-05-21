# Schema: Killmail Evidence

Status: Active
Owner: Evidence pipeline

## Purpose

Stores the authoritative expanded ESI killmail payload.

## Fields

| Field | Meaning |
| --- | --- |
| `killmail_id` | Authoritative killmail ID |
| `killmail_hash` | zKill/ESI expansion hash used to retrieve payload |
| `killmail_time` | Event time from expanded ESI payload |
| `solar_system_id` | Event system ID from expanded ESI payload |
| `raw_esi_payload` | Untouched expanded ESI killmail JSON |
| `raw_payload_checksum` | Stable checksum of stored payload |
| `source` | Discovery source metadata |
| `first_seen_at` | First time Atlas saw this killmail |
| `last_seen_at` | Last time Atlas rediscovered this killmail |
| `ingested_at` | Time the payload was ingested |

## Invariants

- Raw ESI payload must remain untouched.
- Evidence IDs must not be replaced by names.
- Killmail rows are deduped by `killmail_id`.

## Derived From

ESI:

```txt
/latest/killmails/{killmail_id}/{hash}/
```

## Must Not Contain

- zKill summary payloads as tactical truth
- AI commentary
- UI-derived classifications

## Related Reports

- Run report
- System evidence report
- Radius evidence report
- Operator report

