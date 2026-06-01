# Technology Selection

決定日: 2026-06-02

## 推奨構成

本実装は、小さめの full-stack TypeScript web app として作る。

- app framework: Next.js App Router + React + TypeScript
- styling: CSS modules または Tailwind CSS + project-owned design tokens
- database: Supabase Postgres
- auth: Supabase Auth、初期は admin のみ
- storage: Supabase Storage、event image / timetable image / source attachment 用
- schema / migrations: Drizzle ORM + Drizzle migrations
- deployment: web app は Vercel、database/auth/storage は Supabase
- background work: 初期は admin-triggered server job。import adapter に retry が必要になってから queue を入れる

現在の vanilla JS prototype は挙動確認用として残し、本格実装は persistent plan、admin review、ticket-site import helper を入れる前にこの構成へ移す。

## Fes Route に合う理由

Fes Route は mobile web が主導線で、domain は小さいが relational。中心は events、stages、artists、timetable entries、user plans、groups、proposals、sources。難所は独自 infrastructure ではなく、データ品質、共有、admin workflow。

Next.js は public pages、shared plan pages、admin screens、server-side mutations を1つの app に置ける。App Router は server-rendered routes と client islands を併用できるので、読み物に近い timetable page と、操作が多い route planner を分けやすい。

Supabase Postgres は document store より canonical event model に合う。duplicate prevention、proposal review、timetable join、share token、group comparison は relational constraints と index の恩恵が大きい。

Drizzle は schema を repo に明示できる。既存 docs も relational な model として整理されているので、migration も code と同じように review できる形がよい。

Vercel は UI-heavy な iteration の preview deploy が軽い。Next.js の convention とも合い、product shape が動いている間の deploy surface を小さくできる。

## Stack details

### Frontend

- Next.js App Router
- event / timetable reads は React Server Components
- timetable selection、route tray、theme switcher、group comparison interactions は Client Components
- TypeScript everywhere
- まずは install-free な mobile web app。offline / 当日利用が重要になったら PWA を検討する

Tailwind でも CSS modules でも、design tokens は project-owned にする。`pop / standard / rock` themes は別 component tree ではなく token 差分に閉じ込める。

### Backend

- API-style endpoints は Next.js Route Handlers
- admin forms や単純な mutation は、UI が簡単になる範囲で Server Actions
- canonical writes は server-only DB access
- public share pages は internal numeric ID ではなく opaque `shareId` で解決する

次のどれかが出るまでは、独立 API service は作らない。

- ticket-site import に long-running retry が必要
- 複数 client が stable external API を必要とする
- web app deploy が重い background work と結合してつらくなる

### Database

- Supabase Postgres
- Drizzle schema / migrations を repo に置く
- public entities は stable slug
- share links / invitations は opaque token
- duplicate prevention は unique constraints を使う。特に event source URL、event date / venue / name candidate、timetable entry identity

exposed schema は RLS を有効にする。MVP では server-side code 経由の read が中心でも、RLS policy を置いておくと defense in depth になり、将来の accidental broad client access を防ぎやすい。

### Auth and permissions

MVP:

- public users は login なしで browse、local artist selection、share link open ができる
- admin users は Supabase Auth で login
- user event / timetable edits は proposal として保存し、canonical data へ直接 write しない

Later:

- group membership 用に anonymous / lightweight identity を検討
- device をまたいだ plan 保存が必要なら account upgrade を検討

abuse 対策や persistence requirement が強くなるまでは、core attendee flow に login を必須化しない。

### Assets and source files

- event hero images、timetable images、PDFs、source screenshots は Supabase Storage
- source metadata は `event_sources` に保存
- canonical text fields は storage object ではなく Postgres に置く

### Import helpers

MVP の import helpers は unattended crawler ではなく operator tool として扱う。

- admin が ticket-site / official URL を貼る
- server が取れる範囲を fetch する
- admin が review / edit してから保存する
- import result には source URL、fetched time、confidence/status を残す

対応 site ごとに、まずは小さい adapter contract にする。

- input URL
- fetched raw metadata
- normalized event candidate
- warnings / missing fields

retry、rate-limit handling、scheduled refresh が必要になった段階で durable queue を入れる。

## Alternatives considered

### Keep Vanilla JS + Node Server

prototype にはよい。ただし persistent plans、admin auth、proposal review、relational data が入ると保守コストが高くなる。

### Vite SPA + Supabase Direct Client

構築は速いが、初日から browser-facing RLS に permission logic を寄せすぎる。Fes Route は admin / proposal workflow があるので、server-side boundary を持つ価値がある。

### Rails / Laravel

admin CRUD と relational data には強いが、mobile-first timetable UI を頻繁に磨く段階ではやや重い。

### Cloudflare Workers + D1

edge cost と simple hosting は魅力。ただしこの product では edge-first runtime constraints より、Postgres、storage、auth、成熟した relational workflow の恩恵が大きい。

## Phasing

### Phase 1: Durable MVP

- prototype を Next.js + TypeScript に移す
- events、stages、artists、timetable entries、plans、sources の Drizzle schema を追加
- Supabase project と migrations を追加
- public event page、personal route planner、share page を実装
- admin input は basic でよいが persistent にする

### Phase 2: Group and proposals

- group invitations と member display names を追加
- group comparison views を追加
- user-submitted event / timetable proposals を追加
- admin proposal review queue を追加

### Phase 3: Import Assist

- ticket-site / official-site URL import adapters を追加
- source images / PDFs の attachment storage を追加
- duplicate candidate review を追加
- manual fetch が不安定になった場合だけ queue / scheduled refresh を追加

## Revisit triggers

次の条件が出たら技術選定を見直す。

- offline use が hard requirement になる
- import jobs が app runtime の中心になる
- native push notifications が必要になる
- database cost / limits が見える
- 複数の non-web clients が versioned API を必要とする

## References

- Next.js App Router: https://nextjs.org/docs/app
- Next.js backend-for-frontend guide: https://nextjs.org/docs/app/guides/backend-for-frontend
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Drizzle migrations: https://orm.drizzle.team/docs/migrations
- Vercel deployments: https://vercel.com/docs/deployments/deployment-methods
