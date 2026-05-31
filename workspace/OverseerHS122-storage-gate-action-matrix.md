# OverseerHS122 - Storage Gate Action Matrix

Status: accepted shaping artifact
Date: 2026-05-31
Role: Overseer

## Request Answered

Human accepted the local-first hardening seam and asked Atlas to proceed where Human input is not needed.

This artifact shapes the next storage/runtime hardening decision without opening Dev work.

## Governing Rule

Atlas should always ask:

```text
Can local memory answer this safely?
```

Only if local state cannot answer, and only if storage and provider gates allow movement, should Atlas move outward.

This keeps Atlas:

- local-first
- respectful of provider APIs
- honest about storage trust
- clear about operator-facing basis

## Layered Gate Principle

Storage posture should not be treated as one blunt on/off switch.

Atlas actions should be classified by what they risk:

- local read risk
- local write risk
- provider movement risk
- support/snapshot risk
- destructive/pruning risk

Cheap local inspection should remain available whenever the local DB can be opened safely.

Provider-backed work should require both:

- storage posture good enough for the expected write/result
- provider gate posture good enough for the call

Destructive or protective work should require the strongest storage posture and explicit basis/readout.

## Storage States

### configured_storage_ready

Meaning:

```text
Atlas has an explicit configured storage location and it is available, writable, and within budget.
```

Expected behavior:

- local reads allowed
- local writes allowed
- Discovery allowed if provider gates allow
- ESI Evidence expansion allowed if provider gates allow
- metadata hydration allowed if provider gates allow
- snapshots/support artifacts allowed if destination/budget allow
- pruning/deletion may proceed only through explicit future preflight and accepted runway

Operator basis:

```text
storage ready
```

### no_storage_selected

Meaning:

```text
The operator has not selected an explicit Atlas storage location.
```

Expected behavior:

- setup/config surface allowed
- demo/fixture activity allowed only if clearly labeled
- local reads allowed only if an existing safe local DB is already available
- local writes blocked
- Discovery blocked
- ESI Evidence expansion blocked
- metadata hydration writes blocked
- snapshots/support artifact writes blocked
- pruning/deletion blocked

Operator basis:

```text
storage setup required
```

### current_file_fallback_unacknowledged

Meaning:

```text
Atlas can use an app-local/current-file fallback, but the operator has not acknowledged that Atlas will write there.
```

Expected behavior:

- local reads allowed if DB can be opened safely
- setup/config surface allowed
- local writes blocked until acknowledgement
- provider-backed movement blocked because returned data would need trusted writes
- demo/fixture activity allowed only if clearly labeled
- snapshots/support artifact writes blocked unless separately configured
- pruning/deletion blocked

Operator basis:

```text
fallback storage available; acknowledgement required
```

### demo_fixture_mode

Meaning:

```text
Atlas is operating against known fixture/demo data rather than real operator storage.
```

Expected behavior:

- fixture local reads allowed
- fixture reports allowed
- fixture-only writes allowed only inside disposable/demo paths
- provider calls blocked unless an explicit live/API runway authorizes them
- Evidence/EVEidence writes to real storage blocked
- pruning/deletion against real storage blocked
- support artifacts must disclose demo basis

Operator basis:

```text
demo/fixture mode
```

### configured_storage_missing_unavailable

Meaning:

```text
The selected storage location is missing, disconnected, unreadable, or unavailable.
```

Expected behavior:

- setup/re-establish flow allowed
- local reads allowed only if an already-open safe DB handle exists and does not require new writes
- new local writes blocked
- Discovery blocked
- ESI Evidence expansion blocked
- metadata hydration writes blocked
- snapshots/support artifact writes blocked unless an alternate support destination is already valid
- pruning/deletion blocked

Operator basis:

```text
configured storage unavailable
```

### configured_storage_invalid_degraded

Meaning:

```text
The selected storage exists but fails validation, has unexpected structure, has permission problems, or is otherwise degraded.
```

Expected behavior:

- setup/repair surface allowed
- local reads allowed only where validation says read-only inspection is safe
- local writes blocked
- provider-backed writes blocked
- snapshots/support artifact writes blocked unless destination independently validates
- pruning/deletion blocked

Operator basis:

```text
storage degraded; read-only inspection only
```

### budget_warning

Meaning:

```text
Atlas storage is approaching the accepted budget threshold.
```

Expected behavior:

- local reads allowed
- local writes allowed
- provider movement allowed if provider gates allow
- snapshots/support artifacts allowed if projected size remains safe
- operator should see prune/storage reminder
- no automatic pruning

Operator basis:

```text
storage budget warning
```

### budget_strong_warning

Meaning:

```text
Atlas storage is near the hard-lock threshold.
```

Expected behavior:

- local reads allowed
- small local writes allowed only if projected safe
- Discovery may be allowed only if resulting refs and expected follow-on writes stay under safety limits
- ESI Evidence expansion should require projected write safety
- metadata hydration should be conservative and prioritize active view only
- snapshots/support artifacts require projected size check
- pruning preflight/readout allowed
- no automatic pruning

Operator basis:

```text
storage budget strong warning
```

### budget_hard_lock_full

Meaning:

```text
Atlas storage is at or beyond the hard-lock threshold, or projected write would exceed accepted budget.
```

Expected behavior:

- local reads allowed if DB can be opened safely
- setup/config/budget expansion surface allowed
- pruning preflight/readout allowed
- deletion/pruning execution remains blocked unless a future accepted runway explicitly permits safe execution under hard-lock
- all new local writes blocked
- Discovery blocked
- ESI Evidence expansion blocked
- metadata hydration writes blocked
- snapshots/support artifact writes blocked unless writing to an independently valid emergency/export destination is explicitly accepted later

Operator basis:

```text
storage hard-lock; expand budget or prune
```

## Action Matrix

| Action class | Ready | No storage | Fallback unack | Demo | Missing | Degraded | Warning | Strong warning | Hard-lock |
|---|---|---|---|---|---|---|---|---|---|
| Setup/config changes | allow | allow | allow | allow | allow | allow | allow | allow | allow |
| Local DB inspection | allow | conditional | allow | fixture only | conditional | read-only only | allow | allow | allow if safe |
| Local reports/Observation | allow | conditional | allow if safe | fixture only | conditional | degraded/read-only | allow | allow | allow if safe |
| Assessment writing | allow | block | block | fixture only | block | block | allow | conditional | block |
| zKill Discovery | provider-gated | block | block | block | block | block | provider-gated | conditional | block |
| ESI Evidence expansion | provider-gated | block | block | block | block | block | provider-gated | conditional | block |
| Fast/view metadata hydration | provider-gated | block writes | block writes | fixture only | block writes | block writes | provider-gated | active-view only | block writes |
| Background hydration | provider-gated | block | block | block | block | block | provider-gated | defer by default | block |
| Snapshot/support artifact write | allow if destination safe | block | block | fixture/disposable only | conditional alternate | conditional alternate | allow if projected safe | conditional | block |
| Pruning/deletion preflight | allow | block | block | fixture only | block | read-only only | allow | allow | allow readout |
| Pruning/deletion execution | future runway only | block | block | fixture only | block | block | future runway only | future runway only | future runway only |

## Conditional Rules

Conditional local reads mean:

- a DB exists
- it can be opened safely
- Atlas does not need to write recovery state to inspect it
- the readout clearly discloses degraded or fallback basis

Conditional provider movement under strong warning means:

- local inspection has already proven the provider call is necessary
- projected write size is safe
- provider gates allow movement
- the operator can see why Atlas is moving outward
- the action does not imply broad catch-up or hydrate-all behavior

Conditional snapshot/support writes mean:

- destination is independently valid
- projected size is within budget
- the write does not silently use an unavailable/degraded storage root
- the operator sees the destination basis

## Basis Readout Requirements

Every action-class decision should be able to explain:

- storage state
- local state already inspected
- provider movement required or not required
- write destination and budget posture
- block/hold reason if blocked
- whether result is local, fixture, provider-backed, degraded, or read-only

Candidate status phrases:

- `storage_ready`
- `storage_setup_required`
- `fallback_acknowledgement_required`
- `demo_fixture_only`
- `storage_unavailable`
- `storage_degraded`
- `budget_warning`
- `budget_strong_warning`
- `storage_hard_lock`
- `local_answer_available`
- `provider_movement_required`
- `write_blocked_by_storage`
- `write_blocked_by_budget`

## Guardrails

- This artifact does not authorize Dev work.
- This artifact does not enforce storage policy.
- This artifact does not define final UI copy.
- This artifact does not create schema, IPC, bridge, service, or provider changes.
- This artifact does not authorize pruning/deletion execution.
- This artifact does not authorize live/API/provider calls.
- This artifact does not rename Atlas terms.
- `workspace/current.md` remains the only Dev runway.

## Next Packet Candidate

If Human/Overseer accepts this matrix, the smallest Dev packet should be:

```text
storage.setup_gate_readout action-class matrix proof
```

That packet should update the existing read-only storage setup/gate readout so it can report action-class posture from current storage facts.

It should not enforce lockout yet.

Expected proof direction:

- fixture-only
- no provider calls
- no real storage migration
- no deletion/pruning execution
- no schema changes unless already required by existing verifier shape
- sample output proving each storage state maps to action classes and basis readout

## Disposition

Accepted as Overseer shaping material.

No Dev runway opened.
