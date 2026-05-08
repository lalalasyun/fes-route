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
- event / artist / stage data layer

## Data model / identifiers
- event
- artist
- stage
- timeslot
- user_plan
- plan_entry

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
