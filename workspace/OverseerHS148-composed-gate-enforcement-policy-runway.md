# OverseerHS148 - Composed Gate Enforcement Policy Runway

Status: active Dev runway
Date: 2026-06-01
Role: Overseer

## Source Of Intent

Human selected composed gate enforcement design as the next memory-lane/storage-runtime hardening seam.

Accepted security context:

- `workspace/SecuritySafetyAuditHS140-enforcement-classification-posture.md`
- `workspace/OverseerHS141-security-audit-hs140-review.md`
- `workspace/OverseerHS143-hs142-external-io-held-state-review.md`
- `workspace/OverseerHS147-hs146-support-artifact-path-authority-review.md`
- `docs/current-state/current-storage-runtime-hardening.md`

Accepted warnings:

- Do not use `would_allow` as runtime authorization.
- Runtime enforcement needs composed gate state, not one storage/action flag.
- Confirmation tokens are UX/operator-friction metadata, not security secrets or authorization authority.
- Fixture/proof commands must remain non-renderer, trusted-context only, and excluded from production enforcement surfaces.
- Unknown/unclassified commands should fail closed in future runtime enforcement unless deliberately exempted.
- `setup_config_changes` is too broad for future blocking policy and should split before enforcement.
- Support artifacts, snapshots, trace packs, retention previews, provider calls, Evidence writes, Hydration writes, local SDE imports, runtime control, and fixture-only commands are separate risk classes.

## Goal

Add a read-only composed gate policy preview.

This packet should define and prove the shape of future runtime enforcement composition without intercepting, blocking, executing, or authorizing commands.

The preview should answer:

```text
If Atlas enforced later, which gates would need to pass for each representative command class?
```

It should not answer:

```text
May this command run now?
```

## Expected Command / Readout

Likely command:

```text
storage.composed_gate_policy.preview
```

The readout should compose available posture from existing sources where possible:

- service command metadata
- enforcement dry-run command/effect coverage
- storage setup/action matrix
- External I/O held-state/gate-stack readout
- support artifact path authority preview
- live/API gate metadata where available
- Watch arming / active task / confirmation posture where available

## Required Shape

For representative command/effect families, report:

- command or representative class
- effects/classification basis
- future gate requirements, such as:
  - service command classified
  - renderer eligibility
  - storage authority
  - storage budget posture
  - External I/O
  - live/provider gate
  - cadence/rate safety
  - Watch arming, if Watch-driven
  - active task / duplicate prevention
  - confirmation UX, if required
  - destination/path authority
  - trusted context / fixture-only exclusion
- composed state terminology: `pass`, `hold`, `block`, `conditional`, `not_applicable`, `unknown`
- important reason codes
- whether unknown/unclassified command should fail closed in future enforcement
- explicit statement that enforcement remains inactive

Representative families should include at least:

- local read/report/preflight
- Assessment/Watch local metadata writes
- zKill Discovery
- ESI Evidence/EVEidence expansion
- Hydration writes
- SDE local import/rewrite vs SDE download/build
- runtime snapshot creation
- trace-pack creation
- pruning/deletion preflight
- pruning/deletion execution
- runtime control / task cancellation
- fixture-only proof commands
- unknown/unclassified command example

## Ordered Steps

1. Inspect service registry, enforcement dry-run, storage setup gate/action matrix, gate-stack readout, support artifact path authority preview, live gate, task/watch command metadata, and existing verification.
2. Add a read-only composed gate policy preview command/readout.
3. Keep `would_allow` separate from future runtime authorization; label it as one input only.
4. Add representative composed gate rows and reason codes.
5. Split or mark overly broad classes in the preview where needed, especially `setup_config_changes`, local SDE import/rewrite, support artifact writes, runtime control, and fixture-only commands.
6. Include unknown/unclassified future command posture as fail-closed policy intent without implementing runtime fail-closed behavior.
7. Add focused offline verification proving no runtime interception, no command blocking, no provider calls, no filesystem writes, no DB mutations, and no schema changes.
8. Add command-authority, service-registry, enforcement dry-run, and passive side-effect coverage as needed.
9. Update Evidence / Dev Handoff and create the expected DevHS file.

## Guardrails

- No runtime enforcement.
- No command interception.
- No actual command blocking.
- No provider calls.
- No storage config writes.
- No support artifact creation.
- No snapshot or trace-pack creation.
- No cleanup/delete/prune/restore/move/copy/migration/upload.
- No Evidence/EVEidence writes.
- No Hydration writes.
- No schema changes.
- No UI/renderer redesign.
- Do not treat `would_allow` as runtime authorization.
- Do not treat confirmation tokens as security secrets.
- Do not make renderer payloads authoritative for paths, budget, acknowledgement, or command class.
- Do not blur External I/O with Watch arming or storage authority.
- Do not make this a full enforcement implementation packet.

## Stop Conditions

Stop and return to Overseer if:

- implementation requires intercepting or blocking commands
- implementation requires changing how commands execute
- runtime authorization decisions would become active
- provider/live calls are needed
- filesystem writes, artifact creation, or storage movement are needed
- schema changes are needed
- composed policy cannot represent unknown/unclassified commands without inventing runtime behavior
- class splitting requires source command renames or broad registry refactor
- support artifact path authority or storage authority becomes renderer-controlled

## Required Verification

Dev should add focused verification, likely:

```powershell
npm.cmd run verify:composed-gate-policy
```

Also run:

```powershell
node --check <changed-js-files>
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

## Expected Dev Handoff

```text
workspace/DevHS148-composed-gate-policy.md
```
