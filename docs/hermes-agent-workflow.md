# Hermes / agent delegation 運用ガイド

`fes-route` の開発運用は **GitHub repo-first + Hermes/agent delegation** を
標準にする。OpenClaw は Discord thread / forum の intake と bridge に徹し、
repo 編集、Codex 実行、commit、push、PR 作成は Hermes から委譲された
`agent` が `/home/agent/workspace/fes-route` で行う。

## 標準フロー

1. Discord thread / forum の依頼を OpenClaw が受け取る。
2. GitHub Issue と Hermes Kanban task を追跡単位として作る。
3. Hermes が coding task を `agent` に委譲する。
4. `agent` は `/home/agent/workspace/fes-route` で repo 指示を読み、
   `git status --short --branch` を確認する。
5. 既存 PR を更新する場合はその head branch、それ以外は `main` から
   issue / task 用 branch を作って作業する。
6. 変更を実装し、repo validation を実行する。
7. commit、push、PR 作成または更新まで進める。
8. PR body に Summary / What changed / Validation / Risks or follow-ups を書く。
9. `result.md` に run_id, workspace, branch, PR URL, validation, 残リスクを残す。

## OpenClaw の境界

OpenClaw は入口であり、repo editor ではない。OpenClaw workspace からこの repo を
編集する前提、OpenClaw-owned `CODEX_HOME` を repo 運用に持ち込む前提、OpenClaw の
credentials / sessions / auth profiles / private workspace paths を repo artifact に
記録する前提は置かない。

この境界を置く理由は、実 repo 作業の責任と権限を `/home/agent/workspace` 配下の
`agent` に集約し、Discord intake、GitHub Issue、Hermes Kanban task、PR を
追跡可能な 1 本の流れに揃えるため。

## 旧 runner を使わない理由

古い外部 tracker / standalone runner 前提は採用しない。

- coding task は GitHub Issue / PR を source of truth として扱う。
- Hermes Kanban task は delegation と状態追跡を担い、repo 作業は `agent` が行う。
- OpenClaw は Discord intake / bridge に限定し、repo を直接編集しない。
- repo-local 常駐 runner を別途置くと、Hermes が委譲する作業単位、GitHub PR の
  ownership、OpenClaw の責務境界が重複する。
- 外部 tracker token、OpenClaw-owned runtime、repo-local issue polling runner を
  復活させると、現在の GitHub/repo-first 運用と衝突する。

そのため、この repo には GitHub Project を polling して Codex を起動する
repo-local runner script を残さない。必要な自動化は、Hermes/agent delegation と
GitHub Issue / PR の通常フローに寄せる。

## 必要な local tools

- `git`
- `gh`
- `npm`
- `node`

`gh auth status` が通ることを前提に、PR 作成 / 更新は GitHub CLI で行う。
追加の tracker token や OpenClaw credential は使わない。

## Validation

push 前の repo-local gate は:

```bash
./scripts/validate-workflow.sh
```

この script は変更ファイルに応じて以下を実行する。

- 常に `git diff --check`
- app / server / package 変更時に `npm run check`
- shell script 変更時に `bash -n`

重要な docs-only 変更でも、手動で以下を併せて実行して PR body と `result.md` に
記録する。

```bash
npm run check
git diff --check
./scripts/validate-workflow.sh
```

旧 workflow 名の stale reference が残っていないことも、case variants を含む
repo-wide search で確認する。

## PR body

PR body には最低限これを含める。

- Summary
- What changed
- Validation
- Risks / follow-ups

validation には実行した command と結果を書く。対象 issue がある場合は
`Closes #<number>` または関連 issue URL を Summary に含める。

## Blocked handling

作業を進められない場合は、推測で進めず `result.md` に以下を書く。

- blocker
- 最小限の確認事項
- workspace
- branch
- 関連 issue / PR

secret、token 断片、credential 値、private path の本文は記録しない。
