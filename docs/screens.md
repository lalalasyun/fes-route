# Screen Spec

## 1. Event timetable screen

目的:
- フェス全体像を見ながら、見たいアーティストを選ぶ
- モック画像のように、左の時間軸と右の周り順を同時に見ながら編集する

主要要素:
- header
- compact global nav
- event command bar
- event meta
- theme switcher
- search / filter / stage filter
- timetable columns
- selected count
- move time total
- conflict alert
- share action
- route sidebar

主要アクション:
- アーティストを選ぶ / 外す
- テーマを切り替える
- 共有URLをコピーする
- 周り順をリセットする
- ステージで絞り込む
- お気に入りとして一時保存する

成功条件:
- どの時間が埋まっているか一目で分かる
- 選択結果が右側に即反映される
- conflict が即時に分かる
- 移動時間込みで「この順番で回れるか」が分かる
- desktop では 1画面で編集でき、mobile では route summary を失わない

## 2. Shared route screen

目的:
- 他人が共有リンクからプランをすぐ理解できる
- 共有された周り順を先に読み、必要なら自分用に複製する

主要要素:
- event title
- selected route summary
- move time total
- conflict warning
- timetable preview
- duplicate / save CTA
- theme indicator
- source plan context

成功条件:
- ログインなしでも読める
- 作成者の意図が分かる
- 自分のプランとして複製したくなる
- mobile では route list が timetable より先に表示される

## 3. Theme settings surface

目的:
- テーマを好みと文脈で切り替えられる

主要要素:
- theme selector: Pop / Standard / Rock
- event recommendation toggle
- preview chips

成功条件:
- テーマ差分が視覚的に明確
- それでも操作方法は同じに見える
- 変更後の違和感が少ない

## 4. Mobile route tray

目的:
- 当日スマホで、選択済み予定と衝突状態を常に確認する

主要要素:
- selected count
- move time total
- conflict status
- expand / collapse handle
- route list
- share action

成功条件:
- タイムテーブルをスクロールしても現在の周り順を見失わない
- 展開時に共有と削除操作まで完結する
- 横スクロール stage lanes と干渉しない
