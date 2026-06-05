# Atlas Feature Documents

Feature documents define product capabilities and boundaries. They are not implementation logs.

Each feature doc should state:

- current status
- user value
- data classification
- creation or update path
- what the feature must not do
- related contracts, terms, or verification

Atlas feature docs must keep the three-layer model clear:

```text
evidence -> observation -> assessment
```

If a feature creates or changes stored data, identify whether that data is evidence, metadata, collection provenance, diagnostic support data, or assessment memory.

Current core feature areas:

- persistent discovery ref queue
- entity interest and assessment artifacts
- evidence compaction preflight and assessment preservation
- Acquisition and Hydration clocks
- Observation lookup model
- Data layer boundaries
- R-Scanner and Sequencer presentation
- UI triggers and scope mapping
- presentation layer information index
- Watch scope authority

Do not use this folder for dated handovers. Use `docs/audits` for reviews and `docs/current-state` for implementation truth.
