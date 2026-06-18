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
- If browser automation is unavailable, record degraded evidence explicitly
  instead of claiming screenshots or console observations.
- Run `npm test` before claiming implementation changes are complete.
