# DevHS05: Atlas Adversarial Evidence Fixtures

Date: 2026-05-23
Role: Dev
Milestone: Aggressive Testing And Operator Bug Hunting
Packet: `workspace/current.md`

## Scope Executed

- Reviewed existing fixture ingestion, idempotency, manual discovery, queue selection, report response, corpus health, and evidence-rule verification.
- Added a deterministic offline adversarial fixture harness.
- Reconciled current-state verification docs and evidence-rule manifest.
- Did not read or touch `workspace/ProjectPlannerHS06-operator-investigation-ux.md`; treated it as advisory per user instruction.

## Verification

```txt
npm.cmd run verify:adversarial-fixtures
Result: passed.

npm.cmd run verify:evidence-rules
Result: passed.

npm.cmd run verify:fixture
Result: passed.

npm.cmd run verify:idempotent
Result: passed.

npm.cmd run verify:manual-discovery
Result: passed.

npm.cmd run verify:report-response
Result: passed.

npm.cmd run verify:all
Result: passed; 59 offline scripts.
```

## Files Changed

```txt
package.json
scripts/verify-group.js
scripts/verify-evidence-rule-regressions.js
scripts/verify-adversarial-evidence-fixtures.js
docs/current-state/current-evidence-pipeline.md
docs/current-state/current-ipc-ui-preparation.md
workspace/current.md
workspace/DevHS05-atlas-adversarial-evidence-fixtures.md
```

## Findings

- Malformed killmail payloads without `killmail_id` reject before evidence mutation.
- Incomplete identifiable killmails can be stored as raw ESI evidence while emitting `missing_victim` / `missing_attackers` warnings and avoiding invented activity events.
- NPC-only attacker rows emit `missing_attacker_character_id` warnings while preserving corporation/alliance evidence rows.
- Duplicate corporation/alliance attacker appearances collapse by event key without duplicate activity events.
- Changed-hash/checksum rediscovery preserves the original raw ESI payload, hash, timestamp, system, and checksum, and writes a `KILLMAIL_PAYLOAD_CHECKSUM_MISMATCH` warning.
- Manual discovery filters malformed/duplicate refs, keeps queued refs as possible evidence only, and queue selection keeps preview fields marked non-evidence.
- Reports and corpus health expose unresolved labels, missing/stale type metadata, warning groups, sample status, raw IDs, and uncertainty wording without creating assessment artifacts or proof language.

## Deferrals And Risk

- This packet does not expand broader partial failure and transaction-integrity harnesses.
- SDE lookup builder failure modes, larger synthetic scale pressure, app restart recovery, and live success smoke remain deferred.
- No live API work was run or needed.

## Recommended Next Action

Write the next bounded Dev packet for partial failure and transaction integrity: interrupted expansion/import/hydration paths, mid-transaction exceptions, failed ESI expansion retry, lock release after failed service work where not already covered, and evidence preservation diagnostics.
