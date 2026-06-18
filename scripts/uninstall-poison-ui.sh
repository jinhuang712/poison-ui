#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Uninstall poison-ui from Codex CLI and/or Claude Code skill directories.

Usage:
  ./scripts/uninstall-poison-ui.sh [--target codex|claude|both]

Defaults:
  --target codex

Environment overrides:
  CODEX_SKILLS_DIR   default: ~/.codex/skills
  CLAUDE_SKILLS_DIR  default: ~/.claude/skills

Examples:
  ./scripts/uninstall-poison-ui.sh --target codex
  ./scripts/uninstall-poison-ui.sh --target claude
  ./scripts/uninstall-poison-ui.sh --target both
EOF
}

target="codex"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      target="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

case "$target" in
  codex|claude|both) ;;
  *)
    echo "--target must be codex, claude, or both" >&2
    exit 2
    ;;
esac

uninstall_one() {
  local label="$1"
  local skills_dir="$2"
  local dest="$skills_dir/poison"

  if [[ ! -e "$dest" ]]; then
    echo "No ${label} poison skill found at ${dest}"
    return
  fi

  rm -rf "$dest"
  echo "Removed ${label} poison skill from ${dest}"
}

codex_skills_dir="${CODEX_SKILLS_DIR:-$HOME/.codex/skills}"
claude_skills_dir="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"

if [[ "$target" == "codex" || "$target" == "both" ]]; then
  uninstall_one "Codex CLI" "$codex_skills_dir"
fi

if [[ "$target" == "claude" || "$target" == "both" ]]; then
  uninstall_one "Claude Code" "$claude_skills_dir"
fi

cat <<'EOF'

Done. Restart Codex CLI or Claude Code so the removed skill is no longer loaded.
EOF
