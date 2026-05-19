# Product Brief

## Name
- Product name: Fes Route
- Repo slug: fes-route

## One-liner
- フェス参加者がタイムテーブルを見ながら、自分の周り順を作成・共有できる web app。

## User / customer
- フェスやサーキットイベントに行く参加者
- 複数アーティストの時間・会場移動を見比べながら、どれを見るか決めたい人

## Problem
- 見たいアーティストが多いほど、タイムテーブルと移動制約の整理が面倒になる
- SNS で共有されたおすすめや友人の回り方も見たいが、情報が散らばりやすい
- フェス当日に迷わず動ける形に落とし込めるツールが弱い

## MVP
- フェスのタイムテーブルをイベント単位で閲覧できる
- 見たいアーティストを選ぶと、自分用の周り順を組める
- できたプランを共有URLで他人に見せられる
- 管理サイドがイベント / タイムテーブルの canonical データを整備する
- ユーザーはログインなしでイベント追加・修正を提案できる

## Success signal
- 1つのフェスについて、参加前に自分のプランを作って保存・共有できる
- 「誰を見るか決める時間」が短くなったと感じられる
- 友人どうしでプラン比較や共有が自然に発生する

## Constraints
- Tech constraints: 初期は webapp 前提。イベント入力は管理サイドの手動運用を軸にする
- Time constraints: まずは canonical event 1件に対する MVP を早く成立させる
- Data / legal / rights constraints: タイムテーブル・アーティスト情報の取得元と利用条件を確認する必要がある

## Open questions
- どのチケットサイトから先にイベント情報の補助取得を実装するか
- 個人が登録したイベントを即公開にするか、管理承認後に公開するか
- おすすめロジックを MVP 外に出すか、簡易版だけ先に入れるか

## Detailed requirements
- See `docs/requirements.md`.
