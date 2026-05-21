# Schema: Activity Event

Status: Active
Owner: Normalization pipeline

## Purpose

Represents normalized entity appearances derived from expanded ESI killmail evidence.

Activity events are the main query surface for reports and slicers.

## Event Key

```txt
killmail_id:role:entity_type:entity_id
```

This records one entity appearance per killmail, role, entity type, and entity ID.

Corporation and alliance rows dedupe per killmail role. Character rows preserve event-time corporation and alliance IDs for grouping.

## Important Fields

| Field | Meaning |
| --- | --- |
| `event_key` | Stable dedupe key |
| `killmail_id` | Source evidence |
| `role` | `attacker` or `victim` |
| `entity_type` | `character`, `corporation`, or `alliance` |
| `entity_id` | Entity represented by this row |
| `character_id` | Character ID when present |
| `corporation_id` | Event-time corporation ID |
| `alliance_id` | Event-time alliance ID |
| `ship_type_id` | Event-time ship type ID |
| `weapon_type_id` | Attacker weapon type when present |
| `solar_system_id` | Event system |
| `killmail_time` | Event time |
| `discovered_by_type` | Collection provenance |
| `discovered_by_id` | Collection provenance |

## Invariants

- IDs are facts; names are cached labels.
- Reports should join metadata by ID.
- Display-name columns are cached labels, not evidence replacements.

## Display Label Boundary

Activity events may contain cached display-name columns for report performance and readability.

Examples:

- `entity_name`
- `character_name`
- `corporation_name`
- `alliance_name`
- `ship_type_name`
- `solar_system_name`
- `region_name`

These columns are labels, not evidence.

The authoritative values remain the numeric IDs and the source expanded ESI killmail. Hydration may fill missing labels, but must not replace, reinterpret, or remove evidence IDs.

If stricter separation is needed later, activity events can be hardened toward ID-only rows with labels resolved entirely through metadata joins. That is not required yet because the current behavior preserves IDs and raw evidence.

## Derived From

Expanded ESI killmail `victim` and `attackers` sections.

## Must Not Contain

- zKill-only summaries
- AI interpretation
- permanent UI filter state
