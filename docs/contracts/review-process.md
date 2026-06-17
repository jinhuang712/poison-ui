# Review Process Contract

This file owns review orchestration rules that are broader than the artifact
schemas in [Review Schema](./review-schema.md) and the severity rules in
[Evidence Model](./evidence-model.md).

## Readiness Assessment

Readiness assessment chooses the next mode from available input completeness.
Later versions may expose it as a deterministic command, but V1 review-first
does not require it before a manual `new-run --mode review`.

Signals:

- target user
- pages or screens
- workflow
- states
- permissions
- data objects
- visual constraints
- platform constraints
- edge cases
- success criteria

Output owner:

```text
.poison/runs/<run-id>/readiness-assessment.md
```

Required sections:

```markdown
# Readiness Assessment

## Score
0-100

## Selected Mode
seed | evolve | full | review | harden

## Rationale

## Missing Information

## Recommended Next Step
```

Default heuristic:

```text
0-30: seed
31-69: evolve
70-100: full
```

## Review Packet

Review packet assembly produces the shared input reviewers use for a run:

```text
.poison/runs/<run-id>/review-packet.md
```

Required contents:

- poison core version
- current run contract
- screenshots or degraded/manual evidence limitations
- relevant flows
- frozen decisions
- allowed review scope
- out-of-scope areas
- required output format

Reviewers may identify violations of poison core, run contract, visual quality,
UX, frontend implementation, and completion coverage. They must not redefine
the target user, product goal, major modules, frozen decisions, or current run
scope.

## Reviewer Ensemble

`poison_taxonomy_single_word_full.md` is the full visual poison taxonomy source.
Reviewers do not need to read or audit the full taxonomy on every run.
Orchestrators assign a relevant subset; the arbiter and user-facing summary may
use the full taxonomy for deduplication and severity review.

Default reviewer profiles:

- `product-realist`: product goal, value expression, scope control
- `ux-operator`: flow, state, IA, usage efficiency
- `visual-craft`: typography, rhythm, hierarchy, aesthetic completeness
- `frontend-pragmatist`: runtime, responsive quality, implementation consistency
- `contrarian-taste`: evidence-backed "something is off" review

Every reviewer spawn must include a voice line:

```text
<agent-id>-spawned: "<voice>"
```

The voice can only restate shared context, reviewer profile, target, scope, and
the current context revision. It must not introduce new product assumptions.

## Shared And Private Context

Shared context defines target, scope, frozen decisions, and evidence:

- `.poison/context/poison-core.current.md`
- `.poison/context/visual-system.md`
- `.poison/context/visual-memory.md`
- `.poison/context/design-decisions.md`
- `.poison/context/protected-features.md`
- `.poison/runs/<run-id>/run-contract.md`
- `.poison/runs/<run-id>/context-pack.md`
- `.poison/runs/<run-id>/sot-index.json`
- current screenshots, runtime evidence, and active rubrics

Private reviewer context may affect focus, taste sensitivity, question style,
and risk sensitivity. It cannot override shared context.

## Resource And Depth Policy

User depth overrides are honored when explicit:

- `fast`: speed and token control
- `standard`: balanced quality and cost
- `deep`: coverage and risk discovery

When there is no explicit override, the orchestrator chooses based on page
breadth and flow depth:

- small/simple: librarian, designer, and 1-2 reviewers
- medium/normal: librarian, designer, and 3 reviewers
- large/pages-many: breadth expansion across pages or flows
- complex/risky: depth expansion on the same flow
- large+complex: staged breadth, then depth on risky flows

The run records the decision in:

```text
.poison/runs/<run-id>/scope-assessment.md
```

If the user asks for `fast` while risk is high, continue fast and record skipped
risk in `scope-assessment.md` and the final report.

## Review Modes

Runs without a clear target produce direction synthesis and no vote:

```text
.poison/runs/<run-id>/direction-synthesis.md
```

Runs with a target use one vote per reviewer:

```text
PASS | PASS_WITH_FIXES | FAIL | BLOCKED
```

The arbiter summarizes target, vote tally, majority position, minority concerns,
evidence-backed blockers, designer discretion items, backlog items, and rejected
personal-taste findings in `review-summary.md`.

Reviewer votes cannot force features outside the run contract and cannot remove
designer discretion inside the approved scope.

## Completion Audit

Completion audit is a branch of review mode, not a separate mode.

It compares design/spec/PRD, poison core, run contract, screenshots, runtime
evidence, and optional source evidence. It does not modify code.

Outputs:

```text
.poison/runs/<run-id>/completion-audit-packet.md
.poison/runs/<run-id>/completion-report.md
```

Completion states:

- `implemented`: verified in screenshot, runtime, or source evidence
- `partial`: implementation exists but key state, interaction, content, or
  responsive behavior is missing
- `missing`: no verifiable implementation
- `deviation`: implementation conflicts with design, poison core, or run
  contract
- `blocked`: design, runtime, screenshots, or evidence are insufficient

Completion audit conclusions must be evidence-backed. Unsupported opinions do
not count toward completion labels. Percentages require a later deterministic
denominator and must not be published by V3c.

## Visual Quality And Memory

Visual poison is the minimum negative standard. Positive signals belong in
visual quality pluses and user taste:

- `skills/poison/references/visual-quality-pluses.md`
- `.poison/context/user-design-taste.md`

Visual memory records current product continuity:

```text
.poison/context/visual-memory.md
```

Designer and reviewer flows must distinguish:

- visual poison: negative taxonomy-backed issue
- visual quality plus: positive quality signal
- user design taste: user-specific preference
- visual memory: established product continuity

Changing visual memory requires rationale and a decision record.

## Arbiter Rules

The arbiter owns deduplication, severity review, scope filtering, vote summary,
repair-plan creation, and backlog routing.

The arbiter must:

- use the full poison taxonomy when consolidating visual poison findings
- use [Evidence Model](./evidence-model.md) for severity
- downgrade E4-only findings to suggestion or designer discretion
- reject out-of-scope recommendations
- separate visual poison from visual quality plus
- respect user taste without overriding usability, accessibility, trust, or run
  contract evidence

Reviewers do not directly command builders. Builders act from an arbiter repair
plan or an explicit user decision.
