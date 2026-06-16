# Autonomous Workflow

> Source split from `poison_execution_plan_zh.md`.

Detailed ownership now lives in
[Autonomous Workflow Contract](./contracts/autonomous-workflow.md). This file
keeps the high-level autonomous workflow narrative.

Contract owner note: this file is narrative orientation. If protected-feature,
decision-page, ambiguity, or autonomous-closure details conflict with the
contract owner, the contract owner wins and this file should be corrected.

## Purpose

Poison should avoid asking the user to approve every small interaction or visual
repair. Common UI issues can be closed autonomously when they stay inside the
run contract, preserve protected features, and have enough evidence.

## Boundaries

Autonomous closure is allowed for local polish, interaction feedback, state
completeness, baseline responsive behavior, and small clarity improvements.

User decisions are required for product direction, target-user changes, major
feature changes, business rules, compliance or operational facts, and visual
directions where multiple options are reasonable and consequential.

## Durable Owners

- Protected feature initialization:
  [Autonomous Workflow](./contracts/autonomous-workflow.md#protected-features)
- Autonomous repair boundaries:
  [Autonomous Workflow](./contracts/autonomous-workflow.md#autonomous-closure)
- Visual decision pages:
  [Autonomous Workflow](./contracts/autonomous-workflow.md#visual-decision-pages)
- User ambiguity handling:
  [Autonomous Workflow](./contracts/autonomous-workflow.md#user-ambiguity-check)

## Version Scope

V1 can record protected boundaries, degraded evidence, ambiguity, and next
actions. Full autonomous repair loops are V2+ work.
