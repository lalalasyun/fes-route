# Technology Selection

決定日: 2026-06-20

## Status

現在の MVP prototype は **vanilla JS + static assets + local Node server** を維持する。
タイムテーブル表示、選択、URL hash share、グループ比較、衝突表示の挙動確認を優先し、
既存 prototype の runtime をこの docs 変更では置き換えない。

本実装へ進む段階では、**Cloudflare Workers / Workers Static Assets を中心にした
lightweight full-stack TypeScript app** を第一候補にする。ただし現時点では実装済み
決定ではなく、frontend / backend / database / auth / deployment / import worker を
揃えるための技術仮説として扱う。

## Recommended stack hypothesis

- frontend: React + Vite + TypeScript
- styling: project-owned design tokens, with Tailwind CSS / shadcn/ui as candidates
- runtime / hosting: Cloudflare Workers
- static assets: Cloudflare Workers Static Assets
- API framework: Hono
- API contract: Hono RPC (`hc`) or equivalent typed client
- validation: Zod + `@hono/zod-validator`
- database: Cloudflare D1
- object storage: Cloudflare R2
- auth: public attendee flow without login; Better Auth as an admin auth candidate
- admin / CMS: lightweight custom admin first; Payload CMS remains a later candidate
- deployment: Cloudflare Workers Builds / Git integration, plus Wrangler for manual deploys
- import worker: operator-triggered fetch / normalize / review flow, not an unattended crawler

## Frontend

The prototype stays install-light and static-first until durable persistence is needed.
The current vanilla JS implementation is still the fastest way to validate interaction
shape for:

- timetable scanning
- artist selection
- route summary
- share URL behavior
- group comparison
- theme token direction

When the app needs persistent data, admin screens, and a typed API boundary, migrate
incrementally to React + Vite + TypeScript rather than rewriting every feature at once.
The route planner, mobile tray, theme switcher, and group comparison can remain
client-side interactions, with the API used for canonical event data and saved plans.

Theme differences should stay in project-owned tokens. `pop / standard / rock` must
share layout, state meaning, and accessibility behavior.

## Backend / API

Cloudflare Workers + Hono is the preferred backend hypothesis because Fes Route needs
a small public API, admin mutations, share page resolution, and import assistance
without a large server footprint.

The first backend boundary should separate:

- public read API for events, stages, artists, and timetable entries
- public share API using opaque `shareId` values instead of internal numeric IDs
- admin mutation API for canonical writes
- proposal API for user-submitted event / timetable edits
- import helper API for operator-triggered source fetching

Hono RPC or an equivalent typed client should keep frontend and backend contracts close
enough for agent-driven implementation without duplicating API shapes by hand.

## Database

Cloudflare D1 is the first database candidate for the durable MVP.

Reasons:

- Fes Route data is relational but initially small.
- `events`, `artists`, `stages`, `timetable_entries`, `event_sources`,
  `event_proposals`, `user_plans`, and `plan_entries` map naturally to SQL tables.
- Migrations can live in the repo and be reviewed with normal PR flow.
- Duplicate prevention can use unique constraints plus review-time merge rules.

The canonical model in `docs/data-model.md` remains the source of truth for entities,
relations, and duplicate-prevention rules. If D1 limits become product blockers,
Postgres should be reconsidered before adding complex workarounds.

## Auth and permissions

The attendee MVP should not require login.

Allowed without login:

- browsing event timetables
- selecting artists locally
- opening share URLs
- comparing group plans through share / invite links

Authentication is needed first for admin work:

- event and timetable editing
- proposal review
- duplicate merge decisions
- import helper execution

Better Auth is a candidate for this admin boundary. Registered attendee accounts can
be revisited only when cross-device plan persistence or richer group membership
becomes a clear product requirement.

## Storage and source files

R2 is the first object-storage candidate for files that should not live in SQL:

- event hero images
- timetable images
- PDFs
- source screenshots
- raw source snapshots when useful for review

Canonical text fields should stay in D1. Stored objects should be referenced through
`event_sources` or related records, with event / source / proposal namespaces.

## Deployment

The deployment hypothesis is Cloudflare-first:

- Workers Static Assets serves the frontend assets.
- Worker routes handle `/api/*`, auth, admin mutations, and import helper actions.
- Cloudflare Workers Builds / Git integration is the default deploy path.
- Wrangler remains the manual deploy and environment-management tool.

This repo does not require GitHub Actions for the first deployment path. Add external
CI only when the local and Cloudflare-native gates are not enough.

## Import worker

The initial import helper should be an operator tool, not an unattended crawler.

Flow:

1. Admin pastes a ticketing, official site, X, image, or PDF source URL.
2. Backend fetches what it can within platform and source constraints.
3. The result is normalized into an event / timetable candidate.
4. Admin reviews, edits, and explicitly accepts before canonical data changes.
5. Source URL, fetched time, confidence, warnings, and raw attachment references are stored.

Each supported source should use a small adapter contract:

- input URL
- fetched metadata or attachment
- normalized event candidate
- warnings / missing fields
- source provenance

Queues, scheduled refresh, and retry orchestration are later concerns. Add them only
after manual import assistance proves valuable and rate-limit behavior is understood.

## Operations workflow

Repo work is tracked through GitHub Issues / PRs and delegated through Hermes to the
`agent` workspace. OpenClaw is the Discord intake / bridge, not the repo editor.

This decision intentionally does not adopt the older Linear Project `main`,
`LINEAR_API_KEY`, OpenAI Symphony binary, or OpenClaw-owned `CODEX_HOME` runner
direction from PR #18 / Issue #19. The current workflow remains:

- GitHub Issue is the product / engineering work item.
- Hermes Kanban task delegates coding to `agent`.
- `agent` works under `/home/agent/workspace/fes-route`.
- Validation, commit, push, and PR creation happen from the repo workspace.
- `WORKFLOW.md`, `docs/symphony-guide.md`, and `scripts/symphony-validate.sh`
  define the repo-local contract.

## Alternatives considered

### Keep vanilla JS + local server long-term

Good for prototype validation. It becomes weak once persistent plans, admin auth,
proposal review, and import assistance need a durable API and data model.

### Cloudflare Pages only

Good for static frontend plus light Functions. Workers Static Assets keeps the same
static-first feel while making the Worker the clear API / auth / import boundary.

### Next.js + Supabase + Vercel

Strong default for many relational apps. For this repo, the current hypothesis prefers
Cloudflare hosting, D1, R2, and Wrangler to keep deployment and data services on one
platform.

### Payload CMS as the first admin surface

Useful if editorial workflows become the largest problem. For the MVP, a small custom
admin and review queue is likely cheaper to ship. Payload remains a later candidate
rather than a first implementation dependency.

### Linear / Symphony runner migration

Not adopted. It conflicts with the current GitHub Issue + Hermes/agent delegation
workflow and would move repo work back toward older runner assumptions.

## Phasing

### Phase 0: Prototype

- Keep vanilla JS / static-first app behavior.
- Use local server only for serving the prototype.
- Continue documenting domain model, screens, themes, and backlog in repo docs.

### Phase 1: Durable foundation

- Add TypeScript app structure when persistence work starts.
- Introduce Workers + Hono API boundary.
- Add D1 migrations for canonical data.
- Add R2 binding for source attachments.
- Add admin auth boundary.

### Phase 2: Durable MVP

- Persist events, stages, artists, timetable entries, plans, and sources.
- Implement public event pages and share pages against the API.
- Add basic admin event / timetable editing.
- Add proposal storage and review states.
- Deploy through Cloudflare Workers Builds / Wrangler.

### Phase 3: Import assist and group depth

- Add ticket-site / official-site source adapters incrementally.
- Store import provenance and warnings.
- Add duplicate candidate review.
- Expand group comparison and invite flows.

## Revisit triggers

Revisit this selection if:

- D1 query, migration, or size limits block expected product growth.
- Import jobs become frequent background workloads rather than operator-triggered actions.
- Offline use becomes a hard requirement.
- Admin review workflows outgrow a lightweight custom admin.
- Native apps or multiple clients require a versioned public API.
- Cloudflare-native deployment no longer covers required validation or release controls.
