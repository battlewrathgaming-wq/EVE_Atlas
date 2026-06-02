# Overseer HS199 - HS198 Hydration Attention Lens Review

Status: accepted
Date: 2026-06-02
Milestone: Atlas Storage And Runtime Hardening
Reviewed handoff: `workspace/DevHS198-hydration-attention-lens.md`

## Review Result

HS198 is accepted.

Dev added `metadata.hydration_attention_lens.preview` as a read-only Hydration attention selection surface.

Accepted meaning:

- Hydration attention is a preview over local facts, not a persisted queue.
- Selected candidates are readability landmarks for the current lens.
- Deferred candidates remain visible unresolved/background IDs.
- Provider-needed labels, known-local labels, and local-SDE gaps remain distinct.
- Missing labels are not failure, missing Evidence/EVEidence, or proof gaps.
- Selected attention does not authorize provider calls or Hydration writes.

## Files Reviewed

- `workspace/DevHS198-hydration-attention-lens.md`
- `src/main/services/hydrationAttentionLensService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-hydration-attention-lens.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-passive-side-effects.js`
- `package.json`

## Accepted Behavior

`metadata.hydration_attention_lens.preview` reuses `metadata.hydration_candidates.preview` source material and returns:

- lens input summary
- source preview summary
- selected readability landmarks
- deferred/background candidates
- candidate group counts
- priority posture
- Evidence/EVEidence and Hydration boundary statements

Sample verifier result:

- source candidates: 4
- selected candidates: 3
- deferred/background candidates: 1
- provider-needed selected: 2
- known-local selected: 1
- local-SDE-gap selected: 1

Accepted selected examples:

- `entity:character:90000003` as a provider-needed report-target readability landmark
- `entity:corporation:98000002` as a known-local/stale readability landmark
- `local_sde:inventory_type:999999` as a local SDE lookup gap, not ESI Hydration

Accepted deferred example:

- `entity:character:90000004` remains visible as a Watch/background provider-needed candidate rather than being hidden or treated as failure.

## Boundary Check

Confirmed:

- no persisted Hydration queue
- no provider calls
- no Hydration writes
- no `metadata_runs`, `entities`, or `activity_events` label writes
- no Evidence/EVEidence creation
- no Discovery ref mutation
- no Watch mutation
- no Assessment Memory mutation
- no Marked mutation
- no schema changes
- no support artifact creation
- no runtime enforcement activation
- no command blocking
- no renderer UI work
- no pruning, deletion, label removal, or de-emphasis behavior

## Verification

Overseer reran:

```powershell
node --check src\main\services\hydrationAttentionLensService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-hydration-attention-lens.js
npm.cmd run verify:hydration-attention-lens
npm.cmd run verify:hydration-candidate-preview
npm.cmd run verify:hydration-backlog-preview
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:hydration
npm.cmd run verify:metadata-status
npm.cmd run verify:metadata-lookup
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
```

Results:

- all verification commands passed
- `verify:protected-terms` passed warning-only with 355 warnings across 11 changed files
- no renames or protected-word JSON updates were performed
- `git diff --check` passed with CRLF normalization warnings only

## Resting State

Hydration attention now has a read-only proof surface that supports the accepted Atlas principle:

```text
Hydration repairs selected readability over local facts; it does not need to complete the whole corpus.
```

Recommended next choices:

1. rest Hydration previews and continue a different storage/runtime seam
2. shape a later provider/write-capable Hydration runway only after deciding execution policy
3. explore local SDE readiness gaps separately from ESI Hydration
