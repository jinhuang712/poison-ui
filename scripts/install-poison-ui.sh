#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Install poison-ui into Codex CLI and/or Claude Code skill directories.

Usage:
  ./scripts/install-poison-ui.sh [--target codex|claude|both] [--ref <git-ref>] [--repo <owner/repo>]

Defaults:
  --target codex
  --ref main
  --repo jinhuang712/poison-ui

Environment overrides:
  CODEX_SKILLS_DIR   default: ~/.codex/skills
  CLAUDE_SKILLS_DIR  default: ~/.claude/skills
  POISON_BIN_DIR     default: ~/.local/bin
  POISON_INSTALL_DEPS      default: 1; set to 0 to skip npm dependencies
  POISON_INSTALL_BROWSERS  default: 1; set to 0 to skip Playwright Chromium

Examples:
  ./scripts/install-poison-ui.sh --target codex
  ./scripts/install-poison-ui.sh --target claude
  ./scripts/install-poison-ui.sh --target both --ref v0.9.0
EOF
}

target="codex"
ref="main"
repo="jinhuang712/poison-ui"
install_deps="${POISON_INSTALL_DEPS:-1}"
install_browsers="${POISON_INSTALL_BROWSERS:-1}"

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

is_enabled() {
  case "${1:-}" in
    0|false|FALSE|no|NO|off|OFF) return 1 ;;
    *) return 0 ;;
  esac
}

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
  local create_shim="$3"
  local dest="$skills_dir/poison"

  mkdir -p "$skills_dir"
  if [[ -e "$dest" ]]; then
    rm -rf "$dest"
    echo "Removed existing ${label} skill at ${dest}"
  fi

  mkdir -p "$dest"
  cp -R "$src_root"/. "$dest"/
  test -f "$dest/SKILL.md"
  test -f "$dest/docs/contracts/command-api.md"
  test -f "$dest/bin/poison.mjs"
  rm -rf "$dest/skills/poison"
  chmod +x "$dest/bin/poison.mjs"
  echo "Installed poison-ui for ${label}: ${dest}"

  if is_enabled "$install_deps"; then
    if command -v npm >/dev/null 2>&1; then
      echo "Installing runtime dependencies for ${label} browser capture"
      if (cd "$dest" && npm install --omit=dev --include=optional --no-audit --no-fund); then
        if is_enabled "$install_browsers"; then
          if [[ -x "$dest/node_modules/.bin/playwright" ]]; then
            echo "Installing Playwright Chromium for ${label} browser capture"
            if ! (cd "$dest" && ./node_modules/.bin/playwright install chromium); then
              echo "Warning: Chromium install failed; run poison doctor --capture for details." >&2
            fi
          else
            echo "Warning: Playwright CLI was not installed; browser capture may be unavailable." >&2
          fi
        else
          echo "Skipped Playwright Chromium install because POISON_INSTALL_BROWSERS=0"
        fi
      else
        echo "Warning: dependency install failed; browser capture may be unavailable." >&2
      fi
    else
      echo "Warning: npm not found; browser capture may be unavailable." >&2
    fi
  else
    echo "Skipped runtime dependency install because POISON_INSTALL_DEPS=0"
  fi

  if [[ "$create_shim" == "1" ]]; then
    mkdir -p "$poison_bin_dir"
    ln -sf "$dest/bin/poison.mjs" "$poison_bin_dir/poison"
    echo "Linked poison command: $poison_bin_dir/poison"
  fi
}

codex_skills_dir="${CODEX_SKILLS_DIR:-$HOME/.codex/skills}"
claude_skills_dir="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
poison_bin_dir="${POISON_BIN_DIR:-$HOME/.local/bin}"

if [[ "$target" == "codex" || "$target" == "both" ]]; then
  install_one "Codex CLI" "$codex_skills_dir" "1"
fi

if [[ "$target" == "claude" || "$target" == "both" ]]; then
  if [[ "$target" == "claude" ]]; then
    install_one "Claude Code" "$claude_skills_dir" "1"
  else
    install_one "Claude Code" "$claude_skills_dir" "0"
  fi
fi

cat <<EOF

Done. Restart Codex CLI or Claude Code so the new skill is loaded.

Smoke test:
  poison --help
EOF
