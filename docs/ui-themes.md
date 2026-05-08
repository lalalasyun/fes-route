# UI Themes

Fes Route は 1つの情報設計 / コンポーネント構造を共有しつつ、テーマだけを切り替えられる設計にする。

## Goal

- ユーザーがフェスの雰囲気や気分に合わせて見た目を選べる
- UI の使い勝手は変えず、世界観だけを切り替えられる
- 実装では theme token で吸収し、画面分岐を増やさない

## Theme lineup

### 1. Pop

向いている場面:
- 友達と共有したいとき
- サーキット / 街フェス
- はじめて使うユーザー

印象:
- 明るい
- 楽しい
- カジュアル
- SNS で映える

キーワード:
- pink
- coral
- yellow
- aqua
- sticker-like

### 2. Standard

向いている場面:
- 普段使いのデフォルト
- 情報量が多いフェス
- 長時間見続ける利用

印象:
- 落ち着いている
- 読みやすい
- プロダクト感が強い
- 汎用性が高い

キーワード:
- dark navy
- teal
- blue
- crisp contrast
- balanced density

### 3. Rock

向いている場面:
- ロックフェス
- 夜帯の閲覧
- 世界観重視の使い方

印象:
- 渋い
- 没入感がある
- 少し硬質
- ポスター的な空気感

キーワード:
- charcoal
- black
- burgundy
- steel gray
- restrained accent

## Shared structure

以下は全テーマ共通:

- 画面レイアウト
- 情報の優先順位
- コンポーネントの種類
- ラベル文言
- 操作フロー
- 状態の意味（selected / conflict / disabled など）

つまり、見た目は変えても UI の学習コストは増やさない。

## Token model

テーマで切り替える対象は token に限定する。

### Core tokens

- `color.bg.canvas`
- `color.bg.surface`
- `color.bg.surfaceAlt`
- `color.text.primary`
- `color.text.secondary`
- `color.text.inverse`
- `color.border.default`
- `color.border.strong`
- `color.accent.primary`
- `color.accent.secondary`
- `color.state.conflict`
- `color.state.success`
- `color.state.warning`

### Typography tokens

- `font.family.base`
- `font.family.display`
- `font.weight.body`
- `font.weight.heading`
- `font.size.hero`
- `font.size.h1`
- `font.size.h2`
- `font.size.body`
- `font.size.caption`
- `letterSpacing.eyebrow`

### Radius / shape tokens

- `radius.card`
- `radius.button`
- `radius.badge`
- `radius.input`

### Shadow / texture tokens

- `shadow.card`
- `shadow.floating`
- `overlay.noise`
- `overlay.gradientHero`

### Component emphasis tokens

- `button.primary.bg`
- `button.primary.text`
- `button.secondary.border`
- `slot.selected.bg`
- `slot.selected.border`
- `slot.conflict.bg`
- `slot.conflict.border`
- `badge.conflict.bg`
- `badge.conflict.text`

## Theme token draft

### Pop

```yaml
name: pop
color:
  bg:
    canvas: '#1A1630'
    surface: '#241C43'
    surfaceAlt: '#2D2354'
  text:
    primary: '#FFF8F4'
    secondary: '#D8CFEA'
  accent:
    primary: '#FF6FAE'
    secondary: '#35E0D0'
  state:
    conflict: '#FF8A5B'
font:
  family:
    base: 'Inter, Noto Sans JP, sans-serif'
    display: 'Inter, Noto Sans JP, sans-serif'
radius:
  card: 24
  button: 999
  badge: 999
```

### Standard

```yaml
name: standard
color:
  bg:
    canvas: '#0F1221'
    surface: '#171B2E'
    surfaceAlt: '#1F2540'
  text:
    primary: '#F7F8FC'
    secondary: '#A5ACC8'
  accent:
    primary: '#76E4C3'
    secondary: '#8BA8FF'
  state:
    conflict: '#FF7D96'
font:
  family:
    base: 'Inter, Noto Sans JP, sans-serif'
    display: 'Inter, Noto Sans JP, sans-serif'
radius:
  card: 20
  button: 999
  badge: 999
```

### Rock

```yaml
name: rock
color:
  bg:
    canvas: '#111214'
    surface: '#18191C'
    surfaceAlt: '#202226'
  text:
    primary: '#F3F0EC'
    secondary: '#B8B0AA'
  accent:
    primary: '#A61E2A'
    secondary: '#6E7681'
  state:
    conflict: '#D14B57'
font:
  family:
    base: 'Inter, Noto Sans JP, sans-serif'
    display: 'Inter, Noto Sans JP, sans-serif'
radius:
  card: 16
  button: 12
  badge: 999
```

## Screen behavior spec

### 1. Event / timetable screen

共通要素:
- event title
- date / venue
- timetable columns
- slot cards
- theme switcher
- share button
- selected count

テーマ差分:
- 背景色とアクセント
- slot card の彩度
- 見出しの存在感
- button の角丸とコントラスト

不変条件:
- スロットの並び順
- conflict の意味
- 選択導線
- 共有導線の位置

### 2. My route sidebar

共通要素:
- `あなたの周り順`
- 選択順の時系列リスト
- conflict warning
- reset / share action

テーマ差分:
- warning の見せ方
- card density
- badge の表現

不変条件:
- route summary は常に上部
- conflict 状態は色だけに依存しない
- 時刻とステージ名は毎行表示

### 3. Shared plan page

共通要素:
- 誰のプランか
- どのフェスか
- 選択済みルート
- timetable preview
- copy / duplicate CTA

テーマ差分:
- hero の演出
- 背景テクスチャ
- CTA の強さ

不変条件:
- 共有リンクを開いた相手が迷わず閲覧できること
- テーマが違っても同じ情報が同じ順で読めること

## Theme selection policy

初期仕様:
- デフォルトは `standard`
- ユーザーが手動で `pop / standard / rock` を切り替え可能
- イベントに `recommendedTheme` を持たせられる
- `use event recommendation` を ON にするとイベント推奨テーマを優先

データ例:

```json
{
  "theme": "standard",
  "useEventRecommendation": true,
  "event": {
    "id": "tokyo-sound-weekend-2026",
    "recommendedTheme": "rock"
  }
}
```

## Accessibility rules

- すべてのテーマで本文コントラストを AA 以上目標にする
- conflict / selected / disabled は色だけでなくラベルや border でも判別可能にする
- theme 切替後もレイアウトシフトを最小化する
- 長時間閲覧前提で、背景ノイズや装飾は本文可読性を壊さない範囲に抑える

## Implementation notes

- HTML structure は共通
- CSS variables または design token JSON でテーマ切替
- コンポーネント props に `theme-specific logic` を持ち込まない
- `data-theme="pop|standard|rock"` のような切替を基本にする
- スクショ生成、共有ページ、将来のネイティブアプリでも同じ token 名を流用できるようにする

## First implementation slice

最初にやる範囲:
1. theme switcher UI を入れる
2. 既存 Standard を token 化する
3. Pop / Rock の token を追加する
4. slot / button / badge / page background だけテーマ反映する
5. shared URL に theme を含める
