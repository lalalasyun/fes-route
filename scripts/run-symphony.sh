#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKFLOW_PATH="${SYMPHONY_WORKFLOW_PATH:-$ROOT/WORKFLOW.md}"
SYMPHONY_BIN="${SYMPHONY_BIN:-/home/openclaw/.openclaw/workspace/tmp/symphony-upstream/elixir/bin/symphony}"
SYMPHONY_ROOT="${SYMPHONY_ROOT:-$(dirname "$SYMPHONY_BIN")/..}"

if ! command -v git >/dev/null 2>&1; then
  echo "git が必要です" >&2
  exit 1
fi

if ! command -v codex >/dev/null 2>&1; then
  echo "codex CLI が必要です" >&2
  exit 1
fi

if [[ ! -x "$SYMPHONY_BIN" ]]; then
  echo "OpenAI Symphony binary not found at $SYMPHONY_BIN" >&2
  exit 127
fi
SYMPHONY_ROOT="$(cd "$SYMPHONY_ROOT" && pwd)"

if [[ -z "${LINEAR_API_KEY:-}" ]]; then
  echo "LINEAR_API_KEY を設定してください" >&2
  exit 1
fi

if [[ -z "${SYMPHONY_WORKSPACE_ROOT:-}" ]]; then
  echo "SYMPHONY_WORKSPACE_ROOT を設定してください" >&2
  exit 1
fi

mkdir -p "$SYMPHONY_WORKSPACE_ROOT"

export CODEX_HOME="${CODEX_HOME:-/home/openclaw/.codex}"
export LINEAR_API_KEY CODEX_HOME SYMPHONY_WORKSPACE_ROOT

cd "$SYMPHONY_ROOT"
exec "$SYMPHONY_BIN" "$@" "$WORKFLOW_PATH"
