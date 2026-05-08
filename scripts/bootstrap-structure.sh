#!/usr/bin/env bash
set -euo pipefail

mode="${1:-generic}"

mkdir -p docs scripts

after_msg() {
  printf '\n[ok] bootstrapped mode=%s\n' "$mode"
}

create_if_missing() {
  local path="$1"
  if [ ! -e "$path" ]; then
    mkdir -p "$(dirname "$path")"
    : > "$path"
  fi
}

case "$mode" in
  generic)
    mkdir -p src tests
    create_if_missing src/.gitkeep
    create_if_missing tests/.gitkeep
    ;;
  webapp)
    mkdir -p app public src/components src/lib src/styles tests
    create_if_missing app/.gitkeep
    create_if_missing public/.gitkeep
    create_if_missing src/components/.gitkeep
    create_if_missing src/lib/.gitkeep
    create_if_missing src/styles/.gitkeep
    create_if_missing tests/.gitkeep
    ;;
  api)
    mkdir -p src/api src/domain src/lib tests docs/api
    create_if_missing src/api/.gitkeep
    create_if_missing src/domain/.gitkeep
    create_if_missing src/lib/.gitkeep
    create_if_missing tests/.gitkeep
    create_if_missing docs/api/.gitkeep
    ;;
  cli)
    mkdir -p src/bin src/commands src/lib tests
    create_if_missing src/bin/.gitkeep
    create_if_missing src/commands/.gitkeep
    create_if_missing src/lib/.gitkeep
    create_if_missing tests/.gitkeep
    ;;
  bot)
    mkdir -p src/handlers src/integrations src/prompts tests
    create_if_missing src/handlers/.gitkeep
    create_if_missing src/integrations/.gitkeep
    create_if_missing src/prompts/.gitkeep
    create_if_missing tests/.gitkeep
    ;;
  library)
    mkdir -p src examples tests
    create_if_missing src/.gitkeep
    create_if_missing examples/.gitkeep
    create_if_missing tests/.gitkeep
    ;;
  fullstack)
    mkdir -p apps/web apps/api packages/shared infra docs/runbooks tests
    create_if_missing apps/web/.gitkeep
    create_if_missing apps/api/.gitkeep
    create_if_missing packages/shared/.gitkeep
    create_if_missing infra/.gitkeep
    create_if_missing docs/runbooks/.gitkeep
    create_if_missing tests/.gitkeep
    ;;
  research)
    mkdir -p notes data references experiments
    create_if_missing notes/.gitkeep
    create_if_missing data/.gitkeep
    create_if_missing references/.gitkeep
    create_if_missing experiments/.gitkeep
    ;;
  *)
    echo "unsupported mode: $mode" >&2
    echo "supported: generic webapp api cli bot library fullstack research" >&2
    exit 1
    ;;
esac

after_msg
