# Backlog

Issue #26 review では、次の実装順を推奨する。

1. Prototype UX hardening
2. Durable foundation spikes
3. Durable foundation implementation
4. Durable MVP features
5. Later product depth

## Prototype UX hardening

既存 vanilla JS + static assets + local Node server のまま進める。

### Route sidebar timeline stepper

Tracking issue: https://github.com/lalalasyun/fes-route/issues/27

- Right panel を `あなたの周り順` の sticky timeline stepper にする。
- Route item に order, artist, time range, stage, stage color, move gap, conflict marker を表示する。
- Summary に選択数 / 移動時間 / 衝突数を表示する。
- Share CTA を panel bottom の primary action として固定する。

Acceptance criteria:

- Desktop で timetable を操作しても route summary が見失われない。
- 選択解除、reset、share copy の既存挙動が壊れない。
- 0件 / conflict なし / conflict ありの状態が文言で区別できる。

### Mobile route tray

Tracking issue: https://github.com/lalalasyun/fes-route/issues/28

- Mobile で route summary tray を追加する。
- Collapsed state で選択数 / 移動時間 / 衝突状態を表示する。
- Expanded state で route list と share action を操作できる。
- Stage lane の横スクロールと干渉しないようにする。

Acceptance criteria:

- 375px 幅で text overflow / incoherent overlap がない。
- Timetable scroll 中も selected route の状態を確認できる。
- Desktop layout に不要な regression がない。

### Movement and conflict detail

Tracking issue: https://github.com/lalalasyun/fes-route/issues/29

- Stage distance matrix を sample data または app config に追加する。
- Same stage は 0分、matrix 未登録は fallback 5分として扱う。
- Route item 間に `同ステージ` / `徒歩 N分` / `移動余裕が少ない` を表示する。
- Conflict alert に、どの予定同士が重なるかを表示する。

Acceptance criteria:

- 時間重複と移動余裕不足が別の状態として読める。
- Timetable slot と route item の両方で conflict が分かる。
- Matrix がない stage でも fallback で表示が破綻しない。

### Shared route view

Tracking issue: https://github.com/lalalasyun/fes-route/issues/30

- Shared URL を開いた画面を「友人のプラン閲覧」向けに再構成する。
- Route list を timetable より優先して表示する。
- `自分の周り順として開く` と `共有URLをコピー` を分ける。
- Edit affordance は弱め、複製後に編集できる導線にする。

Acceptance criteria:

- ログインなしで shared plan が読める。
- Mobile では shared route list が timetable より先に見える。
- Hash-only share の既存 URL 互換を維持する。

### Standard theme and stage tokens

Tracking issue: https://github.com/lalalasyun/fes-route/issues/32

- Existing Standard theme を CSS variables / tokens に寄せる。
- Stage color tokens を slot card / lane / route item に適用する。
- Theme switcher UI の最小版を追加する。
- Shared URL に theme を含める。

Acceptance criteria:

- `standard` が default のまま動く。
- theme 切替で selected route が消えない。
- Slot selected / conflict は色だけでなく label or border でも判別できる。

## Durable foundation spikes

Production migration を目的にせず、短い検証 PR または docs/ADR で結論を残す。

Umbrella tracking issue: https://github.com/lalalasyun/fes-route/issues/31

### Cloudflare app shell spike

Tracking issue: https://github.com/lalalasyun/fes-route/issues/31

- React + Vite + TypeScript を Workers Static Assets で serve する最小構成を検証する。
- Hono API route と static frontend route が同居できることを確認する。
- Local dev / build / deploy command の候補を docs に残す。

### D1 schema and migrations spike

- `events`, `artists`, `stages`, `timetable_entries`, `event_sources`, `event_proposals`, `user_plans`, `user_plan_entries` の migration skeleton を作る。
- Duplicate-prevention 用 unique constraints を D1 で表現できるか確認する。
- Local D1 と remote D1 の運用メモを残す。

### R2 source attachment spike

- Event source に image / PDF / screenshot reference を紐づける最小 API を検証する。
- R2 key namespace と D1 record の関係を決める。
- Public access させるものと admin-only source artifact を分ける。

### Admin auth spike

- Better Auth を admin-only boundary として使えるか検証する。
- Workers / D1 / local dev との互換性、session handling、migration cost を記録する。
- 重い場合の fallback として lightweight custom admin auth の最小要件を残す。

### Share ID migration spike

- Hash-only plan URL から server-persisted `shareId` URL への移行方針を決める。
- `shareId` の entropy, expiry, deletion, bearer access の扱いを決める。
- Anonymous user id と plan ownership の最小仕様を残す。

### Import adapter contract spike

- Ticket-site / official-site import adapter の input / output / warning / provenance contract を決める。
- 1サイトだけ operator-triggered fetch / normalize / manual review を試す。
- Unsupported / blocked source の扱いを docs に残す。

## Durable foundation implementation

Spikes の結論後に着手する。

- React + Vite + TypeScript app structure を導入する。
- Workers + Hono public/admin API boundary を作る。
- D1 migrations と seed data を追加する。
- Public read API for events / stages / artists / timetable entries を作る。
- `shareId` create/read API を作る。
- Admin auth boundary を作る。
- Lightweight admin shell を作る。

## Durable MVP features

- Admin event create/edit/publish/archive
- Admin timetable create/edit/change history
- Public event detail and timetable against API
- Anonymous plan persistence with `shareId`
- Group invite and group plan comparison
- User event/timetable proposal submission
- Admin proposal review queue
- Duplicate candidate detection and merge review
- Operator-triggered import helper with manual review

## Later

- Pop / Rock token polish beyond the first switcher
- Event `recommendedTheme`
- Attendee account linking
- User-submitted proposal rate limiting
- Scheduled source refresh and queue orchestration
- Event merge UI polish
- Recommendation and playlist integrations
- Comments / impressions
- Past event participation history
- Artist performance history
- Friend graph and social feed
- Native app exploration
