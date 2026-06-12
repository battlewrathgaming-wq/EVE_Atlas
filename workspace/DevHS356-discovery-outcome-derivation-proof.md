# DevHS356 - Discovery Outcome Derivation Proof

Status: complete
Date: 2026-06-07
Role: Dev
Milestone: Atlas Storage And Runtime Hardening

## Summary

Implemented the read-only/local-only Discovery outcome derivation proof:

```txt
discovery.outcome_derivation.preview
```

The proof derives coarse Discovery outcome posture from existing local rows only. It does not call providers, create rows, mutate Watch posture, create task/packet schema, or claim product-grade packet completion.

## Files Changed

- `package.json`
- `src/main/services/discoveryOutcomeDerivationService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-discovery-outcome-derivation.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `workspace/current.md`
- `workspace/DevHS356-discovery-outcome-derivation-proof.md`

## Command / Service Shape

Added service registry command:

```txt
discovery.outcome_derivation.preview
```

Command posture:

- classification: `read-only`
- renderer eligible: yes
- provider calls: `0`
- live/API calls: `0`
- Watch execution: false
- Watch dispatches: `0`
- collectors called: false
- TaskRunner methods called: none
- tasks created: `0`
- queue / dispatcher / leases created: no
- task/packet schema created: false
- Discovery refs written/mutated: `0`
- Evidence/EVEidence writes: `0`
- Hydration/metadata writes: `0`
- API log/warning writes: `0`
- Watch mutations: `0`
- schema changes: `0`
- runtime enforcement active: false

## Derived Output Shape

The preview returns:

- source intent kind where derivable
- source ID / Watch ID / run ID where derivable
- approximate scope key where derivable
- task-level derived outcome candidate
- task-level confidence
- packet-level derivability summary
- discovered ref count
- sampled candidate ref handles
- zKill API call count
- ESI API call count as non-Discovery context
- warning/error summary
- missing-basis flags
- explicit boundary flags

Accepted outcome vocabulary emitted:

```txt
complete_refs_found
complete_no_refs
partial_deferred
provider_deferred
held_by_external_io
acquisition_capped
failed_retryable
failed_terminal
```

`invalid_scope` is not emitted as a Discovery outcome.

## Required Cases Covered

Focused verifier covers:

- actor-like run with refs found: derives `complete_refs_found` at medium task confidence.
- actor-like run with no refs: derives coarse `complete_no_refs` and flags missing no-ref packet memory.
- system/radius run with refs found for some systems: derives coarse `complete_refs_found` at low confidence and flags missing packet completion rows.
- provider deferred posture: derives `provider_deferred` at low confidence from zKill/Discovery deferral basis.
- cap/limit posture: derives `acquisition_capped` and flags `cap_basis_summary_only`.
- ESI expansion success/failure: surfaced as non-Discovery context and flagged `esi_expansion_not_discovery_completion`.
- no durable packet rows: reports `packet_rows_present: false` and `product_grade_packet_outcomes_derivable: false`.

## Sample Output

Focused verifier sample:

```json
{
  "summary": {
    "run_count": 3,
    "outcome_counts": {
      "complete_refs_found": 3
    },
    "packet_completion_product_grade_derivable": false,
    "missing_basis_flags": [
      "packet_outcome_not_proven",
      "candidate_refs_are_not_task_memory",
      "system_radius_no_per_packet_completion_rows",
      "esi_expansion_not_discovery_completion"
    ]
  },
  "packet_level_derivability": {
    "packet_rows_present": false,
    "product_grade_packet_outcomes_derivable": false,
    "missing_basis_flags": [
      "packet_outcome_not_proven",
      "no_ref_not_represented",
      "candidate_refs_are_not_task_memory"
    ]
  }
}
```

System/radius sample row:

```json
{
  "run_id": "run_system_partial",
  "source_intent_kind": "system_radius_watch",
  "approximate_scope_key": "system_radius:30003597",
  "task_level_derived_outcome": "complete_refs_found",
  "task_level_confidence": "low",
  "discovered_ref_count": 2,
  "zkill_api_call_count": 4,
  "esi_api_call_count": 0,
  "missing_basis_flags": [
    "packet_outcome_not_proven",
    "candidate_refs_are_not_task_memory",
    "system_radius_no_per_packet_completion_rows"
  ]
}
```

## Boundary Evidence

The proof keeps these distinctions explicit:

- `discovered_killmail_refs` remains candidate-ref memory, not Discovery task/packet memory.
- ESI Expansion is outside Discovery completion.
- Discovery completion is not Evidence/EVEidence completion.
- Discovery completion is not Hydration, Observation, or Assessment completion.
- External I/O held posture can be shown only as posture, not as durable Discovery task outcome.
- Acquisition caps are summary-supported only unless a future packet/task basis is accepted.

## Verification

Passed:

- `node --check src\main\services\discoveryOutcomeDerivationService.js`
- `node --check scripts\verify-discovery-outcome-derivation.js`
- `node --check src\main\services\serviceRegistry.js`
- `node --check scripts\verify-service-registry.js`
- `node --check scripts\verify-command-authority.js`
- `node --check scripts\verify-passive-side-effects.js`
- `node --check src\main\services\enforcementDryRunService.js`
- `npm.cmd run verify:discovery-outcome-derivation`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:enforcement-dry-run`

Notes:

- `npm.cmd run verify:enforcement-dry-run` passed with coverage complete for 103 commands.
- Final protected-term, diff hygiene, and git status checks were run after this handoff was written and recorded in `workspace/current.md`.

## Outcome

HS356 is complete. Atlas can now show what Discovery outcome posture is derivable today, while explicitly proving the current gap:

```txt
coarse run/ref posture is derivable
product-grade per-packet Discovery completion is not derivable from current rows
```

## Risks / Follow-Up

- The proof is non-authorizing and must not drive Watch schedule advancement.
- It does not create durable Discovery task or packet rows.
- System/radius packet completion remains a real future design gap.
- ESI context is visible only to prevent boundary confusion; it is not Discovery completion.

Recommended next action: Overseer review HS356 and decide whether to shape a future durable Discovery task/packet model, a non-durable completion receipt proof, or a Manual/User-driven Discovery alignment pass.
