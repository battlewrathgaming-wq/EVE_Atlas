# Overseer HS95 - Observation Lookup Product Note

Date: 2026-05-26
Role: Atlas Overseer
Status: accepted product direction note
Milestone: Atlas Storage And Runtime Hardening

## Purpose

Capture Human product direction for Observation as Atlas moves from spine work toward body/surface planning.

This note is not a Dev runway. It does not authorize implementation, schema changes, service changes, bridge changes, persistence changes, or terminology renames.

## Core Direction

Observation is a presentation/query layer.

Observation does not create new truth. It looks up a chosen anchor, pulls connected Atlas records through known relationships, and forms a story for the operator.

## Anchor Model

The strongest primary anchor remains the ESI-expanded killmail because it is the most structured EVE-confirmed record Atlas stores as Evidence/EVEidence.

Observation should also support lookup from other accepted known entity anchors:

- killmail ID
- pilot ID
- corporation ID
- system ID
- later alliance ID or other accepted entity IDs

The operator can pull any known string, and Atlas should surface related records without pretending the presentation layer is the source of truth.

## Pilot Lookup Shape

When the operator enters or selects a pilot ID, Observation should be able to assemble:

- killmail sightings
- timeline
- locations/systems
- current or known corporation context
- related assessments
- related Watch/Marked state where relevant
- provenance and Evidence/EVEidence basis

This helps the operator understand player hunting patterns and local context without manually stitching records together.

## Corporation Lookup Shape

When the operator enters or selects a corporation ID, Observation should be able to assemble:

- known members
- members with sightings
- related killmails
- recurring systems or regions
- assessments tied to the corporation or member entities
- observed patterns that can be traced back to Evidence/EVEidence and Assessment basis

## Layer Boundaries

- Evidence/EVEidence remains stored factual record material.
- Discovery remains possible leads before Evidence/EVEidence creation.
- Assessment remains human-authored judgment.
- Hydration fills readable labels and related local metadata; it does not create Evidence/EVEidence.
- Observation assembles connected records into operator-facing story.

## Product Metaphor

Atlas records are loosely connected parts: blocks with string attached.

A killmail is one complete presentation of connected parts, but the operator should also be able to pull a pilot, corporation, system, or other accepted entity and see the connected records move into view.

Observation is the middle slice that pulls those parts into a story.

## Parked Implementation Questions

- Which relationships already exist strongly enough for first Observation lookup?
- Which entity anchors need explicit indexes or read models?
- How much corporation membership can be trusted from current local records versus provider refresh?
- How should stale labels and stale assessments be shown?
- Which Observation surfaces should be display-only and which should allow follow-on action?

These questions should be opened through a future bounded packet or advisory pass, not inferred from this note.
