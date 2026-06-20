# Fes Route Workflow

This repo uses GitHub repo-first work tracking with Hermes/agent delegation.
OpenClaw is the Discord intake / bridge only. It does not edit this repo or run
Codex for repo work from an OpenClaw workspace.

Operational contract:

- OpenClaw is only the Discord intake / bridge. Do not edit this repo from an
  OpenClaw workspace, and do not read or copy OpenClaw credentials, sessions,
  auth profiles, or private workspace paths into repo artifacts.
- Hermes delegates coding tasks to the `agent` user. The normal checkout is
  `/home/agent/workspace/fes-route`.
- Before editing, read repo instructions (`AGENTS.md`, `CLAUDE.md`, docs, and
  validation scripts when present) and run `git status --short --branch`.
- Create a branch from `main`; never commit directly to `main`. When updating an
  existing PR, use that PR's head branch.
- Keep changes scoped to the issue. For code / docs / config changes, run the
  repo validation gate, commit, push, and create or update a PR.
- PR bodies must include Summary, What changed, Validation, and
  Risks / follow-ups.
- If blocked, write the blocker and the minimum confirmation needed to
  `result.md`.
- Final `result.md` must include run_id, workspace, branch, PR URL, validation
  run, and residual risks.

Validation gate:

```bash
./scripts/validate-workflow.sh
```

For this repo, coding tasks should be traceable across the originating Discord
thread, GitHub Issue, Hermes Kanban task, and PR.
