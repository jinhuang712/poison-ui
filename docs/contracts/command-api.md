# Command API Contract

This file owns the public command and deterministic action contract. V1 supports
the review-first subset; later versions can activate additional modes and
actions defined here.

## Executable

V1 exposes one executable mapping: `poison` to `./bin/poison.mjs`.

Supported invocation forms:

```bash
node bin/poison.mjs [action-or-mode] [options]
npx poison-ui [action-or-mode] [options]
poison [action-or-mode] [options]
```

## Doctor

`poison doctor` is a read-only project inspection command for agents and users.
It prints JSON with the CLI path, project root, `.poison/context` readiness,
run count, latest run path/status, and whether `design/manifest.json` exists.
It must not mutate repository state.

Set `POISON_CAPTURE_MODE=degraded` to force explicit degraded evidence capture
instead of trying Playwright browser automation. This is useful for deterministic
tests and non-browser environments.

## Modes

Long-term conceptual modes:

- `seed`
- `evolve`
- `full`
- `review`
- `harden`

`auto` is command behavior, not a separate mode. In auto behavior, the
orchestrator assesses input completeness and records the chosen mode plus reason
in `.poison/runs/<run-id>/readiness-assessment.md`.

V1 only requires `review`. Other modes are roadmap targets.

## User-Facing Examples

```bash
poison --input prd.md --url http://localhost:5173
poison seed --input idea.md
poison evolve --name checkout-polish --url http://localhost:5173
poison review --run .poison/runs/003-full
poison review --design docs/design.md --url http://localhost:5173 --audit completion
poison harden --run .poison/runs/004-evolve-checkout
```

## V1 Deterministic Action Mappings

These actions are required for the V1 review-first dry-run:

```bash
poison init
poison doctor
poison new-run --mode review --name poisoned-demo
poison capture --url http://localhost:5173 --run .poison/runs/001-poisoned-demo
poison review --run .poison/runs/001-poisoned-demo
poison schema-check --run .poison/runs/001-poisoned-demo
poison gate --run .poison/runs/001-poisoned-demo
```

## V2a Deterministic Action Mapping

This action initializes the protected baseline after a V1 run has passed gate:

```bash
poison init-protected-features --run .poison/runs/001-poisoned-demo
```

## V2b Deterministic Action Mapping

This action writes repair-plan artifacts from V1 finding IDs after the
protected baseline is ready:

```bash
poison repair-plan --run .poison/runs/001-poisoned-demo
```

## V2c Deterministic Action Mapping

This action routes planned repair items into the arbiter buckets without
executing repairs:

```bash
poison arbiter-route --run .poison/runs/001-poisoned-demo
```

## V2d Deterministic Action Mapping

This action writes one bounded harden round from the arbiter-selected current
repair and then returns the run to capture for fresh evidence:

```bash
poison harden --run .poison/runs/001-poisoned-demo
```

## V2e Deterministic Action Mapping

This action writes protected-feature regression results after the bounded
repair round has been recaptured, reviewed, and gated again:

```bash
poison regression-check --run .poison/runs/001-poisoned-demo
```

This action writes a visual drift report after protected regression checks. If
before/after screenshots are missing, it records an explicit absence instead of
claiming a visual comparison:

```bash
poison visual-drift --run .poison/runs/001-poisoned-demo
```

## V3a Deterministic Action Mapping

This action publishes the minimal human-facing design handoff from a gated V2
source run:

```bash
poison publish-design --run .poison/runs/001-poisoned-demo
```

## V3b Deterministic Action Mapping

This action expands the published handoff package only with files that map back
to the V3a source artifacts:

```bash
poison publish-handoff --run .poison/runs/001-poisoned-demo
```

## V3c Deterministic Action Mapping

This action writes run-local completion audit labels after the V3b handoff
package passes schema-check. It does not publish percentages or write
`design/review` package output:

```bash
poison audit-completion --run .poison/runs/001-poisoned-demo
```

## V4a Command Semantics Freeze

V4a freezes observable CLI behavior for the implemented V1-V3c commands so
future adapters can call shared command/core behavior without inventing private
semantics.

Current frozen result classes:

| Result class | Exit | stdout | stderr | State mutation |
|---|---:|---|---|---|
| Help | 0 | usage text | empty | none |
| Successful action | 0 | `<command>: ...` | empty | command-specific legal transition |
| Unknown command | 1 | empty | `Unknown command: <name>` | none |
| Missing required option | 1 | empty | option error, such as `--run is required` | none |
| Illegal command order before command starts | 1 | empty | order error | none |
| `schema-check` failure | 1 | `schema-check: FAIL` plus errors | empty | none |
| `gate` hard-check failure from a legal source state | 1 | `gate: FAIL` | empty | writes `gate-report.md` and moves to `blocked` |
| Degraded browser capture fallback | 0 | `capture: degraded evidence recorded` | empty | moves to `captured` with degraded evidence |

When a command moves a run to `blocked`, it must preserve `previousStatus`,
write a concrete `blockedReason`, and set `nextRecommendedAction`.

## Later Deterministic Action Mappings

These actions exist for testing, adapter calls, and dry-run workflows. They are
not separate public entrypoints; they still go through `poison`. They are not V1
requirements unless listed in the V1 mappings above.

```bash
poison init
poison new-run --mode seed --name test-seed
poison assess-readiness --input ./docs/sample-prd.md --run .poison/runs/001-test-seed
poison assess-scope --run .poison/runs/001-test-seed
poison capture --url http://localhost:5173 --run .poison/runs/001-test-seed
poison build-review-packet --run .poison/runs/001-test-seed
poison decision-html --question "choose search layout" --run .poison/runs/001-test-seed
poison ambiguity-check --run .poison/runs/001-test-seed
poison audit-completion --run .poison/runs/001-test-seed
poison schema-check --run .poison/runs/001-test-seed
poison gate --run .poison/runs/001-test-seed
poison update-state --run .poison/runs/001-test-seed
```

## Adapter Rule

Claude Code adapters, Codex adapters, future plugins, and future MCP adapters
must call this command contract or shared core modules. They must not define
their own modes, action names, state transitions, artifact formats, review
schemas, or gate rules.
