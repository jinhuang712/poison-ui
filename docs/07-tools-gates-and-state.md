# Tools Gates And State

> Source split from `poison_execution_plan_zh.md`.

Detailed ownership lives in:

- [Command API](./contracts/command-api.md)
- [Runtime Artifacts](./contracts/runtime-artifacts.md)
- [Run State](./contracts/run-state.md)
- [Evidence Model](./contracts/evidence-model.md)
- [Review Schema](./contracts/review-schema.md)
- [Gate Rules](./contracts/gate-rules.md)

This file is a high-level orientation. If a command, artifact, state, review,
evidence, or gate detail conflicts with one of the contract files above, the
contract file wins and this file should be corrected.

## V1 Tool Flow

V1 implements the review-first dry-run through the single `poison` executable:

```text
init -> new-run -> capture -> review -> schema-check -> gate
```

The current dependency-free V1 runtime records an explicit degraded evidence
artifact when automated browser capture is unavailable. It must not claim live
visual or console observations without an evidence artifact.

The implementation entry points are:

- `bin/poison.mjs` for CLI parsing and command dispatch.
- `src/core/v1-runtime.mjs` for run folders, state transitions, artifacts,
  schema checks, and the mechanical gate.

## Current And Later Tool Work

V1b can add dedicated tool modules for browser screenshot and console capture.
Later versions can add state update helpers, publish workflows, and adapter
integrations. Those modules must call the same command contract or shared core
modules rather than defining their own run states, artifact schemas, review
fields, or gate rules.

Playwright-based screenshot capture is the active V1b direction. When added, it
must produce the evidence artifacts defined by
[Runtime Artifacts](./contracts/runtime-artifacts.md) and obey the degradation
rules in [Gate Rules](./contracts/gate-rules.md).
