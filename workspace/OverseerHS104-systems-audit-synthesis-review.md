# OverseerHS104 - Systems Audit Synthesis Review

Date: 2026-05-27
Role: Atlas Overseer
Status: accepted advisory synthesis; no Dev runway opened

## Materials Reviewed

- `workspace/SystemsAuditHS100-storage-path-budget-authority.md`
- `workspace/SystemsAuditHS101-local-lookup-vs-esi-enrichment.md`
- `workspace/SystemsAuditHS102-pruning-readiness.md`
- `workspace/SystemsAuditHS103-sequencer-provider-cadence.md`
- `workspace/current.md`
- `workspace/overview.md`
- `docs/current-state/current-storage-runtime-hardening.md`

## Disposition

The four systems audits are accepted as advisory review input for the Atlas Storage And Runtime Hardening milestone.

They do not authorize implementation by themselves. They do not change product doctrine beyond the accepted durable direction already recorded in `docs/current-state/current-storage-runtime-hardening.md`. They do not open a Dev runway.

## Cross-Cutting Finding

The audits agree on a practical sequence:

1. Prove and expose current state first.
2. Avoid broad architecture until the proof layer shows the real pressure.
3. Keep storage authority, provider cadence, local lookup, pruning, Discovery, Evidence/EVEidence, hydration, Watch, and Assessment Memory separate.
4. Prefer read-only diagnostics and relationship previews before enforcing new write behavior.

Atlas is not blocked, but the next system packet should not jump straight into destructive pruning, broad sequencer architecture, or storage migration. The strongest next direction is a read-only storage authority preflight/inventory that makes the current DB/storage/support-artifact posture visible before any lockout or migration behavior is implemented.

## Accepted Advisory Points

### HS100 Storage Path / Budget Authority

Accepted as the strongest immediate systems candidate.

- Production Electron can still fall back to hidden `userData` storage when `AURA_ATLAS_DB_PATH` is absent.
- `openDatabase()` can create missing parent directories, which conflicts with the accepted briefcase/storage-authority direction for real/alpha collection.
- Snapshot budget authority exists, but whole-Atlas storage budget authority does not.
- Recommended next step is read-only storage authority status/inventory before lockout enforcement.

### HS101 Local Lookup vs ESI Enrichment

Accepted as a boundary hardening candidate after or alongside storage authority.

- Local lookup, hydration, and ESI Evidence/EVEidence enrichment are mostly well separated.
- Typed actor name resolution can call ESI when uncached and live API is enabled, but is not modeled as a first-class live-gated metadata/provider action.
- `watch.create` may therefore have provider-capable behavior while being classified as local metadata mutation.
- Recommended next step is explicit classification/gating for typed actor name resolution, without changing Evidence/EVEidence boundaries.

### HS102 Pruning Readiness

Accepted as future work, not current destructive work.

- Atlas is ready to improve read-only pruning relationship previews.
- Atlas is not ready for destructive pruning execution.
- Deletion ordering, provenance semantics, Assessment Memory stale effects, Discovery ref expiration policy, snapshot/support-artifact disclosure, and preview-to-execution consistency must be designed before destructive pruning.

### HS103 Sequencer / Provider Cadence

Accepted as confirmation to keep Sequencer work conservative.

- Current Atlas supports cautious alpha patient acquisition through Watch scheduling, caps, readouts, and provider-capacity deferral.
- Full persisted Sequencer/provider-cadence architecture is not implemented and should not be opened casually.
- The current coupled Watch collector model is acceptable as a known interim shape.
- Recommended next step, if selected, is readout/verification proof of cadence phases from existing state before schema-backed Sequencer movement.

## Recommended Next Direction

Recommended next bounded packet, when Human opens Dev again:

Storage authority preflight/inventory, read-only.

Scope:

- report current DB path mode: configured, fallback, missing, outside policy, or demo/fixture
- inventory DB, WAL/SHM, snapshot destination/settings, trace-pack destination, temp/cache/SDE paths, window/settings path, and support artifact roots
- compute byte usage for known Atlas-controlled storage locations where practical
- surface whether runtime is using hidden Electron userData fallback
- do not move DBs
- do not write storage config
- do not enforce lockout yet
- do not prune
- do not change provider behavior

Why:

- It directly supports the accepted storage path/budget direction.
- It is small enough to verify offline.
- It gives Atlas a proof layer before choosing total lockout versus narrower write/provider/acquisition lockout.

## Parked Work

- Destructive pruning execution.
- Broad provider work queue.
- Persisted Sequencer packet table.
- Durable movement checkpointing.
- Discovery ref stale/expired mutation.
- Storage migration/copy/move tooling.
- Global storage hard-lock implementation until storage posture is visible.
- UI/body work beyond lightweight readout needs.

## Human Decisions Still Needed

- Whether first storage enforcement should be total app lockout or narrower write/provider/acquisition lockout.
- Exact app-local portable storage authority config filename and placement.
- Whether project `.tmp` can be an explicit real storage choice or remains dev/demo only.
- Whether typed actor name resolution should be its own live-gated action or folded under metadata hydration.
- Whether pruning previews should be grouped first by time, entity, Watch scope, Observation story impact, or storage budget impact.

## Verification

Review-only artifact. No code, schema, renderer, service, provider, storage, pruning, or runtime behavior was changed.

Recommended verification for this review:

```powershell
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```
