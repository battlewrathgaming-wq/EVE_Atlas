# OverseerHS322 System Watch Readout Readiness Bridge Runway

Status: open
Date: 2026-06-05
Role: Overseer
Executor: Dev

## Human Intent

Do not rush into renderer surfacing or UI inventory. Keep the next step boring, local, and mechanically useful.

Prove that the accepted System / Radius Watch setup readout from HS320 and the authored execution readiness preview from HS314 agree on the same stored Watch rows and stored included-system scope.

This should connect the post-create inspection limb to the future execution-readiness limb without starting Watch execution.

## Milestone

Atlas Storage And Runtime Hardening

## Current Packet

Add a read-only/local-only bridge preview that compares:

```txt
watch.system_radius_setup_readout.preview
watch.authored_execution_readiness.preview
```

Preferred command:

```txt
watch.system_radius_readout_readiness_bridge.preview
```

Alternative name is acceptable if it clearly remains a read-only bridge between setup readout and execution readiness.

## Core Rule

```txt
stored included_system_ids = shared authority
setup readout = what Atlas accepted/stored
execution readiness = whether the stored scope is usable as future execution input
bridge = conformance proof only
```

## Product Requirement

Given stored System / Radius Watch rows, Atlas should report whether the setup readout and readiness preview agree on:

- Watch ID
- active/inactive state
- stored-scope status
- stored included-system IDs
- included-system count
- center/radius role as provenance/management
- whether center/radius are used as authority
- readiness for future execution input
- blocked reasons for missing/malformed/empty/invalid/inactive rows
- next safe action

The bridge should make mismatches explicit without fixing them.

## Technical Requirement

Implement a read-only service preview that composes or independently invokes the existing local readouts:

- `buildSystemRadiusSetupReadout`
- `buildWatchAuthoredExecutionReadinessPreview`

The preview should produce:

- summary counts
- per-Watch conformance rows
- matched fields
- mismatch fields
- boundary/does-not-do statements
- mutation proof

The bridge must not become the executor and must not infer scope from center/radius.

## Required Cases

Verifier fixtures should prove at least:

- valid active accepted stored scope matches setup/readiness
- inactive Watch with valid stored scope matches as stored but is not ready
- missing stored scope is blocked in both views
- malformed stored scope is blocked in both views
- empty stored scope is blocked in both views
- invalid stored scope is blocked in both views
- valid stored scope with missing local display name remains ready from raw IDs

If any existing readout uses slightly different names for equivalent states, the bridge should disclose the mapping rather than silently flattening it.

## Boundaries

Do not:

- execute a Watch
- arm/disarm Watch runtime
- create Watch executor tasks
- call zKillboard, ESI, or any provider
- perform live/API calls
- mutate Discovery refs
- write Evidence/EVEidence
- write Hydration/metadata labels
- change `watch.create`
- change `watch.system_radius_setup_readout.preview`
- change `watch.authored_execution_readiness.preview` unless a tiny non-behavioral export/helper adjustment is necessary
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
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-passive-side-effects.js
npm.cmd run verify:system-radius-readout-readiness-bridge
npm.cmd run verify:system-radius-setup-readout
npm.cmd run verify:watch-authored-execution-readiness
npm.cmd run verify:watch-create-accepted-scope-contract
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If the verifier name differs, update the handoff with the actual command and why.

## Expected Handoff

Create:

```txt
workspace/DevHS322-system-watch-readout-readiness-bridge.md
```

The handoff should include:

- files changed
- command name added
- sample matched readout/readiness bridge row
- sample blocked rows
- mismatch handling, if any
- mutation boundary proof
- verification commands and results
- explicit statement that no Watch execution or provider movement was opened

## Stop Conditions

Stop and report if:

- the bridge requires schema changes
- the bridge requires Watch execution
- the bridge requires provider calls
- the bridge requires mutating Watch rows
- the bridge requires changing accepted scope authority
- the bridge cannot compare setup/readiness without a new model decision
- implementation would start treating center/radius as execution authority
