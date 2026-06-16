# Poison References

This directory contains agent-facing operational references derived from the
implementation contracts in `docs/contracts`.

Rules:

- Do not define a second source of truth for command behavior, artifact schemas,
  run states, review schemas, or gate rules here.
- Keep references aligned with `docs/contracts` when contracts change.
- Use these files to make the skill easier for agents to execute, not to change
  product behavior.
