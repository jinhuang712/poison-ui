# V1 Delivery

> Source split from `poison_execution_plan_zh.md`.

Detailed delivery ownership now lives in:

- [Version Roadmap](./delivery/version-roadmap.md)
- [V1 Acceptance](./delivery/v1-acceptance.md)
- [Dry Run](./delivery/dry-run.md)

This file keeps the high-level V1 delivery narrative.

## V1 Product Slice

V1 is a review-first poison detector for an existing local UI prototype. It is
for vibe coding developers who can generate a demo with AI but cannot reliably
diagnose why the result feels wrong.

The V1 workflow is:

```text
init -> new review run -> capture or record evidence gap -> review -> schema-check -> mechanical gate -> next action
```

V1 must make poison visible and actionable. It does not need to generate a full
product design, publish a full `design/` folder, or run a deep ensemble review.

## V1 Required Capabilities

### A. Minimal Initialization

```bash
node bin/poison.mjs init
```

Creates the minimum `.poison/context` and `.poison/runs` structure needed for a
review run. Missing optional context must be represented explicitly instead of
invented.

### B. Review Run Creation

```bash
node bin/poison.mjs new-run --mode review --name poisoned-demo
```

Creates:

```text
.poison/runs/001-poisoned-demo/
  run-state.json
  run-contract.md
  context-health.md
```

`run-state.json` starts at `created` and includes `nextRecommendedAction`.

### C. Evidence Capture Or Degradation

```bash
node bin/poison.mjs capture --url http://localhost:5173 --run .poison/runs/001-poisoned-demo
```

When browser capability exists, V1 captures screenshots, a screenshot manifest,
and console evidence. When it does not, V1 writes a degraded evidence report or
manual evidence requirement and moves the run to `blocked` or leaves it in a
recoverable review state.

### D. Review Summary

```bash
node bin/poison.mjs review --run .poison/runs/001-poisoned-demo
```

Creates:

```text
.poison/runs/001-poisoned-demo/review-packet.md
.poison/runs/001-poisoned-demo/review-summary.md
```

The review summary must identify:

- what feels poisoned
- evidence source
- severity
- why the issue matters to the target user
- first repair recommendation
- protected behavior that must not regress

### E. Schema Check

```bash
node bin/poison.mjs schema-check --run .poison/runs/001-poisoned-demo
```

Checks that required V1 artifacts parse and contain required fields/sections.

### F. Mechanical Gate

```bash
node bin/poison.mjs gate --run .poison/runs/001-poisoned-demo
```

Creates:

```text
.poison/runs/001-poisoned-demo/gate-report.md
```

V1 gate is mechanical. It can fail on illegal state, missing required artifacts,
unrepresented evidence gaps, parse failures, unresolved `blocked` state, or
captured severe runtime errors. Visual taste, UX completeness, frontend
handoff completeness, taxonomy coverage, and placeholder heuristics are warnings
unless a later version opts into strict mode.

## V1 Non-Goals

V1 does not include:

- generating a full prototype from scratch
- full-spec mode
- full `design/` package publishing
- automatic design system extraction
- pixel-perfect visual diffing
- deep multi-reviewer ensemble as a required path
- automatic code repair
- remote deployment
- real multi-worktree merge strategy
- scripts internally calling LLM APIs
- strict subjective visual gates
