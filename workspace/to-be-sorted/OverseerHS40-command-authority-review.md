# OverseerHS40: Command Authority Review

Date: 2026-05-24
Role: Overseer
Reviewed handoff: `workspace/DevHS39-atlas-command-authority-hardening.md`

## Decision

Accepted HS39 for the current local Electron trust boundary.

Dev completed the command authority hardening packet by adding bridge-facing effect metadata, renderer eligibility, command-owned confirmation requirements, focused authority verification, non-retryable HTTP status handling, and `task.cancel` runtime-control classification.

## Accepted Changes

- Renderer IPC service list is limited to renderer-eligible commands.
- Renderer IPC invocation tags calls as renderer-sourced and rejects non-renderer commands.
- Effect metadata now distinguishes read-only, runtime-control, local-data-mutation, external-live-api, evidence-creation, metadata-readability, support-artifact, and destructive-preview effects.
- Manual discovery is correctly represented as external live/API plus local queue mutation, not evidence creation.
- Manual expansion is represented as external live/API plus evidence creation.
- Metadata hydration is represented as external live/API plus metadata/readability.
- Runtime snapshot and debug trace pack are represented as support artifacts.
- `task.cancel` is runtime-control.
- Renderer IPC rejects authority-gated commands without command-owned confirmation tokens.
- Non-retryable HTTP statuses outside the explicit retry set are not retried.

## Verification Rerun

Overseer reran:

```powershell
npm.cmd run verify:command-authority
npm.cmd run verify:service-registry
npm.cmd run verify:http-timeouts
npm.cmd run verify:renderer-shell
npm.cmd run verify:background-execution
npm.cmd run verify:all
npm.cmd run smoke:electron
git diff --check
```

Result:

```txt
PASS - verify:command-authority
PASS - verify:service-registry
PASS - verify:http-timeouts
PASS - verify:renderer-shell
PASS - verify:background-execution
PASS - verify:all
PASS - smoke:electron
PASS - git diff --check, CRLF normalization warnings only
```

## Residual Risk

The confirmation tokens are command-owned intent markers, not cryptographic permissions. This is acceptable for the current local Electron trust boundary, where the goal is preventing accidental/generic renderer invocation and enforcing bridge policy. A future hostile-renderer, plugin, remote UI, or multi-process extension model would need stronger authority design.

Internal service composition remains trusted unless tests use `enforceAuthority=true`. That is acceptable for current CLI/service verification behavior.

`retention.preflight` remains non-renderer-eligible. A later retention UX packet can reconsider it.

## Next Packet

The deferred renderer presentation pass can resume. `workspace/current.md` now requests:

```txt
DevHS41-renderer-intel-console-progressive-disclosure.md
```
