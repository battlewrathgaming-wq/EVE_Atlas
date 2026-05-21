# Schema: Metadata Run

Status: Active
Owner: Metadata hydration pipeline

## Purpose

Records one metadata hydration/enrichment pass.

Metadata runs are separate from evidence collection runs. They describe label hydration work such as resolving character, corporation, or alliance names for report candidates.

## Important Fields

| Field | Meaning |
| --- | --- |
| `run_id` | Trace ID for this metadata operation |
| `trigger` | Why the run started |
| `run_type` | Metadata operation type |
| `target_type` | Scope type, such as `system` |
| `target_id` | Scope identifier |
| `candidates_considered` | Report candidates inspected |
| `ids_discovered` | Entity IDs found for possible hydration |
| `already_known` | IDs already known locally |
| `requested_from_esi` | IDs sent to ESI `/universe/names/` |
| `resolved` | IDs resolved by ESI |
| `unresolved` | IDs not resolved |
| `entities_upserted` | Entity metadata rows upserted |
| `types_upserted` | Type metadata rows upserted; should remain `0` for report candidate hydration |
| `activity_events_patched` | Cached display-label fields patched |
| `api_calls_esi` | ESI calls made |
| `warning_summary` | Non-fatal warnings |
| `error_summary` | Failure reason when status is failed |

## Invariants

- Metadata runs are not evidence collection runs.
- `fetch_runs` remains the table for killmail collection.
- Metadata hydration must not mutate evidence IDs or raw killmail payloads.
- Report candidate hydration resolves character/corporation/alliance labels only.
- Ship/type labels should come from local SDE `type_metadata`.

## Related Tables

- `entities`
- `activity_events`
- `type_metadata`
- `api_request_logs`, linked by `run_id` with `run_type = metadata`
