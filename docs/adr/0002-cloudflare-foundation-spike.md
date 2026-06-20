# ADR 0002: Cloudflare durable foundation spike

Date: 2026-06-21

## Status

Proposed for the durable MVP. This ADR does not migrate the current vanilla JS
prototype runtime.

## Context

Prototype hardening should finish before the app commits to durable persistence.
The durable stack still needs a reviewed foundation for:

- React + Vite + TypeScript served as Workers Static Assets.
- Hono API routes in the same Worker boundary.
- D1 tables for canonical event, timetable, proposal, and share plan data.
- R2 source attachments referenced from canonical event sources.
- Admin-only auth for canonical mutation, proposal review, and import helper routes.
- Migration from hash-only `plan` URLs to opaque `shareId` bearer URLs.

Official docs checked on 2026-06-21:

- Cloudflare Workers Static Assets supports serving uploaded HTML/CSS/images
  through a Worker and recommends the Cloudflare Vite plugin for a React SPA
  plus API Worker setup.
- The Cloudflare Vite plugin runs Worker code inside `workerd` during local
  development, which keeps dev behavior close to production.
- Cloudflare D1 docs cover local/remote migrations, CLI schema execution, Worker
  bindings, and programmatic queries.
- Cloudflare R2 docs expose buckets to Workers through bindings; attachments
  should be accessed by binding rather than through long-lived credentials.
- Hono has first-class Cloudflare Workers examples and is small enough for the
  intended public/admin route split.
- Better Auth has Cloudflare/Hono examples, but it remains the riskiest part for
  an admin-only boundary because session storage, migrations, and any password
  hashing choices must be proven in Workers constraints.

## Decision

Keep the current prototype as vanilla JS/static assets for this PR. For the next
durable foundation PR, use this target shape:

```text
app/
  src/ React + Vite + TypeScript client
worker/
  index.ts Hono app
  routes/public.ts
  routes/admin.ts
migrations/d1/
  0001_foundation.sql
wrangler.jsonc
```

Worker bindings:

- `DB`: D1 database for canonical data and saved plans.
- `SOURCE_ATTACHMENTS`: R2 bucket for timetable images, PDFs, screenshots, and
  fetched source snapshots.

Route boundary:

- `GET /api/events/:eventId`: public event/timetable read.
- `POST /api/plans`: anonymous share plan creation, returns `shareId`.
- `GET /api/plans/:shareId`: public bearer URL plan read.
- `POST /api/proposals`: public user proposal submission.
- `/api/admin/*`: auth-required canonical mutations, proposal review, duplicate
  merge, and import helper execution.

## Proof Artifacts

`migrations/d1/0001_foundation.sql` is included as a schema skeleton only. It is
not wired into `package.json` or the runtime. The skeleton validates that the
current `docs/data-model.md` entities map cleanly to D1 tables and unique
constraints.

Suggested future commands for a dedicated durable foundation branch:

```bash
npm create cloudflare@latest -- fes-route-durable --framework=react
npm install hono @hono/zod-validator zod
npx wrangler d1 create fes-route
npx wrangler d1 migrations apply fes-route --local
npx wrangler r2 bucket create fes-route-source-attachments
npm run build
npx wrangler dev
```

## ShareId Migration Notes

- Use an opaque random `shareId`, not selected timetable IDs or incremental IDs.
- Treat public plan URLs as bearer URLs. Anyone with the link can read the plan.
- Keep hash-only import compatible during transition:
  `#event=...&plan=...&theme=...` can open locally and optionally POST to
  `/api/plans` to create a durable `shareId`.
- Store `expiresAt` or `deletedAt` on `user_plans` so deletion/expiry can be
  introduced without changing URL shape.
- Preserve theme separately on `user_plans` so shared views can match the sender
  without changing selected route state.

## Risks / Follow-ups

- Better Auth should be proven with the exact admin-only flows before becoming a
  hard dependency. If it is too heavy, start with a small admin session table,
  signed secure cookies, and Cloudflare Access or a single operator login as a
  fallback.
- D1 is a strong fit for the initial relational model, but import history or
  high-write collaboration could later require queues or another database.
- R2 object keys need a reviewable namespace, for example
  `events/{eventId}/sources/{sourceId}/{filename}`.
- This ADR does not add deploy config or replace `server.mjs`.
