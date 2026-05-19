---
name: push
description:
  現在ブランチを origin に push し、対応する pull request を作成または更新する。
  fes-route では `./scripts/symphony-validate.sh` を必須 gate として使う。
---

# Push

## 前提

- `gh auth status` が成功する
- 現在ブランチが PR 対象である
- `./scripts/symphony-validate.sh` が通る

## 手順

1. 現在ブランチ名を確認する
2. `./scripts/symphony-validate.sh` を実行する
3. `git push -u origin HEAD` で push する
4. non-fast-forward なら `pull` skill で `origin/main` を merge して解決する
5. PR の有無を確認する
   - なければ作成
   - あれば title/body を現在の差分に合わせて更新
6. PR body は `.github/pull_request_template.md` を埋めて作る
7. `symphony` label を付与する（なければ作成してから付与）
8. PR URL を返す

## PR title 方針

- conventional-ish で短く明確に
- 例: `feat: add Symphony workflow and local bootstrap scripts`
- 実際の差分全体を表すタイトルにする

## 実行メモ

```sh
branch=$(git branch --show-current)
./scripts/symphony-validate.sh
git push -u origin HEAD
```

PR が無い場合:

```sh
gh pr create --title "$PR_TITLE" --body-file /tmp/pr_body.md
```

PR がある場合:

```sh
gh pr edit --title "$PR_TITLE" --body-file /tmp/pr_body.md
```

label の用意:

```sh
gh label create symphony --repo lalalasyun/fes-route --color 6E40C9 --description "Symphony-managed PR" || true
gh pr edit --add-label symphony
```

## PR body の最低要件

- Summary を埋める
- What changed を埋める
- Validation を埋める
- Risks / follow-ups を埋める
- placeholder を空で残さない

## 注意

- `--force` は使わない。必要時のみ `--force-with-lease`
- validation 失敗時は push しない
- docs だけの変更でも `./scripts/symphony-validate.sh` は通す
