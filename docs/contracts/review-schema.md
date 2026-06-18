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
- findingId:
- priorityRank:
- fixOrder:
- severity: blocker | major | minor
- category: evidence | runtime | visual | ux | content | accessibility | other
- evidenceRefs:
- affectedScreens:
- evidence source:
- evidence level: E0 | E1 | E2 | E3 | E4 | E-gap
- issue:
- why it feels poisoned:
- firstRepairRecommendation:
- why severity is justified:
- evidence:
- source: design | poison-core | run-contract | completion-rubric | visual-rubric | ux-rubric | frontend-rubric | screenshot | runtime | code

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

## Findings

### Finding 1
- findingId:
- priorityRank:
- fixOrder:
- severity:
- category:
- evidenceRefs:
- affectedScreens:
- evidence source:
- evidence level:
- issue:
- why it feels poisoned:
- firstRepairRecommendation:

## Backlog items

## Rejected personal-taste findings
```

For V1, the finding fields above are mandatory and later-version fields such as
protected-feature ownership, visual-memory drift, frontend handoff status, and
completion-audit coverage are not required.

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

## Summary

## Completion Labels
- implemented | partial | missing | deviation | blocked:
  - requirement:
  - evidenceRefs:
  - recommendedNextStep:

## Blocked Output

## Next Actions
```

Completion audit conclusions must be based on design, poison core,
run-contract, screenshot, runtime output, or source evidence. V3c completion
audit must not publish percentages or a numeric overall completion value.
