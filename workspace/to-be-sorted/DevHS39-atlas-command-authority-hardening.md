# DevHS39 - Atlas Command Authority Hardening

Date: 2026-05-24
Role: Dev
Milestone: Atlas Command Authority Hardening
Packet: HS39

## Scope

Executed the HS39 backend/bridge command authority runway. This packet hardened service registry metadata, renderer IPC eligibility, command-owned confirmation requirements, HTTP retry behavior, and `task.cancel` classification. It did not implement the deferred Intel Console renderer presentation pass.

## Command / Effect Policy

`src/main/services/serviceRegistry.js` now defines bridge-facing effect metadata for service commands:

- `read-only`
- `runtime-control`
- `local-data-mutation`
- `external-live-api`
- `evidence-creation`
- `metadata-readability`
- `support-artifact`
- `destructive-preview`

Important effect decisions:

- `manual.discovery`: external live/API plus local queue mutation; not evidence creation in effect metadata.
- `manual.expansion`: external live/API plus evidence creation.
- `metadata.hydration`: external live/API plus metadata/readability.
- `runtime.db_snapshot.create`: support artifact creation.
- `support.debug_trace_pack`: support artifact creation.
- `task.cancel`: runtime-control.

## Renderer Eligibility

Renderer IPC now uses registry-owned eligibility:

- `atlas:service:list` returns renderer-eligible commands only.
- `atlas:service:invoke` marks calls as `source: renderer`.
- Non-renderer commands are rejected with `SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE`.

Examples of commands deliberately not renderer eligible in this packet:

- `sde.import.topology`
- `sde.import.inventory`
- `sde.build-lookups`
- `watch.recordRun`
- `watch.update`
- `watch.executor.tick`
- `report.build`
- `retention.actions`
- `retention.preflight`

## Confirmation Enforcement

Commands with live/API, evidence, local state, runtime-control, or support-artifact effects can declare command-owned confirmation tokens. Renderer IPC rejects missing tokens with `SERVICE_CONFIRMATION_REQUIRED` before handlers run.

Token-gated commands include:

- `manual.discovery`
- `manual.expansion`
- `actor.watch`
- `system.radius.watch`
- `metadata.hydration`
- `sde.build-lookups`
- `watch.create`
- `watch.update`
- `watch.executor.arm`
- `watch.executor.tick`
- `assessment.create`
- `runtime.db_snapshot.create`
- `support.debug_trace_pack`
- `task.cancel`

Renderer modules now pass those tokens only after their existing operator-facing confirmation checks.

## HTTP Retry

`src/main/api/httpClient.js` no longer retries non-retryable HTTP status responses accidentally. Non-OK statuses outside the explicit retry set are marked non-retryable and are attempted once. The retry set remains `420`, `429`, and `503`.

## Verification

Focused verification:

```powershell
npm.cmd run verify:command-authority
npm.cmd run verify:service-registry
npm.cmd run verify:http-timeouts
npm.cmd run verify:renderer-shell
npm.cmd run verify:background-execution
```

Required verification:

```powershell
npm.cmd run verify:all
npm.cmd run smoke:electron
git status --short --branch
```

Result:

```txt
PASS - verify:command-authority
PASS - verify:service-registry
PASS - verify:http-timeouts
PASS - verify:renderer-shell
PASS - verify:background-execution
PASS - verify:all, 62 scripts
PASS - smoke:electron
```

Electron smoke artifact path:

```txt
F:\Projects\AURA-Atlas\.tmp\electron-visual-smoke
```

## Current-State Update

Updated `docs/current-state/current-ipc-ui-preparation.md` to record:

- renderer IPC registry eligibility
- effect metadata for bridge-facing service commands
- command-owned confirmation token enforcement
- `task.cancel` as runtime-control
- non-retryable HTTP status behavior

## Remaining Risks / Overseer Decisions

- Confirmation tokens are command-owned backend policy and are verified at renderer IPC, but they are not a cryptographic permission system. This is appropriate for the current local Electron trust boundary; a future hostile-renderer or plugin model would need a stronger authority design.
- Internal service calls remain trusted by default unless tests pass `enforceAuthority=true`; this preserves CLI/verification/service composition while proving renderer bypass rejection.
- Overseer should decide whether `retention.preflight` should become renderer-eligible in a later retention UX packet. It remains blocked from renderer IPC in this packet.

## Recommended Next Action

Overseer should review the authority hardening and either accept HS39 or redirect any stricter authority model before the deferred Intel Console renderer presentation work resumes.
