# Fes Route

フェスのタイムテーブルから、自分だけの周り順を作って共有できる web app。

## One-liner

出演時間・会場移動・見たいアーティストをもとに、無理のないフェス回遊プランを作る。

## Initial MVP

- タイムテーブル閲覧
- 見たいアーティストを選んで自分の周り順を作成
- 共有URLでプラン共有

## Next ideas

- おすすめアーティスト提案
- アーティスト単位のプレイリスト導線
- コメント / 感想
- 過去フェス参加履歴と出演履歴

## Prototype

- タイムテーブル表示
- アーティスト選択による周り順生成
- URL hash ベースの共有
- 時間衝突の簡易表示

起動:

```bash
npm run dev
```

ブラウザで `http://127.0.0.1:4173` を開く。

## Theme direction

- `Pop` — 明るく共有向き
- `Standard` — 普段使いのデフォルト
- `Rock` — 渋めで没入感強め

構造は共通、見た目だけを theme token で切り替える前提。

## Docs

- `docs/brief.md` — プロダクトの要約
- `docs/scope.md` — MVP と非目標
- `docs/architecture.md` — 初期アーキテクチャ仮説
- `docs/ui-themes.md` — テーマ設計と token 方針
- `docs/screens.md` — 画面仕様
- `docs/design-spec.md` — デザイン起点の詳細仕様
- `docs/backlog.md` — 次の打ち手
