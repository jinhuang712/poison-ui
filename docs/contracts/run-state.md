# Run State Contract

This file owns V1 run states, transitions, and command-order rules.

## State File

Each run must include:

```text
.poison/runs/<run-id>/run-state.json
```

Required shape:

```json
{
  "schemaVersion": 1,
  "runId": "001-test-seed",
  "mode": "seed",
  "status": "created",
  "previousStatus": null,
  "blockedReason": null,
  "nextRecommendedAction": "init-protected-features",
  "artifacts": [],
  "updatedAt": "ISO-8601"
}
```

## States

```text
created
context_ready
protected_ready
scope_assessed
designing
prototype_ready
captured
reviewed
repaired
gated
completed
blocked
```

## Transition Rules

- `new-run` creates `created`.
- Librarian context package creation moves to `context_ready`.
- `init-protected-features` moves to `protected_ready`.
- `assess-scope` moves to `scope_assessed`.
- Designer work moves to `designing`.
- Inspectable prototype or design output moves to `prototype_ready`.
- `capture` moves to `captured`.
- Reviewer ensemble moves to `reviewed`.
- Repair execution, or a confirmed no-repair decision, moves to `repaired`.
- Passing `gate` moves to `gated`.
- Final report, state update, and unresolved-question checks move to
  `completed`.
- Missing information, failed execution, unresolved ambiguity, context conflict,
  or insufficient evidence moves to `blocked`.

## Hard Command Rules

- Without `context-pack.md`, review cannot run.
- Without screenshots, visual review cannot run and the system cannot claim UI
  completion.
- Unresolved user ambiguity prevents `completed`.
- Blocker or major findings need enough evidence before entering `gated`.
- Gate failure can only move back to `repaired`, `reviewed`, or `blocked`.
- Completion audit with insufficient information must output `blocked`.

## SoT Query Behavior

`poison sot query --run <run-id> --topic "<topic>"` returns:

```json
{
  "answer": "...",
  "source": "...",
  "status": "CONFIRMED | UNKNOWN | CONFLICTED | OPEN"
}
```

- `UNKNOWN` writes the topic to `.poison/context/open-questions.md`.
- `CONFLICTED` writes the conflict to the run `context-health.md`.
- Conflict discovery keeps or moves the run to `blocked`.
