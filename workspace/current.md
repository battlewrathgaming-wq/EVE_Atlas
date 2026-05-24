# AURA Atlas Current Work

Status: Active - Dev runway
Last updated: 2026-05-24

## Active Milestone

Milestone: Atlas Command Authority Hardening

Source of intent:

- Human request: advisory hardening and authority update tour.
- `F:\Projects\Docs\Aura-Project-Orchestration\terminology\Atlas-Terminology-Boundary-Requirements-2026-05-24.md`
- Accepted ruleset: `F:\Projects\Docs\Aura-Project-Orchestration\terminology\TerminologyAuthorityRuleset-2026-05-24.md`
- `workspace/OverseerHS39-authority-hardening-tour.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`

Current focus: harden Atlas backend/bridge command authority before continuing broader renderer presentation wiring.

## Executor

Current executor: Dev.

Expected DevHS filename:

```txt
DevHS39-atlas-command-authority-hardening.md
```

## Purpose

Atlas has strong local-alpha mechanics, but the authority advisory found a risk at the renderer -> preload -> service boundary.

This packet should ensure command/effect authority is enforced by backend/bridge policy, not merely by renderer presentation.

The previous Renderer Intel Console Progressive Disclosure runway is deferred until this hardening packet is reviewed.

## Accepted Requirements

- Atlas owns internal and Project -> Bridge meaning.
- Lab/presentation layers may adapt human-facing language later, but must preserve Atlas meaning.
- Evidence/state/live-effect commands must not rely only on renderer checkbox or button state.
- Renderer IPC must not be able to invoke every registered backend command merely by knowing the command name.
- Command classifications must match actual effect.
- Evidence creation, live/API calls, durable/local state writes, metadata/readability updates, runtime/control mutations, and support artifact creation must be distinguishable.
- Confirmation/authority requirements belong to command/backend policy, with renderer metadata only supporting presentation.
- Direct invocation bypass attempts must be tested.

## Ordered Dev Runway

1. Read source-of-intent files and inspect the relevant source:
   - `src/main/preload.js`
   - `src/main/services/serviceRegistry.js`
   - `src/main/services/mutatingActionService.js`
   - `src/main/services/scopeService.js`
   - `src/main/services/queueSelectionService.js`
   - `src/main/services/retentionActionService.js`
   - `src/main/services/runtimeSnapshotService.js`
   - `src/main/services/liveApiGateService.js`
   - `src/main/services/taskRunner.js`
   - `src/main/api/httpClient.js`
   - renderer action paths that present confirmation
2. Inventory renderer-accessible service commands and classify their effects:
   - read-only
   - runtime/control mutation
   - local data mutation
   - external live/API call
   - evidence creation
   - metadata/readability update
   - support artifact creation
3. Add or tighten a backend/registry/preload authority policy:
   - explicit renderer allowlist or registry-level renderer eligibility
   - effect metadata available for bridge-facing commands
   - command-owned confirmation/authority requirements for evidence/state/live/support effects
4. Add backend rejection for direct invocation of commands that need confirmation/intent but lack it.
   Review at minimum:
   - `manual.discovery`
   - `manual.expansion`
   - `metadata.hydration`
   - `runtime.db_snapshot.create`
   - `sde.build-lookups`
   - watch/action commands that can call live APIs or write durable/local state
5. Correct HTTP retry behavior if inspection confirms non-retryable statuses are retried.
6. Reclassify `task.cancel` if inspection confirms it is misclassified as read-only despite mutating task state or aborting work.
7. Add or update verification for:
   - renderer allowlist / command eligibility
   - direct invocation without required confirmation rejected
   - command effect classifications
   - non-retryable HTTP status behavior
   - `task.cancel` classification
8. Update current-state or critical docs only if implementation changes authority boundaries.
9. Update Evidence / Dev Handoff and create the expected DevHS file.

## Guardrails

- Do not implement the Intel Console renderer presentation in this packet.
- Do not rename database tables, IPC commands, service command names, or files for terminology preference.
- Do not change evidence doctrine.
- Do not change live/API gates except to enforce authority more strictly.
- Do not create new live/private/destructive behavior.
- Do not make Lab responsible for Atlas meaning.
- Do not treat the parked terminology audit as approved authority.
- Keep unrelated UI redesign deferred.

## Stop Conditions

Return to Overseer/Human before continuing if:

- authority hardening requires breaking current documented operator workflows
- command confirmation requirements would require a product decision not covered here
- renderer allowlisting requires large IPC redesign beyond a bounded packet
- tests reveal existing commands are already unsafe in a way that needs broader architecture decision
- live/private/destructive verification would be required

## Required Verification

Run:

```powershell
npm.cmd run verify:all
git status --short --branch
```

Also run any new/focused verification added for:

```txt
renderer allowlist / command eligibility
direct invocation confirmation rejection
HTTP non-retryable status behavior
task.cancel classification
```

Run Electron smoke only if renderer/preload/UI paths changed:

```powershell
npm.cmd run smoke:electron
```

Do not run live smoke unless explicitly authorized by the Human.

## Evidence

Dev updates this before handoff:

```txt
Files changed:
Commands/effects inventoried:
Authority policy added/changed:
Confirmation enforcement:
Renderer eligibility/allowlist:
HTTP retry decision:
task.cancel classification decision:
Verification run:
Deferred items:
```

## Dev Handoff

Dev creates:

```txt
workspace/DevHS39-atlas-command-authority-hardening.md
```

Handoff must include:

- what command/effect policy now exists
- how direct invocation bypass is prevented or tested
- which commands require confirmation/intent
- renderer allowlist or eligibility details
- HTTP retry result
- task.cancel classification result
- verification results
- remaining risks or required Overseer decisions
