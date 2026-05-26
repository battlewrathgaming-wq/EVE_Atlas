# Observation Lookup Model

Date: 2026-05-27
Status: Product direction

## Purpose

Define Observation as an Atlas presentation/query capability.

This document consolidates accepted direction from workspace product notes. It is not an implementation packet, schema design, service contract, or terminology rename.

## Core Rule

Observation is not new truth.

Observation is the presentation/query layer that starts from a chosen anchor, pulls connected Atlas records through known relationships, and forms an operator-facing story.

## Anchor Model

The strongest primary anchor is the ESI-expanded killmail because it is a structured EVE-confirmed record stored as Evidence/EVEidence.

Future Observation lookup may start from accepted known entity anchors such as:

- killmail ID
- pilot ID
- corporation ID
- system ID
- later alliance ID or other accepted entity IDs

The operator should be able to pull a known entity and see connected records move into view.

## Pilot Lookup

For a pilot anchor, Observation should be able to assemble:

- killmail sightings
- timeline
- locations and systems
- current or known corporation context
- related assessments
- related Watch/Marked state where relevant
- provenance and Evidence/EVEidence basis

The value is helping the operator understand player hunting patterns and local context without manually stitching records together.

## Corporation Lookup

For a corporation anchor, Observation should be able to assemble:

- known members
- members with sightings
- related killmails
- recurring systems or regions
- assessments tied to the corporation or member entities
- observed patterns traceable to Evidence/EVEidence and Assessment basis

## Layer Boundaries

- Evidence/EVEidence is stored factual record material.
- Discovery is possible leads before Evidence/EVEidence creation.
- Assessment is human-authored judgment.
- Hydration fills readable labels and related local metadata; it does not create Evidence/EVEidence.
- Observation assembles connected records into operator-facing story.

## Product Metaphor

Atlas records are loosely connected parts: blocks with string attached.

A killmail is one complete presentation of connected parts, but a pilot, corporation, system, or other accepted entity can also pull connected records into view.

Observation is the middle slice that pulls those parts into a story.

## Non-Goals

- Do not treat Observation as Evidence/EVEidence.
- Do not make Observation a hidden assessment engine.
- Do not create provider/live behavior from Observation presentation.
- Do not infer corp membership freshness without showing basis.
- Do not hide provenance when the story depends on it.

## Parked Questions

- Which relationships already exist strongly enough for first Observation lookup?
- Which entity anchors need indexes or read models?
- How much corporation membership can be trusted from local records versus provider refresh?
- How should stale labels and stale assessments be shown?
- Which Observation surfaces should be display-only and which should allow follow-on action?
