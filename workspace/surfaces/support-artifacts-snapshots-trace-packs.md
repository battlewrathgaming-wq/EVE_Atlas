# Support Artifacts / Snapshots / Trace Packs

Status: Advisory discovery input, not project authority
Surface: Support artifacts / snapshots / trace packs
Source owner: AURA-Atlas
User task: Understand diagnostic, readiness, trace, snapshot, and recovery artifacts without confusing them for active Evidence/EVEidence.
Source data / command: Runtime snapshots, trace packs, readiness reports, `app.readiness`, corpus health, storage authority preflight, storage setup gate readout.
What is visible now: Support/readout surfaces can expose runtime boundary status, partial success, storage posture, trace packs, and snapshot destination/budget posture.
What the user needs to understand: Support artifacts help diagnose or recover; they are not Evidence/EVEidence, Observation, Assessment Memory, or proof of active retained records.
First-read candidates: Support artifact; runtime snapshot; trace pack; readiness report; diagnostic only; snapshot path; storage budget impact.
Detail/diagnostic candidates: Artifact type, path/destination, created time, included scope, active DB relationship, budget impact, whether artifact may contain historical data, cleanup responsibility.
Terms to preserve: Runtime snapshot, trace pack, readiness report, support artifact, corpus health.
Terms to avoid or qualify: evidence, observation, backup as active record, retained footprint, protected deletion, automatic cleanup.
Boundary that must not blur: Support artifacts are outside active Evidence/EVEidence and should not be treated as retained proof after deletion.
Risks / false implications: Operators may think snapshots preserve or restore active Evidence automatically; trace packs may leak boundary meaning if shown as reports; support storage can be excluded from budget accidentally.
Possible request_display candidate: parked
No Dev authorization: This note does not authorize snapshot creation, cleanup, restore, storage migration, support-artifact budget changes, or renderer implementation.

