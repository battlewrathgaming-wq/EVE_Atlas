# OverseerHS324 Invalid Stored Scope Authority Normalization Runway

Status: open
Date: 2026-06-05
Role: Overseer
Executor: Dev

## Human Intent

Resolve the small mismatch found by HS322 before it follows Atlas into Watch runtime shaping.

Invalid stored System / Radius Watch scope should not expose partial IDs as accepted or usable scope. If a stored scope is invalid, Atlas should keep the operator-facing/system-authority posture at rest until a valid stored scope exists.

Human phrasing:

```txt
hide it, note it, explain it through intuition rather than explicit warning
```

Meaning:

- invalid scope is not a usable proposal
- future UI/listen hook should remain locked out until valid proposal systems exist
- partial/valid numeric subset may be retained only as diagnostic detail
- do not make partial IDs look operator-actionable or execution-ready

## Milestone

Atlas Storage And Runtime Hardening

## Current Packet

Normalize invalid stored scope handling across setup readout, authored execution readiness, and the readout/readiness bridge.

Accepted rule:

```txt
invalid stored scope => no accepted/usable included_system_ids
invalid stored scope => not ready
invalid stored scope => blocked with invalid_stored_scope
partial parsed IDs => diagnostic only, never authority
```

## Product Requirement

When stored `included_system_ids` is invalid:

- operator-facing accepted scope should be empty
- future execution input should be empty
- readiness should be false
- blocked reason should include `invalid_stored_scope`
- center/radius must not be used as fallback authority
- bridge should report setup/readiness as matched
- any parseable numeric subset should appear only in a diagnostic/non-authority field, if retained at all

This does not need UI copy. The future UI posture is that invalid scope rests/locks out until valid proposal systems exist.

## Technical Requirement

Update the smallest existing helper/readout path that causes authored readiness to expose a valid numeric subset as stored scope for invalid rows.

Likely area:

```txt
src/main/services/watchAuthoredExecutionReadinessService.js
```

The implementation should preserve diagnostic clarity if useful, but must ensure fields treated as accepted scope authority or future execution input are empty for invalid stored scope.

The HS322 bridge should then show no mismatch for the invalid fixture row.

## Boundaries

Do not:

- execute a Watch
- arm/disarm Watch runtime
- create Watch executor tasks
- call zKillboard, ESI, or any provider
- perform live/API calls
- mutate Watch rows
- mutate Discovery refs
- write Evidence/EVEidence
- write Hydration/metadata labels
- change `watch.create`
- change topology traversal behavior
- infer execution authority from center/radius
- change schema
- implement renderer UI
- add popup/modal behavior
- redesign R-Scanner
- activate runtime enforcement or command blocking
- create support artifacts
- add durable Watch result identity
- add relationship tags
- rename source-owned terms
- update protected-word JSON
- open fourth-lane behavior

## Verification

Run focused checks:

```txt
node --check src\main\services\watchAuthoredExecutionReadinessService.js
node --check src\main\services\systemRadiusReadoutReadinessBridgeService.js
node --check scripts\verify-watch-authored-execution-readiness.js
node --check scripts\verify-system-radius-readout-readiness-bridge.js
npm.cmd run verify:watch-authored-execution-readiness
npm.cmd run verify:system-radius-readout-readiness-bridge
npm.cmd run verify:system-radius-setup-readout
npm.cmd run verify:watch-create-accepted-scope-contract
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If additional existing verifiers are impacted, run the smallest relevant set and document why.

## Expected Handoff

Create:

```txt
workspace/DevHS324-invalid-stored-scope-authority-normalization.md
```

The handoff should include:

- files changed
- before/after invalid-scope behavior
- whether diagnostic subset is retained and where
- proof that invalid scope exposes no accepted/usable IDs
- proof that bridge mismatch is resolved
- mutation boundary proof
- verification commands and results

## Stop Conditions

Stop and report if:

- resolving the mismatch requires schema changes
- resolving the mismatch requires Watch execution
- resolving the mismatch requires provider calls
- resolving the mismatch requires mutating stored Watch rows
- implementation would hide diagnostic evidence entirely when that harms operator/system review
- implementation would make center/radius a fallback authority
