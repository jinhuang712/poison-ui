# Contributing

This project is in early design and scaffolding.

## Ground Rules

- Keep `WORKFLOW.md` project-neutral.
- Put repository-specific agent policy in `AGENTS.md` and `CLAUDE.md`.
- Put product, skill, command, role, mode, runtime, and gate behavior in the relevant `docs/plan/**` file or future `skills/poison/**` files.
- Keep `poison_execution_plan_zh.md` as an index, not a single huge reference.
- Keep changes small and evidence-backed.
- Do not claim UI work is complete without screenshots or explicit text-only scope.

## Validation

For documentation-only changes, run:

```bash
diff -u AGENTS.md CLAUDE.md
rg -n "[ \t]+$" WORKFLOW.md poison_execution_plan_zh.md docs/plan AGENTS.md CLAUDE.md README.md CONTRIBUTING.md SECURITY.md CHANGELOG.md
```

For CLI changes, run:

```bash
node bin/poison.mjs --help
```
