# V1 Acceptance

This file owns the V1 review-first acceptance checklist. Broader seed, evolve,
full, harden, design publishing, and deep review behavior belongs to later
versions in [version-roadmap.md](./version-roadmap.md).

## A. Initialization

```bash
node bin/poison.mjs init
```

Creates:

```text
.poison/context/
.poison/runs/
```

Minimum context files:

- `.poison/context/poison-core.current.md`
- `.poison/context/open-questions.md`

Optional context files may be created when known, but V1 must not invent
product facts to satisfy a template.

## B. New Review Run

```bash
node bin/poison.mjs new-run --mode review --name poisoned-demo
```

Creates `.poison/runs/001-poisoned-demo` with:

- `run-state.json`
- `run-contract.md`
- `context-health.md`

The initial status is `created`, and `nextRecommendedAction` identifies capture
or manual evidence collection.

## C. Capture Or Evidence Gap

```bash
node bin/poison.mjs capture --url http://localhost:5173 --run .poison/runs/001-poisoned-demo
```

When capture works, V1 creates:

- `screenshots/`
- `screenshot-manifest.json`
- `console.log` or structured console evidence

When capture cannot run, V1 creates an explicit degraded evidence artifact and
sets a recoverable `blocked` state or a reviewable degraded state with
`nextRecommendedAction`.

## D. Review

```bash
node bin/poison.mjs review --run .poison/runs/001-poisoned-demo
```

Creates:

- `review-packet.md`
- `review-summary.md`

The summary includes:

- issue title
- severity
- evidence source
- why it feels poisoned
- first repair recommendation
- protected behavior that must not regress

## E. Schema Check

```bash
node bin/poison.mjs schema-check --run .poison/runs/001-poisoned-demo
```

Checks:

- `run-state.json` parses and has required fields.
- Required V1 Markdown artifacts have required headings.
- Evidence gap artifacts exist when automated evidence is unavailable.
- Review summaries have severity and evidence fields.

## F. Mechanical Gate

```bash
node bin/poison.mjs gate --run .poison/runs/001-poisoned-demo
```

Creates:

- `gate-report.md`

V1 hard gate fails only for mechanical reasons:

- illegal state transition
- missing required V1 artifact
- schema-check failure
- unrepresented evidence gap
- unresolved `blocked` state
- severe console/runtime error captured during evidence collection

The gate report also records warnings for visual, UX, frontend, placeholder,
taxonomy, protected-feature, and visual-memory concerns.

## Exit Criteria

V1 is acceptable when the dry-run can:

1. Initialize Poison runtime folders.
2. Create a review run.
3. Capture evidence or record why evidence is missing.
4. Produce a structured review summary.
5. Run schema checks.
6. Run the mechanical gate.
7. Leave `run-state.json` with a legal status and clear next action.

## Non-Goals

V1 does not include Figma export, pixel-perfect visual diffing, complex visual
scoring, automatic design system extraction, remote deployment,
multi-worktree merge strategy, embedded report images, internal LLM API calls,
automatic code changes from completion audit, full `design/` publishing, or
evidence-free completion percentages.
