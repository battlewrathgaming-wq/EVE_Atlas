# Assessment Memory

Status: Advisory discovery input, not project authority
Surface: Assessment Memory
Source owner: AURA-Atlas
User task: Review, add, or understand saved human judgment and the evidence/context it cited.
Source data / command: `assessment_artifacts`, Assessment Memory reports, deletion/pruning preflight context.
What is visible now: Assessment artifacts can store operator-authored judgment with citation context and status, but remain mutable and disposable.
What the user needs to understand: Assessment Memory is human-authored judgment, not proof; citation status can become stale if underlying Evidence/EVEidence changes or is deleted.
First-read candidates: Saved operator judgment; citation context; stale citation; affected by deletion; not proof.
Detail/diagnostic candidates: Entity type/ID, author/time, status, citation status, sample killmail IDs, related Evidence presence, deleted/missing citation warning.
Terms to preserve: Assessment Memory, `assessment_artifact`, citation context, human-authored judgment.
Terms to avoid or qualify: evidence, proof, automatic intelligence, verified truth, retained footprint, deletion blocker.
Boundary that must not blur: Assessment Memory may cite Evidence/EVEidence but does not become Evidence/EVEidence and does not silently protect records from deletion/pruning.
Risks / false implications: "Verified" citation status can sound permanent; saved judgment can overrule source facts; Assessment-linked records can appear undeletable.
Possible request_display candidate: parked
No Dev authorization: This note does not authorize Assessment workflow changes, citation validation changes, deletion blocking, schema changes, or UI implementation.

