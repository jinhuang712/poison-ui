# Autonomous Workflow Contract

This file owns autonomous closure, protected features, visual decision pages,
and user ambiguity handling.

V1 review-first can record these constraints, but full autonomous repair loops
are V2+ work.

## Protected Features

Autonomous workflows must initialize protected boundaries before repair work.
The orchestrator asks the user once at workflow start:

- pages, flows, or interactions that must not regress
- visual direction, hierarchy, or component behavior to preserve
- features that can be polished without changing their meaning
- areas that are free to redesign

The result is written to:

```text
.poison/context/protected-features.md
```

Required sections:

```markdown
# Protected Features

## Protected Pages

## Protected Flows

## Protected Interactions

## Protected Visual Direction

## Soft-Protected Areas

## Free-To-Change Areas

## Source
user-initialization | run-contract | imported-design | manual-update
```

Rules:

- autonomous fixes cannot delete, weaken, or redefine protected items
- soft-protected changes need rationale
- free-to-change areas still cannot exceed the run contract
- user updates can change the list; gate success cannot silently expand it
- reviewers and gates check for protected feature regressions

## Autonomous Closure

Poison should close common UI and interaction issues without asking the user for
every small decision.

Autonomous fixes may cover:

- button hierarchy and interaction feedback
- loading, error, empty, and disabled states
- form validation, input help, and recovery paths
- navigation loops and state switches
- baseline responsive behavior
- alignment, spacing, density, hierarchy, readability, consistency, color
  conflicts, and information noise

Autonomous fixes must not change product goals, target users, core workflows,
major feature boundaries, protected features, or open questions.

User decisions are required when the change would:

- change product goal, target user, or core workflow
- add, remove, or reorder major functionality
- choose between multiple reasonable brand, positioning, commercial, or IA
  directions
- require real business, data, permission, compliance, or operational rules
- conflict with explicit user instructions
- lack enough source-of-truth or evidence to converge

Autonomous fixes still need traceability in design rationale, repair plans, and
gate results.

## Visual Decision Pages

When uncertainty is visual, layout, interaction, or aesthetic, and autonomous
closure cannot converge, Poison should produce an inspectable HTML decision
artifact instead of only text options.

Command owner:

```text
poison decision-html --question "<question>" --run .poison/runs/<run-id>
```

Output:

```text
.poison/runs/<run-id>/decisions/
  001-<slug>.html
  001-<slug>.md
```

HTML pages must show 2-3 concrete options with UI fragments, tradeoffs, and
risk notes. They use shared context and do not replace the prototype, run
contract, or visual system.

The paired Markdown records:

```markdown
# Decision Prompt

## Question

## Why Visual Decision Is Needed

## Options

## User Choice

## Decision To Write Back
```

Accepted decisions are written to the appropriate owner: poison core,
visual-system, design-decisions, run contract, or a contract file.

## User Ambiguity Check

When the user reviews a decision page, prototype, completion audit, or review
summary, Poison must allow explicit ambiguity feedback:

- the product goal is unclear
- the next action is unclear
- page, copy, flow, or visual expression is confusing
- something feels unreasonable or untrustworthy
- the user understands but disagrees with the direction

Output:

```text
.poison/runs/<run-id>/user-ambiguity-check.md
```

Required sections:

```markdown
# User Ambiguity Check

## User Observed

## User Understood

## User Did Not Understand

## Confusing Points

## Unreasonable Points

## Direction Disagreement

## Required Follow-Up

## Status
CLEAR | HAS_AMBIGUITY | BLOCKED
```

Unresolved user ambiguity blocks completion. It must be routed to poison core,
run contract, design rationale, interaction backlog, or open questions.
