# Core Runtime Contracts

> Source split from `poison_execution_plan_zh.md`.

Detailed ownership lives in:

- [Source Of Truth](./contracts/source-of-truth.md)
- [Runtime Artifacts](./contracts/runtime-artifacts.md)
- [Run State](./contracts/run-state.md)
- [Output Contract](./contracts/output-contract.md)

This file is a high-level orientation. If context, runtime, state, or output
details conflict with the contract files above, the contract files win and this
file should be corrected.

## Core Concept

Poison prevents different agents from inventing separate product understanding.
The durable context is stored in `.poison/context`, while each run records its
scope, evidence, state, review, and gate artifacts under
`.poison/runs/<run-id>`.

## Runtime Layers

- Product context and source-of-truth queries:
  [Source Of Truth](./contracts/source-of-truth.md)
- Runtime folder and artifact inventory:
  [Runtime Artifacts](./contracts/runtime-artifacts.md)
- Legal statuses, transitions, and recovery rules:
  [Run State](./contracts/run-state.md)
- Markdown metadata, required sections, and schema checks:
  [Output Contract](./contracts/output-contract.md)

## V1 Scope

V1 uses the review-first subset of the runtime:

```text
.poison/context/
.poison/runs/<run-id>/run-state.json
.poison/runs/<run-id>/run-contract.md
.poison/runs/<run-id>/context-health.md
.poison/runs/<run-id>/degraded-evidence.md
.poison/runs/<run-id>/review-packet.md
.poison/runs/<run-id>/review-summary.md
.poison/runs/<run-id>/gate-report.md
```

Later versions can activate broader context packaging, source-of-truth queries,
protected-feature tracking, repair plans, completion audits, and design
publishing without redefining the runtime contracts.
