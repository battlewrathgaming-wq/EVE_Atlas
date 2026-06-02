# Overseer HS188 - Trace-Pack Writer Redaction Hardening Runway

Status: active Dev runway
Date: 2026-06-02
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS188-trace-pack-writer-redaction-hardening.md`

## Purpose

Apply the accepted HS186 policy to the operator debug trace-pack writer in the smallest useful writer-hardening slice.

This packet should harden the trace pack that Atlas already writes through:

```txt
support.debug_trace_pack
```

Do not harden light operational logs yet. Do not create a broad support-artifact framework. This is one writer, one seam.

## Read First

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `workspace/OverseerHS187-hs186-trace-log-redaction-policy-review.md`
- `workspace/DevHS186-trace-log-redaction-policy-proof.md`
- `src/main/services/traceLogRedactionPolicyService.js`
- `src/main/support/operatorDebugTracePack.js`
- `scripts/verify-operator-debug-trace-pack.js`
- `scripts/verify-support-artifact-writer-conformance-gap-map.js`

## Task

Harden `src/main/support/operatorDebugTracePack.js` so the operator debug trace pack applies the accepted policy for bounded summaries, redaction, truncation, local-path sensitivity, and sample/exclusion disclosure.

Use HS186 as the policy basis. If a helper is needed, keep it local and small unless an existing local pattern strongly suggests a shared helper.

## Required Writer Behavior

Apply redaction/truncation to trace-pack fields that can carry free text or sensitive local/provider context:

- `fetch_runs.error_summary`
- `api_request_logs.endpoint`
- `api_request_logs.error_message`
- task `scope_key`
- task `error.message`
- data-quality `message`
- queue latest refs `last_error`
- runtime `database_path`
- runtime `temp_root`
- smoke artifact `root`
- smoke artifact file paths

Add explicit trace-pack disclosure metadata that names:

- trace-pack policy source, such as `support.trace_log_redaction_policy.preview`
- redaction/truncation posture
- local path sensitivity posture
- sample limit used
- omitted/excluded material posture
- support/debug non-authority posture

Preserve existing useful support summaries:

- readiness summary
- corpus health summary
- runtime boundary status
- latest fetch/API/request/task/warning/queue summaries
- smoke artifact existence and bounded file summary

## Minimum Policy Rules

Implement these outcomes:

- raw ESI payloads remain excluded
- full provider response bodies remain excluded
- full participant payload strings remain excluded
- secrets/tokens/authorization/cookie-like strings are redacted from free text
- endpoint query values are stripped or redacted
- endpoint strings are bounded
- error/warning free text is bounded
- queue latest refs remain bounded support samples, not Evidence
- local paths are marked sensitive and either role/basename summarized or explicitly disclosed as sensitive support metadata
- omitted/excluded material is visible enough for review

## Boundaries And Non-Goals

- Do not change light operational logs.
- Do not add new support artifact classes.
- Do not create new support artifact commands.
- Do not change snapshot writer behavior.
- Do not change readiness/preflight export behavior.
- Do not change support artifact creation policy.
- Do not activate runtime enforcement.
- Do not add command blocking.
- Do not call providers.
- Do not mutate Evidence/EVEidence, Discovery refs, Hydration labels/candidates, Assessment Memory, Watch state, storage config, External I/O config, or schema.
- Do not change renderer UI.
- Do not turn trace packs into Evidence/EVEidence, Discovery, Observation, Assessment Memory, product truth, deletion authority, or pruning authority.

## Stop Conditions

Stop and return to Overseer if:

- hardening requires changing schema or provider code
- hardening requires inspecting real operator artifacts
- hardening requires a broad support-artifact export framework
- the trace pack needs raw ESI payloads or full provider bodies to satisfy support needs
- local path handling requires storage migration or path authority changes
- runtime enforcement, command blocking, provider calls, live/private/destructive actions, or UI changes become necessary

## Verification Expectations

Run syntax checks on changed JavaScript files.

Expected verification:

```powershell
node --check src\main\support\operatorDebugTracePack.js
npm.cmd run verify:operator-debug-trace
npm.cmd run verify:support-artifact-writer-conformance-gap-map
npm.cmd run verify:support-trace-log-redaction-policy
npm.cmd run verify:support-artifact-contents-contract
npm.cmd run verify:support-artifact-creation-policy
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

`verify:operator-debug-trace` is allowed in this packet even though it creates fixture trace-pack artifacts, because HS188 changes the trace-pack writer. State that any created artifacts are fixture/test-controlled, not operator artifacts.

## Expected Handoff

Create:

```txt
workspace/DevHS188-trace-pack-writer-redaction-hardening.md
```

Include:

- files changed
- exact writer fields hardened
- redaction/truncation rules added
- sample trace-pack disclosure output
- whether `support.artifact_writer_conformance_gap_map.preview` statuses changed
- verification commands and results
- protected-term warning count
- confirmation that no light-log hardening, support artifact class expansion, provider calls, schema changes, runtime enforcement, command blocking, or UI work were performed
