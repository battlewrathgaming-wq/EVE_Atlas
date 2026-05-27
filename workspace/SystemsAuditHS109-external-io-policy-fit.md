# Systems Audit HS109: external_io Policy Fit

Date: 2026-05-27
Role: Atlas Systems Auditor
Status: Advisory artifact only; no implementation opened

## Executive Summary

Atlas does not currently implement an `external_io` command, service, table, IPC channel, or runtime switch. Current durable direction defines `external_io` as a future provider trust-boundary family: the operator-level answer to whether Atlas may contact external/downstream providers.

That proposed policy fits cleanly over the current implementation if it is treated as a higher-level hold/release boundary, not as a rename or replacement for existing pieces.

- `External API` remains the current UI/readiness wording for live provider availability and kill-switch state.
- `live.gate` remains the implemented per-action/provider/cadence gate.
- `watch.executor.arm` remains Watch/session arming only.
- `storage.authority_preflight` remains read-only storage safety inventory, not provider authority.

The main fit risk is overloading one existing surface. `watch.executor.arm` should not become the global provider disconnect. `live.gate` should not become storage authority. Storage preflight should not become provider policy. A future `external_io` layer should aggregate or consume those signals while preserving their names and meanings.

## Files Reviewed

- `AGENTS.md`
- `workspace/current.md`
- `workspace/critical/critical-terms.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `src/main/services/appReadinessService.js`
- `src/main/services/liveApiGateService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/mutatingActionService.js`
- `src/main/services/storageAuthorityPreflightService.js`
- `src/main/watchlist/watchExecutor.js`
- `src/renderer/index.html`
- `src/renderer/investigation.js`
- `src/renderer/readiness.js`

## Current Implementation Map

### External API UI / Readiness Wording

The renderer uses `External API` as the operator-facing label in the top bar, readiness panels, and investigation source strips. `app.readiness` reports:

- `live_api.enabled`
- `live_api.state`
- `live_api.rule`
- `checks.live_api_enabled`
- `checks.user_agent_configured`

The readiness rule is currently env-driven: live zKill/ESI calls require explicit enablement through `AURA_ATLAS_LIVE_API=1`. Readiness also warns when live API is disabled while preserving local reports and local inspection as usable.

Fit with future `external_io`: good. `External API` can remain the existing UI wording while `external_io` becomes the backend/policy family. The UI wording should not be silently renamed by an implementation packet unless Human/Overseer explicitly opens that presentation decision.

### live.gate

`live.gate` is implemented as a read-only renderer-eligible service command. It classifies known actions as local-only or live-required and checks:

- explicit live API enablement
- configured User-Agent
- per-action provider list
- estimated provider calls
- manual radius rejection for live manual discovery
- duplicate active task for the same provider/action/scope fingerprint
- service-memory cooldown and lockout state

Implemented live-required actions include `manual.discovery`, `manual.expansion`, `actor.watch`, `system.radius.watch`, `metadata.hydration`, and `sde.build-lookups`.

Fit with future `external_io`: good as a subordinate gate. `live.gate` answers "is this scoped provider action allowed by current live/cadence/request-control rules?" It does not answer the broader operator trust-boundary question by itself.

### watch.executor.arm

`watch.executor.arm` is implemented as a session-level Watch executor control. It sets volatile `sessionArmed=true`, starts the interval, and immediately calls `tick()`. The tick then blocks or dispatches based on:

- session armed state
- active task state
- live API enabled state
- due Watch schedule
- `live.gate` for the selected Watch dispatch command

It dispatches at most one due Watch task. It is correctly Watch-specific and runtime/session-specific.

Fit with future `external_io`: good if `external_io` is consumed at dispatch time. Arming may remain a Watch/session intent, while provider movement should be held when external I/O is off, storage is unsafe, or cadence blocks apply. The name and meaning of `watch.executor.arm` should not expand into a global provider on/off switch.

### Storage Authority Preflight

`storage.authority_preflight` is implemented as a read-only storage inventory command. It reports:

- active DB path/source/mode/flags
- DB/WAL/SHM existence and bytes
- snapshot settings and destination
- trace-pack output path
- temp/cache/SDE cache paths
- window settings exposure
- known Atlas-controlled byte usage

Its boundary explicitly says it does not write storage config, move/copy/relocate/create/delete the active DB, enforce lockout, prune, call live providers, change schema, redesign renderer UI, or migrate storage.

Fit with future `external_io`: good as an independent storage-safety signal. It should not become provider authority, but a future provider-backed action should be able to be blocked by storage lockout once storage enforcement exists.

## Accepted Direction Map

Durable docs and critical terms already capture the intended hierarchy:

- `external_io` is future Atlas provider trust-boundary family for whether Atlas may contact external/downstream providers.
- `External API` is current Atlas label for zKill/ESI/live provider availability and kill-switch state.
- `watch.executor.arm` remains Watch/session arming only.
- `live.gate` remains per-action/provider/cadence control.
- storage authority remains storage safety.
- Provider-backed movement should pass all relevant gates: future `external_io`, `live.gate`, storage safety, cadence, explicit confirmation where needed, and Watch arming when Watch-driven.

External I/O off / local mode is accepted to allow local reports, stored Evidence/EVEidence views, Observation from local records, Assessment notes, queue/readiness/storage/retention preflights, and other read-only local support. It should block zKill Discovery, ESI Evidence expansion, ESI metadata hydration, SDE download, and Watch provider dispatch.

## Fit Findings

1. `external_io` fits best as a policy family above existing gates.

It should decide whether provider movement is globally permitted, held, or local-only. It should not duplicate all per-action scope/cadence logic already in `live.gate`.

2. Existing command/effect metadata already provides a useful starting map.

`serviceRegistry.js` marks provider-backed commands with `EXTERNAL_LIVE_API`. That gives a natural inventory for future `external_io` coverage without renaming commands.

3. Current local-only behavior already matches the desired external-I/O-off posture.

Reports, queue previews, readiness, storage preflight, Watch schedule/readout, Assessment reads, and local corpus health are read-only/local surfaces. Existing UI copy repeatedly states that page load and stored-context inspection do not call zKill, ESI, hydrate metadata, create evidence, assess, or run watches.

4. `watch.executor.arm` can remain valid while external provider dispatch is blocked.

The current executor already separates arming from dispatch outcome: an arm can result in a blocked tick when live API is disabled. A future `external_io` hold can follow the same pattern, provided the readout is honest and does not present waiting/held as failure.

5. Storage authority should remain parallel, not nested inside provider policy.

Storage safety and provider permission are different questions. Future dispatch should require both, but neither should rename the other.

## Gaps / Risks

- No implemented `external_io` state, service command, command family, persisted setting, IPC surface, verifier, or readout exists today.
- `AURA_ATLAS_LIVE_API=1` is still the implemented live-provider switch. It is explicit, but it is env/runtime state, not a durable operator trust-boundary policy.
- `live.gate` request-control state is service-memory-only. It does not survive restart and should not be mistaken for durable external I/O policy.
- `watch.executor.arm` currently includes `EXTERNAL_LIVE_API` and `EVIDENCE_CREATION` effects because arming may dispatch a due Watch. That is accurate, but a future UI must explain the distinction between "armed" and "provider movement allowed."
- Storage authority preflight is read-only diagnostic only. It does not yet enforce missing-storage lockout, budget warnings, or write/acquisition hard-lock.
- `metadata.hydration` is live-gated, but `runMetadataHydrationService` calls `assertLiveAllowed` with `requestControl:false`, so it does not currently record accepted hydration attempts into the live-gate cooldown ledger. Future Hydration Recovery policy should decide whether hydration cadence belongs in `live.gate`, a separate hydration lane, or both.
- Typed actor name resolution remains a known local-lookup boundary concern from earlier audit work: it can use ESI when live API is enabled and the actor is not cached. That should be covered by future `external_io` if provider contact is involved.
- If future code treats `external_io` as a broad provider queue, it may violate current guardrails against broad provider queues, persisted sequencer packet tables, or high-volume attempt ledgers unless a bounded packet explicitly opens that work.

## Smallest Safe Next Packet

No implementation packet is required by this audit alone.

If Human/Overseer opens Dev work, the smallest safe packet would be a read-only `external_io` readiness/preflight proof, not a dispatcher or queue:

- inventory commands/effects that would be blocked by external I/O off
- report current `External API` env/User-Agent state
- include `live.gate` summary for known provider actions
- include storage authority preflight status as a separate storage-safety input
- include Watch executor state as session arming/dispatch posture
- clearly state local surfaces that remain available
- make no provider calls
- make no schema changes
- add no persisted queue or sequencer packet table
- do not rename `External API`, `live.gate`, `watch.executor.arm`, or storage authority terms

This packet should prove the policy readout before any enforcement packet.

## Verification Suggestions

Relevant existing verification commands for a future packet:

```powershell
npm.cmd run verify:app-readiness
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:watch-executor
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:task-concurrency
npm.cmd run verify:db-integrity
npm.cmd run verify:protected-terms
```

Useful future proof-specific checks:

- `external_io` off reports provider-backed commands as held while local report/readiness/preflight commands remain available.
- Watch arming state is reported separately from provider movement allowance.
- `live.gate` still blocks live-required actions without `AURA_ATLAS_LIVE_API=1`.
- storage authority preflight remains read-only and does not become provider policy.
- renderer startup remains passive and makes no zKill, ESI, SDE download, hydration, evidence creation, assessment creation, or Watch dispatch call.

## Human / Overseer Decisions Needed

- Should future `external_io` be an operator-facing mode, a backend command family, or both?
- Should `External API` remain the UI phrase when `external_io` exists, or should Lab later translate it while preserving provider-permission meaning?
- When external I/O is off, should Watch arming still be allowed with dispatch held, or should arming itself be blocked? Current accepted hierarchy favors keeping arming separate and holding provider movement.
- Should storage lockout feed an aggregated external I/O/readiness display, or remain visibly parallel as storage safety?
- Should hydration cadence be handled by `live.gate`, a Hydration Recovery lane, or a hybrid policy?

## Boundary Confirmation

This artifact treats `external_io` as proposed future provider trust-boundary policy only. It does not assume implementation.

No code, schema, docs outside this artifact, runtime behavior, provider behavior, storage behavior, Watch behavior, renderer behavior, or terminology was changed.
