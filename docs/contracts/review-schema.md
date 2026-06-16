# Review Schema Contract

This file owns reviewer, arbiter, direction synthesis, and completion audit
output shapes.

## Reviewer Result

```markdown
# Review Result

## Reviewer
product-realist | ux-operator | visual-craft | frontend-pragmatist | contrarian-taste | custom

## Spawn voice
<agent-id>-spawned: "<voice>"

## Verdict
PASS | PASS_WITH_FIXES | FAIL

## Vote
PASS | PASS_WITH_FIXES | FAIL | BLOCKED

## Vote reason

## Reviewed against
- poison-core version:
- run-contract:
- reviewer profile:

## Scope compliance

## Product alignment

## Findings

### Finding 1
- severity: blocker | major | minor
- screen:
- issue:
- poison:
- antidote:
- category:
- evidence level: E0 | E1 | E2 | E3 | E4
- evidence source:
- why severity is justified:
- evidence:
- source: design | poison-core | run-contract | completion-rubric | visual-rubric | ux-rubric | frontend-rubric | screenshot | runtime | code
- recommended fix:

## Non-blocking suggestions

## Out-of-scope observations
```

Blocker findings must reference design, poison-core, run-contract, rubric,
screenshot evidence, runtime output, or code evidence.

## Direction Synthesis

Used when the run has no clear target and reviewers do not vote:

```markdown
# Direction Synthesis

## Consensus opportunities

## Disagreements

## Promising directions

## Questions for user

## Ideas not to execute yet
```

## Review Summary

Used when the run has a target:

```markdown
# Review Summary

## Target

## Vote tally

## Majority position

## Minority concerns

## Evidence-backed blockers

## Designer discretion items

## Backlog items

## Rejected personal-taste findings
```

## Repair Plan

```markdown
# Repair Plan

## Accepted fixes

## Rejected findings

## Deferred backlog items

## Blockers

## Major fixes

## Minor fixes

## Autonomous fixes

## Needs user decision

## Implementation order

## Gate impact
```

## Completion Audit Report

```markdown
# Completion Audit Report

## Verdict
COMPLETE | PARTIAL | INCOMPLETE | BLOCKED

## Overall Completion
0-100

## Coverage Matrix
| Design requirement | Status | Evidence | Severity | Recommended next step |

## Implemented

## Partially implemented

## Missing

## Deviations from design

## Runtime and responsive issues

## Recommended next mode
evolve | harden | review | none

## Backlog candidates
```

Completion audit conclusions must be based on design, poison core,
run-contract, screenshot, runtime output, or source evidence.
