# Adversarial Evidence Fixture Suite

## Mission

Move beyond happy-path killmail fixtures by attacking the evidence pipeline with malformed, incomplete, duplicated, and ambiguous expanded killmail payloads.

The goal is not to make every bad payload "clean." The goal is to prove Atlas preserves raw evidence, emits data-quality warnings, avoids overclaiming, and keeps derived rows deterministic.

## Task Requirements

- Add a fixture set for adversarial expanded ESI killmails.
- Keep fixtures local and deterministic.
- Cover malformed or unusual cases:
  - missing victim character ID
  - victim corporation without alliance
  - attacker with no character ID
  - NPC-only attacker patterns
  - repeated attacker corporation/alliance rows
  - final blow missing or duplicated
  - missing ship type IDs
  - missing weapon type IDs
  - unknown solar system ID
  - empty attackers array
  - duplicate killmail with identical raw payload
  - duplicate killmail with conflicting raw payload/checksum
- Verify raw expanded ESI payload storage remains immutable.
- Verify activity event keys remain deterministic.
- Verify duplicate corporation/alliance event rows dedupe where intended.
- Verify warnings are useful and not duplicated.

## Suggested Verification

Add a script such as:

```txt
npm.cmd run verify:adversarial-fixtures
```

It should assert:

- no raw evidence mutation on duplicate ingest
- no duplicate activity event keys
- expected warnings are present
- unexpected warnings are absent
- reports can still render partial/unresolved evidence without crashing

## Acceptance Criteria

- The fixture suite catches evidence-boundary regressions.
- Ambiguous or incomplete evidence becomes warnings/unresolved labels, not inferred truth.
- `verify:all` includes the new adversarial fixture check once stable.

