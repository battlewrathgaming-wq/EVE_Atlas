# DevHS250 Patient Packet Identity Sparse Gap Matrix

Executor: Dev

Date: 2026-06-03

Status: Complete; pending Overseer review.

## Scope

Implemented HS250 as a fixture-only/read-only coverage hardening pass for:

```txt
runtime.patient_packet_identity.preview
```

No new product command was added. The existing preview now discloses sparse confidence explicitly, while the new verifier proves malformed, sparse, cached, local SDE, provider-needed, and mixed-lane cases without provider calls or runtime movement.

## Files Changed

- `package.json`
- `scripts/verify-patient-packet-identity-sparse.js`
- `src/main/services/patientPacketIdentityService.js`
- `workspace/current.md`
- `workspace/DevHS250-patient-packet-identity-sparse-gap-matrix.md`

## Service Disclosure Added

`src/main/services/patientPacketIdentityService.js` now reports:

- `identity_confidence` per row:
  - `derived`
  - `derived_with_gaps`
  - `uncomputable`
- `summary.rows_with_identity_gaps`
- `summary.uncomputable_rows`
- `confidence_guard.false_confidence_prevented`
- `confidence_guard.rows_with_identity_gaps`
- `confidence_guard.uncomputable_rows`

Additional row disclosure:

- zKill/system-radius rows include included/excluded scope status and values as anchors.
- Missing included/excluded radius scope is reported as unknown/uncomputable rather than guessed.
- Malformed included/excluded radius scope is reported as unknown/uncomputable rather than guessed.
- ESI Evidence Expansion rows disclose `cached_evidence_exists` and cache/skip posture when matching local Evidence/EVEidence exists.
- Hydration rows already disclosed missing source anchors; HS250 adds fixture coverage for that weakness.

Trusted fixture-only support:

- `hydrationFixturePreview` can be used only when trusted context sets `allowPatientPacketIdentityFixtureHydration: true`.
- Renderer payload alone cannot activate the fixture path.
- This was added only to prove sparse Hydration candidate shapes that normal local SQL generation does not naturally emit.

## Matrix Coverage

Added:

```txt
npm.cmd run verify:patient-packet-identity-sparse
```

Verifier file:

```txt
scripts/verify-patient-packet-identity-sparse.js
```

Covered required cases:

1. Empty DB / no Watch / no Discovery refs / no Hydration candidates.
2. System/radius Watch with valid scope.
3. System/radius Watch with missing stored included/excluded scope.
4. System/radius Watch with malformed included or excluded scope.
5. Pending Discovery ref without `killmail_hash`.
6. Failed Discovery ref with valid hash.
7. Already-cached Evidence/EVEidence matching a Discovery ref.
8. No Hydration candidates.
9. Hydration candidate missing source anchors.
10. Local SDE gap candidate versus provider-needed entity label.
11. Mixed view/local-record and Watch/background Hydration lanes.

## Sample Sparse Output

```json
{
  "status": "patient packet identity sparse matrix verified",
  "required_cases_covered": 11,
  "boundary": {
    "read_only": true,
    "provider_calls": 0,
    "writes": 0,
    "packet_tables_created": 0,
    "persisted_queue_created": false,
    "dispatcher_added": false,
    "enforcement_active": false,
    "ui_work": false
  }
}
```

Happy fixture still reports:

```json
{
  "identity_rows": 4,
  "derivable_now": 4,
  "unknown_rows": 0,
  "rows_with_identity_gaps": 0,
  "uncomputable_rows": 0,
  "all_derived_for_now": true,
  "all_not_execution_authority": true,
  "packet_persistence_recommended": false
}
```

## Boundary Confirmation

Confirmed:

- no packet table
- no persisted queue
- no active dispatcher
- no provider calls
- no zKill Discovery execution
- no ESI Evidence Expansion execution
- no Hydration execution
- no Hydration writes
- no Evidence/EVEidence writes
- no Discovery ref mutation outside fixture setup
- no Watch mutation or arming outside fixture setup
- no Assessment Memory mutation
- no Marked mutation
- no storage config write
- no storage movement
- no support artifact creation
- no schema changes
- no runtime enforcement activation
- no command blocking
- no pruning/deletion behavior
- no renderer UI work

The sparse verifier checks table counts before and after each preview invocation to confirm the preview itself does not mutate persistent tables.

## Verification

Commands run:

```txt
node --check src\main\services\patientPacketIdentityService.js
node --check scripts\verify-patient-packet-identity-preview.js
node --check scripts\verify-patient-packet-identity-sparse.js
npm.cmd run verify:patient-packet-identity-sparse
npm.cmd run verify:patient-packet-identity
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:hydration-candidate-preview
npm.cmd run verify:hydration-backlog-preview
npm.cmd run verify:queue-clock-posture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- All `node --check` commands passed.
- `npm.cmd run verify:patient-packet-identity-sparse` passed with all 11 required matrix cases covered.
- `npm.cmd run verify:patient-packet-identity` passed and preserved happy-path identity output.
- All required affected verification commands passed.
- `npm.cmd run verify:protected-terms` passed with warning-only advisory output: 284 warnings across 4 changed working-set files; no renames or protected-word JSON updates performed.
- `git diff --check` passed with CRLF normalization warnings only.
- `git status --short --branch` showed branch `main...origin/main` with HS250 working-tree changes.

## Outcome

Atlas can keep patient packet identity derived/read-only for now with stronger sparse-state proof. Missing, malformed, failed, cached, no-candidate, local SDE, provider-needed, and mixed-lane cases now disclose uncertainty or skip posture rather than implying false execution confidence.

## Risks / Follow-Up

- The trusted Hydration fixture override is for verifier coverage only; it should not become renderer/operator input.
- This still does not choose packet persistence, durable queues, leases, claims, provider cooldown persistence, or Hydration freshness-policy persistence.
- Recommended next action is Overseer review. If accepted, patient packet persistence can remain parked until a future active movement behavior proves durable state is necessary.
