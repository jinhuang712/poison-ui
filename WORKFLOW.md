# WORKFLOW

This file defines a reusable collaboration workflow for agent-assisted projects.
It must stay project-neutral: it can be copied into another repository without
bringing along product-specific features, architecture, tools, roles, or domain
decisions.

Project-specific instructions belong in the local agent entry files, such as
`AGENTS.md` and `CLAUDE.md`. Product design, feature behavior, implementation
plans, runtime contracts, and skill capabilities belong in project documents,
source files, or dedicated specs.

## Principles

- Keep durable decisions in files, not only in chat.
- Separate generic workflow from project-specific policy and product behavior.
- Ask when uncertainty would affect scope, correctness, user experience, or
  irreversible work.
- Prefer small, reviewable changes with explicit verification.
- Preserve user work. Do not revert unrelated changes.
- Use local evidence before relying on assumptions.
- Keep token usage proportional to the task: search narrowly, read selectively,
  and avoid dumping large files.

## Document Boundaries

Use this separation when deciding where to write information:

| Information type | Belongs in |
|---|---|
| Reusable agent workflow | `WORKFLOW.md` |
| Repository-specific agent rules | `AGENTS.md`, `CLAUDE.md`, or equivalent |
| Product goals and feature behavior | project specs, plans, or source docs |
| Implementation tasks and acceptance criteria | project implementation plan |
| Open questions and unresolved risks | project TODO / decision log |
| Completed cross-contract changes | project changelog or decision log |

Do not put product-specific capabilities, command contracts, domain roles, UI
rules, or runtime file formats in `WORKFLOW.md`.

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

## Change Routing

Before changing files, classify the request:

1. **Workflow change**: changes how agents should collaborate in any project.
   Update `WORKFLOW.md`.
2. **Repository policy change**: changes how agents should behave in this
   repository only. Update `AGENTS.md`, `CLAUDE.md`, or the local equivalent.
3. **Product or feature change**: changes what the project builds or how it
   behaves. Update the project plan, spec, source, tests, or runtime contracts.
4. **Open decision**: requires user judgment or evidence that is not available.
   Record it in the project TODO or decision log.

If a change crosses multiple buckets, update each owning document instead of
collapsing everything into one file.

## Discussion Workflow

1. Restate the decision only when it reduces ambiguity.
2. If the path is uncertain, offer concrete options and ask one focused
   question.
3. Once a decision is made, write it to the correct project document.
4. If visual, layout, interaction, or aesthetic uncertainty affects the outcome,
   prefer a viewable artifact over pure text. The artifact should make the
   choice inspectable and should not silently decide for the user.

## Implementation Workflow

Before implementation, identify:

- the files or modules likely to change
- the expected behavior change
- the verification command or manual check
- any user decision still required
- any unrelated local changes that must be preserved

During implementation:

- Keep edits scoped to the request.
- Follow existing project patterns.
- Use deterministic scripts for file generation, validation, screenshots, and
  reports when possible.
- Avoid unrelated refactors.
- Update docs when behavior, contracts, or usage changes.

## Verification Workflow

Before claiming work is complete, run the checks appropriate to the change.
Common examples:

- unit tests or targeted test commands
- lint/typecheck/build commands
- dry-run commands for generated artifacts
- screenshot or browser verification for UI work
- document consistency checks for spec-only work
- whitespace checks before committing

If verification cannot be run, say what was skipped and why.

## State And Decisions

Durable project state should be explicit:

- Accepted decisions go into the project decision log, spec, plan, or source.
- Open questions go into a TODO or open questions file.
- Rejected ideas should be recorded when they are likely to come back later.
- Cross-document contract changes should be easy to find through a changelog or
  equivalent project log.

Chat can explain the reasoning, but files should carry the durable state.

## Agent Entry Files

Agent entry files such as `AGENTS.md` and `CLAUDE.md` should:

- reference this workflow
- define repository-specific constraints
- point to the project documents that own product and implementation details
- avoid duplicating product specs or long-lived feature behavior

When multiple agent entry files exist, keep them consistent unless the project
intentionally needs harness-specific differences.
