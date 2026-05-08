# Product Repo Template

A flexible template for starting new product repositories from a short idea.

## What this template optimizes for

- Fast repo creation from vague ideas
- Low-ceremony product planning
- Works for many product shapes: web app, API, CLI, bot, library, automation, research, full-stack
- Lets you start generic, then add structure only when needed

## Core files

- `docs/brief.md` — one-page product brief
- `docs/scope.md` — MVP and non-goals
- `docs/architecture.md` — technical shape
- `docs/backlog.md` — next tasks and milestones
- `docs/adr/` — architecture decision records

## Optional structure bootstrap

Use the helper script when you know the rough product shape:

```bash
bash scripts/bootstrap-structure.sh generic
bash scripts/bootstrap-structure.sh webapp
bash scripts/bootstrap-structure.sh api
bash scripts/bootstrap-structure.sh cli
bash scripts/bootstrap-structure.sh bot
bash scripts/bootstrap-structure.sh library
bash scripts/bootstrap-structure.sh fullstack
bash scripts/bootstrap-structure.sh research
```

The script only creates missing directories/files and is safe to run early.

## Suggested workflow

1. Rename the product in `README.md` and `docs/brief.md`
2. Fill in MVP / user / constraints
3. Run `scripts/bootstrap-structure.sh <mode>` if helpful
4. Start implementation only after `docs/scope.md` is minimally clear
