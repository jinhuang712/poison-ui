# Poison Documentation

This directory contains product, architecture, delivery, and implementation
contracts for Poison.

## Current Status

Poison is in V0 documentation and contract scaffold state. The current
implementation target is V1 review-first Poison detection for existing
AI-generated local prototypes. See [Progress](../PROGRESS.md) and the
[Version Roadmap](./delivery/version-roadmap.md).

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
| Source layout | [architecture/source-layout.md](./architecture/source-layout.md) |
| Adapter layout | [architecture/adapter-layout.md](./architecture/adapter-layout.md) |
| Command API | [contracts/command-api.md](./contracts/command-api.md) |
| Runtime artifacts | [contracts/runtime-artifacts.md](./contracts/runtime-artifacts.md) |
| Run state | [contracts/run-state.md](./contracts/run-state.md) |
| Gate rules | [contracts/gate-rules.md](./contracts/gate-rules.md) |
| Evidence model | [contracts/evidence-model.md](./contracts/evidence-model.md) |
| Review schema | [contracts/review-schema.md](./contracts/review-schema.md) |
| Output contract | [contracts/output-contract.md](./contracts/output-contract.md) |
| Design folder package | [contracts/design-folder.md](./contracts/design-folder.md) |
| Decision log index | [decisions/README.md](./decisions/README.md) |
