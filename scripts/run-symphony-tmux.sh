#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SESSION_NAME="${SYMPHONY_TMUX_SESSION:-symphony}"
WORKFLOW_PATH="${SYMPHONY_WORKFLOW_PATH:-$ROOT/WORKFLOW.md}"
RUNNER_SCRIPT="$ROOT/scripts/run-symphony.sh"
LOG_DIR="${SYMPHONY_TMUX_LOG_DIR:-$ROOT/.symphony/tmux}"
LOG_FILE="$LOG_DIR/${SESSION_NAME}.log"

usage() {
  cat <<EOF
Usage: $(basename "$0") <start|stop|restart|status|attach|logs> [-- runner args]

Commands:
  start     Start Symphony runner in a detached tmux session
  stop      Stop the tmux session
  restart   Restart the tmux session
  status    Show tmux session state and recent pane output
  attach    Attach to the tmux session
  logs      Tail the persisted log file

Environment:
  SYMPHONY_WORKSPACE_ROOT   Required. Workspace root passed to run-symphony.sh
  SYMPHONY_WORKFLOW_PATH    Optional. Defaults to WORKFLOW.md in repo root
  SYMPHONY_TMUX_SESSION     Optional. Defaults to 'symphony'
  SYMPHONY_TMUX_LOG_DIR     Optional. Defaults to .symphony/tmux in repo root
EOF
}

require_tmux() {
  if ! command -v tmux >/dev/null 2>&1; then
    echo "tmux が必要です" >&2
    exit 1
  fi
}

require_workspace_root() {
  if [[ -z "${SYMPHONY_WORKSPACE_ROOT:-}" ]]; then
    echo "SYMPHONY_WORKSPACE_ROOT を設定してください" >&2
    exit 1
  fi
}

session_exists() {
  tmux has-session -t "$SESSION_NAME" 2>/dev/null
}

runner_command() {
  local args=()
  if (($# > 0)); then
    args=("$@")
  fi

  local escaped_root escaped_workspace escaped_workflow escaped_runner escaped_log
  printf -v escaped_root '%q' "$ROOT"
  printf -v escaped_workspace '%q' "$SYMPHONY_WORKSPACE_ROOT"
  printf -v escaped_workflow '%q' "$WORKFLOW_PATH"
  printf -v escaped_runner '%q' "$RUNNER_SCRIPT"
  printf -v escaped_log '%q' "$LOG_FILE"

  local joined_args=""
  if ((${#args[@]} > 0)); then
    printf -v joined_args ' %q' "${args[@]}"
  fi

  printf 'cd %s && mkdir -p %q && export CODEX_HOME=/home/openclaw/.codex SYMPHONY_WORKSPACE_ROOT=%s SYMPHONY_WORKFLOW_PATH=%s && exec %s%s 2>&1 | tee -a %s' \
    "$escaped_root" "$LOG_DIR" "$escaped_workspace" "$escaped_workflow" "$escaped_runner" "$joined_args" "$escaped_log"
}

start_session() {
  require_workspace_root
  mkdir -p "$LOG_DIR"
  touch "$LOG_FILE"

  if session_exists; then
    echo "tmux session '$SESSION_NAME' は既に起動しています" >&2
    exit 1
  fi

  local command escaped_command
  command="$(runner_command "$@")"
  printf -v escaped_command '%q' "$command"
  tmux new-session -d -s "$SESSION_NAME" "bash -lc $escaped_command"
  tmux set-option -t "$SESSION_NAME" remain-on-exit on >/dev/null
  echo "started tmux session: $SESSION_NAME"
  echo "log: $LOG_FILE"
}

stop_session() {
  if ! session_exists; then
    echo "tmux session '$SESSION_NAME' は起動していません" >&2
    exit 1
  fi
  tmux kill-session -t "$SESSION_NAME"
  echo "stopped tmux session: $SESSION_NAME"
}

status_session() {
  if ! session_exists; then
    echo "tmux session '$SESSION_NAME': stopped"
    exit 1
  fi

  local window_count pane_pid created pane_dead pane_status
  window_count="$(tmux display-message -p -t "$SESSION_NAME" '#{session_windows}')"
  pane_pid="$(tmux display-message -p -t "$SESSION_NAME":0.0 '#{pane_pid}')"
  created="$(tmux display-message -p -t "$SESSION_NAME" '#{t:session_created}')"
  pane_dead="$(tmux display-message -p -t "$SESSION_NAME":0.0 '#{pane_dead}')"
  pane_status="$(tmux display-message -p -t "$SESSION_NAME":0.0 '#{pane_dead_status}')"

  echo "tmux session '$SESSION_NAME': running"
  echo "created: $created"
  echo "windows: $window_count"
  echo "pane pid: $pane_pid"
  if [[ "$pane_dead" == "1" ]]; then
    echo "pane status: exited ($pane_status)"
  else
    echo "pane status: running"
  fi
  echo "log: $LOG_FILE"
  echo "--- recent pane output ---"
  tmux capture-pane -t "$SESSION_NAME":0.0 -p | tail -20
}

attach_session() {
  if ! session_exists; then
    echo "tmux session '$SESSION_NAME' は起動していません" >&2
    exit 1
  fi
  exec tmux attach -t "$SESSION_NAME"
}

logs_session() {
  mkdir -p "$LOG_DIR"
  touch "$LOG_FILE"
  exec tail -f "$LOG_FILE"
}

main() {
  require_tmux

  local command="${1:-}"
  if [[ -z "$command" ]]; then
    usage
    exit 1
  fi
  shift || true

  local runner_args=()
  if (($# > 0)); then
    if [[ "$1" == "--" ]]; then
      shift
    fi
    runner_args=("$@")
  fi

  case "$command" in
    start)
      start_session "${runner_args[@]}"
      ;;
    stop)
      stop_session
      ;;
    restart)
      if session_exists; then
        stop_session
      fi
      start_session "${runner_args[@]}"
      ;;
    status)
      status_session
      ;;
    attach)
      attach_session
      ;;
    logs)
      logs_session
      ;;
    -h|--help|help)
      usage
      ;;
    *)
      echo "unknown command: $command" >&2
      usage
      exit 1
      ;;
  esac
}

main "$@"
