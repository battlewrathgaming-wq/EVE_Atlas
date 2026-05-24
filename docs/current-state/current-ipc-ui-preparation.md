# Current State: IPC And UI Preparation

Date: 2026-05-24

## Summary

AURA Atlas has a working Electron IPC/service shell and a first-pass Investigation Desk. The backend/service boundary is strong enough for local alpha use and offline smoke verification.

The current risk is no longer missing backend capability. The current risk is presentation shape: the UI still exposes too much diagnostic/configuration structure too early and needs a clearer discovery/storytelling journey.

Active coordination state is in `workspace/current.md`. As of 2026-05-24, the active packet is Atlas Command Authority Hardening for Dev. The earlier Intel Console renderer presentation pass is deferred until backend/bridge command authority is reviewed and accepted.

## What Exists Now

Implemented shell and bridge:

- Electron renderer uses the preload service bridge, not direct backend imports.
- `atlas:service:list` and `atlas:service:invoke` expose backend services through IPC.
- Renderer IPC service listing and invocation are governed by registry-owned renderer eligibility; non-renderer service commands are blocked at the IPC boundary.
- Bridge-facing service commands expose effect metadata and command-owned authority requirements so downstream presentation can distinguish read-only, runtime-control, local mutation, live/API, evidence creation, metadata/readability, and support artifact effects.
- `window.atlasServices` is the renderer service bridge.
- `window.atlasWindow` supports frameless window controls.
- Frameless shell, minimize/close, and persisted always-on-top are implemented.
- Electron visual smoke runs through `npm.cmd run smoke:electron`.

Implemented service surfaces include:

- readiness/settings inspection and explicit runtime preparation
- scope defaults and scope validation
- live/API gate inspection and refusal behavior
- task list, task detail, task cancellation, task-wrapped service execution
- manual discovery and manual expansion
- actor/system watch authoring and session-armed watch execution
- queue selection and queue report
- actor, radius, corporation, run, queue, corpus health, and metadata reports
- report-scoped metadata hydration for readability
- assessment memory create/list/get
- runtime DB snapshot preflight/create
- support debug trace pack generation
- SDE lookup build/import through explicit operator action

Implemented renderer surfaces include:

- Investigation opening view with lead type, actor/system/radius inputs, live/API context, lead feedback, and routes into existing safe paths
- Readiness view with runtime paths, SDE state, live gate state, corpus health, snapshot, and trace/debug support
- Scopes view backed by `scope.validate`
- Tasks view backed by task services
- Queue / Watches view for queue preview, manual expansion, watch schedule/status, and session arming
- Actions view for explicit manual discovery/system-radius discovery actions
- Reports / Assessment view for actor/radius reports and deliberate actor-context assessment memory

## Proven Boundaries

- Passive startup and navigation do not run live collection.
- Readiness, corpus health, queue preview, report loading, and debug trace generation are read/support surfaces.
- Manual discovery queues possible leads only; it does not create evidence.
- Manual expansion is the explicit ESI expansion step that creates stored killmail evidence.
- Metadata hydration is readability-only and must not mutate evidence.
- Assessment memory is deliberate operator memory and is not evidence.
- Watch authoring is metadata/intent; watch execution requires explicit session arming or controlled task execution.
- Evidence pruning/deletion remains blocked. Retention and compaction paths are preview/assessment-only, not destructive.
- Renderer confirmation checkboxes are presentation support only; commands with live/API, evidence, local state, runtime-control, or support-artifact effects now require registry-owned confirmation tokens at renderer IPC invocation.
- `task.cancel` is treated as runtime-control, not read-only.
- Non-retryable HTTP status responses are not retried unless explicitly listed as retryable.

## Current UI Finding

The local-alpha Human UI trial found that Atlas is mechanically much improved, but still reads too much like network/backend configuration.

Accepted presentation friction:

- abstract verbiage
- text edge handling issues in some panels
- Readiness feels like diagnostics/settings rather than primary flow
- Scopes exposes too many options too early
- queue/watch controls have visible flicker
- information density remains high
- live/API/zKill/ESI state likely needs one clearer operator-facing affordance
- the first experience should feel more like discovery and storytelling

The durable trial note is `docs/audits/audit-2026-05-24-local-alpha-human-ui-trial.md`.

## Current Lane

Treat the current renderer as a proven service shell and first-pass investigation surface, not the final product interaction model.

Next active work:

```txt
Atlas Command Authority Hardening
-> Dev
-> inspect preload/registry/service command authority
-> enforce renderer eligibility, command-owned confirmation, and effect classification where needed
```

Do not resume broad UI implementation until command/effect authority is reviewed and accepted.

## What Should Stay Secondary

These are valid and useful, but should not dominate the first operator path:

- service count
- raw IDs and hashes
- backend defaults
- queue keys
- scope-normalized payloads
- run/task IDs
- API request logs
- SDE provenance and lookup counts
- full readiness diagnostics
- destructive/retention preflight details

## Verification Shape

Primary offline verification:

```powershell
npm.cmd run verify:all
npm.cmd run smoke:electron
```

Focused renderer verification:

```powershell
npm.cmd run verify:renderer-shell
npm.cmd run smoke:electron
```

Live smoke groups exist separately and refuse to run unless `AURA_ATLAS_LIVE_API=1` is set.

## Still Deferred

- broad visual/product polish beyond a selected bounded UI slice
- final naming for Record / Intelligence / Finding / Assessment variants
- first-class region investigation
- relationship graph and fight clustering
- public packaging/distribution
- executable evidence deletion/pruning
- assessment compaction writes beyond explicit artifact creation from previews
- worker/process isolation unless measured pressure justifies it
