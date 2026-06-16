---
name: poison
description: Controlled UI prototype review workflow for evidence-backed poison findings and mechanical V1 gates.
---

# Poison

Use this skill when the user wants to initialize Poison runtime state, create a
review run, capture or register evidence, review an AI-made UI prototype, run a
schema check, or run the mechanical gate.

## Required Reading

Before changing behavior, read the owning contract instead of inferring from
this skill file:

- Command behavior: `docs/contracts/command-api.md`
- Runtime artifacts: `docs/contracts/runtime-artifacts.md`
- Run state: `docs/contracts/run-state.md`
- Output/schema checks: `docs/contracts/output-contract.md`
- Review shape: `docs/contracts/review-schema.md`
- Gate rules: `docs/contracts/gate-rules.md`
- V1 acceptance and dry-run: `docs/delivery/v1-acceptance.md`,
  `docs/delivery/dry-run.md`

The implementation index remains `poison_execution_plan_zh.md`; keep it as an
index and update detailed owners under `docs/` when behavior changes.

## V1 Commands

Use the single executable:

```bash
node bin/poison.mjs init
node bin/poison.mjs new-run --mode review --name poisoned-demo
node bin/poison.mjs capture --url http://localhost:5173 --run .poison/runs/001-poisoned-demo
node bin/poison.mjs review --run .poison/runs/001-poisoned-demo
node bin/poison.mjs schema-check --run .poison/runs/001-poisoned-demo
node bin/poison.mjs gate --run .poison/runs/001-poisoned-demo
```

V1 is review-first. It may record degraded evidence when automated browser
capture is unavailable. Do not claim visual findings from screenshots or
runtime console output unless those artifacts exist.

## Operating Rules

- Keep `.poison/context` as trackable project state.
- Treat `.poison/runs/<run-id>` as audit/source evidence.
- Treat full `design/` folder publishing as V2/V3 work unless the roadmap
  changes.
- Do not define command names, artifact schemas, state transitions, review
  fields, or gate rules in this file. Update the owning contract files.
- Preserve evidence limitations in review summaries and gate reports.
- Run `npm test` before claiming implementation changes are complete.
