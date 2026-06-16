# TODO

This file tracks real repository work. Keep it actionable and remove or update
items as they are completed.

## Next Implementation Steps

- Expand `skills/poison/SKILL.md` from scaffold into the operational skill
  entrypoint after contract owners are stable.
- Implement the thin CLI dispatch layer and deterministic V1 tools listed in
  `docs/delivery/v1-acceptance.md`.
- Add design folder generation and update flows based on
  `docs/contracts/design-folder.md`.
- Add tests for core artifact helpers, run-state validation, schema checking,
  and CLI dry-run flows.

## Structural Follow-Ups

- Keep `docs/00-09` as stable high-level entries and link them to detailed
  contract owners instead of growing them.
- Keep `.poison/context` trackable by default; only ignore generated run
  evidence such as screenshots, console logs, and temporary files.
- Keep `skills/poison/references` aligned with `docs/contracts` without making
  the skill references a second source of truth.
