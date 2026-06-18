# GitHub Release v0.9.0

Poison UI `v0.9.0` is the first GitHub release for demo usage in Codex CLI and
Claude Code skill workflows. It is not an npm release.

## Included

- V1 review-first detector with evidence capture, review artifacts,
  schema-check, and mechanical gate.
- V2 bounded hardening loop with protected baseline, repair planning, arbiter
  routing, one harden round, regression checks, and visual drift reporting.
- V3 design handoff publishing with manifest, handoff files, and completion
  audit.
- V4 package, command, degradation, and adapter-facing validation contracts.
- Root-level `SKILL.md` for repo-root skill installation.
- `scripts/install-poison-ui.sh` for Codex CLI and Claude Code installs.

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/jinhuang712/poison-ui/v0.9.0/scripts/install-poison-ui.sh | bash -s -- --target codex --ref v0.9.0
```

Claude Code:

```bash
curl -fsSL https://raw.githubusercontent.com/jinhuang712/poison-ui/v0.9.0/scripts/install-poison-ui.sh | bash -s -- --target claude --ref v0.9.0
```

Both:

```bash
curl -fsSL https://raw.githubusercontent.com/jinhuang712/poison-ui/v0.9.0/scripts/install-poison-ui.sh | bash -s -- --target both --ref v0.9.0
```

## Notes

- Restart the target CLI after installing the skill.
- Browser evidence depends on optional Playwright availability. If browser
  automation is unavailable, `poison capture` records degraded evidence
  explicitly.
- npm publishing remains a separate manual follow-up.
