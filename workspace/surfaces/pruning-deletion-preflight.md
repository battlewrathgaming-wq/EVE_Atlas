# Pruning / Deletion Preflight

Status: Advisory discovery input, not project authority
Surface: Pruning / deletion preflight
Source owner: AURA-Atlas
User task: Understand what cleanup, pruning, or deletion would affect before any destructive action exists or runs.
Source data / command: `evidence.prune_scope`, storage/runtime hardening pruning direction, deletion preflight handshakes, DataHS116 relationship considerations.
What is visible now: Deletion preflight is read-only and can report blocked execution, no retained footprint, snapshot/backup disclosure, selected Evidence counts, and affected Assessment references.
What the user needs to understand: Deletion of active local records should be absolute when later authorized; snapshots/backups are separate support artifacts; pruning is future intelligence formation, not generic cleanup.
First-read candidates: Read-only preflight; deletion not executed; affected Evidence; affected Assessment Memory; snapshots exist separately; no retained footprint.
Detail/diagnostic candidates: Selected killmail IDs, active row counts, related activity events, Discovery/provenance context, Assessment citations, snapshot path disclosure, support artifact relationship, blocked reasons.
Terms to preserve: pruning, deletion preflight, Evidence-confirmed killmail ID, Assessment Memory, Runtime snapshot, no retained footprint.
Terms to avoid or qualify: archive, soft delete, footprint, cleanup as proof-safe, automatic pruning, Evidence preservation through snapshot.
Boundary that must not blur: Pruning/deletion preflight is read-only; snapshots/backups are support/recovery artifacts, not active Evidence retention or deletion footprint.
Risks / false implications: Snapshot disclosure can sound like deletion is reversible inside active Atlas records; pruning can look like routine cache cleanup; Assessment citations can look like blockers.
Possible request_display candidate: yes
No Dev authorization: This note does not authorize deletion execution, pruning execution, retained footprint, snapshot cleanup, schema changes, or support-artifact mutation.

