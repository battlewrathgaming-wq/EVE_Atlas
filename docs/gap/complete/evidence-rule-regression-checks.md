# Gap To-Do: Evidence Rule Regression Checks

Status: Open
Roadmap: `docs/roadmap/evidence-safe-assessment-and-discovery-ux.md`

## Task Requirement

Add narrow regression checks that protect the evidence rule as Atlas gains assessment and UI convenience features.

## Why It Matters

The code now has multiple layers: queue refs, evidence, observations, metadata hydration, assessment artifacts, and retention previews. The risk is not that one feature breaks everything; the risk is a small shortcut quietly blurs a boundary.

## Actionables

- Verify duplicate killmail persistence does not overwrite `raw_esi_payload`.
- Verify manual discovery writes queued refs but no killmails or activity events.
- Verify queue previews are marked non-evidence in structured and text outputs.
- Verify assessment artifact citation validation.
- Verify metadata hydration does not change IDs or raw killmail payloads.
- Verify retention/compaction preflight remains non-destructive.

## Guardrails

- Keep checks offline and deterministic.
- Do not add live API calls to `verify:all`.
- Do not test UI wording by brittle large snapshots if targeted assertions are enough.

## Completion Signal

- Evidence-rule checks are included in `verify:all` or an existing focused verification script.
- Failure messages name the broken boundary.
- `npm.cmd run verify:all` passes.

## Related Files

- `scripts/verify-idempotent-ingestion.js`
- `scripts/verify-manual-discovery.js`
- `scripts/verify-queue-selection.js`
- `scripts/verify-assessment-artifacts.js`
- `scripts/verify-retention-preflight.js`
- `scripts/verify-metadata-status.js`
