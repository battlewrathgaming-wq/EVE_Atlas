# Storage Setup / Gate

Status: Advisory discovery input, not project authority
Surface: Storage Setup / Gate
Source owner: AURA-Atlas
User task: Choose, confirm, repair, or understand the Atlas storage location and disk budget before meaningful collection or writes.
Source data / command: `storage.setup_gate_readout`, storage authority preflight facts, storage/runtime hardening docs.
What is visible now: Read-only posture can distinguish configured ready, fallback acknowledgement required, demo/fixture-only, missing/unavailable, invalid/degraded, budget warning, strong warning, and hard-lock states.
What the user needs to understand: Atlas needs explicit storage trust before real/alpha collection; missing storage is a lock condition, not a cue to silently relocate; disk budget means physical Atlas-controlled storage use.
First-read candidates: Storage ready; setup required; fallback needs acknowledgement; budget warning; storage unavailable; demo/fixture only.
Detail/diagnostic candidates: Config source, trusted path posture, local read/report availability, allowed work classes, blocked work classes, budget percentage, blocked reasons, support artifact inclusion.
Terms to preserve: `storage.setup_gate_readout`, storage authority, configured ready, fallback acknowledgement required, demo/fixture-only, budget warning, budget hard-lock.
Terms to avoid or qualify: scan budget, cache path, hidden app settings, migration, automatic relocation, cleanup as pruning.
Boundary that must not blur: Storage setup is operator trust/storage authority, not only a path variable and not provider cadence.
Risks / false implications: The surface could imply Atlas can proceed with provider-backed collection while storage is untrusted; budget could be mistaken for request/API rate limits; fallback could sound safe without acknowledgement.
Possible request_display candidate: yes
No Dev authorization: This note does not authorize storage config writing, lockout enforcement, file picker work, DB movement, migration, deletion, pruning, or renderer implementation.

