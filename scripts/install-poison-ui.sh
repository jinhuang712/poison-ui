#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Install poison-ui into Codex CLI and/or Claude Code skill directories.

Usage:
  ./scripts/install-poison-ui.sh [--target codex|claude|both] [--ref <git-ref>] [--repo <owner/repo>] [--no-backup]

Defaults:
  --target codex
  --ref main
  --repo jinhuang712/poison-ui

Environment overrides:
  CODEX_SKILLS_DIR   default: ~/.codex/skills
  CLAUDE_SKILLS_DIR  default: ~/.claude/skills

Examples:
  ./scripts/install-poison-ui.sh --target codex
  ./scripts/install-poison-ui.sh --target claude
  ./scripts/install-poison-ui.sh --target both --ref v0.9.0
EOF
}

target="codex"
ref="main"
repo="jinhuang712/poison-ui"
backup_existing=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      target="${2:-}"
      shift 2
      ;;
    --ref)
      ref="${2:-}"
      shift 2
      ;;
    --repo)
      repo="${2:-}"
      shift 2
      ;;
    --no-backup)
      backup_existing=0
      shift
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

timestamp="$(date +%Y%m%d%H%M%S)"
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

archive_url="https://github.com/${repo}/archive/refs/heads/${ref}.tar.gz"
if [[ "$ref" == v* ]]; then
  archive_url="https://github.com/${repo}/archive/refs/tags/${ref}.tar.gz"
fi

echo "Downloading ${repo}@${ref}"
curl -fsSL "$archive_url" | tar -xz -C "$tmpdir"
src_root="$(find "$tmpdir" -mindepth 1 -maxdepth 1 -type d | head -n 1)"

if [[ -z "${src_root:-}" || ! -f "$src_root/SKILL.md" ]]; then
  echo "Downloaded archive does not contain a root SKILL.md" >&2
  exit 1
fi

install_one() {
  local label="$1"
  local skills_dir="$2"
  local dest="$skills_dir/poison"

  mkdir -p "$skills_dir"
  if [[ -e "$dest" ]]; then
    if [[ "$backup_existing" -eq 1 ]]; then
      local backup="${dest}.bak.${timestamp}"
      mv "$dest" "$backup"
      echo "Backed up existing ${label} skill to ${backup}"
    else
      echo "Destination already exists: ${dest}" >&2
      exit 1
    fi
  fi

  mkdir -p "$dest"
  cp -R "$src_root"/. "$dest"/
  test -f "$dest/SKILL.md"
  test -f "$dest/docs/contracts/command-api.md"
  test -f "$dest/bin/poison.mjs"
  chmod +x "$dest/bin/poison.mjs"
  echo "Installed poison-ui for ${label}: ${dest}"
}

codex_skills_dir="${CODEX_SKILLS_DIR:-$HOME/.codex/skills}"
claude_skills_dir="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"

if [[ "$target" == "codex" || "$target" == "both" ]]; then
  install_one "Codex CLI" "$codex_skills_dir"
fi

if [[ "$target" == "claude" || "$target" == "both" ]]; then
  install_one "Claude Code" "$claude_skills_dir"
fi

cat <<EOF

Done. Restart Codex CLI or Claude Code so the new skill is loaded.

Smoke test:
  node <skills-dir>/poison/bin/poison.mjs --help
EOF
