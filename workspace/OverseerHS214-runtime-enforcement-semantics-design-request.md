# Overseer HS214 Runtime Enforcement Semantics Design Request

Status: advisory request opened
Date: 2026-06-02
Project: AURA Atlas
Requested role: Engineering / Security reviewer

## Purpose

Define the active runtime enforcement semantics Atlas would need before any command blocking implementation is opened.

This is design/assurance only. Do not implement code.

## Background

Atlas now has an inactive runtime hook fact spine with compact, read-only posture for:

- command classification coverage
- storage authority
- storage budget
- External I/O
- provider/live gate posture
- composed policy posture
- destination/path authority posture
- Watch/task runtime posture

HS210/HS211 found Atlas ready for later active-enforcement design discussion, but not active command blocking.

HS212/HS213 closed the main missing inactive fact class by adding Watch/task runtime posture.

The next risk is semantic drift: treating preview facts, dry-run posture, or composed-policy terms as runtime authorization without first defining active decision rules.

## Read

- `AGENTS.md`
- `workspace/overview.md`
- `workspace/current.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-assets.md`
- `workspace/critical/critical-terms.md`
- `workspace/EngineeringSafetyAuditHS210-runtime-enforcement-readiness-review.md`
- `workspace/OverseerHS211-hs210-runtime-enforcement-readiness-review.md`
- `workspace/OverseerHS213-hs212-runtime-hook-watch-task-runtime-review.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/features/data-layer-boundaries.md`
- `src/main/services/runtimeEnforcementEvaluator.js`
- `src/main/services/runtimeEnforcementDryAdapter.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/composedGatePolicyService.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/services/gateStackReadoutService.js`
- `scripts/verify-runtime-enforcement-hook.js`
- `scripts/verify-runtime-enforcement-adapter.js`
- `scripts/verify-enforcement-dry-run.js`
- `package.json`

## Questions To Answer

1. What would `pass`, `block`, `conditional`, `hold`, `stop_before_boundary`, `unknown`, and missing-fact states mean if active enforcement existed?
2. Which fact classes must be mandatory for active enforcement by command family?
3. Which commands should be excluded from the first active enforcement implementation?
4. Should `conditional` and `hold` block, defer, return structured held posture, or pass to existing handler gates?
5. How should active enforcement handle missing, malformed, stale, spoofed, renderer-origin, or explicitly supplied facts?
6. Who may supply authority-bearing runtime facts in future active mode?
7. Should active enforcement be command-family staged rather than global?
8. What should remain handled by existing front-door checks, live/provider gates, Watch arming, task locks, writer validation, or service handlers instead of the runtime hook?
9. What verification matrix would prove the semantics before implementation?
10. What should be rejected or parked to avoid overbuilding?

## Acceptance Checks

The design should preserve:

- preview facts are not authorization
- dry-run `would_allow` is not authorization
- External I/O on is not authorization
- Watch arming is not provider permission
- destination/path authority is not support artifact creation permission
- renderer payloads cannot supply authority facts
- missing mandatory facts cannot silently pass
- waiting/held is not failure
- support artifacts are not Evidence/EVEidence, Observation, Assessment Memory, product truth, deletion authority, or pruning authority
- active enforcement must not imply provider calls, task dispatch, storage movement, support artifact creation, or UI work

## Non-Goals

- no code changes
- no runtime enforcement activation
- no command blocking
- no provider calls
- no provider attempt recording
- no config writes
- no schema changes
- no support artifact creation
- no storage movement
- no renderer UI work
- no terminology renames

## Expected Artifact

Create:

```txt
workspace/EngineeringSafetyAuditHS214-runtime-enforcement-semantics-design.md
```

Expected output:

1. Executive recommendation.
2. Proposed active decision semantics.
3. Mandatory fact matrix by command family.
4. Commands excluded from first active enforcement.
5. Treatment of conditional/hold/missing/malformed/stale facts.
6. Trusted fact supply doctrine.
7. What remains outside runtime hook responsibility.
8. Smallest possible next packet, if any.
9. Acceptance criteria and verification commands for that packet.
10. Items to park.
