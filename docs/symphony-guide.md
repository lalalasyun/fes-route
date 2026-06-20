# Hermes / agent delegation 運用ガイド

`fes-route` の開発運用を **GitHub repo-first + Hermes/agent delegation**
で回すためのメモ。OpenClaw は Discord の入口だけを担当し、repo 編集は
Hermes から委譲された `agent` が `/home/agent/workspace/fes-route` で行う。

## この repo に追加したもの

- `WORKFLOW.md`
  - repo 専用の Hermes/agent workflow contract
- `.codex/skills/`
  - Hermes/agent が参照する repo-local skills (`github_project`, `commit`, `pull`, `push`, `land`)
- `scripts/github_projects_symphony.py`
  - GitHub Projects v2 を poll して Codex を起動する任意の repo-native runner
- `scripts/run-symphony.sh`
  - 上記 Python runner を起動する薄いラッパー
- `scripts/run-symphony-tmux.sh`
  - tmux で runner を start / stop / status / attach / logs する運用ラッパー
- `scripts/symphony-validate.sh`
  - この repo での最低 validation gate
- `.github/pull_request_template.md`
  - agent が PR body を埋めやすい最小テンプレート

## 現在の標準フロー

Discord thread / forum で依頼を受けたら、OpenClaw は Issue と Hermes
Kanban task を作り、coding task を Hermes/agent に渡す。OpenClaw 側では
repo を編集しない。

Hermes/agent 側の標準手順:

1. `/home/agent/workspace/fes-route` で作業する。
2. 編集前に `AGENTS.md`, `CLAUDE.md`, 関連 docs, validation scripts を確認し、
   `git status --short --branch` を実行する。
3. `main` から issue / task 用の branch を作る。
4. 依頼範囲の code / docs / config を変更する。
5. repo validation を実行する。
6. commit, push, PR 作成または更新まで進める。
7. PR body に Summary / What changed / Validation / Risks or follow-ups を書く。
8. `result.md` に run_id, workspace, branch, PR URL, validation, 残リスクを残す。

この flow では `LINEAR_API_KEY` は不要。Linear / OpenAI Symphony 参照実装
そのものではなく、GitHub Issue / PR / Hermes Kanban task を追跡単位にする。

## 前提

- `git`
- `python3`
- `gh` (GitHub CLI)
- `codex`

通常の Hermes delegation では、上記が agent workspace にあることを前提にする。

## GitHub Projects runner を使う場合

この repo には、GitHub Projects v2 を tracker として Codex を起動する
任意 runner も残している。これは標準の Hermes delegation を置き換えるものではなく、
GitHub Project から候補 Issue を自動取得したい場合の補助。

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

runner を使う場合は最低限これを設定する。

```bash
export SYMPHONY_WORKSPACE_ROOT="/home/agent/workspace/fes-route-runs"
```

任意:

```bash
export SYMPHONY_WORKFLOW_PATH="$PWD/WORKFLOW.md"
```

`gh auth status` が通ることが前提。追加の API token 環境変数は不要。
`CODEX_HOME` は runner から強制しない。agent ユーザーの通常環境を使う。

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
export SYMPHONY_WORKSPACE_ROOT="/home/agent/workspace/fes-route-runs"
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

Hermes/agent からの push 前 gate は:

```bash
./scripts/symphony-validate.sh
```

変更内容に応じて以下を自動実行する。

- app / server 変更 -> `npm run check`
- `scripts/github_projects_symphony.py` 変更 → `python3 -m py_compile scripts/github_projects_symphony.py`

docs / workflow / skills 変更のみなら `git diff --check` を主 gate にする。
shell script を変更した場合は、対象 script に `bash -n` を追加で実行する。

今回の運用 docs / runner scripts 変更では、少なくとも以下を実行する。

```bash
npm run check
git diff --check
bash -n scripts/*.sh
./scripts/symphony-validate.sh
./scripts/run-symphony.sh --help
./scripts/run-symphony-tmux.sh help
```

## 運用メモ

- この導入は **OpenAI の Linear 参照実装そのまま** ではない。
- `fes-route` 向けに、**GitHub Issues / Projects v2 を control plane にする repo-native runner** を持つ。
- repo 側では `WORKFLOW.md`, repo-local skills, validation gate, runner を version 管理する。
- 発想は Symphony だが、tracker adapter と実作業は GitHub repo-first +
  Hermes/agent delegation に寄せている。
- OpenClaw workspace, credentials, sessions, auth profiles は repo 運用フローに
  持ち込まない。

## PR #18 の扱い

PR #18 (`docs: 技術選定を追加`) には、Cloudflare Workers / Hono / D1 / R2
などの技術選定 docs が含まれており、プロダクト方針としては有用な部分がある。

一方で、同じ PR には Linear Project `main`, `LINEAR_API_KEY`,
OpenAI Symphony binary, OpenClaw 固有の `CODEX_HOME` などの runner 運用前提も
含まれている。これは現在の
GitHub repo-first + Hermes/agent delegation 方針と衝突する。

そのため、PR #18 はそのまま merge せず、以下のどちらかで扱う。

- 技術選定 docs だけを別PRとして取り込み、runner / workflow 変更はこの方針で置き換える。
- PR #18 を close / supersede し、このIssueのPRを運用フローの正とする。

少なくとも、PR #18 の Linear / OpenClaw runner 前提を blindly merge しない。

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
