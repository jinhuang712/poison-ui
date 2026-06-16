# Version Roadmap

This file owns Poison's version ladder. It separates the near-term product wedge
from the full long-term design platform.

## First User

The first user is a vibe coding developer who can ship with AI but does not
know design, frontend craft, or UI/UX well enough to judge an interface before
it feels wrong. They are frustrated by AI-generated prototype screenshots and
demos that look plausible at first glance but are full of poison: unclear
hierarchy, awkward flows, generic components, fake polish, broken states, and
interaction choices that make them want to stop using the result.

Poison's first promise is not "generate every design artifact." It is:

```text
Point Poison at the current AI-made prototype, show it the intended design or
product context, and get a concrete, evidence-backed report of what is poisoned,
what to fix first, and what must not regress.
```

## Version Principles

- Keep the 99 percent path cheap: review an existing prototype before trying to
  generate an entire product design system.
- Make each version independently useful and testable.
- Treat rich `design/` output as a later publish target, not as a prerequisite
  for early review.
- Preserve audit evidence in `.poison/runs/<run-id>` even when the human-facing
  `design/` package only publishes a small subset.
- Move subjective design judgment through explicit review reports and warnings
  before turning it into hard gate behavior.

## V0: Documentation And Contract Scaffold

Status: in progress.

User job: make the repository implementable without turning the execution plan
back into a single huge document.

Includes:

- Repository structure and owner docs.
- Product mission and first-user wedge.
- Runtime artifact, command, state, gate, review, evidence, and design-folder
  contracts.
- Version roadmap and progress tracking.
- Placeholder CLI help for baseline verification.

Non-goals:

- Functional Poison commands beyond help output.
- Real screenshot capture, review, gate, or design publishing.
- Full skill packaging.

Exit criteria:

- Root README, TODO, CHANGELOG, `docs/README.md`, and execution plan index agree
  on current status.
- V1 scope is review-first and does not require full generation or full
  `design/` output.
- Run-state and gate contracts are precise enough for implementation planning.

## V1: Review-First Poison Detector

Status: planned.

User job: "I have an AI-made local UI demo. Tell me why it feels poisoned and
what to fix first."

Includes:

- `poison init` for minimal `.poison/context` setup.
- `poison new-run --mode review --name <name>` for an auditable run folder.
- `poison capture --url <local-url> --run <run>` when browser capability exists,
  with explicit degraded/manual evidence output when it does not.
- `poison review --run <run>` to build a review packet and produce
  `review-summary.md` plus actionable findings.
- `poison schema-check --run <run>` for required JSON and Markdown structure.
- `poison gate --run <run>` as a mechanical readiness check, not a final design
  taste tribunal.
- A repair-oriented `nextRecommendedAction` in `run-state.json`.

Hard V1 gate scope:

- Legal run-state transitions.
- Required artifacts for the active review run exist and parse.
- Capture evidence exists, or missing capture capability is explicitly recorded.
- Severe console/runtime errors are failures when console evidence was captured.
- Blocked state cannot be marked complete without a recovery transition.

V1 warnings, not hard failures:

- Visual quality concerns.
- UX completion concerns.
- Frontend handoff completeness.
- Placeholder or generic-looking UI copy.
- Visual taxonomy coverage.
- Protected-feature regression risk.
- Visual memory drift.

Non-goals:

- Generating a full prototype from scratch.
- Full-spec mode.
- Automatic design system extraction.
- Multi-reviewer ensemble as a required path.
- Automatic code repair.
- Full `design/` package publishing.

Exit criteria:

- The dry-run sequence can create a review run, record evidence state, generate
  a review summary, run schema checks, run the mechanical gate, and explain the
  next action.
- The CLI and tests prove degraded evidence paths are explicit instead of
  silently passing.

## V2: Controlled Hardening Loop

Status: planned after V1.

User job: "Now help me improve this prototype without breaking the parts that
already work."

Includes:

- `harden` and narrow `evolve` flows.
- Protected features initialization and regression tracking.
- Repair plan generation.
- One or more repair rounds with explicit acceptance criteria.
- Optional design-folder publish for the current slice.
- Minimal screen and interaction handoff docs when implementation needs them.

Non-goals:

- Deep multi-agent design generation for whole products.
- Mandatory full `design/` tree.
- Pixel-perfect visual diffing.

Exit criteria:

- Poison can move a run from review findings to a bounded repair plan and back
  through capture, review, and gate.
- Protected features are represented as explicit constraints rather than hidden
  memory.

## V3: Full Design Package Mode

Status: planned after hardening loops are reliable.

User job: "Generate or consolidate a full high-fidelity design package that a
frontend implementer can use."

Includes:

- `seed`, `evolve`, and `full` generation paths.
- Rich `design/` publishing from one or more `.poison/runs`.
- Screen, flow, interaction, ADR, review, and handoff files when useful.
- Historical prototype snapshots and raw evidence references when preserving
  them helps audit or comparison.
- Stronger completion audit and design-readiness reports.

Non-goals:

- Treating every maximal `design/` file as mandatory.
- Replacing human product decisions when the product context is ambiguous.

Exit criteria:

- A full mode run can publish a coherent `design/` package with `sourceRunId`
  traceability and a clear implementation map.

## V4: Platform And Adapter Maturity

Status: future.

User job: "Use the same Poison contract across Codex, Claude Code, plugins, MCP
adapters, and project templates."

Includes:

- Adapter parity for supported harnesses.
- Package-ready skill references.
- Stable command error and exit semantics.
- Stronger CI coverage and fixture-based contract tests.
- Optional deeper visual checks when reliable automation exists.

Non-goals:

- Harness-specific forks of Poison behavior.
- Hidden adapter contracts that bypass the command and runtime contract owners.
