# Architecture

## Product shape
- webapp

## Main flows
- ユーザーがフェスを選ぶ
- タイムテーブルを見ながら見たいアーティストを選ぶ
- 衝突や移動を考慮しつつ周り順を作る
- 共有URLで他人がプランを閲覧する
- グループ招待リンクで友人と予定を比較する
- ユーザーがイベント追加・修正提案を送る
- 管理者が提案を承認し canonical data に反映する
- 管理者がチケットサイトURLからイベント情報を補助取得する

## Components
- timetable viewer
- route planner
- shareable plan page
- group comparison page
- admin event editor
- admin timetable editor
- proposal review queue
- duplicate event merge tool
- ticketing import helper
- theme switcher
- event / artist / stage data layer
- design token layer

## Data model / identifiers
- event
- event_source
- event_proposal
- artist
- stage
- timetable_entry
- user_plan
- plan_entry
- group
- group_member
- merge_candidate
- theme
- recommended_theme

## External dependencies
- チケットサイト（eplus / ぴあ / ローチケ / LivePocket / Zaiko など）
- 公式サイト
- 公式 X
- 公式タイムテーブル画像 / PDF

## Deployment / runtime
- まずは単一 webapp として開始
- 認証なしの閲覧・共有を優先する
- 個人プランは local storage または anonymous share id で保持する

## Unknowns
- 対応するチケットサイトの優先順位
- 移動時間ロジックの粒度
- 匿名プランの保存期間
- 提案を公開前に必ず承認するか、未検証ページとして出すか
- テーマ推奨を event metadata で持つか user preference で上書きするかの最終仕様

## UI theming direction
- レイアウトと情報設計は 1本化する
- `pop / standard / rock` を theme token で切り替える
- テーマ差分は color / typography emphasis / radius / texture に閉じ込める
- 状態表現（selected / conflict / disabled）の意味は全テーマで固定する
- 詳細は `docs/ui-themes.md` と `docs/screens.md` を参照
