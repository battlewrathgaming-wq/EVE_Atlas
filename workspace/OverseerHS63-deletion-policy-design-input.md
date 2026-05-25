# OverseerHS63 - Deletion Policy Design Input

Date: 2026-05-25
Role: Atlas Overseer
Status: advisory design input / not implementation authority

## Purpose

Record Human advisory input for future production deletion policy design.

This note does not open a Dev runway, does not authorize deletion execution, does not change schemas, and does not override the accepted HS58 retention/deletion boundary.

## Human Input

Future production deletion policy may need two fixed elements:

1. `killmail_id`
   - Used as the immutable record identifier and verification anchor.
   - It is present in zKillboard discovery response context and ESI expanded killmail response context.
   - In the Atlas pipeline, the expanded ESI killmail is what becomes stored Evidence.
   - Must be verified as factual before it can act as the immutable anchor; Atlas should not treat a user-entered or unverified ID as sufficient.

2. Short human/user value string
   - A user-authored short-form input associated with the deleted or retained-interest record.
   - Working label candidate: `EVE_value`.
   - Possible role: assessment line/rating or compact user significance marker.

Working pair:

```txt
[Immutable_record][User-input, short form string]
```

## Interpretation

This suggests a future deletion/footprint design could keep a minimal historical-interest pair without preserving raw Evidence, full activity events, or hidden deleted-record copies.

The immutable side should be narrowly scoped to an identifier such as `killmail_id`, not a retained payload.

The user-input side should be explicitly human-authored and should not be confused with programmatic Evidence, Discovery, Observation, or automatic Assessment Memory.

## Open Questions

- Is `EVE_value` the right term, or only a working placeholder?
- What verification standard proves a `killmail_id` is factual enough to serve as the immutable anchor?
- Does the user-input string live as Assessment Memory, footprint metadata, or another accepted storage class?
- Can the pair survive explicit deletion, or should the operator choose whether it survives?
- Should the pair apply only to killmail Evidence, or also to actor/system/corporation/alliance interest traces?
- What backup/restore behavior is required before any production deletion execution exists?

## Guardrails

- Do not implement deletion execution from this note.
- Do not add footprint storage from this note.
- Do not treat an unverified or user-entered `killmail_id` as factual.
- Do not preserve raw ESI payloads, full activity events, participant arrays, or hidden deleted-record copies.
- Do not make the user-input value mandatory without Human acceptance.
- Do not treat `EVE_value` as accepted terminology until Human/Overseer accepts it in a future policy packet.
