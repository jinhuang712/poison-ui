# poison-ui

`poison-ui` is a command-line workflow for evidence-backed UI prototype
review, controlled hardening, design handoff, and platform contract validation.
It is built for vibe coding developers who can ship with AI but still need a
strict process for deciding why a prototype feels poisoned, what to fix first,
and what evidence supports the handoff.

The current numbered roadmap is complete for V0-V4:

- V1 review-first detector
- V2 controlled hardening loop
- V3 design package handoff
- V4 platform and package contract validation

VN backlog items remain parked until promoted with one user job, one artifact
owner, one gate behavior, bounded evidence, and pass/fail tests.

## Install

Install the Codex skill from the latest GitHub source:

```bash
curl -fsSL https://raw.githubusercontent.com/jinhuang712/poison-ui/main/scripts/install-poison-ui.sh | bash -s -- --target codex
```

Install Claude Code:

```bash
curl -fsSL https://raw.githubusercontent.com/jinhuang712/poison-ui/main/scripts/install-poison-ui.sh | bash -s -- --target claude
```

Install both Codex CLI and Claude Code from the pinned `v0.9.0` release:

```bash
curl -fsSL https://raw.githubusercontent.com/jinhuang712/poison-ui/v0.9.0/scripts/install-poison-ui.sh | bash -s -- --target both --ref v0.9.0
```

Uninstall:

```bash
curl -fsSL https://raw.githubusercontent.com/jinhuang712/poison-ui/main/scripts/uninstall-poison-ui.sh | bash -s -- --target codex
curl -fsSL https://raw.githubusercontent.com/jinhuang712/poison-ui/main/scripts/uninstall-poison-ui.sh | bash -s -- --target claude
```

Restart the target CLI after installing the skill. The root-level skill install
includes the CLI implementation and the contract docs, so required reading such
as `docs/contracts/command-api.md` is available inside Codex and Claude Code.
The installer links `poison` into `~/.local/bin`, which is on the default Codex
PATH on this machine.

From npm after publication:

```bash
npm install -g poison-ui
poison --help
```

Without a global install, run from a clone:

```bash
git clone https://github.com/jinhuang712/poison-ui.git
cd poison-ui
npm install
node bin/poison.mjs --help
```

For local development inside this repository:

```bash
npm install
npm test
npm run check
```

`playwright` is an optional dependency. If browser automation is unavailable,
`poison capture` blocks by default, writes `capture-diagnostics.md`, and points
to `poison doctor --capture`. Use `--allow-degraded` only when you explicitly
accept a no-screenshot/no-live-console review.

If the npm package is not installed globally, the Codex-installed skill can run
the CLI through the linked command:

```bash
poison --help
```

## Quickstart

Run these commands in the target project you want to inspect. Replace the URL
with your local prototype URL.

```bash
poison doctor --capture --url http://localhost:5173
poison init

poison new-run \
  --mode review \
  --name poisoned-demo

poison capture \
  --url http://localhost:5173 \
  --run .poison/runs/001-poisoned-demo

poison review \
  --run .poison/runs/001-poisoned-demo

poison schema-check \
  --run .poison/runs/001-poisoned-demo

poison gate \
  --run .poison/runs/001-poisoned-demo

poison brief \
  --run .poison/runs/001-poisoned-demo
```

This produces `.poison/runs/<run-id>` evidence and review artifacts. A passing
gate means the run has the required mechanical evidence and schema structure;
it is not a subjective design-quality guarantee. Use `poison brief` for the
plain-language conclusion, fix order, and acceptance criteria. Add
`--verbose` only when you need internal artifact details.

## Full Workflow

After the V1 gate passes, run the bounded V2 hardening sequence:

```bash
poison init-protected-features --run .poison/runs/001-poisoned-demo
poison repair-plan --run .poison/runs/001-poisoned-demo
poison arbiter-route --run .poison/runs/001-poisoned-demo
poison harden --run .poison/runs/001-poisoned-demo

poison capture \
  --url http://localhost:5173 \
  --run .poison/runs/001-poisoned-demo

poison review --run .poison/runs/001-poisoned-demo
poison gate --run .poison/runs/001-poisoned-demo
poison regression-check --run .poison/runs/001-poisoned-demo
poison visual-drift --run .poison/runs/001-poisoned-demo
```

Then publish the V3 design handoff:

```bash
poison publish-design --run .poison/runs/001-poisoned-demo
poison publish-handoff --run .poison/runs/001-poisoned-demo
poison audit-completion --run .poison/runs/001-poisoned-demo
```

Typical outputs:

- `.poison/runs/<run-id>/review-summary.md`
- `.poison/runs/<run-id>/gate-report.md`
- `.poison/runs/<run-id>/repair-rounds/001/*`
- `.poison/runs/<run-id>/completion-report.md`
- `design/manifest.json`
- `design/handoff.md`
- `design/handoff/implementation-map.md`
- `design/handoff/acceptance-checklist.md`

The workflow intentionally does not generate completion percentages,
`design/screens`, `design/flows`, or `design/review` output in the current
numbered roadmap.

## Command Summary

```text
poison init
poison new-run --mode review --name <name>
poison capture --url <url> --run <run-path>
poison review --run <run-path>
poison schema-check --run <run-path>
poison gate --run <run-path>
poison init-protected-features --run <run-path>
poison repair-plan --run <run-path>
poison arbiter-route --run <run-path>
poison harden --run <run-path>
poison regression-check --run <run-path>
poison visual-drift --run <run-path>
poison publish-design --run <run-path>
poison publish-handoff --run <run-path>
poison audit-completion --run <run-path>
```

The canonical command behavior is owned by
[docs/contracts/command-api.md](./docs/contracts/command-api.md).

## What It Does Not Do Yet

- It does not automatically rewrite your frontend code.
- It does not publish npm releases automatically.
- It does not claim completion percentages.
- It does not implement seed, evolve, or full generation modes.
- It does not implement broad adapter matrices or external harness support.

## Documentation

- Current progress: [PROGRESS.md](./PROGRESS.md)
- Version ladder: [docs/delivery/version-roadmap.md](./docs/delivery/version-roadmap.md)
- Dry run: [docs/delivery/dry-run.md](./docs/delivery/dry-run.md)
- Command contract: [docs/contracts/command-api.md](./docs/contracts/command-api.md)
- Runtime artifacts: [docs/contracts/runtime-artifacts.md](./docs/contracts/runtime-artifacts.md)
- Run state: [docs/contracts/run-state.md](./docs/contracts/run-state.md)
- Design folder contract: [docs/contracts/design-folder.md](./docs/contracts/design-folder.md)
- Package validation report: [docs/delivery/package-validation-report.json](./docs/delivery/package-validation-report.json)
- GitHub release v0.9.0: [docs/delivery/github-release-v0.9.0.md](./docs/delivery/github-release-v0.9.0.md)

The implementation plan index is
[poison_execution_plan_zh.md](./poison_execution_plan_zh.md). Detailed product,
runtime, command, artifact, review, and gate behavior belongs under
[docs](./docs), not in the root README.

## Development Workflow

Read [WORKFLOW.md](./WORKFLOW.md) first. Repository-specific agent instructions
live in [AGENTS.md](./AGENTS.md) and [CLAUDE.md](./CLAUDE.md).

Before claiming a change is complete, run:

```bash
npm test
npm run check
git diff --check
```

## License

MIT
