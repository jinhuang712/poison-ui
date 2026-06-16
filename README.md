# poison-ui

`poison-ui` is an early-stage, platform-neutral skill and command design for
controlled UI prototype review and evolution. It is being designed to support
Claude Code, Codex, and agentic workflows through one command, shared contracts,
and evidence-based review gates.

The project now includes a minimal V1 review-first CLI subset. The
implementation plan index is
[poison_execution_plan_zh.md](./poison_execution_plan_zh.md), current progress
is tracked in [PROGRESS.md](./PROGRESS.md), and detailed docs live under
[docs](./docs).

## Goals

- Help vibe coding developers diagnose AI-generated prototypes that feel
  poisoned because the developer does not yet have enough design, frontend, or
  UI/UX skill to identify the failure points.
- Review and harden existing high-fidelity runnable UI prototypes before trying
  to generate entire design systems.
- Keep product context, visual memory, reviewer feedback, and gate evidence consistent across runs.
- Support one public command with deterministic internal tools.
- Allow Claude Code and Codex adapters without diverging workflow contracts.

## Architecture

```text
1 skill + 3-5 modes + 1 public command + N internal tools
```

Long-term planned modes:

- `seed`
- `evolve`
- `full`
- `review`
- `harden`

`auto` is command behavior, not a separate mode. The first implementation target
is narrower: V1 is a review-first poison detector for an existing local
prototype.

## Repository Layout

```text
bin/poison.mjs
skills/poison/SKILL.md
skills/poison/references/
docs/
PROGRESS.md
poison_execution_plan_zh.md
poison_taxonomy_single_word_full.md
WORKFLOW.md
AGENTS.md
CLAUDE.md
```

## CLI

The CLI exposes the V1 review-first dry-run path:

```bash
node bin/poison.mjs --help
node bin/poison.mjs init
node bin/poison.mjs new-run --mode review --name poisoned-demo
node bin/poison.mjs capture --url http://localhost:5173 --run .poison/runs/001-poisoned-demo
node bin/poison.mjs review --run .poison/runs/001-poisoned-demo
node bin/poison.mjs schema-check --run .poison/runs/001-poisoned-demo
node bin/poison.mjs gate --run .poison/runs/001-poisoned-demo
```

The current capture command records explicit degraded evidence when automated
browser capture is unavailable. It does not claim live visual or console
observations without evidence artifacts.

## Development Workflow

Read [WORKFLOW.md](./WORKFLOW.md) first. This file is intentionally project-neutral. Repository-specific agent instructions live in [AGENTS.md](./AGENTS.md) and [CLAUDE.md](./CLAUDE.md). [poison_execution_plan_zh.md](./poison_execution_plan_zh.md) is an implementation index; product and skill behavior belongs in the relevant owner files under [docs](./docs) and `skills/poison/**`.

Do not grow [poison_execution_plan_zh.md](./poison_execution_plan_zh.md) back into a single huge reference. Update the relevant file under [docs](./docs).

Root project state is tracked in [TODO.md](./TODO.md) and
[CHANGELOG.md](./CHANGELOG.md). Current implementation readiness is tracked in
[PROGRESS.md](./PROGRESS.md). High-level design entries stay in [docs](./docs),
while implementation-facing contracts are owned by the semantic subdirectories
under `docs/architecture`, `docs/contracts`, `docs/delivery`, and
`docs/decisions`. The detailed docs index is [docs/README.md](./docs/README.md).

The version ladder and V1 review-first scope are defined in
[docs/delivery/version-roadmap.md](./docs/delivery/version-roadmap.md).

The expected target-project `design/` delivery package is defined in
[docs/contracts/design-folder.md](./docs/contracts/design-folder.md).

## Status

This repository is public early implementation work. The V1 review-first subset
is test-covered, but later seed/evolve/full/harden modes and full design folder
publishing are not implemented yet.

## License

MIT
