# DevHS198 - Hydration Attention Lens

Status: complete pending Overseer review
Date: 2026-06-02
Milestone: Atlas Storage And Runtime Hardening
Command surface: `metadata.hydration_attention_lens.preview`

## Summary

Added a read-only Hydration attention lens preview that derives selected readability landmarks from existing local Hydration candidates.

The proof reuses `metadata.hydration_candidates.preview` as source material, then classifies candidates into selected landmarks and deferred/background unresolved IDs for a current operator lens. It does not create a persisted queue, call providers, write Hydration output, change schema, or touch UI.

## Files Changed

- `src/main/services/hydrationAttentionLensService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-hydration-attention-lens.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `package.json`
- `workspace/current.md`

Pre-existing packet/context files also remained in the tree:

- `workspace/overview.md`
- `workspace/OverseerHS198-hydration-attention-lens-runway.md`

## Preview Shape

`metadata.hydration_attention_lens.preview` returns:

- lens input summary with lens type, report target or explicit IDs, and non-authorizing basis
- source candidate preview summary from `metadata.hydration_candidates.preview`
- selected candidate counts and deferred/background counts
- provider-needed, known-local, and local-SDE-gap selected/deferred counts
- selected candidates with stable `dedupe_key`, entity/lookup IDs, label state, group, attention role/basis, lanes, source anchors, source basis, and counts
- deferred candidates with stable `dedupe_key`, entity/lookup IDs, label state, group, deferred reason, lanes, source anchors, and counts
- priority posture proving Watch/background candidates are patient and do not starve view/local-record attention
- boundary statements preserving Hydration as readability-only

## Sample Output Summary

Focused fixture sample from `npm.cmd run verify:hydration-attention-lens`:

```txt
source candidate count: 4
selected candidate count: 3
deferred/background candidate count: 1
provider-needed selected count: 2
known-local selected count: 1
local-SDE-gap selected count: 1
selected groups: provider-needed=1, known-local=1, local-SDE-gap=1
deferred groups: provider-needed=1, known-local=0, local-SDE-gap=0
```

Representative selected candidates:

- `entity:character:90000003`: provider-needed report-target readability landmark
- `entity:corporation:98000002`: known-local/stale local readability landmark
- `local_sde:inventory_type:999999`: local SDE lookup gap, not ESI Hydration

Representative deferred candidate:

- `entity:character:90000004`: Watch/background provider-needed candidate left unresolved/deferred and visible

## Candidate Distinctions

Provider-needed candidates mean entity label readability may need future provider-backed Hydration under gates.

Known-local candidates mean a readable local label already exists or is stale local metadata.

Local-SDE-gap candidates mean a static type/geography lookup gap belongs to local SDE readiness, not ESI Hydration.

Unhydrated IDs remain facts. Missing labels are not failure, missing Evidence/EVEidence, or proof gaps.

## Boundary Confirmation

No provider calls, Hydration writes, persisted queue, schema changes, support artifacts, runtime enforcement, command blocking, UI work, Evidence/EVEidence creation, Discovery mutation, Watch mutation, Assessment Memory mutation, Marked mutation, pruning, deletion, label removal, or de-emphasis behavior was added.

## Verification

Syntax checks:

```powershell
node --check src\main\services\hydrationAttentionLensService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-hydration-attention-lens.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-passive-side-effects.js
```

All syntax checks passed.

Required and focused verification:

```powershell
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
```

All listed npm verification commands passed.

`verify:protected-terms` completed with warning-only advisory output:

```txt
warning count: 345
files scanned: 10
confirmation: warning-only; no renames performed; no protected-word JSON updates performed
```

Final hygiene commands are recorded in `workspace/current.md` after completion.

Final hygiene:

```powershell
git diff --check
git status --short --branch
```

`git diff --check` passed with CRLF normalization warnings only.

`git status --short --branch` showed branch `main...origin/main` with HS198 working-tree changes.

## Risks / Notes

- The lens is a preview selector over representative local candidates, not a complete readability coverage claim.
- Stale local labels can be locally known landmarks while still contributing to provider-needed refresh counts.
- Selection limits intentionally leave unresolved IDs visible instead of hiding them.
- Future provider-backed or write-capable Hydration still needs a separate runway.
