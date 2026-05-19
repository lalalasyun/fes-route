#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKFLOW_PATH="${SYMPHONY_WORKFLOW_PATH:-$ROOT/WORKFLOW.md}"
PYTHON_RUNNER="$ROOT/scripts/github_projects_symphony.py"

if ! command -v git >/dev/null 2>&1; then
  echo "git が必要です" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh が必要です" >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 が必要です" >&2
  exit 1
fi

if ! command -v codex >/dev/null 2>&1; then
  echo "codex CLI が必要です" >&2
  exit 1
fi

if [[ -z "${SYMPHONY_WORKSPACE_ROOT:-}" ]]; then
  echo "SYMPHONY_WORKSPACE_ROOT を設定してください" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "gh auth status が失敗しました。GitHub 認証を確認してください" >&2
  exit 1
fi

exec python3 "$PYTHON_RUNNER" "$WORKFLOW_PATH" "$@"
