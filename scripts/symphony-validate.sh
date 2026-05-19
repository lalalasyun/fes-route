#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "git repo 内で実行してください" >&2
  exit 1
fi

mapfile -t changed_files < <(
  {
    git diff --name-only origin/main...HEAD 2>/dev/null || true
    git diff --name-only
    git diff --name-only --cached
  } | awk 'NF' | sort -u
)

run_symphony_compile=false
run_node_check=false

for path in "${changed_files[@]:-}"; do
  case "$path" in
    src/*|server.mjs|package.json|app/*)
      run_node_check=true
      ;;
    scripts/github_projects_symphony.py)
      run_symphony_compile=true
      ;;
  esac
done

echo "==> git diff --check"
if git rev-parse --verify origin/main >/dev/null 2>&1; then
  merge_base="$(git merge-base origin/main HEAD)"
  git diff --check "$merge_base"
fi
git diff --check
git diff --check --cached

if $run_node_check; then
  echo "==> npm run check"
  npm run check
fi

if $run_symphony_compile; then
  echo "==> python3 -m py_compile scripts/github_projects_symphony.py"
  python3 -m py_compile scripts/github_projects_symphony.py
fi

if ! $run_node_check && ! $run_symphony_compile; then
  echo "==> 追加の repo-specific validation は不要 (docs / skills / workflow 変更のみ)"
fi

echo "Symphony validation OK"
