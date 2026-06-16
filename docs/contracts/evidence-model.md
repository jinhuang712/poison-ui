# Evidence Model Contract

This file owns evidence levels and severity rules for review, arbiter,
completion audit, and gate.

## Evidence Levels

```text
E0 user decision      User decision, protected-features, frozen run-contract item
E1 runtime/screenshot Real screenshot, browser result, console output, responsive capture
E2 source/design      Code, design, spec, PRD, poison-core, visual-memory, visual-system
E3 rubric/taxonomy    poison taxonomy, completion rubric, visual/UX/frontend rubrics
E4 reviewer opinion   Reviewer taste, judgment, directional suggestion
```

## Severity Rules

- `blocker` requires E0, E1, or E2 evidence and must affect task completion,
  violate run contract, break protected features, harm trust/safety/accessibility,
  or make runtime unusable.
- `major` requires E1, E2, or E3 evidence and must clearly affect
  understanding, efficiency, visual continuity, completion, or a key state.
- `minor` can use E2 or E3 for local quality issues and low-risk improvements.
- `suggestion` can use E4, but E4-only findings cannot become must-fix items.

## Conflict Rules

- E0 overrides all other evidence.
- E1 overrides design guesswork.
- E4 can trigger discussion or designer discretion only.
- Insufficient evidence produces `BLOCKED` or `needs-evidence`.

## Finding Fields

Each finding must include:

```markdown
- evidence level: E0 | E1 | E2 | E3 | E4
- evidence source:
- why severity is justified:
```
