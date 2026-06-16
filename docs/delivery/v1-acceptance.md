# V1 Acceptance

This file owns the V1 acceptance checklist.

## A. Initialization

```bash
node bin/poison.mjs init
```

Creates `.poison/context`, `.poison/runs`, and default context files:

- `.poison/context/poison-core.current.md`
- `.poison/context/protected-features.md`
- `.poison/context/visual-system.md`
- `.poison/context/visual-memory.md`
- `.poison/context/user-design-taste.md`
- `.poison/context/design-decisions.md`
- `.poison/context/open-questions.md`

## B. New Run

```bash
node bin/poison.mjs new-run --mode seed --name test-seed
```

Creates `.poison/runs/001-test-seed` with run state, run contract, readiness
assessment, context pack, SoT index, and context health.

## C. Protected Features

```bash
node bin/poison.mjs init-protected-features --run .poison/runs/001-test-seed
```

Updates `.poison/context/protected-features.md` and moves run-state to
`protected_ready`.

## D. SoT Query

```bash
node bin/poison.mjs sot query --run .poison/runs/001-test-seed --topic "primary user action"
```

Returns a `CONFIRMED`, `UNKNOWN`, `CONFLICTED`, or `OPEN` answer. `UNKNOWN`
writes to open questions. `CONFLICTED` writes to context health and blocks or
keeps the run blocked.

## E. Scope Assessment

```bash
node bin/poison.mjs assess-scope --run .poison/runs/001-test-seed
```

Creates `scope-assessment.md` with selected depth, selected expansion, reviewer
set, user override, and token/efficiency rationale.

## F. Capture

```bash
node bin/poison.mjs capture --url http://localhost:5173 --run .poison/runs/001-test-seed
```

Creates screenshots, `screenshot-manifest.json`, and console evidence or a clear
capability-degradation report.

## G. Review Packet

```bash
node bin/poison.mjs build-review-packet --run .poison/runs/001-test-seed
```

Creates `review-packet.md`.

## H. Decision HTML

```bash
node bin/poison.mjs decision-html --question "choose search layout" --run .poison/runs/001-test-seed
```

Creates a visual decision HTML page and matching Markdown decision prompt.

## I. User Ambiguity Check

```bash
node bin/poison.mjs ambiguity-check --run .poison/runs/001-test-seed
```

Creates `user-ambiguity-check.md`. `HAS_AMBIGUITY` or `BLOCKED` prevents
completion until resolved.

## J. Reviewer Ensemble

```bash
node bin/poison.mjs review --run .poison/runs/001-test-seed
```

Creates `review-summary.md` for target runs or `direction-synthesis.md` for
directional runs. Blocker and major findings include evidence level, evidence
source, and severity justification.

## K. Schema Check

```bash
node bin/poison.mjs schema-check --run .poison/runs/001-test-seed
```

Checks key Markdown metadata, required sections, required JSON fields, and JSON
parseability.

## L. Gate

```bash
node bin/poison.mjs gate --run .poison/runs/001-test-seed
```

Creates `gate-report.md`, fails clearly when evidence or reviews are missing,
and moves run-state according to gate result.

## M. Completion Audit

```bash
node bin/poison.mjs audit-completion --design docs/sample-design.md --url http://localhost:5173 --run .poison/runs/001-test-seed
```

Creates `completion-audit-packet.md` and `completion-report.md`. Missing design,
runtime, screenshots, or evidence produces a `BLOCKED` verdict and evidence gap
list.

## Non-Goals

V1 does not include Figma export, pixel-perfect visual diffing, complex visual
scoring, automatic design system extraction, remote deployment, multi-worktree
merge strategy, embedded report images, internal LLM API calls, automatic code
changes from completion audit, or evidence-free completion percentages.
