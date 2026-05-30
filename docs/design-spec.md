# Design-based Product Spec

Fes Route の 3テーマ（Pop / Standard / Rock）を前提に、共通 UI 構造と詳細仕様を定義する。

---

## 1. Spec goal

この仕様書の目的:
- デザインの雰囲気差分を保ったまま、共通構造を固定する
- 実装時に迷いやすいレイアウト / 状態 / 文言 / URL 仕様を先に決める
- Figma と実装で同じ前提を使えるようにする

非目的:
- 最終ビジュアルの細部確定
- API 仕様の確定
- 認証方式の確定

---

## 2. Product principles

1. **見た目は切り替わっても使い方は変えない**
2. **タイムテーブル閲覧 → 選択 → 周り順確認 → 共有** の主導線を最短にする
3. **長時間見る画面** なので、派手さより可読性を優先する
4. **テーマは世界観の切替であって機能差ではない**
5. **共有先の相手が初見でも読める** ことを重視する

---

## 3. Information architecture

初期の主要画面は 3つ。

### A. Event timetable screen
主目的:
- フェス全体を見ながら、自分の周り順を組む

### B. Shared route screen
主目的:
- 共有リンクから他人のプランを理解する

### C. Theme settings surface
主目的:
- テーマ選択とイベント推奨テーマ利用を切り替える

---

## 4. Shared page anatomy

全テーマ共通の画面構造:

1. Global header
2. Hero / event summary
3. Primary action row
4. Main content area
   - Left: timetable
   - Right: route sidebar
5. Footer meta (optional)

Desktop 基本構成:
- 12-column grid
- content max-width: 1280px
- outer padding: 20-32px
- main gap: 20-24px
- left/right ratio: 8:4 または 7.5:4.5

Tablet:
- 上部は共通
- main area は 1 column に落とす
- route sidebar は timetable の下へ

Mobile:
- 上から順に
  1. event meta
  2. primary actions
  3. route summary
  4. timetable
- route は accordion または sticky bottom tray を検討

---

## 5. Event timetable screen spec

### 5.1 Purpose
- 参加者が「何を見るか」を最短で決める
- 時間衝突をすぐ把握する
- 選択内容をそのまま共有できる

### 5.2 Layout blocks

#### Header block
表示要素:
- product logo / wordmark
- current theme label
- theme switcher entry point
- optional event switcher（初期は不要でもよい）

#### Hero block
表示要素:
- event title
- date
- venue
- short support copy
- selected count
- conflict count

サポートコピー例:
- `見たいアーティストを選ぶと、あなたの周り順を右側にまとめます。`

#### Action row
表示要素:
- `共有URLをコピー`
- `リセット`
- optional: `このテーマを使う`

優先順位:
1. 共有
2. リセット
3. テーマ関連補助

#### Timetable area
表示要素:
- stage columns
- stage title
- slot cards
- current time indicator（将来）

#### Route sidebar
表示要素:
- title: `あなたの周り順`
- summary text
- selected route list
- conflict warning
- share / reset actions（desktop では重複可）

### 5.2.1 Mock-aligned frontend direction

共有モック3案から、初期実装は **dark utility + festival accent** を採用する。

採用するもの:
- 1枚目の実用性: 上部ナビ、左タイムテーブル、右の固定ルートパネル、共有CTA
- 2枚目の楽しさ: ステージ別の強い色分け、星/お気に入り、当日感のある小さな装飾
- 3枚目の密度: 大きすぎないヘッダー、縦時間軸、警告の明確さ、編集/保存/クリアの操作群

採用しないもの:
- 2枚目の過度な装飾量。MVPでは背景花火や大きなイラストより、情報密度と読みやすさを優先する
- 1枚目の大きなマーケティング風ヒーロー。実画面の主役はタイムテーブルにする
- 3枚目の単色ロック寄りトーン固定。イベントごとにテーマ差し替えできる前提を残す

初期の見た目:
- 背景: 深い navy / black を基調に、薄いフェス波形または光の線を控えめに入れる
- カード: 角丸 8-12px、透明度のある dark surface、細い border
- CTA: `共有URLをコピー` を最も強いボタンにし、teal to blue または theme accent で目立たせる
- 警告: `時間衝突あり` は赤系の専用 block と badge を使い、選択色より優先する
- ステージ色: stage token を持ち、slot card / lane tint / route item accent に同じ色を使う
- 文字: 日本語を読みやすくするため、本文は 14-16px、カード内タイトルは 15-18px に留める

画面の第一印象:
- desktop: 「フェス用の実用ツール」に見える。左右2ペインで、その場で編集できる
- mobile: 「今日どこを回るか」に集中する。マイプランを先に見せ、必要に応じてタイムテーブルを開く
- shared view: 「友人のプランを見る」画面に見える。編集操作を減らし、複製/自分用に開く導線を強くする

### 5.2.2 Navigation model

Top navigation はモック共通の構造を踏襲する。

Primary tabs:
- `タイムテーブル`
- `マイルート`
- `アーティスト`
- `マップ`
- `ステージ情報`

MVPで実装する active tab:
- `タイムテーブル`
- `マイルート` は同一画面内の右パネル / mobile tray に対応する

MVPでは placeholder に留めるもの:
- `アーティスト`
- `マップ`
- `ステージ情報`

Header actions:
- search icon: 将来のアーティスト検索
- bookmark icon: 保存済みプラン
- profile/menu icon: 将来のログイン/表示名

未実装項目は押せない装飾にせず、`Coming soon` toast を返す。ユーザーが現在使える機能を誤解しないようにする。

### 5.2.3 Desktop composition

Desktop では 1024px 以上を基準に、次の比率にする。

- App shell max-width: 1440px
- Outer padding: 20-24px
- Main grid: `minmax(680px, 1fr) 360px`
- Timetable panel: 左に大きく配置
- Route panel: 右に sticky 表示、viewport 内でスクロール

上から順:
1. Compact global nav
2. Event command bar
3. Main split layout

Event command bar:
- 左: day switcher / date / event name
- 中: search / filter / stage filter
- 右: weather or venue mini info, optional

Timetable panel:
- 左端に time axis
- 横に stage lanes
- lane header は icon + stage name + short label
- slot card は実時間に比例して配置
- selected / favorite / conflict / tentative の状態を重ねて表示できる

Route panel:
- 上部: `あなたの周り順`、編集ボタン
- summary metrics: 選択数、移動時間、衝突数
- conflict alert: 衝突時のみ赤い block
- route list: timeline stepper 形式
- bottom: 強い share CTA、補助 action

### 5.2.4 Mobile composition

Mobile は desktop の縮小ではなく、当日利用を優先する。

Default order:
1. Compact header
2. Event/day selector
3. Route summary tray
4. Timetable

Route summary tray:
- sticky bottom または timetable 上部の collapsible panel
- `選択 N組 / 移動 M分 / 衝突あり` を常時見せる
- `共有URLをコピー` は tray 展開時に表示する

Timetable mobile behavior:
- stage lanes は横スクロール
- time axis は左固定
- slot card は最小幅 132px 以上を確保
- stage filter で1-2ステージだけ表示できる

Shared view mobile:
- 共有された route list を先に出す
- timetable は `タイムテーブルで見る` で下に続く
- `自分の周り順として開く` を share CTA より上に置く

### 5.2.5 Route planning details

モックの右パネルに合わせ、route item は単なる選択リストではなく「移動順」に見せる。

Route item fields:
- order number
- artist
- time range
- stage
- stage color accent
- favorite/bookmark action
- conflict marker
- move gap to next item

Move gap:
- stage が変わる場合は `徒歩 N分`
- 同じ stage の場合は `同ステージ`
- gap が短すぎる場合は warning: `移動余裕が少ない`
- 時間が重なる場合は danger: `時間衝突あり`

Conflict rules:
- 時間重複は赤 alert と route item badge の両方に出す
- route item 内には「どの予定と重なるか」を1行で出す
- timetable 側の該当 slot も danger border にする

Initial movement model:
- `same stage = 0分`
- `different stage = stage distance matrix`
- matrix 未登録時は fallback `徒歩5分`

### 5.2.6 Design tokens

Theme は機能差ではなく token 差にする。

Base tokens:
- `--app-bg`
- `--surface`
- `--surface-strong`
- `--border`
- `--text`
- `--muted`
- `--accent`
- `--accent-contrast`
- `--danger`
- `--warning`
- `--success`

Stage tokens:
- `--stage-blue`
- `--stage-green`
- `--stage-sunset`
- `--stage-red`
- `--stage-neutral`

Component tokens:
- `--slot-radius: 10px`
- `--panel-radius: 14px`
- `--button-radius: 10px`
- `--shadow-panel`
- `--shadow-active`

Theme presets:
- Standard: 1枚目寄り。teal / blue accent、実用寄り
- Pop: 2枚目寄り。pink / cyan / yellow accent、楽しいが情報優先
- Rock: 3枚目寄り。red / warm gray accent、高密度

MVP の default は Standard。

### 5.3 Timetable grid behavior

初期仕様:
- stage ごとに縦カラムを持つ
- slot は開始時刻順に並ぶ
- 高さは実時間比例が理想だが、初期 MVP は均等カードでも可
- 同一 stage 内では slot の順序のみ保証

将来仕様:
- 分単位グリッド
- ステージ間移動時間の視覚化
- 現在時刻ライン

### 5.4 Slot card spec

必須表示:
- artist name
- start - end time
- stage name（必要に応じて省略可だが shared では表示推奨）

任意表示:
- genre tag
- popularity / recommendation marker
- playlist shortcut

クリック時:
- 未選択 → 選択に変わる
- 選択済み → 選択解除
- 選択後、route sidebar を即更新

状態:
- default
- hover
- selected
- conflict
- selected + conflict
- disabled（将来）

状態ルール:
- `selected` はユーザーが route に入れた状態
- `conflict` は selected slot 同士で時間重複がある状態
- conflict は timetable / sidebar の両方に反映する

視覚ルール:
- selected: accent border + accent tint
- conflict: warning/danger border + icon or label
- selected + conflict: selected より conflict を優先表示

文言例:
- badge: `時間衝突あり`

### 5.5 Route sidebar spec

上から順に表示:
1. title
2. summary
3. warning block
4. route list
5. bottom actions

#### Summary text rules
未選択:
- `まだ未選択です。タイムテーブルから気になるアーティストを選んでください。`

選択済み / conflict なし:
- `3組を選択中 / 時間衝突なし`

選択済み / conflict あり:
- `5組を選択中 / 2件の時間衝突あり`

#### Route item spec
必須表示:
- order index
- artist name
- time range
- stage name

任意表示:
- move gap
- memo icon
- recommendation reason

conflict item:
- item 全体に warning accent
- テキストで `衝突` を併記

### 5.6 Theme switcher spec

表示形式候補:
- segmented control
- dropdown
- chip row

初期推奨:
- desktop: segmented control
- mobile: bottom sheet / compact select

選択肢:
- Pop
- Standard
- Rock
- `イベント推奨を使う` toggle

ルール:
- theme 切替で route 状態は消さない
- theme 切替で URL を更新する
- event recommendation が ON の場合、event の recommendedTheme を優先する

### 5.7 Primary CTA behavior

#### 共有URLをコピー
含める情報:
- event id
- selected slot ids
- theme
- recommendation mode の有無（必要なら）

例:
`/events/tokyo-sound-weekend-2026#plan=s1,s3,s7&theme=rock`

成功時:
- toast: `共有URLをコピーしました`

失敗時:
- toast: `URLコピーに失敗しました`

#### リセット
動作:
- selected slots を空にする
- conflict 状態を解除
- URL の plan parameter を消す
- theme は維持する

---

## 6. Shared route screen spec

### 6.1 Purpose
- 共有されたプランを見た相手が内容を一目で把握できる
- 自分のプランとして再利用したくなる

### 6.2 Required blocks
- event title
- owner label or anonymous label
- selected route summary
- route list
- timetable preview
- CTA row

### 6.3 CTA row
優先順:
1. `このプランを使う`
2. `自分用に複製`
3. `共有URLをコピー`

初期 MVP では最低限:
- `共有URLをコピー`
- `自分の周り順として開く`

### 6.4 Shared context copy
例:
- `syun の周り順`
- `このプランでは 5組を回ります`
- `2件の時間衝突があります`

### 6.5 Differences from edit screen
- 編集 UI は弱める
- slot の選択 affordance は外す、または複製後に有効化する
- 閲覧のしやすさを優先する

---

## 7. Theme settings surface spec

### 7.1 Purpose
- テーマを選びやすくする
- テーマ差分を説明しすぎず伝える

### 7.2 Required blocks
- current theme
- theme cards x3
- event recommendation toggle
- short description per theme
- preview swatches

### 7.3 Theme card contents
- theme name
- one-line description
- sample colors
- suggested use cases

例:
- Pop: `共有しやすく、明るい雰囲気`
- Standard: `日常利用向けの読みやすい標準テーマ`
- Rock: `渋く没入感のあるテーマ`

---

## 8. Theme-specific design rules

### 8.1 Pop

狙い:
- 楽しさ
- フレンドリーさ
- SNS 共有時の映え

表現ルール:
- accent を強く使う
- card の角丸は大きめ
- badge は sticker 的
- hero copy は少し軽快でもよい

避けること:
- 情報過多
- 色数を増やしすぎること
- 長時間閲覧で疲れる高彩度連打

### 8.2 Standard

狙い:
- 読みやすさ
- 信頼感
- 迷わない UI

表現ルール:
- コントラストを安定させる
- accent は必要箇所だけ
- 一番長時間見やすい密度にする

避けること:
- 無機質すぎる見た目
- Hero が弱すぎてプロダクトの印象が薄くなること

### 8.3 Rock

狙い:
- 没入感
- 渋さ
- 音楽カルチャー感

表現ルール:
- 黒 / チャコール / 深赤中心
- 角丸は控えめ
- CTA は光らせすぎないが存在感は持たせる
- 見出しはやや強めでよい

避けること:
- 可読性を壊す過度な質感
- 装飾優先で情報が沈むこと

---

## 9. Copy spec

### 9.1 Fixed labels
- `タイムテーブル`
- `あなたの周り順`
- `共有URLをコピー`
- `リセット`
- `時間衝突あり`
- `イベント推奨を使う`

### 9.2 Tone rules
- Pop: 少し親しみを持たせてよい
- Standard: 最も中立
- Rock: 文言自体は変えすぎず、見た目で世界観を出す

原則:
- テーマごとに UI 文言は大きく変えない
- 切り替わるのは tone ではなく visual が主体

---

## 10. State model

### 10.1 Route-related state
- no_selection
- selected_clean
- selected_conflicted

### 10.2 Theme-related state
- manual_theme_pop
- manual_theme_standard
- manual_theme_rock
- event_recommended_theme

### 10.3 URL state
初期案:
- `plan`: comma-separated slot ids
- `theme`: pop | standard | rock
- `source`: shared | local（必要なら）

例:
`/events/tokyo-sound-weekend-2026#plan=s1,s3,s7&theme=pop`

---

## 11. Accessibility and UX constraints

- selected / conflict は色だけで判別させない
- sidebar summary はスクリーンリーダーで読めるようにする
- segmented theme switcher は keyboard focus 対応する
- mobile で CTA が画面外に消えないようにする
- Rock theme でも本文 contrast を優先する
- Pop theme でも warning は十分目立たせる

---

## 12. First implementation breakdown

### Phase 1
- theme switcher 追加
- theme を URL に保存
- CSS variables 化
- Pop / Standard / Rock の 3テーマ切替

### Phase 2
- shared page を分離
- event recommendation toggle 追加
- shared URL に theme 反映

### Phase 3
- actual time-based timetable layout
- move time logic
- duplicate / save flow

---

## 13. Open decisions

- shared page を edit page と完全分離するか
- recommendedTheme を event metadata に持つか curated mapping にするか
- mobile では route sidebar を bottom tray にするか独立 block にするか
- Rock theme で display font を変えるか
- 共有時に theme 固定で渡すか、閲覧者ローカル theme を優先可能にするか
