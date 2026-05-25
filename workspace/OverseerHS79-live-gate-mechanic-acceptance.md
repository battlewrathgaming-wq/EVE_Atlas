# OverseerHS79 - Live Gate Mechanic Acceptance

Date: 2026-05-26
Role: Atlas Overseer
Status: first-pass gate mechanic accepted

## Decision

Accept the first-pass Live provider gate mechanic.

This is accepted as a practical implementation constraint for the next bounded Dev packet. It does not authorize live provider calls during verification and does not change Evidence, Discovery Queue, local hydration, Watch, or Sequencer doctrine.

## Accepted Gate Principles

- Cooldown is normal endpoint pacing.
- Lockout is rare abuse protection.
- Cooldown is not failure.
- Lockout is not Evidence state.
- Provider wait is not ref failure.
- Radius rejected from Live is a product boundary, not provider failure.
- Local cache/report work never consumes cooldown.
- Watch / Sequencer waiting must not be treated as Live abuse.

## Cooldown Triggers

Create cooldown after any accepted Live provider attempt reaches the point where Atlas would call or did call a provider.

Includes:

- successful zKill discovery
- zKill discovery returning no refs
- provider retry/capacity response after attempted call
- cancelled Live search after provider attempt started
- failed provider attempt not caused by invalid local parameters

Does not include:

- invalid scope rejected before provider work
- missing confirmation
- live API disabled
- missing User-Agent
- radius attempt rejected before provider work

## Lockout Triggers

Create lockout only after repeated blocked or abusive behavior.

First-pass lockout triggers:

- same fingerprint attempted repeatedly while still on cooldown
- repeated Live radius attempts after clear rejection
- repeated attempts while provider retry/capacity wait is active
- repeated rapid manual presses for the same target/provider/action

Do not lock out:

- first mistake
- zKill returning no refs
- ESI expansion finding cached Evidence
- first invalid scope
- first rejected radius attempt
- passive page refresh
- preflight checks
- Watch / Sequencer waiting
- local report/cache checks
- failed provider response by itself

Provider retry/capacity signal creates wait/cooldown. It counts as abuse only if the operator keeps trying before the wait expires.

## Lockout Scope

Lockout scope is per:

```txt
provider + action + scope_fingerprint
```

Not global.

Examples:

```txt
manual.discovery:zkill:actor:character:123:lookback86400:maxRefs20
manual.discovery:zkill:system:30000142:lookback86400:maxRefs20
manual.expansion:esi:killmail:123456789
live.radius_rejected:<centerSystemId>:radius:<N>
```

## First-Pass Durations

- Live zKill cooldown: 2 minutes per fingerprint.
- Live ESI expansion cooldown: 5 minutes per killmail/ref or expansion fingerprint.
- Provider Retry-After: use provider value when present, minimum 2 minutes.
- Abuse lockout: 15 minutes after 3 blocked repeats inside 10 minutes.
- Running duplicate: block as `already_running`; do not immediately lock out.

Do not start with hour-long lockouts.

## Live Search Readout

Live search should not enter long-running waiting state in the first pass.

If Live cannot run now, block and return:

- `blocked: cooldown_active`
- `next_eligible_at`
- `remaining_seconds`
- `scope_fingerprint`

If a provider call already started and returns Retry-After, the current task may report `waiting_for_provider_capacity`; new Live attempts should block with next eligible time.

## Live And Watch Separation

- Live cooldown/lockout = immediate action protection.
- Watch / Sequencer wait = planned paced acquisition.
- Watch / Sequencer may wait patiently and resume.
- Live should usually block and show next eligible time.
- Live cooldowns must not globally pause Watch.
- Watch waits must not globally lock out Live.

They may share provider capacity signals later, but first pass keeps state separate unless the same exact provider/action/fingerprint is involved.

## Gate Order

1. Validate action kind.
2. Reject Live radius.
3. Validate scope/caps/lookback.
4. Check live API/User-Agent gate.
5. Compute fingerprint.
6. Check already running.
7. Check active lockout.
8. Check active cooldown/provider wait.
9. Require confirmation.
10. Run provider action.
11. Record cooldown/result.
12. Increment abuse counter only on repeated blocked attempts.

## Minimum State

Minimum useful state:

- `fingerprint`
- `provider`
- `action`
- `target_type`
- `target_id`
- `lookback_seconds`
- `cap_summary`
- `last_attempt_at`
- `next_eligible_at`
- `cooldown_reason`
- `lockout_until`
- `blocked_attempt_count`
- `last_blocked_reason`

Persistence across restart is the real product target. If persistence is too much for the first Dev packet, start with a service-level diagnostic and tests, but document the persistence gap.

## Boundaries

- Do not touch stale/expired Discovery ref mutation.
- Do not change `discovered_killmail_refs` schema.
- Do not make `discovered_killmail_refs` the sequencer.
- Do not apply the gate to local hydration.
- Do not run live/API calls in verification.
