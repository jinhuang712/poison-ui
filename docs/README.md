# Poison Documentation

This directory contains product, architecture, delivery, and implementation
contracts for Poison.

## Current Status

Poison has a complete V1 review-first CLI subset, V2a protected-baseline,
V2b repair-planning, V2c arbiter-routing, and V2d bounded harden round actions,
plus a split contract documentation structure. See
[Progress](../PROGRESS.md) and the [Version Roadmap](./delivery/version-roadmap.md).

## Ownership Rule

High-level `docs/00-09` files are narrative and orientation documents. Detailed
implementation contracts live in the semantic owner files below. If a high-level
document conflicts with a contract owner, the contract owner wins and the
high-level document should be updated to point to it.

Do not duplicate command semantics, artifact schemas, state transitions, review
schemas, gate behavior, or design-folder structure in multiple files.

## Navigation

| Need | Owner |
|---|---|
| Product overview | [00-overview.md](./00-overview.md) |
| Repository architecture narrative | [01-repository-architecture.md](./01-repository-architecture.md) |
| Runtime contracts narrative | [02-core-runtime-contracts.md](./02-core-runtime-contracts.md) |
| Mode and command narrative | [03-modes-and-command-api.md](./03-modes-and-command-api.md) |
| Harness adapter narrative | [04-harness-adapter-contract.md](./04-harness-adapter-contract.md) |
| Autonomous workflow narrative | [05-autonomous-workflow.md](./05-autonomous-workflow.md) |
| Review and audit narrative | [06-review-and-audit-pipeline.md](./06-review-and-audit-pipeline.md) |
| Tools, gate, and state narrative | [07-tools-gates-and-state.md](./07-tools-gates-and-state.md) |
| Skill and role narrative | [08-skill-and-role-contracts.md](./08-skill-and-role-contracts.md) |
| V1 delivery narrative | [09-v1-delivery.md](./09-v1-delivery.md) |
| Version ladder | [delivery/version-roadmap.md](./delivery/version-roadmap.md) |
| V1 acceptance | [delivery/v1-acceptance.md](./delivery/v1-acceptance.md) |
| V1 dry run | [delivery/dry-run.md](./delivery/dry-run.md) |
| V1 delivery owner | [delivery/v1-review-first.md](./delivery/v1-review-first.md) |
| V2 delivery owner | [delivery/v2-controlled-hardening.md](./delivery/v2-controlled-hardening.md) |
| V3 delivery owner | [delivery/v3-design-package.md](./delivery/v3-design-package.md) |
| V4 delivery owner | [delivery/v4-platform-adapter-maturity.md](./delivery/v4-platform-adapter-maturity.md) |
| Future-version backlog | [delivery/vn-backlog.md](./delivery/vn-backlog.md) |
| Source layout | [architecture/source-layout.md](./architecture/source-layout.md) |
| Adapter layout | [architecture/adapter-layout.md](./architecture/adapter-layout.md) |
| Command API | [contracts/command-api.md](./contracts/command-api.md) |
| Source of truth and context | [contracts/source-of-truth.md](./contracts/source-of-truth.md) |
| Runtime artifacts | [contracts/runtime-artifacts.md](./contracts/runtime-artifacts.md) |
| Run state | [contracts/run-state.md](./contracts/run-state.md) |
| Gate rules | [contracts/gate-rules.md](./contracts/gate-rules.md) |
| Autonomous workflow | [contracts/autonomous-workflow.md](./contracts/autonomous-workflow.md) |
| Evidence model | [contracts/evidence-model.md](./contracts/evidence-model.md) |
| Review process | [contracts/review-process.md](./contracts/review-process.md) |
| Review schema | [contracts/review-schema.md](./contracts/review-schema.md) |
| Role contracts | [contracts/role-contracts.md](./contracts/role-contracts.md) |
| Output contract | [contracts/output-contract.md](./contracts/output-contract.md) |
| Design folder package | [contracts/design-folder.md](./contracts/design-folder.md) |
| Decision log index | [decisions/README.md](./decisions/README.md) |
