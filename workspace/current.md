# AURA Atlas Current Work

Status: Active audit packet - Watch recovery / offline readout
Last updated: 2026-05-25

## Active Milestone

Milestone: Watch Recovery / Offline Readout State Audit

Source of intent:

- Human direction on 2026-05-25 to focus on post-restart Watch readout as a common state.
- `workspace/OverseerHS53-runtime-record-integrity-audit.md`
- `workspace/OverseerHS54-watch-recovery-offline-readout-scope.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Current focus: verify what Atlas already exposes after restart for configured/due Watches, session armed state, block reasons, local/offline context, and display-readiness. End at state/readout audit and future material readiness, not UI implementation.

This packet is read-only audit work. It does not authorize implementation.

## Executor

Current executor: Engineering audit / Overseer review.

Expected handoff filename:

```txt
workspace/OverseerHS55-watch-recovery-offline-readout-audit.md
```

## Ordered Runway

1. Read the source-of-intent files above, then inspect relevant code paths for:
   - Watch scheduler status and due-state calculation
   - Watch executor status, arming/disarming, and `session_not_armed`
   - Watch repository persisted fields
   - Task runner volatile state
   - renderer services/surfaces that expose Watch, queue, local context, readiness, or status
   - restart recovery verification and session-armed contract coverage
2. Verify post-restart Watch state:
   - configured watches
   - due watches
   - blocked reason, especially `session_not_armed`
   - last checked / last success
   - next eligible / next poll
   - backoff / last error
   - active/inactive watch configuration
   - queued Discovery refs related to watches, if exposed
   - local Evidence/report context related to watch targets, if already available
3. Map persisted versus volatile state in a table:
   - Watch definition
   - due status
   - session armed
   - active task
   - last success/error
   - backoff
   - local queue/evidence context
4. Confirm whether existing service and renderer exposure can honestly state:

   ```txt
   Configured Watch exists.
   Schedule may be due.
   Session is unarmed because runtime restarted.
   No collection is active.
   Local context is still available.
   Operator can arm when ready.
   ```

5. Define display-readiness needs without designing the offline pane:
   - ambient posture vs explicit status/action state split
   - fields needed for future UIUX/Lab material production
   - operator-facing versus diagnostic-only state
   - missing state fields, ambiguous labels, or confusing service boundaries
6. Identify risks and gaps:
   - due state mistaken for active collection
   - unarmed state mistaken for error/broken Watch
   - local/offline context hidden when Watch is not armed
   - task runner volatility confused with lost Watch configuration
   - backoff/error state too diagnostic for first-read display
   - copy or state that implies live feed/background collection/hidden monitoring
7. Run required verification commands below.
8. Write `workspace/OverseerHS55-watch-recovery-offline-readout-audit.md` with findings, acceptance-criteria coverage, and any recommended bounded future Dev packet.

## Guardrails

- Audit only unless a later Human/Overseer packet explicitly opens implementation.
- No UI implementation.
- Do not design a complete offline pane.
- No backend changes.
- No schema/migration changes.
- No persistence changes.
- Do not persist `sessionArmed`.
- Do not start collection on startup.
- No live/private/API calls unless explicitly authorized by the Human.
- No bridge, IPC, service, payload, command, or contract renames.
- Do not treat ambient posture or packet-motion ideas as active UI scope.
- Preserve Atlas meanings for Watch, Marked, Evidence, Discovery, External API, Assessment Memory, and provenance.

## Stop Conditions

Return to Human/Overseer before continuing if:

- the audit requires live/private provider calls
- verification would mutate the user's real local database
- implementation changes appear necessary to answer the audit
- `session_not_armed` or equivalent state cannot be traced without changing code
- Watch due/armed/running/blocked meanings are ambiguous in a way that affects audit conclusions
- any path appears to start collection from app startup or passive page load

## Required Verification

Run offline checks:

```powershell
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-executor
npm.cmd run verify:restart-recovery
npm.cmd run verify:background-execution
npm.cmd run verify:live-api-gate
npm.cmd run verify:renderer-shell
npm.cmd run verify:protected-terms
git status --short --branch
```

If the audit finds cross-cutting renderer/service risk, also run:

```powershell
npm.cmd run verify:all
```

Do not run live smoke unless explicitly authorized by the Human.

## Audit Evidence

Auditor updates this section in the handoff, not necessarily in `current.md`:

```txt
Files/code paths reviewed:

Persisted vs volatile state:

Existing service/renderer exposure:

Display-readiness findings:

Missing fields / ambiguous labels:

Risks:

Verification run:
```

## Audit Handoff

Create:

```txt
workspace/OverseerHS55-watch-recovery-offline-readout-audit.md
```

Handoff must include:

- files and code paths reviewed
- persisted versus volatile state map
- post-restart Watch state findings
- service/renderer exposure findings
- local/offline context availability
- operator-facing versus diagnostic-only readout needs
- acceptance-criteria coverage from HS54
- recommended bounded Dev packet, if any
- required Human decisions
- verification commands and results
- confirmation that no implementation, live calls, collection, persistence changes, or protected-term updates were performed
