# Technology Selection

決定日: 2026-06-02

## 推奨構成

本実装は **Cloudflare Workers を中心にした full-stack TypeScript web app** として作る。

- runtime / hosting: Cloudflare Workers
- static assets: Workers Static Assets
- app / API framework: Hono
- type-safe client: Hono RPC (`hc`)
- validation: Zod + `@hono/zod-validator`
- database: Cloudflare D1
- storage: Cloudflare R2
- auth: Better Auth
- admin / CMS: Payload CMS
- frontend: React + Vite + TypeScript
- styling: Tailwind CSS + shadcn/ui + project-owned design tokens
- secrets: Doppler + Cloudflare secrets / bindings
- product tracking: Linear project
- deployment: Cloudflare Workers Builds + Wrangler

現在の vanilla JS prototype は挙動確認用として残し、本格実装は persistent plan、admin review、ticket-site import helper を入れる前にこの構成へ移す。

## Decision

Pages or Workers で悩む場合、Fes Route は **Workers を第一候補**にする。

Pages が強いのは、静的 frontend に軽い Functions を足す構成。Fes Route は Hono RPC、D1、R2、Better Auth、admin workflow、import helper を同じ product boundary に置きたいので、Worker を主役にしたほうが設計がまっすぐになる。

Workers Static Assets を使えば、frontend assets と Worker logic を同じ deploy unit に置ける。通常の page / asset request は static assets に逃がし、`/api/*` や auth / admin / import helper だけ Worker を優先する構成にできる。

GitHub Actions に依存しない方針も、Cloudflare Workers Builds / Git integration をまず使う。外部 CI SaaS を増やすより、Cloudflare native build と Wrangler manual deploy の組み合わせで始める。

## Fes Route に合う理由

Fes Route は mobile web が主導線で、domain は小さいが relational。中心は events、stages、artists、timetable entries、user plans、groups、proposals、sources。難所は heavy infrastructure ではなく、データ品質、共有、admin workflow。

Workers + Hono は、公開ページ、API、share page、admin mutation、import helper を軽い TypeScript boundary でまとめやすい。Hono RPC を使うと server route の型を frontend client に共有できるので、small team / agent-driven implementation でも API contract を崩しにくい。

D1 は Fes Route の初期規模に合う。event / timetable / plan / proposal の schema を SQL migration として明示し、D1 binding 経由で Worker から扱う。大量分析や complex relational workload が必要になったら Postgres を再検討する。

R2 は event hero images、timetable images、PDFs、source screenshots の保存先にする。canonical text fields は R2 object ではなく D1 に置く。

Better Auth は attendee flow をログイン必須にしないまま、admin / future account upgrade の auth boundary を置くために使う。MVP では public users は login なし、admin users は auth 必須にする。

Payload CMS は管理画面として使う。ただし Cloudflare Worker 内に無理に同居させるのではなく、admin / CMS runtime は別 deploy unit として扱い、media storage を R2、canonical app API を Workers に寄せる方針にする。

## Stack details

### Frontend

- React + Vite
- Tailwind CSS
- shadcn/ui
- TypeScript everywhere
- Hono RPC client (`hc`) で API を呼ぶ
- timetable selection、route tray、theme switcher、group comparison interactions は client-side UI として作る

まずは install-free な mobile web app。offline / 当日利用が hard requirement になったら PWA を検討する。

`pop / standard / rock` themes は別 component tree ではなく token 差分に閉じ込める。shadcn/ui は土台として使い、Fes Route 固有の状態表現、stage color、route conflict、theme token は project-owned にする。

### Backend / API

- Hono on Cloudflare Workers
- Hono RPC で route 型を frontend に共有する
- validation は Zod + `@hono/zod-validator`
- public read API と admin mutation API を分ける
- canonical writes は server-only path に閉じる
- public share pages は internal numeric ID ではなく opaque `shareId` で解決する

route 定義は chained method と declared variable から `AppType` を export する。frontend は `hc<AppType>('/api')` を使い、TanStack Query などに載せる。

### Database

- Cloudflare D1
- migrations は repo に置く
- public entities は stable slug
- share links / invitations は opaque token
- duplicate prevention は unique constraints と candidate scoring を併用する
- source URL、event date / venue / name candidate、timetable entry identity は特に重複防止を意識する

Fes Route は canonical event model を守ることが重要なので、browser direct DB access ではなく Worker API 経由の read/write を基本にする。

### Auth and permissions

MVP:

- public users は login なしで browse、local artist selection、share link open ができる
- admin users は Better Auth で login
- user event / timetable edits は proposal として保存し、canonical data へ直接 write しない

Later:

- group membership 用に anonymous / lightweight identity を検討
- device をまたいだ plan 保存が必要なら account upgrade を検討

abuse 対策や persistence requirement が強くなるまでは、core attendee flow に login を必須化しない。

### Assets and source files

- event hero images、timetable images、PDFs、source screenshots は R2
- source metadata は `event_sources` に保存
- canonical text fields は storage object ではなく D1 に置く
- upload path は event / source / proposal 単位で namespacing する

### Admin / CMS

Payload CMS は admin 画面と editorial workflow の候補にする。

- event / stage / artist / timetable entry の CRUD
- proposal review queue
- source attachment 管理
- duplicate candidate review
- publish / archive workflow

Payload を Cloudflare Workers runtime に押し込む前提にはしない。CMS runtime、database adapter、deployment target は別途検証し、Fes Route public app の runtime boundary とは分ける。

### Import helpers

MVP の import helpers は unattended crawler ではなく operator tool として扱う。

- admin が ticket-site / official URL を貼る
- Worker が取れる範囲を fetch する
- admin が review / edit してから保存する
- import result には source URL、fetched time、confidence/status を残す

対応 site ごとに、まずは小さい adapter contract にする。

- input URL
- fetched raw metadata
- normalized event candidate
- warnings / missing fields

retry、rate-limit handling、scheduled refresh が必要になった段階で durable queue を入れる。

### Secrets and environment

- Doppler を canonical secret source にする
- Cloudflare binding / secret は runtime deploy に必要な値だけ置く
- local dev は Doppler から `wrangler dev` / app dev command に注入する
- D1 / R2 binding names は env ごとに明示する

secret 管理を GitHub Actions に寄せない。Cloudflare native build と Wrangler deploy に必要な最小限の secret surface にする。

### Deploy / CI

GitHub Actions に頼らず、まずは Cloudflare Workers Builds / Git integration を使う。

- default deploy: Cloudflare Workers Builds
- manual deploy: `wrangler deploy`
- staged deploy: `wrangler versions upload` + `wrangler versions deploy`
- local validation: `npm run check`
- later: typecheck / lint / migration dry-run / smoke test を追加する

Cloudflare native builds で不足する要件が見えた場合だけ、別 SaaS CI を検討する。

## Alternatives considered

### Cloudflare Pages

静的 frontend + lightweight Functions ならよい。ただし Hono RPC、D1、R2、auth、admin workflow を app boundary の中心に置くなら Workers のほうが自然。

### Next.js + Supabase + Vercel

relational workflow と preview deploy は強い。ただし今回の方針では Cloudflare hosting / D1 / R2 / Wrangler を優先し、GitHub Actions 依存も減らしたい。Cloudflare platform に寄せるほうが一貫性が高い。

### Keep Vanilla JS + Node Server

prototype にはよい。ただし persistent plans、admin auth、proposal review、relational data が入ると保守コストが高くなる。

### Vite SPA + D1 direct-ish API

構築は速いが、API contract と validation が散らばりやすい。Hono RPC を入れて server route を canonical contract にする。

### Rails / Laravel

admin CRUD と relational data には強いが、Cloudflare-first hosting と mobile-first frontend iteration の前提から外れる。

## Phasing

### Phase 1: Cloudflare foundation

- prototype を React + Vite + TypeScript に移す
- Workers + Hono の app shell を作る
- Hono RPC client を frontend に接続する
- D1 migrations を追加する
- R2 binding と source attachment model を追加する
- Better Auth の admin login boundary を作る

### Phase 2: Durable MVP

- events、stages、artists、timetable entries、plans、sources の schema を固める
- public event page、personal route planner、share page を実装する
- admin input は basic でよいが persistent にする
- Cloudflare Workers Builds で deploy する

### Phase 3: Group and proposals

- group invitations と member display names を追加する
- group comparison views を追加する
- user-submitted event / timetable proposals を追加する
- admin proposal review queue を追加する

### Phase 4: Import Assist / CMS

- ticket-site / official-site URL import adapters を追加する
- source images / PDFs の attachment storage を追加する
- duplicate candidate review を追加する
- Payload CMS の admin runtime と integration を検証する
- manual fetch が不安定になった場合だけ queue / scheduled refresh を追加する

## Revisit triggers

次の条件が出たら技術選定を見直す。

- D1 の query / migration / size limits が product growth を邪魔する
- Payload CMS runtime を別 deploy unit にしても運用が重い
- offline use が hard requirement になる
- import jobs が app runtime の中心になる
- native push notifications が必要になる
- 複数の non-web clients が versioned API を必要とする

## References

- Cloudflare Wrangler: https://developers.cloudflare.com/workers/wrangler/
- Cloudflare Workers Static Assets: https://developers.cloudflare.com/workers/static-assets/
- Cloudflare Workers Builds: https://developers.cloudflare.com/workers/ci-cd/builds/
- Cloudflare Workers GitHub integration: https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/
- Cloudflare Workers versions and deployments: https://developers.cloudflare.com/workers/configuration/versions-and-deployments/
- Hono Stacks: https://hono.dev/docs/concepts/stacks
