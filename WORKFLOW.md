---
tracker:
  kind: github
  repo: lalalasyun/fes-route
  project_number: 8
  status_field: Status
  active_states:
    - Todo
    - Pending
    - In Progress
  terminal_states:
    - Done
workspace:
  root: /home/agent/workspace/fes-route-runs
hooks:
  after_create: |
    git clone https://github.com/lalalasyun/fes-route.git .
    git checkout main
    git checkout -b hermes/issue-$SYMPHONY_ISSUE_NUMBER
polling:
  interval_ms: 30000
agent:
  max_concurrent_agents: 1
codex:
  model: gpt-5.4
  approval_policy: never
  thread_sandbox: danger-full-access
---
You are working in the Fes Route repo for GitHub Issue {{issue.identifier}}.

Issue: {{issue.title}}
URL: {{issue.url}}
Labels: {{issue.labels}}

Use the repository-local instructions and skills.

Operational contract:

- OpenClaw is only the Discord intake / bridge. Do not edit this repo from an
  OpenClaw workspace, and do not read or copy OpenClaw credentials, sessions,
  auth profiles, or private workspace paths into repo artifacts.
- Hermes delegates coding tasks to the `agent` user. The normal checkout is
  `/home/agent/workspace/fes-route`; runner-created workspaces must also be
  agent-owned and stay under `/home/agent/workspace`.
- Before editing, read repo instructions (`AGENTS.md`, `CLAUDE.md`, docs, and
  validation scripts when present) and run `git status --short --branch`.
- Create a branch from `main`; never commit directly to `main`.
- Keep changes scoped to the issue. For code / docs / config changes, run the
  repo validation gate, commit, push, and create or update a PR.
- PR bodies must include Summary, What changed, Validation, and
  Risks / follow-ups.
- If blocked, write the blocker and the minimum confirmation needed to
  `result.md`.
- Final `result.md` must include run_id, workspace, branch, PR URL, validation
  run, and residual risks.

Issue body:

{{issue.description}}
