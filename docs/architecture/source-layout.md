# Source Layout

This file owns the intended repository source layout for V1 implementation.

## Root

- `README.md`: project overview and navigation.
- `TODO.md`: actionable repository backlog.
- `CHANGELOG.md`: completed changes.
- `poison_execution_plan_zh.md`: implementation index.
- `WORKFLOW.md`: project-neutral collaboration workflow.
- `AGENTS.md` and `CLAUDE.md`: repository-specific agent policy.

## Documentation

- `docs/00-09`: stable high-level narrative entries.
- `docs/architecture`: source and adapter layout.
- `docs/contracts`: implementation-facing contracts.
- `docs/delivery`: V1 acceptance and dry-run flows.
- `docs/decisions`: durable decision log index.

## Skill Surface

- `SKILL.md`: Codex-installable skill entrypoint that includes repository docs,
  CLI code, and contracts when installed from the repo root.
- `skills/poison/SKILL.md`: compatibility skill entrypoint for harnesses that
  install from a nested skill path.
- `skills/poison/references`: operational references derived from contracts.
- `skills/poison/roles`: role instructions for orchestrator, librarian,
  designer, reviewer, and arbiter.
- `skills/poison/reviewers`: reviewer profiles.

## Source

- `bin/poison.mjs`: thin executable wrapper.
- `src/cli`: argument parsing and dispatch.
- `src/core`: reusable deterministic logic.
- `src/tools`: one deterministic action per command mapping.

## Tests

- `tests/fixtures`: sample inputs and expected artifact fragments.
- `tests/unit`: focused `src/core` and `src/tools` tests.
- `tests/integration`: CLI dry-run flows.

## Target Project Output

When Poison operates on another project, its human-facing design delivery package
belongs in that target project's `design/` folder. The expected shape is owned by
`docs/contracts/design-folder.md`.
