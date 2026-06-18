---
name: poison
description: Controlled UI prototype review workflow for evidence-backed poison findings, bounded hardening, design handoff, and mechanical gates.
---

# Poison

Use this skill when the user wants to initialize Poison runtime state, create a
review run, capture or register evidence, review an AI-made UI prototype, run
schema/gate checks, run the bounded hardening loop, or publish the design
handoff package.

## Required Reading

Before changing behavior, read the owning contract instead of inferring from
this skill file:

- Command behavior: `docs/contracts/command-api.md`
- Runtime artifacts: `docs/contracts/runtime-artifacts.md`
- Run state: `docs/contracts/run-state.md`
- Output/schema checks: `docs/contracts/output-contract.md`
- Review shape: `docs/contracts/review-schema.md`
- Gate rules: `docs/contracts/gate-rules.md`
- Design handoff: `docs/contracts/design-folder.md`
- Current version ladder: `docs/delivery/version-roadmap.md`
- Dry run and acceptance: `docs/delivery/dry-run.md`,
  `docs/delivery/v1-acceptance.md`

The implementation index remains `poison_execution_plan_zh.md`; keep it as an
index and update detailed owners under `docs/` when behavior changes.

## Agent Behavior

When this skill is invoked, act like an operator, not a menu. Inspect the target
repository and run the next safe command instead of asking the user to choose
from the whole workflow.

Default behavior:

1. Resolve the CLI command in this order:
   - `poison` when it is on `PATH`
   - `node ~/.codex/skills/poison/bin/poison.mjs`
   - `node ~/.claude/skills/poison/bin/poison.mjs`
   - `node <this-skill-directory>/bin/poison.mjs`
2. If `.poison/context` is missing, run `poison init`.
3. If the user gives a prototype URL, create or reuse a review run, capture,
   review, schema-check, and gate it.
4. If the user gives an existing `.poison/runs/<run-id>` path, continue from
   that run's state and run the next valid command.
5. Ask one focused question only when required input is unavailable, usually the
   prototype URL or the exact run path.

Do not respond with a numbered menu unless the user explicitly asks for options
or planning.

Keep user-facing replies short and in the user's language. Report only:

- what was checked
- what was changed
- the one next input needed, if any

When no URL or run path is available, do not explain the whole product. Run
`poison doctor`, initialize missing `.poison` state when safe, and ask for the
prototype URL.

After `poison gate`, run:

```bash
poison brief --run <run-path>
```

Use that brief as the user-facing result. The final response must include:

- whether the gate is only a mechanical pass or a product-ready pass
- evidence limitations, especially degraded capture or non-target runtime
  surfaces
- the highest-priority fixes in order
- acceptance criteria for the fixes
- exact artifact paths only as supporting references

Do not finish with only command outputs, artifact inventories, or "work
completed" language.

If `poison capture` blocks because browser capture is unavailable, run
`poison doctor --capture --url <url>` and report the root cause. Do not continue
with degraded evidence unless the user explicitly accepts `--allow-degraded`.

Good first response for "use poison on this repo":

```text
I will initialize Poison state here, then I need the prototype URL to capture evidence.
```

Then run:

```bash
poison init
```

Good first response when a URL is provided:

```text
I will create a review run, capture evidence from the URL, write the review artifacts, and run schema/gate checks.
```

Then run:

```bash
poison init
poison new-run --mode review --name <short-target-name>
poison capture --url <url> --run .poison/runs/<run-id>
poison review --run .poison/runs/<run-id>
poison schema-check --run .poison/runs/<run-id>
poison gate --run .poison/runs/<run-id>
poison brief --run .poison/runs/<run-id>
```

## Invocation

Prefer the installed `poison` executable when it is available:

```bash
poison --help
```

When the executable is not on `PATH`, run the CLI from this installed skill
directory:

```bash
node bin/poison.mjs --help
```

If this skill is installed under `~/.codex/skills/poison`, the fallback command
from another project is:

```bash
node ~/.codex/skills/poison/bin/poison.mjs --help
```

The user should not normally need the fallback after running
`scripts/install-poison-ui.sh`; it links `poison` into `~/.local/bin`.

## Core Workflow

Run commands in the target project being inspected. Replace the URL with the
prototype URL.

```bash
poison init
poison new-run --mode review --name poisoned-demo
poison capture --url http://localhost:5173 --run .poison/runs/001-poisoned-demo
poison review --run .poison/runs/001-poisoned-demo
poison schema-check --run .poison/runs/001-poisoned-demo
poison gate --run .poison/runs/001-poisoned-demo
```

After the V1 gate passes, V2 and V3 commands may be run in sequence:

```bash
poison init-protected-features --run .poison/runs/001-poisoned-demo
poison repair-plan --run .poison/runs/001-poisoned-demo
poison arbiter-route --run .poison/runs/001-poisoned-demo
poison harden --run .poison/runs/001-poisoned-demo
poison regression-check --run .poison/runs/001-poisoned-demo
poison visual-drift --run .poison/runs/001-poisoned-demo
poison publish-design --run .poison/runs/001-poisoned-demo
poison publish-handoff --run .poison/runs/001-poisoned-demo
poison audit-completion --run .poison/runs/001-poisoned-demo
```

## Operating Rules

- Keep `.poison/context` as trackable project state.
- Treat `.poison/runs/<run-id>` as audit/source evidence.
- Treat `design/` as the target project handoff package after V3 publish.
- Do not define command names, artifact schemas, state transitions, review
  fields, or gate rules in this file. Update the owning contract files.
- Preserve evidence limitations in review summaries and gate reports.
- If browser automation is unavailable, block capture and run doctor. Record
  degraded evidence only when the user explicitly accepts `--allow-degraded`;
  never claim screenshots or console observations from degraded evidence.
- Run `npm test` before claiming implementation changes are complete.
