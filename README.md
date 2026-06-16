# poison-ui

`poison-ui` is an early-stage, platform-neutral skill and command design for controlled UI prototype evolution. It is being designed to support Claude Code, Codex, and agentic workflows through one command, shared contracts, and evidence-based review gates.

The project is currently in planning/scaffolding. The implementation plan index is [poison_execution_plan_zh.md](./poison_execution_plan_zh.md), and detailed contracts live under [docs](./docs).

## Goals

- Generate, evolve, review, and harden high-fidelity runnable UI prototypes.
- Keep product context, visual memory, reviewer feedback, and gate evidence consistent across runs.
- Support one public command with deterministic internal tools.
- Allow Claude Code and Codex adapters without diverging workflow contracts.

## Architecture

```text
1 skill + 3-5 modes + 1 public command + N internal tools
```

Planned modes:

- `seed`
- `evolve`
- `full`
- `review`
- `harden`

`auto` is command behavior, not a separate mode.

## Repository Layout

```text
bin/poison.mjs
skills/poison/SKILL.md
skills/poison/references/
docs/
poison_execution_plan_zh.md
poison_taxonomy_single_word_full.md
WORKFLOW.md
AGENTS.md
CLAUDE.md
```

## CLI

The CLI is currently a placeholder that exposes help and points to the implementation plan.

```bash
node bin/poison.mjs --help
```

Planned public command:

```bash
poison [action-or-mode] [options]
```

## Development Workflow

Read [WORKFLOW.md](./WORKFLOW.md) first. This file is intentionally project-neutral. Repository-specific agent instructions live in [AGENTS.md](./AGENTS.md) and [CLAUDE.md](./CLAUDE.md). Product and skill behavior belongs in [poison_execution_plan_zh.md](./poison_execution_plan_zh.md) and future `skills/poison/**` files.

Do not grow [poison_execution_plan_zh.md](./poison_execution_plan_zh.md) back into a single huge reference. Update the relevant file under [docs](./docs).

Root project state is tracked in [TODO.md](./TODO.md) and
[CHANGELOG.md](./CHANGELOG.md). High-level design entries stay in [docs](./docs),
while implementation-facing contracts are owned by the semantic subdirectories
under `docs/architecture`, `docs/contracts`, `docs/delivery`, and
`docs/decisions`.

The expected target-project `design/` delivery package is defined in
[docs/contracts/design-folder.md](./docs/contracts/design-folder.md).

## Status

This repository is public scaffolding and design work. Do not treat the CLI or skill as production-ready yet.

## License

MIT
