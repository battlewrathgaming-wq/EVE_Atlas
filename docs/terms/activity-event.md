# Term: Activity Event

## Plain Meaning

An activity event is one observed appearance from a killmail.

It means:

> This pilot, corporation, or alliance appeared in this killmail, in this role, at this time, in this system.

Activity events are how AURA Atlas turns raw killmail evidence into something that can be searched, filtered, counted, and reported.

## Simple Example

If a killmail shows:

- one victim
- three attackers
- two attacker corporations
- one attacker alliance

AURA Atlas creates activity events that let reports answer questions like:

- Who appeared as an attacker?
- Who appeared as a victim?
- Which corporations appeared?
- Which alliance appeared?
- What ship was involved?
- What system did it happen in?
- When did it happen?

## Why It Exists

Expanded ESI killmails are the raw evidence.

Activity events are the useful observation rows made from that evidence.

They make reports possible:

- system activity
- radius watch activity
- actor timelines
- repeated operators
- attacker/victim role mix
- ship usage
- regional activity

## What It Is Not

An activity event is not a conclusion.

It does not prove:

- staging
- ownership
- residency
- command structure
- alliance intent
- hostile status

It only records an observed appearance in evidence.

Interpretation comes later and must be labeled carefully.

## IDs And Names

AURA Atlas treats IDs as facts and names as labels.

For example:

```txt
Armageddon [typeID: 643]
ZTS-4D [solarSystemID: 30004660]
The Initiative. [allianceID: 1900696668]
```

The ID is the stable fact.

The name is the readable label.

If a name is missing, the evidence is still valid because the ID remains.

## Cached Labels

Activity events may store cached names such as pilot names, corporation names, ship names, or system names.

These names are only there to make reports easier to read.

They do not replace the original IDs, and they do not change the raw killmail evidence.

## Product Rule

Use activity events to ask:

> What was observed in the evidence?

Do not use one activity event to claim:

> What does this actor intend?

Repeated activity events can become a pattern, but patterns are still evidence for investigation, not automatic proof.

