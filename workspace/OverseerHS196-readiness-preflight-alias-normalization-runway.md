# Overseer HS196 - Readiness Preflight Alias Normalization Runway

Status: active Dev runway
Date: 2026-06-02
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS196-readiness-preflight-alias-normalization.md`

## Purpose

Close the remaining support artifact conformance-map gap by normalizing the relationship between:

```txt
readiness_preflight_export
readiness_preflight_reports
```

The contents contract and creation policy use `readiness_preflight_export`. Path authority uses `readiness_preflight_reports` for the in-memory service/report surface. The conformance map already treats them as aliases, but still reports alias normalization as a gap.

This packet should add explicit canonical/alias disclosure so the naming relationship is clear without creating any export writer or changing readiness behavior.

## Read First

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `workspace/OverseerHS195-hs194-light-log-conformance-review.md`
- `workspace/DevHS194-light-operational-log-conformance-refresh.md`
- `workspace/OverseerHS181-hs180-security-review-acceptance.md`
- `workspace/SecurityReviewHS180-support-artifact-contents-contract.md`
- `src/main/services/supportArtifactContentsContractService.js`
- `src/main/services/supportArtifactCreationPolicyService.js`
- `src/main/services/supportArtifactPathAuthorityService.js`
- `src/main/services/supportArtifactWriterConformanceGapMapService.js`
- relevant verifier scripts for the four support artifact previews

## Task

Normalize readiness/preflight artifact class naming across the read-only support artifact previews.

Preferred outcome:

- `readiness_preflight_export` remains the canonical contents/creation class id.
- `readiness_preflight_reports` remains an accepted path-authority alias for the current in-memory/readout posture.
- The conformance map reports alias normalization as conforming or no longer a gap.
- The path authority and/or conformance map explicitly discloses the canonical/alias relationship.

## Required Behavior

Update read-only preview metadata and verifier expectations so:

- `readiness_preflight_export` and `readiness_preflight_reports` are visibly linked
- the current service command remains `app.readiness`
- no dedicated readiness/preflight export writer exists
- current readiness/preflight output remains in-memory/read-only posture unless a future export is explicitly opened
- local path sensitivity remains partial if it is still not field-level disclosed
- support artifacts remain non-authoritative for Evidence/EVEidence, Discovery, Observation, Assessment Memory, product truth, deletion authority, and pruning authority

Acceptable conformance posture:

- `writer_surface_exists` can remain `partial`
- `local_path_sensitivity` can remain `partial`
- `class_id_alias_normalization` should no longer be `gap` if canonical/alias disclosure is implemented

## Boundaries And Non-Goals

- Do not create a readiness/preflight export writer.
- Do not create support artifacts, snapshots, trace packs, logs, files, exports, packages, or directories.
- Do not change `app.readiness` behavior except metadata/readout class/alias disclosure if needed.
- Do not change runtime snapshot behavior.
- Do not change trace-pack writer behavior.
- Do not change API request log persistence behavior.
- Do not call providers.
- Do not change schema.
- Do not change reports.
- Do not mutate Evidence/EVEidence, Discovery refs, Hydration labels/candidates, Assessment Memory, Watch state, storage config, External I/O config, or runtime enforcement state.
- Do not activate runtime enforcement.
- Do not add command blocking.
- Do not change renderer UI.

## Stop Conditions

Stop and return to Overseer if:

- closing the gap requires creating a write-capable readiness/preflight export
- closing the gap requires changing `app.readiness` runtime behavior rather than metadata/preview posture
- implementation requires schema changes, provider calls, runtime enforcement, command blocking, destructive/private/live actions, or UI work
- the alias model would make path authority override contents/creation authority instead of simply linking class ids

## Verification Expectations

Run syntax checks on every changed JavaScript file.

Expected verification:

```powershell
npm.cmd run verify:support-artifact-writer-conformance-gap-map
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:support-artifact-creation-policy
npm.cmd run verify:support-artifact-contents-contract
npm.cmd run verify:app-readiness
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Also keep HS194/HS192 alignment healthy:

```powershell
npm.cmd run verify:api-request-log-redaction-readiness
```

## Expected Handoff

Create:

```txt
workspace/DevHS196-readiness-preflight-alias-normalization.md
```

Include:

- files changed
- canonical/alias model used
- conformance map status movement
- remaining support artifact partials/gaps, if any
- verification commands and results
- protected-term warning count
- confirmation that no readiness/preflight export writer, support artifact creation, provider behavior, schema, reports, runtime enforcement, command blocking, Evidence/EVEidence, Discovery, Hydration, Assessment Memory, Watch, storage config, External I/O config, or UI work was added
