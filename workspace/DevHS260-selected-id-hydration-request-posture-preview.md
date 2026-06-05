# DevHS260 Selected-ID Hydration Request Posture Preview

Status: complete for Overseer review

## Summary

Implemented the read-only selected-ID Hydration request posture proof:

```txt
selected unresolved ID -> explicit operator act -> local-first lookup -> Hydration request posture
```

New command:

```txt
metadata.hydration_request_posture.preview
```

The command is renderer-eligible and read-only. It classifies posture from local DB rows and existing gate readouts only. It does not create pickup work, queues, provider calls, Hydration writes, metadata runs, entity writes, activity-event patches, Evidence/EVEidence, Discovery mutations, Watch mutations, support artifacts, schema changes, runtime enforcement, command blocking, storage/config writes, or UI work.

## Files Changed

- `package.json`
- `src/main/services/hydrationRequestPostureService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-hydration-request-posture.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-passive-side-effects.js`
- `workspace/current.md`
- `workspace/DevHS260-selected-id-hydration-request-posture-preview.md`

## Service Shape

`metadata.hydration_request_posture.preview` returns:

- request identity and derived `request_posture_id`
- `request_posture_state`
- `label_state`
- local label/basis where available
- provider-needed posture
- External I/O held/released posture
- storage write posture for future Hydration writes
- live/provider gate posture without recording attempts
- `pickup_eligible`
- `next_safe_action`
- explicit zero counters and boundary flags

States demonstrated:

- `not_a_request`
- `already_local`
- `local_lookup_available`
- `held`
- `blocked`
- `invalid`
- `insufficient_basis`

## Sample Output

Focused verifier sample states:

```txt
focus/non-request:
  request_posture_state=not_a_request
  pickup_eligible=false

already local:
  request_posture_state=already_local
  local_label=Known Pilot
  provider_needed=false

local lookup:
  request_posture_state=local_lookup_available
  local_label=Merlin
  provider_needed=false

local SDE gap:
  request_posture_state=local_lookup_available
  label_state=local_sde_gap
  next_safe_action=repair_local_sde_lookup_or_continue_without_provider

provider held:
  request_posture_state=held
  label_state=provider_needed
  provider_posture=held_by_external_io
  pickup_eligible=false

storage blocked:
  request_posture_state=blocked
  future_hydration_write_posture=block_writes
  future_hydration_writes_blocked=true

insufficient basis:
  request_posture_state=insufficient_basis

unsupported ID:
  request_posture_state=invalid
  label_state=invalid_or_unsupported_id
```

## Verification

Commands run and results:

```txt
node --check src\main\services\hydrationRequestPostureService.js
passed

node --check src\main\services\serviceRegistry.js
passed

node --check scripts\verify-hydration-request-posture.js
passed

npm.cmd run verify:hydration-request-posture
passed

npm.cmd run verify:service-registry
passed

npm.cmd run verify:command-authority
passed

npm.cmd run verify:enforcement-dry-run
passed

npm.cmd run verify:passive-side-effects
passed

npm.cmd run verify:protected-terms
passed with warning-only advisory output: 264 warnings across 8 changed working-set files; no renames or protected-word JSON updates performed

git diff --check
passed with CRLF normalization warnings only

git status --short --branch
branch main...origin/main with HS260 working-tree changes
```

## Boundary Confirmation

Confirmed:

- no provider calls
- no Hydration execution
- no Hydration writes
- no `metadata_runs` writes
- no entity writes
- no activity-event label patches
- no Evidence/EVEidence writes
- no Discovery ref mutation
- no Watch mutation or arming
- no Assessment Memory or Marked mutation
- no persisted queue
- no pickup creation
- no dispatcher or execution start
- no schema changes
- no runtime enforcement activation
- no command blocking
- no storage config or External I/O config writes
- no storage movement
- no support artifact creation
- no renderer UI work

## Risks / Notes

- The preview is intentionally posture-only. It does not authorize execution, persist request state, or create future pickup work.
- External I/O on is still not authorization; it only releases provider-needed posture to normal storage/live/cadence/confirmation gates.
- Local SDE gaps remain local lookup readiness work, not provider-backed ESI Hydration.

## Recommended Next Action

Overseer review HS260 and decide whether the next seam should remain read-only request-pickup shaping or pause before any persistence/dispatcher work.
