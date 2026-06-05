# OverseerHS320 System Watch Post-Create Readout Runway

Status: open
Date: 2026-06-05
Role: Overseer
Executor: Dev

## Human Intent

Build the boring, expected, repeatable follow-up to HS318.

After an operator explicitly confirms and creates a System / Radius Watch, Atlas should be able to show what was accepted and stored. This should make the local Watch setup inspectable without implying Watch execution, provider movement, or final UI design.

## Milestone

Atlas Storage And Runtime Hardening

## Current Packet

Add a read-only post-create Watch setup readout for accepted System / Radius Watches.

Preferred command:

```txt
watch.system_radius_setup_readout.preview
```

Alternative name is acceptable if it clearly remains a read-only preview of stored setup state.

## Product Requirement

Given one or more stored `system_watches` rows, Atlas should report:

- Watch ID
- active/inactive state
- center system ID/name as provenance/management
- radius as provenance/management
- stored included system IDs as accepted Watch scope authority
- included system display names when available locally
- included system count
- stored-scope status:
  - valid
  - missing
  - malformed
  - empty
  - invalid
- whether the row is ready for future execution input from stored scope
- next safe operator/system action
- what this readout does not do

The readout should use existing local tables only.

## Technical Requirement

Implement a read-only service preview that inspects existing stored System / Radius Watch setup rows.

It may reuse existing parsing/readiness helpers if appropriate, but must keep this packet scoped to the post-create setup readout.

The readout must make this boundary clear:

```txt
stored included_system_ids = accepted Watch scope authority
center/radius = provenance and management after acceptance
readout = inspection only
```

## Required Cases

Verifier fixtures should prove at least:

- valid accepted stored scope with center included
- inactive Watch with valid stored scope
- missing stored included-system scope
- malformed stored included-system scope
- empty stored included-system scope
- invalid stored included-system IDs
- unknown/missing local system name handling, if applicable

## Boundaries

Do not:

- execute a Watch
- create Watch executor tasks
- call zKillboard, ESI, or any provider
- perform live/API calls
- mutate Discovery refs
- write Evidence/EVEidence
- write Hydration/metadata labels
- change `watch.create`
- change topology traversal behavior
- recompute accepted scope from center/radius as readout authority
- change schema
- implement final renderer UI
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
npm.cmd run verify:system-radius-setup-readout
npm.cmd run verify:watch-create-accepted-scope-contract
npm.cmd run verify:watch-authored-execution-readiness
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
workspace/DevHS320-system-watch-post-create-readout.md
```

The handoff should include:

- files changed
- command name added
- sample valid readout
- sample blocked/malformed readouts
- mutation boundary proof
- verification commands and results
- explicit statement that no Watch execution or provider movement was opened

## Stop Conditions

Stop and report if:

- the readout requires schema changes
- the readout requires changing `watch.create`
- the readout requires topology traversal behavior changes
- implementation would infer execution authority from center/radius instead of stored included-system IDs
- implementation would create Watch tasks or call providers
- stored setup state is too ambiguous to inspect without a new data model decision
