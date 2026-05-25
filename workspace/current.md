# AURA Atlas Current Work

Status: Active Dev runway opened
Last updated: 2026-05-26

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS79 is a bounded Live provider gate and Watch / Sequencer diagnostic packet. Atlas should implement the first-pass request-control guardrails: request fingerprints, Live cooldown/lockout checks, Live radius rejection, and a Watch / Sequencer planning diagnostic, without broad queue architecture, stale/expired ref mutation, live calls in verification, or Discovery/Evidence boundary changes.

Source of intent:

- Human advisory on 2026-05-26: do not implement a broad provider work queue yet; use a small Watch / Sequencer request-control layer.
- Human advisory on 2026-05-26: Live search is immediate and narrow; Watch / Sequencer is patient and powerful.
- Human advisory on 2026-05-26: radius belongs to Watch / Sequencer, not Live search.
- Human gate recommendation on 2026-05-26: cooldown is normal pacing; lockout is rare abuse protection.
- Human gate recommendation on 2026-05-26: lockout is per provider + action + scope fingerprint, not global.
- Human gate recommendation on 2026-05-26: Live search should block with next eligible time rather than wait long-running.
- Human gate recommendation on 2026-05-26: Live cooldowns must not pause Watch globally, and Watch waits must not globally lock out Live.
- `workspace/OverseerHS79-live-gate-mechanic-acceptance.md`
- `workspace/OverseerHS78-request-control-sequencer-advisory-review.md`
- `workspace/OverseerHS77-queue-systems-design-advisory-request.md`
- `workspace/OverseerHS76-queue-stale-expiration-design-input.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-manual-discovery-lane.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Accepted baseline:

- A queued ref is Discovery/provenance, not Evidence.
- `discovered_killmail_refs` remains the returned-ref Discovery queue, not the request-control sequencer.
- Live search is direct provider-style lookup: no radius, short lookback, low caps, cooldown, abuse lockout.
- Watch / Sequencer is Atlas-engineered scoped acquisition over time: radius, longer lookbacks, paced packets, separate zKill/ESI capacity, and waiting as valid behavior.
- Waiting/capacity deferral must not mark refs failed.
- ESI failure should mark a ref failed only after an actual ESI attempt fails outside retry/capacity handling.
- Local hydration remains readability/label metadata work and is outside request-control policy.
- Stale/expired Discovery ref mutation is deferred.
- Cooldown is endpoint pacing, not punishment.
- Lockout is rare and scoped per provider + action + fingerprint.

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS79-live-gate-sequencer-diagnostic.md
```

## Ordered Runway

1. Read the source of intent and trace current Live/manual discovery, Watch, live API gate, scope validation, and provider-call paths.
2. Add or refine request fingerprint generation for Live/manual/Watch scopes. Fingerprints must include enough provider/action/scope detail to support per-fingerprint cooldown and lockout.
3. Add first-pass Live gate behavior:
   - reject radius before provider work
   - validate scope/caps/lookback before provider work
   - preserve existing live API/User-Agent gate behavior
   - compute fingerprint
   - block already-running duplicate attempts as `already_running`
   - block active cooldown/provider wait with `cooldown_active`, `next_eligible_at`, `remaining_seconds`, and `scope_fingerprint`
   - lock out only after repeated blocked/abusive attempts under the accepted rule
4. Use accepted first-pass defaults:
   - Live zKill cooldown: 2 minutes per fingerprint
   - Live ESI expansion cooldown: 5 minutes per killmail/ref or expansion fingerprint
   - Provider Retry-After: provider value when present, minimum 2 minutes
   - Abuse lockout: 15 minutes after 3 blocked repeats inside 10 minutes
   - running duplicate: block as `already_running`, no immediate lockout
5. Add Watch / Sequencer diagnostic output showing planned packets for radius/lookback, caps, and wait/capacity state. Watch radius must remain allowed.
6. Ensure waiting/capacity deferral does not mark refs failed, does not create Evidence, and does not become terminal failure.
7. Keep `discovered_killmail_refs` schema unchanged and do not implement stale/expired refs.
8. If persistence for gate state is small and fits existing local settings/service patterns, implement it. If not, provide service-level diagnostic behavior and document the persistence gap in the handoff.
9. Update current-state docs only where accepted behavior changes.
10. Update this file Evidence / Dev Handoff sections and create the expected DevHS79 handoff.

## Guardrails And Non-Goals

- No broad provider work queue framework.
- No live/private/API calls in verification.
- No stale/expired Discovery ref mutation.
- No `discovered_killmail_refs` schema change.
- No production deletion execution.
- No retention/deletion policy changes.
- No snapshot, restore, active DB relocation, or storage-budget expansion.
- No UI redesign or renderer presentation work.
- No local hydration changes.
- No direct Live search radius.
- Do not make `discovered_killmail_refs` the sequencer.
- Do not treat queued refs as Evidence.
- Do not treat failed/partial provider results as stored Evidence.
- Do not treat waiting as failure.
- Do not apply Live cooldowns globally to Watch.
- Do not apply Watch waits globally to Live.

## Stop Conditions

Stop and return to Overseer/Human before implementation if:

- implementation requires live provider access
- implementation requires schema migration
- implementation would blur Discovery with Evidence
- implementation would apply request-control policy to local hydration
- implementation would make Live search a radius or large-envelope acquisition path
- implementation would add broad background provider orchestration
- implementation would require new user-facing doctrine or presentation decisions
- protected-term warnings suggest a new authority decision is required

## Required Verification

Run the focused set first:

```powershell
npm.cmd run verify:live-api-gate
npm.cmd run verify:scope-controls
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-executor
npm.cmd run verify:manual-discovery
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-scope-isolation
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:hydration
npm.cmd run verify:db-integrity
```

Add focused verifier expectations for:

- Live search rejects radius before provider work.
- Same Live fingerprint enters cooldown after an accepted provider-attempt point.
- Repeated blocked attempts create lockout after 3 blocked repeats inside 10 minutes.
- Running duplicate blocks as `already_running`.
- Watch radius remains allowed.
- Watch / Sequencer diagnostic shows packet count, caps, and wait state.
- Waiting/capacity state does not mark refs failed.
- ESI retryable capacity does not create Evidence or terminal failure.
- Local hydration does not consume cooldown or lockout.

If service registry, main/preload, shared command behavior, migrations, or broad verification helpers change, also run:

```powershell
npm.cmd run verify:service-registry
npm.cmd run verify:migrations
npm.cmd run verify:all
```

Run warning-only terminology discovery if the packet touches terminology, bridge/display wording, protected terms, critical assets, or release/push readiness:

```powershell
npm.cmd run verify:protected-terms
```

Finish with:

```powershell
git status --short --branch
```

## Evidence

HS79 runway opened by Overseer.

Opening evidence:

- Previous git state was clean and synced with `origin/main`.
- HS78 request-control/sequencer advisory is accepted.
- First-pass Live gate mechanic is accepted in `workspace/OverseerHS79-live-gate-mechanic-acceptance.md`.
- No implementation was performed while opening HS79.
- No live calls, stale/expired mutation, schema migration, deletion execution, snapshot cleanup, restore, active DB relocation, local hydration change, or UI work were opened.
- `npm.cmd run verify:protected-terms` passed with exit code 0, warning-only.
- Protected-term discovery ran in working-set mode against 3 files.
- Warning count: 104.
- Warning classes: cross-project-borrowing 12, lab-quarantine-borrowing 65, atlas-candidate 27.
- `git diff --check` passed.

To be completed by Dev after implementation:

- files reviewed
- files changed
- request fingerprint model
- Live gate behavior implemented or diagnostic-only fallback if persistence is deferred
- cooldown/lockout behavior and defaults
- Live radius rejection proof
- Watch / Sequencer diagnostic behavior
- waiting/capacity behavior
- hydration boundary confirmation
- whether gate state persists across restart, or documented persistence gap
- commands run and results
- confirmation that no live calls, stale/expired mutation, Discovery ref schema change, deletion execution, local hydration change, broad UI work, or terminology rename occurred

## Dev Handoff

Dev should create:

```txt
workspace/DevHS79-live-gate-sequencer-diagnostic.md
```

The handoff must summarize what was implemented, what remains diagnostic/deferred, verification results, and any remaining request-control risks.
