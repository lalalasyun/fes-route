---
name: github_project
description:
  GitHub Issues / Projects v2 を Symphony の control plane として扱うための補助メモ。
---

# GitHub Project

`fes-route` では Linear ではなく **GitHub Issues + GitHub Projects v2** を tracker として使う。

## 基本方針

- issue が作業単位
- Projects v2 の `Status` が orchestration 用 state
- 進捗は issue comment の `## Codex Workpad` に集約
- PR URL は issue comment と PR 自体の双方から辿れるようにする

## 使う state

この repo の想定 state:

- `Todo`
- `Pending`
- `In progress`
- `In Progress`
- `Done`

必要なら project field を追加して `Human Review` / `Merging` 相当を増やしてよいが、最初は GitHub 標準寄りに寄せる。

## Project item の取得

```sh
gh api graphql -f query='query($number:Int!){ viewer { projectV2(number:$number) { items(first:100) { nodes { id content { __typename ... on Issue { number title url state } } fieldValues(first:20) { nodes { __typename ... on ProjectV2ItemFieldSingleSelectValue { name field { ... on ProjectV2FieldCommon { name } } } } } } } } } }' -F number=8
```

## Workpad comment 作成

```sh
gh issue comment <issue-number> --body-file /tmp/workpad.md
```

## 既存 comment 更新

Issue comment の更新は REST API を使う:

```sh
gh api repos/lalalasyun/fes-route/issues/comments/<comment-id> \
  -X PATCH \
  -f body@=/tmp/workpad.md
```

## Projects v2 の Status 更新

まず project field / option id を調べる:

```sh
gh api graphql -f query='query($number:Int!){ viewer { projectV2(number:$number) { id fields(first:20) { nodes { ... on ProjectV2FieldCommon { id name dataType } ... on ProjectV2SingleSelectField { options { id name } } } } } } }' -F number=8
```

更新 mutation:

```graphql
mutation UpdateProjectStatus($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
  updateProjectV2ItemFieldValue(
    input: {
      projectId: $projectId
      itemId: $itemId
      fieldId: $fieldId
      value: { singleSelectOptionId: $optionId }
    }
  ) {
    projectV2Item {
      id
    }
  }
}
```

## ルール

- issue 本文を progress log 代わりに書き換えない
- review / blocked / handoff はまず workpad comment に残す
- PR を作ったら issue comment に URL を残す
- status 名は hardcode しすぎず、必要なら GraphQL で field / option id を引いてから使う
