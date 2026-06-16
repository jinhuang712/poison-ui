# Repository Structure Design

Historical snapshot: this spec describes the repository-structure migration as
it was planned before the minimal V1 CLI subset existed. For current status,
use [PROGRESS.md](../../../PROGRESS.md).

## Goal

Prepare `poison-ui` for V1 implementation by separating stable project entry
points, high-level design narrative, implementation contracts, skill-facing
instructions, and future source modules.

This change is structural only. It does not implement V1 commands and does not
rewrite the `.poison/context` or `.poison/runs` runtime artifact model beyond
keeping references consistent.

## Scope

In scope:

- Preserve the existing `docs/00-*.md` files as stable high-level design
  entries.
- Add semantic documentation directories for implementation-facing material.
- Keep root-level project state files next to `README.md`: `TODO.md` and
  `CHANGELOG.md`.
- Update `WORKFLOW.md` with project-neutral rules for repositories that split
  high-level docs from implementation contracts.
- Update repository indexes so agents know which document owns each kind of
  information.
- Create empty or minimal source and test directories only where they clarify
  future implementation boundaries.

Out of scope:

- Implementing `poison init`, `new-run`, `gate`, `review`, or other V1 commands.
- Introducing Playwright or other runtime dependencies.
- Changing the user-facing product modes or runtime artifact schema.
- Replacing the existing `docs/00-09` high-level document sequence.

## Chosen Approach

Use a stable-entry plus contract-library structure.

The current `docs/00-09` files remain the durable high-level explanation layer.
They describe why the system exists, how the workflow fits together, and where
the detailed contracts live. They should stay concise and should not grow back
into a single huge reference.

Implementation-facing contracts move into semantic subdirectories:

```text
docs/
  architecture/
    source-layout.md
    adapter-layout.md
  contracts/
    command-api.md
    runtime-artifacts.md
    run-state.md
    output-contract.md
    evidence-model.md
    review-schema.md
    gate-rules.md
  delivery/
    v1-acceptance.md
    dry-run.md
  decisions/
    README.md
```

The `skills/poison/**` tree remains the agent-facing instruction surface:

```text
skills/
  poison/
    SKILL.md
    references/
    roles/
    reviewers/
```

The future implementation surface is:

```text
src/
  cli/
  core/
  tools/
tests/
  fixtures/
  unit/
  integration/
```

## Root State Files

The root directory should expose repository status without requiring readers to
dig through design documents:

```text
README.md
TODO.md
CHANGELOG.md
poison_execution_plan_zh.md
WORKFLOW.md
AGENTS.md
CLAUDE.md
```

Responsibilities:

- `README.md`: public overview, current scaffold status, basic check command,
  and links to the design index.
- `TODO.md`: actionable implementation backlog, open structural follow-ups, and
  immediate next steps.
- `CHANGELOG.md`: completed repository changes and contract movement.
- `poison_execution_plan_zh.md`: stable product and implementation index.
- `WORKFLOW.md`: project-neutral collaboration rules only.
- `AGENTS.md` and `CLAUDE.md`: repository-specific agent entry rules.

## Source Boundaries

`bin/poison.mjs` should stay a thin executable wrapper. It should delegate to
`src/cli/dispatch.mjs` once implementation starts.

`src/cli/` owns argument parsing and action dispatch. It must not define product
rules, state schemas, review contracts, or gate semantics.

`src/core/` owns reusable deterministic logic:

- artifact paths and safe writes
- run ID and run state helpers
- schema metadata validation
- SoT and context-pack helpers

`src/tools/` owns one deterministic action per command mapping. Tools may call
`src/core/` modules, but tools should not become a second product spec.

`tests/` follows the same boundary: unit tests for `core`, targeted tests for
`tools`, and integration tests for CLI dry-run flows.

## Documentation Boundaries

High-level docs:

- `docs/00-overview.md`
- `docs/01-repository-architecture.md`
- `docs/02-core-runtime-contracts.md`
- `docs/03-modes-and-command-api.md`
- `docs/04-harness-adapter-contract.md`
- `docs/05-autonomous-workflow.md`
- `docs/06-review-and-audit-pipeline.md`
- `docs/07-tools-gates-and-state.md`
- `docs/08-skill-and-role-contracts.md`
- `docs/09-v1-delivery.md`

These files can keep context and narrative, but the durable implementation
contracts should be copied or moved into the semantic contract documents. After
that, the high-level files should link to the contract owners instead of
duplicating full details.

Implementation contract docs:

- `docs/contracts/command-api.md`: public mode/action names, option shapes, and
  CLI examples.
- `docs/contracts/runtime-artifacts.md`: `.poison/context` and `.poison/runs`
  artifact inventory.
- `docs/contracts/run-state.md`: run states, transitions, legal command order,
  and blocked behavior.
- `docs/contracts/output-contract.md`: required Markdown metadata, required
  sections, and JSON fields.
- `docs/contracts/evidence-model.md`: E0-E4 evidence levels and severity rules.
- `docs/contracts/review-schema.md`: reviewer, arbiter, and completion audit
  output shapes.
- `docs/contracts/gate-rules.md`: gate inputs, checks, verdicts, and failure
  handling.

Architecture docs:

- `docs/architecture/source-layout.md`: intended repository tree and file
  ownership.
- `docs/architecture/adapter-layout.md`: platform-neutral core plus Claude and
  Codex adapter boundaries.

Delivery docs:

- `docs/delivery/v1-acceptance.md`: V1 acceptance criteria.
- `docs/delivery/dry-run.md`: dry-run command sequence and expected outputs.

Decisions:

- `docs/decisions/README.md`: decision log index. Detailed decision records can
  be added only when there is a durable decision worth preserving.

## Migration Strategy

1. Add semantic docs directories and root `TODO.md`.
2. Move the detailed source layout into `docs/architecture/source-layout.md`.
3. Move adapter rules into `docs/architecture/adapter-layout.md`.
4. Split command, runtime, state, output, evidence, review, and gate contracts
   into `docs/contracts/`.
5. Split V1 acceptance and dry-run into `docs/delivery/`.
6. Update `poison_execution_plan_zh.md`, `README.md`, and `docs/00-09` so they
   point to the new owners.
7. Update `WORKFLOW.md` with a project-neutral rule for state files and contract
   ownership.
8. Update `CHANGELOG.md`.
9. Run the existing repository check.
10. Commit the structure change as one coherent documentation batch.

## Verification

Use these checks after the structure update:

```bash
npm run check
```

Manual verification:

- Root files include `README.md`, `TODO.md`, and `CHANGELOG.md`.
- `poison_execution_plan_zh.md` remains an index.
- `docs/00-09` still exist.
- Detailed implementation contracts have clear owners under
  `docs/contracts/`.
- `WORKFLOW.md` stays project-neutral and does not mention Poison-specific
  command names or product contracts.

## Risks

- Duplicated contract text can drift while migration is partial. Mitigation:
  high-level docs should link to new owner files after the split.
- Creating too many empty files can make the repo look more implemented than it
  is. Mitigation at the time was to keep source and test directories minimal
  and make the root `TODO.md` state the current implementation status.
- `skills/poison/references` may duplicate `docs/contracts`. Mitigation:
  `docs/contracts` owns implementation contracts; `skills/poison/references`
  owns agent-facing operational guidance derived from those contracts.

## Approval

The user approved approach A: stable high-level entries plus a contract library.
The user also requested root-level `TODO.md` and `CHANGELOG.md` next to
`README.md`, and explicitly asked to update `WORKFLOW.md`.
