# Symphony 導入ガイド

`fes-route` を **GitHub Issues + GitHub Projects v2 ベース** で Symphony 的に回すための導入メモ。

## この repo に追加したもの

- `WORKFLOW.md`
  - repo 専用の Symphony workflow contract
- `.codex/skills/`
  - Symphony から参照する repo-local skills (`github_project`, `commit`, `pull`, `push`, `land`)
- `scripts/github_projects_symphony.py`
  - GitHub Projects v2 を poll して Codex を起動する repo-native runner
- `scripts/run-symphony.sh`
  - 上記 Python runner を起動する薄いラッパー
- `scripts/run-symphony-tmux.sh`
  - tmux で Symphony runner を start / stop / status / attach / logs する運用ラッパー
- `scripts/symphony-validate.sh`
  - この repo での最低 validation gate
- `.github/pull_request_template.md`
  - Symphony が PR body を埋めやすい最小テンプレート

## 前提

- `git`
- `python3`
- `gh` (GitHub CLI)
- `codex`

## GitHub Projects 側で必要なもの

Symphony 的な tracker として **GitHub Projects v2** を使う。

現在の `WORKFLOW.md` は以下を前提にしている。

- project: `Fes Route Symphony` (#8)
- field: `Status`
- active states:
  - `Todo`
  - `Pending`
  - `In Progress`
- terminal state:
  - `Done`

必要なら `WORKFLOW.md` の `project_number`, `status_field`, `active_states`, `terminal_states` を調整する。

## 環境変数

最低限これを設定する。

```bash
export SYMPHONY_WORKSPACE_ROOT="$HOME/code/fes-route-symphony"
```

任意:

```bash
export SYMPHONY_WORKFLOW_PATH="$PWD/WORKFLOW.md"
```

`gh auth status` が通ることが前提。追加の API token 環境変数は不要。

## 起動

repo root で:

```bash
./scripts/run-symphony.sh
```

代表例:

```bash
# 1回だけ候補 issue を見たい
./scripts/run-symphony.sh --once --dry-run

# 常駐で回す
./scripts/run-symphony.sh

# 特定 issue だけ試す
./scripts/run-symphony.sh --once --issue 90
```

### tmux で常駐運用する

まず workspace root を設定する。

```bash
export SYMPHONY_WORKSPACE_ROOT="$HOME/code/fes-route-symphony"
```

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
./scripts/run-symphony-tmux.sh start -- --once --issue 95
```

live E2E の確認では、対象 workspace 配下の `.symphony-run/` も見る。

- `prompt.md` — runner が Codex に渡した最終 prompt
- `run-<timestamp>.json` — 開始時刻 / PID / 実行コマンド / stdout, stderr 出力先
- `stdout-<timestamp>.jsonl` / `stderr-<timestamp>.log` — 実行中も逐次追跡できるログ
- `last-message-<timestamp>.txt` — Codex 完了時の最後のメッセージ

## Validation 方針

Symphony からの push 前 gate は:

```bash
./scripts/symphony-validate.sh
```

変更内容に応じて以下を自動実行する。

- app / server 変更 → `npm run check`
- `scripts/github_projects_symphony.py` 変更 → `python3 -m py_compile scripts/github_projects_symphony.py`

docs / workflow / skills 変更のみなら `git diff --check` を主 gate にする。

## 運用メモ

- この導入は **OpenAI の Linear 参照実装そのまま** ではない。
- `fes-route` 向けに、**GitHub Issues / Projects v2 を control plane にする repo-native runner** を持つ。
- repo 側では `WORKFLOW.md`, repo-local skills, validation gate, runner を version 管理する。
- 発想は Symphony だが、tracker adapter は GitHub に寄せている。

## 注意

- `codex` にかなり自由度を渡すので、使うマシン / GitHub 権限 / approval 境界は慎重に分ける。
- `WORKFLOW.md` では `approval_policy: never` を前提にしているため、ローカル sandbox 境界を信用できる環境で回す方がよい。
- 現在の正式運用 default は `thread_sandbox: danger-full-access`。
  - 理由: この環境では `workspace-write` だと Codex 内の `/bin/bash` 実行が拒否され、live E2E で安定動作しなかったため
  - 前提: runner は専用の信頼できるマシン / 権限境界の中で動かす
  - 将来 `workspace-write` で安定稼働できることが確認できたら戻してよい
- 常駐の第一段階は systemd ではなく tmux を推奨する。
  - 起動・停止・ログ確認・一時的な引数差し替えが軽く、導入直後の観察に向くため
  - 運用が安定してから systemd 化を検討するとよい
- この repo はプロダクト prototype repo なので、ticket 側の acceptance criteria は UI / data / validation の小さな単位に分ける。
- 現在の runner は **user-owned GitHub Project v2** 前提で `viewer.projectV2` を使っている。organization project に広げるなら adapter 拡張が必要。
