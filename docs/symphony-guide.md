# Symphony 導入ガイド

`fes-route` を **Linear Project `main` + OpenAI Symphony + Codex app-server** で回すための導入メモ。

## この repo に追加したもの

- `WORKFLOW.md`
  - repo 専用の Symphony workflow contract
  - tracker は Linear
  - Codex は `CODEX_HOME=/home/openclaw/.codex codex app-server`
- `scripts/run-symphony.sh`
  - OpenAI Symphony binary を呼ぶ薄いラッパー
- `scripts/run-symphony-tmux.sh`
  - tmux で Symphony runner を start / stop / status / attach / logs する運用ラッパー
- `scripts/symphony-validate.sh`
  - この repo での最低 validation gate
- `.github/pull_request_template.md`
  - Symphony が PR body を埋めやすい最小テンプレート

`scripts/github_projects_symphony.py` は旧 GitHub Projects runner として残っているが、現在の運用 default では使わない。

## 前提

- `git`
- `codex`
- `tmux`、常駐運用時
- OpenAI Symphony binary
  - default: `/home/openclaw/.openclaw/workspace/tmp/symphony-upstream/elixir/bin/symphony`
- `LINEAR_API_KEY`
- `CODEX_HOME=/home/openclaw/.codex`

## Linear 側で必要なもの

Symphony の tracker として Linear を使う。

現在の `WORKFLOW.md` は以下を前提にしている。

- project slug: `main`
- active states:
  - `Todo`
  - `In Progress`
- terminal states:
  - `Closed`
  - `Cancelled`
  - `Canceled`
  - `Duplicate`
  - `Done`

必要なら `WORKFLOW.md` の `project_slug`, `active_states`, `terminal_states` を調整する。

## 環境変数

最低限これを設定する。

```bash
export LINEAR_API_KEY=...
export CODEX_HOME=/home/openclaw/.codex
export SYMPHONY_WORKSPACE_ROOT=/home/openclaw/.openclaw/workspace/worktrees/fes-route-symphony
```

任意:

```bash
export SYMPHONY_WORKFLOW_PATH="$PWD/WORKFLOW.md"
export SYMPHONY_BIN=/home/openclaw/.openclaw/workspace/tmp/symphony-upstream/elixir/bin/symphony
export SYMPHONY_TMUX_SESSION=fes-route-symphony
```

## 起動

repo root で:

```bash
./scripts/run-symphony.sh
```

常駐で回す:

```bash
./scripts/run-symphony.sh
```

### tmux で常駐運用する

起動 / 確認 / 接続 / 停止:

```bash
# detached で起動
./scripts/run-symphony-tmux.sh start

# 状態確認
./scripts/run-symphony-tmux.sh status

# セッションへ接続
./scripts/run-symphony-tmux.sh attach

# ログ追跡
./scripts/run-symphony-tmux.sh logs

# 停止
./scripts/run-symphony-tmux.sh stop
```

必要なら runner 引数をそのまま後ろに渡せる。

```bash
./scripts/run-symphony-tmux.sh start -- --port 4567
```

live E2E の確認では、対象 workspace 配下の `.symphony-run/` も見る。

- `prompt.md` — runner が Codex に渡した最終 prompt
- `run-<timestamp>.json` — 開始時刻 / PID / 実行コマンド / stdout, stderr 出力先
- `stdout-<timestamp>.jsonl` / `stderr-<timestamp>.log` — 実行中も逐次追跡できるログ
- `last-message-<timestamp>.txt` — Codex 完了時の最後のメッセージ

## Codex app-server

Codex は ACP ではなく native app-server binding を使う。

`WORKFLOW.md` の設定:

```yaml
codex:
  command: "CODEX_HOME=/home/openclaw/.codex codex app-server"
  approval_policy: never
  thread_sandbox: danger-full-access
```

`CODEX_HOME=/home/openclaw/.codex` を渡さないと、tmux / Symphony 側で未ログインの別 home を掴んで 401 になることがある。

## Validation 方針

Symphony からの push 前 gate は:

```bash
./scripts/symphony-validate.sh
```

変更内容に応じて以下を自動実行する。

- app / server 変更 → `npm run check`
- `scripts/github_projects_symphony.py` 変更 → `python3 -m py_compile scripts/github_projects_symphony.py`

docs / workflow / runner wrapper 変更のみなら `git diff --check` を主 gate にする。

## 注意

- `LINEAR_API_KEY` がない環境では runner 起動は blocked。
- GitHub Projects は現在の default control plane ではない。
- 常駐の第一段階は systemd ではなく tmux を推奨する。
  - 起動・停止・ログ確認・一時的な引数差し替えが軽く、導入直後の観察に向くため
  - 運用が安定してから systemd 化を検討するとよい
- `approval_policy: never` と `thread_sandbox: danger-full-access` を前提にしているため、runner は専用の信頼できるマシン / 権限境界の中で動かす。
- この repo はプロダクト prototype repo なので、Linear issue 側の acceptance criteria は UI / data / validation の小さな単位に分ける。
