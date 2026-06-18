# Gate Rules Contract

This file owns gate checks and report shape. V1 gate is mechanical. Later
versions can opt into stricter visual, UX, frontend, and completion gates after
those checks are implementable and testable.

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

## Hard checks

## Warnings

## Required fixes

## Next action
```

`PASS` means mechanical gate pass only. It does not mean UI/UX/product-ready
when `review-summary.md` contains findings. When review findings exist,
`Required fixes` must list the finding-backed follow-ups and `Next action` must
point to repair planning or user review.

## V1 Hard Checks

V1 hard checks:

- `run-state.json` exists, parses, and uses a legal status.
- Current state transition is legal according to
  [run-state.md](./run-state.md).
- Required V1 artifacts for the active state exist.
- Required V1 JSON artifacts parse and include required fields.
- Required V1 Markdown artifacts include required headings.
- Evidence exists when capture succeeded.
- Missing browser, screenshot, URL, or console capability is represented by
  `capture-diagnostics.md` and a recoverable blocked run unless the user has
  explicitly accepted `--allow-degraded`.
- `review-summary.md` exists before gate can pass.
- Review findings include `findingId`, `priorityRank`, `fixOrder`, severity,
  category, evidence refs, affected screens, and first repair recommendation.
- Severe console/runtime errors are absent when console evidence was captured,
  or recorded as hard failures. Severe means a browser `pageerror` or console
  entry with level `error`; warnings, info logs, missing browser automation, and
  explicitly accepted degraded evidence do not fail V1 by themselves.
- `blocked` cannot pass unless the blocker was resolved by a legal transition.
- Passing gate moves run-state to `gated`.

## V1 Warnings

These checks may be reported, but they do not fail V1 gate by default:

- Placeholder-looking text or generic demo copy.
- Visual poison taxonomy coverage.
- Visual quality, hierarchy, spacing, rhythm, density, or taste concerns.
- UX flow, empty state, error state, loading state, or accessibility concerns.
- Missing multi-reviewer ensemble.

## Later Strict Gates

Later versions may promote warnings to hard failures only when the project has:

- deterministic detection or a clearly inspectable evidence source
- a stable artifact schema
- a recovery path
- tests proving both pass and fail behavior

Examples of later strict gates:

- protected features did not regress
- visual memory did not drift without explanation
- blocker and major findings have E0-E3 evidence
- completion audit exists and maps design requirements to runtime evidence
- required `design/` package files were published for full mode

## Placeholder Detection

Gate may flag obvious placeholder text as a V1 warning:

```text
Lorem ipsum
Sample
Placeholder
Untitled
Example Card
Your app
```

`TODO` is not a universal V1 failure because it can be legitimate source code
or developer-facing text. If it appears in a user-facing UI surface, report it
as a warning with file or screenshot evidence.

## Failure Behavior

- Gate must produce executable fixes.
- Missing automated screenshot or console capability must block by default.
  Degraded evidence is legal only after explicit user acceptance.
- Gate failure moves the run to `blocked` and sets `previousStatus` plus
  `nextRecommendedAction`.
