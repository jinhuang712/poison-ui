# Repository Structure Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the repository documentation and scaffold boundaries so V1 implementation can start from stable source, contract, skill, and status-file owners.

**Architecture:** Keep `docs/00-09` as stable high-level entries and add semantic implementation-owner directories under `docs/architecture`, `docs/contracts`, and `docs/delivery`. Add root `TODO.md`, update `WORKFLOW.md` with project-neutral ownership rules, and create minimal scaffold README files for future `src` and `tests` boundaries without implementing V1 commands.

**Tech Stack:** Markdown documentation, Node.js package metadata, existing `npm run check` verification.

---

## File Structure

- Create `TODO.md`: root actionable backlog and open structural follow-ups.
- Modify `CHANGELOG.md`: record the repository structure cleanup under Unreleased.
- Modify `WORKFLOW.md`: add project-neutral state-file and contract-owner guidance.
- Modify `README.md`: point readers to root state files and new documentation owners.
- Modify `poison_execution_plan_zh.md`: update document map to include semantic docs.
- Modify `docs/01-repository-architecture.md`: convert detailed structure block into links and summary.
- Modify `docs/02-core-runtime-contracts.md`: link to runtime, run-state, and output contract owners.
- Modify `docs/03-modes-and-command-api.md`: link to command contract owner.
- Modify `docs/04-harness-adapter-contract.md`: link to adapter layout owner.
- Modify `docs/06-review-and-audit-pipeline.md`: link to evidence and review schema owners.
- Modify `docs/07-tools-gates-and-state.md`: link to gate rules owner.
- Modify `docs/09-v1-delivery.md`: link to V1 acceptance and dry-run owners.
- Create `docs/architecture/source-layout.md`: source tree and ownership contract.
- Create `docs/architecture/adapter-layout.md`: adapter boundary contract.
- Create `docs/contracts/command-api.md`: mode/action command contract.
- Create `docs/contracts/runtime-artifacts.md`: `.poison` artifact inventory.
- Create `docs/contracts/run-state.md`: lifecycle and command-order contract.
- Create `docs/contracts/output-contract.md`: Markdown/JSON artifact schema contract.
- Create `docs/contracts/evidence-model.md`: E0-E4 and severity contract.
- Create `docs/contracts/review-schema.md`: reviewer, arbiter, and completion audit output contract.
- Create `docs/contracts/gate-rules.md`: gate check contract.
- Create `docs/delivery/v1-acceptance.md`: V1 acceptance checklist.
- Create `docs/delivery/dry-run.md`: dry-run command sequence.
- Create `docs/decisions/README.md`: decision log index.
- Create `src/README.md`, `src/cli/README.md`, `src/core/README.md`, `src/tools/README.md`: source ownership scaffold.
- Create `tests/README.md`, `tests/fixtures/README.md`, `tests/unit/README.md`, `tests/integration/README.md`: test ownership scaffold.
- Modify `skills/poison/references/README.md`: explain references derive from contract docs and are agent-facing.

### Task 1: Root Status And Workflow Owners

**Files:**
- Create: `TODO.md`
- Modify: `CHANGELOG.md`
- Modify: `WORKFLOW.md`
- Modify: `README.md`
- Modify: `poison_execution_plan_zh.md`

- [ ] **Step 1: Create root TODO.md**

Create `TODO.md` with this content:

```markdown
# TODO

This file tracks real repository work. Keep it actionable and remove or update
items as they are completed.

## Next Implementation Steps

- Split high-level design details into semantic docs under `docs/architecture`,
  `docs/contracts`, and `docs/delivery`.
- Expand `skills/poison/SKILL.md` from scaffold into the operational skill
  entrypoint after contract owners are stable.
- Implement the thin CLI dispatch layer and deterministic V1 tools listed in
  `docs/delivery/v1-acceptance.md`.
- Add tests for core artifact helpers, run-state validation, schema checking,
  and CLI dry-run flows.

## Structural Follow-Ups

- Keep `docs/00-09` as stable high-level entries and link them to detailed
  contract owners instead of growing them.
- Keep `.poison/context` trackable by default; only ignore generated run
  evidence such as screenshots, console logs, and temporary files.
- Keep `skills/poison/references` aligned with `docs/contracts` without making
  the skill references a second source of truth.
```

- [ ] **Step 2: Update CHANGELOG.md**

Under `## Unreleased`, add:

```markdown
- Added repository structure design and root `TODO.md` ownership.
- Split planned implementation contracts into semantic documentation owners.
- Documented future `src` and `tests` ownership boundaries without implementing
  V1 commands.
```

- [ ] **Step 3: Update WORKFLOW.md**

After the `Document Boundaries` table, add:

```markdown
When a repository has root state files such as `README.md`, `TODO.md`, and
`CHANGELOG.md`, keep their responsibilities separate:

- `README.md` introduces the project and points to current documentation.
- `TODO.md` tracks real actionable work and open follow-ups.
- `CHANGELOG.md` records completed changes.

When high-level design documents and implementation contract documents both
exist, keep high-level documents short and route durable contracts to their
specific owner files. Do not let an index or narrative document grow into a
second source of truth for command behavior, runtime schemas, gate rules, or
implementation tasks.
```

- [ ] **Step 4: Update README.md**

In `Development Workflow`, add one paragraph after the existing docs guidance:

```markdown
Root project state is tracked in `TODO.md` and
`CHANGELOG.md`. High-level design entries stay in `docs`,
while implementation-facing contracts are owned by the semantic subdirectories
under `docs/architecture`, `docs/contracts`, and `docs/delivery`.
```

- [ ] **Step 5: Update poison_execution_plan_zh.md document map**

Add rows for:

```markdown
| Source and adapter architecture | `docs/architecture` |
| Implementation contracts | `docs/contracts` |
| V1 acceptance and dry-run | `docs/delivery` |
| Repository TODO | `TODO.md` |
| Changelog | `CHANGELOG.md` |
```

- [ ] **Step 6: Verify root status task**

Run:

```bash
npm run check
```

Expected: exit 0 and help text printed by `node bin/poison.mjs --help`.

- [ ] **Step 7: Commit root status task**

Run:

```bash
git add TODO.md CHANGELOG.md WORKFLOW.md README.md poison_execution_plan_zh.md
git commit -m "docs: add root repository status owners"
```

### Task 2: Architecture And Source Scaffold Owners

**Files:**
- Create: `docs/architecture/source-layout.md`
- Create: `docs/architecture/adapter-layout.md`
- Create: `docs/decisions/README.md`
- Create: `src/README.md`
- Create: `src/cli/README.md`
- Create: `src/core/README.md`
- Create: `src/tools/README.md`
- Create: `tests/README.md`
- Create: `tests/fixtures/README.md`
- Create: `tests/unit/README.md`
- Create: `tests/integration/README.md`
- Modify: `docs/01-repository-architecture.md`
- Modify: `docs/04-harness-adapter-contract.md`
- Modify: `skills/poison/references/README.md`
- Modify: `TODO.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Create architecture source layout doc**

Create `docs/architecture/source-layout.md` with repository tree and ownership:

```markdown
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

- `skills/poison/SKILL.md`: agent-facing skill entrypoint.
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
```

- [ ] **Step 2: Create architecture adapter layout doc**

Create `docs/architecture/adapter-layout.md` with:

```markdown
# Adapter Layout

Poison supports Claude Code and Codex as first-class harnesses without creating
separate product contracts.

## Source Of Truth

- `docs/contracts`: implementation contracts.
- `skills/poison`: agent-facing skill instructions derived from contracts.
- `src/core` and `src/tools`: deterministic implementation.
- `bin/poison.mjs`: public executable entry.

## Adapter Rule

Adapters can explain how to invoke the shared workflow in a harness. They cannot
define their own modes, review schema, gate rules, run states, output contract,
artifact schema, or reviewer profiles.

## Planned Adapter Files

- `.claude-plugin/plugin.json`
- `.codex-plugin/plugin.json`
- `skills/poison/references/harness-claude.md`
- `skills/poison/references/harness-codex.md`
- `skills/poison/references/adapter-contract.md`

## Capability Degradation

If a harness lacks browser screenshots, console capture, Playwright, or
subagent orchestration, the adapter must record the missing capability and route
to manual evidence, `needs-manual-evidence`, or `blocked`. It must not silently
skip gate evidence.
```

- [ ] **Step 3: Create decisions README**

Create `docs/decisions/README.md`:

```markdown
# Decisions

This directory indexes durable repository and product decisions once they need a
dedicated record.

Use a decision record when a choice is likely to be revisited or affects future
implementation direction. Keep transient task status in the root `TODO.md`.
```

- [ ] **Step 4: Create src README files**

Create these files:

`src/README.md`
```markdown
# Source

Future V1 implementation code lives here. The current repository is still a
planning scaffold; do not treat these directories as implemented commands.
```

`src/cli/README.md`
```markdown
# CLI

Owns argument parsing and action dispatch for `bin/poison.mjs`.

Do not define product contracts, artifact schemas, review rules, or gate logic
here.
```

`src/core/README.md`
```markdown
# Core

Owns reusable deterministic logic such as artifact paths, safe writes, run-state
helpers, schema metadata validation, and SoT/context-pack helpers.
```

`src/tools/README.md`
```markdown
# Tools

Owns one deterministic action per command mapping. Tools call `src/core`
helpers and write `.poison` artifacts according to `docs/contracts`.
```

- [ ] **Step 5: Create tests README files**

Create these files:

`tests/README.md`
```markdown
# Tests

Future tests should verify core helpers, deterministic tools, and CLI dry-run
flows.
```

`tests/fixtures/README.md`
```markdown
# Fixtures

Sample inputs and expected artifact fragments for unit and integration tests.
```

`tests/unit/README.md`
```markdown
# Unit Tests

Focused tests for `src/core` and individual `src/tools` modules.
```

`tests/integration/README.md`
```markdown
# Integration Tests

CLI-level dry-run checks that exercise `bin/poison.mjs` through planned command
flows.
```

- [ ] **Step 6: Update high-level architecture docs**

In `docs/01-repository-architecture.md`, add near the top:

```markdown
Detailed source ownership now lives in
`docs/architecture/source-layout.md`. This file
keeps the high-level architecture narrative and links to the implementation
owner.
```

In `docs/04-harness-adapter-contract.md`, add near the top:

```markdown
Detailed adapter ownership now lives in
`docs/architecture/adapter-layout.md`. This
file keeps the high-level harness contract narrative.
```

- [ ] **Step 7: Update skill reference README**

Replace `skills/poison/references/README.md` with:

```markdown
# Poison References

This directory contains agent-facing operational references derived from the
implementation contracts in `docs/contracts`.

Rules:

- Do not define a second source of truth for command behavior, artifact schemas,
  run states, review schemas, or gate rules here.
- Keep references aligned with `docs/contracts` when contracts change.
- Use these files to make the skill easier for agents to execute, not to change
  product behavior.
```

- [ ] **Step 8: Update TODO and CHANGELOG**

In `TODO.md`, remove the completed structural follow-up about splitting
high-level design details into semantic docs if it has been completed by this
task, and keep remaining items actionable.

In `CHANGELOG.md`, add:

```markdown
- Added architecture owner docs and source/test scaffold boundaries.
```

- [ ] **Step 9: Verify architecture task**

Run:

```bash
npm run check
```

Expected: exit 0 and CLI help output.

- [ ] **Step 10: Commit architecture task**

Run:

```bash
git add docs/architecture docs/decisions src tests docs/01-repository-architecture.md docs/04-harness-adapter-contract.md skills/poison/references/README.md TODO.md CHANGELOG.md
git commit -m "docs: define architecture and scaffold owners"
```

### Task 3: Contract And Delivery Owners

**Files:**
- Create: `docs/contracts/command-api.md`
- Create: `docs/contracts/runtime-artifacts.md`
- Create: `docs/contracts/run-state.md`
- Create: `docs/contracts/output-contract.md`
- Create: `docs/contracts/evidence-model.md`
- Create: `docs/contracts/review-schema.md`
- Create: `docs/contracts/gate-rules.md`
- Create: `docs/delivery/v1-acceptance.md`
- Create: `docs/delivery/dry-run.md`
- Modify: `docs/02-core-runtime-contracts.md`
- Modify: `docs/03-modes-and-command-api.md`
- Modify: `docs/06-review-and-audit-pipeline.md`
- Modify: `docs/07-tools-gates-and-state.md`
- Modify: `docs/09-v1-delivery.md`
- Modify: `TODO.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Create command API contract**

Create `docs/contracts/command-api.md` with:

```markdown
# Command API Contract

V1 exposes one executable mapping: `poison` -> `./bin/poison.mjs`.

Supported conceptual modes:

- `seed`
- `evolve`
- `full`
- `review`
- `harden`

`auto` is command behavior, not a separate mode.

Deterministic action mappings must still go through the same executable:

- `poison init`
- `poison new-run --mode seed --name test-seed`
- `poison init-protected-features --run .poison/runs/001-test-seed`
- `poison assess-readiness --input ./docs/sample-prd.md --run .poison/runs/001-test-seed`
- `poison assess-scope --run .poison/runs/001-test-seed`
- `poison capture --url http://localhost:5173 --run .poison/runs/001-test-seed`
- `poison build-review-packet --run .poison/runs/001-test-seed`
- `poison decision-html --question "选择搜索栏布局" --run .poison/runs/001-test-seed`
- `poison audit-completion --design docs/design.md --url http://localhost:5173 --run .poison/runs/001-test-seed`
- `poison schema-check --run .poison/runs/001-test-seed`
- `poison gate --run .poison/runs/001-test-seed`
- `poison update-state --run .poison/runs/001-test-seed`

Adapters and future plugins must call this command or shared core modules rather
than defining separate command contracts.
```

- [ ] **Step 2: Create runtime artifacts contract**

Create `docs/contracts/runtime-artifacts.md` with the `.poison/context` and
`.poison/runs` inventory from `docs/01-repository-architecture.md` and
`docs/02-core-runtime-contracts.md`, including:

```markdown
# Runtime Artifacts Contract

Canonical product context:

- `.poison/context/poison-core.current.md`
- `.poison/runs/<run-id>/run-contract.md`

Per-run librarian outputs:

- `.poison/runs/<run-id>/context-pack.md`
- `.poison/runs/<run-id>/sot-index.json`
- `.poison/runs/<run-id>/context-health.md`

Trackable context files:

- `.poison/context/poison-core.v1.md`
- `.poison/context/poison-core.current.md`
- `.poison/context/design-decisions.md`
- `.poison/context/constraints.md`
- `.poison/context/guidelines.md`
- `.poison/context/open-questions.md`
- `.poison/context/prototype-map.md`
- `.poison/context/interaction-backlog.md`
- `.poison/context/visual-system.md`
- `.poison/context/visual-memory.md`
- `.poison/context/user-design-taste.md`
- `.poison/context/design-source.md`
- `.poison/context/changelog.md`

Generated run evidence that may be ignored:

- `.poison/runs/*/screenshots/`
- `.poison/runs/*/console.log`
- `.poison/runs/*/tmp/`
```

- [ ] **Step 3: Create run-state contract**

Create `docs/contracts/run-state.md` with the state enum and command-order rules
from `docs/02-core-runtime-contracts.md`.

- [ ] **Step 4: Create output contract**

Create `docs/contracts/output-contract.md` with Markdown metadata, required
sections, JSON required fields, and key artifact list from
`docs/02-core-runtime-contracts.md`.

- [ ] **Step 5: Create evidence model contract**

Create `docs/contracts/evidence-model.md` with E0-E4 evidence levels and
severity rules from `docs/06-review-and-audit-pipeline.md`.

- [ ] **Step 6: Create review schema contract**

Create `docs/contracts/review-schema.md` with reviewer output format, arbiter
repair-plan sections, direction synthesis sections, and completion audit report
sections from `docs/06-review-and-audit-pipeline.md`.

- [ ] **Step 7: Create gate rules contract**

Create `docs/contracts/gate-rules.md` with gate command, checks, placeholder
detectors, report shape, and failure handling from
`docs/07-tools-gates-and-state.md`.

- [ ] **Step 8: Create delivery docs**

Create `docs/delivery/v1-acceptance.md` from the acceptance sections in
`docs/09-v1-delivery.md`.

Create `docs/delivery/dry-run.md` from the dry-run command sequence in
`docs/09-v1-delivery.md`.

- [ ] **Step 9: Link high-level docs to contract owners**

Add owner-link paragraphs near the top of each file:

- `docs/02-core-runtime-contracts.md`: link to `contracts/runtime-artifacts.md`,
  `contracts/run-state.md`, and `contracts/output-contract.md`.
- `docs/03-modes-and-command-api.md`: link to `contracts/command-api.md`.
- `docs/06-review-and-audit-pipeline.md`: link to
  `contracts/evidence-model.md` and `contracts/review-schema.md`.
- `docs/07-tools-gates-and-state.md`: link to `contracts/gate-rules.md`.
- `docs/09-v1-delivery.md`: link to `delivery/v1-acceptance.md` and
  `delivery/dry-run.md`.

- [ ] **Step 10: Update TODO and CHANGELOG**

In `TODO.md`, keep V1 implementation items and remove contract split items that
this task completes.

In `CHANGELOG.md`, add:

```markdown
- Added implementation contract docs for commands, runtime artifacts, state,
  output schemas, evidence, review, and gates.
- Added V1 acceptance and dry-run delivery docs.
```

- [ ] **Step 11: Verify contract task**

Run:

```bash
npm run check
```

Expected: exit 0 and CLI help output.

- [ ] **Step 12: Commit contract task**

Run:

```bash
git add docs/contracts docs/delivery docs/02-core-runtime-contracts.md docs/03-modes-and-command-api.md docs/06-review-and-audit-pipeline.md docs/07-tools-gates-and-state.md docs/09-v1-delivery.md TODO.md CHANGELOG.md
git commit -m "docs: split implementation contracts"
```

### Task 4: Final Consistency Pass

**Files:**
- Modify as needed: `README.md`
- Modify as needed: `poison_execution_plan_zh.md`
- Modify as needed: `TODO.md`
- Modify as needed: `CHANGELOG.md`
- Modify as needed: any high-level docs with stale links

- [ ] **Step 1: Check file tree**

Run:

```bash
find . -maxdepth 3 \( -path './.git' -o -path './node_modules' -o -path './dist' -o -path './build' -o -path './vendor' \) -prune -o -print | sort
```

Expected: root includes `README.md`, `TODO.md`, `CHANGELOG.md`; docs includes
`architecture`, `contracts`, `delivery`, and `decisions`; source/test scaffold
README files exist.

- [ ] **Step 2: Check stale references**

Run:

```bash
rg -n "docs/contracts|docs/architecture|docs/delivery|TODO.md|CHANGELOG.md|not implemented|planning/scaffolding" README.md poison_execution_plan_zh.md docs WORKFLOW.md skills/poison/references/README.md
```

Expected: references point to new owners and still clearly state that V1
commands remain unimplemented.

- [ ] **Step 3: Run repository check**

Run:

```bash
npm run check
```

Expected: exit 0 and CLI help output.

- [ ] **Step 4: Inspect git status**

Run:

```bash
git status --short
```

Expected: only intended files are modified.

- [ ] **Step 5: Commit final consistency task if needed**

If Step 4 shows intended cleanup edits, run:

```bash
git add README.md poison_execution_plan_zh.md TODO.md CHANGELOG.md docs WORKFLOW.md skills src tests
git commit -m "docs: align structure references"
```

If there are no changes, do not create an empty commit.
