# Architecture

## Product shape
- webapp

## Main flows
- ユーザーがフェスを選ぶ
- タイムテーブルを見ながら見たいアーティストを選ぶ
- 衝突や移動を考慮しつつ周り順を作る
- 共有URLで他人がプランを閲覧する

## Components
- timetable viewer
- route planner
- shareable plan page
- theme switcher
- event / artist / stage data layer
- design token layer

## Data model / identifiers
- event
- artist
- stage
- timeslot
- user_plan
- plan_entry
- theme
- recommended_theme

## External dependencies
- フェス情報のデータソース（未定）
- 地図や移動時間補助を入れる場合は外部APIの検討余地あり

## Deployment / runtime
- まずは単一 webapp として開始
- 認証なしの共有を優先し、保存機能は後で判断

## Unknowns
- データ更新フロー
- 移動時間ロジックの粒度
- 保存・編集のための認証要否
- テーマ推奨を event metadata で持つか user preference で上書きするかの最終仕様

## UI theming direction
- レイアウトと情報設計は 1本化する
- `pop / standard / rock` を theme token で切り替える
- テーマ差分は color / typography emphasis / radius / texture に閉じ込める
- 状態表現（selected / conflict / disabled）の意味は全テーマで固定する
- 詳細は `docs/ui-themes.md` と `docs/screens.md` を参照
