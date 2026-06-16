# Gate Rules Contract

This file owns V1 gate checks and report shape.

## Command

```bash
poison gate --run .poison/runs/<run-id>
```

## Required Report

```text
.poison/runs/<run-id>/gate-report.md
```

```markdown
# Gate Report

## Verdict
PASS | FAIL

## Passed checks

## Failed checks

## Warnings

## Required fixes
```

## Checks

Gate checks:

- `run-state.json` exists and state transition is legal.
- Key artifacts pass `schema-check`.
- `poison-core.current.md` exists.
- `protected-features.md` exists.
- `user-design-taste.md` exists.
- `visual-memory.md` exists.
- `run-contract.md` exists.
- `review-packet.md` exists.
- Screenshots exist when the run requires visual/runtime evidence.
- `screenshot-manifest.json` exists when capture has run.
- `console.log` exists or missing console evidence is explicitly degraded.
- Severe console errors are absent or recorded as failures.
- Source files do not contain obvious placeholder text.
- Visual, UX, and frontend review outputs exist when required by the run.
- Visual poison findings use taxonomy words and required terminal format.
- Visual quality pluses and poison findings are recorded separately.
- Blocker and major findings have E0-E3 evidence.
- `design-rationale.md` exists.
- `user-ambiguity-check.md` exists and has no unresolved ambiguity.
- Completion audit runs include `completion-report.md`.
- Arbiter repair plan exists when reviews found fixable issues.
- Protected features did not regress.
- Visual memory did not drift without explanation.
- Final report exists before completion.
- Passing gate moves run-state to `gated`.

## Placeholder Detection

Gate flags obvious placeholder text in source files:

```text
Lorem ipsum
TODO
Sample
Placeholder
Untitled
Example Card
Your app
```

## Failure Behavior

- Missing reviews can fail gate, but gate must produce executable fixes.
- Blocker or major findings without E0-E3 evidence fail gate or require arbiter
  severity downgrade.
- Missing automated screenshot or console capability must be represented as
  manual evidence, `needs-manual-evidence`, or `blocked`.
- Gate failure moves the run to `repaired`, `reviewed`, or `blocked` and sets
  `nextRecommendedAction`.
