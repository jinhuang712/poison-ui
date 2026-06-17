# Run State Contract

This file owns run states, transitions, recovery rules, and command-order
rules. V1 uses the review-first subset. Later versions may activate more states
without changing the state file shape.

## State File

Each run must include:

```text
.poison/runs/<run-id>/run-state.json
```

Required shape:

```json
{
  "schemaVersion": 1,
  "runId": "001-poisoned-demo",
  "mode": "review",
  "status": "created",
  "previousStatus": null,
  "blockedReason": null,
  "nextRecommendedAction": "capture",
  "artifacts": [],
  "updatedAt": "ISO-8601"
}
```

## State Model

`blocked` remains a real status because it is simple to inspect and serialize.
It is not terminal. Whenever a run enters `blocked`, the state file must record:

- `previousStatus`: the state the run should return to after recovery.
- `blockedReason`: the concrete missing input, failed command, conflict, or
  evidence gap.
- `nextRecommendedAction`: the command or manual action that can unblock the
  run.

Recovery must be explicit. A command must not jump from `blocked` to
`completed`; it must first return to `previousStatus` or to the next legal state
after the missing artifact is produced.

## States

V1 active states:

```text
created
captured
reviewed
gated
completed
blocked
```

V2 active states:

```text
protected_ready
repair_planned
repair_routed
repaired
```

Later-version states:

```text
context_ready
scope_assessed
designing
prototype_ready
published
```

## V1 Transition Table

| Command/action | From | Success to | Failure to | Actor | Idempotent | Required artifacts |
|---|---|---|---|---|---|---|
| `new-run --mode review` | none | `created` | none | CLI | no | `run-state.json`, `run-contract.md`, `context-health.md` |
| `capture --url <url>` | `created`, `blocked`, `repaired` | `captured` | `blocked` | CLI/browser adapter | yes | `screenshots/`, `screenshot-manifest.json`, console evidence, or degraded evidence artifact |
| `review` | `captured` | `reviewed` | `blocked` | reviewer/orchestrator | yes | `review-packet.md`, `review-summary.md` |
| `schema-check` | `created`, `captured`, `reviewed`, `gated`, `blocked` | same state | `blocked` | CLI | yes | schema report or inline validation result |
| `gate` | `reviewed` | `gated` | `blocked` | CLI | yes | `gate-report.md` |
| `finalize` | `gated` | `completed` | `blocked` | CLI/orchestrator | yes | final state update and no unresolved V1 hard failures |
| `resolve-blocker` | `blocked` | `previousStatus` or next legal state | `blocked` | CLI/user | yes | artifact or user decision named by `blockedReason` |

## V2 Transition Table

| Command/action | From | Success to | Failure to | Actor | Idempotent | Required artifacts |
|---|---|---|---|---|---|---|
| `init-protected-features` | `gated`, `protected_ready` | `protected_ready` | `blocked` | CLI/user | yes | `protected-features.md` |
| `repair-plan` | `protected_ready`, `repair_planned` | `repair_planned` | `blocked` | CLI/orchestrator | yes | `repair-plan.md`, `repair-plan.json` |
| `arbiter-route` | `repair_planned`, `repair_routed` | `repair_routed` | `blocked` | CLI/orchestrator | yes | `arbiter-routing.md`, `arbiter-routing.json` |
| `harden` | `repair_routed`, `repaired` | `repaired` | `blocked` | CLI/orchestrator | yes | `repair-rounds/001/repair-plan.md`, `repair-rounds/001/repair-plan.json`, `repair-rounds/001/before-after-evidence.md`, `repair-rounds/001/round-summary.md` |
| post-repair `capture` / `review` / `gate` | `repaired` through `captured` and `reviewed` | `gated` | `blocked` | CLI/browser adapter/reviewer | yes | fresh evidence, `review-packet.md`, `review-summary.md`, `gate-report.md`, preserved `repair-rounds/001/*` |
| `regression-check` | post-repair `gated` | `gated` | `blocked` | CLI/orchestrator | yes | `repair-rounds/001/regression-results.json` |
| `visual-drift` | post-regression `gated` | `gated` | `blocked` | CLI/orchestrator | yes | `repair-rounds/001/visual-drift.json` |

Failure-to-`blocked` applies after a command starts from a legal source state
and then cannot produce required artifacts. Calling a command from an illegal
source state is a command-order error and must not silently mutate run state.

## Later-Version Transition Table

| Command/action | From | Success to | Failure to | Actor | Idempotent | Required artifacts |
|---|---|---|---|---|---|---|
| build context package | `created` | `context_ready` | `blocked` | librarian | yes | `context-pack.md`, `sot-index.json`, `context-health.md` |
| `assess-scope` | `protected_ready` | `scope_assessed` | `blocked` | orchestrator | yes | `scope-assessment.md` |
| design generation | `scope_assessed` | `designing` | `blocked` | designer | no | design work log or design rationale |
| prototype output ready | `designing` | `prototype_ready` | `blocked` | designer/builder | no | inspectable prototype or design output |
| capture generated prototype | `prototype_ready` | `captured` | `blocked` | CLI/browser adapter | yes | screenshots, manifest, console evidence, or degraded evidence artifact |
| publish design snapshot | `gated`, `completed` | `published` | `blocked` | CLI/publisher | yes | `design/README.md`, publish manifest with `sourceRunId` |

## Hard Command Rules

- Without evidence or an explicit evidence gap artifact, review cannot claim
  UI findings as observed.
- Without `review-summary.md`, V1 gate cannot pass.
- Without a legal `previousStatus`, `blocked` cannot be recovered
  automatically.
- Unresolved `blockedReason` prevents `completed`.
- Gate failure moves to `blocked` and sets `nextRecommendedAction`.
- Later-version completion audit with insufficient information must output
  `blocked`.

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
